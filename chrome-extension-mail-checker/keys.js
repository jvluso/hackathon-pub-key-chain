let userName = "PKC", emailAddress = "address@gmail.com", userPassphrase="none";
let pgp = window.openpgp;

function generateKey() {
  let opts = {
    userIds: { name: userName, email: emailAddress },
    numBits: 2048,
    passphrase: userPassphrase
  };
  
  return pgp.generateKey(opts);
}

function getUserNameAndEmailAddress(publicKeyArmored) {
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

// Utils
function array2base64(array) {
  let b = array.reduce((res, byte) => res + String.fromCharCode(byte), '');
  return btoa(b);
}

function base642array(str) {
  return atob(str).split("").map(c => c.charCodeAt(0));
}

function main() {
  generateKey().then(newKey => {
    // newKey, newKey.privateKeyArmored, newKey.publicKeyArmored
    let publicKey = pgp.key.readArmored(newKey.publicKeyArmored).keys[0];
    let ue = getUserNameAndEmailAddress(publicKey);
    let userName = ue[0], emailAddress = ue[1];
  });
}

main();
