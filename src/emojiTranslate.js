module.exports = function EmojiTranslate(){
  var emojit = {};

  emojit.handlers = require('./handlers')(emojit);

  emojit.translate = function(message){
    console.log(message);
    return emojit.handlers.translate(message);
  };

  return emojit;
};