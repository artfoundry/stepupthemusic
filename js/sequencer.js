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
      publicSongListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/');
    }
  });
};

function updateUIafterLogin() {
  $("#login").html("");
  $("#menubar").append("<button id='createsong'>Create New Song</button>");
  $("#createsong").on("click", function(){
    event.preventDefault();
    var songname = window.prompt("Please enter a song name:")
    loadSong(songname);
  });
  newUser.listAllSongs();
};

function User() {
  userLogin = []; // array will contain serialized username and pw
  userFBRef = new Firebase('https://stepupthemusic.firebaseio.com/users');
  userSonglist = [];
};

User.prototype.verifyLogin = function() {
  $("#create").click(function(){
    $("#login").load("views/create_user.html");
    newUser.createUser();
  });
  $("form").on("submit", function(event) {
    event.preventDefault();
    userLogin = $(this).serializeArray();
    userFBRef.once('value', function(snapshot) {
      var username = snapshot.child(userLogin[0].value).name();
      var password = snapshot.child(userLogin[0].value).child('pw').val();
      if ((userLogin[0].value === username) && (userLogin[1].value === password)) {
        updateUIafterLogin();
      }
      else {
        alert("Your login info is incorrect");
      };
    });
  });
};

User.prototype.createUser = function() {
  $("#login").on("submit", "#createuser", function(event){
    event.preventDefault();
    userLogin = $(this).serializeArray()
    if ((userLogin[0]) && (userLogin[1])) {
      userFBRef.child(userLogin[0].value).set({pw: userLogin[1].value});
      updateUIafterLogin();
    }
    else {
      alert("Invalid info. Try again.");
    };
  }); 
};

User.prototype.listUserSongs = function() {
  userSongListFBRef.on('value', function(songSnapshot) {
    var songlist = songSnapshot.val().split(',');
    var songUrl = "";
    if (songlist) {
      for(var i = 0; i <= songlist.length; i++) {
        songUrl = publicSongListFBRef.toString() + songList[i];
        $("#userSonglist").append("<a href=" + songUrl + ">" + songlist[i] + "</a>");
        $("#userSonglist").click(function(event) {
          event.preventDefault();
          loadSong(event.val());
        });
      };
    }
    else {
      $("#publicSonglist").append("You have not created any songs yet.");
    };
  });
};

User.prototype.listAllSongs = function() {
  publicSongListFBRef.on('value', function(snapshot) {
    var songlist = snapshot.val();
    var songUrl = "";
    if (songlist) {
      for(var i = 0; i <= songlist.length; i++) {
        songUrl = publicSongListFBRef.toString() + songlist[i].name();
        $("#publicSonglist").append("<a href=" + songUrl + ">" + songlist[i].name() + "</a>");
        $("#publicSonglist").click(function(event) {
          event.preventDefault();
          loadSong(event.val());
        });
      };
    }
    else {
      $("#publicSonglist").append("No songs have been created yet.");
    };
  });
};

function loadSong(songname) {
  newSong = new Song(songname);
  newSong.firebaseNewSong();
  initGrid(newSong);
  clearLoginDiv();
  newSong.initNotes();
  newSong.addListeners();
};

function convertNoteIdToInt(event) {
  var id = parseInt(event.target.id);
  return id;
};

