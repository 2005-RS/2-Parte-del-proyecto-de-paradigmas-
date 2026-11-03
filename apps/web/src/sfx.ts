let audio: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audio) audio = new AudioContext();
  if (audio.state === 'suspended') void audio.resume();
  return audio;
}

function tone(frequency: number, duration: number, type: OscillatorType, gainValue: number, delay = 0) {
  const ctx = context();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => {
    void context()?.resume();
  });
}

export function playTick() {
  tone(880, 0.08, 'square', 0.04);
}

export function playJoin() {
  tone(520, 0.09, 'triangle', 0.05);
  tone(780, 0.12, 'triangle', 0.04, 0.07);
}

export function playCorrect() {
  tone(523, 0.12, 'triangle', 0.06);
  tone(659, 0.12, 'triangle', 0.06, 0.1);
  tone(784, 0.22, 'triangle', 0.07, 0.2);
}

export function playWrong() {
  tone(196, 0.22, 'sawtooth', 0.03);
  tone(146, 0.28, 'square', 0.03, 0.12);
}

export function playGo() {
  tone(392, 0.08, 'square', 0.04);
  tone(523, 0.08, 'square', 0.04, 0.08);
  tone(659, 0.16, 'square', 0.05, 0.16);
}

const melody = [392, 494, 587, 494, 440, 587, 523, 392, 349, 440, 523, 440];
let loop: number | null = null;
let step = 0;
let muted = false;

export function musicMuted(): boolean {
  return muted;
}

export function setMusicMuted(next: boolean) {
  muted = next;
  if (muted) stopMusic();
}

export function startLobbyMusic() {
  if (muted || loop !== null) return;
  loop = window.setInterval(() => {
    const note = melody[step % melody.length];
    tone(note, 0.22, 'triangle', 0.045);
    if (step % 4 === 0) tone(note / 2, 0.28, 'sine', 0.02);
    step += 1;
  }, 320);
}

export function stopMusic() {
  if (loop !== null) window.clearInterval(loop);
  loop = null;
}

export function playPodium() {
  stopMusic();
  if (muted) return;
  [523, 659, 784, 1046].forEach((note, index) => tone(note, 0.28, 'triangle', 0.06, index * 0.14));
  tone(784, 0.5, 'sine', 0.04, 0.62);
}
