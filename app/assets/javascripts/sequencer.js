// Note IDs:
// Each time slot has 16 notes (2 octaves), numbered 0-15 + (16 x time) 
// where time is numbered 0-15 (4 bars)
// Thus, notes are numbered 0-255, which corresponds to the indecies of the notes array

// pseudocode:
// Listeners: play button starts/stops sequence, note buttons turn note playback on/off
//   When play is on, loop sequence
//    At each step in the sequence, play any notes that are on


$(document).ready(function(){
  initSequencer();
});

function initSequencer() {
  MIDI.loadPlugin({
    soundfontUrl: "./soundfont/",
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
  var value = noteId - (16 * Math.floor(noteId / 16));
  return value;
};

function calcDelay(tempo){
  var delay = 1000 / (tempo / 60);
  return delay;
}

function Sequence () {
  maxOctave = 2;
  totalOctaveNotes = maxOctave * 8;
  sequenceLength = 16;
  allNotesInSeq = maxOctave * sequenceLength * 8;
  tempo = 120;
  playOn = false;
  notes = [];
  time = 0;
};

Sequence.prototype.initGrid = function () {
  for (var row = totalOctaveNotes - 1; row >= 0; row--) {
    $("#sequence").append("<div id='row" + row + "'>");
    for (var col = 0; col < sequenceLength; col++) {
      $("#sequence").append("<button id='" + (row + (col * totalOctaveNotes)) + "'>" + (row + (col * totalOctaveNotes)) + "</button>");
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
    // debugger
    if (event.target.id === "play"){
      console.log("play");
      if (playOn === false) {
        playOn = true;
        playSeq = setInterval(function(){
          newSeq.playNotes(time);
          time === allNotesInSeq ? time = 0 : time += totalOctaveNotes;
        }, calcDelay(tempo));
      }
      else {
        playOn = false;
        clearInterval(playSeq);
      };
    }
    else {
      noteId = convertNoteIdToInt(event);
      newSeq.toggleNote(noteId);
    };
  });
};

Sequence.prototype.toggleNote = function (noteId) {
  console.log(noteId);
  if (notes[noteId] === null) {
    notes[noteId] = convertNoteIdToValue(noteId) + 50; // adding 50 converts an ID of 0 to around A3
  }
  else {
    notes[noteId] = null;
  };
  console.log(notes[noteId])
};

Sequence.prototype.playNotes = function (time) {
  console.log(time, notes[time]);
  var delay = 0; // play one note every quarter second
  var note = notes[time]; // the MIDI note
  var velocity = 127; // how hard the note hits
  // play the note
  MIDI.setVolume(0, 127);
  MIDI.noteOn(0, note, velocity, delay);
  MIDI.noteOff(0, note, delay + 0.75);
};
