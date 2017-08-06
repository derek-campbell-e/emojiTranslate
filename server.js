var $ = require('jquery');
var path = require('path');
var express = require('express');

var bodyParser = require('body-parser');

var emojiTranslate  = require('./src/emojiTranslate')();

var app = express();

var staticPath = path.join(__dirname, '/');
app.use(express.static(staticPath));

/**
 * express additions for handling post requests
 */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

/**
 * express route to handle translating via ajax
 */

app.post("/translate", function(req, res){
  return res.json({
    response: "ok",
    translation: emojiTranslate.translate(req.body.message)
  });
});

app.listen(8080, function() {
  console.log('listening');
});