// Audio Input Manager with YIN pitch detection
class AudioManager {
    constructor(onNoteDetected) {
        this.onNoteDetected = onNoteDetected;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.stream = null;
        this.isActive = false;
        
        // Pitch detection
        this.detector = null;
        this.buffer = null;
        this.bufferSize = 2048;
        
        // Threshold for clarity/probability
        this.minClarity = 0.85;
    }

    async connect() {
        try {
            // Audio context - created on user interaction
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Get microphone
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            
            this.microphone = this.audioContext.createMediaStreamSource(this.stream);
            
            // Create analyser for visualization
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.microphone.connect(this.analyser);
            
            // Create buffer for pitch detection
            this.buffer = new Float32Array(this.bufferSize);
            
            // Initialize pitch detector using pitchy (YIN algorithm)
            // Using standalone YIN implementation
            this.detector = new PitchDetector(this.audioContext.sampleRate, this.bufferSize);
            
            this.isActive = true;
            return true;
        } catch (error) {
            console.error('Mikrofon bağlantı hatası:', error);
            return false;
        }
    }

    startDetection() {
        if (!this.isActive) return;
        
        const detect = () => {
            if (!this.isActive) return;
            
            // Get current audio data
            this.analyser.getFloatTimeDomainData(this.buffer);
            
            // Run YIN pitch detection
            const result = detectPitchYIN(this.buffer, this.audioContext.sampleRate);
            
            if (result && result.probability > this.minClarity) {
                const frequency = result.pitch;
                const noteName = frequencyToNoteName(frequency);
                this.onNoteDetected(noteName, frequency, result.probability);
            }
            
            requestAnimationFrame(detect);
        };
        
        detect();
    }

    disconnect() {
        this.isActive = false;
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }

    isConnected() {
        return this.isActive;
    }

    getAnalyserData() {
        if (!this.analyser) return null;
        const data = new Float32Array(this.analyser.fftSize);
        this.analyser.getFloatTimeDomainData(data);
        return data;
    }
}

// YIN Pitch Detection Algorithm
function detectPitchYIN(buffer, sampleRate) {
    const bufferSize = buffer.length;
    const threshold = 0.85;
    
    // Calculate difference function
    const difference = new Float32Array(bufferSize);
    for (let tau = 0; tau < bufferSize; tau++) {
        difference[tau] = 0;
        for (let i = 0; i < bufferSize - tau; i++) {
            const delta = buffer[i] - buffer[i + tau];
            difference[tau] += delta * delta;
        }
    }
    
    // Cumulative mean normalized difference
    const cmndf = new Float32Array(bufferSize);
    cmndf[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < bufferSize; tau++) {
        runningSum += difference[tau];
        cmndf[tau] = difference[tau] * tau / runningSum;
    }
    
    // Find first tau where cmndf < threshold
    let tauEstimate = -1;
    for (let tau = 2; tau < bufferSize - 1; tau++) {
        if (cmndf[tau] < threshold) {
            while (tau + 1 < bufferSize - 1 && cmndf[tau + 1] < cmndf[tau]) {
                tau++;
            }
            tauEstimate = tau;
            break;
        }
    }
    
    if (tauEstimate === -1) {
        return null;
    }
    
    // Parabolic interpolation for better precision
    let betterTau;
    if (tauEstimate < 1 || tauEstimate >= bufferSize - 1) {
        betterTau = tauEstimate;
    } else {
        const s0 = cmndf[tauEstimate - 1];
        const s1 = cmndf[tauEstimate];
        const s2 = cmndf[tauEstimate + 1];
        betterTau = tauEstimate + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
    }
    
    const frequency = sampleRate / betterTau;
    const probability = 1 - cmndf[tauEstimate];
    
    // Reasonable frequency range for piano: 27.5 Hz to 4186 Hz
    if (frequency < 27.5 || frequency > 4186) {
        return null;
    }
    
    return { pitch: frequency, probability };
}

// Frequency to MIDI note number
function frequencyToMidi(freq) {
    return 69 + 12 * Math.log2(freq / 440);
}

// Frequency to nearest note name
function frequencyToNoteName(freq) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const midiNote = Math.round(frequencyToMidi(freq));
    const octave = Math.floor(midiNote / 12) - 1;
    const note = notes[((midiNote % 12) + 12) % 12];
    return `${note}${octave}`;
}

// Simple PitchDetector class for compatibility
class PitchDetector {
    constructor(sampleRate, bufferSize) {
        this.sampleRate = sampleRate;
        this.bufferSize = bufferSize;
    }
    
    findPitch(buffer) {
        return detectPitchYIN(buffer, this.sampleRate);
    }
}