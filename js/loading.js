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
      ColorSphereBackground();
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
    var publicSong = true;
    $("#newPublic").on("click", function(event) {
      if (publicSong === true) {
        $("#newPublic").removeClass("warning");
        $("#newPublic").addClass("default");
        publicSong = false;
      }
      else {
        $("#newPublic").removeClass("default");
        $("#newPublic").addClass("warning");
        publicSong = true;
      };
    });
    $("#submitsongform").on("click", function(event){
      event.preventDefault();
      var newSongName = $("#songname").serializeArray();
      newSongName = checkName(newSongName[0].value, songList);
      if (newSongName !== "") {
        var songIsNew = true;
        loadSong(newSongName, songIsNew, publicSong);
      }
    });
  });
};

function toggleCreateForm() {
  if ($("#songformdiv").hasClass("songform_hidden")) {
    $("#createsong").attr("src", "images/button_create_on.png");
    $("#songformdiv").removeClass("songform_hidden");
    $("#songformdiv").addClass("songform_slide");
    $("#newPublic").removeClass("default");
    $("#newPublic").addClass("warning");
    $("#songname").val("");
  }
  else {
    $("#createsong").attr("src", "images/button_create.png");
    $("#songformdiv").removeClass("songform_slide"); 
    $("#songformdiv").addClass("songform_hidden");
    $("#submitsongform").off("click");
  };

};

function updateUIafterLogin() {
  $("#login").toggle();
  $("#navbar").toggle(); // make navbar visible
  newUser.listUserSongs();
  newUser.listAllSongs();
  $("#createsong").on("click", function(){
    toggleCreateForm();
    createNewSong();
  });
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
  var channelIsFree = false;
  songFBRef.once('value', function(songSnapshot) {
    var channels = songSnapshot.val();
    var i = 0;
    while (i < 4) {
      if (channels[i].free === true) {
        channelIsFree = true;
        i = 4;
      };
      i++;
    };
  });
  return channelIsFree;
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

function loadSong(songname, songIsNew, publicSong) {
  newUser.freeUpChannel(songname);
  newSong = new Song();
  newSong.songname = songname;
  newSong.public = publicSong;
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
