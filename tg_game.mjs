//**************************************************************/
// tg_game.mjs (REAL-TIME VERSION)
// 2 player tank game using PeerJS & Firebase
// Updated for real-time syncing of tank movement and firing
// Written by mr Bob, Term 2 2025
/**************************************************************/
const COL_C = 'black';
const COL_B = '#F0E68C';
console.log('%c tg_game.mjs (REAL-TIME)', 'color: blue; background-color: white;');

/**************************************************************/
// Trap errors
/**************************************************************/
window.addEventListener('error', (event) => {
  console.error('❌ Uncaught Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled Promise Rejection:', event.reason);
});

/**************************************************************/
// Import all external constants & functions requiLightGray
/**************************************************************/
/*
import { Peer } 
  from "https://cdn.jsdelivr.net/npm/peerjs@1.3.2/dist/peerjs.min.js";
import { Canvas, Sprite, Group, loadImage, background, width, height, mouse } 
  from "https://cdn.jsdelivr.net/npm/p5@1.4.1/lib/p5.min.js";
*/

import { ref, set, get }
  from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

import { FB_GAMEDB, fb_userDetails, fb_initialise, fb_changeAuth, fb_onDisconnect }
  from './fb_io.mjs';

// PeerJS variables
const TG_PEER = new Peer();
TG_PEER.on('error', (err) => {
  console.error('❌ TG_PEER.on("error"): ' + err);
  alert('PeerJS Error: ' + err);
});

const TG_UPDATE_TIME  = 50;
let tg_conn           = null;
let tg_isInitiator    = false;
let tg_connection     = { id: 'n/a', 
                          p1_gameName: 'n/a',
                          p2_gameName: 'n/a'
};

// Get HTML elements
const TG_ENTER        = document.getElementById('b_enter');
const TG_PLAYER_1     = document.getElementById('b_player_1');
const TG_PLAYER_2     = document.getElementById('b_player_2');
const TG_RESTART      = document.getElementById('b_restart');

const TG_BODY         = document.getElementById('body');
const TG_H_PLAYER     = document.getElementById('h_player');
const TG_H_RESULT     = document.getElementById('h_result');
const TG_I_LOBBY_KEY  = document.getElementById('i_lobby_key');
const TG_P_YOUR_NAME  = document.getElementById('p_your_name');
const TG_P_OTHER_NAME = document.getElementById('p_other_name');
const TG_P_MY_ID      = document.getElementById('p_my_id');
const TG_P_OTHER_ID   = document.getElementById('p_other_id');

// Connect to firebase & retirieve sessionStorage data
const TG_LOBBY = 'lobby/tg';
fb_initialise();
fb_changeAuth();
fb_userDetails.gameName    = sessionStorage.getItem('gameName') || 'unregistered';
fb_userDetails.uid         = sessionStorage.getItem('uid') || 'n/a';
fb_userDetails.photoURL    = sessionStorage.getItem('photoURL');
tg_connection.p1_gameName  = fb_userDetails.gameName;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('img_photoURL').src = fb_userDetails.photoURL || './assets/dtec_favicon.PNG';
  TG_P_YOUR_NAME.textContent = fb_userDetails.gameName;
});

// Tank game variables
let tg_game_id         = 'n/a'; // Game ID for the lobby
let tg_gameArea;
let tg_gameActive      = false;
let tg_playerNum       = 'not set';
let tg_other_playerNum = 'not set';
let tg_wallGroup;
let tg_tankGroup, tg_roundGroup;
let tg_p1round, tg_p2round;
let tg_result;

let tg_tankSettings = [
  { name: 'Centurian', 
    x: 100, y: 0, w: 50, h: 20, rotation: 0,
    vel: 2, rotationSpeed: 1.25, shellSpeed: 5, 
    canFire: true, roundInterval: 1000, roundSize:5,
    img: 'n/a' },
  { name: 'Sherman',   
    x: 100, y: 0, w: 50, h: 20, rotation: 180, 
    vel: 2, rotationSpeed: 1.25, shellSpeed: 5,
    canFire: true, roundInterval: 1000, roundSize:5,
    img: 'n/a' }
];

