"use strict";

let bgPage = new Promise((resolve, reject) => {
	chrome.runtime.getBackgroundPage(bgw => {
		resolve(bgw);
	});
});

$(document).ready(() => {
  // Event handlers
  $("#generateKeys").click(() => {
    bgPage.then(bgWindow => {
      bgWindow.checkEmails();
      bgWindow.generateKey();
    })
  });

  $("#getPublicKey").click(() => {

  });
});
