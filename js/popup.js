'use strict';
// jshint -W110, -W003
/*global chrome, createWheel*/

let CLIPBOARD_DATA_HTML = {}, CLIPBOARD_DATA_PLAIN = {}, CLIPBOARD_VALID_FIELDS = {};

//CopyToClipboard so we can copy/paste the part of the report
function copyToClipboard(text, id) {
  if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
    try {
      let listener = (e) => {
        e.clipboardData.setData("text/html", CLIPBOARD_DATA_HTML[id] || text);
        e.clipboardData.setData("text/plain", CLIPBOARD_DATA_PLAIN[id] || text);
        e.preventDefault();
      };
      document.addEventListener("copy", listener);
      document.execCommand("copy");
      document.removeEventListener("copy", listener);
      return true;
    }
    catch (ex) {
      console.warn("Copy to clipboard failed.", ex);
    }
  }
  return false;
}

function getReportHTML(id){
  let text = document.getElementById(id).outerHTML;
  let html = `<!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lato">
  <link rel="stylesheet" href="http://coveo.github.io/vapor/dist/css/CoveoStyleGuide.css">
  <link rel="stylesheet" href="https://static.cloud.coveo.com/styleguide/v2.10.0/css/CoveoStyleGuide.css">
  <style type="text/css">
  body.coveo-styleguide {display:block; padding: 0 30px 30px;}
  div.wheel {display: inline-block; text-align: center; margin: 5px 10px; cursor: default; width: 160px;}
  div.wheel svg {cursor: default; width: 80px; height: 80px; transform: rotate(-90deg);}
  div.wheel .wheel-title {margin-top: 5px; font-size: 1.4em;}
  div.wheel svg .back-ring {stroke: #E4EAED; fill: none;}
  div.wheel svg text {font-weight: bold;}
  div.wheel.good svg text {fill: #00983;}
  div.wheel.warn svg text {fill: #ecad00;}
  div.wheel.bad svg text {fill: #ce3f00;}
  div.wheel.good svg circle.value {stroke: #009830;}
  div.wheel.warn svg circle.value {stroke: #ecad00;}
  div.wheel.bad svg circle.value {stroke: #ce3f00;}
  header.header {min-height: 48px;}
  .header-section {font-size: 1.2em; font-weight: bold;}
  a {outline: none;}
  a img {outline: none;}
  img {border: 0;}
  a:focus {outline: none;}
  h3 {margin: 10px;}
  h3 i {font-style: italic;}
  .popup-content {padding-left: 8px; padding-right: 8px; padding-top: 0px; overflow: auto;}
  #myscreenimage {height: 200px; background-size: contain; background-repeat: no-repeat; background-position: top center; margin: 10px 20px; /*border: 1px solid silver;*/}
  #scores {text-align: center;}
  #scores div.wheel a svg {cursor: pointer;}

  .coveo-styleguide .collapsible .collapsible-header {background-position: left 20px center; display: flex; line-height: 50px;}
  .coveo-styleguide .collapsible .collapsible-header .msg {flex: 1;}
  .coveo-styleguide table:not(.datepicker-table) tr:hover td {background-color: transparent;}

  #details b {font-weight: bold;}
  #details i {font-style: italic;}
  .mycode {font-family: courier; font-variant: normal !important; font-weight: normal !important; word-wrap: break-word; white-space: pre-wrap; word-break: break-all;}
  .coveo-styleguide .collapsible .collapsible-header .details {color: #ce3f00; font-size: 8px;}
  .coveo-styleguide .collapsible .collapsible-header .result {color: #ce3f00; margin: auto;}
  .coveo-styleguide .collapsible .collapsible-header .result .wheel {position: relative; width: auto;}
  .coveo-styleguide .collapsible .collapsible-header .result .wheel svg {width: 40px; position: absolute; margin-top: -40px; margin-left: -10px;}
  .coveo-styleguide .collapsible .collapsible-header .result div.wheel svg .back-ring {stroke: #fff; fill: none;}
  .coveo-styleguide .collapsible .collapsible-header .result .wheel-title {display: none;}
  .coveo-styleguide .collapsible .collapsible-header.active {background-image: none;}
  .coveo-styleguide .collapsible .collapsible-body {padding: 0;}
  .coveo-styleguide table:not(.datepicker-table) td.line-result {font-variant: small-caps; text-align: left; font-weight: bold; vertical-align: top;}
  .coveo-styleguide table:not(.datepicker-table) th:last-child, .coveo-styleguide table:not(.datepicker-table) td:last-child {padding-left: 25px;}
  tr td.line-message small {vertical-align: top !important;font-size: small; color: #1d4f76; display: block; /*padding-left:25px;*/}
  tr td.line-mandatory {vertical-align: top !important; text-align: right; width: 15px !important;padding-right: 1px !important;padding-left: 1px !important;}
  tr td.line-indicator {  border-right: none;  vertical-align: top !important;  padding-right: 1px !important;padding-left: 1px !important;}
  tr td.line-message {vertical-align: top !important; text-align: right; width: 350px; padding-left: 1px !important;}
  tr td.line-result {background-position: left 5px top 12px; background-repeat: no-repeat; background-size: 12px; text-align: left; word-wrap: break-word; white-space: pre-wrap; word-break: break-all; width: 450px;}
  .mandatory {  color: #009830;}
  .mandatoryFAIL {  color: #ce3f00;}
  .download-global, .copy-section {display;none;}
  .valid-true td.line-result {color: #009830; background-image: url(../images/checkbox-checkmark.svg);}
  .valid-false td.line-result {color: #ce3f00; background-image: url(../images/action-close.svg);}
  .valid-true td.line-mandatory {  color: #009830;}
  .valid-false td.line-mandatory {  color: #ce3f00;}
  </style>
  </head>
  <body class="coveo-styleguide">
  ${text}
  </body>
  </html>`;
  return html;
}

