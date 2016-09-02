$(document).ready(function() {
	// Variables
	// get the ID of the room
	var roomId = Number(window.location.pathname
			.match(/\/chat\/(\d+)$/)[1]);
	var roomPass = getUrlVars()["password"] || null;
	var ptPass = null;
	var typing = false;
	var COLORS = [ '#D24D57', '#96281B', '#DB0A5B', '#663399',
			'#913D88', '#913D88', '#2C3E50', '#F89406',
			'#D35400', '#F2784B', '#F9BF3B', '#446CB3',
			"#E9D460", "#5C97BF", "#BFBFBF" ];
	var unreadMsgCount = 0;
	var windowTitle = "Chirp Chat";
	var usersInRoom = [];

	// ------------ JQuery Variables ------------
	// Login form vars
	var username = $("#username"), password = $("#password"), registrationModal = $('#registrationModal'), attachmentModal = $('#attachmentModal'), noUserModal = $('#noUsersModal'), registrationForm = $("#registrationForm");

	// Chat Screen vars
	var chatform = $("#chatform"), chat = $(".chat"), groupUsers = $(".users"), typingList = $("#typing-list"), gpListWindow = $('.gp-slider-window');

	// connect to the socket
	var socket = io();

	// Emoji Setup
	emojione.ascii = true;
	window.emojioneVersion = "2.1.1";
	var emojiEditor = $("#emoji-message-box").emojioneArea({
		shortnames : true,
		placeholder : "Type your text here"
	});

	init();

	// on connection to server get the id of person's room
	socket.on('connect', function() {
		// Open the registration modal if no user data is stored
		// in the socket
		if (socket.userData == null) {
			showLoginModal();
		}
	});

	emojiEditor[0].emojioneArea.on("keydown", function(editor,
			event) {
		// Submit the form on enter
		if (event.which == 13) {
			event.preventDefault();
			chatform.trigger('submit');
		}

	});

	chatform.on('submit', function(e) {
		e.preventDefault();

		var msgText = emojiEditor[0].emojioneArea.getText();

		if (msgText.trim().length) {
			// Create a new chat message and display it directly
			displayMessage({
				'type' : 'text',
				'msg' : msgText
			}, socket.userData, moment());

			// Send the message to the other person in the chat
			socket.emit('new message', encryptData(msgText),
					socket.userData);
			// Empty the textarea
			emojiEditor[0].emojioneArea.setText("");
			typing = false;
			socket.emit('stop typing', socket.userData);
		}

	});

	emojiEditor[0].emojioneArea.on("keypress", function(editor,
			event) {

		if (!typing) {
			typing = true;
			socket.emit('typing', socket.userData);
		} else {
			if (emojiEditor[0].emojioneArea.getText() === "") {
				socket.emit('stop typing', socket.userData);
				typing = false;
			}
		}

		// on keypad input, check if the group chat window is
		// up, if so ,
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

	socket.on('room data', function(data) {

		$.each(data.usersList, function(index, user) {
			usersInRoom.push(replaceSpace(user.username));
		});
	});

	socket.on('user joined', function(user) {
		displayMetaMessage(user.username
				+ " has joined the room");
		notifyUser("Chirp Chat ", {
			body : user.username.replace(/ +/g, " ")
					+ " joined the room ",
			icon : user.imageUrl,
			tag : replaceSpace(user.username),
			timeout : 3000
		});
		playNotificationSound("../sound/new_user");
		// Hide the invide dialogue if someone joins
		noUserModal.modal('hide');

	});

	socket.on('user left',
			function(user) {
				typing = false;

				displayMetaMessage(user.username
						+ " has left the room");

				// remove user from group list
				var userId = replaceSpace(user.username);
				var id = '#gp-list-' + userId;

				$(id).remove();

				displayTypingMessage(user, true);
				notifyUser("Chirp Chat ", {
					body : user.username.replace(/ +/g, " ")
							+ " left the room",
					icon : user.imageUrl,
					tag : replaceSpace(user.username),
					timeout : 4000
				});
				playNotificationSound("../sound/new_user");

			});

	socket.on('typing', function(user) {
		displayTypingMessage(user, false);
	});

	socket.on('stop typing', function(user) {
		displayTypingMessage(user, true);
	});

	socket.on('receive', function(encmsg, user) {
		var dMsg = decryptData(encmsg);
		var msg = dMsg.msg;
		if (msg !== undefined && msg.trim().length) {
			unreadMsgCount++;
			displayMessage(dMsg, user, moment());

			// if the document doesnt have focus
			if (!document.hasFocus()) {
				if (unreadMsgCount > 0) {
					document.title = windowTitle + " - ("
							+ unreadMsgCount + ') Unread';
				}
			} else {
				unreadMsgCount = 0;
			}
			if (dMsg.type === 'text') {
				notifyUser("Chirp Chat : New Message", {
					body : user.username.replace(/ +/g, " ")
							+ ": " + msg,
					icon : user.imageUrl,
					tag : replaceSpace(user.username),
					timeout : 3000
				});
				playNotificationSound("../sound/new_message");
			}
		}
	});

	
	socket.on('attachment', function(attachment) {
		displayMessage({
			'type' : 'html',
			'msg' : "<img class='img' style='width:200px; height:200px' src='"+attachment.value+"'> </img>"
		}, socket.userData, moment());

	});
	
	function showLoginModal() {

		socket.emit('room data', roomId);

		// show the password column if password is enabled.
		if (roomPass != null) {
			$(".password-section").show();
		} else {
			$(".password-section").hide();
		}

		registrationModal.modal('show');

		var userColor = COLORS[Math
				.floor((Math.random() * COLORS.length) + 1)];

		registrationForm
				.submit(function(event) {
					event.preventDefault();

					var uname = username.val();
					var pass = sjcl.codec.hex
							.fromBits(sjcl.hash.sha256
									.hash(password.val()));

					var radioValue = $(
							"input[name='gender']:checked")
							.val();
					if (!radioValue) {
						$("#gender-error").slideDown();
					} else if (!uname.match(/.{4,}/)) {
						$('#username-error')
								.text(
										"Username must contain atleast 4 charecters");
						$('#username-error').slideDown();
					} else if (usersInRoom
							.indexOf(replaceSpace(uname)) !== -1) {
						$('#username-error').text(
								"Username already in use.");
						$('#username-error').slideDown();
					} else if (roomPass != null
							&& pass !== roomPass) {
						$('#pass-error').slideDown();
					} else if (socket.imageUrl == null) {
						$('#gender-error')
								.text(
										"Loading user image. Please wait.");
						$('#pass-error').slideDown();
					} else {
						registrationModal.modal('hide');
						ptPass = password.val();

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
						$("#profile-img").attr("src",
								socket.imageUrl);
						$("#profile-name").text(uname);
						$("#profile-name").css("color",
								userColor);

						// if you are the only one, show no one
						// dialog
						if (usersInRoom.length === 0) {
							noUserModal.modal('show');
						}
						// show the room url in the box
						$(".room-url").text(
								window.location.href);
					}
				});

		$('input[name="gender"]').on(
				'change',
				function() {
					var gender = $(
							'input[name="gender"]:checked')
							.val();
					socket.emit('get avatar', gender);
				});

		username.keypress(function() {
			$('#username-error').slideUp();
		});

		password.keypress(function() {
			$('#pass-error').slideUp();
		});

	}

	function displayMetaMessage(message) {
		// Meta message will be displayed in the center of the
		// screen

		var li = $('<li class="clearfix">'
				+ '<div style="margin-left:20%;margin-right:20%;">'
				+ '<div class="chat-body text-center clearfix well">'
				+ '<p >' + '</p>' + '</div>' + '</div>'
				+ '</li>');

		li.find('p').text(message);

		scrollToBottom();
		chat.append(li);

	}

	function updateGroupUsers(usersList) {

		var ulContent = " ";
		usersList
				.forEach(function(user) {
					var userId = replaceSpace(user.username);
					var li = '<li class="bg-white clearfix" id="gp-list-'
							+ userId
							+ '">'
							+ '<span class="chat-img pull-left">'
							+ '<img src="'
							+ user.imageUrl
							+ '" alt="User Avatar">'
							+ '<div class="user-body pull-right clearfix">'
							+ '<b style="color:'
							+ user.userColor
							+ '"> '
							+ user.username
							+ '</b>'
							+ '</div>'
							+ '</span>' + '</li>';

					ulContent = ulContent.concat(li);
				});
		groupUsers.html(ulContent);
	}

	function displayTypingMessage(userData, stop) {
		// remove spaces from username
		var user = replaceSpace(userData.username);

		if (stop === false) {
			// add a list element with para
			// id="<username>-typing" when user
			// starts typing
			var li = $('<li id="' + user
					+ '-typing" class="clearfix typing-item ">'
					+ '<div class="typing-span ">'
					+ '<img src="../images/typing.png">'
					+ '<div>' + '<img class="img-circle" src="'
					+ userData.imageUrl + '">'
					+ '<div class=" pull-right clearfix">'
					+ '<b style="color:' + userData.userColor
					+ '"> ' + userData.username + '</b>'
					+ '</div>' + '</div></div> </li>');

			typingList.append(li);

			if ($("#typing-list li").length > 0) {
				$(".typing").show("slow");
			}

		} else {

			// remove the typing message when user stops typing
			// or when message
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

	function displayMessage(msgObj, user, now) {

		var msg = msgObj.msg;

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
				+ '<i class="timesent" data-time=' + now
				+ '></i> </div>' + '</small>' + '</div>'
				+ '<div class="message-text" >' + '</div>'
				+ '</div>' + '</li>');

		li.find('b').text(user.username);

		if (msg.match(/<[ ]*(script|style)/)) {
			// if the text contains script or style tag, display
			// it as text
			li.find('.message-text').text(msg);
		} else if (msg.match(/[\uD800-\uDFFF]/)) {
			// if the text has emojione images, display as html
			li.find('.message-text')
					.html(emojione.toImage(msg));
		} else if(emojione.shortnameToUnicode(msg).match(/[\uD800-\uDFFF]/)){
			// convert all short names to unicode and match
			li.find('.message-text')
			.html(emojione.toImage(msg));
		} else if (msgObj.type === "html") {
			// If the text type is html, display as html
			li.find('.message-text').html(msg);
		} else {
			// all other texts , display as text
			li.find('.message-text')
					.text(msg);
		}

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
			}, "fast", function() {
				gpListWindow.css("display", "none");
			}).removeClass('visible');
			gpToggleButton.css("transform", "rotateY(0deg)");
		} else {
			gpListWindow.animate({
				"left" : "10%"
			}, "fast");
			gpListWindow.addClass('visible').css("display",
					"table");
			gpToggleButton.css("transform", "rotateY(180deg)");
		}
	}

	function init() {
		// initialize the material library
		$.material.init();

		$(".typing").hide();
		
	    
		// on connecting , ask for permission

		if ('Notification' in window) {
			Notification.requestPermission();
		} else {
			// notifications not supported for this browser
			showError("Notifications not supported in your browser");
		}
	}

	$(window).focus(function() {
		unreadMsgCount = 0;
		document.title = windowTitle;
	})

	$("#invite").click(function() {
		$(".no-users h2").text("");
		noUserModal.modal('toggle');
	});

	$("#attach").click(function() {
		attachmentModal.modal('toggle');
	});

	var attachments = [];

    
    $("#file-input, #dropzone").fileReaderJS({
	    on: {
		      load: function(e, file) {
		        
		      var id = "g_"+file.extra.groupID+"_f_"+file.extra.fileID;
		        var li = $("<li id='" + id +"'>" +
					        "<div class='att-thumb'> </div>" +
					        "<div class='filename'>" + file.name + "</div> " +
					        "</li>");
		        
		
		        if (file.type.match(/image/)) {
		        	var thumb = "<img src='"+e.target.result+"' class='img' style='height:100px;min-width:100px' > </img>";
		        } else {
		        	var thumb = "<img src='../images/file.png' class='img' style='height:100px;min-width:100px' > </img>";
		        }
		        
		        li.find('.att-thumb').html(thumb);
		
		        $("#file-list").append(li);
		        
		      },
		      loadend : function(e, file){
		    	  file = {'id' : "g_"+file.extra.groupID+"_f_"+file.extra.fileID,
		    			   'value': e.target.result,
		    			   'type' : file.type }
		    	  
			      attachments.push(file);    	  
		      },
		      error: function(e, file) {
		        $("#file_" + file.extra.fileID).addClass("error");
		      }
		    }
		  });
    
    
    
    
    $("#send-att").on("click", function(){
    	
    	for (var i = 0; i < attachments.length; i++){
    		socket.emit('attachment', attachments[i]);
    	}
  	    
    	//empty the attachment list once sent
    	attachments = [];
    	$("#file-list").empty();
    	attachmentModal.modal('hide');
    });
    
	 $("#clear-att").on("click", function(){
    	  	    
    	//empty the attachment list 
    	attachments = [];
    	$("#file-list").empty();
    	attachmentModal.modal('hide');
    });
	 
	 
	
    function handleFileSelect(evt) {
    	console.log("handle file ip");
        var files = evt.target.files; // FileList object

        // files is a FileList of File objects. List some properties.
        var output = [];
        for (var i = 0, f; f = files[i]; i++) {
          output.push(f.name);
        }
        console.log(output.join('') );
      }

     // $('#files').click(handleFileSelect);
      $('#files').on('change', function(){console.log("input")});
	
	//Sending attachments
	socket.on("attachment", function(buffer) {
	         console.log(" image- buffer = : " + buffer);
	 });
	
	function notifyUser(title, options) {
		// display notification only if window doesnt have focus
		if (!document.hasFocus()) {
			if (Notification.permission === "granted") {

				if (/Mobi/.test(navigator.userAgent)) {
					// for mobile devices, dont remove the
					// notification
					delete options.timeout;
				}

				options.onClick = function(x) {
					window.focus();
					Push.close(options.tag);
				};

				options.vibrate = [ 300, 300 ]
				Push.create(title, options);
			}

		}
	}

	function playNotificationSound(filename) {
		$("#sound")
				.html(
						'<audio autoplay="autoplay"><source src="'
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
				.html(
						'<div class="alert alert-danger" id="error-msg"><a href="#" class="close" data-dismiss="alert">&times;</a>'
								+ msg + '</div>')
	}

	function getUrlVars() {
		var vars = [], hash;
		var hashes = window.location.href.slice(
				window.location.href.indexOf('?') + 1).split(
				'&');
		for (var i = 0; i < hashes.length; i++) {
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = hash[1];
		}
		return vars;
	}

	function encryptData(data) {
		if (data === Object(data)) {
			return sjcl.encrypt(ptPass, sjcl.json.encode(data));
		} else {
			return sjcl.encrypt(ptPass, data);
		}

	}
	function decryptData(data) {
		try {
			// decrypt the data, if it throws error, then the
			// key is incorrect.
			var decryptedData = sjcl.decrypt(ptPass, data);
			try {
				// decode the decrypted data, If it returns
				// error, its not a Json data.
				return {
					'type' : 'text',
					'msg' : sjcl.json.decode(decryptedData)
				};
			} catch (err) {
				return {
					'type' : 'text',
					'msg' : decryptedData
				};
			}
		} catch (err) {
			return {
				'type' : 'html',
				'msg' : '<div class="alert alert-danger text-center" >- Message decryption failed - <br/> Either you or the sender has incorrect password <br/> Also make sure you have the correct url</div>'
			};
		}
	}
});