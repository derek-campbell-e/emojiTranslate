$(document).ready(function(){
	console.log('hello world');
	var json = $.getJSON("emojis.json", 
		function(result){ 
			$.each(result, function(i, field){ 
				console.log(i);
				console.warn(field);
			}); 
		});

	$("#translateButton").click(function(){
		var textInput = $("#input").val() ;    
		alert(textInput);
		var words = textInput.split(' ');
		console.log(words);
		$(words).each(function(i, value){
		});
	});



});

