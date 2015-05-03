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
        $scope.position = "";
        $scope.transport.bpm.value = 60;
        $scope.play = DSP.play;
        $scope.recordStart = DSP.recordStart;
        $scope.recordStop = DSP.recordStop;
        $scope.getRecordingStatus = DSP.getRecordingStatus;

        $scope.startTransport = function() { 

            $scope.transport.start();

            // Tell where the transport is
            $scope.transport.setInterval(function(time) {
                // Translate raw count to Tone.js bar notation
                $scope.position = $scope.timeIncrementer($scope.rawCounter);
                // Tell the DSP factory
                DSP.updatePosition($scope.position);

                $scope.rawCounter++;
                $scope.$digest();
            }, "16n");
        };

        $scope.stopTransport = function() {

            $scope.transport.stop();
        };

        // Take the rawCounter integer and convert it to bar notation for Tone.js
        $scope.timeIncrementer = function (clicks) {
            var sixteenths = -2;
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
            
            //console.log(bars + ":" + quarters + ":" + sixteenths);
            return bars + ":" + quarters + ":" + sixteenths;
        };

        $scope.loadMetronome = function() {

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
            //$scope.metronome.pause(1);
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
                    for(var j=0, lentwo = $scope.triggeredArr[i].length; j < lentwo; j++){
                        if($scope.triggeredArr[i][j] === pad) return true;
                    }
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
        $scope.$watch('activeDevice', DSP.plug);
        $scope.$watch('activeInstrument', synthEngine.setActiveInstrument);
        $scope.$watch('activeOscillator', synthEngine.setActiveOscillator);
        $scope.$watch('currBPM', $scope.setBpm);
        //$scope.$watch('position', DSP.updatePosition);
    }]);


        // Support for computer keyboard
        //$scope.$watch('synth.useKeyboard', DSP.switchKeyboard);

        // $scope.destroyUIMidi = function(pad){
        //     var midiData =  new Uint8Array([128, pad, 127])
        //     console.log("HI from mouse-up")
        //     DSP.onmidimessage({data: midiData})        }
        // $scope.createUIMidi = function(pad){
        //    var midiData =  new Uint8Array([144, pad, 127])
        //    //console.log(typeof midiData)
        //    console.log("HI from mouse-down")

        //    DSP.onmidimessage({data: midiData})
        // }
