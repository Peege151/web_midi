angular
    .module('WebSynth', ['WebMIDI', 'Synth'])
    .controller('WebSynthCtrl', ['$scope', 'Devices', 'DSP', function($scope, devices, DSP) {
        $scope.devices = [];
        $scope.score = [];
        $scope.DSP = DSP;
        
        
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


        // Transport and metronome
        $scope.transport = Tone.Transport;

        $scope.startTransport = function() { 
            $scope.transport.start();
        };

        $scope.stopTransport = function() {
            $scope.transport.stop();
        };

        $scope.metronome = null;

        $scope.loadMetronome = function() {

            if($scope.metronome === null) {
                $scope.metronome = new Tone.Player("../../sounds/woodblock.wav");

                Tone.Buffer.onload = function() {
                    $scope.metronome.toMaster();

                    $scope.transport.setInterval(function(time){
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

        $scope.setBpm = $scope.transport.bpm.value = 60;

        $scope.startAll = function() {
            $scope.startTransport();
            $scope.loadMetronome();
        };


        // Triggered and score
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
                for(var i = 0; i < $scope.triggeredArr.length; i++){
                    for(var j=0; j< $scope.triggeredArr[i].length; j++){
                        if($scope.triggeredArr[i][j] == pad) return true
                    }
                }
            }
            return false;
        };

        $scope.score = DSP.returnScore(function(score) {
            //$scope.score.push(score);
            console.log("score", score);
            console.log("$scope.score",$scope.score);
            $scope.$digest();
        });

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

        // watchers
        $scope.$watch('activeDevice', DSP.plug);
        // support for computer keyboard
        $scope.$watch('synth.useKeyboard', DSP.switchKeyboard);
    }]);