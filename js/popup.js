'use strict';
// jshint -W110, -W003
/*global chrome, createWheel*/

let processDetail = (section, data, tests) => {
  let lines = section.attributes.map(attr => {

    let isValidCssClass = '',
      value = data[attr.key],
      hint = '';

    if (attr.expected !== undefined) {
      let isValid = false;
      if (attr.expected.test) {
        isValid = attr.expected.test(value);
      }
      else {
        isValid = (value === attr.expected);
      }

      if (isValid) {
        tests.passed++;
      }
      else {
        // show hints when invalid.
        hint = attr.hint;
      }

      isValidCssClass = 'valid-' + isValid;
    }
    tests.total++;

    return `<tr class="${isValidCssClass}">
        <td class="line-message">
          ${attr.label}
          <small>${hint}</small>
        </td>
        <td class="line-result">${value}</td>
      </tr>`;
  });

  let score = createWheel({title: section.title, value: tests.passed, max: tests.total});

  return `<ul id="${section.label}" class="collapsible" data-collapsible="expandable">
      <li>
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

/**
 *  Generates the report in the Popup window.
 */
let processReport = (data) => {
  let sections = [
    {
      title: 'General information', label: 'General', attributes: [
        { key: 'theUrl', label: 'Url', hint: '' },
        { key: 'uiVersion', label: 'JS UI version', hint: 'Should be 2.3679', expected: /^2\.3679/ },
        { key: 'fromSystem', label: 'Integrated in UI' },
        { key: 'hardcodedAccessTokens', label: 'Hard coded Access Tokens', hint: 'Should NOT be done!!', expected: false },
        { key: 'alertsError', label: 'Search alerts error', hint: `Bad access to search alert subscriptions Or remove component class='CoveoSearchAlerts'`, expected: '' },
        { key: 'analyticsFailures', label: 'Searches executed without sending analytics', hint: 'Manual triggered search did not sent analytics', expected: 0 },
      ]
    },
    {
      title: 'Behavior information', label: 'Behavior', attributes: [
        { key: 'nrofsearches', label: 'Nr of searches executed', hint: 'Should be 1', expected: 1 },
        { key: 'searchSent', label: 'Search Events Sent', hint: 'Should be true, proper use of our Search API', expected: true },
        { key: 'analyticsSent', label: 'Analytics Sent', hint: 'Should be true, proper use of Analytics and ML', expected: true },
        { key: 'usingSearchAsYouType', label: 'Using search as you type', hint: 'Degrades performance, should be false', expected: false },
        { key: 'suggestSent', label: 'Using ML Powered Query Completions', hint: 'Should be true, full advantage of ML', expected: true },
        { key: 'topQueriesSent', label: 'Using Analytics Query Completions', hint: 'Should be false. Use ML Powered Query Completions', expected: false },
      ]
    },
    {
      title: 'Implementation information', label: 'Implementation', attributes: [
        { key: 'pageSize', label: 'Total page size', hint: 'more complicated' },
        { key: 'usingState', label: 'Using state in code', hint: 'Retrieving state creates more complicated code logic', expected: false },
        { key: 'usingPartialMatch', label: 'Using partial match', hint: 'Partial matching needs better tuning, match %, nr of words to match', expected: false },
        { key: 'usingLQ', label: 'Using Long Queries (ML)', hint: 'Long Queries need ML capabilities, more tuning', expected: false },
        { key: 'usingDQ', label: 'Using disjunction queries', hint: 'Disjunction (big OR query) could lead to false results, more tuning needed', expected: false },
        { key: 'usingQRE', label: 'Using QRE', hint: 'QRE needs more finetuning to have better relevance', expected: false },
        { key: 'usingFilterField', label: 'Using Filter Field (Folding)', hint: 'Folding needs seperate result templates, more UI code', expected: false },
        { key: 'usingContext', label: 'Using Context', hint: 'Context needs more setup in Analytics/Pipelines and/or ML', expected: false },
        { key: 'pipelines', label: 'Using Query Pipelines', hint: 'Dedicated Query Pipelines should be setup', expected: 'default' },
        { key: 'usingTokens', label: 'Using Options.Tokens', hint: 'Hard coded tokens (except for public sites) should not be used', expected: false },
        { key: 'hardcodedAccessTokens', label: 'Using accesToken', hint: 'Hard coded accessToken (except for public sites) should not be used', expected: false },
        { key: 'usingCustomEvents', label: 'Using Custom Events', hint: 'Overriding custom events creates more complicated code', expected: false },
        { key: 'usingAdditionalSearch', label: 'Using Additional Search Events', hint: 'Additional search events could create multiple queries, which could influence performance', expected: 0 },
        { key: 'usingAdditionalAnalytics', label: 'Using Additional Analytic Events', hint: 'Addtional Analytic events is a must with custom behavior, if that is not the case it should not be needed', expected: 0 },
        { key: 'onpremise', label: 'On-premise Installation', hint: 'On-premise installation, consider moving to the Cloud', expected: false },
        { key: 'searchToken', label: 'Search Token used', hint: '' },
        { key: 'analyticsToken', label: 'Analytics Token used', hint: '' },
          ]
    },
    {
      title: 'UI information', label: 'UI', attributes: [
        { key: 'usingFacets', label: 'Using Facets', hint: 'Better user experience', expected: true },
        { key: 'nroffacets', label: 'Active Facets in UI', hint: 'More Facets, slower queries, users get overwhelmed with information', expected: 5 },
        { key: 'usingTabs', label: 'Using Tabs', hint: 'Better user experience', expected: true },
        { key: 'nrofsorts', label: 'Nr of Sorts', hint: 'More sorts, slower performance, users can get confused', expected: 3 },
        { key: 'usingRecommendations', label: 'Using ML Recommendations', hint: 'Better user experience, give them what they do not know', expected: true },
        { key: 'nrOfResultTemplates', label: 'No of Result Templates', hint: 'More result templates, more complicated implementations', expected: 5 },
        { key: 'underscoretemplates', label: 'No of Underscore Templates', hint: 'Try to use Result Templates as much as possible', expected: 0 },
        { key: 'nrofraw', label: 'No raw field access in code', hint: 'More raw, more complicated implementations', expected: 5 },
        { key: 'usingCulture', label: 'No of Cultures used', hint: 'Provide a UI in several cultures, better user experience', expected: 2 },

      ]
    },
  ];

  let sectionCharts = [];
  let html = [];
  sections.forEach(section => {
    let tests = {passed:0, total: 0};
    let htmlSection = processDetail(section, data, tests);
    html.push(htmlSection);

    sectionCharts.push({title: section.label, value: tests.passed, max: tests.total});
  });

  let scores = sectionCharts.map(createWheel);
  document.getElementById('scores').innerHTML = scores.join('\n');

  document.getElementById('details').innerHTML = html.join('\n') + '<pre>' + JSON.stringify(data, 2, 2) + '</pre>';
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
        sendMessage({type:'getNumbers', global: reportData.global });
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

  $('#showInstructions').click(() => {
    $('#instructions').show();
  });
  $('#getReport').click(getReport);
  $('#setSearchTracker').on('change', toggleTracker);
  $('#reset').click(reset);

  getState();
});