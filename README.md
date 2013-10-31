Step Up The Music
==============

Multi-user synchronous step sequencer

Summary
=======
The goal of this project is to create a step sequencer (see http://www.kongregate.com/games/quickfingerz/step-seq for an example) that can be used by multiple users to create a piece of music together simultaneously and synchronously.

Each user would control a single instrument but be able to hear all instruments played together.  Music creation would be accomplished by "turning on" individual notes at specific times within a looping sequence.  Sequences would last between 2 and 8 bars, each bar being four notes (thus a 4/4 time signature).  Notes would span 1-2 octaves.  These ranges may be user options or decided upon during development.

Technology
=========
Pusher (pusher.com) would be used for the synchronous communication between users.
Midi.js (http://mudcu.be/midi-js/) would be used for the music sequencing and playback using the MIDI library.
Heroku would be the initial hosting service, with the possibility of moving/copying to LCD Dreams' site (dreamhost), Kongregate's site, or other entertainment sites.
