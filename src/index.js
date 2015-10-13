/**
 * App ID for the skill
 */
var APP_ID = options.appid;//replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

/**
 * Array containing knock knock jokes.
 */

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');
var options = require('./options.js');
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
    getWelcomeResponse(response);
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
        handleQuestionIntent(intent, session, response);
    },
    NextQuestionIntent: function (intent, session, response) {
        handleNextQuestionIntent(intent, session, response);
    },
    MoreQuestionsIntent: function (intent, session, response) {
        handleMoreQuestionsIntent(intent, session, response);
    },
    QuitIntent: function (intent, session, response) {
        handleQuitIntent(intent, session, response);
    },
    GetDelayIntent: function (intent, session, response) {
        handleGetDelayIntent(intent, session, response);
    },
    RepeatQuestionIntent: function (intent, session, response) {
        handleRepeatQuestionIntent(intent, session, response);
    },
    RepeatAnswerIntent: function (intent, session, response) {
        handleRepeatAnswerIntent(intent, session, response);
    },
    FeedbackIntent: function (intent, session, response) {
        handleFeedbackIntent(intent, session, response);
    },
    ReplaceQuestionIntent: function (intent, session, response) {
        handleReplaceQuestionIntent(intent, session, response);
    },

    HelpIntent: function (intent, session, response) {
        var speechOutput = "";

        speechOutput = "Please consult the README document for usage and things to try. ";

        // For the repromptText, play the speechOutput again
        response.ask({speech: speechOutput, type: AlexaSkill.speechOutput.PLAIN_TEXT},
                {speech: speechOutput, type: AlexaSkill.speechOutput.PLAIN_TEXT});
    }
}

