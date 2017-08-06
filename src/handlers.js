var emoji = require('emojilib');
var natural = require("natural");
var path = require("path");

/**
 * @class EmojiTranslateHandlers
 * @description the server-side processing of the message
 * @param {EmojiTranslate} emojit
 */

module.exports = function EmojiTranslateHandlers(emojit){
  var handlers = {};

  /**
   * @function preload
   * @description create language resources upon init for efficiency
   */

  handlers.preload = function(){
    var base_folder = path.join(path.dirname(require.resolve("natural")), "brill_pos_tagger");
    var rulesFilename = base_folder + "/data/English/tr_from_posjs.txt";
    var lexiconFilename = base_folder + "/data/English/lexicon_from_posjs.json";
    var defaultCategory = 'N';

    var lexicon = new natural.Lexicon(lexiconFilename, defaultCategory);
    var rules = new natural.RuleSet(rulesFilename);
    var tagger = new natural.BrillPOSTagger(lexicon, rules);
    handlers.tagger = tagger;
  };

  /**
   * @function translate
   * @description translate the words into emojis where applicable
   * @param {string} message - sentence to translate
   * @return {string} translated message with emojis
   */

  handlers.translate = function(message){
    var tokens = handlers.tokenize(message);
    var profiles = handlers.buildWordProfiles(tokens);
    profiles = handlers.checkPunctuation(profiles);
    profiles = handlers.partsOfSpeech(profiles);
    profiles = handlers.checkPlurals(profiles);

    var translatedProfiles = handlers.matchEmojis(profiles);
    var reconstructedMessage = handlers.reconstructMessage(translatedProfiles);
    return reconstructedMessage;
  };

  /**
   * @function tokenize
   * @description splits a message into words/phrases (maybe impliment 'natural's tokenize but there are punctuation issues)
   * @param {string} message - words to tokenize
   * @returns {Array} - words split by tokenizing function
   */

  handlers.tokenize = function(message){
    var tokens = message.split(" ");
    return tokens;
  };

  /**
   * @function partsOfSpeech
   * @description Takes a tokenized representation of a message and finds the parts of speech for each token
   * @param {Array} profiles - wordProfiles generated from EmojiTranslateHandlers.buildWordProfiles
   * @returns {Array} profiles - modified profiles object with part of speech added to properties
   */

  handlers.partsOfSpeech = function(profiles){
    var posTokens = [];
    for(var profile in profiles){
      profile = profiles[profile];
      posTokens.push(profile.word);
    }
    var tags = handlers.tagger.tag(posTokens);
    for(var tag in tags){
      var index = tag;
      tag = tags[tag];
      profiles[index].partOfSpeech = tag[1];
    }
    return profiles;
  };

  /**
   * @function checkPlurals
   * @description Checks each profile and word property to see if word is plural, and what the singular form would be
   * @param {Array} profiles - wordProfiles from EmojiTranslateHandlers.buildWordProfiles
   * @returns {Array} profiles - modified with plural boolean updated and singular form if applicable
   */

  handlers.checkPlurals = function(profiles){
    var nounInflector = new natural.NounInflector();
    for(var profile in profiles){
      var index = profile;
      profile = profiles[profile];
      var safeWord = handlers.safeWord(profile);
      var singularized = "";
      var pluralized = "";
      try {
        singularized = nounInflector.singularize(safeWord);
        pluralized = nounInflector.singularize(safeWord);
      } catch (error) {
        console.log(error);
        singularized = safeWord;
      }

      if(safeWord !== singularized){
        profiles[index].plural = true;
        profiles[index].singular = singularized;
      }
    }
    return profiles;
  };

  /**
   * @function checkPunctuation
   * @description test if the profile's word has punctuation in it, and if so to put that in the profile's properties
   * @param {Array} profiles - wordProfiles from EmojiTranslateHandlers.buildWordProfiles
   * @returns {Array} profiles - modified withPunc & withoutPunc properties for each profile
   */

  handlers.checkPunctuation = function(profiles){
    for(var profile in profiles){
      var index = profile;
      profile = profiles[profile];
      if(/[!;,.]/.test(profile.word)){
        profiles[index].withPunc = /([!;,.]{1,})/.exec(profile.word)[1];
        profiles[index].withoutPunc = /(.*?)[!;,.]/.exec(profile.word)[1];
      }
    }
    //console.log(profiles);
    return profiles;
  };

  /**
   * @function buildWordProfile
   * @description create profiles for each of the tokens from EmojiTranslateHandler.tokenize
   * @param {Array} tokens - tokenized message
   * @returns {Array} profiles - a wordProfile with properties setup for manipulation later
   */

  handlers.buildWordProfiles = function(tokens){
    var profiles = [];
    for(var word in tokens){
      word = tokens[word];
      var wordProfile = {
        word: "",
        partOfSpeech: "",
        emoji: false,
        plural: false,
        withPunc: false,
        withoutPunc: ""
      };
      var profile = wordProfile;
      profile.word = word;
      //console.log(profile);
      profiles.push(profile);
    }
    return profiles;
  };

  /**
   * @function shouldMatch
   * @description checks a wordProfile for its updated POS property, and decides if that POS should be represented by an emoji
   * @param {wordProfile} profile - singular wordProfile from EmojiTranslateHandlers.buildWordProfiles
   * @returns {boolean} true if word can be represented by an emoji and false if otherwise
   */

  handlers.shouldMatch = function(profile){
    var invalidPartsOfSpeech = [
      'VB', 'PRP$', 'RB', 'TO', 'VBZ'
    ];

    var word = profile.word;
    var partOfSpeech = profile.partOfSpeech;

    for(var invalidPart in invalidPartsOfSpeech){
      invalidPart = invalidPartsOfSpeech[invalidPart];
      if(partOfSpeech === invalidPart){
        return false;
      }
    }

    return true;
  };

  /**
   * @function safeWord
   * @description returns the unpunctuated word (could be updated later for other linguistic modifiers)
   * @param {wordProfile} profile - the wordProfile to generate a safeWord from
   * @returns {string}
   */

  handlers.safeWord = function(profile){
    if(profile.withPunc){
      return profile.withoutPunc;
    }
    return profile.word;
  };

  /**
   * @function singularForm
   * @description returns the singular form of the word from the wordProfile if applicable
   * @param {wordProfile} profile
   * @returns {string} - singular form of word if applible or original word otherwise
   */

  handlers.singularForm = function(profile, useSafeWord){
    if(profile.plural){
      return profile.singular;
    }
    return profile.word;
  };

  /**
   * @function matchEmojis
   * @description iterates through each wordProfile and decides if the word should be translated, if so, which emoji fits
   * @param {Array} profiles - wordProfile array
   * @returns {Array} profiles - wordProfile array updated with emojis for each profile if applicable
   */

  handlers.matchEmojis = function(profiles){

    var matchFunction = function(profile){

      var safeWord = handlers.safeWord(profile).toLowerCase();
      var singularForm = handlers.singularForm(profile).toLowerCase();
      var word = safeWord;

      for(var item in emoji.lib){
        var itemlib = emoji.lib[item];
        var char = itemlib.char;
        if (word === item){
          return char;
        }
        if (singularForm === item){
          return char;
        }

        for(var keyword in itemlib.keywords){
          keyword = itemlib.keywords[keyword];
          if(word === keyword){
            return char;
          }
          if(singularForm === keyword){
            if(profile.plural){
              return char + " " + char;
            }
            return char;
          }
        }
      }

      return false;
    };

    for(var profile in profiles){
      var index = profile;
      profile = profiles[profile];
      if(!handlers.shouldMatch(profile)){
        continue;
      }

      var matchResult = matchFunction(profile);
      if(matchResult){
        profiles[index].emoji = matchResult;
      }
    }

    return profiles;
  };

  /**
   * @function reconstructMessage
   * @description take completed array of wordProfiles and reconstruct the original message but using emojis instead where applicable
   * @param {Array} profiles - wordProfile array
   * @returns {string} - the reconstructed message
   */

  handlers.reconstructMessage = function(profiles){
    var message = [];
    for(var profile in profiles){
      profile = profiles[profile];
      var msg = "";
      if(profile.emoji){
        msg = profile.emoji + " ";
      } else {
        msg = handlers.safeWord(profile);
      }

      if(profile.withPunc){
        msg += profile.withPunc;
      }
      message.push(msg);
    }
    return message.join(" ");
  };

  handlers.init = function(){
    handlers.preload();
    return handlers;
  };

  return handlers.init();
};