# Change Log
All notable changes to this project will be documented in this file.

The changelog adheres to format specified in [keep change log](http://keepachangelog.com)

## [Unreleased]
### Added
- Send any attachments

### Changed
- removed html support for users.
- removed images and added font awesome icons.
- styles and animations.

### Fixed
- Users could remotely modifiy UI and run scripts on remote node.


## [1.4.0] - 2016-07-05
### Added 
- Room encryption using AES (sjcl.js library) 
- Chat Room Authentication.
- Screenshots to README.
- Authentication and Encryption notes to README.
- Background blur for modals.

###changed
- replaced url box with button in slider window.
- code cleanup.(removed custom form validation and added html5 validation).

###fixed
- jQuery issue in firefox.

## [1.3.1] - 2016-07-27
### Added
- URL box to share to other users.
- Material UI home screen.

### Fixed
- uncaught error if notifications were blocked.
- group list button defer slide animation. 


## [1.3.0] - 2016-07-27
### Added
- Unread messages count on window title
- Notification for message, user Joined and user Left
- Notification Sound for message, user Joined and user Left.
- Name Validation to Users List (2 people cannot have the same name)
- Added Favicon.
- Emoji support with emoji picker.
 
### Changed
- Typing List UI


### Fixed
- chat pull right bug.
- typing box animation closing.
- remove user typing when disconnected.
- remove user typing when text is erased.
- group list sliding in mobile devices.
- hide group list when typing message


## [1.1.0] - 2016-07-23
### Added
- Avatar Image for chats
- Meta Message to self when you join the room 
- List Group users.
- Group users slide navigation for mobile devices.

### Changed
- UI modified : Meta messages removed bg color and added well.
- UI modified : Added well to the page to get shadow.
- Included new version of cartoon-avatar.
- chat input box moved outside 
- removed extra unwanted div tags.
- Updated Color values.

### Fixed
- chat input box for mozilla was displayed to the right.
- full Height hack removed. 
- page well margins.
- UI modified : group users list box (dummy data)

## [1.0.0] - 2016-07-20
### Added
- Material Design UI
- Group Chat
- Multiple rooms
- User Connected/Disconnected messages
- User is Typing messages
