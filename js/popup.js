'use strict';
// jshint -W110, -W003
/*global chrome, createWheel*/

var currentTab;
var currentUI = '2.3679';
var myenabled;
var myenabledsearch;
var analyticsSent;
var nrofsearches;
var searchSent;
var suggestSent;
var topQueriesSent;
var dqUsed;
var lqUsed;
var filterFieldUsed;
var partialMatchUsed;
var contextUsed;
var alertsError;
var analyticsToken;
var searchToken;


let processDetail = (data) => {
  let lines = data.lines.map(line => {

    let isValidCssClass = '';
    if (line.expected !== undefined) {
      let isValid = false;
      if (line.expected.test) {
        isValid = line.expected.test(line.value);
      }
      else {
        isValid = (line.value === line.expected);
      }

      isValidCssClass = 'line-valid-' + isValid;
    }

    return `<tr class="${isValidCssClass}">
        <td class="line-message">${line.label}</td>
        <td class="line-result">${line.value}</td>
      </tr>`;
  });

  let score = createWheel(data);

  return `<ul class="collapsible" data-collapsible="expandable">
      <li>
          <button type="button" class="collapsible-header active btn with-icon">
              <div class="msg">
                ${data.title}
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
  let scores = data.map(createWheel);
  document.getElementById('scores').innerHTML = scores.join('\n');

  let details = data.map(processDetail);
  document.getElementById('details').innerHTML = details.join('\n');

  $('#details .collapsible').collapsible();

  $('#loading-main').hide();
};


document.addEventListener('DOMContentLoaded', function () {
  myenabledsearch = false;
  $('#getReport').click(getNumbers);
  $('#setSearchTracker').click(toggleTracker);
  $('#reset').click(reset);
});


function getReport() {
  //first get a screenshot, the next event will be gathering the numbers, then the analyzePage
  chrome.runtime.sendMessage({ type: 'getScreen' });
}

function toggleTracker() {
  //first get a screenshot, the next event will be gathering the numbers, then the analyzePage
  myenabledsearch = !myenabledsearch;
  $('#setSearchTracker').text( myenabledsearch ? 'Search is being tracked' : 'Enable Searchtracker');
  chrome.runtime.sendMessage({ type: 'enablesearch', enabled: myenabledsearch });
}

function reset() {
  //reset all parameters
  chrome.runtime.sendMessage({ type: 'reset' });
}

function getNumbers() {
  chrome.runtime.sendMessage({ type: 'getNumbers' });
}

if (chrome && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(
    function (reportData/*, sender, sendResponse*/) {

      if (reportData.type === 'gotScreen') {
        $('#myscreenimage').attr('src', reportData.src);
        getNumbers();
      }
      if (reportData.type === 'gotNumbers') {
        analyticsSent = reportData.analyticsSent;
        nrofsearches = reportData.nrofsearches;
        searchSent = reportData.searchSent;
        suggestSent = reportData.suggestSent;
        topQueriesSent = reportData.topQueriesSent;
        dqUsed = reportData.dqUsed;
        lqUsed = reportData.lqUsed;
        filterFieldUsed = reportData.filterFieldUsed;
        partialMatchUsed = reportData.partialMatchUsed;
        contextUsed = reportData.contextUsed;
        alertsError = reportData.alertsError;
        analyticsToken = reportData.analyticsToken;
        searchToken = reportData.searchToken;
        processReport([{
          title: "Overall",
          value: 31, max: 60,
          lines: [
            { label: "# of search executed (should be 1)", value: nrofsearches, expected: 1 },
            { label: "Search Events sent using our api?", value: searchSent, expected: true },
            { label: "Analytics sent?", value: analyticsSent, expected: true },
            { label: "Using search as you type (degrades performances)", value: false, expected: false },
            { label: "Using ML Powered Query Completions", value: topQueriesSent, expected: true },
          ]
        }]);
        //chrome.tabs.sendMessage(currentTab, { analyzePage: true });
      }
      if (reportData && reportData.length && reportData[0].value && reportData[0].max && reportData[0].title) {
        processReport(reportData);
      }
    }
  );

  document.addEventListener("DOMContentLoaded", function () {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      var activeTab = tabs[0];
      currentTab = activeTab.id;
      //chrome.tabs.sendMessage(activeTab.id, { analyzePage: true });
    });
  });
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
