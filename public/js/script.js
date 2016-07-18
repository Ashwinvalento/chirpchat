$(function() {
	// Variables
	// get the ID of the room
	var room_id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);
	var typing = false;
	var COLORS = [ '#e21400', '#91580f', '#f8a700', '#f78b00', '#58dc00',
			'#287b00', '#a8f07a', '#4ae8c4', '#3b88eb', '#3824aa', '#a700ff',
			'#d300e7' ];

	// ------------ JQuery Variables ------------
	// Login form vars
	var avatar = $("#avatar"), username = $("#username"), nameerror = $("#nameerror"), registrationModal = $('#registrationModal'), saveUser = $("#saveUser");

	// Chat Screen vars
	var message = $("#message"), chatform = $("#chatform"), chat = $(".chat"), typingList = $("#typing-list");

	// connect to the socket
	var socket = io();

	init();
	
	// on connection to server get the id of person's room
	socket.on('connect',
			function() {

				nameerror.slideUp();
				var usercolor = COLORS[Math
						.floor((Math.random() * COLORS.length) + 1)];
				avatar.css("background-color", usercolor);

				username.keypress(function() {
					if (username.val().length < 2) {
						avatar.text(username.val().charAt(0));
					}
				});
				// Open the registration modal if username is blank
				if (socket.username == null) {
					registrationModal.modal('show');

					saveUser.click(function() {

						var uname = username.val();
						if (uname == "") {
							nameerror.slideDown();
						} else {
							socket.username = uname;
							socket.usercolor = usercolor;
							registrationModal.modal('hide');
							// send room id to the server on connection
							socket.emit('new user', {
								"room_id" : room_id,
								"username" : uname,
								"usercolor" : usercolor
							});
						}

					});
				}

			});

	message.keypress(function(e) {
		// Submit the form on enter
		if (e.which == 13) {
			e.preventDefault();
			chatform.trigger('submit');
		}

	});

	chatform.on('submit', function(e) {
		e.preventDefault();

		if (message.val().trim().length) {
			// Create a new chat message and display it directly
			displayMessage(message.val(), socket.username, socket.usercolor,
					moment());

			// Send the message to the other person in the chat
			socket.emit('new message', {
				msg : message.val(),
				username : socket.username,
				usercolor : socket.usercolor
			});
			// Empty the textarea
			message.val("");
			typing = false;
			//console.log("1. emit stop typing");
			socket.emit('stop typing', socket.username);
		}

	});

	message.on('input', function() {

		if (!typing) {
			typing = true;
			//console.log("1. emit typing");
			socket.emit('typing', socket.username);
		}
	});

	socket.on('user joined', function(data) {
		displayMetaMessage(data.username + " has joined the room", "#BDC3C7");
	});
	
	socket.on('user left', function(data) {
		displayMetaMessage(data.username + " has left the room", "#BDC3C7");
	});

	socket.on('typing', function(data) {
		//console.log("3. on typing ---- display");
		displayTypingMessage(data.username,false);
	});
	
	socket.on('stop typing', function(data) {
		//console.log("3. on stop typing ---- display");
		displayTypingMessage(data.username ,true);
	});
	
	socket.on('receive', function(data) {

		if (data.msg.trim().length) {
			displayMessage(data.msg, data.username, data.usercolor, moment());
		}
	});

	message.click(function () {
		message.focus();
	});
	  
	function displayMetaMessage(message, bgcolor) {
		// Meta message will be displayed in the center of the screen

		var li = $('<li class="clearfix">'
				+ '<div style="margin-left:20%;margin-right:20%;">'
				+ '<div class="chat-body text-center clearfix" style="background-color:'
				+ bgcolor + '">' + '<p >' + '</p>' + '</div>' + '</div>'
				+ '</li>');

		li.find('p').text(message);

		scrollToBottom();
		chat.append(li);

	}
	
	function displayTypingMessage(username,stop){
		//remove spaces from username
		var user = username.replace(/ /g, "-");
		
		if (stop === false){
			// add a list element with para id="<username>-typing" when user starts typing
			var li = $('<li id="'+user+'-typing" class="clearfix label label-info">'
					+ user 
					+ '</li>');
			
			typingList.append(li);
			
			if ($("#typing-list li").length > 1){
				$(".typing").show("slow");
			}


		}else{
			
			// remove the typing message when user stops typing or when message is sent
			var id='#'+user+'-typing'  ;
			
			$(id).remove();

			if ($("#typing-list li").length === 1){
				$(".typing").hide("slow");
			}

		}
		
	}

	function displayMessage(msg, user, color, now) {

		var who = '';

		if (user === socket.username) {
			who = 'right';
		} else {
			who = 'left';
		}

		var li = $('<li class="'
				+ who
				+ ' clearfix">'
				+
				// User avatar
				// '<span class="chat-img pull-left">' +
				// '<img src="http://bootdey.com/img/Content/user_3.jpg"
				// alt="User Avatar">' +
				// '</span>' +
				'<div class="chat-body pull-'
				+ who
				+ ' clearfix">'
				+ '<div class="header">'
				+ '<b class="primary-font" style="color:'
				+ color
				+ '">John Doe</b>'
				+ '<small class="pull-right text-muted"><div class="timestamp">'
				+ '<i class="timesent" data-time=' + now + '></i> </div>'
				+ '</small>' + '</div>' + '<p >' + '</p>' + '</div>' + '</li>');

		li.find('p').text(msg);
		li.find('b').text(user);

		scrollToBottom();
		chat.append(li);

		$(".timesent").last().text(now.format('h:mm:ss a'));
	}

	function scrollToBottom() {
		$(".chat-message").animate({
			scrollTop : $('.chat-message').prop("scrollHeight")
		}, 300);
	}
	
	function init(){
		$(".typing").hide();
	}
});