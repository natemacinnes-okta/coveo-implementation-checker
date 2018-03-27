'use strict';
// jshint -W110, -W003
/*global chrome, createWheel*/


//CopyToClipboard so we can copy/paste the part of the report
function copyToClipboard(text) {
  if (window.clipboardData && window.clipboardData.setData) {
    // IE specific code path to prevent textarea being shown while dialog is visible.
    return clipboardData.setData("Text", text);
  }
  else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
    var textarea = document.createElement("textarea");
    textarea.textContent = text;
    textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
    document.body.appendChild(textarea);
    textarea.select();
    try {
      return document.execCommand("copy");  // Security exception may be thrown by some browsers.
    }
    catch (ex) {
      console.warn("Copy to clipboard failed.", ex);
      return false;
    }
    finally {
      document.body.removeChild(textarea);
    }
  }
}

//Copy the report
function copyReport(id) {
  try {
    var html = document.getElementById(id).innerHTML;
    //TODO: remove the copy buttons from the HTML?
    var successful = copyToClipboard(html);
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Copying Report to Clipboard was ' + msg);
    alert("Report copied to clipboard.")
  }
  catch (err) {
    console.log('Oops, unable to copy to Clipboard');
    alert("Report WAS NOT copied to clipboard.")
  }
}


let processDetail = (section, data, tests) => {
  let lines = section.attributes.map(attr => {

    let isValidCssClass = '',
      value = data[attr.key],
      hint = '';
    let additionalClass = '';
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

      isValidCssClass = 'valid-' + isValid;
      if (mandatory) {
        isValidCssClass += (isValid ? ' mandatory' : ' mandatoryFAIL');
      }
    }

    //If it should not be calculated for the total score
    if (attr.notForTotal === undefined) {
      tests.total++;
    }

    return `<tr class="${isValidCssClass}">
        <td class="line-message">
          ${attr.label}
          <small>${hint}</small>
        </td>
        <td class="line-result ${additionalClass}">${value}</td>
      </tr>`;
  });

  let score = createWheel({ title: section.title, value: tests.passed, max: tests.total });

  return `<ul id="${section.label}" class="collapsible" data-collapsible="expandable">
      <li>
          <button type="button" class="collapsible-header active btn with-icon">
              <div class="msg">
                ${section.title}
              </div>
              <div class="result" style="">${score}</div>
              <div class="copysmall" style=""></div>
          </button>
          <div class="collapsible-body">
            <table><tbody>
              ${lines.join('\n')}
            </tbody></table>
          </div>
      </li>
    </ul>`;
};

/**
 *  Generates the report in the Popup window.
 */
