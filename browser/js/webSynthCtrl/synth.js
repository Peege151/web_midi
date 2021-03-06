angular
    .module('Synth', ['Tone-Synth', 'WebAnalyser', 'Keyboard'])
    .factory('DSP', ['SynthEngine', 'Analyser', '$window','KeyboardHandler', function(SynthEngine, Analyser, $window, Keyboard) {
        var self = this;
        var callback;

        self.device = null;
        self.useKeyboard = false;
        self.triggered = []; // Currently active pads
        
        self.score = { // Recorded notes
            //"Track Title": [], // Track title goes in quotes, not sure what goes in the array yet, if anything
            "synth": [],
            //"tempo": 100,
            "timeSignature": [4,4]
        }; 
        //self.start = 0;
        self.position = "";
        self.noteReceivedTime = null;
        self.noteReleasedTime = null;
        self.noteDuration = null;

        self.recording = false;

        // Device connection
        function _unplug() {
            if(self.device && self.device.onmidimessage) {
                self.device.onmidimessage = null;
            }
            self.device = null;

        }
        
        function _plug(device) {
            if(device) {
                // unplug any already connected device
                if(self.device) {
                    _unplug();
                }

                self.device = device;
                self.device.onmidimessage = _onmidimessage;
            }
        }


        // Message handling
        function _onmessage(e) {
            if(e && e.data) {
                _onmidimessage(e.data);
            }
        }

        function _updatePosition(position) {

            self.position = position;
        }

        function _onmidimessage(e) {
            // Convert MIDI values to Tone.js values
            var note = midiToNote(e.data[1]);
            var velocity = midiToVelocity(e.data[2]);

            // Only do these these things if there is a currently active synth
            if(!!SynthEngine.getActiveSynth()) {
                // Upon pad touch, add data to triggered (active) pad array and score (recording) array
                if(e.data[0] === 144) {
                    self.noteReceivedTime = e.timeStamp;
                    self.triggered.push(e.data);
                }

                // Upon pad release, remove data from triggered (active) pad array
                if(e.data[0] === 128) {
                    self.noteReleasedTime = e.timeStamp;
                    self.noteDuration = (self.noteReleasedTime - self. noteReceivedTime) / 1000;

                    var noteToRemove = e.data[1];
                    self.triggered.forEach(function(element, index) {
                        if (e.data[1] === element[1]) {
                            self.triggered.splice(index, 1);
                        }          
                    });
                    
                    // Add to the score if recording and transport is on
                    if(self.recording && Tone.Transport.state === "started" && !self.countingInNow) {
                        // Using Tone.js score values, start position, note, length in secs
                        self.score.synth.push([self.position, note, self.noteDuration]);
                    }
                }         


                callback(self.triggered);
                
                /**
                * e.data is an array
                * e.data[0] = on (144) / off (128) / detune (224)
                * e.data[1] = midi note
                * e.data[2] = velocity || detune
                */
                switch(e.data[0]) {
                    case 144:
                        SynthEngine.noteOn(note, null, velocity);
                    break;
                    case 128:
                        SynthEngine.noteOff(note);
                    break;
                    // case 224:
                    //     SynthEngine.detune(e.data[2]);
                    // break;
                }
            }
        }


        // Convert MIDI values to Tone.js values
        function midiToNote(midiNoteNum){
            var noteIndexToNote = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            var octave = Math.floor(midiNoteNum / 12) - 2;
            var note = midiNoteNum % 12;
            return noteIndexToNote[note] + octave;
        }

        function midiToVelocity(midiVelocity) {

            return midiVelocity / 127;
        }


        // Getters
        function _returnTriggered (cb){
            callback = cb;
            return self.triggered;
        }

        function _returnScore (cb) {
            callback = cb;
            return self.score;
        }


        // Transport
        function _play() {
            // Create events for all of the notes
            Tone.Note.parseScore(self.score);

            // Get the current active synth
            self.synth = SynthEngine.getActiveSynth();

            // Route the note channel
            Tone.Note.route("synth", function(time, note, duration) {
                self.synth.triggerAttackRelease(note, duration, time);
            });

            // Start the transport
            //Tone.Transport.start();
        }

        function _stop() {
            
            Tone.Transport.stop();
        }

        function _recordStart() {

            self.recording = true;
        }

        function _recordStop() {

            self.recording = false;
        }

        function _getRecordingStatus() {

            return self.recording;
        }

        function _clearRecording() {
            self.score.synth = [];

            Tone.Transport.clearTimelines();
        }

        self.countingInNow = false;

        function _countIn(rawCount) {
            if(rawCount < 0) {
                self.countingInNow = true;
            }
            else self.countingInNow = false;
        }


        return {
            clearRecording: _clearRecording,
            countIn: _countIn,
            getRecordingStatus: _getRecordingStatus,
            onmidimessage: _onmidimessage,
            play: _play,
            plug: _plug,
            recordStart: _recordStart,
            recordStop: _recordStop,
            returnTriggered: _returnTriggered,
            returnScore: _returnScore,
            stop: _stop,
            updatePosition: _updatePosition
            //switchKeyboard: _switchKeyboard
        };
    }]);


        // function _switchKeyboard(on) {
        //     if(on !== undefined) {
        //         _unplug();
        //         Keyboard.disable();

        //         if(on) {
        //             Keyboard.enable();

        //             self.device = $window;
        //             self.device.onmessage = _onmessage;
        //         } else {
        //             /**
        //             * TODO: look at plugging back the device
        //             * if there was one selected before enabling the computer keyboard
        //             */
        //         }
        //     }
        // }