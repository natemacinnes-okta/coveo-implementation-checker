'use strict';
// jshint -W110, -W003
/*global chrome*/

let SendMessageToPopup = (payload) => {
	setTimeout(() => {
		try {
			chrome.runtime.sendMessage(payload);
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
	SendMessageToPopup([{
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
		}
	);
}