//Download the report
function downloadReport(id) {
  try {
    let html = getReportHTML(id);

    SendMessage({
      type: 'download',
      name: 'coveo-implementation-report.html',
      text: html
    });
  }
  catch (err) {
    console.log('Oops, unable to copy to Clipboard', err);
  }
}

let processDetail = (section, data, tests) => {
  let lines = section.attributes.map(attr => {

    let isValidCssClass = '',
      value = data[attr.key],
      hint = '';
    let additionalClass = '';
    let validColor = '';
    let validIcon = '';
    let mandatoryIcon = '';
    let mandatory = false;
    if (attr.additionalClass !== undefined) {
      additionalClass = attr.additionalClass;
    }
    if (attr.mandatory !== undefined) {
      mandatory = true;
    }
    if (attr.expected !== undefined) {
      let isValid = false;
      if (attr.expected.test) {
        isValid = attr.expected.test(value);
      }
      else {
        isValid = (value === attr.expected);
      }

      // keep a cache of validity test results, re-used in Clipboard data.
      CLIPBOARD_VALID_FIELDS[section.label + attr.key] = isValid;

      if (isValid) {
        //If it should not be calculated for the total score
        if (attr.notForTotal === undefined) {
          tests.passed++;
        }
      }
      else {
        // show hints when invalid.
        hint = attr.hint;
      }

      validColor = `color: ${isValid ? '#009830' : '#ce3f00'}`;
      validIcon = `<span style="font-weight:bold;${validColor}">${isValid ? '&#x2713;' : '&#x2718;'}</span>`;

      isValidCssClass = 'valid-' + isValid;
      if (mandatory) {
        mandatoryIcon = `<span class='${isValidCssClass}'>&#x2605;</span>`;
      }
    }

    //If it should not be calculated for the total score
    if (attr.notForTotal === undefined) {
      tests.total++;
    }

    return `<tr class="${isValidCssClass}">
        <td class="line-mandatory">
          ${mandatoryIcon}
        </td>
        <td class="line-message">
          ${attr.label}
          <small>${hint}</small>
        </td>
        <td class="line-indicator" width="1px">${validIcon}</td>
        <td class="line-result ${additionalClass}">${value}</td>
      </tr>`;
  });

  let score = createWheel({ title: section.title, value: tests.passed, max: tests.total });

  return `<ul id="${section.label}" class="collapsible" data-collapsible="expandable">
  <li>
    <div class="copy-section" style=""></div>
    <button type="button" class="collapsible-header active btn with-icon">
      <div class="msg">
        ${section.title}
      </div>
      <div class="result" style="">${score}</div>
    </button>
    <div class="collapsible-body">
      <table><tbody>
        ${lines.join('\n')}
      </tbody></table>
    </div>
  </li>
</ul>`;
};

