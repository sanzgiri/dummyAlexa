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
    session.attributes = {QuestionsWanted:0, QuestionsAsked: 0, QuestionBank:{}, QuestionsStarted: false};
    getWelcomeResponse(session, response);
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
    QuestionIntent: function (intent, session, response) {
      console.log("QuestionIntent Recieved");
      handleQuestionIntent(intent, session, response);
    },
    NextQuestionIntent: function (intent, session, response) {
      console.log("NextQuestionIntent Recieved");
      handleNextQuestionIntent(intent, session, response);
    },

    HelpIntent: function (intent, session, response) {
      var speechOutput = "Please consult README for instructions on how to use this skill. ";

      // For the repromptText, play the speechOutput again
      response.ask({speech: speechOutput, type: AlexaSkill.speechOutput.PLAIN_TEXT},
                   {speech: speechOutput, type: AlexaSkill.speechOutput.PLAIN_TEXT});
    }
}

function getWelcomeResponse(session, response){
  var speechOutput = "Welcome to Dummy. How many questions should I ask? ";
  var repromptSpeech = "How many questions should I prepare? ";
  response.ask(
    {speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
    {speech: "<speak>" + repromptSpeech + "</speak>", type: AlexaSkill.speechOutput.SSML}
  );
}

function handleQuestionIntent(intent, session, response){
  var speechOutput = "";
  var cardOutput = "";
  //sanitize NumToAsk
  if(intent.slots.NumToAsk.value == null || intent.slots.NumToAsk.value == undefined){
    //user didn't provide number of questions to ask. Default to one.
    intent.slots.NumToAsk.value = 1;
  }
  session.attributes.QuestionsWanted = intent.slots.NumToAsk.value;
  session.attributes.QuestionsAsked = 1;

  speechOutput = "Question "+session.attributes.QuestionsAsked+" of "+session.attributes.QuestionsWanted+": ";
  //make the API call here.
  request({
      url: options.host, //URL to hit
      qs: {count: session.attributes.QuestionsWanted}, //Query string data
      method: 'GET', //Specify the method
    }, function(error, serverResponse, body){
      if(error) {
        speechOutput = "I'm having trouble contacting the API. Send the following to my creator: "+body;
        cardOutput += "body:"+body;
      } else {
        //console.log(serverResponse.statusCode, body);
        rsp = JSON.parse(body);
        speechOutput += "response:"+rsp;
      }
      response.askWithCard({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
          "D.U.M.M.Y", cardOutput);
  });

  // speechOutput += "Ready for the next question? ";
  // repromptSpeech = "Shall I move on to the next question? ";
  // response.ask(
  //   {speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
  //   {speech: "<speak>" + repromptSpeech + "</speak>", type: AlexaSkill.speechOutput.SSML}
  // );

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
