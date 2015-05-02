angular
	.module('Tone-Synth', [])
	.factory('SynthEngine', [function(){
		var self = this;
		self.isPolyphonic = false;
		self.instruments = ["Mono", "Poly"];
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

		function _setMonoSynth() {

			self.isPolyphonic = false;
			self.synth = new Tone.MonoSynth().toMaster();
		}

		function _setPolySynth() {
			self.isPolyphonic = true;
			self.synth = new Tone.PolySynth(6, Tone.MonoSynth).toMaster();
			//self.synth.setPreset("BrassCircuit");
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
			getActiveSynth: _getActiveSynth,
			noteOn: _noteOn,
			noteOff: _noteOff,
			setActiveInstrument: _setActiveInstrument,
			setMonoSynth: _setMonoSynth,
			setPolySynth: _setPolySynth,
			instruments: self.instruments
		};
	}]);