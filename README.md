Step Up The Music
==============

Multi-user collaborative step sequencer

Summary
=======
The goal of this project is to create a step sequencer (see http://www.kongregate.com/games/quickfingerz/step-seq for an example) that can be used by multiple users to create a piece of music together collaboratively and "synchronously".

Each user controls a single instrument but is able to hear all instruments played together.  Six instruments are available from which to choose.  Music creation is accomplished by "turning on" individual notes at specific times within a looping sequence.  Sequences last 4 bars, each bar being four notes (thus a 4/4 time signature).  Notes span 2 octaves.

Technology
=========
Hosted at http://www.lcddreams.com/stepupthemusic

Firebase is being used for the asynchronous/synchronous communication between users as well as DB storage of songs and users.

Midi.js (http://mudcu.be/midi-js/) is being used for the music sequencing and playback using the MIDI library.  Also used to create the GM sound files as well as the canvas dynamic color background and loader graphic.

Gumby CSS Framework used for grid layout, menu bar, and forms.

Using Jquery 1.10.2.

Future Updates
=========
Ability to set a song as public or private (private songs would not be listed in the All Songs list).  
Ability to change tempo.  
Minor key setting available (currently scale is in G major).  
Button to clear the grid of all note settings.  
Chat system.  
Additional backgrounds.  
Volume control for each channel.
