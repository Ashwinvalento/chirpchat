[![Build Status](https://travis-ci.org/Ashwinvalento/chirpchat.svg?branch=master)](https://travis-ci.org/Ashwinvalento/chirpchat) ![Heroku](https://img.shields.io/badge/Heroku-Deployed-brightgreen.svg) ![Beta](https://img.shields.io/badge/stability-stable-brightgreen.svg)

# chirpchat - A chat application

A Fully fledged personal and group chat Node js Application works for desktop and mobile.

Find the [demo](http://chirpchat.herokuapp.com) at heroku : 

##Screenshots
### Desktop Version
![index screen](/screenshots/desktop/index.png?raw=true "Index Screen") ![Login Screen](/screenshots/desktop/reg.png?raw=true "Login Screen") ![Chat screen](/screenshots/desktop/chat.png?raw=true "Chat Screen") ![Attachment screen](/screenshots/desktop/attachment.png?raw=true "Attachment Screen")

### Mobile Version
![index screen](/screenshots/phone/index.png?raw=true "Index Screen") ![Login Screen](/screenshots/phone/reg.png?raw=true "Login Screen") ![Chat screen](/screenshots/phone/chat.png?raw=true "Chat Screen") ![Users screen](/screenshots/phone/users.bmp?raw=true "Users List") ![Attachment screen](/screenshots/phone/attach.png?raw=true "Attachment List")

### How to Run the app

* Clone this repo.
* Install the node modules from within the directory.
```
	npm install
``` 

* Run the application using node.
```
	node index.js
```

### Features / To Do tasks
- [x] Material Design and Mobile Compatible UI
- [x] Mobile Friendly UI
- [x] Group Chat
- [x] Multiple rooms
- [x] User Connected/Disconnected messages
- [x] User is Typing messages
- [x] Avatar for each Member
- [x] List Group Members
- [x] Add sound for each chat
- [x] Add Browser notification (Support for mobile only on https).
- [x] Add Emoji Support and Emoji Picker
- [x] Improve Home Screen UI (Add Material design)
- [x] Room Encryption using AES.
- [x] Chat Room Authentication.
- [x] Send/Receive Attachments

 
## How Authentication and encryption works:
* When the user creates a new chat room with a password, the sha-256 of the password is computed and appended to the URL. 
* The URL along with the password has to be shared securely with the friend.
* When the friend connects to the given URL,The login page opens and he is asked for the password. The sha-256 of the entered password is matched with the password appended with the url. If the password is correct, The user is given access to the room.
* When the user enters the password in the login page, it is stored as plain text in on the client side.
* The plain text password will be used to encrypt each message (using aes cipher) broadcasted to the group.
* only the users who know the actual password will be able to decrypt the message.

###Note:
* At no point is the plain text password sent over the network nor is the hash saved in the server.
* A Man in the Middle (MiM) may compute sha-256 of his own password and replace the password in the URL and gain access to the room, But he will not be able to read any messages since the messages are encrypted using the plain text password.
* A Man in the Middle (MiM) may use Lookup Tables or Rainbow Tables to decode the sha-256 hash to find the plaintext password, therefore, the user needs to use a complicated password. 
 
 
### Dependencies:
### NPM:
- [express](https://www.npmjs.com/package/express)
- [ejs](https://www.npmjs.com/package/ejs)
- [socket.io](https://www.npmjs.com/package/socket.io)
- [cartoon-avatar](https://www.npmjs.com/package/cartoon-avatar)
	
###Web :
- [bootstrap](http://getbootstrap.com/)
- [bootstrap-material-design](http://fezvrasta.github.io/bootstrap-material-design/)
- [Jquery](https://jquery.com/)
- [Google Fonts](https://www.google.com/fonts)
- [moment](http://momentjs.com/)
- [push.js](https://nickersoft.github.io/push.js/)
- [socket.io](http://socket.io/)
- [emojiOne](http://emojione.com/)
- [emojiOneArena](http://mervick.github.io/emojionearea/)
- [sjcl](https://github.com/bitwiseshiftleft/sjcl)
- [filereader.js](https://github.com/bgrins/filereader.js)


License:
--------

(The MIT License)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 
