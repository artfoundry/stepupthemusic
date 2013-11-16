// Note IDs:
// Each time slot has 15 notes (2 octaves), numbered 0-14 + (15 x time) 
// where time is numbered 0-15 (4 bars)
// Thus, notes are numbered 0-239, which corresponds to the indecies of the notes array

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

function initGrid(songInfo) {
  $("#sequence").html("");
  $("#loadMessage").html("<h3>" + songInfo.songname + "</h3>");
  $("#controls").toggle(true);
  $("#i" + songInfo.currentInstrument).addClass('selected');
  for (var row = songInfo.totalOctaveNotes - 1; row >= 0; row--) {
    $("#sequence").append("<div id='row" + row + "'>");
    for (var col = 0; col < songInfo.sequenceLength; col++) {
      var buttonId = row + (col * songInfo.totalOctaveNotes);
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

Song.prototype.firebaseSetChannelStatus = function (setting, channelToSet) {
  var publicSongListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/');
  if (setting === "init") {
    for (var i = 0; i < 4; i++) {
      publicSongListFBRef.child(this.songname).child(i).set({free: true});  
    };
  }
  else { // if setting is true/false (if false, it will be the username)
    publicSongListFBRef.child(this.songname).child(channelToSet).set({free: setting});  
  }
};

Song.prototype.firebaseSetSongData = function (setting) {
  var publicSongListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/');
  if (setting === "init") {
    for (var i = 0; i < 4; i++) {
      publicSongListFBRef.child(this.songname).child(i).child(this.currentInstrument).set(this.sequences[i][this.currentInstrument].join());
    };
  }
  else { // just a single update for when a user makes a note change
    publicSongListFBRef.child(this.songname).child(this.channel).child(this.currentInstrument).set(this.sequences[i][this.currentInstrument].join());
  }
};

Song.prototype.getFBSongData = function(songSnapshot) {
  var channelValueFB = songSnapshot.child('channel').val();
  var instrumentValueFB = songSnapshot.child('channel').child('instrument').val();
  var sequenceFB = songSnapshot.child('channel').child('instrument').child('sequence').val();
  this.sequences[channelValueFB][instrumentValueFB] = sequenceFB.split(',');
  for (var i = 0; i < allNotesInSeq; i++) {
    this.sequences[channelValueFB][instrumentValueFB][i] = parseInt(this.sequences[channelValueFB][instrumentValueFB][i]); //FB sends back string, so we parse into int
  };
};

Song.prototype.firebaseGetSongData = function () {
  var publicSongListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/');
  var song = this;
  publicSongListFBRef.once('child_added', function(songSnapshot) {
    if (songSnapshot.hasChild('channel')) {
      song.getFBSongData(songSnapshot);
    };
  });
  publicSongListFBRef.once('child_changed', function(songSnapshot) {
    if (songSnapshot.hasChild('channel')) {
      song.getFBSongData(songSnapshot);
    };
  });
};

Song.prototype.initNotes = function () {
  for (var channel = 0; channel < 4; channel++) {
    this.sequences[channel] = {};
    this.sequences[channel][this.currentInstrument] = []
    for (var i = 0; i < this.allNotesInSeq; i++){
      this.sequences[channel][this.currentInstrument][i] = -1; // value of -1 means note is off
    };
  };
  this.firebaseSetSongData("init");
  this.firebaseGetSongData();
};

Song.prototype.addListeners = function () {
  var songInfo = this;
  $("#controls").click(function(event) {
    if (event.target.id === "play"){
      if (songInfo.playOn === false) {
        $("#play").addClass('selected');
        songInfo.playOn = true;
        playSeq = setInterval(function() {
          songInfo.firebaseGetSongData();
          songInfo.playNotes(songInfo.time);
          songInfo.time === songInfo.allNotesInSeq ? songInfo.time = 0 : songInfo.time += songInfo.totalOctaveNotes; //loop the sequence
        }, calcDelay(songInfo.tempo)); // sets the tempo for the song as part of setInterval
      }
      else {
        $("#play").removeClass('selected');
        songInfo.playOn = false;
        clearInterval(playSeq);
      };
    }
    else if ($(event.target).hasClass("channel")) {
      $("#ch" + songInfo.channel).removeClass('selected');
      songInfo.changeChannel(event.target.id.slice(2)); // remove the 'ch' in the id selector
      $("#ch" + songInfo.channel).addClass('selected');
      songInfo.initNotes();
    }
    else if ($(event.target).hasClass("instrument")) {
      var tempArr = songInfo.sequences[songInfo.channel][songInfo.currentInstrument];
      $("#i" + songInfo.currentInstrument).removeClass('selected');
      songInfo.currentInstrument = event.target.id.slice(1); // remove the 'i' in the id selector
      songInfo.sequences[songInfo.channel] = {};
      songInfo.sequences[songInfo.channel][songInfo.currentInstrument] = tempArr;
      $("#i" + songInfo.currentInstrument).addClass('selected');
    };
  });
  $("#sequence").click(function(event) {
    if ($(event.target).hasClass("note")) {
      noteId = parseInt(event.target.id);
      songInfo.toggleNote(noteId, event);
    }
  });
};

Song.prototype.changeChannel = function(chosenChannel) {
  var songFBRef = new Firebase("https://stepupthemusic.firebaseio.com/songs/" + this.songname);
  var songInfo = this;
  songFBRef.once('value', function(songSnapshot) {
    var songInfoOnFB = songSnapshot.val();
    if (chosenChannel === songInfo.channel) {
      alert("You are already using this track.");
    }
    else {
      var channelStatus = songInfoOnFB[chosenChannel].free
      if (channelStatus !== true) { // if channel is taken, see if user is still connected
        if (!isConnected(channelStatus)) {
          songInfo.firebaseSetChannelStatus(true, chosenChannel);
          channelStatus = songInfoOnFB[chosenChannel].free
        };
      }
      if (channelStatus === true) {
        songInfo.firebaseSetChannelStatus(true, songInfo.channel);  // free up channel being left    
        songInfo.channel = chosenChannel;
        songInfo.firebaseSetChannelStatus(newUser.getUserLogin("name"), songInfo.channel); // new channel is now taken
      }
      else {
        alert("Sorry, but that track is already in use. Try again later.");
      };
    }
  });
};

Song.prototype.loadChannel = function() {
  var songFBRef = new Firebase("https://stepupthemusic.firebaseio.com/songs/" + this.songname);
  var songInfo = this;
  songFBRef.once('value', function(songSnapshot) {
    var songInfoOnFB = songSnapshot.val();
    for (var i = 0; i < 4; i++) {
      if (songInfoOnFB[i].free === true) {
        songInfo.channel = i;
        songInfo.firebaseSetChannelStatus(newUser.getUserLogin("name"), songInfo.channel); //  channel is now taken
        $("#ch" + songInfo.channel).addClass('selected');
        i = 4;
      };
    };
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
  this.firebaseSetSongData("update");
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