// Convert to some value between 0 and 14, then adjust to fit scale
function convertNoteIdToValue(noteId) {
  var value = noteId - (totalOctaveNotes * Math.floor(noteId / totalOctaveNotes));
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

function initGrid(sequence) {
  $("#loadMessage").html("<h3>" + songname + "</h3>")
  $("#controls").load("views/sequencer.html");
  for (var row = totalOctaveNotes - 1; row >= 0; row--) {
    $("#sequence").append("<div id='row" + row + "'>");
    for (var col = 0; col < sequenceLength; col++) {
      var buttonId = row + (col * totalOctaveNotes);
      $("#sequence").append("<button class='note' id='" + buttonId + "'>" + buttonId + "</button>");
    };
    $("#sequence").append("</div>");
  };
};


function Song(songnameArg) {
  songname = songnameArg;
  url = "";
  maxOctave = 2;
  totalOctaveNotes = (maxOctave * 8) - 1;
  sequenceLength = 16;
  allNotesInSeq = totalOctaveNotes * sequenceLength;
  currentInstrument = "0"; // ie. acoustic grand piano
  sequences = [] // array of sequence hashes, referenced by channel number, with instrument (as key) paired with an array of notes

  // each user/instrument is assigned 1 channel out of four
  channel = 0;

  tempo = 120;
  playOn = false;
  time = 0;
};

Song.prototype.firebaseNewSong = function () {
  publicSongListFBRef.child(songname).set({url: publicSongListFBRef.child(songname).toString()});
  userSongListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/users/' + userLogin[0].value);
  userSonglist.push(songname);
  var songlistStr = userSonglist.join();
  userSongListFBRef.update({song: songlistStr});
};

Song.prototype.firebaseSetSongData = function () {
  publicSongListFBRef.once('value', function(songSnapshot) {
    publicSongListFBRef.child(songname).child(channel).child(currentInstrument).set(sequences[channel][currentInstrument].join());
  });
};

function getFBdata(songSnapshot) {
  var channelValueFB = songSnapshot.child('channel').val();
  var instrumentValueFB = songSnapshot.child('channel').child('instrument').val();
  var sequenceFB = songSnapshot.child('channel').child('instrument').child('sequence').val();
  sequences[channelValueFB][instrumentValueFB] = sequenceFB.split(',');
  for(var i = 0; i < allNotesInSeq; i++) {
    sequences[channelValueFB][instrumentValueFB][i] = parseInt(sequences[channelValueFB][instrumentValueFB][i]); //FB sends back string, so we parse into int
  };
};

Song.prototype.firebaseGetSongData = function () {
  publicSongListFBRef.once('child_added', function(songSnapshot) {
    if (songSnapshot.hasChild('channel')) {
      getFBdata(songSnapshot);
    };
  });
  publicSongListFBRef.once('child_changed', function(songSnapshot) {
    if (songSnapshot.hasChild('channel')) {
      getFBdata(songSnapshot);
    };
  });
};

Song.prototype.initNotes = function () {
  sequences[channel] = {};
  sequences[channel][currentInstrument] = []
  for(var i = 0; i < allNotesInSeq; i++){
    sequences[channel][currentInstrument][i] = -1; // value of -1 means note is off
  }
  newSong.firebaseSetSongData();
  newSong.firebaseGetSongData();
};

Song.prototype.addListeners = function () {
  $("#controls").click(function(event) {
    if (event.target.id === "play"){
      if (playOn === false) {
        $("#play").addClass('selected');
        playOn = true;
        playSeq = setInterval(function() {
          newSong.firebaseGetSongData();
          newSong.playNotes(time);
          time === allNotesInSeq ? time = 0 : time += totalOctaveNotes; //loop the sequence
        }, calcDelay(tempo)); // sets the tempo for the song as part of setInterval
      }
      else {
        $("#play").removeClass('selected');
        playOn = false;
        clearInterval(playSeq);
      };
    }
    else if ($(event.target).hasClass("channel")) {
      $("#ch" + channel).removeClass('selected');
      channel = event.target.id.slice(2); // remove the 'ch' in the id selector
      $("#ch" + channel).addClass('selected')
      newSong.initNotes();
    }
    else if ($(event.target).hasClass("instrument")) {
      var tempArr = sequences[channel][currentInstrument];
      $("#i" + currentInstrument).removeClass('selected');
      currentInstrument = event.target.id.slice(1); // remove the 'i' in the id selector
      sequences[channel] = {};
      sequences[channel][currentInstrument] = tempArr;
      $("#i" + currentInstrument).addClass('selected');
    };
  });
  $("#sequence").click(function(event) {
    if ($(event.target).hasClass("note")) {
      noteId = convertNoteIdToInt(event);
      newSong.toggleNote(noteId, event);
    }
  });
};

// currently using notes D3-D5
Song.prototype.toggleNote = function (noteId, event) {
  if (sequences[channel][currentInstrument][noteId] === -1) {
    sequences[channel][currentInstrument][noteId] = convertNoteIdToValue(noteId) + 50; // adding 50 converts an ID of 0 to D3
    $("#" + noteId).addClass('selected');
  }
  else {
    sequences[channel][currentInstrument][noteId] = -1;
    $("#" + noteId).removeClass('selected');
  };
  newSong.firebaseSetSongData();
};

Song.prototype.playNotes = function (time) {
  var delay = 0; // play one note every quarter second
  var velocity = 127; // how hard the note hits
  var note = 0;
  MIDI.setVolume(0, 127);
  MIDI.programChange(channel, currentInstrument); //channel, program
  for (var i = 0; i < totalOctaveNotes; i++) { // set up new channel for each note played at one time
    if (sequences[channel][currentInstrument][i + time] > -1) { // play if the note is selected/on
      note = sequences[channel][currentInstrument][i + time]; // the MIDI note
      var noteId = time + i
      $('#' + noteId).removeClass('lightOff');
      $('#' + noteId).addClass('lightOn');
      setTimeout(function(){
        $('#' + noteId).removeClass('lightOn');
        $('#' + noteId).addClass('lightOff');}, 500);
      // play the note
      MIDI.noteOn(channel, note, velocity, delay);
    }
  };
};
