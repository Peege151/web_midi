angular
    .module('Synth', ['WebAudio', 'WebAnalyser', 'Keyboard'])
    .factory('DSP', ['AudioEngine', 'Analyser', '$window','KeyboardHandler', function(Engine, Analyser, $window, Keyboard) {
        var self = this;
        self.device = null;
        self.analyser = null;
        self.useKeyboard = false;
        self.triggered = [];
        self.score = [];

        Engine.init();

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
        var callback;
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

        function _createAnalyser(canvas) {
            self.analyser = new Analyser(canvas);
            Engine.wire(self.analyser);

            return self.analyser;
        }

        function _onmidimessage(e) {
            //console.log("Midi message");
            if(e.data[0] === 144) {
                self.triggered.push(e.data);
                self.score.push();
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
                    Engine.noteOn(e.data[1], e.data[2]);
                break;
                case 128:
                    Engine.noteOff(e.data[1]);
                break;
                case 224:
                    Engine.detune(e.data[2]);
                break;
            }
        }
        function _returnTriggered (cb){
            //console.log("get it?");
            callback = cb;
            return self.triggered;
        }
        function _onmessage(e) {
            if(e && e.data) {
                //console.log(e);
                _onmidimessage(e.data);
            }
        }

        function _enableFilter(enable) {
            if(enable !== undefined) {
                if(enable) {
                    Engine.filter.connect();
                } else {
                    Engine.filter.disconnect();
                }
            }
        }

        return {
            onmidimessage: _onmidimessage,
            triggered: self.triggered,
            returnTriggered: _returnTriggered,
            createAnalyser: _createAnalyser,
            enableFilter: _enableFilter,
            plug: _plug,
            setOscType: Engine.osc.setType,
            setFilterType: Engine.filter.setType,
            setAttack: Engine.setAttack,
            setRelease: Engine.setRelease,
            setFilterFrequency: Engine.filter.setFrequency,
            setFilterResonance: Engine.filter.setResonance,
            switchKeyboard: _switchKeyboard
        };
    }]);