let audio: AudioContext | null = null;
let muted = false;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audio) audio = new AudioContext();
  if (audio.state === 'suspended') void audio.resume();
  return audio;
}

function tone(frequency: number, duration: number, type: OscillatorType, gainValue: number, delay = 0) {
  if (muted) return;
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
  tone(880, 0.07, 'square', 0.05);
  tone(1320, 0.04, 'square', 0.02, 0.02);
}

export function playTock() {
  tone(440, 0.05, 'square', 0.02);
}

export function playLock() {
  tone(740, 0.06, 'square', 0.04);
  tone(988, 0.12, 'triangle', 0.045, 0.05);
}

export function playTimesUp() {
  stopQuestionBed();
  tone(392, 0.1, 'square', 0.045);
  tone(311, 0.14, 'square', 0.04, 0.1);
  tone(233, 0.28, 'triangle', 0.05, 0.22);
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

export function musicMuted(): boolean {
  return muted;
}

export function setMusicMuted(next: boolean) {
  muted = next;
  if (muted) {
    stopMusic();
    stopQuestionBed();
  }
}

function hat(delay = 0) {
  if (muted) return;
  const ctx = context();
  if (!ctx) return;
  const duration = 0.05;
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1400;
  const gain = ctx.createGain();
  const start = ctx.currentTime + delay;
  gain.gain.setValueAtTime(0.03, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(start);
}

export function startLobbyMusic() {
  if (muted || loop !== null) return;
  stopQuestionBed();
  loop = window.setInterval(() => {
    const note = melody[step % melody.length];
    tone(note, 0.24, 'triangle', 0.04);
    tone(note / 2, 0.3, 'sine', 0.018);
    if (step % 2 === 0) hat();
    step += 1;
  }, 340);
}

export function stopMusic() {
  if (loop !== null) window.clearInterval(loop);
  loop = null;
}

const bedNotes = [196, 220, 247, 220, 175, 196, 165, 196];
let bed: number | null = null;
let bedStep = 0;

export function startQuestionBed() {
  if (muted || bed !== null) return;
  stopMusic();
  bed = window.setInterval(() => {
    const note = bedNotes[bedStep % bedNotes.length];
    tone(note, 0.28, 'sine', 0.035);
    tone(note * 2, 0.08, 'triangle', 0.015, 0.08);
    if (bedStep % 2 === 0) hat();
    bedStep += 1;
  }, 420);
}

export function stopQuestionBed() {
  if (bed !== null) window.clearInterval(bed);
  bed = null;
}

export function playPodium() {
  stopMusic();
  stopQuestionBed();
  if (muted) return;
  [523, 659, 784, 1046].forEach((note, index) => tone(note, 0.28, 'triangle', 0.06, index * 0.14));
  tone(784, 0.5, 'sine', 0.04, 0.62);
}