let renderClipboardHtml = (section, data) => {
  let lines = section.attributes.map(attr => {

    let value = data[attr.key],
      mandatoryIcon = '',
      validColor = '',
      validIcon = '',
      additionalClass = '',
      hint = '';

    let isValid = CLIPBOARD_VALID_FIELDS[section.label + attr.key];
    if (isValid !== undefined) {
      validColor = `color: ${isValid ? '#009830' : '#ce3f00'}`;
      validIcon = `<span style="font-weight:bold;${validColor}">${isValid ? '&#x2713;' : '&#x2718;'}</span>`;
      hint = `<div style="font-size: 11px;color: #1d4f76;">${attr.hint}</div>`;
    }
    if (attr.additionalClass !== undefined) {
      additionalClass = `font-family: courier;font-variant: normal !important;font-weight: normal !important;font-size: 11px; word-wrap: break-word;white-space: pre-wrap;word-break: break-all;`;
    }
    if (attr.mandatory) {
      mandatoryIcon = `<span style="${validColor}">&#x2605;</span>`;
    }

    return `<tr>
    <td width=0 style="border-right: none;font-weight:bold;vertical-align: top">${mandatoryIcon}</td>
    <td style="padding-left:15px;vertical-align: top;border-left: none" width="50%">${attr.label}${hint}</td>
    <td width=0 style="border-right: none;vertical-align: top">${validIcon}</td>
    <td style="padding-left:15px;vertical-align: top;border-left: none;${validColor};${additionalClass}" width="50%">${value}</td></tr>`;
  });

  return `<table border="1" bordercolor="#bcc3ca" cellspacing="0" style="border-collapse: collapse; width:90%; font-size: 13px;box-sizing: border-box;font-family: Lato, Arial, Helvetica, sans-serif;"><tbody><tr>
<td colspan="4" style="border-bottom: 1px solid #bcc3ca;padding: 9px 15px;text-transform: uppercase;font-size: 13px;color: #1d4f76; height: 34px; background: #e6ecf0;">
<span style="background:#e6ecf0;">${section.title}</span><br>
<span style="font-size:8px;background:#e6ecf0;">(<span style='font-weight:bold;color: #009830'>&#x2605;</span> mandatory, <span style='font-weight:bold;color: #ce3f00'>&#x2605;</span> mandatory failed)</span>
</td></tr>
${lines.join('\n')}</tbody></table>
</div>
`; // leave empty last line here, and don't re-indent the strings
};

let renderClipboardPlain = (section, data) => {
  let lines = section.attributes.map(attr => {

    let value = data[attr.key],
      valid = '',
      hint = '';

    if (CLIPBOARD_VALID_FIELDS[section.label + attr.key] === false) {
      valid = '[X] ';
      hint = ` (${attr.hint})`;
    }

    return `${attr.label}${hint}: ${valid}${value}`;
  });

  return `${section.title}

${lines.join('\n')}
`; // leave empty last line here, and don't re-indent the strings
};

/**
 *  Generates the report in the Popup window.
 */
