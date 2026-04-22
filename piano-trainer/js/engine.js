// Piano Tutor Engine
class TutorEngine {
    constructor(onCorrect, onWrong, onNoteChange) {
        this.onCorrect = onCorrect;
        this.onWrong = onWrong;
        this.onNoteChange = onNoteChange;
        
        this.songs = {};
        this.currentSong = null;
        this.isPlaying = false;
        this.currentNoteIndex = 0;
        this.waitingForNote = false;
        
        // Statistics
        this.correctCount = 0;
        this.wrongCount = 0;
        this.totalNotes = 0;
        
        this.loadSongs();
    }

    loadSongs() {
        // Twinkle Twinkle Little Star
        this.songs['twinkle'] = {
            name: 'Twinkle Twinkle Little Star',
            bpm: 90,
            notes: [
                { time: 0, note: 'C4', duration: 400 },
                { time: 400, note: 'C4', duration: 400 },
                { time: 800, note: 'G4', duration: 400 },
                { time: 1200, note: 'G4', duration: 400 },
                { time: 1600, note: 'A4', duration: 400 },
                { time: 2000, note: 'A4', duration: 400 },
                { time: 2400, note: 'G4', duration: 800 },
                { time: 3200, note: 'F4', duration: 400 },
                { time: 3600, note: 'F4', duration: 400 },
                { time: 4000, note: 'E4', duration: 400 },
                { time: 4400, note: 'E4', duration: 400 },
                { time: 4800, note: 'D4', duration: 400 },
                { time: 5200, note: 'D4', duration: 400 },
                { time: 5600, note: 'C4', duration: 800 }
            ]
        };

        // Ode to Joy
        this.songs['ode-to-joy'] = {
            name: 'Ode to Joy',
            bpm: 100,
            notes: [
                { time: 0, note: 'E4', duration: 400 },
                { time: 400, note: 'E4', duration: 400 },
                { time: 800, note: 'F4', duration: 400 },
                { time: 1200, note: 'G4', duration: 400 },
                { time: 1600, note: 'G4', duration: 400 },
                { time: 2000, note: 'F4', duration: 400 },
                { time: 2400, note: 'E4', duration: 400 },
                { time: 2800, note: 'D4', duration: 400 },
                { time: 3200, note: 'C4', duration: 400 },
                { time: 3600, note: 'C4', duration: 400 },
                { time: 4000, note: 'D4', duration: 400 },
                { time: 4400, note: 'E4', duration: 400 },
                { time: 4800, note: 'E4', duration: 600 },
                { time: 5400, note: 'D4', duration: 600 }
            ]
        };

        // Für Elise
        this.songs['fur-elise'] = {
            name: 'Für Elise',
            bpm: 120,
            notes: [
                { time: 0, note: 'E4', duration: 300 },
                { time: 300, note: 'D#4', duration: 300 },
                { time: 600, note: 'E4', duration: 300 },
                { time: 900, note: 'D#4', duration: 300 },
                { time: 1200, note: 'E4', duration: 300 },
                { time: 1500, note: 'B3', duration: 300 },
                { time: 1800, note: 'D4', duration: 300 },
                { time: 2100, note: 'C4', duration: 300 },
                { time: 2400, note: 'A3', duration: 600 }
            ]
        };
    }

    selectSong(songId) {
        if (this.songs[songId]) {
            this.currentSong = this.songs[songId];
            this.totalNotes = this.currentSong.notes.length;
            return true;
        }
        return false;
    }

    start() {
        if (!this.currentSong) return false;
        
        this.isPlaying = true;
        this.currentNoteIndex = 0;
        this.waitingForNote = false;
        this.resetStats();
        this.startTime = performance.now();
        
        this.scheduleNextNote();
        return true;
    }

    stop() {
        this.isPlaying = false;
        this.currentNoteIndex = 0;
        this.waitingForNote = false;
    }

    resetStats() {
        this.correctCount = 0;
        this.wrongCount = 0;
    }

    scheduleNextNote() {
        if (!this.isPlaying || !this.currentSong) return;
        
        const noteData = this.currentSong.notes[this.currentNoteIndex];
        const elapsed = performance.now() - this.startTime;
        const delay = noteData.time - elapsed;
        
        if (delay > 0) {
            setTimeout(() => {
                if (this.isPlaying) {
                    this.showExpectedNote(noteData);
                }
            }, delay);
        } else {
            // Already should have shown this note
            this.showExpectedNote(noteData);
        }
    }

    showExpectedNote(noteData) {
        this.currentExpectedNote = noteData.note;
        this.waitingForNote = true;
        this.onNoteChange(noteData.note, 'expected');
        
        // Set timeout for note expiration
        setTimeout(() => {
            if (this.waitingForNote && this.currentNoteIndex === this.currentNoteIndex) {
                // User didn't play in time - count as wrong
                this.handleMiss();
            }
        }, noteData.duration + 500); // grace period
    }

    handleNoteInput(inputNote) {
        if (!this.isPlaying || !this.waitingForNote) return;
        
        const expectedNote = this.currentExpectedNote;
        
        // Normalize note names for comparison (remove # handling)
        const normalizeNote = (n) => n.replace('#', '').replace('b', '');
        const expectedNormalized = normalizeNote(expectedNote);
        const inputNormalized = normalizeNote(inputNote);
        
        // Exact match or enharmonic equivalent
        if (expectedNote === inputNote || expectedNormalized === inputNormalized) {
            this.handleCorrect();
        } else {
            this.handleWrong(inputNote);
        }
    }

    handleCorrect() {
        this.correctCount++;
        this.waitingForNote = false;
        this.onCorrect(this.currentExpectedNote);
        
        this.advanceToNextNote();
    }

    handleWrong(inputNote) {
        this.wrongCount++;
        this.onWrong(inputNote, this.currentExpectedNote);
    }

    handleMiss() {
        this.wrongCount++;
        this.onWrong(null, this.currentExpectedNote);
        this.waitingForNote = false;
        this.advanceToNextNote();
    }

    advanceToNextNote() {
        this.currentNoteIndex++;
        
        if (this.currentNoteIndex >= this.currentSong.notes.length) {
            this.finish();
        } else {
            this.scheduleNextNote();
        }
    }

    finish() {
        this.isPlaying = false;
        const accuracy = this.totalNotes > 0 
            ? Math.round((this.correctCount / this.totalNotes) * 100) 
            : 0;
        console.log(`Song finished! Correct: ${this.correctCount}/${this.totalNotes} (${accuracy}%)`);
    }

    getStats() {
        const total = this.correctCount + this.wrongCount;
        const accuracy = total > 0 ? Math.round((this.correctCount / total) * 100) : 0;
        
        return {
            correct: this.correctCount,
            wrong: this.wrongCount,
            total: this.totalNotes,
            accuracy: accuracy
        };
    }

    getCurrentExpectedNote() {
        return this.currentExpectedNote || null;
    }
}