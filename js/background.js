'use strict';
/* globals chrome */
var filterSearch = { urls: ["*://*/rest/search/*", "*://*/?errorsAsSuccess=1", "https://*/rest/search/v2/*", "https://*/coveo/rest/v2/*", "https://cloudplatform.coveo.com/rest/search/*", "*://platform.cloud.coveo.com/rest/search/v2/*", "https://search.cloud.coveo.com/rest/search/v2/*", "*://*/*/coveo/platform/rest/*", "*://*/coveo/rest/*"] };
var filterAnalytics = { urls: ["*://usageanalytics.coveo.com/rest/*", "*://*/*/coveo/analytics/rest/*", "*://*/*/coveoanalytics/rest/*"] };
var filterOthers = { urls: ["*://*/rest/search/alerts*"] };
var analyticsSent;
var nrofsearches;
var searchSent;
var suggestSent;
var topQueriesSent;
var ready;
var myenabled;
var myenabledsearch;
var port;
var dqUsed;
var lqUsed;
var filterFieldUsed;
var partialMatchUsed;
var contextUsed;
var alertsError;
var visible;
var analyticsToken;
var searchToken;
var image;

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function setEnabled(enabled) {
  myenabled = enabled;
  if (myenabled == false) {
    reset();
  }
}


function setEnabledSearch(enabled) {
  myenabledsearch = enabled;
  nrofsearches = 0;
}


let SendMessage = (parameters) => {
  setTimeout(() => {
    try {
      chrome.runtime.sendMessage(parameters);
    }
    catch (e) { }
  });
};


chrome.runtime.onMessage.addListener(function (msg/*, sender, sendResponse*/) {
  if (msg.type === 'getScreen') {
    //Get screenshot
    chrome.tabs.captureVisibleTab(null, {
      "format": "png"
    }, function (dataURI) {
      if (typeof dataURI !== "undefined") {
        image = dataURI;
        SendMessage({ type: 'gotScreen', src: image });
      }
    });
  }
  if (msg.type === 'enable') {
    setEnabled(msg.enable);
  }
  else if (msg.type === 'reset') {
    reset();
  }
  else if (msg.type === 'enablesearch') {
    setEnabledSearch(msg.enable);
  }
  else if (msg.type === 'getNumbers') {
    SendMessage({
      type: "gotNumbers",
      topQueriesSent: topQueriesSent,
      analyticsSent: analyticsSent,
      searchSent: searchSent,
      suggestSent: suggestSent,
      nrofsearches: nrofsearches,
      //image: image,
      dqUsed: dqUsed,
      lqUsed: lqUsed,
      filterFieldUsed: filterFieldUsed,
      partialMatchUsed: partialMatchUsed,
      contextUsed: contextUsed,
      alertsError: alertsError,
      searchToken: searchToken,
      analyticsToken: analyticsToken
    });
  }
});


function onCaptured(imageUri) {
  console.log(imageUri);
}

function onError(error) {
  console.log(`Error: ${error}`);
}

function checkToken(token) {
  var part = token.split('.');
  var decoded = JSON.parse(atob(part[1]));
  return JSON.stringify(decoded, null, 2);
}

/*
chrome.browserAction.onClicked.addListener(function (tab) {
  if (port == undefined) {
    this.port = chrome.extension.connect({ "name": "swap" });
  }
  if (!visible) {
    visible = true;
    this.port.postMessage({ "type": "enabled", enabled: myenabled });
    this.port.postMessage({ "type": "addDiv" });
  }
  else {
    visible = false;
    this.port.postMessage({ "type": "enabled", enabled: myenabled });
    this.port.postMessage({ "type": "removeDiv" });

  }
});*/

function reset() {
  nrofsearches = 0;
  suggestSent = false;
  searchSent = false;
  analyticsSent = false;
  topQueriesSent = false;
  myenabled = true;
  dqUsed = false;
  lqUsed = false;
  alertsError = "";
  filterFieldUsed = false;
  partialMatchUsed = false;
  contextUsed = false;
  visible = false;
  myenabledsearch = false;
  analyticsToken = '';
  searchToken = '';
}

chrome.tabs.onActiveChanged.addListener(function (tabId, changeInfo, tab) {
  //reset();
});

chrome.tabs.onCreated.addListener(function (tab) {
  //reset();
});

if (nrofsearches == undefined) {
  reset();
  myenabled = true;
}

chrome.tabs.onUpdated.addListener(function (tabId, info) {
  if (info.status === 'complete') {
    //sent message to content.js
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0];
      if (activeTab != undefined) {
        ready = true;
      }
    });
  }
  else {
    ready = false;
  }
});

