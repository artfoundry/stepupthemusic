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
      publicSongListFBRef.child(this.songname).child(i).update({free: true});  
    };
  }
  else { // if setting is true/false (if false, it will be the username)
    publicSongListFBRef.child(this.songname).child(channelToSet).update({free: setting});  
  };
};

Song.prototype.firebaseInitSongData = function () {
  var publicSongListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/');
  for (var i = 0; i < 4; i++) {
    publicSongListFBRef.child(this.songname).child(i).child(this.currentInstrument).set(this.sequences[i][this.currentInstrument].join());
  };
};

Song.prototype.firebaseUpdateSongData = function (lastInstrument) {
  var publicSongListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/');
  if (lastInstrument !== undefined) {
    publicSongListFBRef.child(this.songname).child(this.channel).child(lastInstrument).remove();
  };
  publicSongListFBRef.child(this.songname).child(this.channel).child(this.currentInstrument).set(this.sequences[this.channel][this.currentInstrument].join());
};

Song.prototype.getFBSongDataWorker = function(songSnapshot) {
  for (var i = 0; i < 4; i++) {
    var instrumentValueFB = Object.keys(songSnapshot.child(i).val())[0];
    var channelDataFB = songSnapshot.child(i).val();
    this.sequences[i] = {};
    this.sequences[i][instrumentValueFB] = channelDataFB[instrumentValueFB].split(',');
    for (var n = 0; n < this.allNotesInSeq; n++) {
      this.sequences[i][instrumentValueFB][n] = parseInt(this.sequences[i][instrumentValueFB][n]); //FB sends back string, so we parse into int
    };
  };
};

Song.prototype.firebaseGetSongData = function () {
  var publicSongListFBRef = new Firebase('https://stepupthemusic.firebaseio.com/songs/');
  var song = this;
  publicSongListFBRef.once('value', function(songSnapshot) {
    if (songSnapshot.hasChild(song.songname)) {
      song.getFBSongDataWorker(songSnapshot.child(song.songname));
    };
  });
  // publicSongListFBRef.once('child_added', function(songSnapshot) {
  //   if (songSnapshot.hasChildren()) {
  //     song.getFBSongDataWorker(songSnapshot);
  //   };
  // });
  // publicSongListFBRef.once('child_changed', function(songSnapshot) {
  //   if (songSnapshot.hasChildren()) {
  //     song.getFBSongDataWorker(songSnapshot);
  //   };
  // });
};

Song.prototype.initNotes = function () {
  for (var channel = 0; channel < 4; channel++) {
    this.sequences[channel] = {};
    this.sequences[channel][this.currentInstrument] = [];
    for (var i = 0; i < this.allNotesInSeq; i++){
      this.sequences[channel][this.currentInstrument][i] = -1; // value of -1 means note is off
    };
  };
};

Song.prototype.updateGrid = function(lastChannel) {
  if (lastChannel !== undefined) {
    var instrument = Object.keys(this.sequences[lastChannel]);
    $("#i" + instrument).removeClass('selected');
  };
  $("#i" + this.currentInstrument).addClass('selected');
  for (var i = 0; i < this.allNotesInSeq; i++) {
    if (this.sequences[this.channel][this.currentInstrument][i] > -1) {
      $("#" + i).addClass('selected');
    }
    else {
      $("#" + i).removeClass('selected');
    };
  };
};

Song.prototype.addListeners = function() {
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
      var lastChannel = songInfo.channel;
      $("#ch" + songInfo.channel).removeClass('selected');
      songInfo.changeChannel(event.target.id.slice(2)); // remove the 'ch' in the id selector
      $("#ch" + songInfo.channel).addClass('selected');
      songInfo.updateInstrument();
      songInfo.updateGrid(lastChannel);
    }
    else if ($(event.target).hasClass("instrument")) {
      var tempArr = songInfo.sequences[songInfo.channel][songInfo.currentInstrument];
      var lastInstrument = songInfo.currentInstrument;
      $("#i" + songInfo.currentInstrument).removeClass('selected');
      songInfo.currentInstrument = event.target.id.slice(1); // remove the 'i' in the id selector
      songInfo.sequences[songInfo.channel] = {};
      songInfo.sequences[songInfo.channel][songInfo.currentInstrument] = tempArr;
      $("#i" + songInfo.currentInstrument).addClass('selected');
      songInfo.firebaseUpdateSongData(lastInstrument);
      songInfo.firebaseGetSongData();
    };
  });
  $("#sequence").click(function(event) {
    if ($(event.target).hasClass("note")) {
      noteId = parseInt(event.target.id);
      songInfo.toggleNote(noteId, event);
    }
  });
};

Song.prototype.updateInstrument = function() {
  var instrument = Object.keys(this.sequences[this.channel])[0];
  this.currentInstrument = instrument;
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
Song.prototype.toggleNote = function(noteId, event) {
  var instrument = Object.keys(this.sequences[this.channel])
  if (this.sequences[this.channel][instrument][noteId] === -1) {
    this.sequences[this.channel][instrument][noteId] = convertNoteIdToValue(noteId, this) + 50; // adding 50 converts an ID of 0 to D3
    $("#" + noteId).addClass('selected');
  }
  else {
    this.sequences[this.channel][instrument][noteId] = -1;
    $("#" + noteId).removeClass('selected');
  };
  this.firebaseUpdateSongData();
};

Song.prototype.highlightNote = function(pitch) {
  var noteId = this.time + pitch
  $('#' + noteId).removeClass('lightOff');
  $('#' + noteId).addClass('lightOn');
  setTimeout(function(){
    $('#' + noteId).removeClass('lightOn');
    $('#' + noteId).addClass('lightOff');
  }, 500);
};

Song.prototype.playNotes = function(time) {
  var delay = 0; // play one note every quarter second
  var velocity = 127; // how hard the note hits
  var note = 0;
  var instrument = "0";
  MIDI.setVolume(0, 127);
  for (var i = 0; i < 4; i++) {
    instrument = Object.keys(this.sequences[i]);
    MIDI.programChange(i, instrument); //channel, program
  };
  for (var i = 0; i < this.totalOctaveNotes; i++) { 
    for (var c = 0; c < 4; c++) {
      instrument = Object.keys(this.sequences[c]);
      if (this.sequences[c][instrument][i + this.time] > -1) { // play if the note is selected/on
        note = this.sequences[c][instrument][i + this.time];
        MIDI.noteOn(c, note, velocity, delay);  // play the note
        if (c === this.channel) {
          this.highlightNote(i);
        };
      };
    };
  };
};
