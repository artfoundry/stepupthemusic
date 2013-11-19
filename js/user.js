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

User.prototype.updateConnectStatus = function() {
  var myConnectionsRef = new Firebase('https://stepupthemusic.firebaseIO.com/users/' + this.userLogin[0].value + '/connections');
  var connectedRef = new Firebase('https://stepupthemusic.firebaseIO.com/.info/connected');
  connectedRef.on('value', function(snapshot) {
    if (snapshot.val() === true) {
      var connectedDevice = myConnectionsRef.push(true);
      connectedDevice.onDisconnect().remove();
    }
  });
};

User.prototype.verifyLogin = function() {
  $("#create").click(function(){
    $("#login").load("views/create_user.html");
    newUser.createUser();
  });
  user = this;
  $("form").on("submit", function(event) {
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
  user = this;
  $("#login").on("submit", "#createuser", function(event){
    event.preventDefault();
    user.userLogin = $(this).serializeArray()
    if ((user.userLogin[0]) && (user.userLogin[1])) {
      var allUsersFBRef = new Firebase('https://stepupthemusic.firebaseio.com/users/');
      allUsersFBRef.child(user.userLogin[0].value).set({pw: user.userLogin[1].value});
      updateUIafterLogin();
    }
    else {
      alert("Invalid info. Try again.");
    };
  }); 
};

User.prototype.printSongList = function(listSelector) {
  $(listSelector).html("");
  if (listSelector === "#publicSonglist") { // if songlist is the public list, which comes in as hash
    var songListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/');
  }
  else {
    var songListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/users/' + this.userLogin[0].value + '/songs/');
  };
  songListFBRef.on('child_added', function(songSnapshot) {
    var songName = songSnapshot.name();
    // if song is not already listed in the user list, then ok to list in public list
    if (listSelector === "#publicSonglist") {
      $(listSelector).append("<li class='publicSong'><a href='#'>" + songName + "</a></li>");
      $(".publicSong").on("click", function(event) {
        event.preventDefault();
        var clickedSong = $(this).text();
        loadCheck(clickedSong);
      });
    }
    else {
      $(listSelector).append("<li class='userSong'><a href='#'>" + songName + "</a></li>");
      $(".userSong").on("click", function(event) {
        event.preventDefault();
        var clickedSong = $(this).text();
        loadCheck(clickedSong);
      });
    };
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
