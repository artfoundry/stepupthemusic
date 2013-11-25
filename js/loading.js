$(document).ready(function(){
  initSequencer();
});

function initSequencer() {
  MIDI.loadPlugin({
    soundfontUrl: "./soundfont/",
    instruments: ["acoustic_grand_piano", 
                  "acoustic_guitar_nylon", 
                  "lead_1_square", 
                  "melodic_tom", 
                  "pad_7_halo", 
                  "synth_bass_2"
                  ],
    callback: function() {
      newUser = new User;
      $("#login").toggle();
      newUser.verifyLogin();
      newSong = new Song();
      $("#loadMessage").toggle();
    }
  });
};

function checkName(name, list, type) {
  var newName = "";
  var needNewName = true;
  var searchStr = new RegExp(/[^a-z, 0-9, _, \-]/i);
  if (type === "song") {
    newName = name;
    while (needNewName) {
      for (var i = 0; i < list.length; i++) {
        if (newName === list[i]) {
          i = list.length + 1;
        };
      };
      if (i === list.length + 2) {
        newName = window.prompt("That name is already taken. Please enter a different name.");
      }
      else if (searchStr.test(newName)) {
        newName = window.prompt("Only alphanumeric characters (a-z and 0-9), spaces, underscores (_), and dashes (-) are accepted. Please enter a different name.");
      }
      else {
        needNewName = false;
      };
    };
  }
  else if (type === "user") {
    for (var i = 0; i < list.length; i++) {
      if (name === list[i]) {
        i = list.length + 1;
      };
    };
    if (i === list.length + 2) {
      alert("That name is already taken. Please enter a different name.");
    }
    else if (searchStr.test(name)) {
      alert("Only alphanumeric characters (a-z and 0-9), spaces, underscores (_), and dashes (-) are accepted. Please enter a different name.");
    }
    else {
      newName = name;
    };
  };
  return newName;
};

function createNewSong() {
  var publicSongListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/');
  publicSongListFBRef.once('value', function(songsSnapshot) {
    var songList = [];
    if (songsSnapshot.hasChild('songs')) {
      songList = Object.keys(songsSnapshot.child("songs").val());
    };
    var newSongName = window.prompt("Please enter a song name:");
    if (newSongName) {
      newSongName = checkName(newSongName, songList, "song");
      var songIsNew = true;
      loadSong(newSongName, songIsNew);
    };
  });
};

function updateUIafterLogin() {
  $("#login").toggle();
  $("#navbar").toggle(); // make navbar visible
  newUser.listUserSongs();
  newUser.listAllSongs();
  $("#createsong").on("click", function(){
    event.preventDefault();
    createNewSong();
  });
  ColorSphereBackground();
};

function isConnected(username) {
  var myConnectionsRef = new Firebase('https://stepupthemusic.firebaseio.com/users/' + username + '/');
  var connected = true;
  myConnectionsRef.on('value', function(snapshot) {
    if ((snapshot.hasChild('connections') !== true) || (snapshot.child('connections').val() === null)) {
      connected = false;
    };
  });
  return connected;
};

function freeChannelExists(songName) {
  var songFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/' + songName + '/');
  var isFree = false;
  songFBRef.once('value', function(songSnapshot) {
    var channels = songSnapshot.val();
    var i = 0;
    var channelStatus = "";
    var myConnectionsRef = {};
    while (i < 4) {
      channelStatus = channels[i].free;
      myConnectionsRef = new Firebase('https://stepupthemusic.firebaseio.com/users/' + channelStatus + '/connections');
      if (channelStatus === true) {
        isFree = true;
      }
      else if (channelStatus === newUser.userLogin[0].value) { // if user listed as occuping the channel...
        if (myConnectionsRef !== null) { // ...is connected and trying to get into the song...
          songFBRef.child(i).update({free: true}); // ...set channel to available
          isFree = true;
        };
      }
      else if (channelStatus !== newUser.userLogin[0].value) { // if user is not the current user
        if (myConnectionsRef === null) { // ...and is not connected
          songFBRef.child(i).update({free: true}); // ...set channel to available
          isFree = true;
        };
      };
      i++;
    };
  });
  return isFree;
};

function loadCheck(clickedSong) {
  if (freeChannelExists(clickedSong)) {
    var songIsNew = false;
    loadSong(clickedSong, songIsNew);
  }
  else {
    alert("Sorry, but all tracks are full for this song. Please choose another or create your own!");
  };
};

function loadSong(songname, songIsNew) {
  clearLoginDiv();
  if (newUser.currentSong !== "") {
    newSong.firebaseSetChannelStatus(true, newSong.channel);  // free up channel being left
  };
  newSong.songname = songname;
  newUser.currentSong = songname;
  newSong.initNotes();
  if (songIsNew) {
    newSong.firebaseNewSong();
    newSong.firebaseSetChannelStatus("init", 0);
    newSong.firebaseInitSongData();
    newUser.listUserSongs();
    newUser.listAllSongs();
  };
  newSong.firebaseGetSongData();
  newSong.loadChannel();
  newSong.updateInstrument();
  initGrid(newSong);
  newSong.updateGrid();
  removeListeners();
  newSong.addListeners();
};
