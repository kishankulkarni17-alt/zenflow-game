/**
 * ZENFLOW — A Premium Mini-Game & Mind-Refresh Web Application
 * Complete Vanilla JavaScript Architecture
 * Modules: Storage, Stats, Audio, Games (Bubble Pop, Colour Flow, Memory Tiles, Star Hunt), Breathing Room, UI/App
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. STORAGE & STATE MANAGEMENT
     ========================================================================== */
  const STORAGE_KEY = 'zenflow_v1_data';

  const defaultState = {
    stats: {
      totalSessions: 0,
      totalPlayTimeSeconds: 0,
      totalBubblesPopped: 0,
      totalBreathingMinutes: 0,
      totalBreathingSessions: 0,
      bestScores: {
        bubblePop: 0,
        colourFlow: 0,
        memoryTiles: 0,
        starHunt: 0
      },
      streak: {
        current: 0,
        best: 0,
        lastActiveDate: null // 'YYYY-MM-DD'
      },
      dailySessions: {},
      history: []
    },
    settings: {
      soundEnabled: true,
      volume: 0.5,
      theme: 'dark',
      motion: 'full', // 'full' | 'reduced'
      ambientParticles: true
    }
  };

  class StorageManager {
    static load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return JSON.parse(JSON.stringify(defaultState));
        const parsed = JSON.parse(raw);
        return {
          stats: {
            totalSessions: Number(parsed?.stats?.totalSessions) || 0,
            totalPlayTimeSeconds: Number(parsed?.stats?.totalPlayTimeSeconds) || 0,
            totalBubblesPopped: Number(parsed?.stats?.totalBubblesPopped) || 0,
            totalBreathingMinutes: Number(parsed?.stats?.totalBreathingMinutes) || 0,
            totalBreathingSessions: Number(parsed?.stats?.totalBreathingSessions) || 0,
            bestScores: {
              bubblePop: Number(parsed?.stats?.bestScores?.bubblePop) || 0,
              colourFlow: Number(parsed?.stats?.bestScores?.colourFlow) || 0,
              memoryTiles: Number(parsed?.stats?.bestScores?.memoryTiles) || 0,
              starHunt: Number(parsed?.stats?.bestScores?.starHunt) || 0
            },
            streak: {
              current: Number(parsed?.stats?.streak?.current) || 0,
              best: Number(parsed?.stats?.streak?.best) || 0,
              lastActiveDate: parsed?.stats?.streak?.lastActiveDate || null
            },
            dailySessions: parsed?.stats?.dailySessions || {},
            history: Array.isArray(parsed?.stats?.history) ? parsed.stats.history : []
          },
          settings: {
            soundEnabled: parsed?.settings?.soundEnabled !== false,
            volume: typeof parsed?.settings?.volume === 'number' ? parsed.settings.volume : 0.5,
            theme: parsed?.settings?.theme === 'light' ? 'light' : 'dark',
            motion: parsed?.settings?.motion === 'reduced' ? 'reduced' : 'full',
            ambientParticles: parsed?.settings?.ambientParticles !== false
          }
        };
      } catch (err) {
        console.warn('ZenFlow: LocalStorage load error, reverting to default defaults.', err);
        return JSON.parse(JSON.stringify(defaultState));
      }
    }

    static save(state) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (err) {
        console.error('ZenFlow: Unable to save to LocalStorage', err);
      }
    }

    static reset() {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.error('ZenFlow: Unable to reset LocalStorage', err);
      }
    }
  }

  /* ==========================================================================
     2. AUDIO SYNTHESIZER (WEB AUDIO API)
     ========================================================================== */
  class ZenAudio {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.enabled = true;
      this.volume = 0.5;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
          this.masterGain.connect(this.ctx.destination);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    setVolume(vol) {
      this.volume = Math.max(0, Math.min(1, vol));
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      }
    }

    setEnabled(val) {
      this.enabled = Boolean(val);
    }

    playPop(pitchModifier = 1) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      const startFreq = 480 * pitchModifier;
      const endFreq = 120 * pitchModifier;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.09);
    }

    playTone(freq, duration = 0.35) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    }

    playStarChime(bonus = false) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const baseFreq = bonus ? 880 : 660;

      [baseFreq, baseFreq * 1.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delay = idx * 0.05;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.25, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.22);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + delay);
        osc.stop(now + delay + 0.25);
      });
    }

    playSuccess() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99];
      const now = this.ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + index * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(start);
        osc.stop(start + 0.3);
      });
    }

    playError() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.2);
    }

    playBreathingTone(isInhale) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const freq = isInhale ? 220 : 196;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 2.6);
    }
  }

  /* ==========================================================================
     3. STATS & STREAK MANAGER
     ========================================================================== */
  class StatsManager {
    static getTodayString() {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    static getYesterdayString() {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    static calculateStreak(currentStreak, lastActiveDate, todayDate, yesterdayDate) {
      if (!lastActiveDate) {
        return 1;
      }
      if (lastActiveDate === todayDate) {
        return Math.max(1, currentStreak);
      }
      if (lastActiveDate === yesterdayDate) {
        return currentStreak + 1;
      }
      return 1;
    }

    static recordSession(appState, gameId, gameName, score, durationSec, details) {
      const stats = appState.stats;
      const today = this.getTodayString();
      const yesterday = this.getYesterdayString();

      stats.totalSessions += 1;
      stats.totalPlayTimeSeconds += durationSec;
      stats.dailySessions[today] = (stats.dailySessions[today] || 0) + 1;

      stats.streak.current = this.calculateStreak(
        stats.streak.current,
        stats.streak.lastActiveDate,
        today,
        yesterday
      );
      stats.streak.lastActiveDate = today;
      stats.streak.best = Math.max(stats.streak.best, stats.streak.current);

      let isNewBest = false;
      if (stats.bestScores.hasOwnProperty(gameId)) {
        if (score > stats.bestScores[gameId]) {
          stats.bestScores[gameId] = score;
          isNewBest = true;
        }
      }

      const sessionLog = {
        id: 'ses_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        gameId,
        gameName,
        timestamp: Date.now(),
        score,
        duration: durationSec,
        details
      };
      stats.history.unshift(sessionLog);
      if (stats.history.length > 30) {
        stats.history.pop();
      }

      StorageManager.save(appState);
      return { isNewBest, sessionLog };
    }

    static recordBreathing(appState, minutes) {
      const stats = appState.stats;
      const today = this.getTodayString();
      const yesterday = this.getYesterdayString();

      stats.totalSessions += 1;
      stats.totalBreathingMinutes += minutes;
      stats.totalBreathingSessions += 1;
      stats.totalPlayTimeSeconds += minutes * 60;

      stats.dailySessions[today] = (stats.dailySessions[today] || 0) + 1;

      stats.streak.current = this.calculateStreak(
        stats.streak.current,
        stats.streak.lastActiveDate,
        today,
        yesterday
      );
      stats.streak.lastActiveDate = today;
      stats.streak.best = Math.max(stats.streak.best, stats.streak.current);

      const sessionLog = {
        id: 'ses_br_' + Date.now(),
        gameId: 'breathing',
        gameName: 'Breathing Room',
        timestamp: Date.now(),
        score: `${minutes}m calm`,
        duration: minutes * 60,
        details: `${minutes} minute guided breath cycle`
      };
      stats.history.unshift(sessionLog);
      if (stats.history.length > 30) {
        stats.history.pop();
      }

      StorageManager.save(appState);
      return sessionLog;
    }
  }

  /* ==========================================================================
     4. AMBIENT BACKGROUND PARTICLES CANVAS
     ========================================================================== */
  class AmbientCanvas {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.animId = null;
      this.enabled = true;
      this.width = 0;
      this.height = 0;

      this.init();
    }

    init() {
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.createParticles();
      this.start();
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }

    createParticles() {
      this.particles = [];
      const count = Math.min(35, Math.floor(this.width / 40));
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 2.5 + 1,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          alpha: Math.random() * 0.5 + 0.2,
          color: Math.random() > 0.5 ? '139, 92, 246' : '6, 182, 212'
        });
      }
    }

    start() {
      if (!this.enabled || this.animId) return;
      const animate = () => {
        this.ctx.clearRect(0, 0, this.width, this.height);
        for (const p of this.particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = this.width;
          if (p.x > this.width) p.x = 0;
          if (p.y < 0) p.y = this.height;
          if (p.y > this.height) p.y = 0;

          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          this.ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
          this.ctx.fill();
        }
        this.animId = requestAnimationFrame(animate);
      };
      this.animId = requestAnimationFrame(animate);
    }

    stop() {
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.width, this.height);
      }
    }

    setEnabled(val) {
      this.enabled = Boolean(val);
      if (this.enabled) {
        this.start();
      } else {
        this.stop();
      }
    }
  }

  /* ==========================================================================
     5. MINI-GAME 1: BUBBLE POP
     ========================================================================== */
  class BubblePopGame {
    constructor(app) {
      this.app = app;
      this.stage = document.getElementById('bp-stage');
      this.scoreValEl = document.getElementById('bp-score-val');
      this.timerValEl = document.getElementById('bp-timer-val');
      this.timerBarEl = document.getElementById('bp-timer-bar');
      this.comboValEl = document.getElementById('bp-combo-val');
      this.startOverlay = document.getElementById('bp-start-overlay');
      this.startBtn = document.getElementById('bp-start-btn');
      this.pauseBtn = document.getElementById('bp-pause-btn');
      this.restartBtn = document.getElementById('bp-restart-btn');
      this.iconPause = document.getElementById('bp-icon-pause');
      this.iconPlay = document.getElementById('bp-icon-play');

      this.score = 0;
      this.timeLeft = 30;
      this.totalPopped = 0;
      this.combo = 1;
      this.lastPopTime = 0;
      this.maxCombo = 1;

      this.isRunning = false;
      this.isPaused = false;
      this.timerInterval = null;
      this.spawnInterval = null;
      this.bubbles = [];

      this.initEvents();
    }

    initEvents() {
      this.startBtn.addEventListener('click', () => this.start());
      this.pauseBtn.addEventListener('click', () => this.togglePause());
      this.restartBtn.addEventListener('click', () => this.restart());
    }

    start() {
      this.cleanup();
      this.score = 0;
      this.timeLeft = 30;
      this.totalPopped = 0;
      this.combo = 1;
      this.maxCombo = 1;
      this.lastPopTime = 0;
      this.isRunning = true;
      this.isPaused = false;

      this.updateHUD();
      this.startOverlay.classList.add('hidden');
      this.setPauseIcon(false);

      for (let i = 0; i < 9; i++) {
        this.spawnBubble();
      }

      this.timerInterval = setInterval(() => {
        if (this.isPaused) return;
        this.timeLeft -= 1;
        this.updateHUD();

        if (this.timeLeft <= 0) {
          this.endGame();
        }
      }, 1000);

      this.spawnInterval = setInterval(() => {
        if (this.isPaused || !this.isRunning) return;
        if (this.bubbles.length < 14) {
          this.spawnBubble();
        }
      }, 800);
    }

    togglePause() {
      if (!this.isRunning) return;
      this.isPaused = !this.isPaused;
      this.setPauseIcon(this.isPaused);
      if (this.isPaused) {
        this.app.showToast('Game paused', 'info');
      }
    }

    setPauseIcon(isPaused) {
      if (isPaused) {
        this.iconPause.classList.add('hidden');
        this.iconPlay.classList.remove('hidden');
      } else {
        this.iconPause.classList.remove('hidden');
        this.iconPlay.classList.add('hidden');
      }
    }

    restart() {
      this.cleanup();
      this.start();
    }

    spawnBubble() {
      if (!this.stage) return;
      const rect = this.stage.getBoundingClientRect();
      const stageW = rect.width || 600;
      const stageH = rect.height || 480;

      const rand = Math.random();
      let size, points, colorGrad, pitch;

      if (rand < 0.12) {
        size = 46;
        points = 50;
        colorGrad = 'radial-gradient(circle at 35% 35%, #fef08a, #f59e0b 60%, #b45309)';
        pitch = 1.4;
      } else if (rand < 0.45) {
        size = 42;
        points = 25;
        colorGrad = 'radial-gradient(circle at 35% 35%, #a5f3fc, #06b6d4 60%, #0369a1)';
        pitch = 1.3;
      } else if (rand < 0.8) {
        size = 62;
        points = 15;
        colorGrad = 'radial-gradient(circle at 35% 35%, #ddd6fe, #8b5cf6 60%, #4c1d95)';
        pitch = 1.0;
      } else {
        size = 82;
        points = 10;
        colorGrad = 'radial-gradient(circle at 35% 35%, #fbcfe8, #ec4899 60%, #831843)';
        pitch = 0.75;
      }

      const padding = size;
      const x = padding + Math.random() * (stageW - padding * 2);
      const y = padding + Math.random() * (stageH - padding * 2);

      const el = document.createElement('div');
      el.className = 'bubble-element';
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.background = colorGrad;

      const bubbleData = {
        el,
        x,
        y,
        size,
        points,
        pitch,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2
      };

      const handlePop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!this.isRunning || this.isPaused) return;
        this.popBubble(bubbleData);
      };

      el.addEventListener('pointerdown', handlePop);

      this.stage.appendChild(el);
      this.bubbles.push(bubbleData);
    }

    popBubble(bubble) {
      if (!this.isRunning) return;

      this.app.audio.playPop(bubble.pitch);

      const now = Date.now();
      if (now - this.lastPopTime < 1200) {
        this.combo = Math.min(4, this.combo + 1);
      } else {
        this.combo = 1;
      }
      this.lastPopTime = now;
      this.maxCombo = Math.max(this.maxCombo, this.combo);

      const earned = bubble.points * this.combo;
      this.score += earned;
      this.totalPopped += 1;
      this.app.state.stats.totalBubblesPopped += 1;

      this.createPopFX(bubble.x, bubble.y, earned);

      if (bubble.el.parentNode) {
        bubble.el.parentNode.removeChild(bubble.el);
      }
      this.bubbles = this.bubbles.filter((b) => b !== bubble);

      this.updateHUD();

      setTimeout(() => {
        if (this.isRunning && !this.isPaused) {
          this.spawnBubble();
        }
      }, 150);
    }

    createPopFX(x, y, points) {
      if (this.app.state.settings.motion === 'reduced') return;

      const scoreEl = document.createElement('div');
      scoreEl.className = 'score-float-text';
      scoreEl.textContent = `+${points}`;
      scoreEl.style.left = `${x}px`;
      scoreEl.style.top = `${y}px`;
      this.stage.appendChild(scoreEl);
      setTimeout(() => {
        if (scoreEl.parentNode) scoreEl.parentNode.removeChild(scoreEl);
      }, 650);

      for (let i = 0; i < 8; i++) {
        const p = document.createElement('div');
        p.className = 'bubble-pop-particle';
        const pSize = Math.random() * 6 + 4;
        p.style.width = `${pSize}px`;
        p.style.height = `${pSize}px`;
        p.style.background = '#a78bfa';
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;

        const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5);
        const dist = Math.random() * 30 + 15;
        p.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;

        this.stage.appendChild(p);
        setTimeout(() => {
          if (p.parentNode) p.parentNode.removeChild(p);
        }, 400);
      }
    }

    updateHUD() {
      if (this.scoreValEl) this.scoreValEl.textContent = this.score;
      if (this.timerValEl) this.timerValEl.textContent = Math.max(0, this.timeLeft);
      if (this.comboValEl) this.comboValEl.textContent = `${this.combo}x`;
      if (this.timerBarEl) {
        const pct = Math.max(0, (this.timeLeft / 30) * 100);
        this.timerBarEl.style.width = `${pct}%`;
      }
    }

    endGame() {
      this.cleanup();
      this.app.audio.playSuccess();

      const result = StatsManager.recordSession(
        this.app.state,
        'bubblePop',
        'Bubble Pop',
        this.score,
        30,
        `${this.totalPopped} bubbles popped`
      );

      this.app.updateAllDisplays();

      this.app.showResultsModal({
        title: 'Bubble Pop Complete!',
        subtitle: 'Mind refreshed! Tension popped away.',
        scoreLabel: 'Final Score',
        scoreVal: this.score,
        isNewBest: result.isNewBest,
        stats: [
          { label: 'Bubbles Popped', val: this.totalPopped },
          { label: 'Max Combo', val: `${this.maxCombo}x` },
          { label: 'Time Spent', val: '30s' }
        ],
        onReplay: () => this.start(),
        onHub: () => this.app.navigateTo('games')
      });
    }

    cleanup() {
      this.isRunning = false;
      this.isPaused = false;
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      if (this.spawnInterval) {
        clearInterval(this.spawnInterval);
        this.spawnInterval = null;
      }
      this.bubbles.forEach((b) => {
        if (b.el.parentNode) b.el.parentNode.removeChild(b.el);
      });
      this.bubbles = [];
      this.setPauseIcon(false);
    }
  }

  /* ==========================================================================
     6. MINI-GAME 2: COLOUR FLOW
     ========================================================================== */
  class ColourFlowGame {
    constructor(app) {
      this.app = app;
      this.scoreValEl = document.getElementById('cf-score-val');
      this.timerValEl = document.getElementById('cf-timer-val');
      this.timerBarEl = document.getElementById('cf-timer-bar');
      this.streakValEl = document.getElementById('cf-streak-val');
      this.targetSwatch = document.getElementById('cf-target-swatch');
      this.targetSymbol = document.getElementById('cf-target-symbol');
      this.targetName = document.getElementById('cf-target-name');
      this.tilesGrid = document.getElementById('cf-tiles-grid');
      this.startOverlay = document.getElementById('cf-start-overlay');
      this.startBtn = document.getElementById('cf-start-btn');
      this.restartBtn = document.getElementById('cf-restart-btn');

      this.score = 0;
      this.timeLeft = 30;
      this.streak = 0;
      this.correctMatches = 0;
      this.totalAttempts = 0;
      this.isRunning = false;
      this.timerInterval = null;
      this.targetData = null;

      this.palette = [
        { name: 'Amethyst Violet', hex: '#8b5cf6', symbol: 'circle' },
        { name: 'Radiant Cyan', hex: '#06b6d4', symbol: 'square' },
        { name: 'Emerald Bloom', hex: '#10b981', symbol: 'triangle' },
        { name: 'Golden Amber', hex: '#f59e0b', symbol: 'diamond' },
        { name: 'Sunset Coral', hex: '#f43f5e', symbol: 'star' },
        { name: 'Electric Indigo', hex: '#6366f1', symbol: 'hexagon' },
        { name: 'Soft Lavender', hex: '#a78bfa', symbol: 'cross' },
        { name: 'Ocean Azure', hex: '#3b82f6', symbol: 'pentagon' }
      ];

      this.initEvents();
    }

    initEvents() {
      this.startBtn.addEventListener('click', () => this.start());
      this.restartBtn.addEventListener('click', () => this.restart());
    }

    start() {
      this.cleanup();
      this.score = 0;
      this.timeLeft = 30;
      this.streak = 0;
      this.correctMatches = 0;
      this.totalAttempts = 0;
      this.isRunning = true;

      this.updateHUD();
      this.startOverlay.classList.add('hidden');
      this.nextRound();

      this.timerInterval = setInterval(() => {
        this.timeLeft -= 1;
        this.updateHUD();

        if (this.timeLeft <= 0) {
          this.endGame();
        }
      }, 1000);
    }

    restart() {
      this.cleanup();
      this.start();
    }

    getSymbolSvg(shape) {
      switch (shape) {
        case 'circle':
          return `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>`;
        case 'square':
          return `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`;
        case 'triangle':
          return `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 4 4 20 20 20 12 4"/></svg>`;
        case 'diamond':
          return `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 22 12 12 22 2 12 12 2"/></svg>`;
        case 'star':
          return `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9 12 2"/></svg>`;
        case 'hexagon':
          return `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 20 7 20 17 12 22 4 17 4 7 12 2"/></svg>`;
        case 'cross':
          return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8V2z"/></svg>`;
        default:
          return `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="7"/></svg>`;
      }
    }

    nextRound() {
      if (!this.isRunning) return;

      const targetIndex = Math.floor(Math.random() * this.palette.length);
      this.targetData = this.palette[targetIndex];

      this.targetSwatch.style.background = this.targetData.hex;
      this.targetSymbol.innerHTML = this.getSymbolSvg(this.targetData.symbol);
      this.targetName.textContent = this.targetData.name;

      const distractors = this.palette.filter((_, i) => i !== targetIndex);
      const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 5);
      const choices = [this.targetData, ...shuffledDistractors].sort(() => Math.random() - 0.5);

      this.tilesGrid.innerHTML = '';
      choices.forEach((choice) => {
        const tileBtn = document.createElement('button');
        tileBtn.className = 'cf-choice-tile';
        tileBtn.style.background = choice.hex;
        tileBtn.setAttribute('aria-label', `Select ${choice.name}`);

        const symbolWrap = document.createElement('div');
        symbolWrap.className = 'cf-choice-symbol';
        symbolWrap.innerHTML = this.getSymbolSvg(choice.symbol);
        tileBtn.appendChild(symbolWrap);

        tileBtn.addEventListener('click', () => this.handleTileClick(choice, tileBtn));
        this.tilesGrid.appendChild(tileBtn);
      });
    }

    handleTileClick(selectedChoice, tileEl) {
      if (!this.isRunning) return;
      this.totalAttempts += 1;

      if (selectedChoice.name === this.targetData.name) {
        this.streak += 1;
        this.correctMatches += 1;
        const bonus = 100 + this.streak * 20;
        this.score += bonus;

        this.app.audio.playSuccess();
        tileEl.classList.add('cf-tile-correct');

        this.updateHUD();
        setTimeout(() => this.nextRound(), 180);
      } else {
        this.streak = 0;
        this.app.audio.playError();
        tileEl.classList.add('cf-tile-wrong');
        setTimeout(() => {
          tileEl.classList.remove('cf-tile-wrong');
        }, 400);
        this.updateHUD();
      }
    }

    updateHUD() {
      if (this.scoreValEl) this.scoreValEl.textContent = this.score;
      if (this.timerValEl) this.timerValEl.textContent = Math.max(0, this.timeLeft);
      if (this.streakValEl) this.streakValEl.textContent = this.streak;
      if (this.timerBarEl) {
        const pct = Math.max(0, (this.timeLeft / 30) * 100);
        this.timerBarEl.style.width = `${pct}%`;
      }
    }

    endGame() {
      this.cleanup();
      this.app.audio.playSuccess();

      const accuracy = this.totalAttempts > 0 ? Math.round((this.correctMatches / this.totalAttempts) * 100) : 0;

      const result = StatsManager.recordSession(
        this.app.state,
        'colourFlow',
        'Colour Flow',
        this.score,
        30,
        `${this.correctMatches} matched (${accuracy}%)`
      );

      this.app.updateAllDisplays();

      this.app.showResultsModal({
        title: 'Colour Flow Complete!',
        subtitle: 'Sharp perception! Cognitive focus energized.',
        scoreLabel: 'Final Score',
        scoreVal: this.score,
        isNewBest: result.isNewBest,
        stats: [
          { label: 'Correct Matches', val: this.correctMatches },
          { label: 'Accuracy', val: `${accuracy}%` },
          { label: 'Time Elapsed', val: '30s' }
        ],
        onReplay: () => this.start(),
        onHub: () => this.app.navigateTo('games')
      });
    }

    cleanup() {
      this.isRunning = false;
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      if (this.tilesGrid) {
        this.tilesGrid.innerHTML = '';
      }
    }
  }

  /* ==========================================================================
     7. MINI-GAME 3: MEMORY TILES (SIMON SEQUENCE)
     ========================================================================= */
  class MemoryTilesGame {
    constructor(app) {
      this.app = app;
      this.levelValEl = document.getElementById('mt-level-val');
      this.statusIndicator = document.getElementById('mt-status-indicator');
      this.bestValEl = document.getElementById('mt-best-val');
      this.gridContainer = document.getElementById('mt-grid');
      this.tiles = Array.from(document.querySelectorAll('.mem-tile'));
      this.startOverlay = document.getElementById('mt-start-overlay');
      this.startBtn = document.getElementById('mt-start-btn');
      this.restartBtn = document.getElementById('mt-restart-btn');

      this.tileFrequencies = [261.63, 329.63, 392.0, 493.88];

      this.sequence = [];
      this.playerStep = 0;
      this.level = 1;
      this.isRunning = false;
      this.isLocked = false;
      this.playbackTimeouts = [];

      this.initEvents();
    }

    initEvents() {
      this.startBtn.addEventListener('click', () => this.start());
      this.restartBtn.addEventListener('click', () => this.restart());

      this.tiles.forEach((tile, index) => {
        tile.addEventListener('click', () => this.handleTileInput(index));
      });
    }

    start() {
      this.cleanup();
      this.sequence = [];
      this.level = 1;
      this.isRunning = true;
      this.isLocked = true;

      this.updateHUD();
      this.startOverlay.classList.add('hidden');

      this.addNewStep();
      this.playSequence();
    }

    restart() {
      this.cleanup();
      this.start();
    }

    addNewStep() {
      const nextTile = Math.floor(Math.random() * 4);
      this.sequence.push(nextTile);
    }

    playSequence() {
      if (!this.isRunning) return;
      this.isLocked = true;
      this.gridContainer.classList.add('input-locked');
      this.statusIndicator.textContent = 'Memorize...';
      this.statusIndicator.className = 'mt-status-badge watching';

      const stepDelay = Math.max(350, 600 - this.level * 20);

      this.sequence.forEach((tileIndex, i) => {
        const tId = setTimeout(() => {
          if (!this.isRunning) return;
          this.lightUpTile(tileIndex, 300);

          if (i === this.sequence.length - 1) {
            const finishId = setTimeout(() => {
              if (!this.isRunning) return;
              this.isLocked = false;
              this.playerStep = 0;
              this.gridContainer.classList.remove('input-locked');
              this.statusIndicator.textContent = 'Your Turn!';
              this.statusIndicator.className = 'mt-status-badge player-turn';
            }, 350);
            this.playbackTimeouts.push(finishId);
          }
        }, (i + 1) * stepDelay);
        this.playbackTimeouts.push(tId);
      });
    }

    lightUpTile(index, duration = 300) {
      const tile = this.tiles[index];
      if (!tile) return;

      tile.classList.add('tile-lit');
      this.app.audio.playTone(this.tileFrequencies[index], duration / 1000);

      setTimeout(() => {
        tile.classList.remove('tile-lit');
      }, duration);
    }

    handleTileInput(index) {
      if (!this.isRunning || this.isLocked) return;

      this.lightUpTile(index, 220);

      if (index === this.sequence[this.playerStep]) {
        this.playerStep += 1;

        if (this.playerStep === this.sequence.length) {
          this.isLocked = true;
          this.level += 1;
          this.updateHUD();
          this.app.audio.playSuccess();
          this.statusIndicator.textContent = 'Pattern Cleared!';
          this.statusIndicator.className = 'mt-status-badge player-turn';

          const nextRoundTimeout = setTimeout(() => {
            if (!this.isRunning) return;
            this.addNewStep();
            this.playSequence();
          }, 900);
          this.playbackTimeouts.push(nextRoundTimeout);
        }
      } else {
        this.handleFailure(index);
      }
    }

    handleFailure(wrongIndex) {
      this.isRunning = false;
      this.isLocked = true;
      this.app.audio.playError();

      const tile = this.tiles[wrongIndex];
      if (tile) {
        tile.classList.add('tile-error');
        setTimeout(() => tile.classList.remove('tile-error'), 450);
      }

      this.statusIndicator.textContent = 'Game Over';
      this.statusIndicator.className = 'mt-status-badge';

      const finalLevel = this.level;

      const result = StatsManager.recordSession(
        this.app.state,
        'memoryTiles',
        'Memory Tiles',
        finalLevel,
        finalLevel * 6,
        `Reached Sequence Level ${finalLevel}`
      );

      this.app.updateAllDisplays();

      setTimeout(() => {
        this.app.showResultsModal({
          title: 'Memory Sequence Complete',
          subtitle: 'Terrific mental endurance! Working memory expanded.',
          scoreLabel: 'Level Reached',
          scoreVal: `Level ${finalLevel}`,
          isNewBest: result.isNewBest,
          stats: [
            { label: 'Sequence Length', val: finalLevel },
            { label: 'Best Level', val: `Level ${this.app.state.stats.bestScores.memoryTiles}` },
            { label: 'Focus Score', val: `${finalLevel * 100} pts` }
          ],
          onReplay: () => this.start(),
          onHub: () => this.app.navigateTo('games')
        });
      }, 700);
    }

    updateHUD() {
      if (this.levelValEl) this.levelValEl.textContent = this.level;
      if (this.bestValEl) {
        this.bestValEl.textContent = `Lvl ${this.app.state.stats.bestScores.memoryTiles}`;
      }
    }

    cleanup() {
      this.isRunning = false;
      this.isLocked = false;
      this.playbackTimeouts.forEach((id) => clearTimeout(id));
      this.playbackTimeouts = [];
      this.tiles.forEach((t) => {
        t.classList.remove('tile-lit', 'tile-error');
      });
      if (this.gridContainer) {
        this.gridContainer.classList.remove('input-locked');
      }
    }
  }

  /* ==========================================================================
     8. MINI-GAME 4: STAR HUNT
     ========================================================================== */
  class StarHuntGame {
    constructor(app) {
      this.app = app;
      this.stage = document.getElementById('sh-stage');
      this.scoreValEl = document.getElementById('sh-score-val');
      this.timerValEl = document.getElementById('sh-timer-val');
      this.timerBarEl = document.getElementById('sh-timer-bar');
      this.caughtValEl = document.getElementById('sh-caught-val');
      this.startOverlay = document.getElementById('sh-start-overlay');
      this.startBtn = document.getElementById('sh-start-btn');
      this.pauseBtn = document.getElementById('sh-pause-btn');
      this.restartBtn = document.getElementById('sh-restart-btn');
      this.iconPause = document.getElementById('sh-icon-pause');
      this.iconPlay = document.getElementById('sh-icon-play');

      this.score = 0;
      this.timeLeft = 30;
      this.starsCaught = 0;
      this.isRunning = false;
      this.isPaused = false;
      this.timerInterval = null;
      this.spawnInterval = null;
      this.stars = [];

      this.initEvents();
    }

    initEvents() {
      this.startBtn.addEventListener('click', () => this.start());
      this.pauseBtn.addEventListener('click', () => this.togglePause());
      this.restartBtn.addEventListener('click', () => this.restart());
    }

    start() {
      this.cleanup();
      this.score = 0;
      this.timeLeft = 30;
      this.starsCaught = 0;
      this.isRunning = true;
      this.isPaused = false;

      this.updateHUD();
      this.startOverlay.classList.add('hidden');
      this.setPauseIcon(false);

      for (let i = 0; i < 5; i++) {
        this.spawnStar();
      }

      this.timerInterval = setInterval(() => {
        if (this.isPaused) return;
        this.timeLeft -= 1;
        this.updateHUD();

        if (this.timeLeft <= 0) {
          this.endGame();
        }
      }, 1000);

      this.spawnInterval = setInterval(() => {
        if (this.isPaused || !this.isRunning) return;
        if (this.stars.length < 6) {
          this.spawnStar();
        }
      }, 750);
    }

    togglePause() {
      if (!this.isRunning) return;
      this.isPaused = !this.isPaused;
      this.setPauseIcon(this.isPaused);
      if (this.isPaused) {
        this.app.showToast('Star Hunt paused', 'info');
      }
    }

    setPauseIcon(isPaused) {
      if (isPaused) {
        this.iconPause.classList.add('hidden');
        this.iconPlay.classList.remove('hidden');
      } else {
        this.iconPause.classList.remove('hidden');
        this.iconPlay.classList.add('hidden');
      }
    }

    restart() {
      this.cleanup();
      this.start();
    }

    spawnStar() {
      if (!this.stage) return;
      const rect = this.stage.getBoundingClientRect();
      const stageW = rect.width || 600;
      const stageH = rect.height || 480;

      const padding = 55;
      const x = padding + Math.random() * (stageW - padding * 2);
      const y = padding + Math.random() * (stageH - padding * 2);

      const rand = Math.random();
      let type, points, size, lifespan;

      if (rand < 0.2) {
        type = 'star-gold';
        points = 25;
        size = 46;
        lifespan = 2200;
      } else if (rand < 0.45) {
        type = 'star-cyan';
        points = 50;
        size = 38;
        lifespan = 1800;
      } else {
        type = 'star-silver';
        points = 10;
        size = 34;
        lifespan = 2800;
      }

      const el = document.createElement('div');
      el.className = `cosmic-star-item ${type}`;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;

      el.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" class="star-svg-graphic" style="width:${size}px; height:${size}px">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      `;

      const starData = { el, x, y, points, type };

      const handleCatch = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!this.isRunning || this.isPaused) return;
        this.catchStar(starData);
      };

      el.addEventListener('pointerdown', handleCatch);

      this.stage.appendChild(el);
      this.stars.push(starData);

      setTimeout(() => {
        if (!this.isRunning) return;
        if (el.parentNode) {
          el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          el.style.opacity = '0';
          el.style.transform = 'translate(-50%, -50%) scale(0.4)';
          setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
            this.stars = this.stars.filter((s) => s !== starData);
          }, 400);
        }
      }, lifespan);
    }

    catchStar(star) {
      if (!this.isRunning) return;

      const isBonus = star.type === 'star-cyan' || star.type === 'star-gold';
      this.app.audio.playStarChime(isBonus);

      this.score += star.points;
      this.starsCaught += 1;

      this.createStarBurst(star.x, star.y, star.points, star.type);

      if (star.el.parentNode) {
        star.el.parentNode.removeChild(star.el);
      }
      this.stars = this.stars.filter((s) => s !== star);

      this.updateHUD();

      setTimeout(() => {
        if (this.isRunning && !this.isPaused) {
          this.spawnStar();
        }
      }, 200);
    }

    createStarBurst(x, y, points, type) {
      if (this.app.state.settings.motion === 'reduced') return;

      const scoreEl = document.createElement('div');
      scoreEl.className = 'score-float-text';
      scoreEl.textContent = `+${points}`;
      scoreEl.style.left = `${x}px`;
      scoreEl.style.top = `${y}px`;
      scoreEl.style.color = type === 'star-gold' ? '#fde047' : type === 'star-cyan' ? '#38bdf8' : '#ffffff';

      this.stage.appendChild(scoreEl);
      setTimeout(() => {
        if (scoreEl.parentNode) scoreEl.parentNode.removeChild(scoreEl);
      }, 650);

      for (let i = 0; i < 6; i++) {
        const sp = document.createElement('div');
        sp.className = 'bubble-pop-particle';
        sp.style.width = '5px';
        sp.style.height = '5px';
        sp.style.background = type === 'star-gold' ? '#fbbf24' : '#38bdf8';
        sp.style.left = `${x}px`;
        sp.style.top = `${y}px`;

        const angle = (Math.PI * 2 * i) / 6;
        const dist = Math.random() * 25 + 15;
        sp.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;

        this.stage.appendChild(sp);
        setTimeout(() => {
          if (sp.parentNode) sp.parentNode.removeChild(sp);
        }, 400);
      }
    }

    updateHUD() {
      if (this.scoreValEl) this.scoreValEl.textContent = this.score;
      if (this.timerValEl) this.timerValEl.textContent = Math.max(0, this.timeLeft);
      if (this.caughtValEl) this.caughtValEl.textContent = this.starsCaught;
      if (this.timerBarEl) {
        const pct = Math.max(0, (this.timeLeft / 30) * 100);
        this.timerBarEl.style.width = `${pct}%`;
      }
    }

    endGame() {
      this.cleanup();
      this.app.audio.playSuccess();

      const result = StatsManager.recordSession(
        this.app.state,
        'starHunt',
        'Star Hunt',
        this.score,
        30,
        `${this.starsCaught} celestial stars caught`
      );

      this.app.updateAllDisplays();

      this.app.showResultsModal({
        title: 'Star Hunt Complete!',
        subtitle: 'Cosmic calm attained. Reflexes sharp and steady.',
        scoreLabel: 'Final Score',
        scoreVal: this.score,
        isNewBest: result.isNewBest,
        stats: [
          { label: 'Stars Caught', val: this.starsCaught },
          { label: 'High Score', val: `${this.app.state.stats.bestScores.starHunt} pts` },
          { label: 'Time Elapsed', val: '30s' }
        ],
        onReplay: () => this.start(),
        onHub: () => this.app.navigateTo('games')
      });
    }

    cleanup() {
      this.isRunning = false;
      this.isPaused = false;
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      if (this.spawnInterval) {
        clearInterval(this.spawnInterval);
        this.spawnInterval = null;
      }
      this.stars.forEach((s) => {
        if (s.el.parentNode) s.el.parentNode.removeChild(s.el);
      });
      this.stars = [];
      this.setPauseIcon(false);
    }
  }

  /* ==========================================================================
     9. MINI-GAME 5: BREATHING ROOM
     ========================================================================== */
  class BreathingRoom {
    constructor(app) {
      this.app = app;
      this.circleCore = document.getElementById('br-circle-core');
      this.ringOuter = document.getElementById('br-ring-outer');
      this.ringMid = document.getElementById('br-ring-mid');
      this.phaseLabel = document.getElementById('br-phase-label');
      this.countdownNumber = document.getElementById('br-phase-countdown');
      this.subInstruction = document.getElementById('br-phase-sub');
      this.sessionTimer = document.getElementById('br-session-timer');
      this.startBtn = document.getElementById('br-start-btn');
      this.startBtnText = document.getElementById('br-start-btn-text');
      this.pauseBtn = document.getElementById('br-pause-btn');
      this.stopBtn = document.getElementById('br-stop-btn');
      this.durationBtns = Array.from(document.querySelectorAll('.duration-btn'));

      this.inhaleDuration = 4;
      this.exhaleDuration = 6;
      this.cycleTotal = this.inhaleDuration + this.exhaleDuration;

      this.selectedDurationSeconds = 60;
      this.sessionTimeRemaining = 60;
      this.isRunning = false;
      this.isPaused = false;

      this.cycleSecondsPassed = 0;
      this.masterInterval = null;

      this.initEvents();
    }

    initEvents() {
      this.startBtn.addEventListener('click', () => this.start());
      this.pauseBtn.addEventListener('click', () => this.togglePause());
      this.stopBtn.addEventListener('click', () => this.stop(false));

      this.durationBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          if (this.isRunning) return;
          this.durationBtns.forEach((b) => {
            b.classList.remove('active');
            b.setAttribute('aria-checked', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-checked', 'true');
          this.selectedDurationSeconds = Number(btn.dataset.duration) || 60;
          this.sessionTimeRemaining = this.selectedDurationSeconds;
          this.updateClockDisplay();
        });
      });
    }

    start() {
      this.cleanup();
      this.isRunning = true;
      this.isPaused = false;
      this.sessionTimeRemaining = this.selectedDurationSeconds;
      this.cycleSecondsPassed = 0;

      this.startBtn.classList.add('hidden');
      this.pauseBtn.classList.remove('hidden');
      this.stopBtn.classList.remove('hidden');

      this.step();

      this.masterInterval = setInterval(() => {
        if (this.isPaused) return;

        this.sessionTimeRemaining -= 1;
        this.cycleSecondsPassed += 1;
        this.updateClockDisplay();

        if (this.sessionTimeRemaining <= 0) {
          this.completeSession();
          return;
        }

        this.step();
      }, 1000);
    }

    step() {
      const cyclePos = this.cycleSecondsPassed % this.cycleTotal;

      if (cyclePos === 0) {
        this.phaseLabel.textContent = 'Inhale';
        this.subInstruction.textContent = 'Breathe in slowly through your nose...';
        this.circleCore.classList.remove('exhaling');
        this.circleCore.classList.add('inhaling');
        this.ringOuter.classList.add('inhaling-rings');
        this.ringMid.classList.add('inhaling-rings');
        this.app.audio.playBreathingTone(true);
      } else if (cyclePos === this.inhaleDuration) {
        this.phaseLabel.textContent = 'Exhale';
        this.subInstruction.textContent = 'Release tension smoothly out your mouth...';
        this.circleCore.classList.remove('inhaling');
        this.circleCore.classList.add('exhaling');
        this.ringOuter.classList.remove('inhaling-rings');
        this.ringMid.classList.remove('inhaling-rings');
        this.app.audio.playBreathingTone(false);
      }

      let phaseTimeLeft;
      if (cyclePos < this.inhaleDuration) {
        phaseTimeLeft = this.inhaleDuration - cyclePos;
      } else {
        phaseTimeLeft = this.cycleTotal - cyclePos;
      }
      this.countdownNumber.textContent = phaseTimeLeft;
    }

    togglePause() {
      if (!this.isRunning) return;
      this.isPaused = !this.isPaused;
      this.pauseBtn.querySelector('span').textContent = this.isPaused ? 'Resume' : 'Pause';
      if (this.isPaused) {
        this.app.showToast('Breathing paused', 'info');
      }
    }

    stop(completed = false) {
      this.cleanup();
      this.resetVisuals();

      this.startBtn.classList.remove('hidden');
      this.pauseBtn.classList.add('hidden');
      this.stopBtn.classList.add('hidden');
      this.sessionTimeRemaining = this.selectedDurationSeconds;
      this.updateClockDisplay();

      if (!completed) {
        this.app.showToast('Session ended', 'info');
      }
    }

    completeSession() {
      const minutesCompleted = Math.round(this.selectedDurationSeconds / 60);
      StatsManager.recordBreathing(this.app.state, minutesCompleted);
      this.app.audio.playSuccess();
      this.stop(true);
      this.app.updateAllDisplays();

      this.app.showResultsModal({
        title: 'Mindful Session Complete',
        subtitle: 'Centered, present, and recharged.',
        scoreLabel: 'Mindful Minutes',
        scoreVal: `${minutesCompleted} Min`,
        isNewBest: false,
        stats: [
          { label: 'Completed Breaths', val: Math.floor(this.selectedDurationSeconds / 10) },
          { label: 'Session Type', val: '4-6 Calm Rhythm' },
          { label: 'Total Mindful Mins', val: `${this.app.state.stats.totalBreathingMinutes}m` }
        ],
        onReplay: () => this.start(),
        onHub: () => this.app.navigateTo('dashboard')
      });
    }

    resetVisuals() {
      this.circleCore.classList.remove('inhaling', 'exhaling');
      this.ringOuter.classList.remove('inhaling-rings', 'exhaling-rings');
      this.ringMid.classList.remove('inhaling-rings', 'exhaling-rings');
      this.phaseLabel.textContent = 'Ready';
      this.countdownNumber.textContent = '4';
      this.subInstruction.textContent = 'Press Start to Begin';
    }

    updateClockDisplay() {
      const mins = Math.floor(this.sessionTimeRemaining / 60);
      const secs = this.sessionTimeRemaining % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      if (this.sessionTimer) this.sessionTimer.textContent = formatted;
    }

    cleanup() {
      this.isRunning = false;
      this.isPaused = false;
      if (this.masterInterval) {
        clearInterval(this.masterInterval);
        this.masterInterval = null;
      }
      this.resetVisuals();
    }
  }

  /* ==========================================================================
     10. APPLICATION CORE & ROUTING CONTROLLER
     ========================================================================== */
  class ZenFlowApp {
    constructor() {
      this.state = StorageManager.load();
      this.audio = new ZenAudio();
      this.ambientCanvas = new AmbientCanvas('ambient-canvas');

      this.games = {
        bubblePop: new BubblePopGame(this),
        colourFlow: new ColourFlowGame(this),
        memoryTiles: new MemoryTilesGame(this),
        starHunt: new StarHuntGame(this)
      };
      this.breathingRoom = new BreathingRoom(this);

      this.currentView = 'dashboard';
      this.previousView = 'dashboard';
      this.activeGameArena = null;
      this.isRouteHandling = false;

      this.initDOM();
      this.applySettings();
      this.updateAllDisplays();
      this.initRoutes();
    }

    initDOM() {
      document.querySelectorAll('.nav-link').forEach((link) => {
        link.addEventListener('click', () => {
          const view = link.dataset.view;
          if (view) this.navigateTo(view);
        });
      });

      document.querySelectorAll('.mob-nav-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const view = btn.dataset.view;
          if (view) this.navigateTo(view);
        });
      });

      document.querySelectorAll('[data-navigate]').forEach((el) => {
        el.addEventListener('click', () => {
          this.navigateTo(el.dataset.navigate);
        });
      });

      document.querySelectorAll('.play-game-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const gameId = btn.dataset.game;
          if (gameId) this.launchGame(gameId);
        });
      });

      const quickBreakBtn = document.getElementById('btn-quick-break');
      if (quickBreakBtn) {
        quickBreakBtn.addEventListener('click', () => {
          const gameKeys = Object.keys(this.games);
          const picked = gameKeys[Math.floor(Math.random() * gameKeys.length)];
          this.launchGame(picked);
        });
      }

      document.querySelectorAll('.back-to-hub-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.leaveCurrentGame(true);
        });
      });

      const audioToggle = document.getElementById('header-audio-toggle');
      if (audioToggle) {
        audioToggle.addEventListener('click', () => {
          this.state.settings.soundEnabled = !this.state.settings.soundEnabled;
          this.applySettings();
          StorageManager.save(this.state);
          this.showToast(
            this.state.settings.soundEnabled ? 'Sound effects enabled' : 'Sound effects muted',
            'info'
          );
        });
      }

      const themeToggle = document.getElementById('header-theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          const next = this.state.settings.theme === 'dark' ? 'light' : 'dark';
          this.state.settings.theme = next;
          this.applySettings();
          StorageManager.save(this.state);
        });
      }

      const mobileToggle = document.getElementById('mobile-menu-toggle');
      const sidebar = document.getElementById('sidebar');
      if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => {
          const isOpen = sidebar.classList.toggle('mobile-open');
          mobileToggle.setAttribute('aria-expanded', String(isOpen));
        });
      }

      this.initSettingsDOM();

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeModals();
        }
      });
    }

    initSettingsDOM() {
      const settingSoundToggle = document.getElementById('setting-sound-toggle');
      const dashSoundToggle = document.getElementById('dash-sound-toggle');
      const toggleSound = () => {
        this.state.settings.soundEnabled = !this.state.settings.soundEnabled;
        this.applySettings();
        StorageManager.save(this.state);
      };
      if (settingSoundToggle) settingSoundToggle.addEventListener('click', toggleSound);
      if (dashSoundToggle) dashSoundToggle.addEventListener('click', toggleSound);

      const volSlider = document.getElementById('setting-volume-slider');
      const volLabel = document.getElementById('volume-val-label');
      if (volSlider) {
        volSlider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          this.state.settings.volume = val;
          if (volLabel) volLabel.textContent = `${Math.round(val * 100)}%`;
          this.audio.setVolume(val);
          StorageManager.save(this.state);
        });
      }

      const dashParticlesToggle = document.getElementById('dash-particles-toggle');
      const settingParticlesToggle = document.getElementById('setting-particles-toggle');
      const toggleParticles = () => {
        this.state.settings.ambientParticles = !this.state.settings.ambientParticles;
        this.applySettings();
        StorageManager.save(this.state);
      };
      if (dashParticlesToggle) dashParticlesToggle.addEventListener('click', toggleParticles);
      if (settingParticlesToggle) settingParticlesToggle.addEventListener('click', toggleParticles);

      document.querySelectorAll('.theme-choice-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.state.settings.theme = btn.dataset.themeVal;
          this.applySettings();
          StorageManager.save(this.state);
        });
      });

      document.querySelectorAll('.motion-choice-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.state.settings.motion = btn.dataset.motionVal;
          this.applySettings();
          StorageManager.save(this.state);
        });
      });

      const resetBtn = document.getElementById('btn-reset-data');
      const confirmModal = document.getElementById('confirm-modal');
      const confirmCancel = document.getElementById('confirm-btn-cancel');
      const confirmYes = document.getElementById('confirm-btn-confirm');

      if (resetBtn && confirmModal) {
        resetBtn.addEventListener('click', () => {
          confirmModal.classList.add('show');
          confirmModal.setAttribute('aria-hidden', 'false');
        });
      }

      if (confirmCancel && confirmModal) {
        confirmCancel.addEventListener('click', () => {
          confirmModal.classList.remove('show');
          confirmModal.setAttribute('aria-hidden', 'true');
        });
      }

      if (confirmYes && confirmModal) {
        confirmYes.addEventListener('click', () => {
          StorageManager.reset();
          this.state = StorageManager.load();
          this.applySettings();
          this.updateAllDisplays();
          confirmModal.classList.remove('show');
          confirmModal.setAttribute('aria-hidden', 'true');
          this.showToast('All activity progress has been reset', 'info');
        });
      }
    }

    applySettings() {
      const s = this.state.settings;

      document.documentElement.setAttribute('data-theme', s.theme);
      const moonIcon = document.getElementById('theme-icon-moon');
      const sunIcon = document.getElementById('theme-icon-sun');
      if (moonIcon && sunIcon) {
        if (s.theme === 'light') {
          moonIcon.classList.remove('hidden');
          sunIcon.classList.add('hidden');
        } else {
          moonIcon.classList.add('hidden');
          sunIcon.classList.remove('hidden');
        }
      }

      this.audio.setEnabled(s.soundEnabled);
      this.audio.setVolume(s.volume);

      const headerAudioOn = document.getElementById('header-audio-icon-on');
      const headerAudioOff = document.getElementById('header-audio-icon-off');
      if (headerAudioOn && headerAudioOff) {
        if (s.soundEnabled) {
          headerAudioOn.classList.remove('hidden');
          headerAudioOff.classList.add('hidden');
        } else {
          headerAudioOn.classList.add('hidden');
          headerAudioOff.classList.remove('hidden');
        }
      }

      const settingSoundToggle = document.getElementById('setting-sound-toggle');
      const dashSoundToggle = document.getElementById('dash-sound-toggle');
      if (settingSoundToggle) settingSoundToggle.setAttribute('aria-checked', String(s.soundEnabled));
      if (dashSoundToggle) dashSoundToggle.setAttribute('aria-checked', String(s.soundEnabled));

      const dashParticlesToggle = document.getElementById('dash-particles-toggle');
      const settingParticlesToggle = document.getElementById('setting-particles-toggle');
      if (dashParticlesToggle) dashParticlesToggle.setAttribute('aria-checked', String(s.ambientParticles));
      if (settingParticlesToggle) settingParticlesToggle.setAttribute('aria-checked', String(s.ambientParticles));
      this.ambientCanvas.setEnabled(s.ambientParticles && s.motion !== 'reduced');

      if (s.motion === 'reduced') {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }

      const volSlider = document.getElementById('setting-volume-slider');
      const volLabel = document.getElementById('volume-val-label');
      if (volSlider) volSlider.value = s.volume;
      if (volLabel) volLabel.textContent = `${Math.round(s.volume * 100)}%`;

      document.querySelectorAll('.theme-choice-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.themeVal === s.theme);
      });
      document.querySelectorAll('.motion-choice-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.motionVal === s.motion);
      });
    }

    navigateTo(viewId, updateHash = true) {
      if (viewId === 'home') viewId = 'dashboard';

      this.leaveCurrentGame(false);

      document.querySelectorAll('.view-section').forEach((sec) => {
        sec.classList.remove('active');
      });

      const targetSec = document.getElementById(`view-${viewId}`);
      if (targetSec) {
        targetSec.classList.add('active');
        this.currentView = viewId;
        if (viewId !== 'breathing') {
          this.previousView = viewId;
        }
      } else {
        const fallbackSec = document.getElementById('view-dashboard');
        if (fallbackSec) fallbackSec.classList.add('active');
        this.currentView = 'dashboard';
        this.previousView = 'dashboard';
        viewId = 'dashboard';
      }

      document.body.classList.remove('in-game');

      const breadcrumb = document.getElementById('breadcrumb-current');
      if (breadcrumb) {
        const titles = {
          dashboard: 'Home',
          games: 'Mini-Games Hub',
          breathing: 'Breathing Room',
          progress: 'Daily Progress',
          settings: 'Settings'
        };
        breadcrumb.textContent = titles[viewId] || 'ZenFlow';
      }

      // Map breathing to games in top/bottom nav for active tab indication
      const activeNavKey = viewId === 'breathing' ? 'games' : viewId;

      document.querySelectorAll('.nav-link').forEach((link) => {
        const isActive = link.dataset.view === activeNavKey;
        link.classList.toggle('active', isActive);
        if (isActive) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });

      document.querySelectorAll('.mob-nav-btn').forEach((btn) => {
        const isActive = btn.dataset.view === activeNavKey;
        btn.classList.toggle('active', isActive);
      });

      const sidebar = document.getElementById('sidebar');
      const mobileToggle = document.getElementById('mobile-menu-toggle');
      if (sidebar) sidebar.classList.remove('mobile-open');
      if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');

      if (updateHash) {
        const routeHash = viewId === 'dashboard' ? 'home' : viewId;
        if (window.location.hash.replace(/^#\/?/, '') !== routeHash) {
          this.isRouteHandling = true;
          window.location.hash = routeHash;
          setTimeout(() => {
            this.isRouteHandling = false;
          }, 40);
        }
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    launchGame(gameId, updateHash = true) {
      if (gameId === 'breathing') {
        this.navigateTo('breathing', updateHash);
        return;
      }

      if (!this.games[gameId]) {
        this.navigateTo('games', updateHash);
        return;
      }

      if (this.currentView && this.currentView !== 'arena') {
        this.previousView = this.currentView;
      }

      this.leaveCurrentGame(false);

      document.querySelectorAll('.view-section').forEach((sec) => {
        sec.classList.remove('active');
      });

      const arena = document.getElementById(`arena-${gameId}`);
      if (arena) {
        arena.hidden = false;
        arena.style.display = 'flex';
        this.activeGameArena = gameId;
        this.currentView = 'arena';
      }

      document.body.classList.add('in-game');

      const overlayMap = {
        bubblePop: 'bp-start-overlay',
        colourFlow: 'cf-start-overlay',
        memoryTiles: 'mt-start-overlay',
        starHunt: 'sh-start-overlay'
      };
      const overlay = document.getElementById(overlayMap[gameId]);
      if (overlay) {
        overlay.classList.remove('hidden');
      }

      const breadcrumb = document.getElementById('breadcrumb-current');
      if (breadcrumb) {
        breadcrumb.textContent = `Mini-Games / ${this.getGameTitle(gameId)}`;
      }

      // Highlight Games tab in sidebar while in game
      document.querySelectorAll('.nav-link').forEach((link) => {
        const isActive = link.dataset.view === 'games';
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });

      const sidebar = document.getElementById('sidebar');
      const mobileToggle = document.getElementById('mobile-menu-toggle');
      if (sidebar) sidebar.classList.remove('mobile-open');
      if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');

      if (updateHash) {
        const gameRoute = `game/${gameId}`;
        if (window.location.hash.replace(/^#\/?/, '') !== gameRoute) {
          this.isRouteHandling = true;
          window.location.hash = gameRoute;
          setTimeout(() => {
            this.isRouteHandling = false;
          }, 40);
        }
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    leaveCurrentGame(navigateBack = false) {
      if (this.activeGameArena && this.games[this.activeGameArena]) {
        this.games[this.activeGameArena].cleanup();
        const arena = document.getElementById(`arena-${this.activeGameArena}`);
        if (arena) {
          arena.hidden = true;
          arena.style.display = 'none';
        }
        this.activeGameArena = null;
      }
      this.breathingRoom.cleanup();
      document.body.classList.remove('in-game');

      if (navigateBack) {
        const returnTarget = (this.previousView && this.previousView !== 'arena') ? this.previousView : 'games';
        this.navigateTo(returnTarget, true);
      }
    }

    getGameTitle(gameId) {
      const titles = {
        bubblePop: 'Bubble Pop',
        colourFlow: 'Colour Flow',
        memoryTiles: 'Memory Tiles',
        starHunt: 'Star Hunt',
        breathing: 'Breathing Room'
      };
      return titles[gameId] || gameId;
    }

    updateAllDisplays() {
      const stats = this.state.stats;
      const today = StatsManager.getTodayString();
      const todayCount = stats.dailySessions[today] || 0;

      const headerToday = document.getElementById('header-today-sessions');
      if (headerToday) headerToday.textContent = todayCount;

      const greetingEl = document.getElementById('dashboard-greeting');
      if (greetingEl) {
        const hour = new Date().getHours();
        let greetingText = 'Good day';
        if (hour >= 5 && hour < 12) greetingText = 'Good morning';
        else if (hour >= 12 && hour < 17) greetingText = 'Good afternoon';
        else if (hour >= 17 && hour < 22) greetingText = 'Good evening';
        else greetingText = 'Peaceful night';
        greetingEl.textContent = `${greetingText}, ready to unwind?`;
      }

      const sbStreak = document.getElementById('sidebar-streak-value');
      if (sbStreak) {
        sbStreak.textContent = `${stats.streak.current} ${stats.streak.current === 1 ? 'Day' : 'Days'}`;
      }

      const dToday = document.getElementById('dash-stat-today-sessions');
      const dStreak = document.getElementById('dash-stat-streak');
      const dBubbles = document.getElementById('dash-stat-bubbles-popped');
      const dBreathing = document.getElementById('dash-stat-breathing-mins');

      if (dToday) dToday.textContent = todayCount;
      if (dStreak) dStreak.textContent = stats.streak.current;
      if (dBubbles) dBubbles.textContent = stats.totalBubblesPopped;
      if (dBreathing) dBreathing.textContent = `${stats.totalBreathingMinutes}m`;

      const bBP = document.getElementById('badge-best-bubblePop');
      const bCF = document.getElementById('badge-best-colourFlow');
      const bMT = document.getElementById('badge-best-memoryTiles');
      const bSH = document.getElementById('badge-best-starHunt');

      if (bBP) bBP.textContent = `Best: ${stats.bestScores.bubblePop}`;
      if (bCF) bCF.textContent = `Best: ${stats.bestScores.colourFlow}`;
      if (bMT) bMT.textContent = `Lvl: ${stats.bestScores.memoryTiles}`;
      if (bSH) bSH.textContent = `Best: ${stats.bestScores.starHunt}`;

      const hubBP = document.getElementById('hub-best-bubblePop');
      const hubCF = document.getElementById('hub-best-colourFlow');
      const hubMT = document.getElementById('hub-best-memoryTiles');
      const hubSH = document.getElementById('hub-best-starHunt');

      if (hubBP) hubBP.textContent = `Best: ${stats.bestScores.bubblePop}`;
      if (hubCF) hubCF.textContent = `Best: ${stats.bestScores.colourFlow}`;
      if (hubMT) hubMT.textContent = `Lvl: ${stats.bestScores.memoryTiles}`;
      if (hubSH) hubSH.textContent = `Best: ${stats.bestScores.starHunt}`;

      const pStreakCur = document.getElementById('prog-streak-current');
      const pStreakBest = document.getElementById('prog-streak-best');
      const pSessToday = document.getElementById('prog-sessions-today');
      const pSessTotal = document.getElementById('prog-sessions-total');
      const pBubblesTot = document.getElementById('prog-bubbles-total');
      const pBubbleBest = document.getElementById('prog-bubble-best');
      const pBreathTot = document.getElementById('prog-breathing-total');
      const pBreathSess = document.getElementById('prog-breathing-sessions');

      if (pStreakCur) pStreakCur.textContent = `${stats.streak.current} Days`;
      if (pStreakBest) pStreakBest.textContent = `Best Streak: ${stats.streak.best} days`;
      if (pSessToday) pSessToday.textContent = todayCount;
      if (pSessTotal) pSessTotal.textContent = `Total All-Time: ${stats.totalSessions}`;
      if (pBubblesTot) pBubblesTot.textContent = stats.totalBubblesPopped;
      if (pBubbleBest) pBubbleBest.textContent = `Best Score: ${stats.bestScores.bubblePop}`;
      if (pBreathTot) pBreathTot.textContent = `${stats.totalBreathingMinutes}m`;
      if (pBreathSess) pBreathSess.textContent = `${stats.totalBreathingSessions} sessions finished`;

      const rBP = document.getElementById('record-bp-score');
      const rCF = document.getElementById('record-cf-score');
      const rMT = document.getElementById('record-mt-score');
      const rSH = document.getElementById('record-sh-score');

      if (rBP) rBP.textContent = `${stats.bestScores.bubblePop} pts`;
      if (rCF) rCF.textContent = `${stats.bestScores.colourFlow} pts`;
      if (rMT) rMT.textContent = `Level ${stats.bestScores.memoryTiles}`;
      if (rSH) rSH.textContent = `${stats.bestScores.starHunt} pts`;

      this.renderRecentActivity();
    }

    renderRecentActivity() {
      const history = this.state.stats.history;
      const dashRecentContainer = document.getElementById('dash-recent-list');
      const historyTableBody = document.getElementById('history-table-body');
      const historyCountBadge = document.getElementById('history-count');

      if (historyCountBadge) {
        historyCountBadge.textContent = `${history.length} Sessions`;
      }

      if (dashRecentContainer) {
        if (!history || history.length === 0) {
          dashRecentContainer.innerHTML = `
            <div class="empty-state-box">
              <div class="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <p class="empty-state-title">No breaks recorded yet today</p>
              <p class="empty-state-desc">Play a quick mini-game or complete a breathing exercise to begin your journey!</p>
            </div>
          `;
        } else {
          const recentItems = history.slice(0, 4);
          let html = '<div class="recent-list">';
          recentItems.forEach((item) => {
            const timeAgo = this.formatTimeAgo(item.timestamp);
            html += `
              <div class="recent-item">
                <div class="recent-item-left">
                  <div class="recent-badge-icon icon-violet">
                    ${this.getGameIconMini(item.gameId)}
                  </div>
                  <div class="recent-item-info">
                    <span class="recent-game-name">${item.gameName}</span>
                    <span class="recent-timestamp">${timeAgo} &bull; ${item.details || ''}</span>
                  </div>
                </div>
                <div class="recent-result">${item.score}</div>
              </div>
            `;
          });
          html += '</div>';
          dashRecentContainer.innerHTML = html;
        }
      }

      if (historyTableBody) {
        if (!history || history.length === 0) {
          historyTableBody.innerHTML = `
            <tr>
              <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                No activity history found. Take a short 30-second break to record your first session!
              </td>
            </tr>
          `;
        } else {
          let rowsHtml = '';
          history.forEach((item) => {
            const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            rowsHtml += `
              <tr>
                <td>${dateStr}</td>
                <td><strong>${item.gameName}</strong></td>
                <td>${item.score} <span style="font-size:0.75rem; color:var(--text-muted);">(${item.details || ''})</span></td>
                <td><span class="history-status-tag">Completed</span></td>
              </tr>
            `;
          });
          historyTableBody.innerHTML = rowsHtml;
        }
      }
    }

    getGameIconMini(gameId) {
      if (gameId === 'bubblePop') return '🫧';
      if (gameId === 'colourFlow') return '🎨';
      if (gameId === 'memoryTiles') return '🧩';
      if (gameId === 'starHunt') return '✨';
      return '🧘';
    }

    formatTimeAgo(timestamp) {
      const diffSec = Math.floor((Date.now() - timestamp) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      return `${diffDays}d ago`;
    }

    showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `
        <span class="toast-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </span>
        <span>${message}</span>
      `;

      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
      }, 2600);
    }

    showResultsModal({ title, subtitle, scoreLabel, scoreVal, isNewBest, stats, onReplay, onHub }) {
      const modal = document.getElementById('results-modal');
      if (!modal) return;

      const titleEl = document.getElementById('modal-game-title');
      const subtitleEl = document.getElementById('modal-game-subtitle');
      const statLabelEl = document.getElementById('modal-stat-label');
      const statValEl = document.getElementById('modal-stat-value');
      const newBestEl = document.getElementById('modal-new-best');
      const detailsGrid = document.getElementById('modal-details-grid');
      const replayBtn = document.getElementById('modal-btn-replay');
      const hubBtn = document.getElementById('modal-btn-hub');

      if (titleEl) titleEl.textContent = title;
      if (subtitleEl) subtitleEl.textContent = subtitle;
      if (statLabelEl) statLabelEl.textContent = scoreLabel;
      if (statValEl) statValEl.textContent = scoreVal;

      if (newBestEl) {
        newBestEl.classList.toggle('hidden', !isNewBest);
      }

      if (detailsGrid && Array.isArray(stats)) {
        detailsGrid.innerHTML = '';
        stats.forEach((s) => {
          const card = document.createElement('div');
          card.className = 'modal-detail-card';
          card.innerHTML = `
            <div style="color:var(--text-muted); font-size:0.74rem;">${s.label}</div>
            <div class="modal-detail-val">${s.val}</div>
          `;
          detailsGrid.appendChild(card);
        });
      }

      const cleanReplay = () => {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        replayBtn.removeEventListener('click', cleanReplay);
        hubBtn.removeEventListener('click', cleanHub);
        if (onReplay) onReplay();
      };

      const cleanHub = () => {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        replayBtn.removeEventListener('click', cleanReplay);
        hubBtn.removeEventListener('click', cleanHub);
        if (onHub) onHub();
      };

      replayBtn.addEventListener('click', cleanReplay);
      hubBtn.addEventListener('click', cleanHub);

      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
    }

    closeModals() {
      document.querySelectorAll('.modal-backdrop').forEach((m) => {
        m.classList.remove('show');
        m.setAttribute('aria-hidden', 'true');
      });
    }

    initRoutes() {
      window.addEventListener('hashchange', () => {
        if (this.isRouteHandling) return;
        this.handleRouteFromHash();
      });
      this.handleRouteFromHash();
    }

    handleRouteFromHash() {
      const raw = window.location.hash.replace(/^#\/?/, '').trim();
      if (!raw || raw === 'home' || raw === 'dashboard') {
        if (this.currentView !== 'dashboard' || this.activeGameArena !== null) {
          this.navigateTo('dashboard', false);
        }
      } else if (raw.startsWith('game/')) {
        const gameId = raw.replace('game/', '').trim();
        if (gameId === 'breathing') {
          if (this.currentView !== 'breathing' || this.activeGameArena !== null) {
            this.navigateTo('breathing', false);
          }
        } else if (this.games[gameId]) {
          if (this.activeGameArena !== gameId) {
            this.launchGame(gameId, false);
          }
        } else {
          this.navigateTo('games', false);
        }
      } else if (['games', 'breathing', 'progress', 'settings'].includes(raw)) {
        if (this.currentView !== raw || this.activeGameArena !== null) {
          this.navigateTo(raw, false);
        }
      } else {
        this.navigateTo('dashboard', false);
      }
    }
  }

  /* ==========================================================================
     11. SPLASH SCREEN CONTROLLER
     ========================================================================== */
  function initSplashScreen() {
    const splashEl = document.getElementById('zen-splash-screen');
    if (!splashEl || splashEl.dataset.initialized === 'true') return;
    splashEl.dataset.initialized = 'true';

    const logoImg = document.getElementById('zen-splash-logo');
    const fallbackEl = document.getElementById('zen-splash-fallback');

    // Fallback if logo image fails to load or is missing
    const showFallback = () => {
      if (logoImg) logoImg.style.display = 'none';
      if (fallbackEl) {
        fallbackEl.style.display = 'flex';
        fallbackEl.removeAttribute('aria-hidden');
      }
    };

    if (logoImg) {
      logoImg.addEventListener('error', showFallback, { once: true });
      if (logoImg.complete && logoImg.naturalWidth === 0) {
        showFallback();
      }
    }

    // Prevent accidental clicks / touches on the game while splash is active
    const blockInteraction = (e) => {
      e.stopPropagation();
    };
    splashEl.addEventListener('pointerdown', blockInteraction);
    splashEl.addEventListener('click', blockInteraction);

    // Respect reduced motion accessibility
    const prefersReducedMotion =
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ||
      document.body.classList.contains('reduced-motion');

    const SPLASH_DURATION = prefersReducedMotion ? 1200 : 3000;

    const fadeOutSplash = () => {
      if (splashEl.classList.contains('zen-splash-fade-out')) return;
      splashEl.classList.add('zen-splash-fade-out');
      splashEl.style.pointerEvents = 'none';

      const removeSplash = () => {
        splashEl.removeEventListener('pointerdown', blockInteraction);
        splashEl.removeEventListener('click', blockInteraction);
        if (splashEl.parentNode) {
          splashEl.parentNode.removeChild(splashEl);
        } else {
          splashEl.style.display = 'none';
          splashEl.setAttribute('aria-hidden', 'true');
        }
      };

      splashEl.addEventListener('transitionend', removeSplash, { once: true });
      // Fallback timeout in case transitionend does not fire
      setTimeout(removeSplash, 850);
    };

    setTimeout(fadeOutSplash, SPLASH_DURATION);
  }

  const startApp = () => {
    initSplashScreen();
    if (!window.ZenFlow) {
      window.ZenFlow = new ZenFlowApp();
    }
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }
})();