let processReport = (data) => {
  let sections = [
    {
      title: 'General information', label: 'General', attributes: [
        { key: 'theUrl', notForTotal: true, label: 'Url', hint: '' },
        { key: 'theDate', notForTotal: true, label: 'Date', hint: '' },
        { key: 'uiVersion', label: 'JS UI version', hint: 'Should be 2.3679', expected: /^2\.3679/ },
        { key: 'fromSystem', notForTotal: true, label: 'Integrated in UI' },
        { key: 'hardcodedAccessTokens', label: 'Hard coded Access Tokens', hint: 'Should NOT be done!!', expected: false },
        { key: 'alertsError', mandatory: true, label: 'No Search alerts error', hint: `Bad access to search alert subscriptions Or remove component class='CoveoSearchAlerts'`, expected: '' },
        { key: 'analyticsFailures', mandatory: true, label: 'Searches executed without sending analytics', hint: 'Manual triggered search did not sent analytics', expected: 0 },
      ]
    },
    {
      title: 'Behavior information', label: 'Behavior', attributes: [
        { key: 'nrofsearches', label: 'Number of searches executed', hint: 'Should be 1.', expected: 1 },
        { key: 'searchSent', mandatory: true, label: 'Search Events Sent', hint: 'Should be true, proper use of our Search API', expected: true },
        { key: 'analyticsSent', mandatory: true, label: 'Analytics Sent', hint: 'Should be true, proper use of Analytics and ML', expected: true },
        { key: 'usingVisitor', mandatory: true, label: 'Using Visitor', hint: 'Should be true, proper use of Analytics and ML', expected: true },
        { key: 'visitorChanged', mandatory: true, label: 'Visitor changed during session', hint: 'Should be false, proper use of Analytics and ML', expected: false },
        { key: 'usingSearchAsYouType', label: 'Using search as you type', hint: 'Degrades performance, should be false', expected: false },
        { key: 'initSuggestSent', mandatory: true, label: 'Searchbox, Using ML Powered Query Completions', hint: 'Should be true, full advantage of ML', expected: true },
        { key: 'initTopQueriesSent', notForTotal: true, label: 'Searchbox, Using Analytics Query Completions', hint: 'Should be false. Use ML Powered Query Completions', expected: false },
        { key: 'suggestSent', mandatory: true, label: 'Full Search Using ML Powered Query Completions', hint: 'Should be true, full advantage of ML', expected: true },
        { key: 'topQueriesSent', notForTotal: true, label: 'Full Search Using Analytics Query Completions', hint: 'Should be false. Use ML Powered Query Completions', expected: false },
        { key: 'usingQuickview', mandatory: true, label: 'Sending Quickview/Open Analytics event', hint: 'Should be true, proper use of Analytics and ML', expected: true },
      ]
    },
    {
      title: 'Implementation information', label: 'Implementation', attributes: [
        {
          key: 'pageSize', label: 'Total page size (kB) (<3000)', hint: 'Bigger pages are loading slower, bad user experience', expected: {
            test: value => (value < 3000)
          }
        },
        {
          key: 'loadtime', label: 'Total load time (s) (<2)', hint: 'Longer loading, bad user experience', expected: {
            test: value => (value < 2)
          }
        },
        { key: 'usingState', label: 'Using state in code', hint: 'Retrieving state creates more complicated code logic', expected: false },
        { key: 'usingPartialMatch', label: 'Using partial match', hint: 'Partial matching needs better tuning, match %, how many words to match', expected: false },
        { key: 'usingLQ', label: 'Using Long Queries (ML)', hint: 'Long Queries need ML capabilities, more tuning', expected: false },
        { key: 'usingDQ', label: 'Using disjunction queries', hint: 'Disjunction (big OR query) could lead to false results, more tuning needed', expected: false },
        { key: 'usingQRE', label: 'Using QRE in code', hint: 'QRE needs more finetuning to have better relevance', expected: false },
        { key: 'usingQREQuery', label: 'Using QRE in query', hint: 'QRE needs more finetuning to have better relevance', expected: false },
        { key: 'usingFilterField', label: 'Using Filter Field (Folding)', hint: 'Folding needs seperate result templates, more UI code', expected: false },
        { key: 'usingContext', label: 'Using Context', hint: 'Context needs more setup in Analytics/Pipelines and/or ML', expected: false },
        { key: 'usingPipeline', mandatory: true, label: 'Using Query Pipeline', hint: 'Dedicated Query Pipelines should be setup', expected: true },
        {
          key: 'pipelines', notForTotal: true, label: 'Used Query Pipelines (in code)', hint: 'Dedicated Query Pipelines should be setup', expected: {
            test: value => (value !== 'default' && value !== '')
          }
        },
        { key: 'usingTokens', label: 'Using Options.Tokens', hint: 'Hard coded tokens (except for public sites) should not be used', expected: false },
        { key: 'hardcodedAccessTokens', mandatory: true, label: 'Using accesToken', hint: 'Hard coded accessToken (except for public sites) should not be used', expected: false },
        { key: 'usingCustomEvents', label: 'Using Custom Events', hint: 'Overriding custom events creates more complicated code', expected: false },
        { key: 'usingAdditionalSearch', label: 'Using Additional Search Events', hint: 'Additional search events could create multiple queries, which could influence performance', expected: 0 },
        { key: 'usingAdditionalAnalytics', label: 'Using Additional Analytic Events', hint: 'Addtional Analytic events is a must with custom behavior, if that is not the case it should not be needed', expected: 0 },
        { key: 'onpremise', label: 'On-premise Installation', hint: 'On-premise installation, consider moving to the Cloud', expected: false },
        { key: 'queryExecuted', notForTotal: true, additionalClass: 'mycode', label: 'Last Query', hint: '' },
        { key: 'searchToken', notForTotal: true, additionalClass: 'mycode', label: 'Search Token used', hint: '' },
        { key: 'analyticsToken', notForTotal: true, additionalClass: 'mycode', label: 'Analytics Token used', hint: '' },
      ]
    },
    {
      title: 'UI information', label: 'UI', attributes: [
        { key: 'usingFacets', mandatory: true, label: 'Using Facets', hint: 'Better user experience', expected: true },
        {
          key: 'nroffacets', label: 'Active Facets in UI (2-5)', hint: 'More Facets, slower queries, users get overwhelmed with information', expected: {
            test: value => (value >= 2 && value <= 5)
          }
        },
        { key: 'usingTabs', label: 'Using Tabs', hint: 'Better user experience', expected: true },
        {
          key: 'nrofsorts', label: 'No of Sorts (1-3)', hint: 'More sorts, slower performance, users can get confused', expected: {
            test: value => (value >= 1 && value <= 3)
          }
        },
        { key: 'usingRecommendations', label: 'Using ML Recommendations', hint: 'Better user experience, give them what they do not know', expected: true },
        {
          key: 'nrOfResultTemplates', label: 'No of Result Templates (2-5)', hint: 'More result templates, more complicated implementations', expected: {
            test: value => (value >= 2 && value <= 5)
          }
        },
        { key: 'underscoretemplates', label: 'No of Underscore Templates (<5)', hint: 'Try to use Result Templates as much as possible', expected: 0 },
        {
          key: 'nrofraw', label: 'No raw field access in code', hint: 'More raw, more complicated implementations', expected: {
            test: value => (value < 5)
          }
        },
        { key: 'usingCulture', label: 'Cultures used', hint: 'Provide a UI in several cultures, better user experience', expected: true },
        { key: 'cultures', notForTotal: true, label: 'Cultures', hint: 'Provide a UI in several cultures, better user experience' },

      ]
    },
  ];

  // reset clipboard data
  CLIPBOARD_DATA_HTML = {};
  CLIPBOARD_DATA_PLAIN = {};
  CLIPBOARD_VALID_FIELDS = {};

  let sectionCharts = [];
  let html = [];
  sections.forEach(section => {
    let tests = { passed: 0, total: 0 };

    html.push(processDetail(section, data, tests));
    CLIPBOARD_DATA_HTML[section.label] = renderClipboardHtml(section, data);
    CLIPBOARD_DATA_PLAIN[section.label] = renderClipboardPlain(section, data);

    sectionCharts.push({ title: section.label, value: tests.passed, max: tests.total });
  });

  let scores = sectionCharts.map(createWheel);
  document.getElementById('scores').innerHTML = scores.join('\n');
  $('#legend').show();
  $('#download-global').show();

  let details = `<ul id="Details" class="collapsible" data-collapsible="expandable">
  <li>
      <button type="button" class="collapsible-header active btn with-icon">
          <div class="msg">
            Details
          </div>
      </button>
      <div class="collapsible-body">
        <table><tbody><tr><td style='padding-left: 1px;'>
          ${data.details}
        </tbody></td></tr></table>
      </div>
  </li>
  </ul>`;
  document.getElementById('details').innerHTML = html.join('\n') + details;

  $('#details .collapsible').collapsible();
  $('#details .copy-section').click((e) => {
    e.preventDefault();
    let target = $(e.currentTarget)[0], parent = $(target).closest('ul')[0];
    copyToClipboard(parent.outerHTML, parent.id);
    $('#clipboard-copied').removeClass('mod-hidden');
    setTimeout(() => {
      $('#clipboard-copied').addClass('mod-hidden');
    }, 999);
    return true;
  });

  $('#loading').hide();
};

