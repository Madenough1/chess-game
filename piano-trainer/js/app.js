// Main Application
// This file ties all components together

// Global state
let midiManager = null;
let audioManager = null;
let tutorEngine = null;
let waterfall = null;

// Current input mode
let inputMode = null; // 'midi' or 'mic'

// DOM elements
const elements = {
    midiStatus: document.getElementById('midi-status'),
    micStatus: document.getElementById('mic-status'),
    btnMidi: document.getElementById('btn-midi'),
    btnMic: document.getElementById('btn-mic'),
    songSelect: document.getElementById('song-select'),
    btnStart: document.getElementById('btn-start'),
    btnStop: document.getElementById('btn-stop'),
    feedback: document.getElementById('feedback'),
    feedbackIcon: document.getElementById('feedback-icon'),
    feedbackText: document.getElementById('feedback-text'),
    currentNote: document.getElementById('current-note'),
    correctCount: document.getElementById('correct-count'),
    wrongCount: document.getElementById('wrong-count'),
    accuracy: document.getElementById('accuracy'),
    virtualKeyboard: document.getElementById('virtual-keyboard')
};

// Initialize virtual keyboard
function initVirtualKeyboard() {
    const keyboard = elements.virtualKeyboard;
    keyboard.innerHTML = '';
    
    // Create 88 keys for a full piano
    const whiteKeyWidth = 20;
    const blackKeyWidth = 12;
    
    const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackNotes = ['C#', 'D#', 'F#', 'G#', 'A#'];
    
    // Piano starts from A0 (21) to C8 (108)
    for (let octave = 0; octave < 8; octave++) {
        for (let i = 0; i < 7; i++) {
            const noteNum = (octave + 1) * 12 + [0, 2, 4, 5, 7, 9, 11][i];
            if (noteNum >= 21 && noteNum <= 108) {
                const key = document.createElement('div');
                key.className = 'key white';
                key.dataset.note = noteNumToName(noteNum);
                key.dataset.midi = noteNum;
                key.style.width = whiteKeyWidth + 'px';
                keyboard.appendChild(key);
            }
        }
    }
    
    // Add black keys
    for (let octave = 0; octave < 8; octave++) {
        for (let i = 0; i < 7; i++) {
            const noteNum = (octave + 1) * 12 + [0, 2, 4, 5, 7, 9, 11][i];
            if (noteNum >= 21 && noteNum <= 108) {
                const isBlack = [1, 3, 6, 8, 10].includes(noteNum % 12);
                if (isBlack) {
                    const key = document.createElement('div');
                    key.className = 'key black';
                    key.dataset.note = noteNumToName(noteNum);
                    key.dataset.midi = noteNum;
                    key.style.width = blackKeyWidth + 'px';
                    keyboard.appendChild(key);
                }
            }
        }
    }
}

// Note number to name
function noteNumToName(num) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(num / 12) - 1;
    const note = notes[num % 12];
    return `${note}${octave}`;
}

// Update keyboard highlight
function highlightKey(noteName, type) {
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        if (key.dataset.note === noteName) {
            key.classList.add('active');
            if (type === 'correct') {
                key.classList.add('correct');
            } else if (type === 'wrong') {
                key.classList.add('wrong');
            }
            
            // Remove highlight after delay
            setTimeout(() => {
                key.classList.remove('active', 'correct', 'wrong');
            }, 500);
        }
    });
}

// Show feedback
function showFeedback(type, text) {
    elements.feedback.classList.remove('hidden', 'correct', 'wrong');
    elements.feedback.classList.add(type);
    elements.feedbackIcon.textContent = type === 'correct' ? '✓' : '✗';
    elements.feedbackText.textContent = text;
    
    setTimeout(() => {
        elements.feedback.classList.add('hidden');
    }, 1500);
}

// Update stats display
function updateStats(stats) {
    elements.correctCount.textContent = stats.correct;
    elements.wrongCount.textContent = stats.wrong;
    elements.accuracy.textContent = stats.accuracy + '%';
}

