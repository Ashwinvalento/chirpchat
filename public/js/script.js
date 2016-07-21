$(function() {
	// Variables
	// get the ID of the room
	var room_id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);
	var typing = false;
	var COLORS = [ '#D24D57', '#CF000F', '#F1A9A0', '#663399', '#E4F1FE',
	               '#8E44AD', '#446CB3', '#4B77BE', '#26A65B', '#65C6BB',
	               '#C8F7C5', '#F89406', "#F2784B", "#D35400", "#BFBFBF" ];

	// ------------ JQuery Variables ------------
	// Login form vars
	var username = $("#username"), nameerror = $("#nameerror"), gendererror = $("#gender-error"), registrationModal = $('#registrationModal'), saveUser = $("#saveUser");

	// Chat Screen vars
	var message = $("#message"), chatform = $("#chatform"), chat = $(".chat"), typingList = $("#typing-list");

	// connect to the socket
	var socket = io();

	init();

	// on connection to server get the id of person's room
	socket.on('connect', function() {
		// Open the registration modal if username is blank
		if (socket.username == null) {
			showLoginModal();
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
			displayMessage(message.val(), {"name" : socket.username, "color":socket.usercolor, "imageUrl":socket.imageUrl},
					moment());

			// Send the message to the other person in the chat
			socket.emit('new message', {
				msg : message.val(),
				username : socket.username,
				usercolor : socket.usercolor,
				imageUrl : socket.imageUrl
			});
			// Empty the textarea
			message.val("");
			typing = false;
			// console.log("1. emit stop typing");
			socket.emit('stop typing', socket.username);
		}

	});

	message.on('input', function() {

		if (!typing) {
			typing = true;
			// console.log("1. emit typing");
			socket.emit('typing', socket.username);
		}

	});

	socket.on('show avatar',function(url){
		$("#avatar-img").attr("src",url);
		//store Image ID in global variable for later use
		socket.imageUrl = url;
	});
	
	socket.on('user joined', function(data) {
		displayMetaMessage(data.username + " has joined the room");
	});

	socket.on('user left', function(data) {
		typing = false;
		socket.emit('stop typing', data.username);
		displayMetaMessage(data.username + " has left the room");
	});

	socket.on('typing', function(data) {
		// console.log("3. on typing ---- display");
		displayTypingMessage(data.username, false);
	});

	socket.on('stop typing', function(data) {
		// console.log("3. on stop typing ---- display");
		displayTypingMessage(data.username, true);
	});

	socket.on('receive', function(data) {

		if (data.msg.trim().length) {
			displayMessage(data.msg, {"name" : data.username, "color":data.usercolor, "imageUrl":data.imageUrl} , moment());
		}
	});

	message.click(function() {
		message.focus();
	});

	
	
	function showLoginModal() {
		nameerror.slideUp();
		gendererror.slideUp();

		registrationModal.modal('show');

		var usercolor = COLORS[Math.floor((Math.random() * COLORS.length) + 1)];

		username.keypress(function(event) {
			nameerror.slideUp();
			var keycode = (event.keyCode ? event.keyCode : event.which);
			if (keycode == '13') {
				$("#saveUser").trigger("click");
			}

		});

		saveUser.click(function() {

			var uname = username.val();
			var radioValue = $("input[name='gender']:checked").val();
			if (!radioValue) {
				gendererror.slideDown();
			} else if (uname == "") {
				nameerror.slideDown();
			} else {
				socket.username = uname;
				socket.usercolor = usercolor;
				registrationModal.modal('hide');
				// send room id to the server on connection
				socket.emit('new user', {
					"room_id" : room_id,
					"username" : uname,
					"usercolor" : usercolor,
					"gender" : radioValue,
					"image_url": socket.imageUrl
				});
				displayMetaMessage("You joined the room");
				//set profile image
				$("#profile-img").attr("src",socket.imageUrl);
				$("#profile-name").text(uname);
				$("#profile-name").css("color",usercolor);
			}
		});
		
		$('input[name="gender"]').on('change', function() {
				gendererror.slideUp();
			   var gender = $('input[name="gender"]:checked').val();
			   socket.emit('get avatar', gender);
			});

	}

	function displayMetaMessage(message) {
		// Meta message will be displayed in the center of the screen

		var li = $('<li class="clearfix">'
				+ '<div style="margin-left:20%;margin-right:20%;">'
				+ '<div class="chat-body text-center clearfix well">'
				+ '<p >' + '</p>' + '</div>' + '</div>'
				+ '</li>');

		li.find('p').text(message);

		scrollToBottom();
		chat.append(li);

	}

	function displayTypingMessage(username, stop) {
		// remove spaces from username
		var user = username.replace(/ /g, "-");

		if (stop === false) {
			// add a list element with para id="<username>-typing" when user
			// starts typing
			var li = $('<li id="' + user
					+ '-typing" class="clearfix bg-primary">' + user + '</li>');

			typingList.append(li);

			if ($("#typing-list li").length > 1) {
				$(".typing").show("slow");
			}

		} else {

			// remove the typing message when user stops typing or when message
			// is sent
			var id = '#' + user + '-typing';

			$(id).remove();

			if ($("#typing-list li").length === 1) {
				$(".typing").hide("slow");
			}

		}

	}

	function displayMessage(msg, user, now) {

		var who = '';

		if (user.name === socket.username) {
			who = 'right';
		} else {
			who = 'left';
		}

		var li = $('<li class="' + who + ' clearfix">'
				+
				// User avatar
				 '<span class="chat-img pull-'+who+'">' +
				 '<img src="'+ user.imageUrl +'" alt="User Avatar">' +
				 '</span>' +
				'<div class="chat-body pull-'
				+ who
				+ ' clearfix">'
				+ '<div class="header">'
				+ '<b class="primary-font" style="color:'
				+ user.color
				+ '">John Doe</b>'
				+ '<small class="pull-right text-muted"><div class="timestamp">'
				+ '<i class="timesent" data-time=' + now + '></i> </div>'
				+ '</small>' + '</div>' + '<p >' + '</p>' + '</div>' + '</li>');

		li.find('p').text(msg);
		li.find('b').text(user.name);

		scrollToBottom();
		chat.append(li);

		$(".timesent").last().text(now.format('h:mm:ss a'));
	}

	function scrollToBottom() {
		$(".chat-message").animate({
			scrollTop : $('.chat-message').prop("scrollHeight")
		}, 300);
	}
	
	//show group users for mobile devides
	$( ".gp-chat-toggle" ).click(function() {

		});
	
	

	function init() {
		$(".typing").hide();
	}
});