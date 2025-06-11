//**************************************************************/
// fb_io.mjs
// Generalised firebase routines
// Written by <Your Name Here>, Term 2 202?
//
// All variables & export function begin with fb_  all const with FB_
// Diagnostic code lines have a comment appended to them //DIAG
/**************************************************************/
const FB_COL_C = 'white';	    // These two const are part of the coloured 	
const FB_COL_B = '#CD7F32';	  //  console.log for export functions scheme
console.log('%c fb_io.mjs',
            'color: blue; background-color: white;');

export var FB_GAMEDB;
export let fb_userDetails = {
  uid:         'n/a',   
  displayName: 'n/a',   
  email:       'n/a',   
  photoURL:    'n/a' 
}

/**************************************************************/
// Import all external constants & export functions required
/**************************************************************/
// Import all the methods you want to call from the firebase modules
import { initializeApp }
  from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, set, get, update, query, orderByChild, limitToFirst, 
         onValue, remove, onDisconnect } 
  from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
/**************************************************************/
// fb_initialise()
// Called by html INITIALISE button
// Connect to/initialise Firebase
// Input:  n/a
// Return: n/a
/**************************************************************/
export function fb_initialise() {
  console.log('%c fb_initialise(): ', 
              'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');

  const FB_GAMECONFIG = {
    apiKey: "AIzaSyAwIXfSRxi4htoE8L851cIaif3c_R6At4M",
    authDomain: "comp-2021-bob-bobby-3c596.firebaseapp.com",
    databaseURL: "https://comp-2021-bob-bobby-3c596-default-rtdb.firebaseio.com",
    projectId: "comp-2021-bob-bobby-3c596",
    storageBucket: "comp-2021-bob-bobby-3c596.firebasestorage.app",
    messagingSenderId: "287412274609",
    appId: "1:287412274609:web:3029e2297a3c0228962990",
    measurementId: "G-CE5X9JX66J"
  };

  const FB_GAMEAPP = initializeApp(FB_GAMECONFIG);
  FB_GAMEDB  = getDatabase(FB_GAMEAPP);
  console.info(FB_GAMEDB);         	                //DIAG         
}

