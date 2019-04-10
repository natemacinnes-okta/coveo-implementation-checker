'use strict';
// jshint -W003
/*global chrome*/

//For Salesforce
function getSFDC() {
  //use this: document.querySelector("[id='00N320000030M2p_ileinner']")
  let toGet = {
    xProjectname: "Name_ileinner",
    xMilestone: "00N0d000002y7Cm_ileinner",
    xRecordtype: "RecordType_ileinner",
    xKickoff_date: "00N320000030M2p_ileinner",
    xGolive_date: "00N320000030M2u_ileinner",
    xSearchpage: "00N320000030M34_ileinner",
    xCustomer: "CF00N320000030Lx1_ileinner",
    xPartner: "CF00N320000030Lx6_ileinner",
    xOwner: "CF00N0d000002y7Cl_ileinner"
  };
  let got = {};
  for (let [curkey, curvalue] of Object.entries(toGet)) {
    let value = document.querySelector("[id='" + curvalue + "']").innerText.replace('[Change]', '');
    if (curkey == "xSearchpage") {
      //trim so that we have the host only https://www.beckman.com/coveosearch --> www.beckman.com only
      value = value.split('/')[2];
    }
    if (curkey == "xPartner") {
      if (value == "") {
        value = "Unknown";
      }
    }
    got[curkey] = value;
  }
  //Get URL
  got["xSFDCUrl"] = window.location.protocol + '//' + window.location.hostname + "" + window.location.pathname;
  SendMessage({ type: 'gotSFDC', values: got });
}


//let THIS_PAGE_COVEO_REPORT = {};

function addConsoleTracker() {
  let tracker_script = `(function () {
		if (window.console && console.log) {
			var oldConsole = console.log;
			console.log = function () {
				var message = Array.prototype.slice.apply(arguments).join(' ');
				if (message.indexOf('A search was triggered, but no analytics') !== -1 || message.indexOf('warnAboutSearchEvent') !== -1) {
					$('body').append('<div id=myanalyticsfailure></div>');
					Array.prototype.unshift.call(arguments, 'MAYDAY: ');
				}
				oldConsole.apply(this, arguments);
			};
		}
	})();`;
  return tracker_script;
}


//Add the above div always to track analytics problems
var script = document.createElement('script');
script.textContent = addConsoleTracker();
(document.head || document.documentElement).appendChild(script);

let SendMessage = (parameters) => {
  setTimeout(() => {
    try {
      chrome.runtime.sendMessage(parameters);
    }
    catch (e) { }
  });
};

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

/**
 * Analyze the Page and creates a Report spec for the Popup
 */
let analyzePage = () => {
	/**
	 * Sample - Should be replaced by a message handler responding to messages from content.js
	 */
  SendMessage([{
    title: "General",
    value: 21, max: 60,
    lines: [
      { label: "JS UI version (should be 2.4382)", value: "2.4382", expected: /^2\.4382/ },
      { label: "Integrated in UI", value: "Unknown" },
      { label: "Pagesize in kB:", value: 3154 },
    ]
  }, {
    title: "Performance",
    value: 31, max: 60,
    lines: [
      { label: "# of search executed (should be 1)", value: 0, expected: 1 },
      { label: "Search Events sent using our api?", value: false, expected: true },
      { label: "Analytics sent?", value: false, expected: true },
      { label: "Using search as you type (degrades performances)", value: false, expected: false },
      { label: "Using ML Powered Query Completions", value: false, expected: true },
    ]
  }, {
    title: "Implementation",
    value: 46, max: 60,
    lines: [
      { label: "Using state in code (more complicated)", value: true, expected: false },
      { label: "Using partial match (more finetuning needed)", value: false, expected: false },
    ]
  }]);
};

