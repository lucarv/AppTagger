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
        console.log('Tagger Module Connected to Edge Hub');

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
            console.log(msgArray[i].DisplayName + ' >> ' + AppsArray[j].apps)
            console.log(AppsArray[j].apps.join());
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