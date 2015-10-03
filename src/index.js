/**
 * something here...
 */

/**
 * App ID for the skill
 */
var APP_ID = undefined;//replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

/**
 * Array containing knock knock jokes.
 */

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');
var config = require('./config.js');
var restler = require('restler');
/**
 * DummySkill is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
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
    //set session attributes
    session.attributes = {NumQuestionsAsked:0, NumQuestionsWanted:0, QuestionStarted: false,QuestionBank: []};
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
    StartQuestionIntent: function (intent, session, response) {
        handleStartQuestionIntent(intent, session, response);
    },
    RevealAnswerIntent: function (intent, session, response) {
        handleRevealAnswerIntent(intent, session, response);
    },
    StartRoundIntent: function (intent, session, response) {
        handleStartRoundIntent(intent, session, response);
    },
    GetDelayIntent: function (intent, session, response) {
        handleGetDelayIntent(intent, session, response);
    },

    HelpIntent: function (intent, session, response) {
        var speechOutput = "";

        speechOutput = "Please consult the README document for usage and things to try. ";

        // For the repromptText, play the speechOutput again
        response.ask({speech: speechOutput, type: AlexaSkill.speechOutput.PLAIN_TEXT},
                {speech: speechOutput, type: AlexaSkill.speechOutput.PLAIN_TEXT});
    }
}

function handleStartQuestionIntent(intent, session, response){
  // notImplementedYet(intent, session, response);
  var cardOutput = "";
  //fetch this many questions from api.
  //sanitize NumToAsk
  if(intent.slots.NumToAsk.value == null || intent.slots.NumToAsk.value == undefined){
    intent.slots.NumToAsk.value = 1;
  }
  //set session attributes
  session.attributes.NumQuestionsWanted = intent.slots.NumToAsk.value;
  session.attributes.NumQuestionsAsked = 0;

  var speechOutput = "Question "+(session.attributes.NumQuestionsAsked+1)+" of "+intent.slots.NumToAsk.value;
  var cardOutput = speechOutput;

  //add the delay before asking the question
  speechOutput += "<break time=\"1s\"/>";

  //query the API for questions.
  restler.get(config.url+'/api/random', {
    data: { count:intent.slots.NumToAsk.value },
  }).on('complete', function(result) {
    if (result instanceof Error) {
      console.log('Error:', result.message);
      speechOutput = "Sorry, I'm having trouble retrieving the questions. ";
      // this.retry(5000); // try again after 5 sec
      response.tell({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML});
    } else {
      session.attributes.QuestionBank = result;
      speechOutput += session.attributes.QuestionBank[session.attributes.NumQuestionsAsked].question;
      cardOutput += session.attributes.QuestionBank[session.attributes.NumQuestionsAsked].question;
      //add the delay
      speechOutput += " <break time=\""+config.delay+"s\"/> What is ";
      //add the answer
      speechOutput += session.attributes.QuestionBank[session.attributes.NumQuestionsAsked].answer;
      //set the flag for questions started
      cardOutput += " Answer: "+session.attributes.QuestionBank[session.attributes.NumQuestionsAsked].answer;
      session.attributes.QuestionStarted = true;
      //process the response.
      response.tellWithCard({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
          "D.U.M.M.Y", cardOutput);
    }
  });
}

function handleRevealAnswerIntent(intent, session, response){
  notImplementedYet(intent, session, response);
  //         response.askWithCard({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
  //                 {speech: "<speak>" + repromptSpeech + "</speak>", type: AlexaSkill.speechOutput.SSML},
  //                 "D.U.M.M.Y", speechOutput);
}

function handleStartRoundIntent(intent, session, response){
  notImplementedYet(intent, session, response);
}

//alexa ask Dummy what is the delay
function handleGetDelayIntent(intent, session, response){
  var speechOutput = "The delay is "+config.delay+" seconds. ";
  var cardOutput = speechOutput+" Change this in the config. ";
  response.tellWithCard({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
      "D.U.M.M.Y", cardOutput);
}

function notImplementedYet(intent, session, response){
  var speechOutput = "Sorry, Bill hasn't taught me how to handle this yet.";
  response.tell({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML});
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the WiseGuy Skill.
    var skill = new DummySkill();
    skill.execute(event, context);
};
