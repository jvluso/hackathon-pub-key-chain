'use strict';
var web3;
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

  const contract = new web3.eth.Contract(web3Key,
     '0x8bf5986f5a2388ac9617f10333c8720c11760c32');

   pgp.generateKey(opts).then(newKey => {
    // newKey, newKey.privateKeyArmored, newKey.publicKeyArmored
    newUserKey.public = pgp.key.readArmored(newKey.publicKeyArmored).keys[0];
    newUserKey.publicKeyArmored = newKey.publicKeyArmored;
    let ue = getUserNameAndEmailAddress(newUserKey.public);
    // let userName = ue[0], emailAddress = ue[1];

    let callObj = contract.methods.join(emailAddress, emailAddress);
    callObj.call();
  });
  
  return pgp.generateKey(opts);
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
  publicKey = pgp.key.readArmored(publicKey).keys[0];
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
    message: pgp.message.readArmored(ciphertext)
  };
  return pgp.decrypt(decOpt).then(decrypted => decrypted.data);
}

function encrypt(publicKey, plaintext) {
  let encOpt = {
    publicKeys: publicKey,
    data: plaintext
  };
  return pgp.encrypt(encOpt).then(encrypted => encrypted.data);
}

function sign(text) {
  let signOpt = {
    privateKeys: newUserKey.private,
    data: text
  };
  return pgp.sign(signOpt).then(result => result.data);
}

function verifyChalglenge(from, responseBody) {
  let verOpt = {
    message: pgp.cleartext.readArmored(responseBody),
    publicKeys: allPublicKeys[from]
  };
  return pgp.verify(verOpt).then(result => {
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
    newUserKey.public = pgp.key.readArmored(newKey.publicKeyArmored).keys[0];
    newUserKey.publicKeyArmored = newKey.publicKeyArmored;
    let ue = getUserNameAndEmailAddress(newUserKey.public);
    let userName = ue[0], emailAddress = ue[1];
    
    let priKey = pgp.key.readArmored(newKey.privateKeyArmored).keys[0];
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

main();
