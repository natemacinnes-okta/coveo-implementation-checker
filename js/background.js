'use strict';

const STATES = {};
//For SFDC retrieved from SFDC
let GLOBAL = {};
/* globals chrome */
const FILTER_SEARCH = { urls: ["*://*/rest/search/*", "*://*/search/*", "*://*/*/search/*", "*://*/*/CoveoSearch/*", "*://*/?errorsAsSuccess=1", "*://*/*&errorsAsSuccess=1*", "https://*/rest/search/v2/*", "https://*/rest/search/v2*", "https://*/coveo-search/v2*","https://*/*/rest/search/v2*", "https://*/*/*/rest/search/v2*", "https://*/coveo/rest/v2*", "https://cloudplatform.coveo.com/rest/search/*", "*://platform.cloud.coveo.com/rest/search/v2/*", "https://search.cloud.coveo.com/rest/search/v2/*", "*://*/*/coveo/platform/rest/*", "*://*/coveo/rest/*"] };
const FILTER_ANALYTICS = { urls: ["*://*/v1/analytics/search*", "*://usageanalytics.coveo.com/rest/*", "*://*/*/coveo/analytics/rest/*", "*://*/*/rest/ua/*", "*://*/*/coveoanalytics/rest/*"] };
const FILTER_OTHERS = { urls: ["*://*/rest/search/alerts*"] };


let getTabId_Then = (callback) => {
  chrome.tabs.query({ active: true, lastFocusedWindow: true}, (tabs) => {
    callback(tabs[0].id);
  });
};


let resetState = (tabId) => {
  if (tabId) {
    STATES[tabId] = {
      tabId,
      SFDCID: '',
      Customer: '',
      Partner: '',
      nrofsearches: 0,
      suggestSent: false,
      searchSent: false,
      analyticsSent: false,
      topQueriesSent: false,
      initSuggestSent: false,
      initTopQueriesSent: false,
      usingDQ: false,
      usingLQ: false,
      query: [],
      allfields: [],
      dimensions: [],
      alertsError: '',
      searchURL: '',
      searchAuth: '',
      usingFilterField: false,
      usingPartialMatch: false,
      usingWildcards: false,
      usingContext: false,
      visible: false,
      enabledSearch: false,
      analyticsToken: '',
      searchToken: '',
      visitor: '',
      usingVisitor: false,
      visitorChanged: false,
      usingQuickview: false,
      usingCustomEvents: false,
      customData: [],
      usingQREQuery: false,
      usingPipeline: false,
      queryExecuted: '',
    };
    let state = STATES[tabId];
    //Add global state
    state = Object.assign(state, GLOBAL);
    STATES[tabId] = state;
  }
  else {
    getTabId_Then(resetState);
  }
};

let getState = (tabId) => {
  let state = STATES[tabId];
  if (!state) {
    resetState(tabId);
  }
  return STATES[tabId];
};

let getState_Then = (callback) => {
  getTabId_Then(tabId => {
    callback(getState(tabId));
  });
};

let saveGlobal = (obj) => {
  let state = Object.assign(GLOBAL, obj);
  GLOBAL = state;
};

let saveState = (obj, tabId) => {
  if (tabId) {
    let state = Object.assign(getState(tabId), obj);
    STATES[tabId] = state;
  }
  else {
    getTabId_Then(tabId => {
      saveState(obj, tabId);
    });
  }
};

function setEnabledSearch(enabled) {
  saveState({
    enabledSearch: enabled,
    nrofsearches: 0,
    query: [],
    suggestSent: false,
    topQueriesSent: false,
  });
}

let SendMessage = (parameters) => {
  setTimeout(() => {
    try {
      chrome.runtime.sendMessage(parameters);
    }
    catch (e) {
      console.log("EXCEPT: "+e);
     }
  });
};

