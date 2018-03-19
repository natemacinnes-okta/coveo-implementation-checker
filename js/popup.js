let processDetail = (data)=>{
  let lines = data.lines.map(line=>{

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
let processReport = (data)=>{
  let scores = data.map(createWheel);
  document.getElementById('scores').innerHTML = scores.join('\n');

  let details = data.map(processDetail);
  document.getElementById('details').innerHTML = details.join('\n');

  $('#details .collapsible').collapsible();
};


/**
 * Sample - Should be replaced by a message handler responding to messages from content.js
 */
setTimeout( ()=>{
  processReport([{
    title: "General",
    value: 21, max: 60,
    lines: [
      { label: "JS UI version (should be 2.3679)", value: "2.3679.4", expected: /^2\.3679/ },
      { label: "Integrated in UI", value: "Unknown" },
      { label: "Pagesize in kB:", value: 3154 },
    ]
  },{
    title: "Performance",
    value: 31, max: 60,
    lines: [
      { label: "# of search executed (should be 1)", value: 0, expected: 1 },
      { label: "Search Events sent using our api?", value: false, expected: true },
      { label: "Analytics sent?", value: false, expected: true },
      { label: "Using search as you type (degrades performances)", value: false, expected: false },
      { label: "Using ML Powered Query Completions", value: false, expected: true },
    ]
  },{
    title: "Implementation",
    value: 46, max: 60,
    lines: [
      { label: "Using state in code (more complicated)", value: true, expected: false },
      { label: "Using partial match (more finetuning needed)", value: false, expected: false },
    ]
  }]);
});
