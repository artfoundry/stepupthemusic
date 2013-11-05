// Note IDs:
// Each time slot has 16 notes (2 octaves), numbered 0-15 + (16 x time) 
// where time is numbered 0-15 (4 bars)
// Thus, notes are numbered 0-255, which corresponds to the indecies of the notes array

$(document).ready(function(){
  initSequencer();
});

function initSequencer() {
  MIDI.loadPlugin({
    soundfontUrl: "./assets/soundfont/",
    instrument: "acoustic_grand_piano",
    callback: function() {
      newSeq = new Sequence();
      newSeq.initGrid();
      newSeq.initNotes();
      newSeq.addListener();
    }
  });
};

function convertNoteIdToInt(event) {
  var id = parseInt(event.target.id);
  return id;
};

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

function calcDelay(tempo){
  var delay = 1000 / (tempo / 60);
  return delay;
}

function Sequence () {
  maxOctave = 2;
  totalOctaveNotes = maxOctave * 8 - 1;
  sequenceLength = 16;
  allNotesInSeq = totalOctaveNotes * sequenceLength;
  tempo = 120;
  playOn = false;
  notes = [];
  time = 0;
};

Sequence.prototype.initGrid = function () {
  for (var row = totalOctaveNotes - 1; row >= 0; row--) {
    $("#sequence").append("<div id='row" + row + "'>");
    for (var col = 0; col < sequenceLength; col++) {
      $("#sequence").append("<button class='button' id='" + (row + (col * totalOctaveNotes)) + "'>" + (row + (col * totalOctaveNotes)) + "</button>");
    };
    $("#sequence").append("</div>");
  };
};

Sequence.prototype.initNotes = function () {
  for(var i = 0; i < allNotesInSeq; i++){
    notes[i] = null;
  }
};

Sequence.prototype.addListener = function () {
  $("#sequence").click(function(event) {
    if (event.target.id === "play"){
      if (playOn === false) {
        playOn = true;
        playSeq = setInterval(function() {
          newSeq.playNotes(time);
          time === allNotesInSeq ? time = 0 : time += totalOctaveNotes;
        }, calcDelay(tempo));
      }
      else {
        playOn = false;
        clearInterval(playSeq);
      };
    }
    else if ($(event.target).hasClass("button")) {
      noteId = convertNoteIdToInt(event);
      newSeq.toggleNote(noteId, event);
    };
  });
};

Sequence.prototype.toggleNote = function (noteId, event) {
  if (notes[noteId] === null) {
    notes[noteId] = convertNoteIdToValue(noteId) + 50; // adding 50 converts an ID of 0 to around A3
    $('#' + event.target.id).html('On');
  }
  else {
    notes[noteId] = null;
    $('#' + event.target.id).html(event.target.id);
  };
};

Sequence.prototype.playNotes = function (time) {
  var delay = 0; // play one note every quarter second
  var velocity = 127; // how hard the note hits
  var note = 0;
  MIDI.setVolume(0, 127);
  for (var i = 0; i < totalOctaveNotes; i++) {
    if (notes[i + time]) {
      note = notes[i + time]; // the MIDI note
      MIDI.programChange(i, 0); 
      $('#' + time).addClass('light');
      setTimeout(function(){
        $('#' + time).removeClass('light');}, 500);
      // play the note
      MIDI.noteOn(0, note, velocity, delay);
      // MIDI.noteOff(0, note, delay + 0.75);     
    }
  };
};
