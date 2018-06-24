 chrome.runtime.onInstalled.addListener(function() {
      chrome.identity.getAuthToken({interactive: true}, authorizationCallback);
  });

 var authorizationCallback = function (data) {
    console.log("The token..........." + data);
    gapi.auth.setToken({access_token: data});
    gapi.client.load('gmail', 'v1', function () {
    gapi.client.load('drive', 'v2', listThreads);
    });
    requestTimerId = window.setInterval(listThreads, 3*1000, 'me','Subject:[PKC] is:unread',getThread);
  }


function listThreads(userId, query, callback) {
  var resp = null
  var getPageOfThreads = function(request, result) {
    request.execute(function (resp) {
      if(resp != undefined ){
          var id = resp.threads[0].id
          console.log("message id ..." + id );
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
      if(resp != undefined ){
          base64 = resp.messages[0].payload.parts[0].body.data
          console.log(base64);
      }
    });
}

var getMessageIdFromUrl = function (url) {
    var hash = getHashFromUrl(url);
    return hash.substr(hash.lastIndexOf("/") + 1);
};

function getHashFromUrl(url) {
    return url.substr(url.lastIndexOf("#") + 1);
}