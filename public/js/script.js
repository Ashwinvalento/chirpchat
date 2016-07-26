$(function() {
	// Variables
	// get the ID of the room
	var roomId = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);
	var typing = false;
	var COLORS = [ '#D24D57', '#96281B', '#DB0A5B', '#663399', '#913D88',
			'#913D88', '#2C3E50', '#F89406', '#D35400', '#F2784B', '#F9BF3B',
			'#446CB3', "#E9D460", "#5C97BF", "#BFBFBF" ];
	var unreadMsgCount = 0;
	var windowTitle = "Chirp Chat";
	var usersInRoom = [];

	// ------------ JQuery Variables ------------
	// Login form vars
	var username = $("#username"), nameerror = $("#nameerror"), gendererror = $("#gender-error"), registrationModal = $('#registrationModal'), saveUser = $("#saveUser");

	// Chat Screen vars
	var message = $("#message"), chatform = $("#chatform"), chat = $(".chat"), groupUsers = $(".users"), typingList = $("#typing-list"), gpListWindow = $('.gp-slider-window');

	// connect to the socket
	var socket = io();

	init();

	// on connection to server get the id of person's room
	socket.on('connect', function() {
		// Open the registration modal if no user data is stored in the socket
		if (socket.userData == null) {
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
			displayMessage(message.val(), socket.userData, moment());

			// Send the message to the other person in the chat
			socket.emit('new message', message.val(), socket.userData);
			// Empty the textarea
			message.val("");
			typing = false;
			socket.emit('stop typing', socket.userData);
		}

	});

	message.on('input', function() {

		if (!typing) {
			typing = true;
			socket.emit('typing', socket.userData);
		} else {
			if (message.val() === "") {
				socket.emit('stop typing', socket.userData);
				typing = false;
			}
		}

		// on keypad input, check if the group chat window is up, if so ,
		// minimise it
		if (gpListWindow.hasClass("visible")) {
			toggleGroupListWindow();
		}

	});

	socket.on('show avatar', function(url) {
		$("#avatar-img").attr("src", url);
		// store Image ID in global variable for later use
		socket.imageUrl = url;
	});

	socket.on('users list', function(usersList) {
		updateGroupUsers(usersList);
	});

	socket.on('room user array', function(usersList) {

		$.each(usersList, function(index, user) {
			usersInRoom.push(replaceSpace(user.username));
		});
	});

	socket.on('user joined', function(user) {
		displayMetaMessage(user.username + " has joined the room");
		notifyUser("Chirp Chat ", {
			body : user.username.replace(/ +/g, " ") + " joined the room ",
			icon : user.imageUrl,
			tag : replaceSpace(user.username),
			timeout: 3000
		});
		playNotificationSound("../sound/new_user");

	});

	socket.on('user left', function(user) {
		typing = false;

		displayMetaMessage(user.username + " has left the room");

		// remove user from group list
		var userId = replaceSpace(user.username);
		var id = '#gp-list-' + userId;

		$(id).remove();

		displayTypingMessage(user, true);
		notifyUser("Chirp Chat ", {
			body : user.username.replace(/ +/g, " ") + " left the room",
			icon : user.imageUrl,
			tag : replaceSpace(user.username),
			timeout: 4000
		});
		playNotificationSound("../sound/new_user");

	});

	socket.on('typing', function(user) {
		displayTypingMessage(user, false);
	});

	socket.on('stop typing', function(user) {
		displayTypingMessage(user, true);
	});

	socket.on('receive', function(msg, user) {

		if (msg.trim().length) {
			unreadMsgCount++;
			displayMessage(msg, user, moment());
			
			//if the document doesnt have focus
			if (!document.hasFocus()) {	
				if (unreadMsgCount > 0) {
					document.title = windowTitle + " - (" + unreadMsgCount
							+ ') Unread';
				}
			}else{
				unreadMsgCount = 0;
			}
			notifyUser("Chirp Chat : New Message", {
				body : user.username.replace(/ +/g, " ") + ": " + msg,
				icon : user.imageUrl,
				tag : replaceSpace(user.username),
				timeout: 3000
			});
			playNotificationSound("../sound/new_message");
		}
	});

	message.click(function() {
		message.focus();
	});

	function showLoginModal() {
		nameerror.slideUp();
		gendererror.slideUp();

		socket.emit('room user array', roomId);

		registrationModal.modal('show');

		var userColor = COLORS[Math.floor((Math.random() * COLORS.length) + 1)];

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
				nameerror.text("You Need a Name!");
				nameerror.slideDown();
			} else if (usersInRoom.indexOf(replaceSpace(uname)) !== -1) {
				nameerror.text("This Name is already taken");
				nameerror.slideDown();
			} else {
				registrationModal.modal('hide');
				// send room id to the server on connection

				var newUser = {
					"roomId" : roomId,
					"username" : uname,
					"userColor" : userColor,
					"gender" : radioValue,
					"imageUrl" : socket.imageUrl
				}
				socket.userData = newUser;
				socket.emit('new user', newUser);
				displayMetaMessage("You joined the room");
				// set profile image
				$("#profile-img").attr("src", socket.imageUrl);
				$("#profile-name").text(uname);
				$("#profile-name").css("color", userColor);

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
				+ '<div class="chat-body text-center clearfix well">' + '<p >'
				+ '</p>' + '</div>' + '</div>' + '</li>');

		li.find('p').text(message);

		scrollToBottom();
		chat.append(li);

	}

	function updateGroupUsers(usersList) {

		var ulContent = " ";
		usersList.forEach(function(user) {
			var userId = replaceSpace(user.username);
			var li = '<li class="bg-white clearfix" id="gp-list-' + userId
					+ '">' + '<span class="chat-img pull-left">' + '<img src="'
					+ user.imageUrl + '" alt="User Avatar">'
					+ '<div class="user-body pull-right clearfix">'
					+ '<b style="color:' + user.userColor + '"> '
					+ user.username + '</b>' + '</div>' + '</span>' + '</li>';

			ulContent = ulContent.concat(li);
		});
		groupUsers.html(ulContent);
	}

	function displayTypingMessage(userData, stop) {
		// remove spaces from username
		var user = replaceSpace(userData.username);

		if (stop === false) {
			// add a list element with para id="<username>-typing" when user
			// starts typing
			var li = $('<li id="' + user
					+ '-typing" class="clearfix typing-item ">'
					+ '<div class="typing-span ">'
					+ '<img src="../images/typing.png">' + '<div>'
					+ '<img class="img-circle" src="' + userData.imageUrl
					+ '">' + '<div class=" pull-right clearfix">'
					+ '<b style="color:' + userData.userColor + '"> '
					+ userData.username + '</b>' + '</div>'
					+ '</div></div> </li>');

			typingList.append(li);

			if ($("#typing-list li").length > 0) {
				$(".typing").show("slow");
			}

		} else {

			// remove the typing message when user stops typing or when message
			// is sent
			var id = '#' + user + '-typing';

			if ($("#typing-list li").length === 1) {
				$(".typing").hide("slow", function() {
					$(id).remove();
				});
			} else {
				$(id).remove();
			}
		}

	}

	function displayMessage(msg, user, now) {

		var who = '';

		if (user.username === socket.userData.username) {
			who = 'right';
		} else {
			who = 'left';
		}

		var li = $('<li class="'
				+ who
				+ ' clearfix">'
				+
				// User avatar
				'<span class="chat-img pull-'
				+ who
				+ '">'
				+ '<img src="'
				+ user.imageUrl
				+ '" alt="User Avatar">'
				+ '</span>'
				+ '<div class="chat-body pull-'
				+ who
				+ ' clearfix">'
				+ '<div class="header">'
				+ '<b style="color:'
				+ user.userColor
				+ '">John Doe</b>'
				+ '<small class="pull-right text-muted"><div class="timestamp">'
				+ '<i class="timesent" data-time=' + now + '></i> </div>'
				+ '</small>' + '</div>' + '<p >' + '</p>' + '</div>' + '</li>');

		li.find('p').text(msg);
		li.find('b').text(user.username);

		scrollToBottom();
		chat.append(li);

		$(".timesent").last().text(now.format('h:mm:ss a'));
	}

	function scrollToBottom() {
		$(".chat-message").animate({
			scrollTop : $('.chat-message').prop("scrollHeight")
		}, 300);
	}

	// show group users for mobile devides
	$(".gp-chat-toggle-btn").click(function() {
		toggleGroupListWindow();
	});

	function toggleGroupListWindow() {

		var gpToggleButton = $(".gp-chat-toggle-btn > img");
		if (gpListWindow.hasClass('visible')) {
			gpListWindow.animate({
				"left" : "105%"
			}, "slow", function() {
				gpListWindow.css("display", "none");
			}).removeClass('visible');
			gpToggleButton.css("transform", "rotateY(0deg)");
		} else {
			gpListWindow.animate({
				"left" : "10%"
			}, "slow");
			gpListWindow.addClass('visible').css("display", "table");
			gpToggleButton.css("transform", "rotateY(180deg)");
		}
	}

	function init() {
		$(".typing").hide();
		
		//on connecting , ask for permission
		
		if ('Notification' in window) {
			  Notification.requestPermission();
			}else{
				// notifications not supported for this browser
				showError("Notifications not supported in your browser");
			}
	}

	$(window).focus(function() {
		unreadMsgCount = 0;
		document.title = windowTitle;
	})

	function notifyUser(title, options) {
		//display notification only if window doesnt have focus
		if (!document.hasFocus()) {
			
			if (/Mobi/.test(navigator.userAgent)) {
				//for mobile devices, dont remove the notification
			    delete options.timeout;
			}
			
			options.onClick = function(x) {
				window.focus();
				Push.close(options.tag);
			};
			
			options.vibrate = [300,300]
			Push.create(title, options);
		
		}
	}

	function playNotificationSound(filename) {
		$("#sound").html('<audio autoplay="autoplay"><source src="'
				+ filename
				+ '.mp3" type="audio/mpeg" />'
				+ '<embed hidden="true" autostart="true" loop="false" src="'
				+ filename + '.mp3" /></audio>');
	}

	function replaceSpace(data) {
		return data.toLowerCase().replace(/ +/g, "-");

	}

	function showError(msg) {
		$(".error-placeholder")
				.html('<div class="alert alert-danger" id="error-msg"><a href="#" class="close" data-dismiss="alert">&times;</a>'
								+ msg + '</div>')
	}

});