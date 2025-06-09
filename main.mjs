/**************************************************************/
// main.mjs
// Main entry for index.html
// Written by <Your Name Here>, Term 2 202?
/**************************************************************/
const COL_C = 'white';	    // These two const are part of the coloured 	
const COL_B = '#CD7F32';	//  console.log for functions scheme
console.log('%c main.mjs', 
            'color: blue; background-color: white;');

/**************************************************************/
// Import all external constants & functions required
/**************************************************************/
// Import all the constants & functions required from fb_io module
import { fb_initialise, fb_login, fb_changeAuth, fb_logout,
         fb_writeRec ,fb_readRec, fb_readAll, fb_updateRec, fb_readSortedLimit, fb_deleteRec,
         fb_listen, fb_onDisconnect }
    from './fb_io.mjs';
    window.fb_initialise      = fb_initialise;
    window.fb_login           = fb_login;
    window.fb_logout          = fb_logout;
    window.fb_changeAuth      = fb_changeAuth;
    window.fb_writeRec        = fb_writeRec;
    window.fb_readRec         = fb_readRec;
    window.fb_readAll         = fb_readAll;
    window.fb_updateRec       = fb_updateRec;
    window.fb_readSortedLimit = fb_readSortedLimit;
    window.fb_deleteRec       = fb_deleteRec;
    window.fb_listen          = fb_listen;
    window.fb_onDisconnect    = fb_onDisconnect;

/**************************************************************/
// index.html main code
/**************************************************************/


/**************************************************************/
//   END OF CODE
/**************************************************************/