var responseSearch = function (details) {
  if (myenabled) {
    if (details.url.includes('querySuggest')) {
      console.log("CATCHED querySuggest " + details.url);
      suggestSent = true;
    }
    else {
      console.log("CATCHED Search " + details.url);
      searchSent = true;
      if (myenabledsearch) {
        nrofsearches = nrofsearches + 1;
      }
      if (details.requestBody != undefined) {
        var postedString = '';
        if (details.requestBody.raw != undefined) {
          if (details.requestBody.raw.length == 2) {
            var a = new Uint8Array(details.requestBody.raw[0].bytes);
            var b = new Uint8Array(details.requestBody.raw[1].bytes);
            var c = new (a.constructor)(a.length + b.length);
            c.set(a, 0);
            c.set(b, a.length);
            postedString = decodeURIComponent(String.fromCharCode.apply(null, c));
          }
          else {
            postedString = decodeURIComponent(String.fromCharCode.apply(null,
              new Uint8Array(details.requestBody.raw[0].bytes)));
          }
          try {
            if (postedString != undefined) {
              if (postedString.indexOf('dq=') != -1) {
                dqUsed = true;
              }
              if (postedString.indexOf('lq=') != -1) {
                lqUsed = true;
              }
              if (postedString.indexOf('filterField=') != -1) {
                filterFieldUsed = true;
              }
              if (postedString.indexOf('partialMatch=true') != -1) {
                partialMatchUsed = true;
              }
              if (postedString.indexOf('context=') != -1) {
                contextUsed = true;
              }
            }

          }
          catch (err) {

          }
        }
      }
    }
  }
  return { cancel: false };
}

var responseAnalytics = function (details) {
  if (myenabled) {
    if (details.url.includes('topQueries')) {
      console.log("CATCHED topQueries " + details.url);
      topQueriesSent = true;
    }
    else {
      console.log("CATCHED Analytics " + details.url);
      analyticsSent = true;
    }
    if (details.requestBody != undefined) {
      var postedString = decodeURIComponent(String.fromCharCode.apply(null,
        new Uint8Array(details.requestBody.raw[0].bytes)));
      var json = JSON.parse(postedString);
      try {
        if (json != undefined) {
          if (actionCause in json[0]) {
            console.log(json[0].actionCause);
          }
        }
      }
      catch (err) {

      }
    }
  }
  return { cancel: false };
}

var responseOthers = function (details) {
  if (myenabled) {
    console.log("CATCHED Others " + details.url);
    if (details.statusCode != 200) {
      alertsError = details.url + " --> " + details.statusCode;
    }
  }
  return { cancel: false };
}

chrome.webRequest.onBeforeRequest.addListener(responseSearch, filterSearch, ['blocking', 'requestBody']);
chrome.webRequest.onBeforeRequest.addListener(responseAnalytics, filterAnalytics, ['blocking', 'requestBody']);
chrome.webRequest.onHeadersReceived.addListener(responseOthers, filterOthers, ['blocking', 'responseHeaders']);

//for Search tokens
chrome.webRequest.onSendHeaders.addListener(
  function (details) {
    if (myenabled) {
      for (var i = 0; i < details.requestHeaders.length; ++i) {
        if (details.requestHeaders[i].name === 'Authorization') {
          var mytoken = (details.requestHeaders[i].value);
          if (mytoken.indexOf('.') == -1) {
            searchToken = mytoken;
          }
          else {
            searchToken = checkToken(mytoken);
          }
          break;
        }
      }
    }
    //return {requestHeaders: details.requestHeaders};
  },
  filterSearch,
  ["requestHeaders"]);

//for analytic tokens
chrome.webRequest.onSendHeaders.addListener(
  function (details) {
    if (myenabled) {
      for (var i = 0; i < details.requestHeaders.length; ++i) {
        if (details.requestHeaders[i].name === 'Authorization') {
          var mytoken = (details.requestHeaders[i].value);
          if (mytoken.indexOf('.') == -1) {
            analyticsToken = mytoken;
          }
          else {
            analyticsToken = checkToken(mytoken);
          }
          break;
        }
      }
    }
    //return {requestHeaders: details.requestHeaders};
  },
  filterAnalytics,
  ["requestHeaders"]);

chrome.runtime.onMessage.addListener(
  function (reportData, sender/*, sendResponse*/) {
    // Toggle popup button, disabling it when we don't find a Coveo Search Interface in the page.
    if (reportData.disabled !== undefined) {
      let enable = (reportData.disabled !== true);
      chrome.browserAction[enable ? 'enable' : 'disable'](sender.tab.id);

      if (enable) {
        chrome.tabs.executeScript(sender.tab.id, { file: "/js/content.js" });
      }
    }
  }
);