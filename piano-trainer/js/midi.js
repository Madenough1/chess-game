// MIDI Input Manager
class MidiManager {
    constructor(onNoteOn, onNoteOff) {
        this.onNoteOn = onNoteOn;
        this.onNoteOff = onNoteOff;
        this.midiAccess = null;
        this.connected = false;
    }

    async connect() {
        try {
            if (!navigator.requestMIDIAccess) {
                throw new Error('Web MIDI API desteklenmiyor');
            }

            this.midiAccess = await navigator.requestMIDIAccess();
            
            this.midiAccess.inputs.forEach(input => {
                input.onmidimessage = this.handleMidiMessage.bind(this);
            });

            this.connected = true;
            return true;
        } catch (error) {
            console.error('MIDI bağlantı hatası:', error);
            return false;
        }
    }

    handleMidiMessage(event) {
        const [status, note, velocity] = event.data;
        const command = status >> 4;
        const channel = status & 0x0F;

        if (command === 9 && velocity > 0) {
            // Note On
            this.onNoteOn(note, velocity);
        } else if (command === 8 || (command === 9 && velocity === 0)) {
            // Note Off
            this.onNoteOff(note);
        }
    }

    disconnect() {
        if (this.midiAccess) {
            this.midiAccess.inputs.forEach(input => {
                input.onmidimessage = null;
            });
        }
        this.connected = false;
    }

    isConnected() {
        return this.connected;
    }
}

// Note number to name converter
function noteNumberToName(num) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(num / 12) - 1;
    const note = notes[num % 12];
    return `${note}${octave}`;
}

// MIDI note number to frequency
function midiToFrequency(midiNote) {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
}

// Frequency to MIDI note number
function frequencyToMidi(freq) {
    return 69 + 12 * Math.log2(freq / 440);
}

// Frequency to nearest note name
function frequencyToNoteName(freq) {
    const midiNote = Math.round(frequencyToMidi(freq));
    return noteNumberToName(midiNote);
}