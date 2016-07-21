// Create the main routes in this file

//get the avatar library
var toonavatar = require('cartoon-avatar');

module.exports = function(app, io) {

	// --------------- Route Settings --------------

	// Render Home page
	app.get('/', function(req, res) {

		// Render views/home.html
		res.render('home');
	});

	// Create a new chat room
	app.get('/newChat', function(req, res) {

		// Generate unique id for the room
		var id = Math.round((Math.random() * 1000000));

		// Redirect to the random room
		res.redirect('/chat/' + id);
	});

	app.get('/chat/:id', function(req, res) {
		// Render the chat.html view
		res.render('chat');
	});

	// ----------------- Socket Connection -------------------
	// Initialize a new socket.io application, named 'chat'
	var chat = io.on('connection', function(socket) {
		var addedUser = false;
		
		// while logging in , get a random avatar and send back to the client 
		socket.on('get avatar', function(gender){
			var url = toonavatar.generate_avatar({"gender":gender});
			socket.emit('show avatar', url);
		});
		
		socket.on('new user', function(userData) {
			if (addedUser)
				return;
			socket.room = userData.room_id;

			// Add the client to the room
			socket.join(userData.room_id);

			var user = {
				"username" : userData.username,
				"usercolor" : userData.usercolor
			}
			socket.userData = user;

			// tell everyone , the new user has joined!
			socket.broadcast.to(socket.room).emit('user joined', {
				username : userData.username
			});

			addedUser = true;
		});

		// Send message
		socket.on('new message', function(data) {
			// broadcast message to everyone else except the one who sends it
			socket.broadcast.to(socket.room).emit('receive', {
				msg : data.msg,
				username : data.username,
				usercolor : data.usercolor,
				imageUrl : data.imageUrl
			});
		});

		// when the client emits 'typing', we broadcast it to others
		socket.on('typing', function(username) {
			socket.broadcast.to(socket.room).emit('typing', {
				username : username
			});

			console.log(username + " is typing");
		});

		// when the client emits 'stop typing', we broadcast it to others
		socket.on('stop typing', function(username) {
			socket.broadcast.to(socket.room).emit('stop typing', {
				username : username
			});
			console.log(username + " stopped typing");
		});

		// Somebody left the chat
		socket.on('disconnect', function() {

			if (addedUser) {

				socket.leave(socket.room);
				// tell everyone , the new user has joined!
				socket.broadcast.to(socket.room).emit('user left', {
					username : socket.userData.username
				});
			}
		});

		function updateRoomUsers() {
			for (var i = 0; i < socket.usersList.length; i++) {
				console.log(socket.usersList[i].username + "\n");
			}
			socket.broadcast.emit('room users', {
				roomUsers : socket.usersList
			})
		}

	});

};

function findClientsSocket(io, roomId, namespace) {
	var res = [], ns = io.of(namespace || "/"); // the default namespace is "/"

	if (ns) {
		for ( var id in ns.connected) {
			if (roomId) {
				var index = ns.connected[id].rooms.indexOf(roomId);
				if (index !== -1) {
					res.push(ns.connected[id]);
				}
			} else {
				res.push(ns.connected[id]);
			}
		}
	}
	return res;
}