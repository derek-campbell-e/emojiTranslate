var $ = require('jquery');
var path = require('path');
var express = require('express');
var mongoose = require('mongoose'); 
var cors = require('cors');
var bodyParser = require('body-parser');
var emojiTranslate  = require('./src/emojiTranslate')();
var Schema = mongoose.Schema;
var app = express();

app.use(express.static('public'));

/**
 * express additions for handling post requests
 */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//connect to MongoDB 
//mongoose.connect('mongodb://courses:password@ds159998.mlab.com:59998/coursesdb'); 
var options = { server: { socketOptions: { 
			keepAlive: 300000, connectTimeoutMS: 30000 
							} 
						}, 
			replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } 
					} 
	}; 
var mongodbUri = 'mongodb://user:user1@ds019058.mlab.com:19058/translatemoji'; 
	
mongoose.connect(mongodbUri, options); 
var conn = mongoose.connection; 
conn.on('error', console.error.bind(console, 'connection error:')); 
conn.once('open', function () {console.log("Great success!")});

var schemaName = new Schema({
	original: String,
	translation: String
}, {
	collection: 'translations'
})
app.get('/hello', function (req, res) { res.send('GET request to the homepage') });

var Model = mongoose.model('Model', schemaName);
console.log('BEFORE APP GET');
/* app.get('/', cors(), function(req, res) { 
	var query = req.params.query; 
	console.log(req);
	console.log(res);
	Model.find({ 'request': query }, 
		function(err, result) { if (err) throw err; 
			if (result) { res.json(result) } 
		else { res.send(JSON.stringify({ 
			error : 'Error' })) } 
	}) 
}) */
console.log('AFTER APP GET');

/**
 * express route to handle translating via ajax
 */

app.post("/translate", function(req, res){
  return res.json({
    response: "ok",
    translation: emojiTranslate.translate(req.body.message)
  });
});


app.listen(process.env.PORT || 5000, function() {
  console.log('listening');
});







