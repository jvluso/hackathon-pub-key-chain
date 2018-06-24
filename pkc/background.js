'use strict';
var web3;

window.setTimeout(() => {
  if(typeof window.web3 !== "undefined" && typeof window.web3.currentProvider !== "undefined") {
    web3 = new Web3(window.web3.currentProvider);
  }
  else {
    web3 = new Web3();
  }
  }, 2000);

var web3Keys = chrome.extension.getURL('KeyRegistey.json');

let userName = "", emailAddress = window.userEmailAddress;
let userPassphrase="none";
let pgp = window.openpgp;
let allPublicKeys = {};
let newUserKey = {public: null, private: null, publicKeyArmored: null};
let plainNonce = undefined;

function generateKey() {
  let opts = {
    userIds: { name: userName, email: emailAddress },
    numBits: 2048,
    passphrase: userPassphrase
  };

  var contract = new web3.eth.contract(web3Keys, '0x8bf5986f5a2388ac9617f10333c8720c11760c32');

   window.openpgp.generateKey(opts).then(newKey => {
    // newKey, newKey.privateKeyArmored, newKey.publicKeyArmored
    newUserKey.public = window.openpgp.key.readArmored(newKey.publicKeyArmored).keys[0];
    newUserKey.publicKeyArmored = newKey.publicKeyArmored;
    let ue = getUserNameAndEmailAddress(newUserKey.public);
    // let userName = ue[0], emailAddress = ue[1];
    let priKey = window.openpgp.key.readArmored(newKey.privateKeyArmored).keys[0];
    priKey.decrypt(userPassphrase).then(result => {
      newUserKey.private = priKey;
    })
    .then(() => {
      let callObj = contract.methods.join(emailAddress, emailAddress);
      callObj.call();
    });
  });
  
  return window.openpgp.generateKey(opts);
}


window.generateKey = generateKey;
window.newUser = true;

function getUserNameAndEmailAddress(publicKey) {
  let userid = publicKey.users[0].userId.userid;
  let user = /^(.*)<(.*)>$/.exec(userid);
  if (user.length != 3)
    throw new Error("Cannot get userid from the certificate")
  let userName = user[1], emailAddress = user[2];
  return [userName, emailAddress];
}

// A 32-byte random number
function generateNonce() {
  var array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return array; //array2base64(array);
}

function increaseNonceStupid(array) {
  let lastByte = array[31];
  ++lastByte;
  array[31] = lastByte;
}

function challenge(emailAddress, publicKey, id) {
  let nonceStr = array2base64(generateNonce());
  plainNonce = nonceStr;
  let subject = "[PKC]";
  publicKey = window.openpgp.key.readArmored(publicKey).keys[0];
  return encrypt(publicKey, nonceStr).then(cipherText => {
    //TODO Send out challenge email
    sendEmail(emailAddress, subject, cipherText);
    allPublicKeys[emailAddress] = publicKey;
    // For testing
    return cipherText;
  });
}

function sendEmail(emailAddress, subject, content) {
}

function decrypt(ciphertext) {
  let decOpt = {
    privateKeys: newUserKey.private,
    message: window.openpgp.message.readArmored(ciphertext)
  };
  return window.openpgp.decrypt(decOpt).then(decrypted => decrypted.data);
}

function encrypt(publicKey, plaintext) {
  let encOpt = {
    publicKeys: publicKey,
    data: plaintext
  };
  return window.openpgp.encrypt(encOpt).then(encrypted => encrypted.data);
}

function sign(text) {
  let signOpt = {
    privateKeys: newUserKey.private,
    data: text
  };
  return window.openpgp.sign(signOpt).then(result => result.data);
}

function verifyChalglenge(from, responseBody) {
  let verOpt = {
    message: window.openpgp.cleartext.readArmored(responseBody),
    publicKeys: allPublicKeys[from]
  };
  return window.openpgp.verify(verOpt).then(result => {
    let signatures = result.signatures;
    if (signatures && signatures[0] && signatures[0].valid)
      return true;
    else
      return false;
  });
}

// Utils
function array2base64(array) {
  let b = array.reduce((res, byte) => res + String.fromCharCode(byte), '');
  return btoa(b);
}

function base642array(str) {
  return atob(str).split("").map(c => c.charCodeAt(0));
}

function processNewEmail(from, subject, content) {
  // if subject is [PKC], then I'm a new user
  if (subject === "[PKC]") {
    decrypt(content).then(sign).then(signedResult => {
      sendMessage('me', from, '[PKC-RESPONSE]', signedResult);
    });
  }
  // if subject is [PKC-RESPONSE], then I'm an existing node
  else if (subject === "[PKC-RESPONSE]") {
    verifyChalglenge(from, content).then(result => {
      // result is true/false
    });
  }
}

