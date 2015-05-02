angular
	.module('Tone-Synth', [])
	.factory('SynthEngine', [function(){
		var self = this;
		self.isPolyphonic = false;
		self.instruments = ["Mono", "Poly"];
		self.oscs = ["sawtooth", "square", "sine", "triangle"];
		self.synth = null;


		// Synth setting
		function _setActiveInstrument(activeInstrument) {

			switch(activeInstrument) {
	            case "Mono":
	                _setMonoSynth();
	            break;
	            case "Poly":
	                _setPolySynth();
	            break;
	            default:
	            	self.synth = null;  
			}
		}
		function _setDelay() {
			var dly = new Tone.PingPongDelay({
			    "delayTime" : "8n",
			    "feedback" : 0.6,
			    "wet" : 0.5
			}).toMaster(); 

			self.synth.connect(dly);


		}
		function _setActiveOscillator (activeOscillator){
			if(self.synth){	
				self.synth.set({
				    "oscillator" : {
				        "type" : activeOscillator || "sine"
				    }
				});
			}
		}

		function _setMonoSynth() {
			self.isPolyphonic = false;
			self.synthType = "Mono";
			self.synth = new Tone.MonoSynth().toMaster();

		}

		function _setPolySynth() {
			self.synthType = "Poly";
			self.isPolyphonic = true;
			self.synth = new Tone.PolySynth(6, Tone.MonoSynth).toMaster();
		}


		// Notes
		function _noteOn(note, time, velocity) {

			self.synth.triggerAttack(note, time, velocity);
		}

		function _noteOff(note) {
			if (self.isPolyphonic) {
				self.synth.triggerRelease(note);
			}
			else self.synth.triggerRelease();
		}


		// Getters
		function _getActiveSynth() {
			return self.synth;
		}


		return {
			//synth: self.synth,
			oscs: self.oscs,
			getActiveSynth: _getActiveSynth,
			noteOn: _noteOn,
			noteOff: _noteOff,
			setDelay: _setDelay,
			setActiveInstrument: _setActiveInstrument,
			setActiveOscillator: _setActiveOscillator,
			setMonoSynth: _setMonoSynth,
			setPolySynth: _setPolySynth,
			instruments: self.instruments
		};
	}]);