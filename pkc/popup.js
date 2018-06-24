"use strict";

let bgPage = new Promise((resolve, reject) => {
	chrome.runtime.getBackgroundPage(bgw => {
		resolve(bgw);
	});
});

let $resultLabel;

$(document).ready(() => {
  $resultLabel = $("#result");

  // Event handlers
  $("#generateKeys").click(() => {
    bgPage.then(bgWindow => {
      bgWindow.checkEmails();
      bgWindow.generateKey();
    });
  });

  $("#getPublicKey").click(() => {
    let input = $("#emailAddress").val();
    bgPage.then(bgWindow => {
      $resultLabel.val(input);
    });
  });
});
