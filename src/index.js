/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');
var options = require('./options');
var request = require('request');

var APP_ID = options.appid;

var DummySkill = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
DummySkill.prototype = Object.create(AlexaSkill.prototype);
DummySkill.prototype.constructor = DummySkill;

/**
 * Overriden to show that a subclass can override this function to initialize session state.
 */
DummySkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // Any session init logic would go here.
};

/**
 * If the user launches without specifying an intent, route to the correct function.
 */
DummySkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("DummySkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);

    handleGreetIntent(session, response);
};

/**
 * Overriden to show that a subclass can override this function to teardown session state.
 */
DummySkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    //Any session cleanup logic would go here.
};

DummySkill.prototype.intentHandlers = {
    ConvertIntent: function (intent, session, response) {
      console.log("ConvertIntent Recieved");
      handleConvertIntent(intent, session, response);
    },
    PastConvertIntent: function (intent, session, response) {
      console.log("PastConvertIntent Recieved");
      handlePastConvertIntent(intent, session, response);
    },
    FeedbackIntent: function (intent, session, response) {
      handleFeedbackIntent(intent, session, response);
    },
    BugIntent: function (intent, session, response) {
      handleBugIntent(intent, session, response);
    },

    HelpIntent: function (intent, session, response) {
      var speechOutput = "Please consult README for instructions on how to use this skill. ";

      // For the repromptText, play the speechOutput again
      response.ask({speech: speechOutput, type: AlexaSkill.speechOutput.PLAIN_TEXT},
                   {speech: speechOutput, type: AlexaSkill.speechOutput.PLAIN_TEXT});
    }
}

function handleGreetIntent(session, response){
  var speechOutput = "Welcome to Currency. You can say, alexa ask currency to convert five Canadian dollars to U.S. Dollars" ;
  response.tell({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML});
}

//Alexa, ask Currency how to submit feedback
function handleFeedbackIntent (intent, session, response){
  var speechOutput = "You can create an issue at github.com forward slash <say-as interpret-as\"characters\">bxio</say-as> forward slash Alexa Currency. " ;
  var cardOutput = "To submit feedback, please create an issue at http://github.com/bxio/AlexaCurrency";
  response.tellWithCard({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
      "Currency Converter", cardOutput);
}

//Alexa, ask Currency how to report a bug
function handleBugIntent (intent, session, response){
  var speechOutput = "Am I misbehaving? Please send an email to bill at billxiong dot com. " ;
  var cardOutput = "Please email bill@billxiong.com";
  response.tellWithCard({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
      "Currency Converter", cardOutput);
}


function handlePastConvertIntent(intent, session, response){
  //Alexa ask currency what is the conversion rate between canadian dollars and american dollars on january third two thousand and ten
  //A date is provided, we should query fixer api instead.
  var speechOutput = "";
  var cardOutput = "";

  var path = 'http://api.fixer.io/'+intent.slots.DateOfConversion.value+'?symbols='+currency.WordsToSymbols[intent.slots.Source.value.toLowerCase()]+','+currency.WordsToSymbols[intent.slots.Destination.value.toLowerCase()];

  //Lets configure and request
  request({
      url: path, //URL to hit
      qs: {base: currency.WordsToSymbols[intent.slots.Source.value.toLowerCase()]}, //Query string data
      method: 'GET', //Specify the method
    }, function(error, serverResponse, body){
      if(error) {
        //console.log("error...");
        speechOutput = "I'm having trouble understanding the reply from server. Send the following to my creator:"+body;
      } else {
        //console.log(serverResponse.statusCode, body);
        rsp = JSON.parse(body);
        // speechOutput = "URL:"+path;
        speechOutput += " The rate between "+intent.slots.Source.value+" and "+intent.slots.Destination.value+" was "+rsp.rates[currency.WordsToSymbols[intent.slots.Destination.value.toLowerCase()]];
        cardOutput += +rsp.rates[currency.WordsToSymbols[intent.slots.Destination.value.toLowerCase()]];
      }
      response.tellWithCard({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
        "Currency Converter", cardOutput);
  });

  // response.tellWithCard({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
  //   "Currency Converter", cardOutput);
}

//alexa ask currency how much is five U.S.D. in C.A.D.
//alexa ask currency to convert five american dollars to canadian
//alexa load currency and ask how much is two hundred thousand yuan in canadian dollars
function handleConvertIntent(intent, session, response){
  var parsedAmount = 1;
  //sanitize and convert amount
  if(intent.slots.AmountWhole.value == null){
    //user didn't provide whole amount
    intent.slots.AmountWhole.value = 1;
    parsedAmount = 1;
  }else{
    parsedAmount = intent.slots.AmountWhole.value;
  }
  //check the source and destination input

  var speechOutput = "";

  var cardOutput = "Converting "+parsedAmount+" "+currency.WordsToSymbols[intent.slots.Source.value.toLowerCase()]+" to "+currency.WordsToSymbols[intent.slots.Destination.value.toLowerCase()]+" ";

  //query currency-api
  request({
      url: getURL(intent), //URL to hit
      qs: {amount: parsedAmount}, //Query string data
      method: 'GET', //Specify the method
    }, function(error, serverResponse, body){
      if(error) {
        speechOutput = "I'm having trouble contacting the API. Send the following to my creator: "+body;
        cardOutput += ". URL:"+getURL(intent);
      } else {
        //console.log(serverResponse.statusCode, body);
        rsp = JSON.parse(body);
        if(intent.slots.AmountWhole.value == 1 || intent.slots.AmountWhole.value == null){
          speechOutput = parsedAmount + " "+ currency.SymbolsToWords[rsp.source][0];
        }else{
          speechOutput = parsedAmount + " "+ currency.SymbolsToWords[rsp.source][1];
        }
        speechOutput += " is "+rsp.amount+ " in "+currency.SymbolsToWords[rsp.target][1];
        cardOutput += parsedAmount +" "+rsp.source+"@"+rsp.rate+"="+rsp.amount+" "+rsp.target+". ";
      }
      response.tellWithCard({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
          "Currency Converter", cardOutput);
  });

    // speechOutput = cardOutput;
    // response.tellWithCard({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
    //  "Currency Converter", cardOutput);
}

function getURL(intent){
  //https://currency-api.appspot.com/api/{source}/{target}.{format}
  var append = "/"+currency.WordsToSymbols[intent.slots.Source.value.toLowerCase()]+"/"+currency.WordsToSymbols[intent.slots.Destination.value.toLowerCase()]+".json";
  return options.host+append;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the WiseGuy Skill.
    var skill = new DummySkill();
    skill.execute(event, context);
};