function main() {
  generateKey().then(newKey => {
    // newKey, newKey.privateKeyArmored, newKey.publicKeyArmored
    newUserKey.public = window.openpgp.key.readArmored(newKey.publicKeyArmored).keys[0];
    newUserKey.publicKeyArmored = newKey.publicKeyArmored;
    let ue = getUserNameAndEmailAddress(newUserKey.public);
    let userName = ue[0], emailAddress = ue[1];
    
    let priKey = window.openpgp.key.readArmored(newKey.privateKeyArmored).keys[0];
    priKey.decrypt(userPassphrase).then(result => {
      newUserKey.private = priKey;
    })
    .then(() => {
      return challenge("new@gmail.com", newUserKey.publicKeyArmored, "id");
    })
    .then(decrypt)
    .then(decNonce => {
      let en = (plainNonce === decNonce);
    });
  });
}

// main();

chrome.runtime.onInstalled.addListener(function () {
  chrome.identity.getAuthToken({ interactive: true }, authorizationCallback);
  chrome.identity.getProfileUserInfo(userInfo => {
    window.userEmailAddress = userInfo.email;
  });
});

var authorizationCallback = function (data) {
  console.log("The token..........." + data);
  gapi.auth.setToken({ access_token: data });
  gapi.client.load('gmail', 'v1', function () {
    gapi.client.load('drive', 'v2', listThreads);
  });
  // requestTimerId = window.setInterval(listThreads, 5*1000, 'me','Subject:[PKC] is:unread',getThread);
}

window.checkEmails = function () {
  window.setInterval(listThreads, 5 * 1000, 'me', 'is:unread', getThread);
};

function listThreads(userId, query, callback) {
  var resp = null
  var getPageOfThreads = function (request, result) {
    request.execute(function (resp) {
      if (resp != undefined && resp.threads != undefined) {
        var id = resp.threads[0].id
        console.log("message id ..." + id);
        callback(id);
      }
    });
  };
  var request = gapi.client.gmail.users.threads.list({
    'userId': userId,
    'q': query
  });
  getPageOfThreads(request, []);
}

function getThread(threadId) {
  var request = gapi.client.gmail.users.threads.get({
    'userId': 'me',
    'id': threadId
  });
  var base64 = null
  request.execute(function (resp) {
    if (resp != undefined) {
      if (resp.messages != undefined && resp.messages[0].payload != undefined && resp.messages[0].payload.parts != undefined) {
        base64 = getMessageContent(resp)
        console.log(base64);
        var subject = getMessageSubject(resp)
        console.log(subject);
        // sendMessage('me', "hankzhg@gmail.com", "my pkc test", "just a test", null)
      }
    }
  });
}

function getMessageSubject(resp) {
  return resp.messages[0].payload.headers[5];
}

function getMessageFrom(resp) {
  return resp.messages[0].payload.headers[6];
}

function getMessageContent(resp) {
  var content = resp.messages[0].payload.parts[0].body.data
  if (content != undefined && content != null) {
    content = atob(content);
  }
  return content
}

function sendMessage(userId, receiverEmailAddress, subject, content, callback) {
  // var receiver    = 'hankzhg@gmail.com';
  var to = 'To: ' + receiverEmailAddress;
  var from = 'From: ' + 'me';
  var subject = 'Subject: ' + subject;
  var contentType = 'Content-Type: text/plain; charset=utf-8';
  var mime = 'MIME-Version: 1.0';

  var message = "";
  message += to + "\r\n";
  message += from + "\r\n";
  message += subject + "\r\n";
  message += contentType + "\r\n";
  message += mime + "\r\n";
  message += "\r\n" + content;


  console.log("sending email...");
  var base64EncodedEmail = Base64.encodeURI(message);
  var request = gapi.client.gmail.users.messages.send({

    'userId': userId,
    'resource': {
      'raw': base64EncodedEmail
    }
  });
  // request.execute(callback);
  request.execute(function (resp) {
    console.log("post send message..." + resp);
  });
}

function sendMessageCallBack(result) {
  console.log("post send message..." + result);
}

var getMessageIdFromUrl = function (url) {
  var hash = getHashFromUrl(url);
  return hash.substr(hash.lastIndexOf("/") + 1);
};

function getHashFromUrl(url) {
  return url.substr(url.lastIndexOf("#") + 1);
}