let processReport = (data) => {
  let sections = [
    {
      title: 'General information', label: 'General', attributes: [
        { key: 'theUrl', notForTotal: true, label: 'Url', hint: '' },
        { key: 'uiVersion', label: 'JS UI version', hint: 'Should be 2.3679', expected: /^2\.3679/ },
        { key: 'fromSystem', notForTotal: true, label: 'Integrated in UI' },
        { key: 'hardcodedAccessTokens', label: 'Hard coded Access Tokens', hint: 'Should NOT be done!!', expected: false },
        { key: 'alertsError', mandatory: true, label: 'No Search alerts error', hint: `Bad access to search alert subscriptions Or remove component class='CoveoSearchAlerts'`, expected: '' },
        { key: 'analyticsFailures', mandatory: true, label: 'Searches executed without sending analytics', hint: 'Manual triggered search did not sent analytics', expected: 0 },
      ]
    },
    {
      title: 'Behavior information', label: 'Behavior', attributes: [
        { key: 'nrofsearches', label: 'Nr of searches executed', hint: 'Should be 1', expected: 1 },
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
        { key: 'usingPartialMatch', label: 'Using partial match', hint: 'Partial matching needs better tuning, match %, nr of words to match', expected: false },
        { key: 'usingLQ', label: 'Using Long Queries (ML)', hint: 'Long Queries need ML capabilities, more tuning', expected: false },
        { key: 'usingDQ', label: 'Using disjunction queries', hint: 'Disjunction (big OR query) could lead to false results, more tuning needed', expected: false },
        { key: 'usingQRE', label: 'Using QRE in code', hint: 'QRE needs more finetuning to have better relevance', expected: false },
        { key: 'usingQREQuery', label: 'Using QRE in query', hint: 'QRE needs more finetuning to have better relevance', expected: false },
        { key: 'usingFilterField', label: 'Using Filter Field (Folding)', hint: 'Folding needs seperate result templates, more UI code', expected: false },
        { key: 'usingContext', label: 'Using Context', hint: 'Context needs more setup in Analytics/Pipelines and/or ML', expected: false },
        { key: 'usingPipeline', mandatory: true, label: 'Using Query Pipeline', hint: 'Dedicated Query Pipelines should be setup', expected: true },
        {
          key: 'pipelines', notForTotal: true, label: 'Used Query Pipelines (in code)', hint: 'Dedicated Query Pipelines should be setup', expected: {
            test: value => (value != 'default' && value != '')
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

  let sectionCharts = [];
  let html = [];
  sections.forEach(section => {
    let tests = { passed: 0, total: 0 };
    let htmlSection = processDetail(section, data, tests);
    html.push(htmlSection);

    sectionCharts.push({ title: section.label, value: tests.passed, max: tests.total });
  });

  let scores = sectionCharts.map(createWheel);
  document.getElementById('scores').innerHTML = scores.join('\n');
  $('#legend').show();
  $('#copy').show();

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
    processReport(data.json);
  }

  if (data.json || data.image) {
    $('#instructions').hide();
  }

  $('#setSearchTracker input').prop('checked', data.enableSearchTracker);
};



function getReport() {
  $('#loading').show();
  $('#instructions').hide();
  $('#myscreenimage').css('background-image', 'none').hide();
  document.getElementById('scores').innerHTML = '';
  document.getElementById('details').innerHTML = '';

  sendMessage('getScreen');
}

let getState = () => {
  sendMessage('getState', processState);
};

function toggleTracker(e) {
  let myenabledsearch = $('#setSearchTracker input').prop('checked') ? true : false;
  sendMessage({ type: 'enablesearch', enable: myenabledsearch });
}

function reset() {
  //reset all parameters
  $('#instructions').show();
  $('#myscreenimage').css('background-image', 'none').hide();
  $('#setSearchTracker input').prop('checked', false);
  document.getElementById('scores').innerHTML = '';
  document.getElementById('details').innerHTML = '';

  sendMessage('reset', getState);
  window.close();
}

function sendMessage(typeOrMessage, callback) {
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
        sendMessage('getNumbersBackground');
      }
      else if (reportData.type === 'gotNumbersBackground') {
        sendMessage({ type: 'getNumbers', global: reportData.global });
      }
      else if (reportData.type === 'gotNumbers') {
        processReport(reportData.json);
        // analyticsSent = reportData.analyticsSent;
        // nrofsearches = reportData.nrofsearches;
        // searchSent = reportData.searchSent;
        // suggestSent = reportData.suggestSent;
        // topQueriesSent = reportData.topQueriesSent;
        // dqUsed = reportData.dqUsed;
        // lqUsed = reportData.lqUsed;
        // filterFieldUsed = reportData.filterFieldUsed;
        // partialMatchUsed = reportData.partialMatchUsed;
        // contextUsed = reportData.contextUsed;
        // alertsError = reportData.alertsError;
        // analyticsToken = reportData.analyticsToken;
        // searchToken = reportData.searchToken;
        // processReport([{
        //   title: "Overall",
        //   value: 31, max: 60,
        //   lines: [
        //     { label: "# of search executed (should be 1)", value: nrofsearches, expected: 1 },
        //     { label: "Search Events sent using our api?", value: searchSent, expected: true },
        //     { label: "Analytics sent?", value: analyticsSent, expected: true },
        //     { label: "Using search as you type (degrades performances)", value: false, expected: false },
        //     { label: "Using ML Powered Query Completions", value: topQueriesSent, expected: true },
        //   ]
        // }]);
        //chrome.tabs.sendMessage(currentTab, { analyzePage: true });
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
  $('#copy').hide();
  $('#showInstructions').click(() => {
    $('#instructions').show();
  });
  $('#getReport').click(getReport);
  $('#setSearchTracker').on('change', toggleTracker);
  $('#reset').click(reset);

  getState();
});