if (chrome && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(
    function (request/*, sender, sendResponse*/) {
      if (request.analyzePage === true) {
        analyzePage();
      }
      if (request.type === 'getReport') {
        getReport();
      }
      if (request.type === 'getOrgReport') {
        let report = {};
        report.token = getCookie('access_token');
        report.org = getCookie('organization');
        if (report.org == '') {
          report.org = getCookie('workgroup').replace("workgroup_", '');
        }
        report.location = window.location.origin;
        SendMessage({
          type: "gotOrgReport",
          json: report
        });
      }
      if (request.type === 'getLocation') {
        console.log("In gettingLoc");
        let report = {};
        report.token = getCookie('access_token');
        report.org = getCookie('organization');
        if (report.org == '') {
          report.org = getCookie('workgroup').replace("workgroup_", '');
        }
        console.log("Sending GotLoc");
        SendMessage({
          type: "gotLocation",
          json: report
        });
      }
      if (request.type === 'clearCache') {
        //location.reload(true);
      }
      if (request.type === 'getPerformanceReport') {
        let reportJson = getPerformanceReport();
        SendMessage({
          type: "gotPerformanceReport",
          json: reportJson
        });
      }
      if (request.type === 'getSFDC') {
        getSFDC();
      }
      else if (request.type === 'getNumbers') {
        let reportJson = getReport();
        //We also have the global numbers so merge them with the json
        reportJson = Object.assign({}, reportJson, request.global);

        SendMessage({
          type: "gotNumbers",
          json: reportJson
        });
      }
      else if (request.type === 'download') {
        downloadReport(request.name, request.text);
      }
       
      return true; 
    }
  );
}

function cleanMatch(match) {
  return match.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace('\n', '<BR>¶ ') + "<BR>";
}

function addMatches(matches) {
  let report = '';
  matches.forEach(function (m) {
    report += cleanMatch(m);
  });
  report += "</span>";
  return report;
}

