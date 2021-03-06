// From Soledad Penades: https://github.com/sole/howa/blob/master/client/js/scenes/publish_me/web-audio-thx.js
// In turn, like http://stuartmemo.com/thx-deep-note/thx-deep-note.js, but without using Theresa's helpers
(function() { 

window.WebAudioThx = function(audioContext) {
	var out = audioContext.createGain();
	out.gain.setValueAtTime(0.5, audioContext.currentTime);

	var oscillators = [];
	var numberOfOscillators = 30; // 30;
	var soundLength = 13;

	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function createOscillators(amount) {
		// brutal reset
		oscillators.length = 0;
		var now = audioContext.currentTime;

		for(var i = 0; i < amount; i++) {
			var osc = audioContext.createOscillator();
			osc.type = 'sawtooth';
			var freq = getRandomInt(200, 400);
			osc.frequency.value = freq;
			osc.frequency.setValueAtTime(freq, now);
			oscillators.push(osc);
		}
		oscillators.sort(); // TODO: why and based on which criteria

	}


	function makeFilter(osc, when, envLength) {
		var filter = audioContext.createBiquadFilter();
		filter.type = 'lowpass';
		
		if(osc.frequency.value > 300) {
			filter.frequency.setValueAtTime(300, when);
			filter.frequency.linearRampToValueAtTime(500, when + envLength / 2);
			filter.frequency.linearRampToValueAtTime(20000, when + 1.5 * envLength / 3);
		}
		return filter;
	}

	function playOscillators(timeOffset, soundLength) {

		var when = audioContext.currentTime + timeOffset;
		var fundamental = 20.02357939482212;
		var outNode = audioContext.createGain();

		oscillators.forEach(function(osc, index) {

			var panner = audioContext.createStereoPanner();
			panner.pan.value = getRandomInt(-0.5, 0.5);

			var oscGain = audioContext.createGain();

			// TODO addWobble(osc) // but it doesn't seem to be used/doing anything at all anyway ?

			osc.detune.setValueAtTime(getRandomInt(-10, 10), when);

			var finalFreq;
			var finalGain = 1.0;
			var duration = 2 * soundLength / 3;
			var freqEnvEnd = when + duration;

			if(index % 2 === 0) {
				finalFreq = fundamental * 2;
				freqEnvEnd += 0.01;
			} else if(index % 3 === 0) {
				finalFreq = fundamental * 4;
				freqEnvEnd += 0.02;
				finalGain = 0.9;
			} else if(index % 4 === 0) {
				finalFreq = fundamental * 8;
				freqEnvEnd += 0.022;
				finalGain = 0.8;
			} else if(index % 5 === 0) {
				finalFreq = fundamental * 16;
				freqEnvEnd -= 0.022;
				finalGain = 0.7;
			} else if(index % 6 === 0) {
				finalFreq = fundamental * 32;
				freqEnvEnd -= 0.01;
				finalGain = 0.6;
			} else {
				finalFreq = fundamental * 64;
				finalGain = 0.3;
			}

			osc.frequency.linearRampToValueAtTime(finalFreq, freqEnvEnd);
			oscGain.gain.setValueAtTime(finalGain, when);
			
			var filter = makeFilter(osc, when, soundLength);
			
			osc.connect(panner);
			panner.connect(filter);
			filter.connect(oscGain);
			oscGain.connect(outNode);

			osc.__endNode = oscGain;

			osc.start(when);
			osc.stop(when + soundLength);

		});

		var numOscillators = oscillators.length;
		var maxGain = 20.0 / numOscillators; // 1.0 / nOsc is probably too low
		
		outNode.gain.setValueAtTime(0, when);
		outNode.gain.linearRampToValueAtTime(maxGain / 4, when + soundLength / 3);
		outNode.gain.setValueAtTime(maxGain / 4, when + soundLength / 3);
		outNode.gain.setValueAtTime(maxGain / 4, when + soundLength / 2);

		// Ramp to max value
		outNode.gain.linearRampToValueAtTime(maxGain, when + 2 * soundLength / 3);

		// Set max value before fade
		outNode.gain.linearRampToValueAtTime(maxGain, when + soundLength - 3);

		// Fade out
		outNode.gain.linearRampToValueAtTime(0, when + soundLength);

		

		outNode.connect(out);

	}

	function stopOscillators(timeOffset) {
		var now = audioContext.currentTime;
		var fadeOutLength = 1;
		var when = now + timeOffset + fadeOutLength;
		var thoseOscillators = [];

		oscillators.forEach(function(osc) {
			thoseOscillators.push(osc);
		});

		out.gain.linearRampToValueAtTime(0, when);

		setTimeout(function() {
			var then = audioContext.currentTime;
			thoseOscillators.forEach(function(osc) {
				osc.stop(then);
				osc.disconnect();
				osc.__endNode.disconnect();
			});
		}, (fadeOutLength + 0.3) * 1000);
	}
	
	out.start = function() {
		console.log('starting THX');

		out.gain.setValueAtTime(0.5, audioContext.currentTime);
		createOscillators(numberOfOscillators);
		playOscillators(0, soundLength);
	};


	out.stop = function() {
		stopOscillators(0);
	};

	return out;
};

})();