function getWelcomeResponse(response){
  var speechOutput = "Welcome to Dummy. How many questions should I ask? ";
  var repromptSpeech = "How many questions should I prepare? ";
  response.ask(
    {speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
    {speech: "<speak>" + repromptSpeech + "</speak>", type: AlexaSkill.speechOutput.SSML}
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

function handleQuitIntent(intent, session, response){
  var speechOutput = "Thank you for playing. Don't forget to send feedback by asking me how to send feedback. See you soon. ";
  response.tell({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML});
}

function handleFeedbackIntent(intent, session, response){
  var speechOutput = "Dummy is written and maintained by Bill. You can find him at <say-as interpret-as=\"spell\">billxiong</say-as> dot com forward slash dummy alexa. ";
  response.tell({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML});
}

function handleRepeatQuestionIntent(intent, session, response){
  var speechOutput = "";
  if(session.attributes.QuestionStarted != true){ //session hasn't started yet
    speechOutput = "Sorry, I haven't generated the questions yet. Try saying Alexa ask Dummy to ask me a question ";
  }else if(intent.slots.QuestionToRepeat.value > session.attributes.NumQuestionsWanted){
    speechOutput = "Sorry, I don't have a reference to question "+intent.slots.QuestionToRepeat.value+" of "+session.attributes.NumQuestionsWanted;
  }else if(session.attributes.QuestionStarted && (intent.slots.QuestionToRepeat.value <= session.attributes.NumQuestionsWanted)){
    //format question header
    speechOutput = "Question "+intent.slots.QuestionToRepeat.value+" of "+session.attributes.NumQuestionsWanted+": <break time=\"0.5s\"/>";
    //format question body
    speechOutput+= session.attributes.QuestionBank[intent.slots.QuestionToRepeat.value-1].question;
    //format question answer
    speechOutput += " <break time=\""+options.delay+"s\"/> What is ";
    //add the answer
    speechOutput += session.attributes.QuestionBank[intent.slots.QuestionToRepeat.value-1].answer;
  }else{
    //you are out of bounds, sir!
    speechOutput = "Sorry, I am having difficulty repeating questions at this time. Please contact my owner ";
  }
    speechOutput += " <break time=\"1.5s\" />Should I move on to the next question? ";
    var repromptSpeech = "Should I read the next question? ";
    response.ask(
      {speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
      {speech: "<speak>" + repromptSpeech + "</speak>", type: AlexaSkill.speechOutput.SSML}
    );
}

function handleRepeatAnswerIntent(intent, session, response){
  var speechOutput = "";
  if(!session.attributes.QuestionStarted){
    speechOutput = "Sorry, I haven't generated the questions yet. Try saying Alexa ask Dummy to ask me a question ";
  }else if(intent.slots.AnswerToRepeat.value > session.attributes.NumQuestionsWanted){
    speechOutput = "Sorry, I don't have a reference to question "+intent.slots.AnswerToRepeat.value+" of "+session.attributes.NumQuestionsWanted;
  }else if(session.attributes.QuestionStarted && (intent.slots.AnswerToRepeat.value <= session.attributes.NumQuestionsWanted)){
    //format Answer body
    speechOutput = "What is "+ session.attributes.QuestionBank[intent.slots.AnswerToRepeat.value-1].answer;
  }else{
    //you are out of bounds, sir!
    speechOutput = "Sorry, I am having difficulty repeating questions at this time. Please contact my owner ";
  }
    speechOutput += " <break time=\"1.5s\" />Should I move on to the next question? ";
    var repromptSpeech = "Should I read the next question? ";
    response.ask(
      {speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
      {speech: "<speak>" + repromptSpeech + "</speak>", type: AlexaSkill.speechOutput.SSML}
    );
}

function handleQuestionIntent(intent, session, response){
  var cardOutput = "";
  var speechOutput = "";
  //check that we didn't already generate questions.
  if(session.attributes.QuestionStarted){
    //questions already generated. Move on to next question.
    handleNextQuestionIntent(intent, session, response);
  }else{
    cardOutput = "";
    //fetch this many questions from api.
    //sanitize NumToAsk
    if(intent.slots.NumToAsk.value == null || intent.slots.NumToAsk.value == undefined){
      intent.slots.NumToAsk.value = 1;
    }
    //set session attributes
    session.attributes.NumQuestionsWanted = intent.slots.NumToAsk.value;
    session.attributes.NumQuestionsAsked = 0;

    //format the question header
    speechOutput = "Question "+(session.attributes.NumQuestionsAsked+1)+" of "+intent.slots.NumToAsk.value;
    cardOutput = speechOutput+": ";

    //add the delay before asking the question
    speechOutput += "<break time=\"0.5s\"/>";

    //query the API for questions
    restler.get(options.url+'/api/random', {
      data: { count:intent.slots.NumToAsk.value },
    }).on('complete', function(result) {
      if (result instanceof Error) {
        console.log('Error:', result.message);
        speechOutput = "Sorry, I'm having trouble retrieving the questions. ";
        // this.retry(5000); // try again after 5 sec
        response.tell({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML});
      } else {
        session.attributes.QuestionBank = result;
        //format the question body
        speechOutput += session.attributes.QuestionBank[session.attributes.NumQuestionsAsked].question;
        cardOutput += session.attributes.QuestionBank[session.attributes.NumQuestionsAsked].question;
        //set the flag for questions started
        session.attributes.QuestionStarted = true;
        //attach the answer to the card.
        cardOutput += ". Answer: "+session.attributes.QuestionBank[session.attributes.NumQuestionsAsked].answer;
        //add the delay
        speechOutput += " <break time=\""+options.delay+"s\"/> What is ";
        //add the answer
        speechOutput += session.attributes.QuestionBank[session.attributes.NumQuestionsAsked].answer;
        speechOutput += "<break time=\"1.5s\" /> Should I move on to the next question? ";
        var repromptSpeech = "Shall I read the next question? "
        //process the response
        response.askWithCard(
          {speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
          {speech: "<speak>" + repromptSpeech + "</speak>", type: AlexaSkill.speechOutput.SSML},
          "D.U.M.M.Y", cardOutput
        );
      }
    });
  }
}

function handleNextQuestionIntent(intent, session, response){
  var speechOutput = "";
  //check that session has started.
  if(!session.attributes.QuestionStarted){
    speechOutput = "I haven't prepared your questions yet. How many questions should I ask? ";
    var repromptSpeech = "How many questions should I prepare? ";
    response.ask(
      {speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
      {speech: "<speak>" + repromptSpeech + "</speak>", type: AlexaSkill.speechOutput.SSML}
    );
  }
  //"load" the last question
  var lastQuestionNumber = session.attributes.NumQuestionsAsked;
  //up the question number
  session.attributes.NumQuestionsAsked++;
  //sanity checks
  if(session.attributes.NumQuestionsAsked>= session.attributes.NumQuestionsWanted){
    //we've gone out of bounds.
    speechOutput = "I'm sorry, I've run out of questions to ask. How many more should I generate? ";
    response.ask(
      {speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
      {speech: "<speak>" + repromptSpeech + "</speak>", type: AlexaSkill.speechOutput.SSML}
    );
  }
  //format the question header
  speechOutput = "Question "+(session.attributes.NumQuestionsAsked+1)+" of "+session.attributes.NumQuestionsWanted;

  cardOutput = speechOutput+": ";


  //add the delay before asking the question
  speechOutput += "<break time=\"0.5s\"/ >";

  //format the question body
  speechOutput += session.attributes.QuestionBank[session.attributes.NumQuestionsAsked].question;
  cardOutput += session.attributes.QuestionBank[session.attributes.NumQuestionsAsked].question;
  /*
  //attach the answer to the card.
  cardOutput += ". Answer: "+session.attributes.QuestionBank[session.attributes.NumQuestionsAsked].answer;
  //add the delay
  speechOutput += " <break time=\""+options.delay+"s\"/> What is ";
  //add the answer
  speechOutput += session.attributes.QuestionBank[session.attributes.NumQuestionsAsked].answer;
  speechOutput += "<break time=\"1.5s\" /> Should I move on to the next question? ";
  var repromptSpeech = "Shall I read the next question? ";
*/
  //process the response
  response.askWithCard(
    {speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
    {speech: "<speak>" + repromptSpeech + "</speak>", type: AlexaSkill.speechOutput.SSML},
    "D.U.M.M.Y", cardOutput
  );
}

//alexa ask Dummy what is the delay
function handleGetDelayIntent(intent, session, response){
  var speechOutput = "The delay is "+options.delay+" seconds. ";
  var cardOutput = speechOutput+" Change this in the options. ";
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
