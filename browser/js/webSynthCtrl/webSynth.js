angular
    .module('WebSynth', ['WebMIDI', 'Synth', 'Tone-Synth'])
    .controller('WebSynthCtrl', ['$scope', 'Devices', 'DSP', 'SynthEngine', function($scope, devices, DSP, synthEngine) {
        $scope.devices = [];
        $scope.instruments = synthEngine.instruments;
        $scope.oscs = synthEngine.oscs;
        $scope.currBPM = 80;
        $scope.score = [];
        $scope.DSP = DSP;

        $scope.setDelay = synthEngine.setDelay;


        // Transport and metronome
        $scope.transport = Tone.Transport;
        $scope.metronome = null;
        $scope.rawCounter = 0;
        $scope.position = "0:0:0";
        $scope.transport.bpm.value = 60;
        $scope.playing = false;

        $scope.play = function() {
            $scope.playing = true;
            $scope.startTransport();

            // Start score replay immediately if not recording
            if($scope.getRecordingStatus() === false) {
                console.log("Playing from $scope.play()");
                DSP.play();
            }
        };

        $scope.stop = function() {
            $scope.playing = false;
            $scope.stopTransport();
        };


        // Recording
        $scope.recordStart = DSP.recordStart;
        $scope.recordStop = DSP.recordStop;
        $scope.getRecordingStatus = DSP.getRecordingStatus;
        
        $scope.clearRecording = function() {
            DSP.clearRecording();
            $scope.score = DSP.returnScore(function(score) {
                $scope.$digest();
            });
        };

        // effects 
        $scope.effects = [];   

        $scope.DLY_wetDry = 0;
        $scope.DLY_feedback = 0;
        $scope.DLY_delayTime = "8n";

        $scope.DST_distortion = 0;

        $scope.RVB_roomsize =0;
        $scope.RVB_dampening = 0;
        $scope.sendDelay = function(){
            synthEngine.setDelay($scope.DLY_delayTime, $scope.DLY_feedback, $scope.DLY_wetDry);
        };
        $scope.sendDistortion = function(){
            synthEngine.setDistortion($scope.DST_distortion);
        };
        $scope.sendReverb = function(){
            synthEngine.setReverb($scope.RVB_roomsize /100, $scope.RVB_dampening / 100);
        };


        $scope.intervalIdForPostition = null;
        $scope.countIn = false;

        $scope.startTransport = function() { 

            // Have a 4-note count-in if you are recording
            if($scope.getRecordingStatus() === true) {
                $scope.countIn = true;
                $scope.rawCounter = -16;
                $scope.position = $scope.timeIncrementer($scope.rawCounter);
            }
            else $scope.countIn = false;
           
            $scope.transport.start();
            
            // Tell where the transport is
            $scope.intervalIdForPostition = $scope.transport.setInterval(function(time) {
                // Translate raw count to Tone.js bar notation
                $scope.position = $scope.timeIncrementer($scope.rawCounter);
                // Tell the DSP factory the bar notation so it can record it in the score
                DSP.updatePosition($scope.position);

                // Tell the DSP when the rawcounter is less than 0 to prevent recording during count-in
                if($scope.rawCounter <= 0) {                  
                    DSP.countIn($scope.rawCounter);
                }

                if($scope.countIn) {
                    if($scope.rawCounter === 0) {
                        console.log("Playing from $scope.startTransport()");
                        Tone.Transport.setTransportTime(0);
                        DSP.play();
                        //$scope.$digest();
                    }
                }


                $scope.rawCounter++;
                $scope.$digest();
            }, "16n");
        };

        $scope.stopTransport = function() {

            $scope.transport.stop();
            $scope.transport.clearInterval($scope.intervalIdForPostition);
            $scope.intervalIdForPostition = null;
            $scope.rawCounter = 0;
            $scope.position = $scope.timeIncrementer($scope.rawCounter);
        };

        // Take the rawCounter integer and convert it to bar notation for Tone.js
        $scope.timeIncrementer = function (clicks) {
            if(clicks < 0) {
                return clicks;
            }

            var sixteenths = -1;
            var quarters = 0;
            var bars = 0;
            
            for (var i = 0; i < clicks; i++) {
                if (sixteenths < 3) {
                    sixteenths++;
                }
                else {
                    sixteenths = 0;
                    
                    if (quarters < 3) {
                        quarters++;
                    }
                    else {
                        quarters = 0;
                        bars++;
                    }
                }
            }
            
            return bars + ":" + quarters + ":" + sixteenths;
        };

        $scope.metronomePlaying = false;

        $scope.loadMetronome = function() {
            $scope.metronomePlaying = true;

            if($scope.metronome === null) {
                $scope.metronome = new Tone.Player("../../sounds/woodblock.wav");

                Tone.Buffer.onload = function() {
                    $scope.metronome.toMaster();

                    $scope.transport.setInterval(function(time){
                        // $scope.position++;
                        // $scope.$digest();
                        $scope.metronome.start(time);
                    }, "4n");
                };
            }
            else {
                $scope.metronome.volume.value = 0;
            }
        };

        $scope.pauseMetronome = function() {
            $scope.metronomePlaying = false;
            $scope.metronome.volume.value = -100;
        };
        
        $scope.setBpm = function(bpm) {

            $scope.transport.bpm.value = bpm;
        };

        $scope.startAll = function() {
            $scope.startTransport();
            $scope.loadMetronome();
        };

        // Triggered and score arrays
        $scope.triggeredArr = DSP.returnTriggered(function(triggered){
            $scope.triggeredArr = triggered;

            $scope.activated(triggered[triggered.length-1]);
            $scope.$digest();
        });

        $scope.activated = function (id) {

            return $scope.triggeredArr.indexOf(id) !== -1;
        };

        $scope.triggered = function(pad) {
            if ($scope.triggeredArr.length) {
                for(var i = 0, len = $scope.triggeredArr.length; i < len; i++){
                    if ($scope.triggeredArr[i][1] === pad) return true;
                    // for(var j=0, lentwo = $scope.triggeredArr[i].length; j < lentwo; j++){
                    //     if($scope.triggeredArr[i][j] === pad) return true;
                    // }
                }
            }
            return false;
        };

        $scope.score = DSP.returnScore(function(score) {

            $scope.$digest();
        });

        // Connect devices
        devices
            .connect()
            .then(function(access) {
                if('function' === typeof access.inputs) {
                    // deprecated
                    $scope.devices = access.inputs();
                    console.error('Update your Chrome version!');
                } else {
                    if(access.inputs && access.inputs.size > 0) {
                        var inputs = access.inputs.values(),
                        input, device;

                        // iterate through the devicesz
                        for (input = inputs.next(); input && !input.done; input = inputs.next()) {
                            $scope.devices.push(input.value);
                        }

                        // create the frequency analyser
                        //$scope.analyser = DSP.createAnalyser('#analyser');
                    } else {
                        console.error('No devices detected!');
                    }

                }
            })
            .catch(function(e) {
                console.error(e);
            });

        // Watchers
            //Delay Watchers
        $scope.$watch('DLY_wetDry', $scope.sendDelay)
        $scope.$watch('DLY_feedback', $scope.sendDelay)
        $scope.$watch('DLY_delayTime', $scope.sendDelay)
            //Dist Watchers
        $scope.$watch('DST_distortion', $scope.sendDistortion)

        $scope.$watch('RVB_roomsize', $scope.sendReverb)
        $scope.$watch('RVB_dampening', $scope.sendReverb)



        $scope.$watch('activeDevice', DSP.plug);
        $scope.$watch('activeInstrument', synthEngine.setActiveInstrument);
        $scope.$watch('activeOscillator', synthEngine.setActiveOscillator);
        $scope.$watch('currBPM', $scope.setBpm);
        //$scope.$watch('position', DSP.updatePosition);
    }]);
//DSP.onmidimessage({data: midiData})
