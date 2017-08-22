module.exports = function EmojiTranslate(){
  var emojit = {};
  var xss = require('xss');

  emojit.handlers = require('./handlers')(emojit);

  emojit.translate = function(message){
    message = xss(message); // filter out xss because thats what good developers do
    emojit.googleTest(message); // this is to test out google's language api
    return emojit.handlers.translate(message);
  };

  // test for entities using googles language api
  // maybe do some logging with this output for more advanced language usage
  emojit.googleTest = function(message){
    var language = require('@google-cloud/language');
    var client = language({
      projectId: 'translateEmoji',
      keyFilename: './google-cloud-key.json'
    });

    var content = message;
    var type = language.v1.types.Document.Type.PLAIN_TEXT;
    var document = {
       content : content,
       type : type
    };
    client.analyzeEntities({document: document}).then(function(responses) {
       var response = responses[0];
       // doThingsWith(response)
       console.log(response);
    })
    .catch(function(err) {
       console.error(err);
    });
  };

  return emojit;
};
