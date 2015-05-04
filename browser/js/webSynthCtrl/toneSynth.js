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
		function _setDelay(dt, f, wd) {
			if(self.synth.dly){
				self.synth.dly = null;
				self.synth.disconnect(self.synth.dly)
				console.log("Wiped. Reinstantiating.")
			}
			var dly = new Tone.PingPongDelay({
			    "delayTime" : dt,
			    "feedback" : parseFloat(f / 100),
			    "wet" : wd /100
			}).toMaster(); 
			self.synth.dly = dly
			self.synth.connect(dly);

		}
		function _setDistortion(dist, wd) {
			if(self.synth.dst){
				self.synth.dst = null;
				self.synth.disconnect(self.synth.dst)
				console.log("Wiped. Reinstantiating.")
			}
			console.log("dist: ", dist, " wd:", wd)
			var dly = new Tone.Distortion({
			    "distortion" : dist / 100,
			    "wet" : wd /100
			}).toMaster(); 
			self.synth.dst = dst
			self.synth.connect(dst);

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
			setDistortion: _setDistortion,
			setActiveInstrument: _setActiveInstrument,
			setActiveOscillator: _setActiveOscillator,
			setMonoSynth: _setMonoSynth,
			setPolySynth: _setPolySynth,
			instruments: self.instruments
		};
	}]);