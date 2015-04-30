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
            //console.log($scope.triggeredArr[0][1]);
            //console.log("Pad", pad);
            if ($scope.triggeredArr.length) {
                return $scope.triggeredArr[0][1] === pad;
            }
            else return false;
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