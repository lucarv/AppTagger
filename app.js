'use strict';

const jf = require('jsonfile');
var AppsArray = []
const file = '/appdata/appsubscriptions.json'
jf.readFile(file, function (err, obj) {
  if (err) console.error(err)
  else
    AppsArray = obj
})

var Transport = require('azure-iot-device-mqtt').Mqtt;
var Client = require('azure-iot-device').ModuleClient;
var Message = require('azure-iot-device').Message;

const onGetAppSubscription = (req, res) => {
  res.send(200, AppsArray);
}

const onSetAppSubscription = (req, res) => {
  if (!req.payload.hasOwnProperty('Tag') || !req.payload.hasOwnProperty('Asset') || !req.payload.hasOwnProperty('AppId')) {
    res.send(400, 'missing parameter Tag in API call')
  } else {  
    var app = '|' + req.payload.AppId + '|'
    var tag = req.payload.Tag + '#' + req.payload.Asset;
    var index = -1;
    for (var i = 0; i < AppsArray.length; i++) {
      if (AppsArray[i].tag == tag) { // tag is already in list
        AppsArray[i].apps.push(app) // for now just push, later skip duplicates
        index = i
        continue;
      } 
    }
    console.log(index)
    if (index == -1 ) {
      let apps = [];
      apps.push(app)
      AppsArray.push ({tag, apps})
    }
    jf.writeFileSync(file, AppsArray);

    // complete the response
    res.send(200, AppsArray, function (err) {
      if (!!err) {
        console.error('An error ocurred when sending a method response:\n' +
          err.toString());
      } else {
        console.log('Response to method \'' + req.methodName +
          '\' sent successfully.');
      }
    });  
  }
}

Client.fromEnvironment(Transport, function (err, client) {
  if (err) {
    throw err;
  } else {
    client.on('error', function (err) {
      throw err;
    });

    // connect to the Edge instance
    client.open(function (err) {
      if (err) {
        throw err;
      } else {
        console.log('Sincerely Weird 001');

        client.onMethod('setAppSubscription', onSetAppSubscription);
        client.onMethod('getAppSubscription', onGetAppSubscription);

        // Act on input messages to the module.
        client.on('inputMessage', function (inputName, msg) {
          pipeMessage(client, inputName, msg);
        });

      }
    });
  }
});

// This function just pipes the messages without any change.
function pipeMessage(client, inputName, msg) {
  client.complete(msg, printResultFor('Receiving message'));

  if (inputName === 'input1') {
    var message = msg.getBytes().toString('utf8');

    if (message) {
      let msgArray = JSON.parse(message);
      // The outer for loop is used to stop the sending of messages 
      // in a batch array. This could be done before with the --bs 
      // switch on the publisher but it seems not to be working 
      for (var i = 0; i < msgArray.length; i++) {
        msgArray[i].appSubscriptions = "";
        for (var j = 0; j < AppsArray.length; j++) {
          let tag = msgArray[i].DisplayName + '#' + msgArray[i].ApplicationUri;
          if (tag == AppsArray[j].tag) {
            msgArray[i].appSubscriptions = AppsArray[j].apps.join()
          }
        }
        var outputMsg = new Message(JSON.stringify(msgArray[i]));
        outputMsg.contentEncoding = "utf-8";
        outputMsg.contentType = "application/json";
        client.sendOutputEvent('output1', outputMsg, printResultFor('Sending received message'));
      }
    }
  }
}

// Helper function to print results in the console
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) {
      console.log(op + ' error: ' + err.toString());
    }
    if (res) {
      //console.log(op + ' status: ' + res.constructor.name);
    }
  };
}