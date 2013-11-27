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

function checkName(name, list) {
  var searchStr = new RegExp(/[^a-z0-9 \-]/i);
  var newName = "";
  if (list.indexOf(name) > -1) {
    alert("That name is already taken. Please enter a different name.");
  }
  else if (name.search(searchStr) > -1) {
    alert("Only alphanumeric characters (a-z and 0-9), spaces, and dashes (-) are accepted. Please enter a different name.");
  }
  else {
    newName = name;
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
    $("#songformdiv").on("submit", "#songform", function(event){
      event.preventDefault();
      var newSongName = $(this).serializeArray();
      newSongName = checkName(newSongName[0].value, songList);
      if (newSongName !== "") {
        var songIsNew = true;
        loadSong(newSongName, songIsNew);
      }
    });
  });
};

function toggleCreateForm() {
  if ($("#songformdiv").hasClass("songform_hidden")) {
    $("#createsong").attr("src", "images/button_create_on.png");
    $("#songformdiv").removeClass("songform_hidden");
    $("#songformdiv").addClass("songform_slide");
    $("#songname").val("");
  }
  else {
    $("#createsong").attr("src", "images/button_create.png");
    $("#songformdiv").removeClass("songform_slide"); 
    $("#songformdiv").addClass("songform_hidden");
    $("#songformdiv").off("submit");
  };

};

function updateUIafterLogin() {
  $("#login").toggle();
  $("#navbar").toggle(); // make navbar visible
  newUser.listUserSongs();
  newUser.listAllSongs();
  $("#createsong").on("click", function(){
    event.preventDefault();
    toggleCreateForm();
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
  if (newUser.currentSong !== "") {
    newSong.firebaseSetChannelStatus(true, newSong.channel);  // free up channel being left
  };
  newSong = new Song();
  newSong.songname = songname;
  newUser.currentSong = songname;
  newSong.initNotes();
  if (songIsNew) {
    toggleCreateForm();
    newSong.firebaseNewSong();
    newSong.firebaseSetChannelStatus("init", 0);
    newSong.firebaseInitSongData();
    newUser.listUserSongs();
    newUser.listAllSongs();
  };
  newSong.firebaseGetSongData();
  newSong.loadChannel();
  if (songIsNew === false) {
    newSong.updateInstrument();
  };
  initGrid(newSong);
  newSong.updateGrid();
  removeListeners();
  newSong.addListeners();
};
