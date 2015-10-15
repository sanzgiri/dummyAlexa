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
  session.attributes = {QuestionsWanted:0,QuestionsAsked:0,QuestionBank:[],QuestionsStarted:false};
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
    GenerateQuestionsIntent: function (intent, session, response) {
      console.log("GenerateQuestionsIntent Recieved");
      handleGenerateQuestionsIntent(intent, session, response);
    },
    AskQuestionsIntent: function (intent, session, response) {
      console.log("AskQuestionsIntent Recieved");
      handleAskQuestionsIntent(intent, session, response);
    },
    MoreQuestionsIntent: function (intent, session, response) {
      handleMoreQuestionsIntent(intent, session, response);
    },
    QuitIntent: function (intent, session, response) {
      handleQuitIntent(intent, session, response);
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
      response.ask({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},{speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML});
    }
}

function handleGreetIntent(session, response){
  var speechOutput = "Welcome to Dummy" ;
  response.tell({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML});
}

function handleQuitIntent(intent, session, response){
  var speechOutput = "Thank you for using Dummy, goodbye." ;
  response.tellWithCard({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
     "D.U.M.M.Y.", cardOutput);
}

function handleMoreQuestionsIntent(intent, session, response){
  var speechOutput = "How many more questions should I ask? Note that generating more questions will erase all previous questions." ;
  response.ask({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},{speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML});
}

function handleGenerateQuestionsIntent (intent, session, response){
  if(intent.slots.NumToAsk.value == null){
    //if the user doesn't provide number to ask, ask one only.
    intent.slots.NumToAsk.value = 1;
  }

  var speechOutput = "Asking "+intent.slots.NumToAsk.value+" questions." ;
  var repromptSpeech = "Shall I ask the next question? ";
  speechOutput += "Question "+(session.attributes.QuestionsAsked+1)+" of "+session.attributes.QuestionsWanted+":";
  var cardOutput = "";
  //setup the session attributes
  session.attributes.QuestionsWanted = intent.slots.NumToAsk.value;
  session.attributes.QuestionsAsked = 0;


  //query the API
  request({
      url: options.remoteAPI, //URL to hit
      qs: {count: session.attributes.QuestionsWanted}, //Query string data
      method: 'GET', //Specify the method
    }, function(error, serverResponse, body){
      if(error) {
        speechOutput = "I'm having trouble contacting the API. Send the following to my creator: "+body;
        cardOutput += ". URL:"+getURL(intent);
      } else {
        //console.log(serverResponse.statusCode, body);
        rsp = JSON.parse(body);
        //store the response in the question bank
        session.attributes.QuestionBank = rsp;
        session.attributes.QuestionsStarted = true;
        speechOutput = buildRespFromQuestion(session, rsp[session.attributes.QuestionsAsked]);
        //since we asked the question already, increase the counter.
        session.attributes.QuestionsAsked += 1;
      }
      response.askWithCard(
        {speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
        {speech: "<speak>" + repromptSpeech + "</speak>", type: AlexaSkill.speechOutput.SSML},
          "D.U.M.M.Y.", cardOutput);
  });

}

function handleAskQuestionsIntent (intent, session, response){
  var speechOutput = "";
  var repromptSpeech = "";
  var cardOutput = "";

  //check if user provided question number
  if(intent.slots.QuestionToAsk.value == null){
    //user is asking for next question.
    intent.slots.QuestionToAsk.value = session.attributes.QuestionsAsked;
  }else{
    //repeat a specific question.
    intent.slots.QuestionToAsk.value = intent.slots.QuestionToAsk.value-1;
  }

  //check that the question number is not out of bounds
  if(!session.attributes.QuestionsStarted){
    speechOutput = "Hmm, it looks like you haven't started the session yet. I'll start it now - how many questions should I prepare for you? ";
    cardOutput = "Dummy: New session started."
  }else if((intent.slots.QuestionToAsk.value+1) <= (session.attributes.QuestionsWanted)){
    //we're fine, within bounds
    // speechOutput = intent.slots.QuestionToAsk.value+"Question is:"+JSON.stringify(session.attributes.QuestionBank);
    speechOutput = buildRespFromQuestion(session,session.attributes.QuestionBank[intent.slots.QuestionToAsk.value]);

  }else{
    speechOutput = "I'm sorry, I can't access that question. Say ask me question, followed by a number for a specific question, or you can say generate more questions. ";
    cardOutput = "Error: can't access question "+intent.slots.QuestionToAsk.value+" of "+session.attributes.QuestionsWanted;
  }
  response.askWithCard(
    {speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
    {speech: "<speak>" + repromptSpeech + "</speak>", type: AlexaSkill.speechOutput.SSML},
      "D.U.M.M.Y.", cardOutput);

}

//Alexa, ask Currency how to submit feedback
function handleFeedbackIntent (intent, session, response){
  var speechOutput = "You can create an issue at github.com forward slash <say-as interpret-as\"characters\">bxio</say-as> forward slash Alexa Currency. " ;
  var cardOutput = "To submit feedback, please create an issue at http://github.com/bxio/AlexaCurrency";
  response.tellWithCard({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
      "D.U.M.M.Y.", cardOutput);
}

//Alexa, ask Currency how to report a bug
function handleBugIntent (intent, session, response){
  var speechOutput = "Am I misbehaving? Please send an email to bill at billxiong dot com. " ;
  var cardOutput = "Please email bill@billxiong.com";
  response.tellWithCard({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
      "D.U.M.M.Y.", cardOutput);
}

function buildRespFromQuestion(session, question){
  var speechOutput = "";
  //question x of y
  speechOutput = "Question "+(session.attributes.QuestionsAsked+1)+" of "+session.attributes.QuestionsWanted;
  //from the category __
  speechOutput += ", from the category "+question.category.title;
  //short pause
  speechOutput += "<break time=\"1s\" />";
  //question body
  speechOutput += question.question;
  //delay
  speechOutput += "<break time=\""+options.delayBeforeAnswer+"s\" />";
  //answer
  speechOutput += "What is "+question.answer+"<break time=\"1s\" />";
  //ready for next?
  speechOutput += "Ready for the next question? ";

  return speechOutput;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the WiseGuy Skill.
    var skill = new DummySkill();
    skill.execute(event, context);
};