let processState = (data) => {
  $('#loading').hide();
  if (!data) {
    return;
  }
  if (data.image) {
    setScreenShot(data.image);
  }
  if (data.json) {
    $('#push').removeAttr('disabled');
    processReport(data.json);
  }

  if (data.json || data.image) {
    $('#instructions').hide();
  }

  $('#setSearchTracker input').prop('checked', data.enableSearchTracker);
};

let processStateForPush = (data) => {
  if (!data) {
    return;
  }
  push(data);
};

function push(data) {
  var _this = this;

  // Build the body of the message containing all the metadata fields necessary
  var document = buildMessageDocument(data);

  // Push the message as a document to the pushAPI
  pushDocument(JSON.stringify(document), document.documentId);
}

function pushDocument(documentBody, documentId) {
  var _this = this;

  var server = 'push.cloud.coveo.com'
  var APIversion = 'v1'
  var organizationId = 'sewimnijmeijer01'
  var sourceId = 'riv7wb3mxim6ux5zh6m77wklxi-sewimnijmeijer01'
  let apikey='xx261c0e9b-768e-4e27-9245-931377cb6978';
  // This sends a request to 
  // https://push.cloud.coveo.com/v1/organizations/{orgID}/sources/{sourceID}/documents?documentId={documentID}
  // With the body containing the document metadata we constructed from the message
  $.ajax({
      url: `https://${server}/${APIversion}/organizations/${organizationId}/sources/${sourceId}/documents?documentId=${documentId}&compressionType=Uncompressed`,
      method: 'PUT',
      beforeSend: function(request) {
        request.setRequestHeader("content-type", 'application/json');
        request.setRequestHeader("Authorization", 'Bearer ' + apikey);
      },
      dataType: 'json',
      contentType: "application/json",
      data: documentBody,
      success: function(msg) {
        console.log("Pushed to Coveo");
        //alert("Pushed to Coveo Cloud");
      },
      error: function (xhr, ajaxOptions, thrownError) {
        console.log("Error when pushing: "+xhr.status);
        //alert("Pushed to Coveo Cloud FAILED: "+xhr.status);
      }
  });
  window.close();
 
}