function navigateto(url) {
  var newURL = "https:" + url;
  chrome.tabs.create({ url: newURL });
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.type === 'getState') {
    getTabId_Then(tabId => {
      sendResponse(getState(tabId));
    });
    return true;
  }
  else if (msg.type === 'getScreen') {
    //Get screenshot
    chrome.tabs.captureVisibleTab(null, {
      "format": "png"
    }, function (image) {
      if (image) {
        saveState({ image });
        SendMessage({ type: 'gotScreen', src: image });
      }
    });
  }
  else if (msg.type === 'gotNumbers') {
    saveState({ json: msg.json });
  }
  else if (msg.type === 'saveOrg') {
    saveState({ json: msg.json });
    if (msg.json.allfields) {
      var vals = {};
      vals['allfields'] = msg.json.allfields.map(x => ({ ...x }));
      vals['dimensions'] = msg.json.dimensions;
      saveGlobal(vals);
    }
  }
  else if (msg.type === 'navigate') {
    navigateto(msg.to);
  }
  else if (msg.type === 'reset') {
    getTabId_Then(tabId => {
      resetState(tabId);
      sendResponse({ tabId });
    });
    return true;
  }
  else if (msg.type === 'enablesearch') {
    setEnabledSearch(msg.enable);
    saveState({ enableSearchTracker: msg.enable });
  }
  else if (msg.type === 'saveScore') {
    let score = msg.score;
    let vals = {};
    vals[score] = msg.value;
    saveState(vals);
  }
  else if (msg.type === 'saveSFDC') {
    //sfdcid: $('#SFDCID').val(), customer: $('#Customer').val(), partner: $('#Partner').val() });
    saveState({ SFDCID: msg.sfdcid, Customer: msg.customer, Partner: msg.partner });
  }
  else if (msg.type === 'saveitemSFDC') {
    //sfdcid: $('#SFDCID').val(), customer: $('#Customer').val(), partner: $('#Partner').val() });
    let item = msg.item;
    let vals = {};
    vals[item] = msg.value;
    saveState(vals);
    saveGlobal(vals);
  }
  else if (msg.type === 'getNumbersBackground') {
    getState_Then(state => {
      SendMessage({
        type: "gotNumbersBackground",
        global: state
      });
    });
  }
  else if (msg.type === 'getLocationBackground') {
    getTabId_Then(tabId => {
      chrome.tabs.sendMessage(tabId || null, { type: 'getLocation', tabid:tabId});
    });/*
    getState_Then(state => {
      SendMessage({
        type: "gotLocationBackground",
        global: state
      });
    });*/
  }
 /* else if (msg.type === 'setLocationBackground') {
    getState_Then(state => {
      SendMessage({
        type: "gotLocation",
        json: msg.json
      });
    });
  }*/
  else {
    // proxy to content (tabs)
    getTabId_Then(tabId => {
      chrome.tabs.sendMessage(tabId || null, msg);
    });
  }
  //return true; 
});

function checkToken(token) {
  let part = token.split('.');
  let decoded = JSON.parse(atob(part[1]));
  return JSON.stringify(decoded, null, 2);
}