/**************************************************************/
// preload()
// Preloads tank images before setup()
/**************************************************************/
window.preload = function () {
  console.log('%c preload(): ',
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  tg_tankSettings[0].img = loadImage('./assets/green_tank.png');
  tg_tankSettings[1].img = loadImage('./assets/grey_tank.png');
};

/**************************************************************/
// setup()
/**************************************************************/
window.setup = function () {
  console.log('%c setup(): ',
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  const tg_autoCanvas = document.getElementById('defaultCanvas0');
  if (tg_autoCanvas) tg_autoCanvas.remove();

  let tg_cnvPos = document.getElementById("d_canvasPlaceHolder");
  tg_gameArea   = new Canvas(tg_cnvPos.offsetWidth, tg_cnvPos.offsetHeight - 1);
  let tg_cnv    = document.getElementById('defaultCanvas0');
  tg_cnv.style.position = "absolute";
  tg_cnv.style.left = tg_cnvPos.offsetLeft + 'px';
  tg_cnv.style.top  = tg_cnvPos.offsetTop + 'px';

  tg_tankSettings[1].x = width - tg_tankSettings[1].w - tg_tankSettings[1].x; // tank on RH side
  tg_tankGroup    = new Group();
  tg_createTanks(0);
  tg_createTanks(1);
  tg_roundGroup   = new Group(); 

  tg_createWalls();
};

/**************************************************************/
// draw()
// Updates the game frame every cycle
/**************************************************************/
window.draw = function () {
  background("LightGray");

  if (tg_gameActive) { 
    tg_roundGroup.collides(tg_wallGroup, (tg_round, wall) => {
      tg_round.remove();
    });
    tg_roundGroup.collides(tg_tankGroup[tg_other_playerNum], (tg_round, tank) => {
      console.log('%c tg_roundGroup.collides(): round hit tank= ' + tank.name,
                  'color: ' + COL_C + '; background-color: ' + COL_B + ';');
      tg_round.remove();
  
      if (tank.name === tg_tankGroup[tg_playerNum].name) {
        tg_result = 'own';
      } else {
        tg_result = 'other';
      }
      tg_handleTankHit(tank, tg_result); // Handle tank hit
    }); 
  
    tg_keyInput();
  }

  allSprites.debug = mouse.pressing();
};

/**************************************************************/
// tg_createTanks(_playerNum)
// Creates a tank sprite for a player
// Input: tank group index number (0 or 1)
// Return: the created Sprite object
/**************************************************************/
function tg_createTanks(_playerNum) {
  console.log('%c tg_createTanks(): for player= ' + _playerNum,
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  tg_tankSettings[_playerNum].y = height / 2 - tg_tankSettings[_playerNum].h / 2;
  let tg_tankSprite = new Sprite(tg_tankSettings[_playerNum].x, tg_tankSettings[_playerNum].y, 
                                 tg_tankSettings[_playerNum].w, tg_tankSettings[_playerNum].h);
                        
  tg_tankSettings[_playerNum].img.resize(tg_tankSettings[_playerNum].w, 
                                         tg_tankSettings[_playerNum].h);
  tg_tankSprite.rotation = tg_tankSettings[_playerNum].rotation;
  tg_tankSprite.image    = tg_tankSettings[_playerNum].img;
  tg_tankSprite.name     = tg_tankSettings[_playerNum].name;

  tg_tankGroup.add(tg_tankSprite);

  return tg_tankSprite;
}

/**************************************************************/
// tg_createWalls()
// Called by setup
// Create wall sprites
// Input:  n/a
// Return: n/a
/**************************************************************/
function tg_createWalls() {
  console.log('%c tg_createWalls: ',
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  tg_wallGroup = new Group();
  
  let wallLH  = new tg_wallGroup.Sprite(2,         height / 2,     4, height, 'K');
  let wallRH  = new tg_wallGroup.Sprite(width-2,   height / 2,     4, height, 'K');
  let wallTP  = new tg_wallGroup.Sprite(width / 2,          2, width,      4, 'K');
  let wallBT  = new tg_wallGroup.Sprite(width / 2,   height-2, width,      4, 'K');
  tg_wallGroup.color = 'black'; 

  wallTP.overlap(wallLH);
  wallTP.overlap(wallRH);
  wallBT.overlap(wallLH);
  wallBT.overlap(wallRH);
}

/**************************************************************/
// tg_keyInput()
// Called by draw()
// Handles this players tank movement & fire keys
// Input:  n/a
// Return: n/a
/**************************************************************/
function tg_keyInput() {
  //console.log('%c tg_keyInput(): ', 
  //            'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  const TG_SPEED     = tg_tankSettings[tg_playerNum].vel;
  let tg_setRotation = tg_tankSettings[tg_playerNum].rotationSpeed;  
  let tg_setSpeed    = 0; // Default speed is 0

  // Detect forward & reverse
  if (kb.pressing('w')) {
    tg_setSpeed = TG_SPEED;
  }
  else if ((kb.pressing("s"))) {
    tg_setSpeed = -TG_SPEED;
  }
  // No key input so reset tank TG_SPEED to 0
  else {
    tg_setSpeed = 0;
  }

  // Detect turning
  if (kb.pressing("a")) {
    tg_tankGroup[tg_playerNum].rotation = tg_tankGroup[tg_playerNum].rotation - tg_setRotation;
  }

  if (kb.pressing("d")) {
    tg_tankGroup[tg_playerNum].rotation = tg_tankGroup[tg_playerNum].rotation + tg_setRotation;
  }
  
  // Move sprite in direction of the sprite is pointing at
  tg_tankGroup[tg_playerNum].rotationSpeed = 0;
  tg_tankGroup[tg_playerNum].direction     = tg_tankGroup[tg_playerNum].rotation;
  tg_tankGroup[tg_playerNum].speed         = tg_setSpeed;

  /*+++++++++++++++++++++++++++++++++++++++++++++++++++*/
  // Detect firing of rounds
  /*+++++++++++++++++++++++++++++++++++++++++++++++++++*/
  if (kb.pressing('e')) {
    tg_fireTankRound(tg_playerNum, 'e');
    if (tg_conn?.open) {
      tg_conn.send({
        type: "fire",
        playerNum: tg_playerNum,
        x: tg_tankGroup[tg_playerNum].x,
        y: tg_tankGroup[tg_playerNum].y,
        rotation: tg_tankGroup[tg_playerNum].rotation,
      });
    }
  }
}

/**************************************************************/
// tg_fireTankRound(_playerNum, _command)
// Fires a projectile from a player's tank
// Input: player number (0 or 1)
/**************************************************************/
function tg_fireTankRound(_playerNum, _command) {
  console.log('%c tg_fireTankRound(): from player= ' + _playerNum + '  command= ' + _command,
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  if (tg_tankSettings[tg_playerNum].canFire == true) {
    tg_tankSettings[tg_playerNum].canFire = false;
    setTimeout(() => {
      tg_tankSettings[tg_playerNum].canFire = true;
    }, tg_tankSettings[tg_playerNum].roundInterval);

    let tg_round = new tg_roundGroup.Sprite(tg_tankGroup[_playerNum].x + (tg_tankGroup[_playerNum].w / 2 + 0),
                                             tg_tankGroup[_playerNum].y, 
                                             tg_tankSettings[_playerNum].roundSize);
    tg_tankGroup[_playerNum].overlaps(tg_round);
    
    tg_round.friction  = 0;
    tg_round.rotation  = tg_tankGroup[_playerNum].rotation;
    tg_round.direction = tg_round.rotation;
    tg_positionRound(tg_tankGroup[_playerNum], tg_round, _playerNum);
    tg_round.speed     = tg_tankSettings[_playerNum].shellSpeed;
    tg_round.life      = 200;
  }
}

/********************************************************/
// tg_positionRound(_base, _round, _playerNum)
// Called by a tg_keyInput() 
// Calculate rotated position of barrel
// Input:  sprite projectile i fired from, projectile sprite * player num
// Return: n/a
/********************************************************/
function tg_positionRound(_base, _round, _playerNum) {
  console.log('%c tg_positionRound(): at tank= ' + tg_tankGroup[_playerNum].name,
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  let deg = _base.rotation;
  let rads = deg * Math.PI / 180;  // Convert degrees to radians

  let h = _base.w / 2;
  let offsetX  = h * Math.cos(rads);
  let offsetY  = h * Math.sin(rads);
  _round.x = _base.x + offsetX;
  _round.y = _base.y + offsetY;
}

/********************************************************/
// tg_handleTankHit(_tank, _result)
// Called by draw()
// ???
// Input:  tank that fired & either 'own' or other'
// Return: n/a
/********************************************************/
function tg_handleTankHit(tank, _result) {
  console.log('%c tg_handleTankHit(): tank round hit ' + _result + ' tank',
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  TG_BODY.classList.add('youWin');
  TG_H_RESULT.textContent = 'WINS'
  tg_gameActive = false;           
  tg_tankGroup[0].x = tg_tankSettings[0].x;  
  tg_tankGroup[0].y = tg_tankSettings[0].y;
  tg_tankGroup[1].x = tg_tankSettings[1].x;   
  tg_tankGroup[1].y = tg_tankSettings[1].y;

  if (tg_conn?.open) {
    tg_conn.send({
      type: "w",
      playerNum: tg_playerNum,
      x: tg_tankGroup[tg_playerNum].x,
      y: tg_tankGroup[tg_playerNum].y,
      rotation: tg_tankGroup[tg_playerNum].rotation,
    });
  } 
  TG_RESTART.classList.remove('w3-disabled');
}

/**************************************************************/
// setupConnection(_playerNum)
// Called by TG_PEER.on('connection') & tg_connect()
// Starts syncing states and handles input
// Input:  player number
// Return: n/a
/**************************************************************/
function setupConnection(_text) {
  console.log('%c setupConnection(): ' + _text +
              '  tg_tankGroup[tg_playerNum].x/y= ' + tg_tankGroup[tg_playerNum].x + 
              '/' + tg_tankGroup[tg_playerNum].y,
              'color: ' + COL_C + '; background-color: ' + COL_B + ';'); 
  
  TG_P_OTHER_ID.textContent = tg_connection.id;
  // set up event to RECIEVE input from other player
  tg_conn.on('data', tg_handleData);

  // Set timer interval to SEND this player tank data to other player
  setInterval(() => {
    if (tg_conn?.open) {
      tg_conn.send({
        type: "state",
        playerNum: tg_playerNum,
        x: tg_tankGroup[tg_playerNum].x,
        y: tg_tankGroup[tg_playerNum].y,
        rotation: tg_tankGroup[tg_playerNum].rotation
      });
    }
  }, TG_UPDATE_TIME);
}

/**************************************************************/
// tg_handleData(_data)
// Event recieve input data - setup by setupConnection()
// Applies incoming peer data from other player
// Input:  object containing peer updates, Type can be:
//          'state' for tank data, 'fire' for tank round data
//           or 'w' other player won
// Return: n/a
/**************************************************************/
function tg_handleData(_data) {
  if (_data.type === 'state') {
    if (_data.playerNum !== tg_playerNum) {
      tg_tankGroup[tg_other_playerNum].x = _data.x;
      tg_tankGroup[tg_other_playerNum].y = _data.y;
      tg_tankGroup[tg_other_playerNum].rotation = _data.rotation;
    }
  } else if (_data.type === 'fire') {
    if (_data.playerNum !== tg_playerNum) {
      tg_tankGroup[tg_other_playerNum].x = _data.x;
      tg_tankGroup[tg_other_playerNum].y = _data.y;
      tg_tankGroup[tg_other_playerNum].rotation = _data.rotation;
      tg_fireTankRound(_data.playerNum, 'peer');
    }
  }
  else if (_data.type === 'w') {
    TG_BODY.classList.add('youLost');
    TG_H_RESULT.textContent = 'LOSES'
    TG_RESTART.classList.remove('w3-disabled');
    tg_gameActive = false;       
    tg_roundGroup.removeAll();   
    tg_tankGroup[0].x = tg_tankSettings[0].x;  
    tg_tankGroup[0].y = tg_tankSettings[0].y;
    tg_tankGroup[1].x = tg_tankSettings[1].x;   
    tg_tankGroup[1].y = tg_tankSettings[1].y;
  }
}

/*############################################################*/
// PeerJS code
/*############################################################*/
/**************************************************************/
// TG_PEER.on('open')
// Event when the peer connection is opened
// PLAYER-1 & 2 sets up peer ID, updates the UI & waits for user
/**************************************************************/
TG_PEER.on('open', _id => {
  console.log('%c TG_PEER.on("open"): id= ' + _id,
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  TG_P_MY_ID.textContent = _id;
  tg_connection.id = _id;
});

/**************************************************************/
// TG_PEER.on('connection')
// Event when PLAYER-1 recieves a connection request from PLAYER-2
// Setup the interval based tank data transmission to PLAYER-2
/**************************************************************/
TG_PEER.on('connection', _incoming => {
  const TG_META = _incoming.metadata;
  console.log('%c TG_PEER.on("connection"): incoming= ' + 
              _incoming.type + ' from player ' + TG_META.playerNum,
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  TG_P_OTHER_NAME.textContent = TG_META.gameName;        
  tg_conn = _incoming;
  tg_conn.on('error', (err) => {
    console.error('❌ incoming tg_conn.on("error"): ' + err);
    alert('Incoming connection error: ' + err);
  });
  
  tg_conn.on('close', () => {
    console.log('%c⚠️ tg_conn.on("close"): Connection with other player closed',
                'color: ' + COL_C + '; background-color: ' + COL_B + ';');
    alert('The other player has disconnected.');
  
    // Optional: Reset UI or game state
    tg_gameActive = false;
    TG_H_RESULT.textContent = 'Disconnected';
    TG_BODY.classList.add('youLost'); // or a different class
    TG_RESTART.classList.remove('w3-disabled');
  });
  
  tg_isInitiator = false;
  tg_conn.on('open', () => {
    setupConnection('PLAYER-1 recieves a connection request from PLAYER-2');
  });
});

/**************************************************************/
// TG_ENTER.onclick()
// Event when user clicks the html ENTER button
// Saves game id and activates PLAYER-1 / 2 BUTTONS
/**************************************************************/
TG_ENTER.onclick = () => {
  console.log('%c ENTER: ',
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  tg_game_id = TG_I_LOBBY_KEY.value.trim();
  TG_ENTER.classList.add('w3-disabled');
  TG_PLAYER_1.classList.remove('w3-disabled');
  TG_PLAYER_2.classList.remove('w3-disabled');
};

/**************************************************************/
// TG_PLAYER_1.onclick()
// Event when user clicks the html PLAYER-1 button
// PLAYER-1 writes connection ID to DB for other peer (PLAYER-2) to read
/**************************************************************/
TG_PLAYER_1.onclick = () => {
  console.log('%c PLAYER-1: game id= ' + tg_game_id,
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  TG_PLAYER_1.classList.add('w3-disabled');
  TG_PLAYER_2.classList.add('w3-disabled');
  TG_H_PLAYER.textContent = "PLAYER-1";
  tg_playerNum = 0;
  TG_BODY.classList.add('player-1');
  tg_writeConnectionId(TG_LOBBY, tg_game_id, tg_connection);

  tg_other_playerNum = (tg_playerNum + 1) % 2;
  console.log('%c my/other tank: ' + tg_tankGroup[tg_playerNum].name + 
              '/' + tg_tankGroup[tg_other_playerNum].name, 
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');  
  tg_gameActive = true;  // Set game active for PLAYER-1
};

/**************************************************************/
// TG_PLAYER_2.onclick()
// Event when user clicks the html READ button
// PLAYER-2 reads connection ID from DB & displays it
/**************************************************************/
TG_PLAYER_2.onclick = () => {
  console.log('%c PLAYER-2: game id= ' + tg_game_id,
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  TG_PLAYER_1.classList.add('w3-disabled');
  TG_PLAYER_2.classList.add('w3-disabled');
  TG_H_PLAYER.textContent = "PLAYER-2";
  tg_playerNum = 1;
  TG_BODY.classList.add('player-2');
  tg_readConnectionId(TG_LOBBY, tg_game_id, tg_connection);

  tg_other_playerNum = (tg_playerNum + 1) % 2;
  console.log('%c my/other tank: ' + tg_tankGroup[tg_playerNum].name + 
              '/' + tg_tankGroup[tg_other_playerNum].name, 
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');   
  tg_gameActive = true;  // Set game active for PLAYER-1
};

/**************************************************************/
// TG_RESTART.onclick()
// Event when user clicks the html RESTART button
// Reload html page to restart game
/**************************************************************/
TG_RESTART.onclick = () => {
  console.log('%c RESTART: ',
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  window.location.href = ("tg_game.html");
};

/**************************************************************/
// tg_connect()
// Called by tg_readConnectionId() 
// PLAYER-2 initiates connection to PLAYER-1
/**************************************************************/
function tg_connect() {
  console.log('%c tg_connect(): player= ' + tg_playerNum,
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  //TG_P_OTHER_ID.textContent = tg_connection.id;
  if (!tg_connection.id) return;
  tg_conn = TG_PEER.connect(tg_connection.id, {
    metadata: {
      gameName:  fb_userDetails.gameName,
      playerNum: tg_playerNum,
      tankName:  tg_tankGroup[tg_playerNum].name
    }
  });
  tg_conn.on('error', (err) => {
    console.error('❌ tg_conn.on("error"): ' + err);
    alert('Connection Error: ' + err);
  });

  tg_conn.on('close', () => {
    console.log('%c ⚠️ tg_conn.on("close"): Connection with other player closed',
                'color: ' + COL_C + '; background-color: ' + COL_B + ';');
    alert('The other player has disconnected.');
  
    // Optional: Reset UI or game state
    tg_gameActive = false;
    TG_H_RESULT.textContent = 'Disconnected';
    TG_BODY.classList.add('youLost'); // or a different class
    TG_RESTART.classList.remove('w3-disabled');
  });
  
  //tg_conn = TG_PEER.connect(tg_connection.id);
  tg_isInitiator = true;
  tg_conn.on('open', () => {
    setupConnection('PLAYER-2 initiates connection with PLAYER-1');
  });
};

/*############################################################*/
// firebase code
/*############################################################*/
/**************************************************************/
// tg_writeConnectionId(_path, _key, _data)
// Called by TG_PLAYER_1.onclick() when user clicks WRITE button
// PLAYER-1 writes PLAYER-1 connection id to DB
// Input:  path & key(game id) & connection data
// Return: n/a
/**************************************************************/
function tg_writeConnectionId(_path, _key, _data) {
  console.log('%c tg_writeConnectionId(): path/key= ' + _path + '/' + _key,
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  const TG_DBREF = ref(FB_GAMEDB, _path + '/' + _key);
  set(TG_DBREF, _data)
    .then(() => {
      console.log('%c ✅ tg_writeConnectionId(): OK for path/key= ' + _path + '/' + _key,
                  'color: ' + COL_C + '; background-color: ' + COL_B + ';');
      fb_onDisconnect(_path, _key);
    })
    .catch((error) => {
      console.error('❌ tg_writeConnectionId(): ERROR for path/key= ' + _path + '/' + _key + ': ', error);
      alert('DB write error: see console log for details');
    });
}

/**************************************************************/
// tg_readConnectionId(_path, _key, _save)
// Called by TG_PLAYER_2.onclick() when user clicks READ button
// PLAYER-2 reads connection id from DB & initiates connection
// Input:  path & key (game id) & object to save data in
// Return: n/a
/**************************************************************/
function tg_readConnectionId(_path, _key, _save) {
  console.log('%c tg_readConnectionId(): path/key= ' + _path + '/' + _key,
              'color: ' + COL_C + '; background-color: ' + COL_B + ';');

  const TG_DBREF = ref(FB_GAMEDB, _path + '/' + _key);
  get(TG_DBREF)
    .then((snapshot) => {
      const TG_DATA = snapshot.val();
      if (TG_DATA != null) {
        console.log('%c ✅ tg_readConnectionId(): OK for path/key= ' + _path + '/' + _key,
                    'color: ' + COL_C + '; background-color: ' + COL_B + ';');
        Object.assign(_save, TG_DATA); 
        console.log(_save);             //DIAG
        TG_P_OTHER_NAME.textContent = TG_DATA.p1_gameName;
        fb_onDisconnect(_path, _key);
        tg_connect();                   // Initiate connection to PLAYER-1
      } else {
        console.log('%c ⚠️ tg_readConnectionId(): NO REC for path/key= ' + _path + '/' + _key,
                    'color: ' + COL_C + '; background-color: ' + COL_B + ';');
      }
    })
    .catch((error) => {
      console.error('❌ tg_readConnectionId(): READ ERROR for path/key= ' + _path + '/' + _key + ': ', error);
      alert('DB read error: see console log for details');
    });
}

/**************************************************************/
// END OF CODE
/**************************************************************/