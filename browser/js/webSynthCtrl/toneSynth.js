angular
	.module('Tone-Synth', [])
	.factory('SynthEngine', [function(){
		var self = this;
		self.isPolyphonic = false;

		function _setMonoSynth() {
			self.isPolyphonic = false;
			self.synth = new Tone.FMSynth().toMaster();
		}

		function _setPolySynth() {
			self.isPolyphonic = true;
			self.synth = new Tone.PolySynth(6, Tone.MonoSynth).toMaster();
			self.synth.setPreset("BrassCircuit");
		}

		function _noteOn(note, time, velocity) {
			self.synth.triggerAttack(note, 1, velocity);
		}

		function _noteOff(note) {
			if (self.isPolyphonic) {
				self.synth.triggerRelease(note);
			}
			else self.synth.triggerRelease();
		}

		_setPolySynth();

		return {
			noteOn: _noteOn,
			noteOff: _noteOff,
			setMonoSynth: _setMonoSynth,
			setPolySynth: _setPolySynth
		};
	}]);