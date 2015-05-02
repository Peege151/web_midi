angular
    .module('Synth', ['Tone-Synth', 'WebAnalyser', 'Keyboard'])
    .factory('DSP', ['SynthEngine', 'Analyser', '$window','KeyboardHandler', function(SynthEngine, Analyser, $window, Keyboard) {
        var self = this;
        var callback;

        self.device = null;
        self.analyser = null;
        self.useKeyboard = false;
        self.triggered = [];
        self.score = [];

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
            var note = midiToNote(e.data[1]);
            var velocity = midiToVelocity(e.data[2]);

            if(e.data[0] === 144) {
                self.triggered.push(e.data);
                console.log("triggered:", self.triggered);
                self.score.push(e.data);
                console.log("self.score:", self.score);
            }

            if(e.data[0] === 128) {
                var noteToRemove = e.data[1];
                self.triggered.forEach(function(element, index) {
                    //console.log("This is index: ", index);
                    if (e.data[1] === element[1]) {
                        self.triggered.splice(index, 1);
                    }          
                });
            }


            callback(self.triggered);
            //console.log(self.triggered[0][1]);
            
            //console.log("On/off/detune indicator ", e.data[0], ". Note: ", e.data[1], ". Velocity: ", e.data[2]);
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