export class SoundManager {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1, slideTo?: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  spawn() { this.playTone(600, 'square', 0.1, 0.05, 800); }
  dig() { this.playTone(150, 'sawtooth', 0.05, 0.02); }
  build() { this.playTone(300, 'triangle', 0.05, 0.03); }
  explode() {
    if (!this.ctx) return;
    // Ruido blanco para la explosión
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }
  exit() { 
    this.playTone(440, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(880, 'sine', 0.2, 0.1), 100);
  }
  click() { this.playTone(1000, 'sine', 0.05, 0.05); }
  death() { this.playTone(200, 'sawtooth', 0.3, 0.1, 50); }
  block() { this.playTone(350, 'square', 0.08, 0.06); }
  win() {
    this.playTone(523, 'sine', 0.15, 0.1);
    setTimeout(() => this.playTone(659, 'sine', 0.15, 0.1), 150);
    setTimeout(() => this.playTone(784, 'sine', 0.2, 0.1), 300);
  }
  lose() { this.playTone(300, 'sawtooth', 0.4, 0.1, 100); }
}

export const soundManager = new SoundManager();