function u_btoa(buffer) {
  var binary = [];
  var enc = new TextEncoder().encode(buffer);

  var bytes = new Uint8Array(enc);
  for (var i = 0, il = bytes.byteLength; i < il; i++) {
      binary.push(String.fromCharCode(bytes[i]));
  }
  return btoa(binary.join(''));
}

function buildMessageDocument(data) {
  var _this = this;

  var documentId = data.json['theUrl'];
  data.json['documentId'] = documentId;
  var date = new Date();
  data.json['date'] = date.toUTCString();
  //data.json['compressionType'] = 'Uncompressed';
  data.json['fileExtension'] = ".html";
  data.json['myimage'] = data.image;
  let html = getReportHTML('globalReport');
  data.json['compressedBinaryData'] = u_btoa(html);

  return data.json;
}

function pushToCoveo(){
  getStateForPush();
}

function getReport() {
  $('#loading').show();
  $('#instructions').hide();
  $('#myscreenimage').css('background-image', 'none').hide();
  document.getElementById('scores').innerHTML = '';
  document.getElementById('details').innerHTML = '';
  $('#push').removeAttr('disabled');
  
  SendMessage('getScreen');
}

let getState = () => {
  SendMessage('getState', processState);
};

let getStateForPush = () => {
  SendMessage('getState', processStateForPush);
};

