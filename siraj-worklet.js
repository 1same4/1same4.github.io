/* سراج لايف: يلتقط المايك ويحوّله 16kHz PCM16 قطع صغيرة (40ms) للـWebSocket */
class SirCap extends AudioWorkletProcessor {
  constructor() { super(); this.r = sampleRate / 16000; this.pos = 0; this.sum = 0; this.cnt = 0; this.out = []; }
  process(inputs) {
    const c = inputs[0] && inputs[0][0];
    if (!c) return true;
    for (let i = 0; i < c.length; i++) {
      this.sum += c[i]; this.cnt++; this.pos += 1;
      if (this.pos >= this.r) {
        this.pos -= this.r;
        this.out.push(this.sum / this.cnt); this.sum = 0; this.cnt = 0;
        if (this.out.length >= 640) {
          const b = new Int16Array(640);
          for (let k = 0; k < 640; k++) { const x = Math.max(-1, Math.min(1, this.out[k])); b[k] = x < 0 ? x * 32768 : x * 32767; }
          this.port.postMessage(b.buffer, [b.buffer]);
          this.out = [];
        }
      }
    }
    return true;
  }
}
registerProcessor('sir-cap', SirCap);
