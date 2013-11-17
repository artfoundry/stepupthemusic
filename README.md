Step Up The Music
==============

Multi-user synchronous step sequencer

Summary
=======
The goal of this project is to create a step sequencer (see http://www.kongregate.com/games/quickfingerz/step-seq for an example) that can be used by multiple users to create a piece of music together simultaneously and "synchronously".

Each user controls a single instrument but is able to hear all instruments played together.  Music creation is accomplished by "turning on" individual notes at specific times within a looping sequence.  Sequences last between 4 bars, each bar being four notes (thus a 4/4 time signature).  Notes span 2 octaves.  These ranges may be expanded at a future date.

Technology
=========
Firebase is being used for the asynchronous/synchronous communication between users and DB storage of songs and users.
Midi.js (http://mudcu.be/midi-js/) is being used for the music sequencing and playback using the MIDI library.
Hosted at lcddreams.com/stepupthemusic since app doesn't use rails (so heroku is unnecessary)
