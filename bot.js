import { rapidkey, wordskey } from './keys';

const RapidAPI = new require('rapidapi-connect');
const rapid = new RapidAPI(rapidkey.id, '/connect/auth/' + rapidkey.id);

var unirest = require('unirest');

var Twit = require('twit');

var T = new Twit(require('./config.js'));

var howDoYouPronounce = { q: 'how do you pronounce', count: 100 };
var ipaBeer = { q: 'phonetic #ipa', count: 100 };

var status = { status: 'Be careful!' };

function findWord(text) {
  var n = text.toLowerCase().search('pronounce') + 10;

  // console.log(n);

  var word = '';

  var badChars = /[\"\''.,?\ :\n#]/;

  var goodChars = /[\"]/;

  if (
    text.charAt(n).match(badChars) ||
    text.charCodeAt(n) == 8220 ||
    text.charCodeAt(n) == 8221
  ) {
    n++;
    // console.log("found");
  }

  while (
    !text.charAt(n).match(badChars) &&
    text.charCodeAt(n) != 8220 &&
    text.charCodeAt(n) != 8221 &&
    text.charAt(n).length != 0 &&
    text.charCodeAt(n) != 191
  ) {
    // // console.log(text.charAt(n));
    // console.log(text.charCodeAt(n));
    word += text.charAt(n);
    n++;
  }

  console.log(word);

  if (word == 'the') {
    var words = text.split('the ');
    word = findWord(words[0] + words[1]);
  }
  if (word == 'name') {
    var words = text.split('name ');
    word = findWord(words[0] + words[1]);
  }
  if (word == 'word') {
    var words = text.split('word ');
    word = findWord(words[0] + words[1]);
  }

  return word;
}

function findAnswer(text, data, i) {
  var word = findWord(text);

  var tweet = '';

  unirest
    .get(
      'https://wordsapiv1.p.mashape.com/words/' +
        word.toLowerCase() +
        '/pronunciation'
    )
    .header('X-Mashape-Key', wordskey)
    .header('X-Mashape-Host', 'wordsapiv1.p.mashape.com')
    .end(function (result) {
      console.log(result.body);
      var pron = result.body.pronunciation;
      if (result.body.success != false && pron != `undefined`) {
        if (typeof pron == 'object') {
          pron = result.body.pronunciation.all;
        }
        console.log(pron);
        tweet +=
          '"' +
          word +
          '" is pronounced like "' +
          pron +
          '"\n\nFrom: @' +
          data.statuses[i].user.screen_name +
          ' who asked: "' +
          text +
          '"\n\nHere is a guide for IPA: https://en.wiktionary.org/wiki/Wiktionary:IPA_pronunciation_key\n\nYou\'re welcome :)';
        console.log(tweet);
        tweetIt(tweet);
      } else {
        tweet +=
          'Even I don\'t know how to pronounce "' +
          word +
          '", @' +
          data.statuses[i].user.screen_name +
          '.\n\nThey asked: "' +
          text +
          '"';
        console.log(tweet);
        tweetIt(tweet);
      }
    });
  return tweet;
}

function tweetIt(stat) {
  T.post('statuses/update', { status: stat }, function (error, data, response) {
    if (response) {
      console.log('Ayyyy, you tweeted something');
    }
    if (error) {
      console.log('There was an error with Twitter:', error);
    }
  });
}

function tweetPronunciation() {
  T.get('search/tweets', howDoYouPronounce, function (error, data) {
    var i = 0;
    var text = data.statuses[i].text;
    var word = findWord(text).toLowerCase();
    while (
      data.statuses[i].user.screen_name == 'PronounceBot' ||
      word == 'the' ||
      word == 'it' ||
      word == 'say' ||
      word == 'that' ||
      word == 'new' ||
      word == 'your' ||
      word == 'or' ||
      word == 'spell' ||
      word == 'la' ||
      word[0] == '@' ||
      word == 'gif' ||
      word == 'them' ||
      text.match('RT') ||
      word == 'ur' ||
      !text.toLowerCase().includes(word) ||
      word == 'https' ||
      word == 'http' ||
      word == 'yours' ||
      word == 'this' ||
      text.toLowerCase().includes('fuck') ||
      word == 'you' ||
      word == 'his' ||
      text.includes('pronounced') ||
      word == 'i' ||
      word == 'u' ||
      word == 'my' ||
      word == 'her' ||
      word == 'his' ||
      word == 'for' ||
      word == 'those' ||
      word == 'big' ||
      word == 'words' ||
      word == ''
    ) {
      console.log(data.statuses[i].text);
      i++;
      text = data.statuses[i].text;
      word = findWord(text).toLowerCase();
    }
    console.log(data.statuses[i]);
    findAnswer(text, data, i);

    var retweetId = data.statuses[i].id_str;
  });
}

function retweetIPA() {
  T.get('search/tweets', ipaBeer, function (error, data) {
    var i = 0;
    console.log(data.statuses[i]);
    var id = data.statuses[i].id_str;
    T.post('statuses/retweet/' + id, {}, function (error, response) {
      if (response) {
        console.log('You retweeted something!');
      }
      if (error) {
        console.log('There was an error with your retweet: ', error);
      }
    });
  });
}

tweetPronunciation();
// retweetIPA();

// setInterval(tweetPronunciation, 1000 * 60 * 30);
// setInterval(retweetIPA, 1000 * 60 * 80);
