// lib/audio/soundEngine.ts
// Redline Garage - High-Impact Procedural WebAudio Sound Synthesizer

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private masterGain: GainNode | null = null;

  // 引擎持续音源节点
  private engineRunning: boolean = false;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // 烧胎轮胎噪声节点
  private burnoutNode: AudioNode | null = null;
  private burnoutGain: GainNode | null = null;

  // 氮气气流节点
  private nosGain: GainNode | null = null;

  // 初始化 AudioContext (必须由用户手势交互触发)
  public init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("WebAudio not supported or blocked:", e);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  // 启动持续引擎声音
  public startEngineSound(soundProfile: "muscle_v8" | "tuner_i4" | "super_v12" | "ev_whine" = "muscle_v8") {
    this.init();
    if (!this.ctx || this.engineRunning || !this.masterGain) return;

    this.engineRunning = true;
    const now = this.ctx.currentTime;

    // 创建主滤波器
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = "lowpass";
    this.engineFilter.frequency.setValueAtTime(800, now);
    this.engineFilter.Q.setValueAtTime(3.5, now);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.01, now);
    this.engineGain.gain.linearRampToValueAtTime(0.35, now + 0.3);

    if (soundProfile === "ev_whine") {
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sine";
      this.osc1.frequency.setValueAtTime(120, now);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "triangle";
      this.osc2.frequency.setValueAtTime(240, now);

      this.osc1.connect(this.engineFilter);
      this.osc2.connect(this.engineFilter);
      this.osc1.start(now);
      this.osc2.start(now);
    } else {
      // 传统内燃机
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sawtooth";
      this.osc1.frequency.setValueAtTime(soundProfile === "muscle_v8" ? 42 : 55, now);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "sawtooth";
      this.osc2.frequency.setValueAtTime(soundProfile === "muscle_v8" ? 85 : 110, now);

      this.oscSub = this.ctx.createOscillator();
      this.oscSub.type = "square";
      this.oscSub.frequency.setValueAtTime(soundProfile === "muscle_v8" ? 21 : 30, now);

      this.osc1.connect(this.engineFilter);
      this.osc2.connect(this.engineFilter);
      this.oscSub.connect(this.engineFilter);

      this.osc1.start(now);
      this.osc2.start(now);
      this.oscSub.start(now);
    }

    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
  }

  // 更新引擎转速音调
  public updateEngineRpm(rpm: number, maxRpm: number = 8000, throttle: number = 0.5, soundProfile: string = "muscle_v8") {
    if (!this.ctx || !this.engineRunning || !this.osc1 || !this.engineFilter) return;

    const norm = Math.max(0.08, Math.min(1.2, rpm / maxRpm));
    const now = this.ctx.currentTime;

    if (soundProfile === "ev_whine") {
      const baseFreq = 80 + norm * 1400;
      this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
      if (this.osc2) this.osc2.frequency.setTargetAtTime(baseFreq * 2, now, 0.04);
      this.engineFilter.frequency.setTargetAtTime(300 + norm * 2800, now, 0.04);
    } else {
      const baseFreq = (soundProfile === "muscle_v8" ? 38 : 50) + norm * (soundProfile === "super_v12" ? 380 : 260);
      this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.03);
      if (this.osc2) this.osc2.frequency.setTargetAtTime(baseFreq * (soundProfile === "super_v12" ? 2.5 : 2.0), now, 0.03);
      if (this.oscSub) this.oscSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.03);

      const filterFreq = 400 + norm * 3500 + throttle * 1200;
      this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.03);
    }

    if (this.engineGain) {
      const gainVal = 0.18 + throttle * 0.32 + norm * 0.2;
      this.engineGain.gain.setTargetAtTime(gainVal, now, 0.03);
    }
  }

  public stopEngineSound() {
    if (!this.ctx || !this.engineRunning) return;
    try {
      const now = this.ctx.currentTime;
      if (this.engineGain) {
        this.engineGain.gain.setTargetAtTime(0.001, now, 0.1);
      }
      setTimeout(() => {
        try {
          this.osc1?.stop();
          this.osc2?.stop();
          this.oscSub?.stop();
          this.osc1?.disconnect();
          this.osc2?.disconnect();
          this.oscSub?.disconnect();
          this.engineFilter?.disconnect();
          this.engineGain?.disconnect();
        } catch (e) {}
        this.osc1 = null;
        this.osc2 = null;
        this.oscSub = null;
        this.engineFilter = null;
        this.engineGain = null;
        this.engineRunning = false;
      }, 150);
    } catch (e) {
      this.engineRunning = false;
    }
  }

  // 烧胎打滑尖叫音效
  public updateBurnoutSound(intensity: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    if (intensity > 0.05) {
      if (!this.burnoutGain) {
        // 创建白噪声生成器
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1400, now);
        filter.Q.setValueAtTime(4.0, now);

        this.burnoutGain = this.ctx.createGain();
        this.burnoutGain.gain.setValueAtTime(0.01, now);

        whiteNoise.connect(filter);
        filter.connect(this.burnoutGain);
        this.burnoutGain.connect(this.masterGain);
        whiteNoise.start(now);
        this.burnoutNode = whiteNoise;
      }
      this.burnoutGain.gain.setTargetAtTime(Math.min(0.4, intensity * 0.45), now, 0.05);
    } else if (this.burnoutGain) {
      this.burnoutGain.gain.setTargetAtTime(0.001, now, 0.1);
    }
  }

  // 换挡爆震 / 排气回火枪声 (Pop & Bang)
  public playShiftPop() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 低频爆炸冲击
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);

    // 涡轮泄压泄气声 (BOV Tshhh)
    const bufferSize = Math.round(this.ctx.sampleRate * 0.25);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(2500, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);
  }

  // 氮气喷射嘶吼音
  public playNosBurst(active: boolean) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    if (active) {
      if (!this.nosGain) {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.6;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(3200, now);
        filter.Q.setValueAtTime(2.0, now);

        this.nosGain = this.ctx.createGain();
        this.nosGain.gain.setValueAtTime(0.01, now);
        noise.connect(filter);
        filter.connect(this.nosGain);
        this.nosGain.connect(this.masterGain);
        noise.start(now);
      }
      this.nosGain.gain.setTargetAtTime(0.35, now, 0.05);
    } else if (this.nosGain) {
      this.nosGain.gain.setTargetAtTime(0.001, now, 0.1);
    }
  }

  // 圣诞树倒数计时音效
  public playCountdownBeep(isGreen: boolean = false) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    const freq = isGreen ? 1760 : 880; // A6 或 A5
    osc.frequency.setValueAtTime(freq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isGreen ? 0.5 : 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGreen ? 0.6 : 0.25));

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + (isGreen ? 0.6 : 0.25));
  }

  // 车库零件吸附/扳手机械声 (Snap / Wrench ratchet)
  public playSnapSound() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 金属撞击咔哒声
    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.06);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // 冲线庆祝欢呼与胜利和弦
  public playVictoryFanfare(isPB: boolean = false) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const notes = isPB ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25]; // C大调或A大调
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.8);
    });
  }
}

export const soundEngine = new SoundEngine();
