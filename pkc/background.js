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