/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
/**************************************************************/
// fb_login()
// Called by html LOGIN button
// Login to Firebase
// Input:  n/a
// Return: n/a
/**************************************************************/
export function fb_login() {
  console.log('%c fb_login(): ', 
              'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');

  document.getElementById("b_login").classList.add("w3-disabled");  
  fb_initialise();
     
  const AUTH = getAuth();
  const PROVIDER = new GoogleAuthProvider();

  // The following makes Google ask the user to select the account
  PROVIDER.setCustomParameters({
    prompt: 'select_account'
  });
  signInWithPopup(AUTH, PROVIDER)
  .then((result) => {
    //✅ Code for a successful authentication goes here
    fb_userDetails.uid         = result.user.uid;
    fb_userDetails.displayName = result.user.displayName;
    fb_userDetails.email       = result.user.email;
    fb_userDetails.photoURL    = result.user.photoURL; 
    console.log(fb_userDetails);       //DIAG

    //sessionStorage.setItem('googleLoginData', JSON.stringify(fb_userDetails));
    sessionStorage.setItem('uid', fb_userDetails.uid );
    sessionStorage.setItem('displayName', fb_userDetails.displayName );
    sessionStorage.setItem('email', fb_userDetails.email );
    sessionStorage.setItem('photoURL', fb_userDetails.photoURL );

    //window.location.href='select_game.html';

  /*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
  // Read userDetails
  const FB_DBREF = ref(FB_GAMEDB, 'userDetails/' + fb_userDetails.uid);
  get(FB_DBREF)
  .then((snapshot) => {
    //✅ USERDETAILS: Successful read So read admin record
    const fb_data = snapshot.val();
    if (fb_data != null) {
          /*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
          // Read admin
          const FB_DBREF = ref(FB_GAMEDB,'admin/' + fb_userDetails.uid);
          get(FB_DBREF)
          .then((snapshot) => {
            //✅ ADMIN: Successful read
            const fb_data = snapshot.val();
            if (fb_data != null) {
              // User is admin so set sessionStorage to 'y'
              sessionStorage.setItem('admin', 'y');
              window.location.href='select_game.html';
            } 
            else {
            //⚠️ ADMIN: Successful read BUT no rec found
            // User is NOT admin so set sessionStorage to 'n'
            sessionStorage.setItem('admin', 'n');
            window.location.href='select_game.html';
            }
          })
          
          .catch((error) => {
            //❌ ADMIN: Read error  
            console.log('❌' + error); 
          });
          /*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
    } 
    else {
    //⚠️ USERDETAILS: Successful read BUT no rec found SO load reg page
    window.location.href='reg.html';
    }
  })
  
  .catch((error) => {
    //❌ USERDETAILS: Read error  
    console.log('❌' + error); 
  });
    /*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/

  })

  .catch((error) => {
    //❌ Error uthentication failed
    console.log('❌' + error); 
  });
}

/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
/**************************************************************/
// fb_changeAuth()
// Called by html CHANGE AUTH button button
// Detect changes to user authewntication
// Input:  n/a
// Return: n/a
/**************************************************************/
export function fb_changeAuth() {
  console.log('%c fb_changeAuth(): ', 
              'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');

  let fb_userLogin = 'n/a';

  const AUTH = getAuth();
  onAuthStateChanged(AUTH, (user) => {
    if (user) {
      fb_userLogin = 'logged IN';
    } else {
      fb_userLogin = 'logged OUT';
    }
    console.log('%c ✅ fb_changeAuth(): ' + fb_userLogin, 
                'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');
  }, 

  (error) => {
    //❌ Code for an onAuthStateChanged error goes here
    console.log('❌' + error);
  });
}

/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
/**************************************************************/
// fb_logout()
// Called by html LOGOUT button
// Logout of firebase
// Input:  n/a
// Return: n/a
/**************************************************************/
export function fb_logout() {
  console.log('%c fb_logout(): ', 
              'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');

  const AUTH = getAuth();
  signOut(AUTH)
  .then(() => {
    //✅ Successful logout
    console.log('%c ✅ fb_logout(): LOGGED OUT', 
                'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');
  })

  .catch((error) => {
    //❌ Logout error 
    console.log('❌' + error);
  });
}

/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
/**************************************************************/
// fb_writeRec(_path, _key, _data)
// Called by various
// Write a specific record to the DB
// Input:  path & key to write to and the data to write
// Return: n/a
/**************************************************************/
export function fb_writeRec(_path, _key, _data) {
  _path = 'userDetails';
  _key  = fb_userDetails.uid;
  _data = fb_userDetails;

  console.log('%c fb_writeRec(): path= ' + _path + '  key= ' + _key,
              'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');

  const FB_DBREF = ref(FB_GAMEDB, _path + '/' + _key);
  set(FB_DBREF, _data)
  .then(() => {
    //✅ Successful write
    console.log('%c ✅ fb_writeRec(): OK for path/key= ' + _path + '/' + _key,
                'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');
  })

  .catch((error) => {
    //❌ Write error  
    console.log('❌' + error); 
  });
}

/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
/**************************************************************/
// fb_readRec(_path, _key)
// Read a specific DB record
// Input:  path & key of rec to read
// Return: n/a
/**************************************************************/
export function fb_readRec(_path, _key) {
  _path = 'userDetails';
  _key  = fb_userDetails.uid;
 
  console.log('%c fb_readRec(): path/key= ' + _path + '/' + _key,
              'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');

  const FB_DBREF = ref(FB_GAMEDB, _path + '/' + _key);
  get(FB_DBREF)
  .then((snapshot) => {
    const fb_data = snapshot.val();
    if (fb_data != null) {
       //✅ Successful read
      console.log('%c ✅ fb_readRec(): OK for path/key= ' + _path + '/' + _key,
                  'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');
    } 
    else {
    //⚠️ Successful read BUT no rec found
    console.log('%c ⚠️ fb_readRec(): NO REC for path/key= ' + _path + '/' + _key,
                'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');
    }
  })
  
  .catch((error) => {
    //❌ Read error  
    console.log('❌' + error); 
  });
}

/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
/**************************************************************/
// fb_readAll(_path, _array)
// Read ALL records in a path
// Input:  path to read & array to store the data in
// Return: n/a
/**************************************************************/
export function fb_readAll(_path, _array) {
  _path  = 'userDetails';
  _array = [];

  console.log('%c fb_readAll(): path= ' + _path,
              'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');

  const FB_DBREF = ref(FB_GAMEDB, _path); 
  get(FB_DBREF)
  .then((snapshot) => {
    //✅ Successful read all
    if (snapshot.val() != null) {
      //✅ Successful read all
      console.log('%c ✅ fb_readAll(): OK for path= ' + _path,
                  'color: ' + BB_COL_C + '; background-color: ' + BB_COL_B + ';');
      snapshot.forEach(function(childSnapshot) {
        // if you need access to the key...
        //var childKey = childSnapshot.key;
        var childData = childSnapshot.val();
        _array.push(childData);
        //console.table(_array);       //DIAG
      });
    
      console.table(_array);           //DIAG
    } 
    else {
      //⚠️ Successful read all BUT no rec found
      console.log('%c ⚠️ fb_readAll(): NO REC for path= ' + _path,
                  'color: ' + BB_COL_C + '; background-color: ' + BB_COL_B + ';');
    }
  })

  .catch((error) => {
    //❌ Read all error  
    console.log('❌' + error); 
  });
}

/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
/**************************************************************/
// fb_updateRec(_path, _key, _data)
// Called by various
// Update a specific field within a record of the DB
// Input:  path & key of rec to update and the data to update
// Return: n/a
/**************************************************************/
export function fb_updateRec(_path, _key, _data) {
  _path = 'userDetails';
  _key  = fb_userDetails.uid;
  _data = {email: 'xxx'};

  console.log('%c fb_updateRec(): path/key= ' + _path + '/' + _key,
              'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');

  const FB_DBREF = ref(FB_GAMEDB, _path + '/' + _key);
  update(FB_DBREF, _data)
  .then(() => {
    //✅ Successful update
    console.log('%c ✅ fb_updateRec(): OK for path/key= ' + _path + '/' + _key,
                'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');
  })

  .catch((error) => {
    //❌ Update error  
    console.log('❌' + error); 
  });
}

/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
/**************************************************************/
// fb_readSortedLimit(_path, _sortKey, _num)
// Called by various
// Read specified num of DB records for the path, in ASCENDING order.
// Input:  path to read from, sort key & num records to return
// Return: n/a
/**************************************************************/
export function fb_readSortedLimit(_path, _sortKey, _num) {
  _path    = 'scores/bbScore';
  _sortKey = 'score';
  _num     = 3;

  console.log('%c fb_readSortedLimit(): path/sortkey= ' + _path + '/' + _sortKey, 
              'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');

  const FB_DBREF = query(ref(FB_GAMEDB,  _path), orderByChild(_sortKey), limitToFirst(_num));
  get(FB_DBREF)
  .then((snapshot) => {
    //✅ Successful read all
    if (snapshot.val() != null) {
      //✅ Successful read all
      console.log('%c ✅ fb_readSortedLimit(): OK for path= ' + _path,
                  'color: ' + BB_COL_C + '; background-color: ' + BB_COL_B + ';');
      snapshot.forEach(function(childSnapshot) {
        // if you need access to the key...
        //var childKey = childSnapshot.key;
        var childData = childSnapshot.val();
        _array.push(childData);
        //console.table(_array);       //DIAG
      });
    
      console.table(_array);           //DIAG
    } 
    else {
      //⚠️ Successful read all BUT no rec found
      console.log('%c ⚠️ fb_readSortedLimit(): NO REC for path= ' + _path,
                  'color: ' + BB_COL_C + '; background-color: ' + BB_COL_B + ';');
    }
  })

  .catch((error) => {
    //❌ Sorted read error  
    console.log('❌' + error);  
  });
}

/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
/**************************************************************/
// fb_deleteRec(_path, _key)
// Called by various
// Delete the entire path (_key == null) specified by _path
//   OR delete a specific record specified by _path & _key
// Input:  path to delete, the key or null
// Return: n/a
/**************************************************************/
export function fb_deleteRec(_path, _key) {
  _path = 'userDetails';
  _key  = 'bbbbb';

  console.log('%c fb_deleteRec(): path/key= ' + _path + '/' + _key,
              'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');

  const FB_DBREF = ref(FB_GAMEDB, _path + '/' + _key);
  remove(FB_DBREF)
  .then(() => {
    //✅ Successful delete
    console.log('%c ✅ fb_deleteRec(): OK for path/key= ' + _path + '/' + _key,
                'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');
  })

  .catch((error) => {
    //❌ Sorted read all error  
    console.log('❌' + error); 
  });
}

/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
/**************************************************************/
// fb_listen(_path, _key)
// Issue a onValue to listen for modifications to DB data
// Input:  path & key of rec to listen for changes on
// Return: n/a
/**************************************************************/
export function fb_listen(_path, _key) {
  _path = 'userDetails';
  _key  = fb_userDetails.uid;

  console.log('%c fb_listen(): path/key= ' + _path + '/' + _key,
              'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');

  const FB_DBREF = ref(FB_GAMEDB, _path + '/' + _key);
  onValue(FB_DBREF, (snapshot) => {
    var fb_data = snapshot.val();
    if (fb_data != null) {
      //✅ Listener triggered 
      console.log('%c ✅ fb_listen(): TRIGGERED for path/key= ' + _path + '/' + _key,
                  'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');
    } 
    else {
      //⚠️ Listener triggered BUT no data found 
      console.log('%c ⚠️ fb_listen(): TIRGGERED BUT NO DATA for path/key= ' + 
                  _path + '/' + _key,
                  'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');
    }
  }),

  (error) => {
    //❌ Listener error 
    console.log('❌' + error); 
  }
}

/*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
/**************************************************************/
// fb_onDisconnect(_path, _key)
// Issue a onDisconnect to deelete record at _path/_key
//  Runs on server when user diconnects from firebase
// Input:  path & key of rec to delete on disconnection
// Return: n/a
/**************************************************************/
export function fb_onDisconnect(_path, _key) {
  _path = 'userDetails';
  _key  = 'bbbbb';

  console.log('%c fb_onDisconnect(): path/key= ' + _path + '/' + _key,
              'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');

  const FB_DBREF = ref(FB_GAMEDB, _path + '/' + _key);
  onDisconnect(FB_DBREF).remove()
  .then(() => {
    //✅ Successful onDisconnect setup
    console.log('%c ✅ fb_onDisconnect(): OK',
                'color: ' + FB_COL_C + '; background-color: ' + FB_COL_B + ';');
  })

  .catch((error) => {
    //❌ Error setting onDisconnect 
    console.log('❌' + error); 
  });
}

/*------------------------------------------------------------*/
/*
To cancel the onDisconnect request issue a .cancel
The format is:
onDisconnect(ref).cancel()     where ref is the reference to the DB
EG:
onDisconnect(FB_DBREF).cancel()
.then(() => {
  //✅ Successful cancelling onDisconnect
  console.log('%c ✅ onDisconnect cancel: OK',
              'color: green; background-color: lightgray;');
})

.catch((error) => {
  //❌ Error cancelling onDisconnect
  console.log('❌' + error); 
});
*/
/*------------------------------------------------------------*/

/**************************************************************/
// END OF CODE
/**************************************************************/