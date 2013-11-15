$(document).ready(function(){
  initSequencer();
});

function initSequencer() {
  MIDI.loadPlugin({
    soundfontUrl: "./soundfont/",
    instruments: ["acoustic_grand_piano", 
                  "acoustic_guitar_nylon", 
                  "distortion_guitar", 
                  "electric_bass_finger", 
                  "flute", 
                  "synth_drum"
                  ],
    callback: function() {
      newUser = new User;
      newUser.verifyLogin();
      $("#loadMessage").text("Loading finished.");
    }
  });
};

function createNewSong() {
  var newSongName = window.prompt("Please enter a song name:");
  var publicSongListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/');
  publicSongListFBRef.once('value', function(songsSnapshot) {
    if (songsSnapshot.hasChild('songs')) {
      var songList = Object.keys(songsSnapshot.val());
      var notNew = true;
      while (notNew) {
        for (var i = 0; i < songList.length; i++) {
          if (newSongName === songList[i]) {
            i = songList.length + 1;
          };
        };
        if (i === songList.length + 2) {
          newSongName = window.prompt("That name is already taken. Please enter a different name:");
        }
        else {
          notNew = false;
        };
      };
    };
    var songIsNew = true;
    loadSong(newSongName, songIsNew);
  });
};

function updateUIafterLogin() {
  $("#login").html("");
  $("#publicListHeader").toggle(); // make headers visible
  $("#userListHeader").toggle();
  newUser.listUserSongs();
  newUser.listAllSongs();
  $("#menubar").html("<button id='createsong'>Create New Song</button>");
  $("#createsong").on("click", function(){
    event.preventDefault();
    createNewSong();
  });
};

function loadSong(songname, songIsNew) {
  var newSong = new Song(songname);
  if (songIsNew) {
    newSong.firebaseNewSong();
    newUser.listUserSongs();
    newUser.listAllSongs();
    newSong.firebaseSetChannelStatus("init");
  }
  newSong.initNotes();
  initGrid(newSong);
  newSong.loadChannel();
  clearLoginDiv();
  removeListeners();
  newSong.addListeners();
};
