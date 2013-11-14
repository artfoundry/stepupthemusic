// Note IDs:
// Each time slot has 15 notes (2 octaves), numbered 0-14 + (15 x time) 
// where time is numbered 0-15 (4 bars)
// Thus, notes are numbered 0-239, which corresponds to the indecies of the notes array

$(document).ready(function(){
  initSequencer();
});

function initSequencer() {
  MIDI.loadPlugin({
    soundfontUrl: "./soundfont/",
    instruments: ["acoustic_grand_piano", 
                  "acoustic_guitar_nylon", 
                  "brass_section", 
                  "distortion_guitar", 
                  "electric_bass_finger", 
                  "flute", 
                  "synth_drum", 
                  "tenor_sax", 
                  "trumpet"],
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
    var songIsNew = true;
    loadSong(newSongName, songIsNew);
  });
};

function updateUIafterLogin() {
  $("#login").html("");
  $("#publicListHeader").toggle(); // make headers visible
  $("#userListHeader").toggle();
  newUser.listAllSongs();
  newUser.listUserSongs();
  $("#menubar").html("<button id='createsong'>Create New Song</button>");
  $("#createsong").on("click", function(){
    event.preventDefault();
    createNewSong();
  });
};

function User() {
  this.userLogin = []; // array will contain serialized username and pw
  this.userSonglist = "";
};

User.prototype.getUserLogin = function(request) {
  if (request === "name") {
    return this.userLogin[0].value;
  }
  else {  // requesting pw
    return this.userLogin[1].value;
  };
};

User.prototype.updateUserSongList = function() {
  var userListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/users/' + this.userLogin[0].value + '/');
  userListFBRef.once('value', function(songSnapshot) {
    if (songSnapshot.hasChild('songs')) {
      this.userSonglist = songSnapshot.child('songs').val();
    };
  });
};

User.prototype.getUserSongList = function() {
  this.updateUserSongList();
  return this.userSonglist;
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
    var songUrl = songListFBRef.toString() + "/" + songName;
    $(listSelector).append("<a href=" + songUrl + ">" + songName + "</a><br>");
    $("a").on("click.songlinks", function(event) {
      event.preventDefault();
      var songIsNew = false;
      loadSong($(this).text(), songIsNew);
    });
  });
};

