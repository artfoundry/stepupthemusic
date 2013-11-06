// Note IDs:
// Each time slot has 15 notes (2 octaves), numbered 0-14 + (15 x time) 
// where time is numbered 0-15 (4 bars)
// Thus, notes are numbered 0-239, which corresponds to the indecies of the notes array

$(document).ready(function(){
  initSequencer();
});

function initSequencer() {
  MIDI.loadPlugin({
    soundfontUrl: "./assets/soundfont/",
    instruments: ["acoustic_grand_piano", 
                  "acoustic_guitar_nylon", 
                  "acoustic_guitar_steel", 
                  "alto_sax", 
                  "baritone_sax", 
                  "brass_section", 
                  "distortion_guitar", 
                  "electric_bass_finger", 
                  "electric_bass_pick", 
                  "electric_guitar_jazz", 
                  "flute", 
                  "soprano_sax", 
                  "synth_drum", 
                  "tenor_sax", 
                  "trumpet"],
    callback: function() {
      newSong = new Song();
      initGrid(newSong);
      newSong.initNotes();
      newSong.addListener();
      newSong.firebaseNew();
    }
  });
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

function initGrid(sequence) {
  for (var row = totalOctaveNotes - 1; row >= 0; row--) {
    $("#sequence").append("<div id='row" + row + "'>");
    for (var col = 0; col < sequenceLength; col++) {
      $("#sequence").append("<button class='note' id='" + (row + (col * totalOctaveNotes)) + "'>" + (row + (col * totalOctaveNotes)) + "</button>");
    };
    $("#sequence").append("</div>");
  };
  $("#loading").text("");
};


function Song () {
  maxOctave = 2;
  totalOctaveNotes = (maxOctave * 8) - 1;
  sequenceLength = 16;
  allNotesInSeq = totalOctaveNotes * sequenceLength;
  currentInstrument = 0; // ie. acoustic grand piano
  sequences = { // each sequence array corresponds to a channel
    0: [],
    1: [],
    2: [],
    3: []
  }

  // each user/instrument is assigned 1 channel out of four
  // this should be assigned by talking to Firebase
  channel = 0;

  tempo = 120;
  playOn = false;
  time = 0;
  stepFBRootRef = null;
};

Song.prototype.firebaseNew = function () {
  stepFBRootRef = new Firebase('https://stepupthemusic.firebaseio.com/');
};

Song.prototype.firebaseSet = function () {
  stepFBRootRef.set({channel: channel, notes: sequences[channel].join()});
  newSong.firebaseGet();
};

Song.prototype.firebaseGet = function () {
  stepFBRootRef.on('value', function(snapshot) {
    sequence = snapshot.val();
    sequences[sequence.channel] = sequence.notes.split(',');
    for(var i = 0; i < allNotesInSeq; i++) {
      sequences[sequence.channel][i] = parseInt(sequences[sequence.channel][i]);
    };
  });
};

Song.prototype.initNotes = function () {
  for(var i = 0; i < allNotesInSeq; i++){
    sequences[channel][i] = -1; // value of -1 means note is off
  }
};

Song.prototype.addListener = function () {
  $("#sequence").click(function(event) {
    if (event.target.id === "play"){
      if (playOn === false) {
        $("#play").addClass('selected');
        playOn = true;
        playSeq = setInterval(function() {
          newSong.playNotes(time);
          time === allNotesInSeq ? time = 0 : time += totalOctaveNotes;
        }, calcDelay(tempo));
      }
      else {
        $("#play").removeClass('selected');
        playOn = false;
        clearInterval(playSeq);
      };
    }
    else if ($(event.target).hasClass("note")) {
      noteId = convertNoteIdToInt(event);
      newSong.toggleNote(noteId, event);
    }
    else if ($(event.target).hasClass("instrument")) {
      $("#i" + currentInstrument).removeClass('selected');
      currentInstrument = event.target.id.slice(1);
      $("#i" + currentInstrument).addClass('selected');
    };
    else if ($(event.target).hasClass("channel")) {
      $("#ch" + channel).removeClass('selected');
      channel = event.target.id.slice(2);
      $("#ch" + channel).addClass('selected');
    };
  });
};

// currently using notes D3-D5
Song.prototype.toggleNote = function (noteId, event) {
  if (sequences[channel][noteId] === -1) {
    sequences[channel][noteId] = convertNoteIdToValue(noteId) + 50; // adding 50 converts an ID of 0 to D3
    $("#" + noteId).addClass('selected');
  }
  else {
    sequences[channel][noteId] = -1;
    $("#" + noteId).removeClass('selected');
  };
  newSong.firebaseSet();
};

Song.prototype.playNotes = function (time) {
  var delay = 0; // play one note every quarter second
  var velocity = 127; // how hard the note hits
  var note = 0;
  MIDI.setVolume(0, 127);
  MIDI.programChange(channel, currentInstrument); //channel, program
  for (var i = 0; i < totalOctaveNotes; i++) { // set up new channel for each note played at one time
    if (sequences[channel][i + time] > -1) {
      note = sequences[channel][i + time]; // the MIDI note
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
