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
  let scores = data.map(createWheel);
  document.getElementById('scores').innerHTML = scores.join('\n');

  let details = data.map(processDetail);
  document.getElementById('details').innerHTML = details.join('\n');

  $('#details .collapsible').collapsible();

  $('#loading-main').hide();
};


if (chrome && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(
    function (reportData/*, sender, sendResponse*/) {
      if (reportData && reportData.length && reportData[0].value && reportData[0].max && reportData[0].title) {
        processReport(reportData);
      }
    }
  );

  document.addEventListener("DOMContentLoaded", function () {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, { analyzePage: true });
    });
  });
}
