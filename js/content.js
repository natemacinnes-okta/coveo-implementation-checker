'use strict';
// jshint -W003
/*global chrome*/

let THIS_PAGE_COVEO_REPORT = {};

function addConsoleTracker() {
	var html = '';
	// html += "<script>";
	html += "   (function(){ ";
	html += " if(window.console && console.log){";
	html += " var old = console.log;";
	html += " console.log = function(){";
	html += "    var message = Array.prototype.slice.apply(arguments).join(' '); ";
	html += "      if (message.indexOf('A search was triggered, but no analytics')!=-1 || message.indexOf('warnAboutSearchEvent')!=-1) {";
	html += "          $('body').append('<div id=myanalyticsfailure></div>'); ";
	html += "      Array.prototype.unshift.call(arguments, 'MAYDAY: '); ";
	html += "      }";
	html += "     old.apply(this, arguments)";
	html += "    } ";
	html += "  }  ";
	html += " })();";
	// html += "</script>";
	return html;
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
			{ label: "JS UI version (should be 2.3679)", value: "2.3679.4", expected: /^2\.3679/ },
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
			else if (request.type === 'getNumbers') {
				let reportJson = getReport();
				//We also have the global numbers so merge them with the json
				reportJson = extend(reportJson, request.global);
				SendMessage({
					type: "gotNumbers",
					json: reportJson
				});


				// //analyzePage();
				// analyticsSent = request.analyticsSent;
				// nrofsearches = request.nrofsearches;
				// searchSent = request.searchSent;
				// suggestSent = request.suggestSent;
				// topQueriesSent = request.topQueriesSent;
				// dqUsed = request.dqUsed;
				// lqUsed = request.lqUsed;
				// filterFieldUsed = request.filterFieldUsed;
				// partialMatchUsed = request.partialMatchUsed;
				// contextUsed = request.contextUsed;
				// alertsError = request.alertsError;
				// analyticsToken = request.analyticsToken;
				// searchToken = request.searchToken;
				// image = request.image;
				// //				$('#mywebsiteimage').attr('src', msg.image);

			}
		}
	);
}

// var indicator;
// var difficulty;
// var detailed_report;
// var usingRecommendations;
// var uiVersion;
// var usingPartialMatch;
// var usingLQ;
// var usingSearchAsYouType;
// var fromSystem;
// var usingFacets;
// var usingTabs;
// var nrOfResultTemplates;
// var usingState;
// var usingCustomEvents;
// var customEvents;
// var usingTokens;
// var usingCulture;
// var cultures;
// var usingAdditionalSearch;
// var usingQRE;
// var usingAdditionalAnalytics;
// var pagesize;
// var responsive;
// var pipelines;
// var hardcodedAccessTokens;
// var onpremise;
// var nrofraw;
// var generated;
function extend(obj, src) {
	for (var key in src) {
		if (src.hasOwnProperty(key)) obj[key] = src[key];
	}
	return obj;
}

function cleanMatch(match) {
	return match.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace('\n', '<BR>¶ ') + "<BR>";
}

function addMatches(matches) {
	var report = '';
	matches.forEach(function (m) {
		report += cleanMatch(m);
	});
	report += "</span>";
	return report;
}

