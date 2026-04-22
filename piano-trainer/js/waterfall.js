// Waterfall Visualization
class Waterfall {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.notes = [];
        this.scrollSpeed = 2; // pixels per frame
        this.noteHeight = 40;
        this.noteWidth = 60;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.colors = {
            expected: 'rgba(100, 200, 255, 0.8)',
            correct: 'rgba(100, 255, 100, 0.9)',
            wrong: 'rgba(255, 100, 100, 0.9)',
            future: 'rgba(150, 150, 150, 0.4)'
        };
        
        this.animationId = null;
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = 200;
    }

    start() {
        this.notes = [];
        this.animate();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    clear() {
        this.notes = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    addNote(noteName, type = 'expected') {
        const noteData = {
            name: noteName,
            type: type,
            y: -this.noteHeight,
            opacity: 1
        };
        this.notes.push(noteData);
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Move and draw notes
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];
            note.y += this.scrollSpeed;
            
            // Remove if below canvas
            if (note.y > this.canvas.height) {
                this.notes.splice(i, 1);
                continue;
            }
            
            // Draw note block
            this.drawNote(note);
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawNote(note) {
        const x = this.canvas.width / 2 - this.noteWidth / 2;
        const y = note.y;
        
        // Calculate opacity based on position (fade out as it approaches bottom)
        const fadeStart = this.canvas.height * 0.7;
        let opacity = 1;
        if (y > fadeStart) {
            opacity = 1 - ((y - fadeStart) / (this.canvas.height - fadeStart));
        }
        
        // Get color based on type
        let color;
        switch (note.type) {
            case 'correct':
                color = this.colors.correct;
                break;
            case 'wrong':
                color = this.colors.wrong;
                break;
            default:
                color = this.colors.expected;
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        
        // Draw rounded rectangle
        this.roundRect(x, y, this.noteWidth, this.noteHeight - 5, 8);
        
        // Fill
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        // Border
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Text
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(note.name, x + this.noteWidth / 2, y + (this.noteHeight - 5) / 2);
        
        this.ctx.restore();
    }

    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    setScrollSpeed(speed) {
        this.scrollSpeed = speed;
    }
}