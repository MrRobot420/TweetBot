console.log("[ INFO ] The bot is starting...");
var Twit = require("twit");
var config = require("./stuff/config");       // Local file (hidden hopefully)
const file_path = "./raw_text.txt";
const save_path = "./posted.txt";
var fs = require('fs');

var T = new Twit(config);
var failure_count = 0;
var total_count = 0;
var questions = [];
var posted_questions = [];
var interval = null;

tweetIt();      // TAKES CARE OF CODE EXECUTION:

// A function to take care of tweeting
function tweetIt() {
    // Reset everything first:
    questions = [];
    posted_questions = [];
    interval = null;
    failure_count = 0;
    total_count = 0;
    fetchPostedTweets();                                    // LOAD already posted tweets
    setTimeout(processQuestions, 1300);                     // Check for tweet length and if duplicate
    setTimeout(showInfo, 1500);                             // Show info to the user about possible remaining posts
    setTimeout(postRandomQuestion, 2000);                   // "Instantly" post the first tweet at start
    interval = setInterval(postRandomQuestion, 1000*3600);  // Post a tweet every hour (1000*3600)         
}

// Reads already posted tweets and saves them into an array (posted_questions):
function fetchPostedTweets() {
    console.log("[ INFO ] Fetching already posted tweets... \n");
    var saveReader = require('readline').createInterface({
        input: require('fs').createReadStream(save_path)
    });
    saveReader.on('line', function (line) {
        posted_questions.push(line.toString());
        console.log("[ FETCHED ] " + line);
    });
}

// Checks if questions are valid and puts them into an array.
function processQuestions() {
    var lineReader = require('readline').createInterface({
        input: require('fs').createReadStream(file_path)
    });
      
    lineReader.on('line', function (line) {
        total_count++;
        line = "#philosophy " + line;           // IMPORTANT!

        // IF QUESTION IS SHORT ENOUGH AND HAS NOT YET BEEN POSTED:
        if (line.length <= 128 && !posted_questions.includes(line.toString())) {
            questions.push(line);
            console.log('[ OK ] Added: ', line);
        // IF QUESTION WAS ALREADY POSTED:
        } else if (posted_questions.includes(line.toString())) {
            failure_count++;
            console.log("[ FAIL ] Already Posted!: " + line);
        // IF QUESTION IS TOO LONG:
        } else {
            failure_count++;
            console.log("[ FAIL ] Question too long!");
        }
    });
}

// Displays info to the user about possible remaining tweets:
function showInfo() {
    console.log("\n\n[ INFO ] Added " + questions.length.toString() + " questions.");
    console.log("[ INFO ] Could not append [" + failure_count.toString() + " / " + total_count.toString() + " ] questions");
}

// Posts a random question to twitter:
function postRandomQuestion() {
    var randomNum = Math.floor(Math.random() * questions.length);

    // This is the message / tweet:
    var tweet = {
        status: questions[randomNum]
    }

    // POST the tweet:
    T.post('statuses/update', tweet, tweeted);

    // Callback!
    function tweeted(err, data, response) {
        if (err) {
            console.log("[ ERROR ] Something went wrong!!\n\n");
            console.log(err);
            clearInterval(interval);
            tweetIt();
        } else {
            console.log("\n[ SUCCESS ] It worked!!");
            console.log("[ POSTED ] " + tweet.status);
            markAsPosted(tweet.status);
        }
    }
}

// Save which tweets have already been posted!
function markAsPosted(post) {
    var stream = fs.createWriteStream(save_path, {flags: 'a'});     // a = append
    stream.write("\n" + post.toString(), function() {
        console.log("[ INFO ] Wrote question to the save-file!")
        // Now the data has been written.
    });
}