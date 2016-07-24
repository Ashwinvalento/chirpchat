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
		
//		socket.on('update group list', function(userData) {
//			//send all connected users list  
//			listRoomUsers(socket ,userData.roomId);
//		});
		
		
		socket.on('new user', function(userData) {
			if (addedUser)
				return;
			socket.room = userData.roomId;

			// Add the client to the room
			socket.join(userData.roomId);

			var user = {
				"username" : userData.username,
				"userColor" : userData.userColor,
				"imageUrl" : userData.imageUrl,
				"gender" : userData.gender
			}
			socket.userData = user;

			// tell everyone , the new user has joined!
			socket.broadcast.to(socket.room).emit('user joined', user);
			
			//send all connected users list  
			listRoomUsers(socket , userData.roomId);
						
			addedUser = true;
		    
		});

		// Send message
		socket.on('new message', function(msg,user) {
			// broadcast message to everyone else except the one who sends it
			socket.broadcast.to(socket.room).emit('receive', msg, user);
		});

		// when the client emits 'typing', we broadcast it to others
		socket.on('typing', function(user) {
			socket.broadcast.to(socket.room).emit('typing', user);
		});

		// when the client emits 'stop typing', we broadcast it to others
		socket.on('stop typing', function(user) {
			socket.broadcast.to(socket.room).emit('stop typing', user);
		});

		// Somebody left the chat
		socket.on('disconnect', function() {

			if (addedUser) {

				socket.leave(socket.room);
				// tell everyone , the new user has joined!
				socket.broadcast.to(socket.room).emit('user left',socket.userData );
			}
		});

	});
	
	
	function listRoomUsers(socket ,room) {
		var users = [];
		var connected = io.of("/").connected;
			// get a list of all clients connected for the namespace
			for (var id in connected) {
				// If the connected client is present in the given room, add the data to result
				// note that the room and userData is stored in the socket on login
				if(connected[id].room === room) {
					var userData = {};
					userData = connected[id].userData;
					users.push(userData);
				}
			}
			// Send to all in the room , including the called socket
			io.sockets.in(socket.room).emit('users list', users);
		}

};