chrome.tabs.onUpdated.addListener(function (tabId, info) {
  if (info.status === 'loading') {
    let state = getState(tabId);
    let document_url = (info.url || '').replace(/(#|\?).+/g, ''); // ignore after ?, url is updated when using facets or doing searches.
    // if we change location, we want to reset this tab state.
    if (document_url && state.document_url !== document_url) {
      //WIM This creates a conflict, overriding initSearchSuggest etc
      //resetState(tabId);
      saveState({ document_url }, tabId);
    }
  }
  else if (info.status === 'complete') {
    saveState({ ready: true }, tabId);
    //chrome.tabs.executeScript(tabId, { file: "/js/content.js" });
    //Now inject content.js
  }
  return true; 
});

let decodeRaw = function (raw) {
  let rawString = '';
  if (raw && raw.length) {
    try {
      let totalLen = 0;
      let aUint8 = raw.map(r => {
        let a = new Uint8Array(r.bytes);
        totalLen += a.length;
        return a;
      });

      let c = new (aUint8[0].constructor)(totalLen);
      let len = 0;
      aUint8.forEach(a => {
        c.set(a, len);
        len += a.length;
      });
      rawString = decodeURIComponent(String.fromCharCode.apply(null, c));
    }
    catch (e) {
      console.error('decodeRaw Error: ', e);
    }
  }

  return (rawString || '');
};


let onSearchRequest = function (details) {
  getState_Then(state => {
    let thisState = {};
    console.log("CATCHED Search ", details.url);
    if (details.url.includes('querySuggest')) {
      if (state.enabledSearch) {
        console.log("CATCHED querySuggest ", details.url);
        thisState.suggestSent = true;
      }
      else {
        console.log("CATCHED INIT querySuggest ", details.url);
        thisState.initSuggestSent = true;
      }
    }
    else {

      let raw = details.requestBody && details.requestBody.raw,
        formData = (details.requestBody && details.requestBody.formData) || {};

      let postedString = {};
      if (raw) {
        postedString = JSON.parse(decodeRaw(raw));
      }
      //We want everything
      //var myquery = {};
      //'q,aq,dq,lq,filterField,partialMatch,context,pipeline'.split(',').forEach(attr => {
      Object.keys(formData).map(attr => {
        if (formData[attr] !== undefined) {
          // add all formData.q and formData.aq as q=... and aq=... to postedString
          //postedString += ` ${attr}=${formData[attr]}`;
          //postedString[attr]=formData[attr];
          //if (formData[attr][0].indexOf('[')==0){
          try {
            //myquery[attr] = JSON.parse(formData[attr][0]);
            postedString[attr] = JSON.parse(formData[attr][0]);
          }
          catch{
            //myquery[attr] = formData[attr][0];
            postedString[attr] = formData[attr][0];
          }
        }
      });
      //console.log(postedString);
      // thisState.queryExecuted = postedString;
      var fullstring = JSON.stringify(postedString);
      if ('q' in postedString || 'aq' in postedString) {//.includes('q=')) {
        console.log("CATCHED Search with query ", details.url);
        thisState.searchSent = true;
        if (state.enabledSearch) {
          thisState.nrofsearches = (state.nrofsearches || 0) + 1;
        }

          thisState.searchURL = details.url;
        //Add debug = true for later execution
        if (state.enabledSearch) {
          postedString['debug'] = true;
          //Checking for search as you type, same query all over again...
          if (state.query.length==0){
            state.query.push(postedString);
            state.query = [...new Set(state.query)];
          }
          else
          {
            if (postedString['q'].startsWith(state.query[0].q)){
                state.query[0].q=postedString['q'];
            }
            else{
              state.query.push(postedString);
              state.query = [...new Set(state.query)];
              }
          }
        }
      }
      if ('dq' in postedString) {//}.includes('dq=')) {
        thisState.usingDQ = true;
      }
      if ('lq' in postedString) {//}.includes('lq=')) {
        thisState.usingLQ = true;
      }
      if ('filterField' in postedString) {//}.includes('filterField=')) {
        thisState.usingFilterField = true;
      }
      if ('pipeline' in postedString) {//}.includes('pipeline=')) {
        thisState.usingPipeline = true;
      }
      if (fullstring.includes('$qre') || fullstring.includes('$correlate')) {
        thisState.usingQREQuery = true;
      }
      if ('enableWildcards' in postedString) {
        thisState.usingWildcards = postedString['enableWildcards'];
      }
      if ('wildcards' in postedString) {
        thisState.usingWildcards = postedString['wildcards'];
      }
      if ('partialMatch' in postedString) {
        thisState.usingPartialMatch = postedString['partialMatch'];
      }
      if (fullstring.includes('$some')) {
        thisState.usingPartialMatch = true;
      }
      if ('context' in postedString) {//fullstring.includes('context=') && !fullstring.includes('context={}')) {
        if (postedString['context']) {
          thisState.usingContext = true;
        }
      }
    }
    saveState(thisState, state.tabId);
  });
  return { cancel: false };
};

let onAnalyticsRequest = function (details) {
  getState_Then(state => {
    let thisState = {};
    let url = details.url + '&';

    if (url.includes('/click') || url.includes('/open')) {
      thisState.usingQuickview = true;
    }
    if (url.includes('/custom')) {
      thisState.usingCustomEvents = true;
    }
    if (url.includes('topQueries')) {
      if (state.enabledSearch) {
        console.log("CATCHED topQueries ", url);
        thisState.topQueriesSent = true;
      }
      else {
        console.log("CATCHED init topQueries ", url);
        thisState.initTopQueriesSent = true;
      }
    }
    //Get the visitor
    //url is like: https://usageanalytics.coveo.com/rest/v15/analytics/searches?visitor=baa899f0-0982-4ca4-b0b1-29ead6cce7e8
    // or: https://help.salesforce.com/services/apexrest/coveo/analytics/rest/v15/analytics/searches?visitor=092861ef-30ee-4719-ae5d-2c6dcdcffbee&access_token=eyJhbGciOiJIUzI1NiJ9.eyJmaWx0ZXIiOiIoKChAb2JqZWN0dHlwZT09KExpc3RpbmdDKSkgKEBzZmxpc3RpbmdjcHVibGljYz09VHJ1ZSkpIE9SIChAb2JqZWN0dHlwZT09KEhURGV2ZWxvcGVyRG9jdW1lbnRzQykpIE9SICgoQG9iamVjdHR5cGU9PShIZWxwRG9jcykpIChAc3lzc291cmNlPT1cIlNpdGVtYXAgLSBQcm9kLURvY3NDYWNoZVwiKSAoTk9UI
    const regex = /[visitorId|visitor]=(.*?)[ ;&$]/g;
    let matches = url.match(regex);
    if (matches) {
      console.log(`Visitor: ${matches[0]} found.`);
      let v = matches[0];
      if (!state.visitor) {
        thisState.visitor = v;
        thisState.usingVisitor = true;
      }
      else if (state.visitor !== v) {
        thisState.visitorChanged = true;
        console.log("Visitor ID was " + state.visitor + ' and now: ' + v);
        thisState.visitor = v;
      }
    }
    console.log("CATCHED Analytics ", details.url);
    thisState.analyticsSent = true;

    if (details.requestBody) {
      let postedString = decodeRaw(details.requestBody.raw);
      console.log('postedString [A]:', postedString);

      // TODO: need to do something with actionCause here ?
      try {
        let json = JSON.parse(postedString);
        if (json) {
          if ('customData' in json || 'customData' in json[0]) {
            if ('customData' in json) {
              console.log(json.customData);
              Object.keys(json.customData).map((field) => {
                if (field.toUpperCase().startsWith('C_')) {
                  state.customData.push(field);
                }
              });
            }
            else {
              console.log(json[0].customData);
              Object.keys(json[0].customData).map((field) => {
                if (field.toUpperCase().startsWith('C_')) {
                  state.customData.push(field);
                }
              });

            }
            state.customData = [...new Set(state.customData)].sort();
            console.log(state.customData);
          }
        }
      }
      catch (err) { }
    }

    saveState(thisState, state.tabId);
  });
  return { cancel: false };
};

let onResponseHeaders = function (details) {
  getState_Then(state => {
    console.log("CATCHED Others ", details.statusCode, details.url);
    if (details.statusCode !== 200) {
      saveState({ alertsError: details.url + " --> " + details.statusCode }, state.tabId);
    }
  });
  return { cancel: false };
};

let getAuthorizationToken = function (requestHeaders) {
  let token = null, headers = requestHeaders || [];

  for (let i = 0; i < headers.length; ++i) {
    let header = headers[i];
    if (header.name === 'Authorization') {
      token = header.value;
      break;
    }
  }
  return token;
};


let saveToken = function (tokenName, details) {
  getState_Then(state => {
    //First check URL
    let token = '';
    let url = details.url + "& ";
    var reg = RegExp(/token=(.*?)[ ;&$]/, 'ig');
    let matches = reg.exec(url);
    if (matches) {
      console.log(`Token: ${matches[0]} found.`);
      token = matches[1];
    }
    else {
      token = getAuthorizationToken(details.requestHeaders);
    }
    if (token) {
      if (tokenName == 'searchToken') {
        let s = {};
        s['searchAuth'] = token;
        saveState(s, state.tabId);
      }
      if (token) {
        let s = {};
        if (token.includes('.')) {
          token = checkToken(token);
        }
        s[tokenName] = token;
        saveState(s, state.tabId);
      }
    }
  });
};

chrome.webRequest.onBeforeRequest.addListener(onSearchRequest, FILTER_SEARCH, ['blocking', 'requestBody']);
chrome.webRequest.onBeforeRequest.addListener(onAnalyticsRequest, FILTER_ANALYTICS, ['blocking', 'requestBody']);
chrome.webRequest.onHeadersReceived.addListener(onResponseHeaders, FILTER_OTHERS, ['blocking', 'responseHeaders']);

//for Search tokens
chrome.webRequest.onSendHeaders.addListener(
  saveToken.bind(null, 'searchToken'),
  FILTER_SEARCH,
  ["requestHeaders"]);

//for analytic tokens
chrome.webRequest.onSendHeaders.addListener(
  saveToken.bind(null, 'analyticsToken'),
  FILTER_ANALYTICS,
  ["requestHeaders"]);

chrome.runtime.onMessage.addListener(
  /*function (reportData, sender/*, sendResponse*///) {
    // Toggle popup button, disabling it when we don't find a Coveo Search Interface in the page.
    /*if (reportData.disabled !== undefined) {
      let enable = (reportData.disabled !== true);
      chrome.browserAction[enable ? 'enable' : 'disable'](sender.tab.id);

      if (enable) {
        // chrome.tabs.executeScript(sender.tab.id, { file: "/js/content.js" });
      }
    }
    chrome.tabs.executeScript(sender.tab.id, { file: "/js/content.js" });
    return true;
  }*/
);

