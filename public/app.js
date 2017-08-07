$(document).ready(function(){
	console.log('hello world');
	var json = $.getJSON("emojis.json", 
		function(result){ 
			console.log('got result')
		});

	$("#translateButton").click(function(){
		var textInput = $("#input").val() ;    
	/*	alert(textInput);
		var words = textInput.split(' ');
		console.log(words);
		$(words).each(function(i, value){
		}); */
	$.post({
			type: "POST",
			url: "/translate",
			data: {message: textInput},
			success: function(data, status, xhr){
				$("#output").html(data.translation);
			/*	$("translatefeed").html(data.translation); */
			}
	})
	});



});