function parseScript(name, content, all, external, __report__) {
  let report = '';

  console.log('Parsing: ' + name + '... ');
  content = String(content);

  //Lazy
  if (name.toLowerCase().indexOf('lazy') !== -1) {
    __report__.usingLazy = true;
  }
  //Version?
  var reg = /[\"']?lib[\"']? ?: ?[\"'](.*?)[\"'],/g;///"?lib"? ?: ?['"](.*)['"].*\n?.*"?product"?: ?['"](.*)['"],/g;
  let matches = content.match(reg);
  if (matches) {
    if (matches[0].match(/(\d.\d{4})(.\d+)/g)) {
      __report__.uiVersion = matches[0].match(/(\d.\d{4})(.\d+)/g)[0];
      reg = /[.\S\s ]{19}[\"']?lib[\"']? ?: ?[\"'](.*?)[\"'],[.\S\s ]{40}/g;
      matches = content.match(reg);
      report += '<BR><b>UI Version found:</b><BR><span class="mycode">' + matches[0].replace('\n', ' ').replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</span><BR>";
    }
  }
  //Seems the below token is in the sample endpoint, we do not want to match that
  //We need to remove the sampleTokens from the content
  content = content.replace(/configureSampleEndpoint[\S\s]*\.configureCloudEndpoint ?=/g, '');
  reg = /(\.accessToken[:=] ?[\"'](?!xx564559b1-0045-48e1-953c-3addd1ee4457)(.*?)[\"'])/g;
  matches = content.match(reg);
  if (matches) {
    __report__.hardcodedAccessTokens = true;
    report += '<BR><b>Hardcoded accessTokens:</b><br><span class="mycode">';
    reg = /[.\S\s ]{10}(\.accessToken[:=] ?[\"'](?!xx564559b1-0045-48e1-953c-3addd1ee4457)(.*?)[\"'])[.\S\s ]{70}/g;
    matches = content.match(reg);
    report += addMatches(matches);
  }
  if (all) {

    reg = /(\$qre)|(\$correlateUsingIdf)|(\$some)\./g;
    matches = content.match(reg);
    if (matches) {
      __report__.usingQRE = true;
      __report__.difficulty++;
      report += '<BR><b>Use of QRE:</b><BR><span class="mycode" >';
      reg = /[.\S\s ]{10}(\$qre)[.\S\s ]{40}|[.\S\s ]{10}(\$correlateUsingIdf)[.\S\s ]{40}|[.\S\s ]{10}(\$some)[.\S\s ]{40}/g;
      matches = content.match(reg);
      report += addMatches(matches);
    }

    reg = /\braw\./g;
    matches = content.match(reg);
    if (matches) {
      __report__.nrofraw += matches.length;
      __report__.difficulty++;

      report += '<BR><b>Use of raw. found:</b><BR><span class="mycode" >';
      reg = /[.\S\s ]{10}\braw\.[.\S\s ]{40}/g;
      matches = content.match(reg);
      report += addMatches(matches);
    }

    reg = /configureOnPremiseEndpoint/g;
    matches = content.match(reg);
    if (matches) {
      __report__.onpremise = true;
      __report__.difficulty++;
      report += '<BR><b>On premise found:</b><BR><span class="mycode" >';
      reg = /[.\S\s ]{10}configureOnPremiseEndpoint[.\S\s ]{40}/g;
      matches = content.match(reg);
      report += addMatches(matches);
    }

    reg = /coveo\(.?state.?,/g;
    matches = content.match(reg);
    if (matches) {
      __report__.usingState = true;
      __report__.difficulty++;
      report += '<BR><b>State found:</b><BR><span class="mycode" >';
      reg = /[.\S\s ]{10}coveo\(.?state.?,[.\S\s ]{40}/g;
      matches = content.match(reg);
      report += addMatches(matches);
    }

    reg = /(data-pipeline=?[\"'](.*?)[\"'])|(options.pipeline ?=(.*);)/g;
    matches = content.match(reg);
    if (matches) {
      report += '<BR><b>Pipelines:</b><br><span class="mycode" >';
      matches.forEach(function (m) {
        if (m !== undefined) {
          __report__.pipelines = (__report__.pipelines || '') + " " + cleanMatch(m);
        }
      });
      reg = /[.\S\s ]{10}(data-pipeline=?[\"'](.*?)[\"'])[.\S\s ]{50}|[.\S\s ]{10}(options.pipeline ?=(.*);)[.\S\s ]{50}/g;
      matches = content.match(reg);
      report += addMatches(matches);
    }

    //usingEvents: "(changeAnalyticsCustomData)|(buildingQuery)|(preprocessResults)|(deferredQuerySuccess)|(doneBuildingQuery)|(duringFetchMoreQuery)|(duringQuery)|(newQuery)|(preprocessMoreResults)",
    reg = /(changeAnalyticsCustomData)|(initSearchbox)|(buildingQuery)|(preprocessResults)|(deferredQuerySuccess)|(doneBuildingQuery)|(duringFetchMoreQuery)|(duringQuery)|(newQuery)|(preprocessMoreResults)/g;
    matches = content.match(reg);
    if (matches) {
      __report__.usingCustomEvents = true;
      report += '<BR><b>Custom Events:</b><br><span class="mycode" >';
      matches.forEach(function (m) {
        if (m !== undefined) {
          if (!__report__.customEvents.includes(m)) {
            __report__.difficulty++;
            __report__.customEvents.push(m);
          }
        }
      });
      reg = /[.\S\s ]{5}(changeAnalyticsCustomData)[.\S\s ]{40}|[.\S\s ]{5}(initSearchbox)[.\S\s ]{40}|[.\S\s ]{5}(buildingQuery)[.\S\s ]{40}|[.\S\s ]{5}(preprocessResults)[.\S\s ]{40}|[.\S\s ]{5}(deferredQuerySuccess)[.\S\s ]{40}|[.\S\s ]{5}(doneBuildingQuery)[.\S\s ]{40}|[.\S\s ]{5}(duringFetchMoreQuery)[.\S\s ]{40}|[.\S\s ]{5}(duringQuery)[.\S\s ]{40}|[.\S\s ]{5}(newQuery)[.\S\s ]{40}|[.\S\s ]{5}(preprocessMoreResults)[.\S\s ]{40}/g;
      matches = content.match(reg);
      report += addMatches(matches);
    }

    //usingTokens: "(options.token)|(options.accessToken)",
    reg = /(options.token[ ]?=)|(options.accessToken[ ]?=)/g;
    matches = content.match(reg);
    if (matches) {
      report += '<BR><b>Tokens:</b><br><span class="mycode" >';
      reg = /[.\S\s ]{40}(options.token[ ]?=)[.\S\s ][.\S\s ]{40}|[.\S\s ]{40}(options.accessToken[ ]?=)[.\S\s ][.\S\s ]{40}/g;
      matches = content.match(reg);
      report += addMatches(matches);
      __report__.usingTokens = true;
    }
    //usingVersion: "\/searchui\/(.*)\/js;js/CoveoJsSearch",
    //usingCultures: "\/js\/cultures\/(\w+)",
    reg = /\/js\/cultures\/([\w-]{2,5})\.js/g;
    matches = content.match(reg);
    if (matches) {
      __report__.usingCulture = true;
      report += '<BR><b>Cultures:</b><br><span class="mycode" >';
      __report__.difficulty += matches.length;
      matches.forEach(function (m) {
        if (m !== undefined) {
          if (!__report__.cultures.includes(m)) {
            __report__.cultures.push(m);
            report += m + ' ';
          }
        }
      });
      reg = /[.\S\s ]{10}\/js\/cultures\/([\w-]{2,5})\.js[.\S\s ][.\S\s ]{40}/g;
      matches = content.match(reg);
      report += addMatches(matches);
    }
    //usingAdditionalSearch: ".search.*.done",
    reg = /getEndpoint\(\).search\([\w\.\(\)]*\).done\( ?function/g;
    matches = content.match(reg);
    if (matches) {
      report += '<BR><b>Additional Search:</b><br><span class="mycode" >';
      reg = /[.\S\s ]{10}getEndpoint\(\).search\([\w\.\(\)]*\).done\( ?function[.\S\s ]{40}/g;
      matches = content.match(reg);
      report += addMatches(matches);
      __report__.usingAdditionalSearch += matches.length;
      __report__.difficulty += matches.length;
    }
    //usingAnalytics: "(analytics.js\/coveoua.js)|CoveoAnalytics"
    reg = /(analytics.js\/coveoua.js)|[\'\"]CoveoAnalytics[\'\"]CoveoAnalytics[\'\"]CoveoAnalytics[\'\"]/g;
    matches = content.match(reg);
    if (matches) {
      report += '<BR><b>Additional Analytics:</b><br><span class="mycode" >';
      reg = /[.\S\s ]{10}(analytics.js\/coveoua.js)[.\S\s ]{40}|[.\S\s ]{10}[\'\"]CoveoAnalytics[\'\"]CoveoAnalytics[\'\"]CoveoAnalytics[\'\"][.\S\s ]{40}/g;
      matches = content.match(reg);
      __report__.usingAdditionalAnalytics += matches.length;
      report += addMatches(matches);
    }
    //usingRecommendations: "CoveoRecommendation"
    reg = /CoveoRecommendation/g;
    matches = content.match(reg);
    if (matches) {
      report += '<BR><b>Recommendations found:</b><br><span class="mycode" >';
      __report__.usingRecommendations = true;
      reg = /[.\S\s ]{10}CoveoRecommendation[.\S\s ]{50}/g;
      matches = content.match(reg);
      report += addMatches(matches);
    }
    reg = /[^\\]\"CoveoFacet/g;
    matches = content.match(reg);
    if (matches) {
      report += '<BR><b>Facets found</b><br><span class="mycode" >';
      __report__.usingFacets = true;
      reg = /[.\S\s ]{10}[^\\]\"CoveoFacet[.\S\s ]{60}/g;
      matches = content.match(reg);
      report += addMatches(matches);
    }
    reg = /[^\\]\"CoveoTab/g;
    matches = content.match(reg);
    if (matches) {
      report += '<BR><b>Tabs found:</b><br><span class="mycode" >';
      __report__.usingTabs = true;
      reg = /[.\S\s ]{10}[^\\]\"CoveoTab[.\S\s ]{40}/g;
      matches = content.match(reg);
      report += addMatches(matches);
    }

    reg = /(window.Sfdc)|(sfdcId)|(CoveoV2Search)/g;
    matches = content.match(reg);
    if (matches) {
      __report__.fromSystem = 'Salesforce';
      report += '<b>Salesforce UI found.</b><br>';
      reg = /data-aura/g;
      matches = content.match(reg);
      if (matches) {
        __report__.fromSystem = 'Salesforce - Lightning';
        report += '<b>Salesforce UI - Lightning found.</b><br>';
      }
      reg = /CoveoBoxHeader/g;
      matches = content.match(reg);
      if (matches) {
        report += '<b>Salesforce UI - Service Cloud found.</b><br>';
        __report__.fromSystem = 'Salesforce - ServiceCloud';
      }
    }
    reg = /(CoveoForSitecore)/g;
    matches = content.match(reg);
    if (matches) {
      report += '<b>Sitecore UI found.</b><br>';
      __report__.fromSystem = 'Sitecore';
    }
    reg = /@media.*\(max/g;
    matches = content.match(reg);
    if (matches) {
      report += '<b>Responsive design found.</b><br>';
      __report__.responsive = true;
    }
    reg = /data-enable-search-as-you-type=.?true/g;
    matches = content.match(reg);
    if (matches) {
      report += '<BR><b>Search As You Type found:</b><br><span class="mycode" >';
      __report__.usingSearchAsYouType = true;
      reg = /[.\S\s ]{10}data-enable-search-as-you-type=.?true[.\S\s ]{40}/g;
      matches = content.match(reg);
      report += addMatches(matches);
    }
    reg = /OmniboxResultList/g;
    matches = content.match(reg);
    if (matches) {
      report += '<BR><b>Search As You Type found:</b><br><span class="mycode" >';
      __report__.usingSearchAsYouType = true;
      reg = /[.\S\s ]{10}OmniboxResultList[.\S\s ]{40}/g;
      matches = content.match(reg);
      report += addMatches(matches);
    }

  }
  if (report !== '') {
    if (external) {
      report = "<br><hr><b><strong>Found in file: <a target='_blank' href='" + name + "'>" + name.substr(name.length - 45) + "</a></strong></b><BR>" + report;
    }
    else {
      report = "<br><hr><b><strong>Found In file: " + name + "</strong></b><BR>" + report;
    }

  }
  __report__.details += report;
  return __report__;
}

function initReport() {
  let THIS_PAGE_COVEO_REPORT = {
    cultures: [],
    customEvents: [],
    difficulty: 0,
    theUrl: '',
    theDate: '',
    pageSize: '',
    forOrgReport: false,
    fromSystem: 'Unknown',
    hardcodedAccessTokens: false,
    indicator: 0,
    nrofraw: 0,
    nroffacets: 0,
    nrofsorts: 0,
    loadtime: 0,
    nrOfResultTemplates: 0,
    onpremise: false,
    pipelines: '',
    responsive: false,
    analyticsFailures: 0,
    underscoretemplates: 0,
    uiVersion: 'Not present',
    usingAdditionalAnalytics: 0,
    usingAdditionalSearch: 0,
    usingCulture: false,
    usingCustomEvents: false,
    usingFacets: false,
    usingLazy: false,
		/*usingLQ: false,
		usingPartialMatch: false,*/
    usingQRE: false,
    searchURL: '',
    usingRecommendations: false,
    usingSearchAsYouType: false,
    details_facettolong: "",
    details_alwaysthesame: "",
    details_pipelines: "",
    cq: [],
    filterfields: [],
    singlewordfields: [],
    singlewordfieldsmatch: [],
    singlewordfieldscontains: [],
    badfields_filtered: [],
    badfields_query: [],
    usingState: false,
    usingTabs: false,
    usingContext: false,
    usingTokens: false,
    querycheck: false,
    badquery: '',
    baddimension: '',
    details: '',
    allfields: [],
    errors: ''
		/*usingFilterField: false,
		usingDQ: false,*/
  };

  return THIS_PAGE_COVEO_REPORT;
}

function sortMe(myarray) {
  myarray.sort(function (a, b) {
    return parseFloat(b.duration) - parseFloat(a.duration);
  });
  return myarray;
}

function sortProperties(obj) {
  // convert object into array
  var sortable = [];
  for (var key in obj)
    if (obj.hasOwnProperty(key))
      sortable.push([key, obj[key]]); // each item is an array in format [key, value]

  // sort items by value
  sortable.sort(function (a, b) {
    return b[1] - a[1]; // compare numbers
  });
  var newObject = {};
  for (var i = 0; i < sortable.length; i++) {
    var key = sortable[i][0];
    var value = sortable[i][1];

    newObject[key] = value;

  }

  return newObject;
}

function getPerformanceReport() {
  var e = window.performance.getEntries();
  var report = {};
  //Totals for charts
  report.location = window.location.href;
  report.T2s = 0;
  report.T12s = 0;
  report.T2001s = 0;
  report.T0200 = 0;
  //report.total = window.performance.timing.loadEventEnd - window.performance.timing.responseEnd;
  report.total = (window.performance.timing.loadEventEnd - window.performance.timing.navigationStart);
  //Total time by resource type
  report.totalbytype = {};
  report.bad = [];
  report.slow = [];
  report.medium = [];
  report.fast = [];

  for (var i in e) {
    var perf = {};
    if (e[i].initiatorType != undefined) {
      if (e[i].duration > report.longest) {
        report.longest = e[i].duration;
      }
      if (e[i].name.match(/(?:.+\/)([^#?;]+)/)) {
        perf.name = e[i].name.match(/(?:.+\/)([^#?;]+)/)[1];
        perf.url = e[i].name;
      }
      else {
        perf.name = e[i].name;
        perf.url = '';
      }
      perf.sent = Math.round(e[i].requestStart - e[i].connectStart, 0);
      perf.backend = Math.round(e[i].responseStart - e[i].requestStart, 0);
      if (e[i].responseStart > 0) {
        perf.receive = Math.round(e[i].responseEnd - e[i].responseStart, 0);
      }
      else {
        perf.receive = Math.round(e[i].duration, 0);
      }
      perf.type = e[i].initiatorType;
      perf.duration = Math.round(e[i].duration, 0);
      perf.TTFB = Math.round(e[i].responseStart - e[i].requestStart, 0);
      if (perf.type in report.totalbytype) {
        report.totalbytype[perf.type] = report.totalbytype[perf.type] + perf.duration;
      }
      else {
        report.totalbytype[perf.type] = perf.duration;
      }
      if (e[i].duration > 2000) {
        report.T2s = report.T2s + 1;
        report.bad.push(perf);
      }
      if (e[i].duration <= 2000 && e[i].duration > 1000) {
        report.T12s = report.T12s + 1;
        report.slow.push(perf);
      }
      if (e[i].duration <= 1000 && e[i].duration > 100) {
        report.T2001s = report.T2001s + 1;
        report.medium.push(perf);
      }
      if (e[i].duration <= 100) {
        report.T0200 = report.T0200 + 1;
        report.fast.push(perf);
      }
    }
  }
  report.bad = sortMe(report.bad);
  report.slow = sortMe(report.slow);
  report.medium = sortMe(report.medium);
  report.fast = sortMe(report.fast);
  report.totalbytype = sortProperties(report.totalbytype);
  return report;
}

function getReport() {
  let theReport = initReport();
  let startTime = Date.now();
  let html = document.documentElement.outerHTML;
  let pageSize = html.length;

  let detailed_report = '';
  var allCoveoComponentsUsed = document.querySelectorAll("*[class^='Coveo'],*[class*=' Coveo']");
  let allClasses = [];
  allCoveoComponentsUsed.forEach(function (obj) {
    obj.classList.forEach(function (cls) {
      if (cls.includes('Coveo') && !allClasses.includes(cls)) {
        allClasses.push(cls);
      }
    });
  });
  //Set the date
  var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  var today = new Date();
  theReport.theDate = today.toLocaleDateString("en-US", options);
  //Get the url
  theReport.theUrl = window.location.protocol + '//' + window.location.hostname + "" + window.location.pathname;
  //Get from the page the number of result templates
  theReport.nrOfResultTemplates = document.querySelectorAll('.result-template').length;

  theReport.underscoretemplates = document.querySelectorAll('.result-template[type="text/underscore"]').length + document.querySelectorAll('.result-template[type="text/x-underscore-template"]').length;

  theReport.nroffacets = document.querySelectorAll('.coveo-facet-header').length;
  theReport.nrofsorts = document.querySelectorAll('.CoveoSort').length;//document.querySelectorAll('.coveo-sort-icon-descending').length;

  // TODO - count FAILURES
  let analyticsFailures = document.querySelectorAll('#myanalyticsfailure').length;
  theReport.analyticsFailures = analyticsFailures;

  detailed_report += parseScript('Original HTML', html, true, false, theReport);
  //We now want to load all scripts
  //For each script we want:
  let scripts = document.querySelectorAll('script');
  scripts.forEach(function (_script_) {
    if (_script_.innerHTML === "") {
      //External, load it
      let all = true;
      let src = _script_.src;

      if (src.includes('/coveoua.js') ||
        src.includes('/aura_proddebug.js') ||
        src.includes('/CoveoForSitecore') ||
        src.includes('/core.js')) {
        all = false;
      }

      let sourceContent = '';

      // TODO -- PARSE ALL SCRIPTS

      if (all) {
        try {
          let request = new XMLHttpRequest();
          request.open('GET', src, false);  // `false` makes the request synchronous
          request.send(null);

          if (request.status === 200) {
            sourceContent = request.responseText;
            if (sourceContent !== undefined) {
              pageSize += sourceContent.length;
            }
          }
        }
        catch (e) {
          console.log("Error loading script: " + src);
        }
      }
      //Do not parse internal files
      let cont = true;
      if (sourceContent) {
        if (sourceContent.includes('if( window.Coveo === undefined) {')) {
          all = false;
        }
        if (sourceContent.includes('Coveo.Ui.TemplateCache.registerTemplate') ||
          sourceContent.includes('Coveo.TemplateCache.registerTemplate') ||
          sourceContent.includes('secretFeatureVariable1309') ||
          sourceContent.includes('window.Coveo = (Coveo || window.Coveo)') ||
          sourceContent.includes('window&&window.Coveo&&window.Coveo') ||
          sourceContent.includes('SearchEndpoint.configureSampleEndpoint')) {
          all = false;
        }
        if (sourceContent.startsWith('webpackJsonpCoveo')) {
          cont = false;
        }
        if (cont) {
          detailed_report += parseScript(src, sourceContent, all, true, theReport);
        }
      }

    }
  });

  theReport.pageSize = Math.round(pageSize / 1024);
  theReport.loadtime = (Date.now() - startTime) / 1000;//Load time in seconds

  return theReport;
}


function downloadReport(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