User.prototype.listUserSongs = function() {
  var userFBRef = new Firebase('https://stepupthemusic.firebaseio.com/users/' + this.userLogin[0].value);
  userFBRef.once('value', function(userSnapshot) {
    var userSonglist = userSnapshot.child('songs').val();
    if (userSonglist) {
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

function loadSong(songname, songIsNew) {
  var newSong = new Song(songname);
  if (songIsNew) {
    newSong.firebaseNewSong();
    newUser.listUserSongs();
  };
  initGrid(newSong);
  clearLoginDiv();
  newSong.initNotes();
  removeListeners();
  newSong.addListeners();
};

function removeListeners() {
  $("#controls").off("click");
  $("#sequence").off("click");
}

// Convert to some value between 0 and 14, then adjust to fit scale
function convertNoteIdToValue(noteId, song) {
  var value = noteId - (song.totalOctaveNotes * Math.floor(noteId / song.totalOctaveNotes));
  // factor in half steps in major scale
  if ((value >= 0) && (value < 3)) {
    value *= 2;
  }
  else if ((value >= 3) && (value < 7)) {
    value = (value * 2) - 1;
  }
  else if ((value >= 7) && (value < 10)) {
    value = (value * 2) - 2;
  }
  else if ((value >= 10) && (value < 14)) {
    value = (value * 2) - 3;
  }
  else {
    value = (value * 2) - 4;
  };
  return value;
};

function calcDelay(tempo) {
  var delay = 1000 / (tempo / 60);
  return delay;
};

function clearLoginDiv() {
  $("#login").html("");  
};

function initGrid(song) {
  $("#sequence").html("");
  $("#loadMessage").html("<h3>" + song.songname + "</h3>");
  $("#controls").load("views/sequencer.html");
  for (var row = song.totalOctaveNotes - 1; row >= 0; row--) {
    $("#sequence").append("<div id='row" + row + "'>");
    for (var col = 0; col < song.sequenceLength; col++) {
      var buttonId = row + (col * song.totalOctaveNotes);
      $("#sequence").append("<button class='note' id='" + buttonId + "'>" + buttonId + "</button>");
    };
    $("#sequence").append("</div>");
  };
};


function Song(songnameArg) {
  this.songname = songnameArg;
  // var url = "";
  var maxOctave = 2;
  this.totalOctaveNotes = (maxOctave * 8) - 1;
  this.sequenceLength = 16;
  this.allNotesInSeq = this.totalOctaveNotes * this.sequenceLength;
  this.currentInstrument = "0"; // ie. acoustic grand piano
  this.sequences = [] // array of sequence hashes, referenced by channel number, with instrument (as key) paired with an array of notes

  // each user/instrument is assigned 1 channel out of four
  this.channel = 0;
  this.tempo = 120;
  this.playOn = false;
  this.time = 0;
};

Song.prototype.firebaseNewSong = function () {
  var publicSongListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/');
  publicSongListFBRef.child(this.songname).set({url: publicSongListFBRef.child(this.songname).toString()});
  var userSongsFBRef = new Firebase('https://stepupthemusic.firebaseio.com/users/' + newUser.getUserLogin("name") + '/songs/');
  userSongsFBRef.child(this.songname).set({url: publicSongListFBRef.child(this.songname).toString()});
};

Song.prototype.firebaseSetSongData = function () {
  var publicSongListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/');
  var song = this;
  publicSongListFBRef.once('value', function(songSnapshot) {
    publicSongListFBRef.child(song.songname).child(song.channel).child(song.currentInstrument).set(song.sequences[song.channel][song.currentInstrument].join());
  });
};

function getFBSongData(songSnapshot) {
  var channelValueFB = songSnapshot.child('channel').val();
  var instrumentValueFB = songSnapshot.child('channel').child('instrument').val();
  var sequenceFB = songSnapshot.child('channel').child('instrument').child('sequence').val();
  this.sequences[channelValueFB][instrumentValueFB] = sequenceFB.split(',');
  for(var i = 0; i < allNotesInSeq; i++) {
    this.sequences[channelValueFB][instrumentValueFB][i] = parseInt(this.sequences[channelValueFB][instrumentValueFB][i]); //FB sends back string, so we parse into int
  };
};

Song.prototype.firebaseGetSongData = function () {
  var publicSongListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/');
  publicSongListFBRef.once('child_added', function(songSnapshot) {
    if (songSnapshot.hasChild('channel')) {
      getFBSongData(songSnapshot);
    };
  });
  publicSongListFBRef.once('child_changed', function(songSnapshot) {
    if (songSnapshot.hasChild('channel')) {
      getFBSongData(songSnapshot);
    };
  });
};

Song.prototype.initNotes = function () {
  this.sequences[this.channel] = {};
  this.sequences[this.channel][this.currentInstrument] = []
  for(var i = 0; i < this.allNotesInSeq; i++){
    this.sequences[this.channel][this.currentInstrument][i] = -1; // value of -1 means note is off
  }
  this.firebaseSetSongData();
  this.firebaseGetSongData();
};

Song.prototype.addListeners = function () {
  song = this;
  $("#controls").click(function(event) {
    if (event.target.id === "play"){
      if (song.playOn === false) {
        $("#play").addClass('selected');
        song.playOn = true;
        playSeq = setInterval(function() {
          song.firebaseGetSongData();
          song.playNotes(song.time);
          song.time === song.allNotesInSeq ? song.time = 0 : song.time += song.totalOctaveNotes; //loop the sequence
        }, calcDelay(song.tempo)); // sets the tempo for the song as part of setInterval
      }
      else {
        $("#play").removeClass('selected');
        song.playOn = false;
        clearInterval(playSeq);
      };
    }
    else if ($(event.target).hasClass("channel")) {
      $("#ch" + song.channel).removeClass('selected');
      song.channel = event.target.id.slice(2); // remove the 'ch' in the id selector
      $("#ch" + song.channel).addClass('selected')
      song.initNotes();
    }
    else if ($(event.target).hasClass("instrument")) {
      var tempArr = song.sequences[song.channel][song.currentInstrument];
      $("#i" + song.currentInstrument).removeClass('selected');
      song.currentInstrument = event.target.id.slice(1); // remove the 'i' in the id selector
      song.sequences[song.channel] = {};
      song.sequences[song.channel][song.currentInstrument] = tempArr;
      $("#i" + song.currentInstrument).addClass('selected');
    };
  });
  $("#sequence").click(function(event) {
    if ($(event.target).hasClass("note")) {
      noteId = parseInt(event.target.id);
      song.toggleNote(noteId, event);
      // return false;
    }
  });
};

// currently using notes D3-D5
Song.prototype.toggleNote = function (noteId, event) {
  if (this.sequences[this.channel][this.currentInstrument][noteId] === -1) {
    this.sequences[this.channel][this.currentInstrument][noteId] = convertNoteIdToValue(noteId, this) + 50; // adding 50 converts an ID of 0 to D3
    $("#" + noteId).addClass('selected');
  }
  else {
    this.sequences[this.channel][this.currentInstrument][noteId] = -1;
    $("#" + noteId).removeClass('selected');
  };
  this.firebaseSetSongData();
};

Song.prototype.playNotes = function (time) {
  var delay = 0; // play one note every quarter second
  var velocity = 127; // how hard the note hits
  var note = 0;
  MIDI.setVolume(0, 127);
  MIDI.programChange(this.channel, this.currentInstrument); //channel, program
  for (var i = 0; i < this.totalOctaveNotes; i++) { // set up new channel for each note played at one time
    if (this.sequences[this.channel][this.currentInstrument][i + this.time] > -1) { // play if the note is selected/on
      note = this.sequences[this.channel][this.currentInstrument][i + this.time]; // the MIDI note
      var noteId = this.time + i
      $('#' + noteId).removeClass('lightOff');
      $('#' + noteId).addClass('lightOn');
      setTimeout(function(){
        $('#' + noteId).removeClass('lightOn');
        $('#' + noteId).addClass('lightOff');}, 500);
      // play the note
      MIDI.noteOn(this.channel, note, velocity, delay);
    }
  };
};
