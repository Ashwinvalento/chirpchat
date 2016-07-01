$(function() {
	//Variables
	// get the ID of the room
	var room_id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);
	  var typing = false;
	
	
	
	// connect to the socket
	var socket = io();

	// on connection to server get the id of person's room
	socket.on('connect', function() {
		// send room id to the server on connection
		socket.emit('new user', room_id);
	});

	$("#message").keypress(function(e) {
		// Submit the form on enter
		if (e.which == 13) {
			e.preventDefault();
			$("#chatform").trigger('submit');
		}

	});
	
		

	$("#chatform").on('submit', function(e) {
		var textarea = $("#message");
		e.preventDefault();

		// Create a new chat message and display it directly
		console.log(" -- " + textarea.val() + " -- ");

		if (textarea.val().trim().length) {
			displayMessage(textarea.val(), name, "#00ff00", moment());

			// Send the message to the other person in the chat
			socket.emit('new message', {
				msg : textarea.val(),
				user : name,
				color : "#ff0000"
			});

		}
		// Empty the textarea
		textarea.val("");
		typing = false;
		socket.emit('stop typing');
		console.log("user stopped typing");
	});

	$("#message").on('input', function() {
		
	      if (!typing) {
	          typing = true;
	          console.log("user typing");
	          socket.emit('typing');
	        }
	});

	socket.on('receive', function(data) {

		if (data.msg.trim().length) {
			displayMessage(data.msg, data.user, data.color, moment());
		}
	});

	function displayMessage(msg, user, color, now) {

		var who = '';

		if (user === name) {
			who = 'me';
		} else {
			who = 'you';
		}

		var li = $('<li class=' + who + '>' + '<div class="message">'
				+ '<b></b>' + '<i class="timesent" data-time=' + now + '></i> '
				+ '</div>' + '<p></p>' + '</li>');

		// use the 'text' method to escape malicious user input
		li.find('p').text(msg);
		li.find('b').text(user);

		$(".chats").append(li);

		$(".timesent").last().text(now.fromNow());
	}

});