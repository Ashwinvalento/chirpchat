// Create the main routes in this file

module.exports = function(app, io) {

	
	//Render Home page
	app.get('/', function(req, res) {

		// Render views/home.html
		res.render('home');
	});

	// Create a new chat room
	app.get('/newChat', function(req,res){

		// Generate unique id for the room
		var id = Math.round((Math.random() * 1000000));

		// Redirect to the random room
		res.redirect('/chat/'+id);
	});
	
	
	app.get('/chat/:id', function(req,res){
		// Render the chat.html view
		res.render('chat');
	});
	
	// Initialize a new socket.io application, named 'chat'
	var chat = io.on('connection', function (socket) {
		
		socket.on('new user',function(room_id){
			console.log("connected");

			//socket.username = data.user;
			socket.room = room_id;

			// Add the client to the room
			socket.join(room_id);
			
			//var room = findClientsSocket(io,room_id);
//			
//			socket.emit('peopleinchat', {
//				number: 1,
//				user: room[0].username,
//				avatar: room[0].avatar,
//				room_id: room_id
//			});
			
		});
		
		// Send message
		socket.on('new message', function(data){
			console.log("new message : "+ data.msg);
			// broadcast message to everyone else except the one who sends it
			socket.broadcast.to(socket.room).emit('receive', {msg: data.msg, user: data.user, color: data.color});
		});
		
		  // when the client emits 'typing', we broadcast it to others
		  socket.on('typing', function () {
		    socket.broadcast.emit('typing', {
		      username: socket.username
		    });
		  });
		
		
		// Somebody left the chat
		socket.on('disconnect', function() {

//			// Notify the other person in the chat room
//			// that his partner has left
//
//			socket.broadcast.to(this.room).emit('leave', {
//				boolean: true,
//				room: this.room,
//				user: this.username,
//				avatar: this.avatar
//			});
//
			// leave the room
			socket.leave(socket.room);
			
			console.log("disconnected");
			});
		
		
	});
	
};