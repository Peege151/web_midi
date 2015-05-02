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
            "track1": [],
            //"tempo": 100,
            "timeSignature": [4,4]
        }; 
        self.start = 1;
        self.noteReceivedTime = null;
        self.noteReleasedTime = null;
        self.noteDuration = null;

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
                console.log(device);
            }
        }

        function _switchKeyboard(on) {
            if(on !== undefined) {
                _unplug();
                Keyboard.disable();

                if(on) {
                    Keyboard.enable();

                    self.device = $window;
                    self.device.onmessage = _onmessage;
                } else {
                    /**
                    * TODO: look at plugging back the device
                    * if there was one selected before enabling the computer keyboard
                    */
                }
            }
        }

        function _onmidimessage(e) {
            // Convert MIDI values to Tone.js values
            var note = midiToNote(e.data[1]);
            var velocity = midiToVelocity(e.data[2]);

            // Upon pad touch, add data to triggered (active) pad array and score (recording) array
            if(e.data[0] === 144) {
                self.noteReceivedTime = e.timeStamp;
                self.triggered.push(e.data);
                console.log(self.noteReceivedTime);
            }

            // Upon pad release, add data to triggered (active) pad array
            if(e.data[0] === 128) {
                self.noteReleasedTime = e.timeStamp;
                self.noteDuration = (self.noteReleasedTime - self. noteReceivedTime) / 1000;
                console.log(self.noteDuration);

                var noteToRemove = e.data[1];
                self.triggered.forEach(function(element, index) {
                    if (e.data[1] === element[1]) {
                        self.triggered.splice(index, 1);
                    }          
                });
                
                // Using Tone.js score values, start position, note, length in secs
                self.score.track1.push([self.start + ":0:0", note, self.noteDuration]);
                self.start++; 
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

        function _returnTriggered (cb){
            //console.log("get it?");
            callback = cb;
            return self.triggered;
        }

        function _returnScore (cb) {
            callback = cb;
            return self.score;
        }

        function _onmessage(e) {
            if(e && e.data) {
                //console.log(e);
                _onmidimessage(e.data);
            }
        }

        return {
            onmidimessage: _onmidimessage,
            returnTriggered: _returnTriggered,
            returnScore: _returnScore,
            plug: _plug,
            switchKeyboard: _switchKeyboard
        };
    }]);