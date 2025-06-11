/**************************************************************/
// reg_manager.mjs
//
// Test registration page
// Written by Mr Bob 2020
//
// All variables & function begin with reg_  all const with REG_
// Diagnostic code lines have a comment appended to them //DIAG
//
// v01 Initial code
// v02 Include reg_getFormItemValue function in reg_manager.js 
// v03 Add reg_prep function
// v04 Add conversion from string to number for numeric feilds
// v05 Cut down version
// v06 Check if form passed html validation
// v07 Alter to be used as standalone html file
// v08 Convert to modular API
/**************************************************************/

/**************************************************************         //<=======
  TO IMPLIMENT THE REGISTRATION FEATURE:                                //<=======
    1. Copy the style.css into your style.css &                         //<=======
         DELETE the  display: block;  line.                             //<=======
    2. Create a reg.html file & copy the reg.html into it.              //<=======
    3. Create a ???????.js module in your project &                     //<=======
         copy the contents of this file into it.                        //<=======
    4. Taylor your ???????.js to fit your program code by looking       //<=======
         at lines ending with  //<=======                               //<=======
    5. Create an images folder in your project.                         //<=======
    6. Download this project to your computer, extract all the          //<=======
         files from the zipped folder.                                  //<=======
    7. Upload all the images to your projects images folder.            //<=======
***************************************************************/        //<=======
const REG_COL_C = 'black';
const REG_COL_B = '#F0E68C';
console.log('%c reg_manager.mjs',
            'color: blue; background-color: white;');

/**************************************************************/
// Import all external constants & functions required
/**************************************************************/      
// Import all constants & functions required from fb_io module      
import { fb_writeRec } 
  from '/manager/fb/fb_io.mjs';
  window.fb_writeRec           = fb_writeRec;

import { fbR_procWUD }
  from '/manager/fb/fbR_manager.mjs';
  window.fbR_procWUD           = fbR_procWUD;

/**************************************************************/
// Event: DOMContentLoaded
// Functions you want to call when the page loads
/**************************************************************/
window.addEventListener('DOMContentLoaded', () => {
  html_load();
  reg_load();
});

/**************************************************************/
// reg_load()
// Called by reg.html body onload event                                 //<=======
// Prepare for registration - display reg page and
//  fill out name & email from Google login details
// Input:   
// Return: 
/**************************************************************/
function reg_load() {
  console.log('%c reg_load(): ',
              'color: ' + REG_COL_C + '; background-color: ' + REG_COL_B + ';');
  
  document.getElementById("p_regName").innerHTML  = fbD_userDetails.name  //<======= 
  document.getElementById("p_regEmail").innerHTML = fbD_userDetails.email //<======= 
}

/**************************************************************/
// reg_regDetailsEntered()
// Input event; called when user clicks REGISTER button                 //<=======
// Write user's details to DB
// Input:   
// Return:
/**************************************************************/
function reg_regDetailsEntered() {
  console.log('%c reg_regDetailsEntered(): ',
              'color: ' + REG_COL_C + '; background-color: ' + REG_COL_B + ';');

  var result = document.getElementById('f_reg').checkValidity(); //<======= correct id
  console.log("%c reg_regDetailsEntered(): form validation result= " + result,
              'color: ' + REG_COL_C + '; background-color: ' + REG_COL_B + ';');

  // Only save & write record to DB if all the form's input passed html validation
  if (result) {
    fbD_userDetails.gameName     = document.getElementById("i_gameName").value;
    fbD_userDetails.phone        = document.getElementById("i_phone").value;
    fbD_userDetails.gender       = document.getElementById("i_gender").value;
    fbD_userDetails.age          = Number(document.getElementById("i_age").value);
    fbD_userDetails.addrNum      = document.getElementById("i_addrNum").value;
    fbD_userDetails.addrSt       = document.getElementById("i_addrSt").value;
    fbD_userDetails.addrSuburb   = document.getElementById("i_addrSuburb").value;
    fbD_userDetails.addrCity     = document.getElementById("i_addrCity").value;
    fbD_userDetails.addrPostCode = Number(document.getElementById("i_addrPostCode").value);

    fb_writeRec(DETAILS, fbD_userDetails.uid, fbD_userDetails, fbR_procWUD);//<=======
  }
}

/**************************************************************/
// EXPORT FUNCTIONS
// List all the functions called by code or html outside of this module //<=======
/**************************************************************/
export { reg_load, reg_regDetailsEntered }                              //<=======             

/**************************************************************/
//    END OF PROG
/**************************************************************/