// Update connection status
function updateStatus(type, connected) {
    const statusEl = type === 'midi' ? elements.midiStatus : elements.micStatus;
    if (connected) {
        statusEl.textContent = type === 'midi' ? 'MIDI: Bağlı' : 'Mikrofon: Aktif';
        statusEl.classList.remove('offline');
        statusEl.classList.add('online');
    } else {
        statusEl.textContent = type === 'midi' ? 'MIDI: Bağlı değil' : 'Mikrofon: Kapalı';
        statusEl.classList.remove('online');
        statusEl.classList.add('offline');
    }
}

// Handle note input from any source
function handleNoteInput(noteName) {
    // Update current note display
    elements.currentNote.textContent = noteName;
    
    // Highlight virtual keyboard
    highlightKey(noteName, 'expected');
    
    // Send to tutor engine
    if (tutorEngine) {
        tutorEngine.handleNoteInput(noteName);
    }
}

// Initialize MIDI
async function initMidi() {
    midiManager = new MidiManager(
        (noteNum, velocity) => {
            const noteName = noteNumToName(noteNum);
            handleNoteInput(noteName);
        },
        (noteNum) => {
            // Note off - could dim the key
        }
    );
    
    const success = await midiManager.connect();
    updateStatus('midi', success);
    
    if (success) {
        inputMode = 'midi';
        elements.btnMidi.disabled = true;
        elements.btnMic.disabled = false;
    }
}

// Initialize Microphone
async function initMic() {
    audioManager = new AudioManager((noteName, frequency, clarity) => {
        handleNoteInput(noteName);
    });
    
    const success = await audioManager.connect();
    updateStatus('mic', success);
    
    if (success) {
        inputMode = 'mic';
        audioManager.startDetection();
        elements.btnMic.disabled = true;
        elements.btnMidi.disabled = false;
    }
}

// Event Listeners
elements.btnMidi.addEventListener('click', () => {
    initMidi();
});

elements.btnMic.addEventListener('click', () => {
    initMic();
});

elements.songSelect.addEventListener('change', (e) => {
    const songId = e.target.value;
    if (songId && tutorEngine) {
        tutorEngine.selectSong(songId);
        elements.btnStart.disabled = false;
    } else {
        elements.btnStart.disabled = true;
    }
});

elements.btnStart.addEventListener('click', () => {
    if (tutorEngine.start()) {
        waterfall.start();
        elements.btnStart.disabled = true;
        elements.btnStop.disabled = false;
        elements.songSelect.disabled = true;
    }
});

elements.btnStop.addEventListener('click', () => {
    tutorEngine.stop();
    waterfall.stop();
    elements.btnStart.disabled = false;
    elements.btnStop.disabled = true;
    elements.songSelect.disabled = false;
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initVirtualKeyboard();
    
    // Create tutor engine
    tutorEngine = new TutorEngine(
        (noteName) => {
            highlightKey(noteName, 'correct');
            showFeedback('correct', `${noteName} Doğru!`);
            updateStats(tutorEngine.getStats());
            waterfall.addNote(noteName, 'correct');
        },
        (inputNote, expectedNote) => {
            const msg = inputNote 
                ? `${inputNote} Yanlış! Beklenen: ${expectedNote}`
                : `Zaman aşımı! Beklenen: ${expectedNote}`;
            showFeedback('wrong', msg);
            updateStats(tutorEngine.getStats());
            if (inputNote) highlightKey(inputNote, 'wrong');
        },
        (noteName, type) => {
            elements.currentNote.textContent = noteName;
            waterfall.addNote(noteName, 'expected');
        }
    );
    
    // Create waterfall
    waterfall = new Waterfall('waterfall');
    
    // Try to auto-connect MIDI
    if (navigator.requestMIDIAccess) {
        initMidi();
    }
    
    // Try to auto-connect microphone
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Don't auto-connect, let user choose
    }
});