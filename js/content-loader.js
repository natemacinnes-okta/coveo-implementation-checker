'use strict';
/*global chrome*/
/*
if (window.location.origin.indexOf('.cloud.coveo.com') == -1) {
  //chrome.extension.sendMessage('disableOrg');
  chrome.runtime.sendMessage('disableOrg');
  console.log("disabling org button");
}
*/


if (document.querySelector('.CoveoSearchInterface,.CoveoSearchbox')) {
  //console.log('Loading - Coveo Implementation Checker - ');
  //chrome.extension.sendMessage({ disabled: false });
}
else {
  //console.log('Not a Coveo page -- Skipping Implementation Checker - Deactivate button!');
  //chrome.extension.sendMessage({ disabled: false });
}


