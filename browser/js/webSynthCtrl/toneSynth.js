angular
	.module('Tone-Synth', [])
	.factory('SynthEngine', [function(){
		var self = this;
		self.isPolyphonic = false;
		self.instruments = ["Mono", "Poly"];
		self.oscs = ["sawtooth", "square", "sine", "triangle"];

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
		function _setActiveOscillator (activeOscillator){
			if(self.synth){	
				self.synth.set({
				    "oscillator" : {
				        "type" : activeOscillator || "sine"
				    }
				});
			}

		}
		function _setMonoSynth(type) {
			self.isPolyphonic = false;
			self.synthType = "Mono"
			self.synth = new Tone.MonoSynth().toMaster();
			console.log(self.synth)


		}

		function _setPolySynth() {
			self.synthType = "Poly"
			self.isPolyphonic = true;
			self.synth = new Tone.PolySynth(6, Tone.MonoSynth).toMaster();
			console.log(self.synth)
			//self.synth.setPreset("BrassCircuit");
		}

		function _noteOn(note, time, velocity) {
			self.synth.triggerAttack(note, time, velocity);
		}

		function _noteOff(note) {
			if (self.isPolyphonic) {
				self.synth.triggerRelease(note);
			}
			else self.synth.triggerRelease();
		}

		_setPolySynth();

		return {
			synth: self.synth,
			oscs: self.oscs,
			noteOn: _noteOn,
			noteOff: _noteOff,
			setActiveInstrument: _setActiveInstrument,
			setActiveOscillator: _setActiveOscillator,
			setMonoSynth: _setMonoSynth,
			setPolySynth: _setPolySynth,
			instruments: self.instruments
		};
	}]);