function toggleTracker() {
  let enable = $('#setSearchTracker input').prop('checked') ? true : false;
  SendMessage({ type: 'enablesearch', enable });
}

function reset() {
  //reset all parameters
  $('#instructions').show();
  $('#myscreenimage').css('background-image', 'none').hide();
  $('#setSearchTracker input').prop('checked', false);
  $('#push').attr("disabled", true);
  document.getElementById('scores').innerHTML = '';
  document.getElementById('details').innerHTML = '';

  SendMessage('reset', getState);
  window.close();
}

function SendMessage(typeOrMessage, callback) {
  if (typeof typeOrMessage === 'string') {
    typeOrMessage = { type: typeOrMessage };
  }

  if (callback) {
    chrome.runtime.sendMessage(typeOrMessage, null, callback);
  }
  else {
    chrome.runtime.sendMessage(typeOrMessage);
  }
}

function setScreenShot(dataurl) {
  $('#myscreenimage').css('background-image', 'url(' + dataurl + ')').show();
}

if (chrome && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(
    function (reportData/*, sender, sendResponse*/) {

      if (reportData.type === 'gotScreen') {
        setScreenShot(reportData.src);
        SendMessage('getNumbersBackground');
      }
      else if (reportData.type === 'gotNumbersBackground') {
        SendMessage({ type: 'getNumbers', global: reportData.global });
      }
      else if (reportData.type === 'gotNumbers') {
        processReport(reportData.json);
      }
      if (reportData && reportData.length && reportData[0].value && reportData[0].max && reportData[0].title) {
        processReport(reportData);
      }
    }
  );
}
else {
  setTimeout(function () {
    processReport([{
      title: "TestOnly",
      value: 31, max: 60,
      lines: [
        { label: "# of search executed (should be 1)", value: 0, expected: 1 },
        { label: "Search Events sent using our api?", value: false, expected: true },
        { label: "Analytics sent?", value: false, expected: true },
        { label: "Using search as you type (degrades performances)", value: false, expected: false },
        { label: "Using ML Powered Query Completions", value: false, expected: true },
      ]
    }]);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  // Handle clicks on slide-toggle buttons
  $('.coveo-slide-toggle + button').click(function (jQueryEventObject) {
    $(this).prev().click();
    jQueryEventObject.preventDefault();
  });
  $('#myscreenimage').css('background-image', 'none').hide();
  $('#legend').hide();
  $('#push').attr("disabled", true);
  $('#download-global').hide().click(downloadReport.bind(null, 'globalReport'));
  $('#showInstructions').click(() => {
    $('#instructions').show();
  });
  $('#getReport').click(getReport);
  $('#push').click(pushToCoveo);
  $('#setSearchTracker').on('change', toggleTracker);
  $('#reset').click(reset);

  getState();
});