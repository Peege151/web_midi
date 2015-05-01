angular
    .module('WebSynth', ['WebMIDI', 'Synth'])
    .controller('WebSynthCtrl', ['$scope', 'Devices', 'DSP', function($scope, devices, DSP) {
        $scope.devices = [];
        $scope.analyser = null;
        $scope.oscTypes = ['sine', 'square', 'triangle', 'sawtooth'];
        $scope.filterTypes = ['lowpass', 'highpass'];
        $scope.DSP = DSP;
        $scope.synth = {
            oscType: 'sine',
            filterType: 'lowpass',
            filterOn: false,
            filterFreq: 50,
            filterRes: 0,
            attack: 0.05,
            release: 0.05
        };
        
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


        $scope.hello = function() {
            //create one of Tone's built-in synthesizers
            var synth = new Tone.MonoSynth();

            //connect the synth to the master output channel
            synth.toMaster();
            synth.volume.value = -10;

            //create a callback which is invoked every quarter note
            Tone.Transport.setInterval(function(time){
                //trigger middle C for the duration of an 8th note
                synth.triggerAttackRelease("C4", "8n", time);
            }, "4n");

            //start the transport
            Tone.Transport.start();
        };

        $scope.startHello = function() {
            $scope.hello();
        };
        
        $scope.stopHello = function() {
            Tone.Transport.stop();
        };

        $scope.triggeredArr = DSP.returnTriggered(function(triggered){
            //console.log(triggered);
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
                        $scope.analyser = DSP.createAnalyser('#analyser');
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
        $scope.$watch('synth.oscType', DSP.setOscType);
        $scope.$watch('synth.filterOn', DSP.enableFilter);
        $scope.$watch('synth.filterType', DSP.setFilterType);
        $scope.$watch('synth.filterFreq', DSP.setFilterFrequency);
        $scope.$watch('synth.filterRes', DSP.setFilterResonance);
        $scope.$watch('synth.attack', DSP.setAttack);
        $scope.$watch('synth.release', DSP.setRelease);
        // support for computer keyboard
        $scope.$watch('synth.useKeyboard', DSP.switchKeyboard);
    }]);