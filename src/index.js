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
    MoreQuestionIntent: function (intent, session, response) {
      console.log("MoreQuestionIntent Recieved");
      handleMoreQuestionIntent(intent, session, response);
    },
    PauseIntent: function (intent, session, response) {
      console.log("PauseIntent Recieved");
      handlePauseIntent(intent, session, response);
    },

    HelpIntent: function (intent, session, response) {
      var speechOutput = "Please consult "+options.homepage+" for instructions on how to use this skill. ";

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

//alexa load dummy and ask for two random questions
function handleQuestionIntent(intent, session, response){
  var speechOutput = "";
  var cardOutput = "";
  //sanitize NumToAsk
  if(intent.slots.NumToAsk.value == null || intent.slots.NumToAsk.value == undefined){
    //user didn't provide number of questions to ask. Default to one.
    intent.slots.NumToAsk.value = 1;
  }
  session.attributes.QuestionsWanted = intent.slots.NumToAsk.value;
  session.attributes.QuestionsAsked = 0;

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
        session.attributes.QuestionsStarted = true;
        //console.log(serverResponse.statusCode, body);
        //store the questions into the session
        session.attributes.QuestionBank = JSON.parse(body);
        //build the response
        speechOutput = buildResponseFromQuestion(session);
      }
      //process the response
      var repromptSpeech = "Shall I move on to the next question? ";
      response.askWithCard(
        {speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
        {speech: "<speak>" + repromptSpeech + "</speak>", type: AlexaSkill.speechOutput.SSML},
        "D.U.M.M.Y", cardOutput
      );
  });

}

function handleNextQuestionIntent(intent, session, response){
  var speechOutput = "";
  var cardOutput = "";
  var repromptSpeech = "Shall I move on to the next question? ";

  //check if questions have started
  if(!session.attributes.QuestionsStarted){
    getWelcomeResponse(session, response);
  }

  //cache the last question and increase counter
  session.attributes.QuestionsAsked += 1;
  speechOutput = buildResponseFromQuestion(session);
  response.tell(
    {speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML}
  );
}

function handleMoreQuestionsIntent(intent, session, response){
  var speechOutput = "You've done well. How many more questions should I ask? ";
  var repromptSpeech = "How many more questions should I prepare? ";
  response.ask(
    {speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
    {speech: "<speak>" + repromptSpeech + "</speak>", type: AlexaSkill.speechOutput.SSML}
  );
}

function handlePauseIntent(intent, session, response){
  var speechOutput = "OK. Let me know when you're ready. ";
  var repromptSpeech = "Should I move on to the next question? ";
  response.ask(
    {speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
    {speech: "<speak>" + repromptSpeech + "</speak>", type: AlexaSkill.speechOutput.SSML}
  );
}

function buildResponseFromQuestion(session){
  var question = session.attributes.QuestionBank[session.attributes.QuestionsAsked];
  var speechOutput = "Question "+(session.attributes.QuestionsAsked+1)+" of "+session.attributes.QuestionsWanted;
  speechOutput += ", from the category "+question.category.title+"<break time=\"1s\"/> ";
  speechOutput += question.question+"<break time=\""+options.delayBeforeAnswer+"s\"/> ";
  speechOutput += "What is "+question.answer;
  speechOutput += "<break time=\"1s\"/> Ready for the next question? ";
  return speechOutput;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the WiseGuy Skill.
    var skill = new DummySkill();
    skill.execute(event, context);
};
