// lib/audio/soundEngine.ts
// Redline Garage - High-Polish WebAudio Engine with Multi-Layered Sound Synthesis & Dynamics Limiter

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.22; // 默认主音量 22%
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  // 引擎持续音源节点 (低频胸腔感多振荡器叠层)
  private engineRunning: boolean = false;
  private osc1: OscillatorNode | null = null;      // 基频 -4 cents
  private osc2: OscillatorNode | null = null;      // 基频 +4 cents
  private oscSub: OscillatorNode | null = null;   // 低八度 0.5x
  private oscDeep: OscillatorNode | null = null;  // 超低频 0.25x
  private engineFilter: BiquadFilterNode | null = null;
  private enginePostFilter: BiquadFilterNode | null = null; // 6.5kHz 柔和去毛刺
  private engineGain: GainNode | null = null;

  // 烧胎双层合成节点 (A: 啸叫带通 + LFO; B: 低频地面摩擦)
  private burnoutSquealSource: AudioBufferSourceNode | null = null;
  private burnoutSquealFilter: BiquadFilterNode | null = null;
  private burnoutSquealGain: GainNode | null = null;
  private burnoutRumbleSource: AudioBufferSourceNode | null = null;
  private burnoutRumbleGain: GainNode | null = null;
  private burnoutLfo: OscillatorNode | null = null;
  private burnoutLfoGain: GainNode | null = null;
  private burnoutMasterGain: GainNode | null = null;

  // 氮气气流节点
  private nosSource: AudioBufferSourceNode | null = null;
  private nosGain: GainNode | null = null;

  // 引擎动态状态
  private lastThrottle: number = 0;
  private lastPopTime: number = 0;

  // 初始化 AudioContext
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

      // 1. 总限幅压缩器 (Limiter & Dynamics Compressor)，彻底防止削波与爆音
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(14, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);

      // 2. 主增益节点
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);

      // 链路: masterGain -> compressor -> destination
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

  // =========================================================================
  // 1. 引擎音效系统 (低频胸腔感、双失谐锯齿、低八度、去毛刺滤波器)
  // =========================================================================
  public startEngineSound(soundProfile: "muscle_v8" | "tuner_i4" | "super_v12" | "ev_whine" = "muscle_v8") {
    this.init();
    if (!this.ctx || this.engineRunning || !this.masterGain) return;

    this.engineRunning = true;
    const now = this.ctx.currentTime;

    // 主动态低通滤波器
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = "lowpass";
    this.engineFilter.frequency.setValueAtTime(450, now);
    this.engineFilter.Q.setValueAtTime(0.85, now);

    // 6.5kHz 后级柔和低通：抹平高频毛刺与数字蜂鸣感
    this.enginePostFilter = this.ctx.createBiquadFilter();
    this.enginePostFilter.type = "lowpass";
    this.enginePostFilter.frequency.setValueAtTime(6500, now);
    this.enginePostFilter.Q.setValueAtTime(0.7, now);

    // 引擎主增益
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.001, now);
    this.engineGain.gain.linearRampToValueAtTime(0.09, now + 0.25);

    if (soundProfile === "ev_whine") {
      // 电机音色：正弦波 + 三角波平滑叠加，频率严控在 430Hz 以内
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sine";
      this.osc1.frequency.setValueAtTime(65, now);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "triangle";
      this.osc2.frequency.setValueAtTime(130, now);

      this.osc1.connect(this.engineFilter);
      this.osc2.connect(this.engineFilter);
      this.osc1.start(now);
      this.osc2.start(now);
    } else {
      // 内燃机：两只 ±4 cents 失谐锯齿在基频 + 一只低八度 0.5x 锯齿 + 一只 0.25x 深沉正弦/方波
      const idleBase = soundProfile === "muscle_v8" ? 32 : soundProfile === "super_v12" ? 38 : 34;

      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sawtooth";
      this.osc1.frequency.setValueAtTime(idleBase, now);
      this.osc1.detune.setValueAtTime(-4, now);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "sawtooth";
      this.osc2.frequency.setValueAtTime(idleBase, now);
      this.osc2.detune.setValueAtTime(4, now);

      this.oscSub = this.ctx.createOscillator();
      this.oscSub.type = "sawtooth";
      this.oscSub.frequency.setValueAtTime(idleBase * 0.5, now);

      this.oscDeep = this.ctx.createOscillator();
      this.oscDeep.type = soundProfile === "muscle_v8" ? "square" : "sine";
      this.oscDeep.frequency.setValueAtTime(idleBase * 0.25, now);

      this.osc1.connect(this.engineFilter);
      this.osc2.connect(this.engineFilter);
      this.oscSub.connect(this.engineFilter);
      this.oscDeep.connect(this.engineFilter);

      this.osc1.start(now);
      this.osc2.start(now);
      this.oscSub.start(now);
      this.oscDeep.start(now);
    }

    this.engineFilter.connect(this.enginePostFilter);
    this.enginePostFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
  }

  // 动态更新引擎转速
  public updateEngineRpm(
    rpm: number,
    maxRpm: number = 8000,
    throttle: number = 0.5,
    soundProfile: string = "muscle_v8"
  ) {
    if (!this.ctx || !this.engineRunning || !this.osc1 || !this.engineFilter) return;

    const rawNorm = Math.max(0.05, Math.min(1.15, rpm / maxRpm));
    // 使用 sqrt 曲线：低转速响应饱满，高转速平缓不飙尖
    const norm = Math.sqrt(rawNorm);
    const now = this.ctx.currentTime;

    if (soundProfile === "ev_whine") {
      const baseFreq = 60 + norm * 350; // 封顶 <= 420Hz，杜绝尖啸
      this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
      if (this.osc2) this.osc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.04);
      this.engineFilter.frequency.setTargetAtTime(280 + norm * 1200, now, 0.04);
    } else {
      // 基频封顶：Muscle V8 <= 115Hz, Super V12 <= 155Hz, Tuner <= 135Hz
      const idleBase = soundProfile === "muscle_v8" ? 30 : soundProfile === "super_v12" ? 36 : 32;
      const maxDelta = soundProfile === "muscle_v8" ? 82 : soundProfile === "super_v12" ? 118 : 98;
      const baseFreq = idleBase + norm * maxDelta;

      this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.03);
      if (this.osc2) this.osc2.frequency.setTargetAtTime(baseFreq, now, 0.03);
      if (this.oscSub) this.oscSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.03);
      if (this.oscDeep) this.oscDeep.frequency.setTargetAtTime(baseFreq * 0.25, now, 0.03);

      // 主滤波器：280Hz - 1800Hz，浑厚温暖
      const filterFreq = 280 + norm * 1100 + throttle * 400;
      this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.03);
    }

    if (this.engineGain) {
      let gainVal = 0.07 + throttle * 0.06 + norm * 0.03;

      // 1. 怠速不稳呼吸感 (Idle Cam Lope): 9Hz 慢速微调
      if (rawNorm <= 0.18 && throttle <= 0.05) {
        const lope = 1.0 + Math.sin(now * 9 * Math.PI * 2) * 0.18;
        gainVal *= lope;
      }

      // 2. 红线断油切断抖动 (Rev Limiter 25Hz Flutter)
      if (rpm >= maxRpm - 120) {
        const flutter = Math.sin(now * 25 * Math.PI * 2) > 0 ? 1.0 : 0.45;
        gainVal *= flutter;
      }

      this.engineGain.gain.setTargetAtTime(Math.min(0.18, gainVal), now, 0.02);
    }

    // 3. 收油降转速排气微爆音 (Decel Exhaust Burble / Overrun Pops)
    if (this.lastThrottle > 0.6 && throttle < 0.15 && now - this.lastPopTime > 0.45) {
      this.lastPopTime = now;
      this.playShiftPop();
    }
    this.lastThrottle = throttle;
  }

  // 停止引擎声音
  public stopEngineSound() {
    if (!this.ctx || !this.engineRunning) return;
    try {
      const now = this.ctx.currentTime;
      if (this.engineGain) {
        this.engineGain.gain.setTargetAtTime(0.0001, now, 0.06);
      }
      setTimeout(() => {
        try {
          this.osc1?.stop();
          this.osc2?.stop();
          this.oscSub?.stop();
          this.oscDeep?.stop();
          this.osc1?.disconnect();
          this.osc2?.disconnect();
          this.oscSub?.disconnect();
          this.oscDeep?.disconnect();
          this.engineFilter?.disconnect();
          this.enginePostFilter?.disconnect();
          this.engineGain?.disconnect();
        } catch (e) {}
        this.osc1 = null;
        this.osc2 = null;
        this.oscSub = null;
        this.oscDeep = null;
        this.engineFilter = null;
        this.enginePostFilter = null;
        this.engineGain = null;
        this.engineRunning = false;
      }, 80);
    } catch (e) {
      this.engineRunning = false;
    }
  }

  // =========================================================================
  // 2. 烧胎双层合成 (Layer A: 1400Hz 带通 + 10Hz LFO 啸叫; Layer B: 200Hz 低通抓地轰鸣)
  // =========================================================================
  public updateBurnoutSound(intensity: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    if (intensity > 0.05) {
      if (!this.burnoutMasterGain) {
        this.burnoutMasterGain = this.ctx.createGain();
        this.burnoutMasterGain.gain.setValueAtTime(0.001, now);
        this.burnoutMasterGain.connect(this.masterGain);

        // 生成白噪声 Buffer
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        // Layer A: 轮胎啸叫 (高 Q 带通 + LFO 颤音)
        this.burnoutSquealSource = this.ctx.createBufferSource();
        this.burnoutSquealSource.buffer = noiseBuffer;
        this.burnoutSquealSource.loop = true;

        this.burnoutSquealFilter = this.ctx.createBiquadFilter();
        this.burnoutSquealFilter.type = "bandpass";
        this.burnoutSquealFilter.frequency.setValueAtTime(1400, now);
        this.burnoutSquealFilter.Q.setValueAtTime(9.5, now);

        // LFO 晃动中心频率 (10Hz 调制 ±450Hz)
        this.burnoutLfo = this.ctx.createOscillator();
        this.burnoutLfo.type = "sine";
        this.burnoutLfo.frequency.setValueAtTime(10, now);

        this.burnoutLfoGain = this.ctx.createGain();
        this.burnoutLfoGain.gain.setValueAtTime(450, now);
        this.burnoutLfo.connect(this.burnoutLfoGain);
        this.burnoutLfoGain.connect(this.burnoutSquealFilter.frequency);
        this.burnoutLfo.start(now);

        this.burnoutSquealGain = this.ctx.createGain();
        this.burnoutSquealGain.gain.setValueAtTime(0.035, now);

        this.burnoutSquealSource.connect(this.burnoutSquealFilter);
        this.burnoutSquealFilter.connect(this.burnoutSquealGain);
        this.burnoutSquealGain.connect(this.burnoutMasterGain);
        this.burnoutSquealSource.start(now);

        // Layer B: 低频摩擦沥青轰鸣 (200Hz 低通)
        this.burnoutRumbleSource = this.ctx.createBufferSource();
        this.burnoutRumbleSource.buffer = noiseBuffer;
        this.burnoutRumbleSource.loop = true;

        const rumbleFilter = this.ctx.createBiquadFilter();
        rumbleFilter.type = "lowpass";
        rumbleFilter.frequency.setValueAtTime(200, now);
        rumbleFilter.Q.setValueAtTime(1.0, now);

        this.burnoutRumbleGain = this.ctx.createGain();
        this.burnoutRumbleGain.gain.setValueAtTime(0.025, now);

        this.burnoutRumbleSource.connect(rumbleFilter);
        rumbleFilter.connect(this.burnoutRumbleGain);
        this.burnoutRumbleGain.connect(this.burnoutMasterGain);
        this.burnoutRumbleSource.start(now);
      }

      const clampedIntensity = Math.min(1.0, intensity);
      this.burnoutMasterGain.gain.setTargetAtTime(clampedIntensity * 0.055, now, 0.04);
    } else if (this.burnoutMasterGain) {
      this.burnoutMasterGain.gain.setTargetAtTime(0.0001, now, 0.06);
    }
  }

  public stopBurnoutSound() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (this.burnoutMasterGain) {
        this.burnoutMasterGain.gain.setTargetAtTime(0.0001, now, 0.04);
      }
      setTimeout(() => {
        try {
          this.burnoutSquealSource?.stop();
          this.burnoutRumbleSource?.stop();
          this.burnoutLfo?.stop();
          this.burnoutSquealSource?.disconnect();
          this.burnoutRumbleSource?.disconnect();
          this.burnoutLfo?.disconnect();
          this.burnoutLfoGain?.disconnect();
          this.burnoutSquealFilter?.disconnect();
          this.burnoutSquealGain?.disconnect();
          this.burnoutRumbleGain?.disconnect();
          this.burnoutMasterGain?.disconnect();
        } catch (e) {}
        this.burnoutSquealSource = null;
        this.burnoutRumbleSource = null;
        this.burnoutLfo = null;
        this.burnoutLfoGain = null;
        this.burnoutSquealFilter = null;
        this.burnoutSquealGain = null;
        this.burnoutRumbleGain = null;
        this.burnoutMasterGain = null;
      }, 50);
    } catch (e) {}
  }

  // =========================================================================
  // 3. 氮气气流声 (NOS)
  // =========================================================================
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
          data[i] = (Math.random() * 2 - 1) * 0.35;
        }
        this.nosSource = this.ctx.createBufferSource();
        this.nosSource.buffer = buffer;
        this.nosSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(2400, now);
        filter.Q.setValueAtTime(1.5, now);

        this.nosGain = this.ctx.createGain();
        this.nosGain.gain.setValueAtTime(0.001, now);

        this.nosSource.connect(filter);
        filter.connect(this.nosGain);
        this.nosGain.connect(this.masterGain);
        this.nosSource.start(now);
      }
      this.nosGain.gain.setTargetAtTime(0.065, now, 0.04);
    } else if (this.nosGain) {
      this.nosGain.gain.setTargetAtTime(0.0001, now, 0.06);
    }
  }

  public stopNosSound() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (this.nosGain) {
        this.nosGain.gain.setTargetAtTime(0.0001, now, 0.04);
      }
      setTimeout(() => {
        try {
          this.nosSource?.stop();
          this.nosSource?.disconnect();
          this.nosGain?.disconnect();
        } catch (e) {}
        this.nosSource = null;
        this.nosGain = null;
      }, 50);
    } catch (e) {}
  }

  // =========================================================================
  // 4. 全局停音法 (Stop All Race Sounds - 进成绩页/回车库零残留)
  // =========================================================================
  public stopAllRaceSounds() {
    this.stopEngineSound();
    this.stopBurnoutSound();
    this.stopNosSound();
  }

  // =========================================================================
  // 5. 换挡爆震 / 涡轮泄压 (Pop & Bang / BOV)
  // =========================================================================
  public playShiftPop() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 低频回火重击
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(22, now + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.11);

    // 涡轮泄气气流
    const bufferSize = Math.round(this.ctx.sampleRate * 0.18);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(2400, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.05, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);
  }

  // 圣诞树发车倒数提示音
  public playCountdownBeep(isGreen: boolean = false) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    const freq = isGreen ? 1200 : 640;
    osc.frequency.setValueAtTime(freq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isGreen ? 0.10 : 0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (isGreen ? 0.35 : 0.18));

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + (isGreen ? 0.35 : 0.18));
  }

  // 零件吸附/改装机械声
  public playSnapSound() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 胜利冲线欢呼和弦
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
      gain.gain.setValueAtTime(0.06, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  }
}

export const soundEngine = new SoundEngine();
