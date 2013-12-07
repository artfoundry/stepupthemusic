function User() {
  this.userLogin = []; // array will contain serialized username and pw
  this.currentSong = "";
};

User.prototype.getUserLogin = function(request) {
  if (request === "name") {
    return this.userLogin[0].value;
  }
  else {  // requesting pw
    return this.userLogin[1].value;
  };
};

User.prototype.freeUpChannel = function(newSongName) {
  if (this.currentSong !== ""){ // if user has already been in a channel
    if (newSongName !== "") {
      newSong.firebaseSetChannelStatus(true, newSong.channel);  // free up channel being left
    };
    var userSongFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/' + this.currentSong + '/' + newSong.channel + '/free');
    userSongFBRef.onDisconnect().set(true); // set channel to available
  };
};

User.prototype.updateConnectStatus = function() {
  var myConnectionsRef = new Firebase('https://stepupthemusic.firebaseIO.com/users/' + this.userLogin[0].value + '/connections');
  var connectedRef = new Firebase('https://stepupthemusic.firebaseIO.com/.info/connected');
  connectedRef.on('value', function(snapshot) {
    if (snapshot.val() === true) {
      var connectedDevice = myConnectionsRef.push(true);
      connectedDevice.onDisconnect().remove();
      var songFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/');
      songFBRef.on('value', function(songSnapshot) {
        var noNewSong = "";
        newUser.freeUpChannel(noNewSong);
      })
    };
  });
};

User.prototype.verifyLogin = function() {
  $("#create").click(function(){
    $("#login").load("views/create_user.html");
    newUser.createUser();
  });
  user = this;
  $("#login").on("submit", "#loginform", function(event) {
    event.preventDefault();
    user.userLogin = $(this).serializeArray();
    var allUsersFBRef = new Firebase('https://stepupthemusic.firebaseio.com/users/');
    allUsersFBRef.once('value', function(snapshot) {
      var username = snapshot.child(user.userLogin[0].value).name();
      var password = snapshot.child(user.userLogin[0].value).child('pw').val();
      if ((user.userLogin[0].value === username) && (user.userLogin[1].value === password)) {
        user.updateConnectStatus();
        updateUIafterLogin();
      }
      else {
        alert("Your login info is incorrect");
      };
    });
  });
};

User.prototype.createUser = function() {
  var user = this;
  var userLogin = [];
  $("#login").on("submit", "#createuser", function(event){
    event.preventDefault();
    userLogin = $(this).serializeArray()
    if ((userLogin[0].value) && (userLogin[1].value)) {
      var allUsersFBRef = new Firebase('https://stepupthemusic.firebaseio.com/');
      allUsersFBRef.once('value', function(usersSnapshot) {
        var userList = [];
        if (usersSnapshot.hasChild('users')) {
          var userList = Object.keys(usersSnapshot.child("users").val());
        };
        var newName = checkName(userLogin[0].value, userList);
        if (newName !== "") { // empty string if there was an error
          userLogin[0].value = newName;
          user.userLogin = userLogin;
          allUsersFBRef.child("users").child(newName).set({pw: user.userLogin[1].value});
          updateUIafterLogin();
        };
      });
    }
    else {
      alert("You need to enter both user name and password. Please try again.");
    };
  }); 
};

User.prototype.printSongList = function(listSelector) {
  $(listSelector).html("");
  var songListFBRef = {};
  var listAbbrev = ""; // to make IDs different for public vs. user list (more for clarity than necessity since random number already differentiates)
  if (listSelector === "#publicSonglist") { // if songlist is the public list, which comes in as hash
    songListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/');
    listAbbrev = "_p";
  }
  else if (listSelector === "#userSonglist") {
    songListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/users/' + this.userLogin[0].value + '/songs/');
    listAbbrev = "_u";
  };
  songListFBRef.on('child_added', function(songSnapshot) {
    var songName = songSnapshot.name();
    var nameNoSpaces = {};
    // add rand to prevent a name with spaces and same name w/o from having same ID
    nameNoSpaces[songName] = songName.replace(/\s+/g, "") + listAbbrev + Math.floor(Math.random() * 100000).toString();
    // if song is not already listed in the user list, then ok to list in public list
    $(listSelector).append("<li id='" + nameNoSpaces[songName] + "'><a href='#'>" + songName + "</a></li>");
    $("#" + nameNoSpaces[songName]).on("click", function(event) {
      event.preventDefault();
      loadCheck(songName);
    });
  });
};

User.prototype.listUserSongs = function() {
  var userFBRef = new Firebase('https://stepupthemusic.firebaseio.com/users/' + this.userLogin[0].value);
  userFBRef.once('value', function(userSnapshot) {
    if (userSnapshot.hasChild('songs')) {
      newUser.printSongList("#userSonglist")
    }
    else {
      $("#userSonglist").append("You have not created any songs yet.");
    };
  });
};

User.prototype.listAllSongs = function() {
  var publicSongListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/');
  publicSongListFBRef.once('value', function(songsSnapshot) {
    var songList = songsSnapshot.val();
    if (songList) {
      newUser.printSongList("#publicSonglist")
    }
    else {
      $("#publicSonglist").append("No songs have been created yet.");
    };
  });
};
