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
		function activateEffects(){
			if (self.synth){
				for(var key in self.synth.effects){
					console.log(self.synth.effects[key])
					self.synth.connect(self.synth.effects[key])
				}
				console.log("activating effects");
			}
		}
		function _setDelay(dt, f, wd) {
			var dly = new Tone.PingPongDelay({
			    "delayTime" : dt,
			    "feedback" : parseFloat(f / 100),
			    "wet" : wd / 100
			}).toMaster(); 
			if(self.synth){
				self.synth.effects.dly = dly
				activateEffects()
			}
			
		}
		function _setDistortion(dist) {
			var dst = new Tone.Distortion({
			    "distortion" : parseFloat(dist / 100)
			}).toMaster(); 
			if (self.synth){
				self.synth.dst = dst
				self.synth.effects.dst = (dst)
				activateEffects()
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

		function _setMonoSynth() {
			self.isPolyphonic = false;
			self.synthType = "Mono";
			self.synth = new Tone.MonoSynth().toMaster();
			self.synth.effects = {
				dly: null,
				dst: null
			};

		}

		function _setPolySynth() {
			self.synthType = "Poly";
			self.isPolyphonic = true;
			self.synth = new Tone.PolySynth(6, Tone.MonoSynth).toMaster();
			self.synth.effects = [];
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