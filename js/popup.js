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
  let title = $('#xProjectname').val();
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
  tr td.line-performance, tr th.line-performance {
  text-align: left !important;
  width: 350px;
  word-wrap: break-word;
  word-break: break-all;
  padding-left: 1px !important;
}


tr td.line-type, tr th.line-type {
  text-align: left !important;
  width: 150px;
  padding-left: 1px !important;
}

tr td.line-duration, tr th.line-duration {
  background-position: left 5px top 12px;
  text-align: right  !important;
  width: 45px;
  padding-left: 1px !important;
}

tr td.line-ttfb, tr th.line-ttfb {
  background-position: left 5px top 12px;
  text-align: right  !important;
  width: 45px;
  padding-left: 1px !important;
}

.progress {
  position: relative;
  height: 13px;
  background: rgb(255, 0, 0);
  background: -moz-linear-gradient(left, rgba(0, 255, 0, 1) 0%, rgba(255, 0, 0, 1) 100%);
  background: -webkit-gradient(linear, left top, right top, color-stop(0%, rgba(0, 255, 0, 1)), color-stop(100%, rgba(255, 0, 0, 1)));
  background: -webkit-linear-gradient(left, rgba(0, 255, 0, 1) 0%, rgba(255, 0, 0, 1) 100%);
  background: -o-linear-gradient(left, rgba(0, 255, 0, 1) 0%, rgba(255, 0, 0, 1) 100%);
  background: -ms-linear-gradient(left, rgba(0, 255, 0, 1) 0%, rgba(255, 0, 0, 1) 100%);
  background: linear-gradient(to right, rgba(0, 255, 0, 1) 0%, rgba(255, 0, 0, 1) 100%);
  filter: progid: DXImageTransform.Microsoft.gradient(startColorstr='#00ff00', endColorstr='#ff0000', GradientType=1);
}
.amount {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  transition: all 0.8s;
  background: lightgray;
  /*width: 0;*/
}
.progress:before {
  content: attr(data-amount)" %";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  text-align: center;
  line-height: 13px;
  font-size: 0.8em;
}

  .mandatory {  color: #009830;}
  .mandatoryFAIL {  color: #ce3f00;}
  .download-global, .copy-section {display;none;}
  .valid-true td.line-result {color: #009830; background-image: url(../images/checkbox-checkmark.svg);}
  .valid-false td.line-result {color: #ce3f00; background-image: url(../images/action-close.svg);}
  .valid-true td.line-mandatory {  color: #009830;}
  .valid-false td.line-mandatory {  color: #ce3f00;}
  </style>
  <title>${title}</title>
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
        hint = `${attr.hint}, <a href="${attr.ref}" target="_blank">&#x2753;</a>`;
      }

      validColor = `color: ${isValid ? '#009830' : '#ce3f00'}`;
      validIcon = `<span style="font-weight:bold;${validColor}">${isValid ? '&#x2713;' : '&#x2718;'}</span>`;

      isValidCssClass = 'valid-' + isValid;
      if (mandatory) {
        mandatoryIcon = `<span class='${isValidCssClass}'>&#x2605;</span>`;
        //check if mandoatory is failed, else we need to set the flag of a total failure
        if (!isValid)
        {
          tests.mandatoryfail = true;
        }
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


let processDetailPerformanceReport = (section, data, tests, smallerIsBetter, total) => {
  let lines = data.map(attr => {

    let isValidCssClass = '';
    let additionalClass = '';
    let validColor = '';
    let validIcon = '';
    let mandatoryIcon = '';
    let mandatory = false;
    let url = '';
        // show hints when invalid.
    if (attr.url != '')
    {
        url = `<a href="${attr.url}" title="${attr.url}" target="_blank">&#x025F9;</a>`;
    }
    let perc= Math.round((attr.duration/(total/100)),0);
 
    return `<tr class="${isValidCssClass}">
        <td class="line-performance">
          ${attr.name}
          <small>${url}</small>
          <br><div class="progress" data-amount="${perc}"> <div class="amount" style="width:${100-perc}%"></div></div>
        </td>
        <td class="line-type">${attr.type}</td>
        <td class="line-duration">${attr.duration}</td>
        <td class="line-ttfb">${attr.TTFB}</td>
      </tr>`;
  });

  let score = createWheel({ title: section.title, value: tests.passed, max: tests.total, smallerIsBetter: smallerIsBetter });

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
      <table><tbody><tr><th class="line-performance">Url</th><th class="line-type">Type</th><th class="line-duration">Duration (ms)</th><th class="line-ttfb">Wait (ms)</th></tr>
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
      ref = '',
      hint = '';

    let isValid = CLIPBOARD_VALID_FIELDS[section.label + attr.key];
    if (isValid !== undefined) {
      validColor = `color: ${isValid ? '#009830' : '#ce3f00'}`;
      validIcon = `<span style="font-weight:bold;${validColor}">${isValid ? '&#x2713;' : '&#x2718;'}</span>`;
      ref = `<a href="${attr.ref}" target="_blank">&#x2753;</a>`;
      hint = `<div style="font-size: 11px;color: #1d4f76;">${attr.hint}, ${ref}</div>`;
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

let renderClipboardPerformanceHtml = (section, data) => {
  let lines = data.map(attr => {

    /*
         <td class="line-performance">
          ${attr.name}
          <small>${url}</small>
          <br><div class="progress" data-amount="${perc}"> <div class="amount" style="width:${100-perc}%"></div></div>
        </td>
        <td class="line-type">${attr.type}</td>
        <td class="line-duration">${attr.duration}</td>
        <td class="line-ttfb">${attr.TTFB}</td>*/
        let url = '';
        // show hints when invalid.
    if (attr.url != '')
    {
        url = `<a href="${attr.url}" target="_blank">Open</a>`;
    }
    return `<tr>

    <td width="50%">${attr.name}<br>${url}</td>
    <td width="20%">${attr.type}</td>
    <td width="10%">${attr.duration}</td>
    <td width="10%">${attr.TTFB}</td></tr>`;
  });

  return `<table border="1" bordercolor="#bcc3ca" cellspacing="0" style="border-collapse: collapse; width:90%; font-size: 13px;box-sizing: border-box;font-family: Lato, Arial, Helvetica, sans-serif;"><tbody><tr>
<td colspan="4" style="border-bottom: 1px solid #bcc3ca;padding: 9px 15px;text-transform: uppercase;font-size: 13px;color: #1d4f76; height: 34px; background: #e6ecf0;">
<span style="background:#e6ecf0;">${section.title}</span><br>
</td></tr>
<tr><td>Name</td><td>Type</td><td>Duration (ms)</td><td>Wait (ms)</td></tr>
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
        { key: 'xProjectname', notForTotal: true, label: 'Project Name', hint: '' },
        { key: 'xCustomer', notForTotal: true, label: 'Customer', hint: '' },
        { key: 'xPartner', notForTotal: true, label: 'Partner', hint: '' },
        { key: 'xOwner', notForTotal: true, label: 'Owner', hint: '' },
        { key: 'theUrl', notForTotal: true, label: 'Url', hint: '' },
        { key: 'theDate', notForTotal: true, label: 'Date', hint: '' },
        { key: 'uiVersion', label: 'JS UI version', hint: 'Should be 2.3826)', ref: 'https://docs.coveo.com/en/328/javascript-search-framework/javascript-search-v2---release-notes', expected: /^2\.3826/ },
        { key: 'fromSystem', notForTotal: true, label: 'Integrated in UI' },
        { key: 'hardcodedAccessTokens', label: 'Hard coded Access Tokens', hint: 'Should NOT be done!!', ref:'https://docs.coveo.com/en/56/cloud-v2-developers/search-token-authentication', expected: false },
        { key: 'alertsError', mandatory: true, label: 'No Search alerts error', ref:'https://onlinehelp.coveo.com/en/cloud/deploying_search_alerts_on_a_coveo_js_search_page.htm', hint: `Bad access to search alert subscriptions Or remove component class='CoveoSearchAlerts'`, expected: '' },
        { key: 'analyticsFailures', mandatory: true, label: 'Searches executed without sending analytics', ref:'https://docs.coveo.com/en/305/javascript-search-framework/implementing-a-custom-component-in-javascript', hint: 'Manual triggered search did not sent analytics', expected: 0 },
      ]
    },
    {
      title: 'Behavior information', label: 'Behavior', attributes: [
        { key: 'nrofsearches', label: 'Number of searches executed', hint: 'Should be 1.', ref:'https://docs.coveo.com/en/305/javascript-search-framework/implementing-a-custom-component-in-javascript', expected: 1 },
        { key: 'searchSent', mandatory: true, label: 'Search Events Sent', hint: 'Should be true, proper use of our Search API', ref:'https://developers.coveo.com/display/public/SearchREST/REST+Search+API+Home', expected: true },
        { key: 'analyticsSent', mandatory: true, label: 'Analytics Sent', hint: 'Should be true, proper use of Analytics and ML', ref:'https://coveo.github.io/search-ui/components/analytics.html', expected: true },
        { key: 'usingVisitor', label: 'Using Visitor', hint: 'Should be true, proper use of Analytics and ML', ref:'https://docs.coveo.com/en/18/cloud-v2-api-reference/usage-analytics-write-api#operation/get__v15_analytics_visit', expected: true },
        { key: 'visitorChanged', mandatory: true, label: 'Visitor changed during session', hint: 'Should be false, proper use of Analytics and ML', ref:'https://docs.coveo.com/en/18/cloud-v2-api-reference/usage-analytics-write-api#operation/get__v15_analytics_visit', expected: false },
        { key: 'usingSearchAsYouType', label: 'Using search as you type', hint: 'Degrades performance, should be false', ref:'https://onlinehelp.coveo.com/en/cloud/enabling_search_as_you_type_from_the_interface_editor.htm', expected: false },
        { key: 'initSuggestSent', mandatory: true, label: 'Searchbox, Using ML Powered Query Completions', hint: 'Should be true, full advantage of ML', ref:'https://onlinehelp.coveo.com/en/cloud/enabling_coveo_machine_learning_query_suggestions_in_a_coveo_js_search_framework_search_box.htm', expected: true },
        { key: 'initTopQueriesSent', notForTotal: true, label: 'Searchbox, Using Analytics Query Completions', hint: 'Should be false. Use ML Powered Query Completions', ref:'https://docs.coveo.com/en/340/javascript-search-framework/providing-query-suggestions', expected: false },
        { key: 'suggestSent', mandatory: true, label: 'Full Search Using ML Powered Query Completions', hint: 'Should be true, full advantage of ML', ref:'https://onlinehelp.coveo.com/en/cloud/enabling_coveo_machine_learning_query_suggestions_in_a_coveo_js_search_framework_search_box.htm', expected: true },
        { key: 'topQueriesSent', notForTotal: true, label: 'Full Search Using Analytics Query Completions', hint: 'Should be false. Use ML Powered Query Completions', ref:'https://docs.coveo.com/en/340/javascript-search-framework/providing-query-suggestions', expected: false },
        { key: 'usingQuickview', mandatory: true, label: 'Sending Quickview/Open Analytics event', hint: 'Should be true, proper use of Analytics and ML', ref:'https://developers.coveo.com/x/_oX2AQ', expected: true },
      ]
    },
    {
      title: 'Implementation information', label: 'Implementation', attributes: [
        {
          key: 'pageSize', label: 'Total page size (kB) (<3000)', hint: 'Bigger pages are loading slower, bad user experience', ref:'https://docs.coveo.com/en/295/javascript-search-framework/lazy-versus-eager-component-loading#interacting-with-lazy-components', expected: {
            test: value => (value < 3000)
          }
        },
        {
          key: 'loadtime', label: 'Total load time (s) (<2)', hint: 'Longer loading, bad user experience', ref:'https://docs.coveo.com/en/295/javascript-search-framework/lazy-versus-eager-component-loading#interacting-with-lazy-components', expected: {
            test: value => (value < 2)
          }
        },
        { key: 'usingState', label: 'Using state in code', hint: 'Retrieving state creates more complicated code logic', ref:'https://docs.coveo.com/en/344/javascript-search-framework/state', expected: false },
        { key: 'usingPartialMatch', label: 'Using partial match', hint: 'Partial matching needs better tuning, match %, how many words to match', ref:'https://support.coveo.com/s/article/1988?returnTo=RecentArticles', expected: false },
        { key: 'usingLQ', label: 'Using Long Queries (ML)', hint: 'Long Queries need ML capabilities, more tuning', ref:'https://developers.coveo.com/display/public/SalesforceV2/Activating+Machine+Learning+Intelligent+Term+Detection+%28ITD%29+in+Salesforce', expected: false },
        { key: 'usingDQ', label: 'Using disjunction queries', hint: 'Disjunction (big OR query) could lead to false results, more tuning needed', ref:'https://docs.coveo.com/en/190/glossary/disjunctive-query-expression', expected: false },
        { key: 'usingQRE', label: 'Using QRE in code', hint: 'QRE needs more finetuning to have better relevance', ref:'https://developers.coveo.com/display/public/SearchREST/Standard+Query+Extensions', expected: false },
        { key: 'usingQREQuery', label: 'Using QRE in query', hint: 'QRE needs more finetuning to have better relevance', ref:'https://developers.coveo.com/display/public/SearchREST/Standard+Query+Extensions', expected: false },
        { key: 'usingFilterField', label: 'Using Filter Field (Folding)', hint: 'Folding needs seperate result templates, more UI code', ref:'https://docs.coveo.com/en/428/javascript-search-framework/folding-results', expected: false },
        { key: 'usingContext', label: 'Using Context', hint: 'Context needs more setup in Analytics/Pipelines and/or ML', ref:'https://docs.coveo.com/en/399/javascript-search-framework/adding-custom-context-information-to-queries', expected: false },
        { key: 'usingPipeline', mandatory: true, label: 'Using Query Pipeline', hint: 'Dedicated Query Pipelines should be setup', ref:'https://onlinehelp.coveo.com/en/cloud/query_pipeline_routing_mechanisms_and_rules.htm', expected: true },
        {
          key: 'pipelines', notForTotal: true, label: 'Used Query Pipelines (in code)', hint: 'Dedicated Query Pipelines should be setup', ref:'https://onlinehelp.coveo.com/en/cloud/query_pipeline_routing_mechanisms_and_rules.htm', expected: {
            test: value => (value !== 'default' && value !== '')
          }
        },
        { key: 'usingTokens', label: 'Using Options.Tokens', hint: 'Hard coded tokens (except for public sites) should not be used', ref:'https://docs.coveo.com/en/56/cloud-v2-developers/search-token-authentication', expected: false },
        { key: 'hardcodedAccessTokens', mandatory: true, label: 'Using accesToken', hint: 'Hard coded accessToken (except for public sites) should not be used', ref:'https://docs.coveo.com/en/56/cloud-v2-developers/search-token-authentication', expected: false },
        { key: 'usingCustomEvents', label: 'Using Custom Events', hint: 'Overriding custom events creates more complicated code', ref:'https://docs.coveo.com/en/417/javascript-search-framework/events', expected: false },
        { key: 'usingAdditionalSearch', label: 'Using Additional Search Events', hint: 'Additional search events could create multiple queries, which could influence performance', ref:'https://docs.coveo.com/en/415/javascript-search-framework/triggers-and-lifecycle-traces', expected: 0 },
        { key: 'usingAdditionalAnalytics', label: 'Using Additional Analytic Events', hint: 'Addtional Analytic events is a must with custom behavior, if that is not the case it should not be needed', ref:'https://docs.coveo.com/en/365/javascript-search-framework/sending-custom-analytics-events', expected: 0 },
        { key: 'onpremise', label: 'On-premise Installation', hint: 'On-premise installation, consider moving to the Cloud', ref:'https://support.coveo.com/s/search/All/Home/%40uri#q=migrating%20to%20cloud&t=All&sort=relevancy', expected: false },
       /* { key: 'queryExecuted', notForTotal: true, additionalClass: 'mycode', label: 'Last Query', hint: '' },*/
        { key: 'searchToken', notForTotal: true, additionalClass: 'mycode', label: 'Search Token used', hint: '' },
        { key: 'analyticsToken', notForTotal: true, additionalClass: 'mycode', label: 'Analytics Token used', hint: '' },
      ]
    },
    {
      title: 'UI information', label: 'UI', attributes: [
        { key: 'usingFacets', mandatory: true, label: 'Using Facets', hint: 'Better user experience', ref:'https://onlinehelp.coveo.com/en/cloud/understanding_facets.htm', expected: true },
        {
          key: 'nroffacets', label: 'Active Facets in UI (2-5)', hint: 'More Facets, slower queries, users get overwhelmed with information', ref:'https://onlinehelp.coveo.com/en/cloud/understanding_facets.htm', expected: {
            test: value => (value >= 2 && value <= 5)
          }
        },
        { key: 'usingTabs', label: 'Using Tabs', hint: 'Better user experience', ref:'https://developers.coveo.com/display/public/JsSearchV1/SearchInterface+Component', expected: true },
        {
          key: 'nrofsorts', label: 'No of Sorts (1-3)', hint: 'More sorts, slower performance, users can get confused', ref:'https://coveo.github.io/search-ui/components/sort.html', expected: {
            test: value => (value >= 1 && value <= 3)
          }
        },
        { key: 'usingRecommendations', label: 'Using ML Recommendations', hint: 'Better user experience, give them what they do not know', ref:'https://onlinehelp.coveo.com/en/cloud/coveo_machine_learning_recommendations_deployment_overview.htm', expected: true },
        {
          key: 'nrOfResultTemplates', label: 'No of Result Templates (2-5)', hint: 'More result templates, more complicated implementations', ref:'https://onlinehelp.coveo.com/en/cloud/configuring_javascript_search_result_templates.htm', expected: {
            test: value => (value >= 2 && value <= 5)
          }
        },
        { key: 'underscoretemplates', label: 'No of Underscore Templates (<5)', hint: 'Try to use Result Templates as much as possible', ref:'https://onlinehelp.coveo.com/en/cloud/configuring_javascript_search_result_templates.htm', expected: {
          test: value => (value < 5)
        }
       },
        {
          key: 'nrofraw', label: 'No raw field access in code', hint: 'More raw, more complicated implementations', ref:'https://docs.coveo.com/en/420/javascript-search-framework/step-6---result-templates', expected: {
            test: value => (value < 5)
          }
        },
        { key: 'usingCulture', label: 'Cultures used', hint: 'Provide a UI in several cultures, better user experience', ref:'https://docs.coveo.com/en/421/javascript-search-framework/changing-the-language-of-your-search-interface', expected: true },
        { key: 'cultures', notForTotal: true, label: 'Cultures', hint: 'Provide a UI in several cultures, better user experience' , ref:'https://docs.coveo.com/en/421/javascript-search-framework/changing-the-language-of-your-search-interface' },

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
    let tests = { passed: 0, total: 0, mandatoryfail: false };

    html.push(processDetail(section, data, tests));
    CLIPBOARD_DATA_HTML[section.label] = renderClipboardHtml(section, data);
    CLIPBOARD_DATA_PLAIN[section.label] = renderClipboardPlain(section, data);
    let subtitle='<BR><span style="color: #009830;">PASSED</span>';
    data['Score_'+section.label] = 'PASSED';
    if (tests.mandatoryfail){
      data['Score_'+section.label] = 'FAILED';
      subtitle='<BR><span style="color: #ce3f00;">FAILED</span>';
    }
    SendMessage({ type: 'saveScore', score: 'Score_'+section.label, value: data['Score_'+section.label]  });
    sectionCharts.push({ title: section.label, subtitle: subtitle, value: tests.passed, max: tests.total });
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

let processPerformanceReport = (data) => {
  let sections = [
    {
      title: 'Very slow resources (>2s)', label: 'Very Slow' },
    {
      title: 'Slow resources (1s-2s)', label: 'Slow' },
    {
      title: 'Normal resources (100ms-1s)', label: 'Normal'  },
    {
      title: 'Fast resources (<100ms)', label: 'Fast' },
  ];

  // reset clipboard data
  CLIPBOARD_DATA_HTML = {};
  CLIPBOARD_DATA_PLAIN = {};
  CLIPBOARD_VALID_FIELDS = {};

  let sectionCharts = [];
  let html = [];
  let smallerIsBetter = true;
  //Very slow
  let tests = { passed: 0, total: 0, mandatoryfail: false };
  tests.total = data.T2s + data.T12s + data.T2001s + data.T0200;
  tests.passed = data.T2s;
  html.push(processDetailPerformanceReport(sections[0], data.bad, tests, smallerIsBetter, data.total));
  CLIPBOARD_DATA_HTML[sections[0].label] = renderClipboardPerformanceHtml(sections[0], data.bad);
  sectionCharts.push({ title: sections[0].label, subtitle: '', value: tests.passed, max: tests.total,smallerIsBetter });

  //Slow
  tests.passed = data.T12s;
  html.push(processDetailPerformanceReport(sections[1], data.slow, tests, smallerIsBetter, data.total));
  CLIPBOARD_DATA_HTML[sections[1].label] = renderClipboardPerformanceHtml(sections[1], data.slow);
  sectionCharts.push({ title: sections[1].label, subtitle: '', value: tests.passed, max: tests.total, smallerIsBetter });
  //Normal
  smallerIsBetter = false;
  tests.passed = data.T2001s;
  html.push(processDetailPerformanceReport(sections[2], data.medium, tests, smallerIsBetter, data.total));
  CLIPBOARD_DATA_HTML[sections[2].label] = renderClipboardPerformanceHtml(sections[2], data.medium);
  sectionCharts.push({ title: sections[2].label, subtitle: '', value: tests.passed, max: tests.total, smallerIsBetter });
  //Fast
  smallerIsBetter = false;
  tests.passed = data.T0200;
  html.push(processDetailPerformanceReport(sections[3], data.fast, tests,smallerIsBetter, data.total));
  CLIPBOARD_DATA_HTML[sections[3].label] = renderClipboardPerformanceHtml(sections[3], data.fast);
  sectionCharts.push({ title: sections[3].label, subtitle: '', value: tests.passed, max: tests.total,smallerIsBetter });

  let scores = sectionCharts.map(createWheel);
  document.getElementById('scores').innerHTML = scores.join('\n');
  //$('#legend').show();
  $('#download-global').show();
  let details='';
  details += `<tr>
  <td class="line-type"  width="50%">Total Load time</td>
  <td class="line-duration" width="50%">${Math.round(data.total,0)}</td></tr>`;
  for (var key in data.totalbytype) {
    details +=`<tr>
    <td class="line-type"  width="50%">${key}</td>
    <td class="line-duration" width="50%">${Math.round(data.totalbytype[key],0)}</td></tr>`;
  }
  let detail = `<ul id="Details" class="collapsible" data-collapsible="expandable">
  <li>
      <button type="button" class="collapsible-header active btn with-icon">
          <div class="msg">
            Details by type
          </div>
      </button>
      <div class="collapsible-body">
        <table><tbody><tr><th class="line-type">Type</th><th class="line-duration">Duration (ms)</th></tr>
          ${details}
        </tbody></table>
      </div>
  </li>
  </ul>`;
  document.getElementById('details').innerHTML = html.join('\n') + detail;
  

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
    //$('#showSFDC').removeAttr('disabled');
    processReport(data.json);
  }
  if (data.xSFDCUrl){
    $('#xProjectname').val(data.xProjectname);
    $('#xMilestone').val(data.xMilestone);
    $('#xRecordtype').val(data.xRecordtype);
    $('#xKickoff_date').val(data.xKickoff_date);
    $('#xGolive_date').val(data.xGolive_date);
    $('#xSearchpage').val(data.xSearchpage);
    $('#xCustomer').val(data.xCustomer);
    $('#xPartner').val(data.xPartner);
    $('#xOwner').val(data.xOwner);
    $('#xSFDCUrl').val(data.xSFDCUrl);
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

let processStateForSFDC = (data) => {
  if (!data) {
    return;
  }
  var document = buildMessageDocument(data, false);
  copyToClipboard(JSON.stringify(document));
  $('#clipboard-copiedsfdc').removeClass('mod-hidden');
  setTimeout(() => {
    $('#clipboard-copiedsfdc').addClass('mod-hidden');
  }, 1999);
};

function push(data) {
  // Build the body of the message containing all the metadata fields necessary
  var document = buildMessageDocument(data, true);

  // Push the message as a document to the pushAPI
  pushDocument(JSON.stringify(document));
}

function pushDocument(documentBody) {
  // This sends a request to a proxy for validation and push to our reports repository.
  // With the body containing the document metadata we constructed from the message
  // chrome.runtime.getManifest().shortname;
  $.ajax({
      url: `https://dzqyna30rf.execute-api.us-east-1.amazonaws.com/prod`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-id': chrome.runtime.id,
        'x-name': chrome.runtime.getManifest().short_name
      },
      dataType: 'json',
      contentType: "application/json",
      data: documentBody,
      success: function() {
        console.log("Pushed to Coveo");
        window.close();
      },
      error: function (xhr) {
        console.error("Error when pushing: ", xhr.status);
        window.close();
      }
  });
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

function buildMessageDocument(data, complete) {
  var documentId = data.json['theUrl'];
  data.json['documentId'] = documentId;
  var date = new Date();
  /*data.json['SFDCID'] = data.SFDCID;
  data.json['Customer'] = data.Customer;
  data.json['Partner'] = data.Partner;*/
  data.json['Projectname'] = data.xProjectname;
  data.json['Milestone'] = data.xMilestone;
  data.json['Recordtype'] = data.xRecordtype;
  var kick = new Date(Date.parse(data.xKickoff_date));
  data.json['Kickoff_date'] = kick.toUTCString();
  var live = new Date(Date.parse(data.xGolive_date));
  data.json['Golive_date'] = live.toUTCString();
 //s data.json['Searchpage'] = data.xSearchpage;
  data.json['Customer'] = data.xCustomer;
  data.json['Partner'] = data.xPartner;
  data.json['Owner'] = data.xOwner;
  data.json['SFDCUrl'] = data.xSFDCUrl;
  data.json['Score_General'] = data.Score_General;
  data.json['Score_Behavior'] = data.Score_Behavior;
  data.json['Score_Implementation'] = data.Score_Implementation;
  data.json['Score_UI'] = data.Score_UI;
  data.json['date'] = date.toUTCString();
  //data.json['compressionType'] = 'Uncompressed';
  data.json['fileExtension'] = ".html";
  if (complete){
    let html = getReportHTML('globalReport');
    data.json['compressedBinaryData'] = u_btoa(html);
  }
  else {
    data.json['details']="";
    data.json['image']="";
  }
  return data.json;
}

function copyForSFDC(){
  getStateForSFDC();
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
  //$('#showSFDC').removeAttr('disabled');
  SendMessage('getScreen');
}


function getPerformanceReport() {
  $('#loading').show();
  $('#instructions').hide();
  $('#legend').hide();
  $('#myscreenimage').css('background-image', 'none').hide();
  document.getElementById('scores').innerHTML = '';
  document.getElementById('details').innerHTML = '';
  //$('#push').removeAttr('disabled');
  //$('#showSFDC').removeAttr('disabled');
  SendMessage('getPerformanceReport');
}

let getState = () => {
  SendMessage('getState', processState);
};

let getStateForPush = () => {
  SendMessage('getState', processStateForPush);
};

let getStateForSFDC = () => {
  SendMessage('getState', processStateForSFDC);
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
  //$('#showSFDC').attr("disabled", true);
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

function setSFDC(values){
  for (let [curkey, curvalue] of Object.entries(values))
	{
    SendMessage({type: 'saveitemSFDC',item: curkey, value: curvalue} );
    $('#'+curkey).val(curvalue);
	}
}

if (chrome && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(
    function (reportData/*, sender, sendResponse*/) {

      if (reportData.type === 'gotScreen') {
        setScreenShot(reportData.src);
        SendMessage('getNumbersBackground');
      }
      if (reportData.type === 'gotSFDC') {
        setSFDC(reportData.values);
      }
      else if (reportData.type === 'gotNumbersBackground') {
        SendMessage({ type: 'getNumbers', global: reportData.global });
      }
      else if (reportData.type === 'gotNumbers') {
        processReport(reportData.json);
      }
      else if (reportData.type === 'gotPerformanceReport') {
        processPerformanceReport(reportData.json);
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

function save(){
  //Save the contents
  let values={};
  'xProjectname,xMilestone,xRecordtype,xKickoff_date,xGolive_date,xSearchpage,xCustomer,xPartner,xOwner,xSFDCUrl'.split(',').forEach(k => {
    values[k] = $('#' + k).val().trim();
  });
  setSFDC(values);
}

document.addEventListener('DOMContentLoaded', function () {
  // Handle clicks on slide-toggle buttons
  $('.coveo-slide-toggle + button').click(function (jQueryEventObject) {
    $(this).prev().click();
    jQueryEventObject.preventDefault();
  });
  $('#myscreenimage').css('background-image', 'none').hide();
  $('#legend').hide();
  $('#SFDCInfo').hide();
  $('#push').attr("disabled", true);
  $('#download-global').hide().click(downloadReport.bind(null, 'globalReport'));
  $('#showInstructions').click(() => {
    $('#instructions').show();
  });
  $('#showSFDC').click(() => {
    $('#SFDCInfo').toggle();
  });
  $('#getSFDC').click(() => {
    //Save the contents
    SendMessage({type: 'getSFDC'});
  });
  $('#getPerformanceReport').click(() => {
    //Save the contents
    SendMessage({type: 'clearCache'});
    setTimeout(() => {
      getPerformanceReport();
      }, 3000);
  });
  $('#openSearch').click(() => {
    //Save the contents
    save();

    let xSP = ($('#xSearchpage').val() || '').trim();
    if (xSP) {
      SendMessage({type: 'navigate', to: xSP});
    }
  });
  $('#toSFDC').click(() => {
    //Save the contents
    save();
    $('#SFDCInfo').hide();
  });

  $('#clearSFDC').click(() => {
    let values = {
      xProjectname: '',
      xMilestone: '',
      xRecordtype: '',
      xKickoff_date: '',
      xGolive_date: '',
      xSearchpage: '',
      xCustomer: '',
      xPartner: '',
      xOwner: '',
      xSFDCUrl: '',
    };
    // clear values in the UI; for example $('#xProjectname').val('');
    Object.keys(values).map(k => $('#'+k).val('') );

    setSFDC(values);
  });
  $('#getReport').click(getReport);
  $('#push').click(pushToCoveo);
  $('#setSearchTracker').on('change', toggleTracker);
  $('#reset').click(reset);

  getState();
});