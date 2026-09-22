// Pomodoro Focus Timer & Ambient Lo-Fi Noise Engine

let timerInterval = null;
let timeLeft = 25 * 60;
let isRunning = false;
let currentMode = 'work'; // 'work', 'short', 'long'
let completedSessions = 0;

// Audio Context for Ambient White/Brown Noise (Synthesized, zero assets needed!)
let audioCtx = null;
let noiseNode = null;
let isAudioPlaying = false;

function initPomodoro() {
    updateTimerDisplay();
}

function setTimerMode(mode) {
    currentMode = mode;
    pauseTimer();
    
    document.querySelectorAll('.pomo-mode-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('bg-slate-800', 'text-slate-400');
    });

    const activeBtn = document.getElementById(`pomo-mode-${mode}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-indigo-600', 'text-white');
        activeBtn.classList.remove('bg-slate-800', 'text-slate-400');
    }

    if (mode === 'work') timeLeft = 25 * 60;
    else if (mode === 'short') timeLeft = 5 * 60;
    else if (mode === 'long') timeLeft = 15 * 60;

    updateTimerDisplay();
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;

    document.getElementById('pomo-start-btn').classList.add('hidden');
    document.getElementById('pomo-pause-btn').classList.remove('hidden');
    document.getElementById('pomo-circle').classList.add('timer-active');

    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
        } else {
            handleTimerComplete();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    document.getElementById('pomo-start-btn').classList.remove('hidden');
    document.getElementById('pomo-pause-btn').classList.add('hidden');
    document.getElementById('pomo-circle').classList.remove('timer-active');
}

function resetTimer() {
    pauseTimer();
    setTimerMode(currentMode);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    const displayEl = document.getElementById('pomo-time-display');
    if (displayEl) displayEl.innerText = formatted;

    const statusEl = document.getElementById('pomo-status-label');
    if (statusEl) {
        if (currentMode === 'work') statusEl.innerText = isRunning ? '⚡ Focus Work Session' : 'Ready to Focus';
        else if (currentMode === 'short') statusEl.innerText = '☕ Short Break';
        else if (currentMode === 'long') statusEl.innerText = '🌴 Long Break';
    }
}

function handleTimerComplete() {
    pauseTimer();
    playChime();
    if (currentMode === 'work') {
        completedSessions++;
        const countEl = document.getElementById('pomo-session-count');
        if (countEl) countEl.innerText = completedSessions;
        alert("🎉 Focus session complete! Time to take a break.");
        setTimerMode('short');
    } else {
        alert("⏰ Break complete! Ready for your next focus sprint?");
        setTimerMode('work');
    }
}

// Chime Audio Generator using Web Audio API
function playChime() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.5); // C6
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
    } catch(e) {
        console.warn("Audio chime unsupported", e);
    }
}

// Ambient Binaural / White Noise Generator
function toggleAmbientSound() {
    if (isAudioPlaying) {
        stopAmbientSound();
    } else {
        startAmbientSound();
    }
}

function startAmbientSound() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = audioCtx.sampleRate * 2;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02; // Brown noise algorithm
            lastOut = output[i];
            output[i] *= 3.5;
        }

        noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = noiseBuffer;
        noiseNode.loop = true;
        
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.08; // Gentle background level
        
        noiseNode.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        noiseNode.start();
        isAudioPlaying = true;
        
        const soundBtn = document.getElementById('ambient-sound-btn');
        if (soundBtn) {
            soundBtn.innerHTML = `<i class="fa-solid fa-volume-high text-emerald-400"></i> Ambient Noise: ON`;
            soundBtn.classList.add('border-emerald-500/50');
        }
    } catch (e) {
        console.warn("Ambient sound error:", e);
    }
}

function stopAmbientSound() {
    if (noiseNode) {
        try { noiseNode.stop(); } catch(e){}
    }
    isAudioPlaying = false;
    const soundBtn = document.getElementById('ambient-sound-btn');
    if (soundBtn) {
        soundBtn.innerHTML = `<i class="fa-solid fa-volume-xmark text-slate-400"></i> Ambient Noise: OFF`;
        soundBtn.classList.remove('border-emerald-500/50');
    }
}
