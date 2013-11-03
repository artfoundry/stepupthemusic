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
  newSeq = new Sequence();
  newSeq.initNotes();
  newSeq.addListener();
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
  sequenceLength = 16;
  numberOfNotes = maxOctave * sequenceLength * 8;
  tempo = 120;
  playOn = false;
  notes = [];
  time = 0;
};

Sequence.prototype.initNotes = function () {
  for(var i = 0; i < numberOfNotes; i++){
    notes[i] = null;
  }
};

Sequence.prototype.addListener = function () {
  $("#sequence").click(function(event) {
    // debugger
    if (event.target.id === "play"){
      console.log("play")
      if (playOn === false) {
        playOn = true;
        playSeq = setInterval(function(){
          newSeq.playNotes(time);
          time === numberOfNotes ? time = 0 : time += 16;
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
  console.log("note")
    notes[noteId] === null ? notes[noteId] = convertNoteIdToValue(noteId) + 50 : notes[noteId] = null; 
};

Sequence.prototype.playNotes = function (time) {
  MIDI.loadPlugin({
    soundfontUrl: "./soundfont/",
    instrument: "acoustic_grand_piano",
    callback: function() {
      var delay = 0; // play one note every quarter second
      var note = notes[time]; // the MIDI note
      var velocity = 127; // how hard the note hits
      // play the note
      MIDI.setVolume(0, 127);
      MIDI.noteOn(0, note, velocity, delay);
      MIDI.noteOff(0, note, delay + 0.75);
    }
  })
}