function parseScript(name, content, all, external, __report__) {
	let report = '';
	// let __report__ = {
	// 	customEvents: [],
	// 	difficulty: 0,
	// 	nrofraw: 0,
	// };

	console.log('Parsing: ' + name + '... ');
	content = String(content);

	// $('#myreportdetails').html('Parsing: ' + name + '... one moment...');
	//Lazy
	if (name.toLowerCase().indexOf('lazy') !== -1) {
		__report__.usingLazy = true;
	}
	//Version?
	var reg = /[\"']?lib[\"']? ?: ?[\"']\d[^m](.*?)[\"'],/g;///"?lib"? ?: ?['"](.*)['"].*\n?.*"?product"?: ?['"](.*)['"],/g;
	let matches = content.match(reg);
	if (matches) {
		__report__.uiVersion = matches[0].replace(/lib\w*/g, '').replace(/[:',"]/g, '');
		reg = /[.\S\s ]{19}[\"']?lib[\"']? ?: ?[\"']\d[^m](.*?)[\"'],[.\S\s ]{40}/g;
		matches = content.match(reg);
		report += '<BR><b>UI Version found:</b><BR><span class="mycode">' + matches[0].replace('\n', ' ').replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</span><BR>";
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
	  /*reg = /result-template/g;
	  matches = content.match(reg);
	  if (matches)
	  {
		nrOfResultTemplates = nrOfResultTemplates+matches.length;
		report += "<BR>";
	  }*/
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
	THIS_PAGE_COVEO_REPORT = {
		cultures: [],
		customEvents: [],
		difficulty: 0,
		theUrl: '',
		pageSize: '',
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
		usingRecommendations: false,
		usingSearchAsYouType: false,

		usingState: false,
		usingTabs: false,
		usingContext: false,
		usingTokens: false,
		details: '',
		/*usingFilterField: false,
		usingDQ: false,*/
	};

	return THIS_PAGE_COVEO_REPORT;
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
	//Get the url
	theReport.theUrl = window.location.protocol + '//' + window.location.hostname;
	//Get from the page the number of result templates
	theReport.nrOfResultTemplates = document.querySelectorAll('.result-template').length;

	theReport.underscoretemplates = document.querySelectorAll('.result-template[type="text/underscore"]').length + document.querySelectorAll('.result-template[type="text/x-underscore-template"]').length;

	theReport.nroffacets = document.querySelectorAll('.coveo-facet-header').length;
	theReport.nrofsorts = document.querySelectorAll('.coveo-sort-icon-descending').length;

	// TODO - count FAILURES
	// let analyticsFailures = $('#myanalyticsfailure').length;
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

			//if (src.includes('/js/CoveoJsSearch') || src.includes('/coveoua.js') || src.includes('/CoveoForSitecore') || src.includes('/core.js')) {
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
			//Do not parse internal files
			if (sourceContent) {
				if (sourceContent.includes('if( window.Coveo === undefined) {')) {
					//cont=false;
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
		else {
			//Looks like we do not have to do this, because we already got it when parsing the full page...
			/*let name = 'Original file, ';
			if (_script_.className !==""){
                name += " "+_script_.className;
			}
			else
			{
                name += " Inner script.";
			}
			detailed_report += parseScript(name, _script_.innerHTML, true, false, theReport);*/
		}
	});
	//var mes=$.getScript($('script')[2].src);
	report += "Components used: " + allClasses.join('<BR>');

	//alert('Your Coveo implementation score: '+indicator+'/10, reasons: '+indicator_report.substring(1)+'\n\nDifficulty of implemenation: '+difficulty+', reasons: '+difficulty_report.substring(1)+'\nSee developer console for more details.');
	//$('#myreport').html('Your Coveo implementation score: '+indicator+'/10, reasons: '+indicator_report.substring(1)+'<BR><BR>Difficulty of implemenation: '+difficulty+', reasons: '+difficulty_report.substring(1)+"<BR>"+report);

	var report = '';
	//
	report += "<table cellpadding=2 class='myreporttable'>";
	report += "<tr style='padding-top:10px;height:55px;'><td colspan=2 style='text-align:left'><b>General information:</b></tr>";

	let indic = 'lightgreen';
	// if (theReport.uiVersion) {
	// 	if (theReport.uiVersion.indexOf(EXPECTED.currentUI) === -1) { indic = '#ef1a45'; }
	// 	report += "<tr><td>JS UI version:<br>Should be: " + EXPECTED.currentUI + "</td><td style='background-color:" + indic + "'>" + theReport.uiVersion + "</td></tr>";
	// 	report += "<tr><td>Integrated in UI:</td><td>" + theReport.fromSystem + "</td></tr>";
	// }

	indic = '#ef1a45';
	if (theReport.hardcodedAccessTokens) {
		report += "<tr><td>Hard coded Access Tokens<br>(Should NOT be done!!):</td><td style='background-color:" + indic + "'>" + theReport.hardcodedAccessTokens + "</td></tr>";
	}

	// indic = '#ef1a45';
	// if (alertsError !== "") {
	// 	report += "<tr><td>Search alerts error<br>(Bad access to search alert subscriptions)<br>Or remove component class='CoveoSearchAlerts':</td><td style='background-color:" + indic + "'>" + alertsError + "</td></tr>";
	// }
	// indic = '#ef1a45';
	// if (analyticsFailures !== 0) {
	// 	report += "<tr><td>Searches executed without sending analytics<br>(Manual triggered search did not sent analytics):</td><td style='background-color:" + indic + "'>" + "true" + "</td></tr>";
	// }


	//Behavior
	report += "<tr style='padding-top:10px;height:55px;'><td colspan=2 style='text-align:left'><b>Behavior information:</b></tr>";

	// indic = 'lightgreen';
	// if (nrofsearches > 1) { indic = '#ef1a45'; }
	// report += "<tr><td>Nr of searches executed<br>(should be 1):</td><td style='background-color:" + indic + "'>" + nrofsearches + "</td></tr>";

	// indic = 'lightgreen';
	// if (!searchSent) { indic = '#ef1a45'; }
	// report += "<tr><td>Search Events Sent<br>using our api (should be true):</td><td style='background-color:" + indic + "'>" + searchSent + "</td></tr>";

	// indic = 'lightgreen';
	// if (!analyticsSent) { indic = '#ef1a45'; }
	// report += "<tr><td>Analytics Sent<br>(should be true):</td><td style='background-color:" + indic + "'>" + analyticsSent + "</td></tr>";

	indic = 'lightgreen';
	if (theReport.usingSearchAsYouType) { indic = '#ef1a45'; }
	report += "<tr><td>Using search as you type<br>Eats performance!!! (should be false):</td><td style='background-color:" + indic + "'>" + theReport.usingSearchAsYouType + "</td></tr>";

	// indic = 'lightgreen';
	// if (!suggestSent) { indic = '#ef1a45'; }
	// report += "<tr><td>Using ML Powered Query Completions<br>(should be true):</td><td style='background-color:" + indic + "'>" + suggestSent + "</td></tr>";

	// indic = 'lightgreen';
	// if (!topQueriesSent) { indic = '#ef1a45'; }
	// if (topQueriesSent && suggestSent) { indic = '#ef1a45'; }
	// if (!topQueriesSent && suggestSent) { indic = 'lightgreen'; }
	// report += "<tr><td>Using Analytics Query Completions<br>(should be true)<br>if ML Powered Query Completions enabled, then it should be false:</td><td style='background-color:" + indic + "'>" + topQueriesSent + "</td></tr>";

	//implementation
	report += "<tr style='padding-top:10px;height:55px;'><td colspan=2 style='text-align:left'><b>Implementation information:</b></tr>";
	report += "<tr><td>Pagesize in kB:</td><td>" + Math.round(pageSize / 1024) + " kB</td></tr>";
	theReport.pageSize = Math.round(pageSize / 1024);
	indic = 'lightgreen';
	if (theReport.usingState) { indic = '#ef1a45'; }
	report += "<tr><td>Using state in code<br>(more complicated):</td><td style='background-color:" + indic + "'>" + theReport.usingState + "</td></tr>";

	// indic = 'lightgreen';
	// if (partialMatchUsed) { indic = '#ef1a45'; }
	// report += "<tr><td>Using partial match<br>(more fine tuning needed):</td><td style='background-color:" + indic + "'>" + partialMatchUsed + "</td></tr>";

	// indic = 'lightgreen';
	// if (lqUsed) { indic = '#ef1a45'; }
	// report += "<tr><td>Using Long Queries (ML)<br>(more fine tuning needed):</td><td style='background-color:" + indic + "'>" + lqUsed + "</td></tr>";

	// indic = 'lightgreen';
	// if (usingQRE) { indic = '#ef1a45'; }
	// report += "<tr><td>Using QRE<br>(more fine tuning needed):</td><td style='background-color:" + indic + "'>" + usingQRE + "</td></tr>";
	// indic = 'lightgreen';
	// if (filterFieldUsed) { indic = '#ef1a45'; }
	// report += "<tr><td>Using Filter Field (Folding)<br>(more fine tuning needed):</td><td style='background-color:" + indic + "'>" + filterFieldUsed + "</td></tr>";
	// indic = 'lightgreen';
	// if (contextUsed) { indic = '#ef1a45'; }
	// report += "<tr><td>Using Context<br>(more fine tuning needed):</td><td style='background-color:" + indic + "'>" + contextUsed + "</td></tr>";
	// indic = 'lightgreen';
	// if (pipelines === '' || pipelines.indexOf('default') !== -1) { indic = '#ef1a45'; }
	// report += "<tr><td>Using default pipelines<br>(ML should use dedicated pipelines):</td><td style='background-color:" + indic + "'>" + pipelines + "</td></tr>";
	// indic = 'lightgreen';
	// if (usingTokens || hardcodedAccessTokens) { indic = '#ef1a45'; }
	// report += "<tr><td>Setting tokens by code<br>(API keys in code?):</td><td style='background-color:" + indic + "'>" + (usingTokens || hardcodedAccessTokens) + "</td></tr>";
	// indic = 'lightgreen';
	// if (usingCustomEvents) { indic = '#ef1a45'; }
	// report += "<tr><td>Additional custom events<br>(more complicated):</td><td style='background-color:" + indic + "'>" + usingCustomEvents + "<BR>" + customEvents.join('<BR>') + "</td></tr>";
	// indic = 'lightgreen';
	// if (usingAdditionalSearch > 0) { indic = '#ef1a45'; }
	// report += "<tr><td>Additional search events are coded<br>(more complicated):</td><td style='background-color:" + indic + "'>" + usingAdditionalSearch + "</td></tr>";
	// indic = 'lightgreen';
	// if (usingAdditionalAnalytics > 1) { indic = '#ef1a45'; }
	// report += "<tr><td>Additional analytic events are coded<br>(more complicated):</td><td style='background-color:" + indic + "'>" + usingAdditionalAnalytics + "</td></tr>";
	// indic = 'lightgreen';
	// if (onpremise) { indic = '#ef1a45'; }
	// report += "<tr><td>On-premise index<br>(better to use cloud):</td><td style='background-color:" + indic + "'>" + onpremise + "</td></tr>";

	// //UI
	// report += "<tr style='padding-top:10px;height:55px;'><td colspan=2 style='text-align:left'><b>UI information:</b></tr>";
	// indic = 'lightgreen';
	// if (!usingLazy) { indic = '#ef1a45'; }
	// report += "<tr><td>Lazy Loading<br>(Should be true, better performance):</td><td style='background-color:" + indic + "'>" + usingLazy + "</td></tr>";

	// report += "<tr><td>Using Facets:</td><td>" + usingFacets + "</td></tr>";
	// report += "<tr><td>Using Tabbed interfaces:</td><td>" + usingTabs + "</td></tr>";
	// var indic;
	// indic = 'lightgreen';
	// if (!usingFacets) { indic = '#ef1a45'; }
	// report += "<tr><td>Using Facets<br>(should be true):</td><td style='background-color:" + indic + "'>" + usingFacets + "</td></tr>";
	// indic = 'lightgreen';
	// if (nroffacets > 5) { indic = '#ef1a45'; }
	// report += "<tr><td>Nr of active Facets<br>(should less then 5):</td><td style='background-color:" + indic + "'>" + nroffacets + "</td></tr>";
	// indic = 'lightgreen';
	// if (nrofsorts > 3) { indic = '#ef1a45'; }
	// report += "<tr><td>Nr of active Sorts<br>(should less then 3):</td><td style='background-color:" + indic + "'>" + nrofsorts + "</td></tr>";
	// indic = 'lightgreen';
	// if (!usingTabs) { indic = '#ef1a45'; }
	// report += "<tr><td>Using Tabs<br>(should be true):</td><td style='background-color:" + indic + "'>" + usingTabs + "</td></tr>";
	// indic = 'lightgreen';
	// if (!usingRecommendations) { indic = '#ef1a45'; }
	// report += "<tr><td>Using ML Recommendations<br>(should be true):</td><td style='background-color:" + indic + "'>" + usingRecommendations + "</td></tr>";
	// indic = 'lightgreen';
	// if (nrOfResultTemplates > 5) { indic = '#ef1a45'; }
	// report += "<tr><td>Nr of result templates<br>(should less then 5):</td><td style='background-color:" + indic + "'>" + nrOfResultTemplates + "</td></tr>";
	// indic = 'lightgreen';
	// if (underscoretemplates > 0) { indic = '#ef1a45'; }
	// report += "<tr><td>Nr of underscore result templates<br>(should less then 1):</td><td style='background-color:" + indic + "'>" + underscoretemplates + "</td></tr>";
	// indic = 'lightgreen';
	// if (nrofraw > 5) { indic = '#ef1a45'; }
	// report += "<tr><td>Nr of raw. use<br>(should less then 5):</td><td style='background-color:" + indic + "'>" + nrofraw + "</td></tr>";
	// indic = 'lightgreen';
	// if (usingCulture) { indic = '#ef1a45'; }
	// report += "<tr><td>Additional cultures<br>(more complicated):</td><td style='background-color:" + indic + "'>" + cultures + "<BR>" + cultures.join('<BR>') + "</td></tr>";
	// report += "<tr><td>Components used in the UI:</td><td>" + allClasses.join('<BR>') + "</td></tr>";

	// //Tokens
	// report += "<tr style='padding-top:10px;height:55px;'><td colspan=2 style='text-align:left'><b>Token information:</b></tr>";
	// report += "<tr><td colspan=2 style='text-align:left'>Searches executed with token info:</td></tr>";
	// indic = 'lightgreen';
	// try {
	// 	if (searchToken.indexOf('Bearer') !== -1) { indic = '#ef1a45'; }
	// 	report += "<tr><td colspan=2 style='word-wrap:break-word;font-family:courier;text-align:left;background-color:" + indic + "'><pre style='width:820px;overflow:hidden'>" + searchToken + "</pre></td></tr>";
	// 	report += "<tr><td colspan=2 style='text-align:left'>Analytics executed with token info:</td></tr>";
	// 	indic = 'lightgreen';
	// 	if (analyticsToken.indexOf('Bearer') !== -1) { indic = '#ef1a45'; }
	// 	report += "<tr><td style='word-wrap:break-word;font-family:courier;text-align:left;background-color:" + indic + "' colspan=2><pre  style='width:820px;overflow:hidden'>" + analyticsToken + "</pre></td></tr>";
	// }
	// catch (e) {
	// }

	//Details
	report += "<tr style='padding-top:10px;height:55px;'><td colspan=2 style='text-align:left'><b>Detailed information:</b></tr>";
	report += "<tr><td colspan=2 style='text-align:left'>" + detailed_report + "</td></tr>";
	// theReport.details = detailed_report;
	// $('#myreportdetails').html(report);
	theReport.loadtime = (Date.now() - startTime) / 1000;//Load time in seconds
	//Set searchcompletions

	return theReport;
}
