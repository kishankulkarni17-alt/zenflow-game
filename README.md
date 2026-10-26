# ZenFlow — Take a Little Break

> A premium, calming mini-game and mind-refresh web application designed to help students, developers, and professionals recharge their mental focus through tactile micro-breaks.

---

## 🌿 Overview

**ZenFlow** is a zero-dependency, client-side web application crafted to relieve mental fatigue, visual exhaustion, and work strain. Built entirely with vanilla web technologies, ZenFlow requires no accounts, no API keys, no build tools, and no external backends. Everything runs locally in any modern desktop or mobile browser.

### Key Philosophy
- **Micro-Breaks:** Interactive 30-second activities to reset cognitive flow without derailing productivity.
- **Sensory Calm:** Deep cosmic navy themes, soft glowing highlights, smooth transitions, and harmonic Web Audio API procedural sound cues.
- **Genuine Progress:** Accurate calendar-date streak tracking and personal-best record keeping via browser `localStorage`.

---

## 🎮 Included Mini-Games & Mind Activities

1. **Bubble Pop (Tactile Stress Relief)**
   - 30-second zen session.
   - Varied floating bubbles (Small quick orbs, standard bubbles, large slow spheres, and rare golden bonus bubbles).
   - Pop combos for quick succession popping (up to 4x multiplier).
   - Procedural pop sounds with pitch variation and particle burst effects.
   - Clean pause, resume, and restart controls.

2. **Colour Flow (Perception & Focus Challenge)**
   - 30-second cognitive recognition challenge.
   - Rapidly match the target hue and accessible geometric symbol (Circle, Square, Triangle, Diamond, Star, Hexagon).
   - Fully playable for users with color vision differences via high-contrast symbol cues.
   - Streak tracking, accuracy percentage calculation, and immediate visual feedback.

3. **Memory Tiles (Harmonic Sequence Recall)**
   - Classic Simon-style sequence memory game.
   - 4 glowing quadrant tiles tuned to a calming pentatonic chord (C4, E4, G4, B4).
   - Strict input locking during sequence playback to prevent accidental misclicks.
   - Level progression tracking and personal-best level recording.

4. **Star Hunt (Cosmic Reflex & Observation)**
   - 30-second celestial reaction game.
   - Stars twinkle and drift across a night sky background, strictly bounded to visible play areas.
   - Multiple star tiers: Starlight (10 pts), Supernova (25 pts), and Cosmic Comet (50 pts).
   - Sparkle burst animations, floating score markers, and celestial harp chimes.

5. **Breathing Room (Guided Nervous System Reset)**
   - Centered visualizer with concentric pulsing aura rings.
   - Default 4-second Inhale and 6-second Exhale rhythm.
   - Selectable session presets: 1 Minute, 2 Minutes, or 3 Minutes.
   - Phase text countdown, singing-bowl audio transitions, and mindful minutes tracking.
   - Respects user comfort and motion preferences.

---

## 📊 Activity Tracking & LocalStorage

ZenFlow stores genuine gameplay data in your browser's `localStorage` under the key `zenflow_v1_data`.

### Schema Structure:
```json
{
  "stats": {
    "totalSessions": 0,
    "totalPlayTimeSeconds": 0,
    "totalBubblesPopped": 0,
    "totalBreathingMinutes": 0,
    "totalBreathingSessions": 0,
    "bestScores": {
      "bubblePop": 0,
      "colourFlow": 0,
      "memoryTiles": 0,
      "starHunt": 0
    },
    "streak": {
      "current": 0,
      "best": 0,
      "lastActiveDate": "YYYY-MM-DD"
    },
    "dailySessions": {
      "2026-10-25": 4
    },
    "history": [
      {
        "id": "ses_1700000000000_123",
        "gameId": "bubblePop",
        "gameName": "Bubble Pop",
        "timestamp": 1700000000000,
        "score": 420,
        "duration": 30,
        "details": "28 bubbles popped"
      }
    ]
  },
  "settings": {
    "soundEnabled": true,
    "volume": 0.5,
    "theme": "dark",
    "motion": "full",
    "ambientParticles": true
  }
}
```

### Calendar-Based Daily Streak:
Streaks are calculated comparing calendar dates (`YYYY-MM-DD`), not simple session counts.
- Playing on consecutive calendar days increments your streak.
- Multiple sessions in the same calendar day increment your total breaks without inflating your day streak.
- If a calendar day is missed, the streak resets cleanly to 1 upon your next completed session.

---

## 📁 Project Structure

```
zenflow/
├── index.html       # Semantic HTML5 layout, accessible landmarks, and game arenas
├── style.css        # Design system, glassmorphism, responsive breakpoints, dark/light themes
├── script.js        # Modular ES6 controllers: Audio, Storage, Games, Breathing, Routing
└── README.md        # Documentation, setup guide, and technical architecture
```

---

## 🚀 How to Run Locally

### Option 1: Direct File Opening (Simplest)
1. Navigate to the project directory in your file explorer.
2. Double-click `index.html` to open it in Chrome, Edge, Firefox, or Safari.
3. ZenFlow will immediately run with complete offline capabilities.

### Option 2: In VS Code with Live Server
1. Open the folder in Visual Studio Code:
   ```bash
   code .
   ```
2. Install the **Live Server** extension (by Ritwick Dey) if not already installed.
3. Right-click `index.html` in the file explorer and select **"Open with Live Server"**.
4. The application will launch at `http://127.0.0.1:5500/index.html`.

### Option 3: Local Python HTTP Server
Run from terminal or PowerShell:
```bash
python -m http.server 8000
```
Open `http://localhost:8000` in your web browser.

---

## 🔍 Verification & Functional Testing Checklist

- [x] **Zero Build Steps:** Runs pure HTML5, CSS3, and ES6 JavaScript.
- [x] **All 5 Activities Launch:** Bubble Pop, Colour Flow, Memory Tiles, Star Hunt, and Breathing Room all initialize and teardown cleanly.
- [x] **Zero Timer Leaks:** Leaving any game or switching views completely clears active intervals, timeouts, and animation frames.
- [x] **Procedural Audio:** Web Audio API synthesizes pops, harmonic notes, celestial chimes, and breathing swells with zero external MP3/WAV files.
- [x] **Persistent Progress:** Scores, streaks, settings, and session logs persist across page reloads.
- [x] **Accurate Default States:** New users start at 0 breaks, 0 streak, and empty recent activity states. No fabricated records.
- [x] **Safe Reset:** Data reset feature requires confirmation dialog to prevent accidental erasure.
- [x] **Accessibility:** Full keyboard focus states (`:focus-visible`), colorblind-friendly geometric symbols in Colour Flow, ARIA labels, and `prefers-reduced-motion` compliance.

---

## 🌐 Deploying to GitHub Pages
1. Push this repository to GitHub.
2. Go to **Settings** > **Pages** in your GitHub repository.
3. Under **Branch**, select `main` and root folder `/`, then click **Save**.
4. In moments, your site will be live at `https://<username>.github.io/<repo-name>/`.

---

*ZenFlow — Take a Little Break &bull; Crafted with care for mindful focus.*
