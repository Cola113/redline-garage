// lib/audio/soundEngine.ts
// Redline Garage - Balanced Procedural WebAudio Synthesizer with Dynamics Compressor Limiter

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.22; // 默认主音量限制在 22%，绝不刺耳
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

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

      // 1. 创建总限幅压缩器 (Limiter & Dynamics Compressor)，彻底防止多音源叠加导致的爆音/破音/削波
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime); // -14dB 启动压缩
      this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(14, this.ctx.currentTime); // 强力防爆音比率
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime); // 3ms 快速响应
      this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);

      // 2. 创建主增益节点
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);

      // 音频链路: 各种音源 -> masterGain -> compressor -> destination
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    } catch (e) {
      console.warn("WebAudio not supported or blocked:", e);
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
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
    this.engineFilter.frequency.setValueAtTime(650, now);
    this.engineFilter.Q.setValueAtTime(2.5, now);

    // 引擎增益：平滑柔和，不炸耳
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.001, now);
    this.engineGain.gain.linearRampToValueAtTime(0.08, now + 0.3);

    if (soundProfile === "ev_whine") {
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sine";
      this.osc1.frequency.setValueAtTime(110, now);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "triangle";
      this.osc2.frequency.setValueAtTime(220, now);

      this.osc1.connect(this.engineFilter);
      this.osc2.connect(this.engineFilter);
      this.osc1.start(now);
      this.osc2.start(now);
    } else {
      // 传统内燃机：双锯齿波 + 低频脉冲方波
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sawtooth";
      this.osc1.frequency.setValueAtTime(soundProfile === "muscle_v8" ? 38 : 48, now);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "sawtooth";
      this.osc2.frequency.setValueAtTime(soundProfile === "muscle_v8" ? 76 : 96, now);

      this.oscSub = this.ctx.createOscillator();
      this.oscSub.type = "square";
      this.oscSub.frequency.setValueAtTime(soundProfile === "muscle_v8" ? 19 : 24, now);

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

    const norm = Math.max(0.08, Math.min(1.15, rpm / maxRpm));
    const now = this.ctx.currentTime;

    if (soundProfile === "ev_whine") {
      const baseFreq = 70 + norm * 1200;
      this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
      if (this.osc2) this.osc2.frequency.setTargetAtTime(baseFreq * 2, now, 0.04);
      this.engineFilter.frequency.setTargetAtTime(250 + norm * 2200, now, 0.04);
    } else {
      const baseFreq = (soundProfile === "muscle_v8" ? 34 : 44) + norm * (soundProfile === "super_v12" ? 320 : 220);
      this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.03);
      if (this.osc2) this.osc2.frequency.setTargetAtTime(baseFreq * (soundProfile === "super_v12" ? 2.2 : 1.8), now, 0.03);
      if (this.oscSub) this.oscSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.03);

      const filterFreq = 350 + norm * 2600 + throttle * 800;
      this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.03);
    }

    if (this.engineGain) {
      // 适度临场感：0.06 ~ 0.16 之间，绝不压迫耳膜
      const gainVal = 0.06 + throttle * 0.07 + norm * 0.04;
      this.engineGain.gain.setTargetAtTime(gainVal, now, 0.03);
    }
  }

  public stopEngineSound() {
    if (!this.ctx || !this.engineRunning) return;
    try {
      const now = this.ctx.currentTime;
      if (this.engineGain) {
        this.engineGain.gain.setTargetAtTime(0.001, now, 0.08);
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
      }, 100);
    } catch (e) {
      this.engineRunning = false;
    }
  }

  // 烧胎打滑尖叫音效 (白噪声带通，音量克制在 0.10 内)
  public updateBurnoutSound(intensity: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    if (intensity > 0.05) {
      if (!this.burnoutGain) {
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
        filter.frequency.setValueAtTime(1250, now);
        filter.Q.setValueAtTime(3.2, now);

        this.burnoutGain = this.ctx.createGain();
        this.burnoutGain.gain.setValueAtTime(0.005, now);

        whiteNoise.connect(filter);
        filter.connect(this.burnoutGain);
        this.burnoutGain.connect(this.masterGain);
        whiteNoise.start(now);
        this.burnoutNode = whiteNoise;
      }
      this.burnoutGain.gain.setTargetAtTime(Math.min(0.1, intensity * 0.1), now, 0.05);
    } else if (this.burnoutGain) {
      this.burnoutGain.gain.setTargetAtTime(0.001, now, 0.08);
    }
  }

  // 换挡爆震 / 排气回火枪声 (Pop & Bang, 控制在 0.12 内)
  public playShiftPop() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);

    // 涡轮泄压泄气声 (BOV)
    const bufferSize = Math.round(this.ctx.sampleRate * 0.2);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(2200, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.07, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);
  }

  // 氮气喷射嘶吼音 (平稳克制在 0.09)
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
          data[i] = (Math.random() * 2 - 1) * 0.4;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(2800, now);
        filter.Q.setValueAtTime(1.8, now);

        this.nosGain = this.ctx.createGain();
        this.nosGain.gain.setValueAtTime(0.005, now);
        noise.connect(filter);
        filter.connect(this.nosGain);
        this.nosGain.connect(this.masterGain);
        noise.start(now);
      }
      this.nosGain.gain.setTargetAtTime(0.09, now, 0.05);
    } else if (this.nosGain) {
      this.nosGain.gain.setTargetAtTime(0.001, now, 0.08);
    }
  }

  // 圣诞树倒数计时音效 (清脆温和)
  public playCountdownBeep(isGreen: boolean = false) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    const freq = isGreen ? 1500 : 750;
    osc.frequency.setValueAtTime(freq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isGreen ? 0.12 : 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGreen ? 0.45 : 0.2));

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + (isGreen ? 0.45 : 0.2));
  }

  // 车库零件吸附/扳手机械声
  public playSnapSound() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // 冲线庆祝欢呼与胜利和弦
  public playVictoryFanfare(isPB: boolean = false) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const notes = isPB ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.08, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.6);
    });
  }
}

export const soundEngine = new SoundEngine();
