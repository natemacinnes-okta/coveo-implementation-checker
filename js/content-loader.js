'use strict';
/*global chrome*/

if (document.querySelector('.CoveoSearchInterface,.CoveoSearchbox')) {
  console.log('Loading - Coveo Implementation Checker - ');
  chrome.extension.sendMessage({ disabled: false });
}
else {
  console.log('Not a Coveo page -- Skipping Implementation Checker - Deactivate button!');
  chrome.extension.sendMessage({ disabled: false });
}


