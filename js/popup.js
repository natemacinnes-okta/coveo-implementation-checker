'use strict';
// jshint -W110, -W003
/*global chrome, createWheel*/

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
  document.getElementById('details').innerHTML = '<pre>' + JSON.stringify(data, 2, 2) + '</pre>';
  // let scores = data.map(createWheel);
  // document.getElementById('scores').innerHTML = scores.join('\n');

  // let details = data.map(processDetail);
  // document.getElementById('details').innerHTML = details.join('\n');

  // $('#details .collapsible').collapsible();

  $('#loading').hide();
};

let processState = (data) => {
  console.log('processState: ', data);
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
  document.getElementById('details').innerHTML = '';

  chrome.runtime.sendMessage({ type: 'getScreen' });
}

let getState = () => {
  chrome.runtime.sendMessage({ type: 'getState' }, null, processState);
};

function toggleTracker(e) {
  let myenabledsearch = $('#setSearchTracker input').prop('checked') ? true : false;
  chrome.runtime.sendMessage({ type: 'enablesearch', enable: myenabledsearch });
}

function reset() {
  //reset all parameters
  $('#instructions').show();
  $('#myscreenimage').css('background-image', 'none').hide();
  $('#setSearchTracker input').prop('checked', false);
  document.getElementById('details').innerHTML = '';

  chrome.runtime.sendMessage({ type: 'reset' }, null, getState);
}

function getNumbers() {
  chrome.runtime.sendMessage({ type: 'getNumbers' });
}

function setScreenShot(dataurl) {
  $('#myscreenimage').css('background-image', 'url(' + dataurl + ')').show();
}

if (chrome && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(
    function (reportData/*, sender, sendResponse*/) {

      if (reportData.type === 'gotScreen') {
        setScreenShot(reportData.src);
        getNumbers();
      }
      else if (reportData.type === 'gotNumbers') {
        processReport(reportData);
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