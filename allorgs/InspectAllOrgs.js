// npm install puppeteer
// npm i -S image-hash

const request = require('request');
var pHash = require("image-hash");
const qs = require('querystring');
const fs = require('fs');
const nrofdaysAnalytics = 14;
const debug = true;
const puppeteer = require('puppeteer');
let browser; //= await puppeteer.launch();

class InspectAllOrganizations {

  constructor() {
    let settings = require('../secrets/settings.json');
    this.apiKey = settings.apiKey;
    this.baseUrl = settings.baseUrl;
    this.baseUrlAnalytics = settings.baseUrlAnalytics;
    //this.browser = null;
    //this.page = null;

  }
  async initPuppet() {
    browser = await puppeteer.launch();
  }

  getOptions() {
    return {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json; charset="UTF-8"',
      }
    };
  }

  // function to encode file data to base64 encoded string
  getImage64(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
  }
  hammingDistance(str1, str2) {
    /* If the strings are equal, bail */
    if (str1 === str2) {
      return 0;
    }

    /*If the lengths are not equal, there is no point comparing each character.*/
    if (str1.length != str2.length) {
      return false;
    }

    /*loop here to go through each position and check if both strings are equal.*/
    var numDiffChar = 0;
    var index = 0;
    while (index < str1.length) {
      if (str1.charAt(index) !== str2.charAt(index)) {
        numDiffChar++;
      }
      index++;
    }
    return numDiffChar;
  }

  myimageHash(file) {
    let mydata = 0;
    let promise = new Promise((resolve) => {

      let mydata2 = pHash.imageHash(file, 32, true, (error, data) => {
        //if (error) throw error;
        //console.log(data);
        mydata = data;
        resolve(mydata);
        //return Promise.resolve(mydata);
        // 0773063f063f36070e070a070f378e7f1f000fff0fff020103f00ffb0f810ff0
      });
    });
    return promise;
    //return mydata;
  }

  createWheel(data) {
    let r = 45, C = 2 * Math.PI * r;
    let v = (data.value / (data.max || 100));
    let perc = Math.round(v * 100);
    let cssClass = 'bad';
    if (data.smallerIsBetter) {
      cssClass = 'good';
      if (v >= 0.75) {
        cssClass = 'bad';
      }
      else if (v >= 0.5) {
        cssClass = 'warn';
      }
      if (data.value >= 1) {
        cssClass = 'bad';
      }
    }
    else {
      cssClass = 'bad';
      if (v >= 0.75) {
        cssClass = 'good';
      }
      else if (v >= 0.5) {
        cssClass = 'warn';
      }
    }
    v = C * v;

    return `<div class="wheel ${cssClass}"><a href="#${data.title}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle class="back-ring" cx="50" cy="50" r="${r}" stroke-width="8"></circle>
        <circle class="value" fill="none" cx="50" cy="50" r="${r}" stroke-width="8" stroke-dasharray="${v} ${C}" ></circle>
        <text
          text-anchor="middle"
          font-size="30" font-family="Lato"
          transform="rotate(90 50,50)"
          lengthAdjust="spacingAndGlyphs" x="50" y="62">${perc}%</text>
      </svg>
      <div class="wheel-title"><span class="wheel-main">${data.title || ''}</span><br>${data.value}/${data.max}<span class="wheel-sub">${data.subtitle}</span></div></a>
      </div>`;
  }

  getHTML(title, scores, details, images) {
    let html = `<!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lato">
  <link rel="stylesheet" href="http://coveo.github.io/vapor/dist/css/CoveoStyleGuide.css">
  <link rel="stylesheet" href="https://static.cloud.coveo.com/styleguide/v2.10.0/css/CoveoStyleGuide.css">
  <style type="text/css">
  body.coveo-styleguide {display:block; padding: 0 30px 30px;}
  div.wheel {display: inline-block; text-align: center; margin: 5px 10px; cursor: default; width: 130px;}
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

h4 {
  font-size: 17px;
  background-color: lightyellow;
  font-weight: bold;
}

.mytable {
  border: none;
  padding: 5px;
}

.myexpr {
  width: 200px;
}

.myexprval{
  width: 500px;
  font-weight: bold;
  font-size: 0.9em;
}

.myexprcomm{
  font-style: italic;
  padding-left: 15px !important;
}
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
  .coveo-styleguide .collapsible .collapsible-body {display: block;padding: 0;}
  .coveo-styleguide table:not(.datepicker-table) td.line-result { text-align: left; font-weight: bold; vertical-align: top;}
  .coveo-styleguide table:not(.datepicker-table) th:last-child, .coveo-styleguide table:not(.datepicker-table) td:last-child {padding-left: 25px;}
  tr td.line-message small {vertical-align: top !important;font-size: small; color: #1d4f76; display: block; /*padding-left:25px;*/}
  tr td.line-mandatory {vertical-align: top !important; text-align: right; width: 48px !important;padding-right: 1px !important;padding-left: 1px !important;}
  tr td.line-indicator {  border-right: none;  vertical-align: top !important;  padding-right: 1px !important;padding-left: 1px !important;}
  tr td.line-message {vertical-align: top !important; text-align: right; width: 350px; padding-left: 1px !important;vertical-align: top !important;}
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
  <div id="globalReport">
      <div id="scores">${scores}</div>
      <div id="legend">
        <table style='padding: 0;'>
          <tr><td><span style='font-weight:bold;color: #009830'>&#x2605;</span> Mandatory item</td></tr>
          <tr><td><span style='font-weight:bold;color: #ce3f00'>&#x2605;</span> Mandatory item, FAILED, should be corrected asap !!</td></tr>
        </table>
      </div>

      <div id="details">${details}</div>
      <div id="myscreenimage">${images}</div>
    </div>
  </body>
  </html>`;
    return html;
  }


  processDetail(section, data, tests) {
    let lines = section.attributes.map(attr => {

      let isValidCssClass = '',
        value = data[attr.key],
        hint = '';
      //Check if value is undefined, if so, make it empty string
      if (value == undefined) {
        value = '';
      }
      let additionalClass = '';
      let validColor = '';
      let validIcon = '';
      let mandatoryIcon = '';
      let mandatory = false;
      if (Array.isArray(value)) {
        value = value.join('<BR>');
      }
      if (attr.additionalClass !== undefined) {
        additionalClass = attr.additionalClass;
      }
      if (attr.mandatory !== undefined) {
        mandatory = true;
      }
      //Always show hints
      if (attr.hint) {
        // show hints when invalid.
        if (attr.ref) {
          hint = `${attr.hint} <a href="${attr.ref}" target="_blank">&#x2753;</a>`;
        }
        else {
          hint = `${attr.hint}`;
        }
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
        }

        validColor = `color: ${isValid ? '#009830' : '#ce3f00'}`;
        validIcon = `<span style="font-weight:bold;${validColor}">${isValid ? '&#x2713;' : '&#x2718;'}</span>`;

        isValidCssClass = 'valid-' + isValid;
        if (mandatory) {
          mandatoryIcon = `<span class='${isValidCssClass}'>&#x2605;</span>`;
          //check if mandoatory is failed, else we need to set the flag of a total failure
          if (!isValid) {
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

    let score = this.createWheel({ title: section.title, value: tests.passed, max: tests.total });

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
  }

  processReport(data) {
    let sections = [];
    sections = [
      {
        title: 'General information', label: 'General', notInMain: true, attributes: [
          { key: 'name', label: 'Org Name', hint: '', expected: { test: value => (value != '') } },
          { key: 'org', label: 'Org ID', hint: '', expected: { test: value => (value != '') } },
          { key: 'accountName', label: 'Account Name', hint: '', expected: { test: value => (value != '') } },
          { key: 'productType', label: 'Product Type', hint: '', expected: { test: value => (value != '') } },
          { key: 'productEdition', label: 'Product Edition', hint: '', expected: { test: value => (value != '') } },
          { key: 'version', label: 'Org Cloud Version', hint: '', expected: { test: value => (value != '') } },
          { key: 'theDate', label: 'Inspection Date', hint: '', expected: { test: value => (value != '') } },
          {
            key: 'docsfromsources', label: 'Nr of Documents (M)', hint: '<40M', ref: '', expected: {
              test: value => (value < 40)
            }

          },
          {
            key: 'regions', label: 'Regions deployed', hint: '', ref: ''
          },
          {
            key: 'searchUrls', label: 'Search Urls', hint: 'From Analytics', ref: ''
          },
          {
            key: 'accessibleUrls', label: 'Accessible Search Urls', hint: 'From Analytics', ref: ''
          },
          {
            key: 'infra_machine', label: 'Machine Size', hint: 'AWS Machine Size', ref: 'https://aws.amazon.com/ec2/instance-types/',
          },
          {
            key: 'infra_slices', label: 'Nr of Index-parts', hint: '(Slices) Default to 1, can handle 20 M documents', ref: '', expected: {
              test: value => (value == 1)
            }

          },
          {
            key: 'infra_mem_free', label: 'Free Memory (%)', hint: 'At least 40%', ref: '', expected: {
              test: value => (value > 40)
            }

          },
          {
            key: 'infra_disk_free', label: 'Free Disk (%)', hint: 'At least 20%', ref: '', expected: {
              test: value => (value > 20)
            }

          },

        ]
      },
      {
        title: 'Content - Sources', label: 'Sources', attributes: [
          {
            key: 'nrofsources', label: 'Number of Sources', mandatory: true, hint: 'Should be <100.', ref: '', expected: {
              test: value => (value < 100 && value > 0)
            }
          },
          { key: 'types', notForTotal: true, mandatory: false, label: 'Types of Connectors Used', hint: '', ref: '' },
          { key: 'sourceWebWarning', mandatory: true, label: 'Contains Web sources with to much docs (>100K)', hint: '', ref: '' },
          { key: 'containspush', notForTotal: true, mandatory: false, label: 'Contains Push sources', hint: '', ref: '' },
          { key: 'containsonprem', notForTotal: true, mandatory: false, label: 'Contains Crawling Modules', hint: '', ref: '' },

          {
            key: 'nrofnoschedulessources', mandatory: true, label: 'Number of Sources Without Schedules', hint: 'Enable schedules, or remove them', ref: 'https://docs.coveo.com/en/1933', expected: {
              test: value => (value == 0)
            }
          },
          {
            key: 'noscheduledsources', mandatory: false, label: 'Sources without schedule', hint: 'Enable schedules, or remove them', ref: 'https://docs.coveo.com/en/1933', expected: {
              test: value => (value.length == 0)
            }
          },
          {
            key: 'numberofsecurities', label: 'Nr of Security Indentities', hint: '<15.000', ref: 'https://docs.coveo.com/en/1527', expected: {
              test: value => (value < 15000)
            }
          },
          {
            key: 'securityerrors', label: 'Nr of Security Indentity errors', hint: 'Check your Security Identities. See Details', ref: 'https://docs.coveo.com/en/1527', expected: {
              test: value => (value == 0)
            }
          },
          {
            key: 'noscheduledsecprov', mandatory: true, label: 'Security providers without Refresh Schedule', hint: 'Add security provider schedule', ref: 'https://docs.coveo.com/en/1998', expected: {
              test: value => (value.length == 0)
            }
          },

        ]
      },


      {
        title: 'Content - Extensions', label: 'Extensions', attributes: [
          { key: 'nrofextensions', notForTotal: true, mandatory: false, label: 'Nr of Extensions', hint: 'Pipeline Extensions', ref: 'https://docs.coveo.com/en/1556' },
          {
            key: 'nrofdisabledextensions', mandatory: true, label: 'Nr of Disabled Extensions', hint: 'Extensions which timeout will automatically be disabled', ref: '', expected: {
              test: value => (value == 0)
            }
          },
          {
            key: 'disabledextensions', label: 'Disabled Extensions', hint: 'Investigate them, probably due to timeouts.', ref: 'https://docs.coveo.com/en/1581', expected: {
              test: value => (value.length == 0)
            }
          },
          {
            key: 'nrerrorextensions', mandatory: true, label: 'Nr of Extensions with errors', hint: 'Check your script syntax', ref: '', expected: {
              test: value => (value == 0)
            }
          },
          {
            key: 'errorextensions', label: 'Extensions with Errors', hint: 'Check your script syntax', ref: 'https://docs.coveo.com/en/1581', expected: {
              test: value => (value.length == 0)
            }
          },
          {
            key: 'nrslowextensions', mandatory: true, label: 'Nr of Slow executing Extensions', hint: 'Improve your script', ref: '', expected: {
              test: value => (value == 0)
            }
          },
          {
            key: 'slowextensions', label: 'Slow Extensions (>1s)', hint: 'Improve your script', ref: 'https://docs.coveo.com/en/1581', expected: {
              test: value => (value.length == 0)
            }
          },
          {
            key: 'nrtimeoutextensions', mandatory: true, label: 'Nr of Extensions with a Timeout', hint: '', ref: '', expected: {
              test: value => (value == 0)
            }
          },
          {
            key: 'timeoutextensions', label: 'Extensions with a Timeout', hint: 'Improve your script', ref: 'https://docs.coveo.com/en/1581', expected: {
              test: value => (value.length == 0)
            }
          },
        ]
      }, {
        title: 'Search', label: 'Search', attributes: [
          {
            key: 'UsingSearchAsYouType', mandatory: true, label: 'Using Search As You Type', hint: 'Search as you type will slow down performance', ref: 'https://docs.coveo.com/en/1984', expected: false
          },
          {
            key: 'ControlFacet', mandatory: true, label: 'Using Facets', hint: 'Facetted search improves user experience', ref: 'https://docs.coveo.com/en/1984', expected: {
              test: value => (value > 0)
            }
          },
          {
            key: 'ControlInterface', label: 'Using Different Interfaces', hint: '', ref: 'https://docs.coveo.com/en/2678', expected: {
              test: value => (value > 0)
            }
          },
          {
            key: 'ControlQuerySuggest', mandatory: true, label: 'Using QuerySuggest', hint: 'Query Suggest improves user experience', ref: 'https://docs.coveo.com/en/340', expected: {
              test: value => (value > 0)
            }
          },
          {
            key: 'ControlFieldQS', mandatory: true, label: 'Using FieldQuerySuggest', hint: 'Field Query Suggest slows down performance', ref: 'https://docs.coveo.com/en/504', expected: {
              test: value => (value == 0)
            }
          },
          {
            key: 'ControlSort', label: 'Using Sorting', hint: '', ref: 'https://docs.coveo.com/en/1852', expected: {
              test: value => (value > 0)
            }
          },
          {
            key: 'ControlPaging', label: 'Using Paging', hint: '', ref: 'https://docs.coveo.com/en/1852', expected: {
              test: value => (value > 0)
            }
          },
          {
            key: 'ControlOpening', label: 'Using Open/Click Result', hint: '', ref: 'https://docs.coveo.com/en/1852', expected: {
              test: value => (value > 0)
            }
          },
          {
            key: 'nrofpipelines', mandatory: true, label: 'Nr of Query Pipelines', hint: 'At least 2, not more than 15', ref: 'https://docs.coveo.com/en/1791', expected: {
              test: value => (value >= 2 && value <= 15)
            }
          },
          {
            key: 'qpl_with_filters', mandatory: true, label: 'Pipelines with a filter', hint: 'If you are using a filter to restrict the scope, make sure the searchtoken contains the querypipeline.', ref: 'https://docs.coveo.com/en/56', expected: {
              test: value => (value.length == 0)
            }
          },
          {
            key: 'models_platformVersion', label: 'Machine Learning, Platform Version', hint: 'Use Machine Learning, latest version', ref: 'https://docs.coveo.com/en/2816', expected: 2
          },
          {
            key: 'usedPipelines', label: 'Used Pipelines', hint: 'Pipelines used in search', ref: 'https://docs.coveo.com/en/56', expected: {
              test: value => (value.length > 0)
            }
          },
          {
            key: 'mlquerysuggest', label: 'Machine Learning, Query Suggest Enabled', hint: 'Use Machine Learning, Query Suggest. See Details', ref: 'https://docs.coveo.com/en/1838', expected: true
          },
          {
            key: 'mlart', label: 'Machine Learning, Relevancy Tuning Enabled', hint: 'Use Machine Learning, Automatic Relevancy Tuning. See Details', ref: 'https://docs.coveo.com/en/1519', expected: true
          },
          {
            key: 'mlrecommendation', label: 'Machine Learning, Recommendations Enabled', hint: 'Use Machine Learning, Recommendations. See Details', ref: 'https://docs.coveo.com/en/1573', expected: true
          },
          {
            key: 'mldne', label: 'Machine Learning, Dynamic Navigation Enabled', hint: 'Use Machine Learning, Dynamic Navigation. See Details', ref: 'https://docs.coveo.com/en/2816', expected: true
          },
          {
            key: 'nrofthesaurus', label: 'Nr of Thesaurus entries', hint: 'Do not use to much', ref: 'https://docs.coveo.com/en/1738', expected: {
              test: value => (value < 500)
            }
          },
          {
            key: 'nrofqre', label: 'Nr of Ranking Expressions', hint: 'The more, the harder to manage, ranking will suffer', ref: 'https://docs.coveo.com/en/1690', expected: {
              test: value => (value <= 50)
            }
          },
          {
            key: 'nroffeatured', label: 'Nr of Featured Results', hint: 'The more, the harder to manage', ref: 'https://docs.coveo.com/en/1961', expected: {
              test: value => (value <= 50)
            }
          },

        ]
      },
      {
        title: 'Analytics', label: 'Analytics', attributes: [
          {
            key: 'det_analyticsSent', label: 'Analytics Sent', hint: 'Search & Open document Analytics calls are present', mandatory: true, ref: '', expected: true
          },
          {
            key: 'EmptyHubs', label: 'Empty Hubs', hint: 'Make sure you set the OriginLevel1 in your calls', mandatory: true, ref: '', expected: false
          },
          {
            key: 'UniqueVisit', label: 'Nr of Unique Visits', hint: 'Last ' + nrofdaysAnalytics + ' days', ref: '',
          },
          {
            key: 'PerformSearch', label: 'Nr of Searches', hint: 'Last ' + nrofdaysAnalytics + ' days', ref: '',
          },
          {
            key: 'SearchWithClick', label: 'Nr of Searches with click', hint: 'Last ' + nrofdaysAnalytics + ' days', ref: '', expected: {
              test: value => (value > 10000)
            }
          },
          {
            key: 'ClickThroughRatio', label: 'Click Through Ratio (%)', mandatory: true, hint: 'Last ' + nrofdaysAnalytics + ' days, > 50%', ref: 'https://docs.coveo.com/en/2041', expected: {
              test: value => (value > 50)
            }
          },
          {
            key: 'AverageClickRank', label: 'Click Rank', mandatory: true, hint: 'Last ' + nrofdaysAnalytics + ' days, <3', ref: 'https://docs.coveo.com/en/2041', expected: {
              test: value => (value < 3)
            }
          },
          {
            key: 'RefinementQuery', label: 'Nr of Refinement Searches', hint: 'Last ' + nrofdaysAnalytics + ' days', ref: ''
          },
          {
            key: 'DocumentView', label: 'Nr of Document Views', hint: 'Last ' + nrofdaysAnalytics + ' days', ref: ''
          },
          {
            key: 'AvgResponse', label: 'Avg Response Time', mandatory: true, hint: 'Last ' + nrofdaysAnalytics + ' days, <500', ref: 'https://docs.coveo.com/en/1948', expected: {
              test: value => (value < 500)
            }
          },

        ]
      },
    ];

    let sectionCharts = [];
    let html = [];
    sections.forEach(section => {
      let tests = { passed: 0, total: 0, mandatoryfail: false };

      html.push(this.processDetail(section, data, tests));
      let subtitle = '<BR><span style="color: #009830;">PASSED</span>';
      data['Score_' + section.label] = 'PASSED';
      if (tests.mandatoryfail) {
        data['Score_' + section.label] = 'FAILED';
        subtitle = '<BR><span style="color: #ce3f00;">FAILED</span>';
      }
      if (section.notInMain === undefined) {
        sectionCharts.push({ title: section.label, subtitle: subtitle, value: tests.passed, max: tests.total });
      }
    });

    let scores = sectionCharts.map(this.createWheel);
    let maintitle = "Organization Report<br>" + data.name;

    //document.getElementById('scores').innerHTML = '<h2>' + maintitle + '</h2>' + scores.join('\n');
    /*
        if (data.errors != "" && data.errors !== undefined) {

          data.details += "<hr><h4 style='color: red;  font-size: 20px;'>Errors during processing:</h4>" + data.errors;
        }
        if (data.badquery != "") {

          data.details += "<hr><h4 style='color:red'>Queries which need attention:</h4>" + data.badquery + "";
        }
        if (data.details_facettolong != "") {

          data.details += "<hr><h4>Facet values which are too long:</h4>" + data.details_facettolong;
        }
        if (data.details_alwaysthesame != "") {

          data.details += "<hr><h4>Fields where the end of the content is the same:</h4>" + data.details_alwaysthesame;
        }
        */
    if (data.details_pipelines != "") {

      data.details += "<hr><h4>Search - Query Pipelines which need attention:</h4>" + data.details_pipelines;
    }
    if (data.usagedetails != "" && data.usagedetails !== undefined) {
      data.details = data.usagedetails + "<br>" + data.details;
    }
    let details = `<ul id="Details" class="collapsible" data-collapsible="expandable">
  <li>
      <button type="button" class="collapsible-header active btn with-icon">
          <div class="msg">
            Details
          </div>
      </button>
      <div class="collapsible-body">
        <table><tbody><tr><td style='padding-left: 1px;max-width: 780px;word-break: break-word;'>
          ${data.details}
        </tbody></td></tr></table>
      </div>
  </li>
  </ul>`;
    //document.getElementById('details').innerHTML = html.join('\n') + details;
    let images = '';
    data.thesearchurl.map(urls => {
      images += `<img src="data:image/gif;base64,${this.getImage64('results/' + urls.img + '.png')}"/><br>`;
      images += 'Open search page: <a target="_blank" href="' + urls.searchurl + '">Open</a><br><br>';
    });
    return this.getHTML(maintitle, '<h2>' + maintitle + '</h2>' + scores.join('\n'), html.join('\n') + details, images);

  }

  async executeCall(url, report, title, err, typeReq, auth, fd) {
    const callApi = require('./callApi');
    const data = [];
    const options = {
      url: url,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + auth
      }
    }
    return callApi(options, data).then(response => {
      if (response.response.statusCode == 200) {
        return JSON.parse(response.body);
      } else {
        let parsedBody = JSON.parse(response.body);
        //console.log(response);
        return (undefined);
      }
    });
  }

  getSourceInfo(report) {
    let url = this.baseUrl + '/rest/organizations/' + report.org + '/sources';
    let sources = 0;
    let disabled = 0;
    let promise = new Promise((resolve) => {
      this.executeCall(url, report, "Getting Source Info", "thereAreErrorsSources", "GET", this.apiKey).then(function (data) {
        try {
          //console.log('returned getSourceInfo');
          if (data) {
            const utils = require('./utils');
            report.docsfromsources = 0;
            if (report.version == "V2") {
              report.nrofsources = data.length;
              let sourceTypes = data.map(source => source.sourceType);
              report.types = [...new Set(sourceTypes)].sort(utils.caseInsensitiveSort);
              //console.log(report.types);
              report.pushnames = data.filter(source => { if (source.pushEnabled) return source.name; });
              report.containsonprem = data.filter(source => { if (source.onPremisesEnabled) return source.name; }).length > 0;
              report.containspush = data.filter(source => { if (source.pushEnabled) return source.name; }).length > 0;
              report.details += "<hr><h4>Source Information:</h4>";
              report.details += "<table><tr><th><b>Source</b></th><th style='text-align:right'><b>Nr of Docs</b></th></tr>"
              data.map(source => {
                //Check for Websources
                if (source.sourceType == "WEB2" && source.information.numberOfDocuments > 100000) {
                  report.sourceWebWarning = true;
                }
                report.docsfromsources += source.information.numberOfDocuments;
                report.details += "<tr><td>" + source.name + "</td><td style='text-align:right'>" + source.information.numberOfDocuments.toLocaleString() + "</td></tr>";
              });
              report.details += "</table>"
              report.sourceids = data.map(source => { let obj = { id: source.id, name: source.name }; return obj; });
            }
            else {
              report.nrofsources = data.sources.length;
              let sourceTypes = data.sources.map(source => source.type);
              report.types = [...new Set(sourceTypes)].sort(utils.caseInsensitiveSort);
              report.pushnames = [];
              report.containsonprem = false;
              report.containspush = false;
              report.details += "<hr><h4>Source Information:</h4>";
              report.details += "<table><tr><th><b>Source</b></th><th style='text-align:right'><b>Nr of Docs</b></th></tr>"
              data.sources.map(source => {
                report.docsfromsources += source.numberOfDocuments;
                report.details += "<tr><td>" + source.name + "</td><td style='text-align:right'>" + source.numberOfDocuments.toLocaleString() + "</td></tr>";
              });
              report.details += "</table>"
              report.sourceids = data.sources.map(source => { let obj = { id: source.id, name: source.name }; return obj; });

            }
            report.docsfromsources = (report.docsfromsources / 1000000).toFixed(2);
          }
        }
        catch{
        }

        resolve(report);
      });
    });
    return promise;
  }

  getSourceSchedules(report, id) {
    let url = this.baseUrl + escape('/rest/organizations/' + report.org + '/sources/' + id + '/schedules');
    let promise = new Promise((resolve) => {
      this.executeCall(url, report, "Getting Source Schedules Info", "thereAreErrorsSources", "GET", this.apiKey).then(function (data) {
        if (debug) {
          console.log('In Get Source Schedules');
          console.log(data);
        }
        if (data) {
          //console.log(data.length);
          resolve(data.length != 0);
        }
        else {
          resolve(false);
        }
      });
    });
    return promise;
  }


  getNodeInfo(report) {
    let url = this.baseUrl + '/rest/organizations/' + report.org + '/indexes';
    let promise = new Promise((resolve) => {
      if (report.version == "V2") {
        this.executeCall(url, report, "Getting Organization Info", "thereAreErrorsOrg", "GET", this.apiKey).then(function (data) {
          if (data) {
            try {
              report.infra_machine = data[0].machineSpec.architecture;
              report.infra_storage = data[0].machineSpec.storageSpec.storageType;
              report.infra_storage_size = data[0].machineSpec.storageSpec.sizeInGigabytes;
              report.infra_slices = data[0].status.stats.numberOfSlices;
              report.infra_indexes = data.length;
              report.infra_mem_free = Math.round(100 - (data[0].status.stats.totalMemoryUsed / (data[0].status.stats.totalPhysicalMemory / 100)));
              report.infra_disk_free = Math.round(100 - (data[0].status.stats.diskSpaceUsed / ((data[0].status.stats.diskSpaceUsed + data[0].status.stats.remainingDiskSpace) / 100)));
            }
            catch{

            }
          }
          resolve(report);
        });
      }
      else {
        resolve(report);
      }
    });
    return promise;
  }

  getSecProvSchedules(report, id) {
    let url = this.baseUrl + escape('/rest/organizations/' + report.org + '/securityproviders/' + id + '/schedules');
    let promise = new Promise((resolve) => {
      this.executeCall(url, report, "Getting Security Providers Schedules Info", "thereAreErrorsSources", "GET", this.apiKey).then(function (data) {
        if (data) {
          resolve(data.length != 0);
        }
        else {
          resolve(false);
        }
      });
    });
    return promise;
  }

  getSecurityInfo(report) {
    let url = this.baseUrl + '/rest/organizations/' + report.org + '/securityproviders';
    let requests = [];
    let promise = new Promise((resolve) => {
      if (report.version == "V2") {
        this.executeCall(url, report, "Getting Security Providers Info", "thereAreErrorsSources", "GET", this.apiKey).then(function (data) {
          if (data && data.map) {
            try {
              report.securityerrors = data.filter(sec => { if (sec.statistics.numberOfEntitiesInError > 0) return sec.name; }).length;
              data.map(sec => { report.numberofsecurities += sec.statistics.totalNumberOfEntities; });
              if (report.securityerrors > 0) {
                report.details += "<hr><h4>Security Identity Providers with errors:</h4>";
                data.filter(sec => { if (sec.statistics.numberOfEntitiesInError > 0) return sec.name; }).map((sec) => {
                  report.details += sec.name + ": <b>" + sec.statistics.numberOfEntitiesInError + "</b> errors<BR>";
                });
              }
              requests = data.map((sec) => {
                return new Promise((resolve) => {
                  inspect.getSecProvSchedules(report, sec.id).then(function (datas) {
                    if (!datas) {
                      report.noscheduledsecprov.push(sec.name);
                    } else {
                      if (data.map) {
                        let enabled = false;
                        data.map((sec) => {
                          if (sec.enabled) enabled = true;
                        });
                        if (!enabled) {
                          report.noscheduledsecprov.push(sec.name);
                        }
                      }
                    }
                    resolve();
                  });
                });
              });

            }
            catch{

            }
          }
          //Execute the requests
          Promise.all(requests).then(() => {
            resolve(report);
          });
        });
      }
      else {
        resolve(report);
      }
    });
    return promise;
  }

  getExtensionInfo(report) {
    let url = this.baseUrl + '/rest/organizations/' + report.org + '/extensions';
    let promise = new Promise((resolve) => {
      const utils = require('./utils');
      if (report.version == "V2") {
        this.executeCall(url, report, "Getting Extensions Info", "thereAreErrorsExtensions", "GET", this.apiKey).then(function (data) {
          if (data && data.map) {
            report.nrofextensions = data.length;
            report.disabledextensions = data.filter(source => { if (!source.enabled) return source.name; }).map(source => source.name).sort(utils.caseInsensitiveSort);
            report.nrofdisabledextensions = report.disabledextensions.length;
            report.nrslowextensions = data.filter(source => { if (source.status.dailyStatistics.averageDurationInSeconds > 1) return source.name; }).length;
            report.nrerrorextensions = data.filter(source => { if (source.status.dailyStatistics.numberOfErrors > 0) return source.name; }).length;
            report.nrtimeoutextensions = data.filter(source => { if (source.status.dailyStatistics.numberOfTimeouts > 5) return source.name; }).length;
            report.slowextensions = data.filter(source => { if (source.status.dailyStatistics.averageDurationInSeconds > 1) return source.name; }).map(source => source.name).sort(utils.caseInsensitiveSort);
            report.timeoutextensions = data.filter(source => { if (source.status.dailyStatistics.numberOfTimeouts > 5) return source.name; }).map(source => source.name).sort(utils.caseInsensitiveSort);
            report.errorextensions = data.filter(source => { if (source.status.dailyStatistics.numberOfErrors > 0) return source.name; }).map(source => source.name).sort(utils.caseInsensitiveSort);
            if (data.filter(source => { if (source.status.dailyStatistics.averageDurationInSeconds > 0) return source.name; }).length > 0) {
              report.details += "<hr><h4>Average execution time Extensions:</h4>";
              data.filter(source => { if (source.status.dailyStatistics.averageDurationInSeconds > 0) return source.name; }).map((source) => {
                report.details += source.name + ": <b>" + source.status.dailyStatistics.averageDurationInSeconds.toFixed(2) + "</b> seconds<BR>";
              });
            }
          }
          resolve(report);
        });
      }
      else {
        resolve(report);
      }
    });
    return promise;
  }

  getAnalyticsMetricsInfo(report) {
    var now = new Date();
    var from = new Date();
    from = from.setDate(now.getDate() - nrofdaysAnalytics);
    var fromlast = new Date(from);
    var to = new Date();

    let froms = '&from=' + fromlast.toISOString() + '&to=' + to.toISOString();
    //console.log(froms);
    //https://platformdev.cloud.coveo.com/rest/ua/v15/stats/globalData?
    //https://platformdev0.cloud.coveo.com/rest/ua/v15/stats/combinedData
    let url = this.baseUrlAnalytics + '/rest/ua/v15/stats/globalData?m=PerformSearch&m=RefinementQuery&m=average%28actionresponsetime%29&m=UniqueVisitorById&m=UniqueVisit&m=DocumentView&m=AverageClickRank&m=ClickThroughRatio&m=SearchWithClick&tz=Z&i=DAY&bindOnLastSearch=false&org=' + report.org + froms;
    //console.log(url);
    let promise = new Promise((resolve) => {
      this.executeCall(url, report, "Getting Analtyics Metrics Info", "thereAreErrorsSearch", "GET", this.apiKey).then(function (data) {
        if (debug) {
          console.log(data);
        }
        if (data) {
          report.UniqueVisit = data.globalDatas.UniqueVisit.value;

          report.PerformSearch = data.globalDatas.PerformSearch.total;
          report.SearchWithClick = data.globalDatas.SearchWithClick.total;
          report.ClickThroughRatio = (data.globalDatas.ClickThroughRatio.value * 100).toFixed(2);
          report.AverageClickRank = (data.globalDatas.AverageClickRank.value).toFixed(2);
          report.RefinementQuery = data.globalDatas.RefinementQuery.total;
          report.DocumentView = data.globalDatas.DocumentView.total;
          report.AvgResponse = data.globalDatas['average(actionresponsetime)'].value;
          if (report.PerformSearch > 0 && report.DocumentView > 0) {
            report.det_analyticsSent = true;
          }
        }
        resolve(report);
      });
    });
    return promise;
  }



  getModelsInfo(report) {
    let url = this.baseUrl + '/rest/organizations/' + report.org + '/machinelearning/models';
    report.models_platformVersion = 1;
    let promise = new Promise((resolve) => {
      this.executeCall(url, report, "Getting ML Models Info", "thereAreErrorsSearch", "GET", this.apiKey).then(function (data) {
        if (data && data.map) {
          report.models = data;
          if (data[0] != undefined) {
            report.models_platformVersion = data[0].platformVersion;
          }
        }
        resolve(report);
      });
    });
    return promise;
  }


  getLicense(report) {
    let url = this.baseUrl + '/rest/organizations/' + report.org + '/license';
    let promise = new Promise((resolve) => {
      this.executeCall(url, report, "Getting License Info", "thereAreErrorsSearch", "GET", this.apiKey).then(function (data) {
        if (data) {
          if (debug) {
            console.log(data);
          }
          report.productEdition = data.productName + '_' + data.productEdition;
          report.productType = data.productType;
          report.accountName = data.accountName;
          report.accountId = data.accountId;
          if (data.properties.internal != undefined) {
            if (data.properties.internal.defaultInstanceArchitecture != undefined) {
              report.infra_machine = data.properties.internal.defaultInstanceArchitecture;
            }
            if (data.properties.internal.activatedRegions != undefined) {
              report.regions = data.properties.internal.activatedRegions;
            }
          }
        }
        resolve(report);
      });
    });
    return promise;
  }

  getQueryPipelinesInfo(report) {
    let url = this.baseUrl + '/rest/search/admin/pipelines/?organizationId=' + report.org;
    let promise = new Promise((resolve) => {
      this.executeCall(url, report, "Getting Query Pipelines Info", "thereAreErrorsSearch", "GET", this.apiKey).then(function (data) {
        if (data && data.map) {
          report.nrofpipelines = data.length;
          report.pipelines = data;
        }
        resolve(report);
      });
    });
    return promise;
  }

  getQueryPipelinesDetailsResults(report, id, type) {
    let url = this.baseUrl + escape('/rest/search/admin/pipelines/' + id + '/statements') + '?organizationId=' + report.org + '&feature=' + type + "&perPage=200";
    let promise = new Promise((resolve) => {
      this.executeCall(url, report, "Getting Query Pipeline Details for " + type, "thereAreErrorsSearch", "GET", this.apiKey).then(function (data) {
        // console.log(data);
        if (data) {
          resolve(data);
          //return data;
        }
        else {
          resolve(undefined);
          //return (undefined);
        }

      });
    });
    return promise;
  }

  getQueryPipelinesDetailsResultsV2(report, id) {
    let url = this.baseUrl + escape('/rest/search/v2/admin/pipelines/' + id + '/ml/model/associations') + '?organizationId=' + report.org + "&perPage=200";
    let promise = new Promise((resolve) => {
      this.executeCall(url, report, "Getting Query Pipeline Details ", "thereAreErrorsSearch", "GET", this.apiKey).then(function (data) {
        if (data) {
          //    console.log(data);
          resolve(data);
          //return(data);
        }
        else {
          resolve(undefined);
          //return (undefined);
        }

      });
    });
    return promise;
  }

  getQueryPipelinesDetails(json, pipe) {
    //First get Models
    //If models platformVersion==1 use the below
    let QuerySuggest, Recommendation, Ranking;
    if (json.models_platformVersion == 1) {
      QuerySuggest = new Promise((resolve) => {
        this.getQueryPipelinesDetailsResults(json, pipe.id, "querySuggest").then(function (data) {
          if (json.details_pipelines.indexOf(pipe.name) == -1) {
            json.details_pipelines += "<BR><BR>Pipeline: <b>" + pipe.name + "</b><BR>";
            json.details_pipelines += "Machine Learning, using old version, consider upgrading to the latest (platformVersion 2).<BR>";
          }
          console.log('Get Query Suggest data:');
          console.log(data);
          if (data) {
            if (data.totalCount == 0) {
              if (json.details_pipelines.indexOf(pipe.name) == -1) {
                json.details_pipelines += "<BR><BR>Pipeline: <b>" + pipe.name + "</b><BR>";
              }
              json.details_pipelines += "Machine Learning, Query Suggestions not enabled.<BR>";
              json.mlquerysuggest = false;
            }
          }
          resolve();
        });
      });
      Recommendation = new Promise((resolve) => {
        this.getQueryPipelinesDetailsResults(json, pipe.id, "recommendation").then(function (data) {
          if (json.details_pipelines.indexOf(pipe.name) == -1) {
            json.details_pipelines += "<BR><BR>Pipeline: <b>" + pipe.name + "</b><BR>";
            json.details_pipelines += "Machine Learning, using old version, consider upgrading to the latest (platformVersion 2).<BR>";
          }
          console.log('Get Recommendation data:');
          console.log(data);
          if (data) {
            if (data.totalCount == 0) {
              if (json.details_pipelines.indexOf(pipe.name) == -1) {
                json.details_pipelines += "<BR><BR>Pipeline: <b>" + pipe.name + "</b><BR>";
              }
              json.details_pipelines += "Machine Learning, Recommendations not enabled.<BR>";
              json.mlrecommendation = false;
            }
          }
          resolve();
        });
      });
      Ranking = new Promise((resolve) => {
        this.getQueryPipelinesDetailsResults(json, pipe.id, "topClicks").then(function (data) {
          if (json.details_pipelines.indexOf(pipe.name) == -1) {
            json.details_pipelines += "<BR><BR>Pipeline: <b>" + pipe.name + "</b><BR>";
            json.details_pipelines += "Machine Learning, using old version, consider upgrading to the latest (platformVersion 2).<BR>";
          }
          console.log('Get ART data:');
          console.log(data);
          if (data) {
            if (data.totalCount == 0) {
              if (json.details_pipelines.indexOf(pipe.name) == -1) {
                json.details_pipelines += "<BR><BR>Pipeline: <b>" + pipe.name + "</b><BR>";
              }
              json.details_pipelines += "Machine Learning, Automatic Relevancy Tuning not enabled.<BR>";
              json.mlart = false;
            }
          }
          resolve();
        });
      });
    }
    else {
      //Use the new platform V2 calls to retrieve the associations to the ML
      QuerySuggest = new Promise((resolve) => {
        this.getQueryPipelinesDetailsResultsV2(json, pipe.id).then(function (data) {
          if (data) {
            if (data.totalEntries == 0) {
              json.mlquerysuggest = false;
              json.mlart = false;
              json.mlrecommendation = false;
              json.mldne = false;
            } else {
              data.rules.map((model) => {
                if (model.modelStatus == "ONLINE") {
                  if (model.modelId.indexOf("_topclicks_") != -1) {
                    json.mlart = true;
                  }
                  if (model.modelId.indexOf("_facetsense_") != -1) {
                    json.mldne = true;
                  }
                  if (model.modelId.indexOf("_eventrecommendation_") != -1) {
                    json.mlrecommendation = true;
                  }
                  if (model.modelId.indexOf("_querysuggest_") != -1) {
                    json.mlquerysuggest = true;
                  }
                }
              });
            }
            if (!json.mlquerysuggest) {
              if (json.details_pipelines.indexOf(pipe.name) == -1) {
                json.details_pipelines += "<BR><BR>Pipeline: <b>" + pipe.name + "</b><BR>";
              }
              json.details_pipelines += "Machine Learning, Query Suggestions not enabled.<BR>";
            }
            if (!json.mlart) {
              if (json.details_pipelines.indexOf(pipe.name) == -1) {
                json.details_pipelines += "<BR><BR>Pipeline: <b>" + pipe.name + "</b><BR>";
              }
              json.details_pipelines += "Machine Learning, Automatic Relevancy Tuning not enabled.<BR>";
            }
            if (!json.mlrecommendation) {
              if (json.details_pipelines.indexOf(pipe.name) == -1) {
                json.details_pipelines += "<BR><BR>Pipeline: <b>" + pipe.name + "</b><BR>";
              }
              json.details_pipelines += "Machine Learning, Recommendations not enabled.<BR>";
            }
            if (!json.mldne) {
              if (json.details_pipelines.indexOf(pipe.name) == -1) {
                json.details_pipelines += "<BR><BR>Pipeline: <b>" + pipe.name + "</b><BR>";
              }
              json.details_pipelines += "Machine Learning, Dynamic Navigation not enabled.<BR>";
            }
          }
          resolve();
        });
      });
    }
    let Featured = new Promise((resolve) => {
      this.getQueryPipelinesDetailsResults(json, pipe.id, "top").then(function (data) {
        if (data) {
          if (data.totalCount > 50) {
            if (json.details_pipelines.indexOf(pipe.name) == -1) {
              json.details_pipelines += "<BR><BR>Pipeline: <b>" + pipe.name + "</b><BR>";
            }
            json.details_pipelines += "Too many (" + data.totalCount + ") Featured results (>50).<BR>";
          }
          json.nroffeatured += data.totalCount;
        }
        resolve();
      });
    });
    let Filter = new Promise((resolve) => {
      this.getQueryPipelinesDetailsResults(json, pipe.id, "filter").then(function (data) {
        if (data) {
          data.statements.map((statement) => {
            json.qpl_with_filters.push(pipe.name);
            //Basic (q)
            /* if (statement.definition.startsWith("filter q")) {
               json = checkQueryUse("Pipeline: " + pipe.name + ", Filter q", pipe.id, statement.detailed.expressions.join(' '), json, true, false, true, false);
             }
             //Advanced (aq)
             if (statement.definition.startsWith("filter aq")) {
               json = checkQueryUse("Pipeline: " + pipe.name + ", Filter aq", pipe.id, statement.detailed.expressions.join(' '), json, false, false, false, false);
             }
             //Constant (cq)
             if (statement.definition.startsWith("filter cq")) {
               json = checkQueryUse("Pipeline: " + pipe.name + ", Filter cq", pipe.id, statement.detailed.expressions.join(' '), json, false, true, true, false);
             }
             //Disjunction (dq)
             if (statement.definition.startsWith("filter dq")) {
               json = checkQueryUse("Pipeline: " + pipe.name + ", Filter dq", pipe.id, statement.detailed.expressions.join(' '), json, false, true, true, false);
             }*/
          });
        }
        resolve();
      });
    });
    let QRE = new Promise((resolve) => {
      this.getQueryPipelinesDetailsResults(json, pipe.id, "ranking").then(function (data) {
        if (data) {
          if (data.totalCount > 50) {
            if (json.details_pipelines.indexOf(pipe.name) == -1) {
              json.details_pipelines += "<BR><BR>Pipeline: <b>" + pipe.name + "</b><BR>";
            }
            json.details_pipelines += "Too many (" + data.totalCount + ") Ranking Expressions (>50).<BR>";

          }
          data.statements.map((statement) => {
            //json = checkQueryUse("Pipeline: " + pipe.name + ", QRE ", statement.id, statement.detailed.expressions.join(' '), json, false, false, false, true);
          });
          json.nrofqre += data.totalCount;
        }
        resolve();
      });
    });
    let Thesaurus = new Promise((resolve) => {
      this.getQueryPipelinesDetailsResults(json, pipe.id, "thesaurus").then(function (data) {
        if (data) {
          if (data.totalCount > 500) {
            if (json.details_pipelines.indexOf(pipe.name) == -1) {
              json.details_pipelines += "<BR><BR>Pipeline: <b>" + pipe.name + "</b><BR>";
            }
            json.details_pipelines += "Too many (" + data.totalCount + ") Thesaurus entries (>500).<BR>";
          }
          json.nrofthesaurus += data.totalCount;
        }
        resolve();
      });
    });
    //return json;
    if (json.models_platformVersion == 1) {
      if (debug) {
        console.log('Adding Promises for QPL');
      }
      /*let promise = new Promise((resolve) => {
        (async () => {
          await Promise.all([QuerySuggest, Recommendation, Ranking, Featured, Filter, QRE, Thesaurus]).then(() => {
            resolve();
          });
        });
      });
      return promise;*/
      return QuerySuggest.then(Recommendation).then(Ranking).then(Featured).then(Filter).then(QRE).then(Thesaurus);
    }
    else {
      /*let promise = new Promise((resolve) => {
        (async () => {
        await Promise.all([QuerySuggest, Featured, Filter, QRE, Thesaurus]).then(() => {
          resolve();
        });
      });
      });
      return promise;*/
      return QuerySuggest.then(Featured).then(Filter).then(QRE).then(Thesaurus);
    }
  }

 sleeper(ms) {
  return function (x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms));
  };
}

  executeSequentially(tasks) {
    return tasks.reduce(function (sequence, curPromise) {
      // Use reduce to chain the promises together
      return sequence.then(inspect.sleeper(300)).then(function () {
        return curPromise;
      });
    }, Promise.resolve());
  }

  getUsageInfo(report) {
    var now = new Date();
    var from = new Date();
    from = from.setDate(now.getDate() - nrofdaysAnalytics);
    var fromlast = new Date(from);
    var to = new Date();
    var header = "<tr><th><b>Origin 1 (Hub)</b></th><th><b>Origin 2 (Tab)</b></th>"
    header += "<th style='text-align:right'><b>Uniq Visits</b></th>"
    header += "<th style='text-align:right'><b>Avg Response</b></th>"
    //report.details += "<th style='text-align:right'><b>Q with Click</b></th>"
    header += "<th style='text-align:right'><b>Click through</b></th>"
    header += "<th style='text-align:right'><b>Avg Click Rank</b></th>"
    header += "<th style='text-align:right'><b>Session<br>Avg Nr Queries</b></th>"
    header += "<th style='text-align:right'><b>Session<br>Avg Nr Query Change</b></th>"
    header += "<th style='text-align:right'><b>Session<br>Avg Nr Clicks</b></th>"
    header += "<th style='text-align:right'><b>Session<br>% Content Gap</b></th>"
    //  header += "<th style='text-align:right'><b>Session<br>Info</b></th>"
    header += "</tr>"

    let froms = '&from=' + fromlast.toISOString() + '&to=' + to.toISOString();
    //let url = getPlatformUrl(report, report.location + '/rest/ua/v15/stats/combinedData?n=500&m=AverageClickRank&m=SearchWithClick&m=average%28actionresponsetime%29&m=ClickThroughRatio&m=UniqueVisit&d=originLevel1&d=originLevel2&f=%28searchcausev2+IN+%5B%22searchboxSubmit%22%2C%22searchFromLink%22%5D%29&fm=&p=1&s=UniqueVisit&asc=true&includeMetadata=true&bindOnLastSearch=true&org=' + report.org + froms);
    let url = inspect.baseUrlAnalytics + '/rest/ua/v15/stats/combinedData?n=500&m=AverageClickRank&m=SearchWithClick&m=average%28actionresponsetime%29&m=ClickThroughRatio&m=UniqueVisit&d=originLevel1&d=originLevel2&fm=&p=1&s=UniqueVisit&asc=true&includeMetadata=true&bindOnLastSearch=true&org=' + report.org + froms;
    let promise = new Promise((resolve) => {
      inspect.executeCall(url, report, "Getting Analytics Usage Info", "thereAreErrorsSearch", "GET", inspect.apiKey).then(function (data) {
        if (data) {
          let counterC = 0;
          let counterQ = 0;
          let counterP = 0;
          let total = 0;
          //First get summary of the searchCauses
          //  FacetSelection (facetSelect,facetDeselect, facetExclude)
          //  InterfaceChange (interfaceChange)
          //  Sort (resultsSort)
          //  Querysuggestions (omniboxAnalytics, omniboxFromLink)
          //  FieldQuerySuggestions (omniboxField)
          //  Opening (documentOpen,documentQuickview)
          //  Recommendation (recommendationOpen)
          //For each combination get Detailed info
          let responseQDetails = data['combinations'].map(source => {
            let deturl = inspect.baseUrlAnalytics + '/rest/ua/v15/stats/combinedData?n=2000&m=UniqueVisit&d=searchCauseV2&f=%28originlevel1%3D%3D%27' + source.originLevel1 + '%27%29+AND+%28originlevel2%3D%3D%27' + source.originLevel2 + '%27%29&fm=&p=1&s=UniqueVisit&asc=false&includeMetadata=true&bindOnLastSearch=false&org=' + report.org + froms;
            return new Promise((resolve) => {
              inspect.executeCall(deturl, report, "Getting Analytics Usage Info", "thereAreErrorsSearch", "GET", inspect.apiKey).then(function (datar) {
                data['combinations'][counterQ].ControlSearch = 0;
                data['combinations'][counterQ].ControlFacet = 0;
                data['combinations'][counterQ].ControlInterface = 0;
                data['combinations'][counterQ].ControlSort = 0;
                data['combinations'][counterQ].ControlQuerySuggest = 0;
                data['combinations'][counterQ].ControlFieldQS = 0;
                data['combinations'][counterQ].ControlOpening = 0;
                data['combinations'][counterQ].ControlRecommend = 0;
                if (datar) {
                  datar['combinations'].map(sourcedet => {
                    if (sourcedet.searchCauseV2 == 'facetSelect' || sourcedet.searchCauseV2 == 'facetDeSelect' || sourcedet.searchCauseV2 == 'facetExclude') {
                      data['combinations'][counterQ].ControlFacet += sourcedet.UniqueVisit;
                    }
                    if (sourcedet.searchCauseV2 == 'interfaceChange') {
                      data['combinations'][counterQ].ControlInterface += sourcedet.UniqueVisit;
                    }
                    if (sourcedet.searchCauseV2 == 'resultsSort') {
                      data['combinations'][counterQ].ControlSort += sourcedet.UniqueVisit;
                    }
                    if (sourcedet.searchCauseV2 == 'omniboxAnalytics' || sourcedet.searchCauseV2 == 'omniboxFromLink') {
                      data['combinations'][counterQ].ControlQuerySuggest += sourcedet.UniqueVisit;
                    }
                    if (sourcedet.searchCauseV2 == 'searchboxSubmit' || sourcedet.searchCauseV2 == 'searchFromLink') {
                      data['combinations'][counterQ].ControlSearch += sourcedet.UniqueVisit;
                    }
                    if (sourcedet.searchCauseV2 == 'omniboxField') {
                      data['combinations'][counterQ].ControlFieldQS += sourcedet.UniqueVisit;
                    }
                    if (sourcedet.searchCauseV2 == 'documentOpen' || sourcedet.searchCauseV2 == 'documentQuickview') {
                      data['combinations'][counterQ].ControlOpening += sourcedet.UniqueVisit;
                    }
                    if (sourcedet.searchCauseV2 == 'recommendationOpen') {
                      data['combinations'][counterQ].ControlRecommend += sourcedet.UniqueVisit;
                    }
                  });
                }
                counterQ = counterQ + 1;
                resolve();
              });
            });
          });
          //Paging requires a different query
          //  Paging (EventValue: pagerNext,pagerPrevious, pagerScrolling )
          let responsePDetails = data['combinations'].map(source => {
            let deturl = inspect.baseUrlAnalytics + '/rest/ua/v15/stats/combinedData?n=1000&m=UniqueVisit&d=customEventValue&s=UniqueVisit&asc=false&includeMetadata=true&bindOnLastSearch=false&f=%28customeventtype%3D%3D%27getMoreResults%27%29+AND+%28originlevel1%3D%3D%27' + source.originLevel1 + '%27%29+AND+%28originlevel2%3D%3D%27' + source.originLevel2 + '%27%29&fm=&p=1&org=' + report.org + froms;
            return new Promise((resolve) => {
              inspect.executeCall(deturl, report, "Getting Analytics Usage Info", "thereAreErrorsSearch", "GET", inspect.apiKey).then(function (datar) {
                data['combinations'][counterP].ControlPaging = 0;
                if (datar) {
                  datar['combinations'].map(sourcedet => {
                    data['combinations'][counterP].ControlPaging += sourcedet.UniqueVisit;
                  });
                }
                counterP = counterP + 1;
                resolve();
              });
            });
          });

          let responseC = data['combinations'].map(source => {
            total += source.UniqueVisit;
            let deturl = inspect.baseUrlAnalytics + '/rest/ua/v15/stats/combinedData?n=1000&m=DocumentView&m=countDistinct%28queryexpression%29&m=ManualQuery&d=sessionGuid&d=hasResult&f=%28searchcausev2+IN+%5B%22searchboxSubmit%22%2C%22searchFromLink%22%5D%29+AND+%28queryexpression%21%3D%27%27%29+AND+%28originlevel1%3D%3D%27' + source.originLevel1 + '%27%29+AND+%28originlevel2%3D%3D%27' + source.originLevel2 + '%27%29&fm=&p=1&s=ManualQuery&asc=false&includeMetadata=true&bindOnLastSearch=false&org=' + report.org + froms;
            return new Promise((resolve) => {
              inspect.executeCall(deturl, report, "Getting Analytics Usage Info", "thereAreErrorsSearch", "GET", inspect.apiKey).then(function (datar) {
                let manQ = 0;
                let noRes = 0;
                let clicks = 0;
                let uniqQ = 0;
                let totalR = 0;
                let totalNoRes = 0;
                if (datar) {
                  datar['combinations'].map(sourcedet => {
                    //Discard weird high ManualQueries (higher than 25)
                    if (sourcedet['ManualQuery'] < 25) {
                      manQ += sourcedet['ManualQuery'];
                      if (sourcedet['hasResult'] == false) {
                        totalNoRes += 1;
                        noRes += sourcedet['ManualQuery'];
                      }
                      else {
                        clicks += sourcedet['DocumentView'];
                        uniqQ += sourcedet['countDistinct(queryexpression)'];
                        totalR += 1;
                      }
                    }
                  });
                  if (totalR == 0) {
                    data['combinations'][counterC].AvgNoQ = 0;
                    data['combinations'][counterC].AvgNoQChange = 0;
                    data['combinations'][counterC].AvgNoClicks = 0;
                    data['combinations'][counterC].NoQ = 0;
                    data['combinations'][counterC].NoQChange = 0;
                    data['combinations'][counterC].NoClicks = 0;
                    data['combinations'][counterC].No = 0;
                    data['combinations'][counterC].NoRes = 0;
                    data['combinations'][counterC].NoResTotal = 0;
                  }
                  else {
                    //Update source
                    data['combinations'][counterC].AvgNoQ = manQ / totalR;
                    data['combinations'][counterC].AvgNoQChange = manQ / uniqQ;
                    data['combinations'][counterC].AvgNoClicks = clicks / totalR;
                    data['combinations'][counterC].NoQ = manQ;
                    data['combinations'][counterC].NoQChange = uniqQ;
                    data['combinations'][counterC].NoClicks = clicks;
                    data['combinations'][counterC].No = totalR;
                    data['combinations'][counterC].NoRes = noRes;
                    data['combinations'][counterC].NoResTotal = totalNoRes;
                  }
                  counterC = counterC + 1;
                  resolve();
                }
              });
            });
          });
          responseC = responseC.concat(responsePDetails).concat(responseQDetails);
          inspect.executeSequentially(responseC).then(() => {
            //Now we need to execute for each originLevel1/originLevel2 combination the Session query
            report.usagedetails += "<hr><h4>Search Usage Information last 50 days:</h4>";
            report.usagedetails += "(Session info based upon ca. last 1000 visits)<br>";
            report.usagedetails += "<div style='overflow:auto;margin:-1px;'>";
            report.usagedetails += "<table style='width: 1400px !important;'>";
            report.usagedetails += header;
            let rowcounter = 0;
            let extraheaders = data['combinations'].length / 5;
            let extraheader = (data['combinations'].length / extraheaders) + 1;
            data['combinations'].map(source => {
              if (rowcounter > extraheader) {
                report.usagedetails += header;
                rowcounter = 0;
              }
              rowcounter += 1;
              let maincolor = 'green';
              if (source.UniqueVisit < 100) {
                report.badUsage.push(source.originLevel1 + "/" + source.originLevel2 + " (" + source.UniqueVisit.toLocaleString() + ")");
                maincolor = 'red';
              }
              source.ClickThroughRatio = source.ClickThroughRatio * 100;
              if (source.ClickThroughRatio < 50) {
                report.badClick.push(source.originLevel1 + "/" + source.originLevel2 + " (" + source.ClickThroughRatio.toFixed(0) + "%)");
                maincolor = 'red';
              }
              if (source.AverageClickRank > 3) {
                report.badRank.push(source.originLevel1 + "/" + source.originLevel2 + " (" + source.AverageClickRank.toFixed(1) + ")");
                maincolor = 'red';
              }
              report.usagedetails += "<tr><td style='color:" + maincolor + ";'>" + source.originLevel1 + "</td><td>" + source.originLevel2 + "</td>";
              let color = 'green';
              if (source.UniqueVisit < 100) {
                color = 'red';
              }
              let perc = (source.UniqueVisit / total) * 100;//(5/10)*100;
              report.usagedetails += "<td style='color:" + color + ";text-align:right'>" + source.UniqueVisit.toLocaleString() + " (" + perc.toFixed(0) + "%)</td>";
              color = 'green';
              if (source['average(actionresponsetime)'] < 500) {
                color = 'red';
              }
              report.usagedetails += "<td style='color:" + color + ";text-align:right'>" + source['average(actionresponsetime)'] + "ms</td>";
              //report.details += "<td style='text-align:right'>" + source.SearchWithClick.toLocaleString() + "</td>";
              color = 'green';
              if (source.ClickThroughRatio < 50) {
                color = 'red';
              }
              report.usagedetails += "<td style='color:" + color + ";text-align:right'>" + source.ClickThroughRatio.toFixed(0) + "%</td>";
              color = 'green';
              if (source.AverageClickRank > 3) {
                color = 'red';
              }
              report.usagedetails += "<td style='color:" + color + ";text-align:right'>" + source.AverageClickRank.toFixed(1) + "</td>";
              color = 'green';
              if (source.AvgNoQ > 2) {
                color = 'red';
              }
              report.usagedetails += "<td style='color:" + color + ";text-align:right'>" + source.AvgNoQ.toFixed(1) + "</td>";
              color = 'green';
              if (source.AvgNoQChange > 2) {
                color = 'red';
              }
              report.usagedetails += "<td style='color:" + color + ";text-align:right'>" + source.AvgNoQChange.toFixed(1) + "</td>";
              color = 'green';
              if (source.AvgNoClicks > 3) {
                color = 'red';
              }
              report.usagedetails += "<td style='color:" + color + ";text-align:right'>" + source.AvgNoClicks.toFixed(1) + "</td>";
              perc = (source.NoResTotal / (source.No + source.NoResTotal)) * 100;
              if (isNaN(perc)) {
                perc = 0;
              }
              color = 'green';
              if (perc > 25) {
                color = 'red';
              }
              report.usagedetails += "<td style='color:" + color + ";text-align:right'>" + perc.toFixed(0) + "%</td>";
              report.usagedetails += "</tr><tr><td></td><td></td>";
              report.usagedetails += "<td colspan=4 style='vertical-align:top;text-align:left;word-break:normal'>" + "<b>Summary Behavior:</b><br>(Based upon visits)<br>";
              report.usagedetails += "<table padding=2><tr><td style='text-align:right'>" + "Total Visits:</td><td style='text-align:right'>" + source.UniqueVisit.toFixed(0) + "</td><td></td></tr>";
              perc = (source.ControlSearch / (source.UniqueVisit)) * 100;
              report.usagedetails += "<tr><td style='text-align:right'>" + "Executing Search:</td><td style='text-align:right'>" + source.ControlSearch.toFixed(0) + "</td><td style='text-align:left'>(" + perc.toFixed(0) + "%)</td></tr>";
              perc = (source.ControlFacet / (source.UniqueVisit)) * 100;
              report.usagedetails += "<tr><td style='text-align:right'>" + "Using Facets:</td><td style='text-align:right'>" + source.ControlFacet.toFixed(0) + "</td><td style='text-align:left'>(" + perc.toFixed(0) + "%)</td></tr>";
              perc = (source.ControlInterface / (source.UniqueVisit)) * 100;
              report.usagedetails += "<tr><td style='text-align:right'>" + "Using Different Interfaces:</td><td style='text-align:right'>" + source.ControlInterface.toFixed(0) + "</td><td style='text-align:left'>(" + perc.toFixed(0) + "%)</td></tr>";
              perc = (source.ControlQuerySuggest / (source.UniqueVisit)) * 100;
              report.usagedetails += "<tr><td style='text-align:right'>" + "Using Query Suggestions:</td><td style='text-align:right'>" + source.ControlQuerySuggest.toFixed(0) + "</td><td style='text-align:left'>(" + perc.toFixed(0) + "%)</td></tr>";
              perc = (source.ControlFacet / (source.UniqueVisit)) * 100;
              report.usagedetails += "<tr><td style='text-align:right'>" + "Using Field Query Suggestions:</td><td style='text-align:right'>" + source.ControlFieldQS.toFixed(0) + "</td><td style='text-align:left'>(" + perc.toFixed(0) + "%)</td></tr>";
              perc = (source.ControlSort / (source.UniqueVisit)) * 100;
              report.usagedetails += "<tr><td style='text-align:right'>" + "Using Sorting:</td><td style='text-align:right'>" + source.ControlSort.toFixed(0) + "</td><td style='text-align:left'>(" + perc.toFixed(0) + "%)</td></tr>";
              perc = (source.ControlPaging / (source.UniqueVisit)) * 100;
              report.usagedetails += "<tr><td style='text-align:right'>" + "Using Paging:</td><td style='text-align:right'>" + source.ControlPaging.toFixed(0) + "</td><td style='text-align:left'>(" + perc.toFixed(0) + "%)</td></tr>";
              perc = (source.ControlOpening / (source.UniqueVisit)) * 100;
              report.usagedetails += "<tr><td style='text-align:right'>" + "Opening Documents:</td><td style='text-align:right'>" + source.ControlOpening.toFixed(0) + "</td><td style='text-align:left'>(" + perc.toFixed(0) + "%)</td></tr>";
              perc = (source.ControlRecommend / (source.UniqueVisit)) * 100;
              report.usagedetails += "<tr><td style='text-align:right'>" + "Opening Recommendations:</td><td style='text-align:right'>" + source.ControlRecommend.toFixed(0) + "</td><td style='text-align:left'>(" + perc.toFixed(0) + "%)</td></tr>";
              report.usagedetails += "</table></td><td colspan=1></td>";
              report.usagedetails += "<td colspan=2 style='vertical-align:top;text-align:left;word-break:normal'>" + "<b>Summary:</b><br>(For above Session calculation)<br>";
              report.usagedetails += "<table padding=2><tr><td style='text-align:right'>Tot Queries:</td><td style='text-align:right'>" + source.NoQ.toFixed(0) + "</td></tr>";
              report.usagedetails += "<tr><td style='text-align:right'>" + "Tot Unique:</td><td style='text-align:right'>" + source.NoQChange.toFixed(0) + "</td></tr>";
              report.usagedetails += "<tr><td style='text-align:right'>" + "Tot Clicks:</td><td style='text-align:right'>" + source.NoClicks.toFixed(0) + "</td></tr>";
              report.usagedetails += "<tr><td style='text-align:right'>" + "Tot Zero Results:</td><td style='text-align:right'>" + source.NoResTotal.toFixed(0) + "</td></tr>";
              report.usagedetails += "<tr><td style='text-align:right'>" + "Tot Checks:</td><td style='text-align:right'>" + source.No.toFixed(0) + "</td></tr>";
              report.usagedetails += "</tr></table></td><td colspan=1></td>";
              report.usagedetails += "</tr>";
            });
            report.usagedetails += "</table>"
            report.usagedetails += "</div>";
            resolve(report);
          });
        }
      });
    });
    return promise;
  }

  async createScreenshot(url, file) {
    //let promise = new Promise((resolve) => {
    const page = await browser.newPage();
    try {
      //url = 'https://midatlantic.aaa.com/search%20results?';
      if (debug) {
        console.log('Creating screenshot: ' + url);
      }

      page.on('error', msg => {
        throw msg;
      });
      await page.setViewport({
        width: 1920,
        height: 1580,
        deviceScaleFactor: 1,
      });
      let moveOn = false;

      await page.goto(url, {
        waitUntil: 'networkidle0',
      });
      const pageurl = page.url();
      if (pageurl.includes(url)) {
        moveOn = true;
      }
      if (moveOn) {
        let data = await page.evaluate(() => {
          let all = {};
          all.coveo = document.querySelectorAll('[class^="Coveo"]').length;
          all.results = document.querySelectorAll('.CoveoResult').length;
          all.facets = document.querySelectorAll('.coveo-facet-selectable').length;
          all.score = 1;
          all.img = '';
          all.url = '';
          all.hash = 0;
          if (all.facets > 3) {
            all.score = 10;
          } else {
            if (all.results > 3) {
              all.score = 5;
            }
            else {
              if (all.coveo > 3) {
                all.score = 2;
              }
            }

          }
          return all;
        });

        console.log('Number of Coveo occurences: ' + JSON.stringify(data));
        if (data.score > 0) {
          data.img = file;
          data.url = url;
          await page.screenshot({ path: 'results/' + data.img + '.png' });//, () => {
          if (debug) {
            console.log('Created shot: ' + 'results/' + data.img + '.png => Score: ' + data.score);
          }
          //Calculate hash to compare the same images
          await this.myimageHash('results/' + data.img + '.png').then(function (mydata) {
            data.hash = mydata;

          });
          return data;
          //});
        }
        else {
          let all = {};
          all.score = 0;
          return all;
        }
      }
      else {
        let all = {};
        all.score = 0;
        return all;
      }
    }
    catch (e) {
      //console.log(e);
      let all = {};
      all.score = 0;
      return all;
    }
    finally {
      await page.close();

    }
    //});
    //return promise;
  }

  async getAnalyticsMetricsDetails(report) {
    https://platform0.cloud.coveo.com/rest/ua/v15/stats/visitsMetrics?org=coveointernaltesting1&from=2019-07-07T00%3A00%3A00.000%2B0200&to=2019-07-22T13%3A47%3A00.000%2B0200&m=UniqueVisit&f=%28origincontext%3D%3D%27CaseCreation%27%29&tz=Europe%2FAmsterdam&queryId=MTU2Mzc5NjA2M0Y2RDFE
    var now = new Date();
    var from = new Date();
    var dateusage = new Date();
    //console.log(dateusage);
    dateusage.setMonth(dateusage.getMonth() - 1);
    var dateformetrics = dateusage.getFullYear() + '-' + (dateusage.getMonth() + 1);
    //console.log(dateformetrics);
    from = from.setDate(now.getDate() - (nrofdaysAnalytics * 4));
    var fromlast = new Date(from);
    var to = new Date();
    let tasks = [];
    let froms = '&from=' + fromlast.toISOString() + '&to=' + to.toISOString();
    let url1 = this.baseUrl + '/rest/organizations/' + report.org + '/searchusagemetrics/raw/monthly?month=' + dateformetrics + '&minimumQueries=10';
    //let emptyHub = new Promise((resolve1) => {
    //tasks = tasks.concat(new Promise((resolve1) => {
    await this.executeCall(url1, report, "Getting Analtyics Metrics Info", "thereAreErrorsSearch", "GET", this.apiKey).then(function (data) {
      if (debug) {
        console.log(url1);
        console.log('EmptyHubs' + ' :' + report.org);
        console.log(data);
      }
      if (data) {
        let totalQ = 0;
        let emptyQ = 0;
        data.searchHubs.map(hub => {
          if (hub.searchHub == "") {
            emptyQ = hub.normalQueries;
            totalQ += hub.normalQueries;
          } else {
            totalQ += hub.normalQueries;
          }
        });
        report.details += "<hr>Usage Metrics info:<br>";
        //EmptyHubs if emptyQ is 10% or higher
        if ((emptyQ / totalQ) * 100 > 10) {
          report.EmptyHubs = true;
          //If so, we also set the det_analyticsSent to false
          report.det_analyticsSent = false;
        } else {
          report.EmptyHubs = false;
        }
        report.details += "Empty Search Hub Queries: " + emptyQ + "<br>";
        report.details += "Total Search Hub Queries: " + totalQ + "<br>";
        report.details += "% Empty Search Hub Queries: " + ((emptyQ / totalQ) * 100).toFixed(0) + "%<br><br>";
      }
      //resolve1(report);
    });
    //});
    // /rest/ua/v15/stats/combinedData?org=levitonmanufacturing&from=2019-08-01T00%3A00%3A00.000%2B0200&to=2019-08-26T09%3A39%3A00.000%2B0200&m=PerformSearch&d=queryPipeline&f=&fm=&p=1&n=90&s=PerformSearch&asc=false&includeMetadata=true&bindOnLastSearch=true&tz=Europe%2FAmsterdam&_=1566802657997&queryId=MTU2NjgwNTE5NDUyMEQ3
    let url2a = this.baseUrl + '/rest/ua/v15/stats/combinedData?m=PerformSearch&d=queryPipeline&f=&fm=&p=1&n=90&s=PerformSearch&asc=false&includeMetadata=true&bindOnLastSearch=true&org=' + report.org + froms;
    //let searchAsYouType = new Promise((resolve2) => {
    //tasks = tasks.concat(new Promise((resolve2) => {
    await this.executeCall(url2a, report, "Getting Analtyics Metrics Info", "thereAreErrorsSearch", "GET", this.apiKey).then(function (data) {
      if (debug) {
        console.log('SearchAsyoutype' + ' :' + report.org);
        console.log(data);
      }
      if (data) {
        data['combinations'].map(sourcedet => {
          if (sourcedet.queryPipeline != '') {
            report.usedPipelines.push(sourcedet.queryPipeline);
          }
        });
      }
      //resolve2(report);
    });
    let url2 = this.baseUrl + '/rest/ua/v15/stats/visitsMetrics?m=UniqueVisit&f=%28customeventtype%3D%3D%27Search%27%29+AND+%28causev2%3D%3D%27searchAsYouType%27%29&org=' + report.org + froms;
    //let searchAsYouType = new Promise((resolve2) => {
    //tasks = tasks.concat(new Promise((resolve2) => {
    await this.executeCall(url2, report, "Getting Analtyics Metrics Info", "thereAreErrorsSearch", "GET", this.apiKey).then(function (data) {
      if (debug) {
        console.log('SearchAsyoutype' + ' :' + report.org);
        console.log(data);
      }
      if (data) {
        report.SearchAsYouType = data.globalDatas.UniqueVisit.value;
      }
      //resolve2(report);
    });
    report.ControlSearch = 0;
    report.ControlFacet = 0;
    report.ControlInterface = 0;
    report.ControlSort = 0;
    report.ControlQuerySuggest = 0;
    report.ControlFieldQS = 0;
    report.ControlOpening = 0;
    report.ControlRecommend = 0;
    report.searchUrls = [];
    report.thesearchurl = [];

    let srcurl = inspect.baseUrlAnalytics + '/rest/ua/v15/stats/combinedData?m=DocumentView&d=originLevel3&f=%28searchcausev2%3D%3D%27searchboxSubmit%27%29&fm=&p=1&n=6&s=DocumentView&asc=false&includeMetadata=true&bindOnLastSearch=true&org=' + report.org + froms;
    await this.executeCall(srcurl, report, "Getting Analytics Usage Info", "thereAreErrorsSearch", "GET", inspect.apiKey).then(function (datar) {
      if (datar) {

        datar['combinations'].map(sourcedet => {
          if (sourcedet.originLevel3 != null) {
            if (!sourcedet.originLevel3.includes('.google.')) {
              report.searchUrls.push(sourcedet.originLevel3);
            }
          }
        });
      }
    });

    //Create Screenshots
    let filenr = 0;
    let previous = '';
    let shots = report.searchUrls.map(async searchurl => {
      filenr++;
      let data = await inspect.createScreenshot(searchurl, report.org + "_" + filenr);//.then(function (data) {
      if (data.score > 0) {
        if (debug) {
          console.log("Created screenshot: " + data.url);
        }
        report.thesearchurl.push({ score: data.score, searchurl: data.url, hash: data.hash, img: data.img });
      }
      //});
    });
    if (debug) {
      console.log('Begin Take Shots');
    }
    await Promise.all(shots).then(() => {
      if (debug) {
        console.log('Shots taken');
      }
      //Sort the array
      report.thesearchurl.sort((a, b) => (a.score > b.score) ? -1 : 1)
      console.log(JSON.stringify(report.thesearchurl));
    });

    let deturl = inspect.baseUrlAnalytics + '/rest/ua/v15/stats/combinedData?n=2000&m=UniqueVisit&d=searchCauseV2&fm=&p=1&s=UniqueVisit&asc=false&includeMetadata=true&bindOnLastSearch=false&org=' + report.org + froms;
    await this.executeCall(deturl, report, "Getting Analytics Usage Info", "thereAreErrorsSearch", "GET", inspect.apiKey).then(function (datar) {
      if (datar) {
        datar['combinations'].map(sourcedet => {
          if (sourcedet.searchCauseV2 == 'facetSelect' || sourcedet.searchCauseV2 == 'facetDeSelect' || sourcedet.searchCauseV2 == 'facetExclude') {
            report.ControlFacet += sourcedet.UniqueVisit;
          }
          if (sourcedet.searchCauseV2 == 'interfaceChange') {
            report.ControlInterface += sourcedet.UniqueVisit;
          }
          if (sourcedet.searchCauseV2 == 'resultsSort') {
            report.ControlSort += sourcedet.UniqueVisit;
          }
          if (sourcedet.searchCauseV2 == 'omniboxAnalytics' || sourcedet.searchCauseV2 == 'omniboxFromLink') {
            report.ControlQuerySuggest += sourcedet.UniqueVisit;
          }
          if (sourcedet.searchCauseV2 == 'searchboxSubmit' || sourcedet.searchCauseV2 == 'searchFromLink') {
            report.ControlSearch += sourcedet.UniqueVisit;
          }
          if (sourcedet.searchCauseV2 == 'omniboxField') {
            report.ControlFieldQS += sourcedet.UniqueVisit;
          }
          if (sourcedet.searchCauseV2 == 'documentOpen' || sourcedet.searchCauseV2 == 'documentQuickview') {
            report.ControlOpening += sourcedet.UniqueVisit;
          }
          if (sourcedet.searchCauseV2 == 'recommendationOpen') {
            report.ControlRecommend += sourcedet.UniqueVisit;
          }
        });
      }
      //counterQ = counterQ + 1;
    });

    //});
    /*let url3 = this.baseUrl + '/rest/ua/v15/stats/visitsMetrics?m=UniqueVisit&f=%28origincontext%3D%3D%27CaseCreation%27%29&org=' + report.org + froms;
    //let casecreationPageV = new Promise((resolve3) => {
    //tasks = tasks.concat(new Promise((resolve3) => {
    await this.executeCall(url3, report, "Getting Analtyics Metrics Info", "thereAreErrorsSearch", "GET", this.apiKey).then(function (data) {
      if (debug) {
        console.log('NrofCaseCreationPageVisits' + ' :' + report.org);
        console.log(data);
      }
      if (data) {
        report.NrofCaseCreationPageVisits = data.globalDatas.UniqueVisit.value;
      }
      //resolve3(report);
    });
    //});
    let url4 = this.baseUrl + '/rest/ua/v15/stats/visitsMetrics?m=UniqueVisit&f=%28customeventvalue%3D%3D%27submitButton%27%29&org=' + report.org + froms;
    //let casecreationV = new Promise((resolve4) => {
    //tasks = tasks.concat(new Promise((resolve4) => {
    await this.executeCall(url4, report, "Getting Analtyics Metrics Info", "thereAreErrorsSearch", "GET", this.apiKey).then(function (data) {
      if (debug) {
        console.log('NrofCaseCreations' + ' :' + report.org);
        console.log(data);
      }
      if (data) {
        report.NrofCaseCreations = data.globalDatas.UniqueVisit.value;
      }
      //resolve4(report);
    });
    //});
    let url5 = this.baseUrl + '/rest/ua/v15/stats/visitsMetrics?&m=UniqueVisit&f=%28customeventtype%3D%3D%27Click%27%29+AND+%28origincontext%3D%3D%27CaseCreation%27%29&fn=%28customeventvalue%21%3Dnull%29+AND+%28customeventvalue%3D%3D%27submitButton%27%29&org=' + report.org + froms;
    //let casedeflectionV = new Promise((resolve5) => {
    //tasks = tasks.concat(new Promise((resolve5) => {
    await this.executeCall(url5, report, "Getting Analtyics Metrics Info", "thereAreErrorsSearch", "GET", this.apiKey).then(function (data) {
      if (debug) {
        console.log('NrofCaseDeflections' + ' :' + report.org);
        console.log(data);
      }
      if (data) {
        report.NrofCaseDeflections = data.globalDatas.UniqueVisit.value;
      }
      //resolve5(report);
    });
    //});
    let url6 = this.baseUrl + '/rest/ua/v15/stats/visitsMetrics?m=UniqueVisit&f=%28origincontext%3D%3D%27CaseCreation%27%29&fn=%28customeventtype%3D%3D%27Click%27%29+AND+%28origincontext%3D%3D%27CaseCreation%27%29&fn=%28customeventvalue%21%3Dnull%29+AND+%28customeventvalue%3D%3D%27submitButton%27%29&org=' + report.org + froms;
    //let caseabandonV = new Promise((resolve6) => {
    //tasks = tasks.concat(new Promise((resolve6) => {
    await this.executeCall(url6, report, "Getting Analtyics Metrics Info", "thereAreErrorsSearch", "GET", this.apiKey).then(function (data) {
      if (debug) {
        console.log('NrofCaseAbandons' + ' :' + report.org);
        console.log(data);
      }
      if (data) {
        report.NrofCaseAbandons = data.globalDatas.UniqueVisit.value;
      }
      //resolve6(report);
    });
    //});*/
    /*await caseabandonV;
    await casedeflectionV;
    await casecreationV;
    await casecreationPageV;
    await searchAsYouType;
    await emptyHub;*/
    return report;
    /*return new Promise((resolve7) => {
      tasks.map((task) => {
        await task;
      });
      resolve7(report);
      //inspect.executeSequentially(tasks).then(() => { resolve7(report); });
    });*/
    //return tasks;
  }

  async getOrganizations(page) {
    return new Promise((resolve, reject) => {
      request.get(`${this.baseUrl}/rest/organizations?page=` + page, this.getOptions(), (error, response, body) => {
        //console.log(response);
        if ((response && response.statusCode) !== 200) {
          //console.log('body:', body);
          //console.log('error:', error); // Print the error if one occurred
          reject();
          return;
        }
        resolve(JSON.parse(body));
      });
    });
  }


  async inspectOrganization(id) {
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var today = new Date();
    var checkHTML = new RegExp(/<[a-z][\s\S]*>/ig);
    let json = {
      forOrgReport: true,
      location: id.id,
      org: id.id,
      theDate: today.toLocaleDateString("en-US", options),
      allfields: [],
      querycheck: false,
      badquery: "",
      nrofrequests: 0,
      cq: [],
      filterfields: [],
      singlewordfields: [],
      singlewordfieldscontains: [],
      singlewordfieldsmatch: [],
      qpl_with_filters: [],
      allmetadatavalues: false,
      nrofextensions: 0,
      nrofdisabledextensions: 0,
      nrofpipelines: 0,
      SearchAsYouType: 0,
      nrerrorextensions: 0,
      nrslowextensions: 0,
      nrtimeoutextensions: 0,
      sourceids: [],
      badfields_facettolong: [],
      name: id.displayName,
      orgtype: "",
      disabledextensions: [],
      errorextensions: [],
      slowextensions: [],
      nroffields: 0,
      nrofsystemfields: 0,
      nrofcustomfields: 0,
      nroffieldsnotused: 0,
      nroffacets: 0,
      nrofsorts: 0,
      errors: "",
      thereAreErrorsOrg: false,
      thereAreErrorsSources: false,
      thereAreErrorsFields: false,
      thereAreErrorsExtensions: false,
      thereAreErrorsSearch: false,
      nroffreetext: 0,
      nroffieldscachesort: 0,
      nroffieldscachecomputed: 0,
      nroffieldscachenested: 0,
      nroffieldscachenumeric: 0,
      timeoutextensions: [],
      badfields_contains_allmeta: [],
      badfields_contains_body: [],
      badfields_contains_html: [],
      badfields_wrong_config: [],
      badfields_filtered: [],
      badfields_query: [],
      types: [],
      containspush: false,
      containsonprem: false,
      push_without_html: [],
      normal_without_html: [],
      badfields_contains_duplicate_info: [],
      end_content_always_the_same: [],
      logerrors: 0,
      push_without_batch: [],
      logwarnings: 0,
      details: "",
      usagedetails: "",
      details_facettolong: "",
      details_alwaysthesame: "",
      details_pipelines: "",
      infra_machine: "No Access",
      infra_storage: "No Access",
      infra_storage_size: "No Access",
      infra_indexes: 0,
      infra_slices: 0,
      infra_mem_free: 0,
      infra_disk_free: 0,
      securityerrors: 0,
      mlquerysuggest: true,
      usedPipelines: [],
      mlart: true,
      mlrecommendation: true,
      models_platformVersion: 1,
      version: "V2",
      mldne: false,
      nrofthesaurus: 0,
      nrofqre: 0,
      nroffeatured: 0,
      docsfromsources: 0,
      nrofsources: 0,
      logwarnings: 0,
      logerrors: 0,
      notfresh: [],
      numberofsecurities: 0,
      pipelines: [],
      dimensions: [],
      topQueries: [],
      badClick: [],
      badRank: [],
      badUsage: [],
      UniqueVisit: 0,
      PerformSearch: 0,
      SearchWithClick: 0,
      ClickThroughRatio: 0,
      AverageClickRank: 0,
      RefinementQuery: 0,
      DocumentView: 0,
      sourceWebWarning: false,
      AvgResponse: 0,
      NrofCaseCreationPageVisits: 0,
      NrofCaseAbandons: 0,
      NrofCaseCreations: 0,
      NrofCaseDeflections: 0,
      EmptyHubs: false,
      noscheduledsecprov: [],
      det_analyticsSent: false,
      productEdition: '',
      productType: '',
      accountName: '',
      accountId: '',
      infra_machine: '',
      regions: [],
      thesearchurl: []
    };
    console.log('GetSourceInfo');
    json = await inspect.getSourceInfo(json);
    /*let data=json;
    let html = this.processReport(data);
    //let html = `<html><body><h1>${data.org}</h1>${report}${JSON.stringify(mydata)}</body></html>`;

    fs.writeFileSync('./results/' + data.org + ".html", html);*/

    if (json.nrofsources == 0) {
      if (debug) {
        console.log("Org: " + json.org + " does not contains sources or no access.");
        console.log("==============================================================");
      }
      else {
        console.log(json.org + ',' + json.name + ',,,,,,');
      }
    } else {
      //Get source Schedules
      console.log('GetSourceSchedules');
      let sourcenoschedule = [];

      for (const source of json.sourceids) {
        // [JD] not sure what 'isPush' means here.
        let isPush = json.pushnames.includes(source.name);
        if (!isPush) {
          const data = await inspect.getSourceSchedules(json, source.id);
          //console.log(data);
          if (!data) {
            sourcenoschedule.push(source.name);
          }
        }
      }

      json.noscheduledsources = sourcenoschedule;
      json.nrofnoschedulessources = sourcenoschedule.length;

      console.log('getSecurityInfo');
      //Get Security Providers info
      json = await inspect.getSecurityInfo(json);
      console.log(json.noscheduledsecprov);

      console.log('getExtensionInfo');
      //Get Extensions Info
      json = await inspect.getExtensionInfo(json);

      console.log('getModelsInfo');
      //Get Models Info
      json = await inspect.getModelsInfo(json);

      console.log("getLicense");
      json = await inspect.getLicense(json);

      console.log('getNodeInfo');
      //Get Node Info
      json = await inspect.getNodeInfo(json);

      console.log('getAnalyticsMetricsInfo');
      //Get Analytics Metrics Info
      json = await inspect.getAnalyticsMetricsInfo(json);

      /*console.log('got Analytics');
      Promise.resolve().then(
        function () {*/
      /*let tasks = inspect.getAnalyticsMetricsDetails(json);
      tasks.map((task) => {
        json = inspect.anAsyncFunction(task(json));
      });
      let data = json;*/
      //inspect.executeSequentially(tasks).then(function (data) {
      // inspect.getUsageInfo(data).then(function (data) {
      console.log('getAnalyticsMetricsDetails');
      json = await inspect.getAnalyticsMetricsDetails(json);

      let requestsQPL = [];
      let pipesToCheck = [];
      //If json.usedQueryPip
      console.log('getQueryPipelinesInfo');
      json = await inspect.getQueryPipelinesInfo(json);

      if (json.usedPipelines.length == 0) {
        json.pipelines.map(pipes => {
          pipesToCheck.push(pipes.name);
        });
      }
      else {
        json.usedPipelines.map(pipes => {
          pipesToCheck.push(pipes);
        });
      }

      for (const pipes of json.pipelines) {
        //Only if inside pipesToCheck
        if (pipesToCheck.includes(pipes.name)) {
          await inspect.getQueryPipelinesDetails(json, pipes);
        }
      }
      //});
      //});

      //let allPromises = await Promise.all(requestsQPL);
      // await inspect.executeSequentially(requests);
      console.log('got QPLS');
      //console.log(data);
      let data = json;
      if (debug) {
        console.log(data.org);
        console.log("Org: " + data.org + " (" + data.name + ")");
        console.log("   Analytics Tracked: " + data.det_analyticsSent);
        console.log("   Missing QS: " + !data.mlquerysuggest);
        console.log("   Missing ART: " + !data.mlart);
        console.log("   Missing SearchHubs: " + data.EmptyHubs);
        console.log("   Search As You Type enabled: " + (data.SearchAsYouType != 0));
        console.log("==============================================================");
      }

      console.log(data.org + ',' + data.name + ',' + data.det_analyticsSent + ',' + !data.mlquerysuggest + ',' + !data.mlart + ',' + (data.EmptyHubs != 0) + ',' + (data.SearchAsYouType != 0) + ',<html><body>' + data.usagedetails + '</body></html>');
      let report = "<p>   Analytics Tracked: " + data.det_analyticsSent + '<br>';
      report += "   Missing QS: " + !data.mlquerysuggest + '<br>';
      report += "   Missing ART: " + !data.mlart + '<br>';
      report += "   Missing SearchHubs: " + data.EmptyHubs + '<br>';
      report += "   Search As You Type enabled: " + (data.SearchAsYouType != 0) + '<br>';
      report += "<hr>";
      report += data.usagedetails;
      let mysearchurls = '';
      data.accessibleUrls = [];
      let newsearchurls = [];
      var firstHash = 0;
      data.thesearchurl.map(urls => {
        //They are sorted on score, so the best first
        //We need to remove duplicate images
        let addIt = true;
        if (firstHash == 0) {
          firstHash = urls.hash;
        } else {
          //Compare it with previous
          if (debug) {
            console.log('First hash: ' + firstHash);
            console.log('Current: ' + urls.hash);
          }
          if (this.hammingDistance(firstHash, urls.hash) < 60) {
            //Remove it
            addIt = false;
          } else {
            firstHash = urls.hash;
          }
        }
        if (addIt) {
          mysearchurls += urls.searchurl + '\n';
          data.accessibleUrls.push('<a target="_blank" href="' + urls.searchurl + '">' + urls.searchurl + '</a>');
          newsearchurls.push(urls);
        }
      });
      data.thesearchurl = newsearchurls;
      data.UsingSearchAsYouType = (data.SearchAsYouType != 0);
      data.qpl_with_filters = [...new Set(data.qpl_with_filters)];
      let mydata = {
        'OrgId': data.org,
        'OrgName': data.name,
        'productType': data.productType,
        'ResponseMs': data.AvgResponse,
        'UsingSearchAsYouType': data.UsingSearchAsYouType,
        'NoOfSources': data.nrofsources,
        'IndexSize': data.docsfromsources,
        'freeDisk': data.infra_disk_free,
        'freeMem': data.infra_mem_free,
        'SourceNoSchedules': data.nrofnoschedulessources,
        'ConnectorsUsed': data.types.join('\n'),
        'BadWeb': data.sourceWebWarning,
        'UsingPush': data.containspush,
        'UsingCrawlingModules': data.containsonprem,
        'SecurityProvidersNoSchedules': data.noscheduledsecprov.length,
        'NoOfExtensionWithErrors': data.nrerrorextensions,
        'NoOfExtensionsDisabled': data.nrofdisabledextensions,
        'NoOfExtensionsSlow': data.nrslowextensions,
        'NoOfExtensionsWithTimeout': data.nrtimeoutextensions,
        'NoOfQueryPipelines': data.nrofpipelines,
        'ML_QSEnabled': data.mlquerysuggest,
        'ML_ARTEnabled': data.mlart,
        'ML_RecommendationsEnabled': data.mlrecommendation,
        'ML_DNEEnabled': data.mldne,
        'NoOfThesaurusEntries': data.nrofthesaurus,
        'NoOfRankingExpressions': data.nrofqre,
        'NoOfFeaturedResults': data.nroffeatured,
        'AnalyticsTriggered': data.det_analyticsSent,
        'EmptyHubs': data.EmptyHubs,
        'AverageResponseTime': data.AvgResponse,
        'Analytics_LowOrigin_Usage': data.badUsage,
        'Analytics_LowClickThrough': data.badRank,
        'Analytics_UniqueVisits': data.UniqueVisit,
        'Analytics_NoOfSearches': data.PerformSearch,
        'Analytics_NoOfSearchesWithClick': data.SearchWithClick,
        'Analytics_ClickThrough': data.ClickThroughRatio,
        'Analytics_ClickRank': data.AverageClickRank,
        'Analytics_Details': '',
        'UsingFacets': data.ControlFacet,
        'UsingInterfaces': data.ControlInterface,
        'UsingQS': data.ControlQuerySuggest,
        'UsingFieldQS': data.ControlFieldQS,
        'UsingSorting': data.ControlSort,
        'UsingPaging': data.ControlPaging,
        'UsingOpen': data.ControlOpening,
        'productEdition': data.productEdition,
        'accountName': data.accountName,
        'accountId': '=HYPERLINK("https://na61.salesforce.com/' + data.accountId + '";"LINK")',
        'infra_machine': data.infra_machine,
        'regions': (typeof data.regions === "undefined" ? '' : data.regions.join('\n')),
        'searchUrls': (typeof data.searchUrls === "undefined" ? '' : data.searchUrls.join('\n')),
        'accessibleSearchUrl': mysearchurls
      }
      //console.log(mydata);
      let html = this.processReport(data);
      //let html = `<html><body><h1>${data.org}</h1>${report}${JSON.stringify(mydata)}</body></html>`;

      fs.writeFileSync('./results/' + data.org + ".html", html);

      let dataEncoded = qs.stringify(mydata);
      const callApi = require('./callApi');
      let mdata = [];
      const options = {
        url: "https://script.google.com/macros/s/AKfycby6s0EcYjhAfhSCrF4k4ilAi_uUVcGdi32dL_FCX-JlqyXQApTF/exec",
        'method': 'post',
        'gzip': true,
        'body': [],
        //form: mydata,

        'followAllRedirects': true,
        'headers': {
          'Content-Length': Buffer.byteLength(dataEncoded),
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }

      const response = await callApi(options, dataEncoded)
      //console.log(response);

      //}
      //});
      //});
      //   });
      //});
    }

    //});

  }

  async start() {
    if (debug) {
      console.log('Getting organizations...');
    }
    else {
      console.log('OrgId,OrgName,AnalyticsSent,MissingQS,MissingArt,MissingSearchHub,UsingSearchAsYouType,Report');

    }
    //Get first
    let mycounter = 0;
    let debugCount = 150;
    let pageIndex = 0;
    let orgs = await this.getOrganizations(pageIndex);
    let toprocess = ['aaamidatlanticincprod',
    'ahaproduction437qnnvv',
    'alcatellucententerpriseeurope',
    'asqproductiongm5sinb9',
    'carolinashealthcare',
    'instrongg4wmwqf',
    'canadacouncilfortheartsprod',
    'childrenshospitalboston',
    'colliersinternational',
    'commissiondelaconstructionduqubecproductionauss8jo9',
    'faskenmartineau',
    'firstqualityenterprisesproductionpxzxo2aq',
    'focusonthefamilyrg75ntbs',
    'fondsdesolidarite',
    'bekaerttk0lcw7o',
    'bluegreenvacationsproductionjuct2d8e',
    'bonsecourshealthsystemsinc',
    'bowvalleycollegeproductionrisjbxxj',
    'acuitybrands',
    'barco807v1hty',
    'bcevzjxr5qt',
    'changehealthcare1sj1geuy',
    'oclcprodbkh6ljcv',
    'texasinstrumentsof16fcd3',
    'xilinxprdkmx6qjsc',
    'amfamnonproductionhsyl9vm3',
    'andersencorporation',
    'anritsu',
    'aopa9nc4vnbc',
    'aorn',
    'argonnenationallaboratoryproductionhw38oy9c',
    'armlimitedproductionubhpo2y4',
    'asaamericansocietyofanesthesiologists',
    'dalhousieuniversityproductionqax94e5b',
    'pitneybowessoftwareik898xxa',
    'principalfinancialgroupqpnzn1vj',
    'mitelfkipvyf8',
    'schlumbergerproduction0cs2zrh7',
    'pfizer',
    'tsiaproduction',
    'aviva65jyt1nn',
    'fundaciontelefonicaproduction7cl3rm0a',
    'dropboxproductionpmlw0l3v',
    'wisconsindepartmentoftourismproductionoth7hkq2',
    'levitonmanufacturing',
    'questsoftwareproductionl1k3xvdx',
    'junipernetworkswebsitecwcpnoiw',
    'siemenshealthcarediagnosticsincproductionrguljwfe',
    'repsolprodo2v1rcfc',
    'americanassociationofclinicalchemistryproductionkdycizsv',
    'americancollegeofradiology',
    'motorolasolutionsincproductionmq0wx9mn',
    'albertasecuritiescommissionprod2a34tiy7',
    'americanoccupationaltherapyassociationprod',
    'blackanddeckergmwgue73',
    'chicagouniversityls5ir32t',
    'theconferenceboardofcanada',
    'itronproductionn7namvto',
    'jonesdayproductionbi4jtoh5',
    '7summitsascustomertrialhgnn0gy3',
    'aarpu11lxv0p',
    'abaproduction5u1a80ud',
    'abbottlaboratoriesincproductionfjb9noe8',
    'acogproduction8v7ii7qa',
    'actianynmehrnx',
    'adaproduction',
    'adobev2prod9e382h1q',
    'adventsoftwareproductionxghzutpq',
    'aecomproductionay3rk4zi',
    'alienvaultproda2gz1am5',
    'alliantcreditunionfoundationproductionxfrd37iv',
    'americanexpresscompany',
    'analogdevicesproductionrzsvdg7d',
    'anaplani1in68v0',
    'anheuserbuschinbevprod',
    'aofoundationproductionji8iisfk',
    'architecturalwoodworkinginstituteproduction3fy1pta6',
    'arrisgroupproductionz5r0cdvg',
    'ascrsproduction80tq3shr',
    'atcc3h1cvdzh',
    'aureasoftwareproductionbpdv7cxq',
    'automaticdataprocessingadpproductionvnn3f29q',
    'avanadesc9productionlk3bs0x7',
    'bcfproductionynpjp0nj',
    'bdcprod',
    'beckmancoulterhn9i3bqk',
    'becukst2l7fr',
    'beldencableproductionbugpvwoi',
    'bjservicesm5t7xrg8',
    'blackberry',
    'blgproductionhcvwnqfi',
    'boomiproduction308bh8om',
    'branzlimitedprodp8kbgo00',
    'c40citiesclimateleadershipgroupproductionsezdi5l7',
    'cadenceelz4c78u',
    'caleresproduction4uzryqju',
    'cambridgeinvestmentresearchua',
    'cbre4fbpdild',
    'cdkglobalproductionccaz989b',
    'centralsquaretechnologiesproduction2v1fbhxv',
    'cfainstitute',
    'chamberlaingroupk5f2dpwl',
    'churchcommunitybuilderincproductione0wcwqin',
    'cienacorporation50auilr9',
    'citrixsystemsincproductionrofn69qv',
    'clarivateanalytics',
    'clarkconstructiongroupproductionfiy6iuys',
    'cmhcn5w3hbfi',
    'cohnreznick',
    'columbiauniversityalumniportal',
    'compuwarecorporationproductionfzk8h5rn',
    'concury9vvkaz3',
    'coveodemocommerceqmqaepc4',
    'coveodemohabitathomecoveodemocom2nvhoe1r4',
    'crossmarkinc',
    'cushmanwakefieldproductionm8c7yxjk',
    'dellprod',
    'deltekinccustomercareua',
    'dfaproduction7j3xksbp',
    'dlapiperproductionntg1e3se',
    'dominionenergyproductionivjj00jb',
    'dorelproductionstrojqun',
    'drhortonproductionbsf4s1r1',
    'druvaproductione1shh13i',
    'egdproductionbxtotgts',
    'ellucian',
    'enduranceproductionsfmneu4v',
    'epriproductione28sc58i',
    'everestreinsurancecompany',
    'f5networksproduction0ypjm87g',
    'f5networksproduction5vkhn00h',
    'fanniemae9glu2r77',
    'farahexperiencesllc',
    'fcotetrainingorg',
    'foresterscloudproductionagkwgtjx',
    'formicaprod',
    'foxentertainmentgroup1',
    'fsecurecorporationproductionsjnl4jqt',
    'fticonsultinginch36whs6v',
    'fticonsultingproductionikz7qfd7',
    'gapincproductionjra34f3l',
    'geicoinsuranceproductionsvptcq2f',
    'genworthfinancialsefuludv',
    'gmproductione2yq29g7',
    'gojoindustriesproductione3z8ghx9',
    'grantthornton0efn6zju',
    'gtaaproduction4ya6bu7h',
    'healthspanprod',
    'hewlettpackardproductioniwmg9b9w',
    'hexagonwez3ntfa'];
    //orgs.items = orgs.items.filter(org => (/aarp/i).test(org.id));
    while (pageIndex < orgs.totalPages) {

      for (let org of orgs.items) {
        console.log(org);
        if (toprocess.includes(org.id)) {
          if (!org.readOnly) {
            await this.inspectOrganization(org);
            //          break;
            if (debug) {
              mycounter = mycounter + 1;
            }
            if (mycounter > debugCount) break;
          }
        }
      };
      pageIndex++;
      if (mycounter > debugCount) break;
      if (pageIndex < orgs.totalPages) {
        orgs = await this.getOrganizations(pageIndex);
        console.log("Getting next page of orgs");
      }
    }
    browser.close();
  }
}

let inspect = new InspectAllOrganizations();
inspect.initPuppet();
inspect.start();
