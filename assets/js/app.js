// 20-Min Daily Fitness Tracker - Core Logic Model

let currentWeek = 1;
let currentDay = 1;
let warmupOpen = false;

// Progress Tracking LocalStorage bindings
let progress = JSON.parse(localStorage.getItem('habitTracker_progress')) || {};
let activeCheckboxes = JSON.parse(localStorage.getItem('habitTracker_checks')) || {};

// Program Blueprint Database
const workouts = {
    1: { 
        tag: "Strength | Upper + Core Focus", 
        title: "Upper & Core", 
        cycles: "4 Rounds",
        timePerCycle: "45s Work / 15s Rest",
        type: "standard",
        workSec: 45,
        restSec: 15,
        warmup: "Do 30s shoulder circles, 30s arm crosses, 30s walkouts into a plank, and 30s slow mountain climbers.",
        exercises: [
            { name: "Dumbbell Floor Press / Push-ups", reps: "12-15 reps" },
            { name: "KB / DB Gorilla Rows", reps: "10 reps / side" },
            { name: "Dumbbell Arnold Press", reps: "12 reps" },
            { name: "Hollow Body Hold or Plank", reps: "45-sec hold" }
        ]
    },
    2: { 
        tag: "Strength | Lower Focus", 
        title: "Lower Body Strength", 
        cycles: "4 Rounds",
        timePerCycle: "45s Work / 15s Rest",
        type: "standard",
        workSec: 45,
        restSec: 15,
        warmup: "Do 30s bodyweight squats, 30s hip openers (hip circles), 30s alternate reverse lunges, and 30s light calf bounces.",
        exercises: [
            { name: "KB or DB Goblet Squats", reps: "12-15 reps" },
            { name: "Dumbbell Romanian Deadlifts", reps: "12 reps" },
            { name: "Bodyweight Alternating Reverse Lunges", reps: "10 reps / leg" },
            { name: "Weighted Glute Bridges", reps: "15 reps" }
        ]
    },
    3: { 
        tag: "Metcon | Cardiovascular", 
        title: "Full Body Conditioning", 
        cycles: "AMRAP (Self-Paced Sets)",
        timePerCycle: "16 Mins continuous pace",
        type: "amrap",
        warmup: "Do 30s jumping jacks, 30s light shadow boxing, 30s dynamic hamstring stretches, and 30s squat to overhead reaches.",
        exercises: [
            { name: "Kettlebell Swings", reps: "15 reps" },
            { name: "Bodyweight Burpees", reps: "8 reps" },
            { name: "Dumbbell Thrusters", reps: "10 reps" },
            { name: "Mountain Climbers", reps: "20 reps total" }
        ]
    },
    4: { 
        tag: "Recovery | Active Movement", 
        title: "Core & Active Mobility", 
        cycles: "3 Rounds (Self-Paced Sets)",
        timePerCycle: "Deliberate quality focus",
        type: "mobility",
        warmup: "Do 30s cat-cow spinal flows, 30s child's pose breathing, 30s slow thoracic rotations, and 30s bird-dog extensions.",
        exercises: [
            { name: "Bird-Dog Extension", reps: "Hold 3s • 10 total" },
            { name: "Kettlebell Halo", reps: "5 clockwise / 5 counter" },
            { name: "Cossack Squat (Lateral)", reps: "6 reps / leg" },
            { name: "Deadbug Core Stabilization", reps: "12 reps total" }
        ]
    },
    5: { 
        tag: "Strength | Push + Pull Mixed", 
        title: "Full Body Push/Pull", 
        cycles: "EMOM",
        timePerCycle: "16 Mins total (Swap each min)",
        type: "emom",
        workSec: 45,
        restSec: 15,
        warmup: "Do 30s jumping jacks, 30s arm swings, 30s alternate side lunges, and 30s bodyweight active deadbugs.",
        exercises: [
            { name: "Min 1: DB Renegade Rows", reps: "12 reps" },
            { name: "Min 2: KB Sumo Deadlift High Pulls", reps: "15 reps" },
            { name: "Min 3: DB Goblet Lunges", reps: "12 alt reps" },
            { name: "Min 4: Plank Shoulder Taps", reps: "45s work / 15s rest" }
        ]
    },
    6: { 
        tag: "Power | Dynamic Endurance", 
        title: "Athletic Power", 
        cycles: "4 Rounds",
        timePerCycle: "40s Work / 20s Rest",
        type: "standard",
        workSec: 40,
        restSec: 20,
        warmup: "Do 30s high knees, 30s dynamic chest sweeps, 30s fast-tempo air squats, and 30s rapid hand reaches.",
        exercises: [
            { name: "KB Snatch or Clean & Press", reps: "Switch arms halfway" },
            { name: "Bodyweight Jump Squats", reps: "Controlled explosive" },
            { name: "Heavy Dumbbell Farmer's Walk", reps: "40 seconds active" },
            { name: "Alternating Bicycle Crunches", reps: "Burnout" }
        ]
    },
    7: { 
        tag: "Restorative | Stretching", 
        title: "Restoration & Flex", 
        cycles: "1 Round",
        timePerCycle: "Hold poses 60-90s each",
        type: "restoration",
        warmup: "Perform 60s of deep diaphragmatic breathing sitting comfortably, followed by 60s of slow neck and shoulder rolls.",
        exercises: [
            { name: "Child’s Pose to Cobra Flow", reps: "Active breathing" },
            { name: "90/90 Structural Hip Openers", reps: "Left & Right" },
            { name: "World's Greatest Stretch Sequence", reps: "Slow Alternating" },
            { name: "Deep Hamstring & Lower Back Release", reps: "Decompress" }
        ]
    }
};

// Timer Variables
let timerDuration = 20 * 60; // 20 minutes in seconds
let timerSecondsLeft = timerDuration;
let timerInterval = null;

// Browser Audio context configuration
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playFinishBeep() {
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        console.log("Audio contextual block active.");
    }
}

// Initializer
function initApp() {
    renderDayNavigationNodes();
    renderWorkoutDetails();
    recalculateProgressStats();
}

// Dynamic Day Navigation Generators
function renderDayNavigationNodes() {
    const container = document.getElementById('daySelectorContainer');
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    container.innerHTML = '';

    for (let d = 1; d <= 7; d++) {
        const key = `w${currentWeek}d${d}`;
        const isCompleted = progress[key];
        const isActive = d === currentDay;

        const button = document.createElement('button');
        button.onclick = () => changeDay(d);
        button.id = `day-node-${d}`;

        let borderClass = "border-white/5 bg-brand-card text-brand-muted hover:border-white/10 hover:text-white";
        if (isActive) {
            borderClass = "border-brand-accent bg-brand-accent/10 text-white font-extrabold scale-105 shadow-md shadow-brand-accent/5 z-10";
        } else if (isCompleted) {
            borderClass = "border-transparent bg-brand-success/10 text-brand-success font-semibold";
        }

        button.className = `flex-1 min-w-[38px] py-1.5 rounded-lg flex flex-col items-center border transition-all relative ${borderClass}`;
        button.innerHTML = `
            <span class="text-[8px] uppercase tracking-wide font-medium">${days[d-1]}</span>
            <span class="text-xs font-black">D${d}</span>
            <span class="day-dot ${isCompleted ? '' : 'hidden'} w-1.5 h-1.5 rounded-full bg-brand-success absolute bottom-0.5"></span>
        `;

        container.appendChild(button);
    }
}

// Week Navigation updates
function changeWeek(selectedWeek) {
    currentWeek = selectedWeek;
    for (let w = 1; w <= 4; w++) {
        const tab = document.getElementById(`week-tab-${w}`);
        if (w === selectedWeek) {
            tab.className = "flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all text-white bg-brand-accent shadow";
        } else {
            tab.className = "flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all text-brand-muted hover:text-white";
        }
    }
    renderDayNavigationNodes();
    renderWorkoutDetails();
    resetTimer();
}

// Active Day Switcher
function changeDay(selectedDay) {
    currentDay = selectedDay;
    renderDayNavigationNodes();
    renderWorkoutDetails();
    resetTimer();
}

// Collapsible warm-up accordions to save mobile heights
function toggleWarmupAccordion() {
    warmupOpen = !warmupOpen;
    setWarmupOpenState(warmupOpen);
}

function setWarmupOpenState(isOpen) {
    const content = document.getElementById('workoutWarmup');
    const caret = document.getElementById('warmupCaret');
    warmupOpen = isOpen;
    if (isOpen) {
        content.classList.remove('hidden');
        caret.style.transform = 'rotate(180deg)';
    } else {
        content.classList.add('hidden');
        caret.style.transform = 'rotate(0deg)';
    }
}

// Render dynamic card content and active set indicators
function renderWorkoutDetails() {
    const data = workouts[currentDay];
    
    document.getElementById('workoutTargetArea').innerText = data.tag;
    document.getElementById('workoutTitle').innerText = data.title;
    document.getElementById('workoutWarmup').innerText = data.warmup;
    
    document.getElementById('cyclesDetail').innerText = data.cycles;
    document.getElementById('timeDetail').innerText = data.timePerCycle;

    const container = document.getElementById('exerciseContainer');
    container.innerHTML = '';

    data.exercises.forEach((ex, idx) => {
        const card = document.createElement('div');
        card.id = `exercise-card-${idx}`;
        card.className = "flex flex-col gap-1.5 p-2.5 rounded-xl border border-white/5 bg-black/50 hover:border-white/10 transition-all";
        
        let setTrackerHTML = '<div class="flex gap-1.5 mt-1">';
        
        if (data.type === "restoration") {
            const activeKey = `w${currentWeek}d${currentDay}e${idx}s0`;
            const isDone = activeCheckboxes[activeKey];
            setTrackerHTML += `
                <div id="set-pill-${idx}-0" 
                     onclick="toggleManualSetCheck('${activeKey}', ${idx}, 0)"
                     class="flex-1 py-1 rounded text-[9px] font-black tracking-wider text-center cursor-pointer transition-all border ${isDone ? 'bg-brand-success text-brand-bg border-brand-success font-bold' : 'bg-white/5 border-white/10 text-brand-muted'}">
                     HOLD TARGET (4 MINS)
                </div>
            `;
        } else {
            const roundLimit = (data.type === "mobility") ? 3 : 4;
            for (let s = 0; s < roundLimit; s++) {
                const activeKey = `w${currentWeek}d${currentDay}e${idx}s${s}`;
                const isDone = activeCheckboxes[activeKey];
                const clickAction = (data.type === "amrap" || data.type === "mobility") 
                    ? `onclick="toggleManualSetCheck('${activeKey}', ${idx}, ${s})"` 
                    : "";

                setTrackerHTML += `
                    <div id="set-pill-${idx}-${s}" 
                         ${clickAction}
                         class="flex-1 py-1 rounded text-[9px] font-black tracking-wider text-center transition-all border ${data.type === 'amrap' || data.type === 'mobility' ? 'cursor-pointer' : ''} ${isDone ? 'bg-brand-success text-brand-bg border-brand-success' : 'bg-white/5 border-white/10 text-brand-muted'}">
                         SET ${s + 1}
                    </div>
                `;
            }
        }
        
        setTrackerHTML += '</div>';

        card.innerHTML = `
            <div class="flex items-center justify-between min-w-0">
                <span class="text-xs font-bold text-white truncate pr-2">${ex.name}</span>
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-brand-warning text-right shrink-0">${ex.reps}</span>
            </div>
            ${setTrackerHTML}
        `;
        container.appendChild(card);
    });

    // Update compact status completion indicators
    const key = `w${currentWeek}d${currentDay}`;
    const compBtn = document.getElementById('compactCompleteBtn');
    const compText = document.getElementById('compactCompleteText');

    if (progress[key]) {
        compBtn.className = "px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-brand-success/20 text-brand-success border-brand-success/30 transition-all flex items-center gap-1";
        compText.innerText = "Done";
    } else {
        compBtn.className = "px-2.5 py-1 rounded-lg text-[10px] font-bold border border-white/10 hover:border-white/20 text-brand-muted hover:text-white transition-all flex items-center gap-1";
        compText.innerText = "Mark Done";
    }

    // Default clean-state HUD definitions
    document.getElementById('hudStateBadge').innerText = "READY";
    document.getElementById('hudStateBadge').className = "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-brand-accent text-white";
    document.getElementById('hudStateDetails').innerText = "Press play to begin";
    document.getElementById('hudStateTime').innerText = "--";
    document.getElementById('hudStateTime').className = "text-3xl font-timer font-black text-brand-accent leading-none mt-0.5";

    const warmupHeader = document.getElementById('warmupHeader');
    const warmupIcon = document.getElementById('warmupIcon');
    warmupHeader.className = "w-full flex items-center justify-between bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-[11px] text-brand-muted border border-white/5 transition-all cursor-pointer";
    warmupIcon.className = "h-3.5 w-3.5 text-brand-muted flex-shrink-0";
    setWarmupOpenState(false);
}

// Toggle manual check indicators on AMRAP/Mobility splits
function toggleManualSetCheck(key, exIdx, setIdx) {
    const pill = document.getElementById(`set-pill-${exIdx}-${setIdx}`);
    if (activeCheckboxes[key]) {
        delete activeCheckboxes[key];
        pill.className = "flex-1 py-1 rounded text-[9px] font-black tracking-wider text-center cursor-pointer transition-all border bg-white/5 border-white/10 text-brand-muted";
    } else {
        activeCheckboxes[key] = true;
        pill.className = "flex-1 py-1 rounded text-[9px] font-black tracking-wider text-center cursor-pointer transition-all border bg-brand-success text-brand-bg border-brand-success";
    }
    localStorage.setItem('habitTracker_checks', JSON.stringify(activeCheckboxes));
}

// Completion state trackers
function toggleDayCompletedState() {
    const key = `w${currentWeek}d${currentDay}`;
    if (progress[key]) {
        delete progress[key];
    } else {
        progress[key] = true;
        const data = workouts[currentDay];
        const roundLimit = (data.type === "mobility") ? 3 : (data.type === "restoration" ? 1 : 4);
        data.exercises.forEach((ex, idx) => {
            for (let s = 0; s < roundLimit; s++) {
                const activeKey = `w${currentWeek}d${currentDay}e${idx}s${s}`;
                activeCheckboxes[activeKey] = true;
            }
        });
        localStorage.setItem('habitTracker_checks', JSON.stringify(activeCheckboxes));
    }
    
    localStorage.setItem('habitTracker_progress', JSON.stringify(progress));
    renderDayNavigationNodes();
    renderWorkoutDetails();
    recalculateProgressStats();
}

// Progress metrics tracking engine
function recalculateProgressStats() {
    const totalDays = 28;
    const completedCount = Object.keys(progress).length;
    const pct = Math.round((completedCount / totalDays) * 100);

    document.getElementById('progressPercent').innerText = `${pct}%`;
    document.getElementById('progressBar').style.width = `${pct}%`;

    let longestStreak = 0;
    let currentStreak = 0;
    
    for (let w = 1; w <= 4; w++) {
        for (let d = 1; d <= 7; d++) {
            const key = `w${w}d${d}`;
            if (progress[key]) {
                currentStreak++;
                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                }
            } else {
                currentStreak = 0;
            }
        }
    }

    document.getElementById('streakVal').innerText = `${longestStreak} Day${longestStreak === 1 ? '' : 's'}`;
}

// High-visibility interval countdown calculations
function updateActiveHighlight(timeLeft) {
    const data = workouts[currentDay];
    const hudBadge = document.getElementById('hudStateBadge');
    const hudDetails = document.getElementById('hudStateDetails');
    const hudTime = document.getElementById('hudStateTime');
    const warmupHeader = document.getElementById('warmupHeader');
    const warmupIcon = document.getElementById('warmupIcon');

    const totalSeconds = 20 * 60;
    const elapsed = totalSeconds - timeLeft;

    // Warmup boundaries (First 2 mins)
    if (elapsed < 120) {
        setWarmupOpenState(true);
        warmupHeader.className = "w-full flex items-center justify-between bg-brand-warning/10 hover:bg-brand-warning/20 px-3 py-1.5 rounded-lg text-[11px] text-brand-warning border border-brand-warning/20 transition-all cursor-pointer animate-pulse-slow";
        warmupIcon.className = "h-3.5 w-3.5 text-brand-warning flex-shrink-0";

        hudBadge.innerText = "WARM UP";
        hudBadge.className = "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-brand-warning text-black animate-pulse";
        hudDetails.innerText = "Prep joints!";
        hudTime.innerText = `${120 - elapsed}s`;
        hudTime.className = "text-3xl font-timer font-black text-brand-warning leading-none mt-0.5";
        return;
    }

    // Cooldown boundaries (Last 2 mins)
    if (elapsed >= 1080) {
        setWarmupOpenState(false);
        warmupHeader.className = "w-full flex items-center justify-between bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-[11px] text-brand-muted border border-white/5 transition-all cursor-pointer";
        warmupIcon.className = "h-3.5 w-3.5 text-brand-muted flex-shrink-0";

        hudBadge.innerText = "STRETCH";
        hudBadge.className = "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-brand-success text-black";
        hudDetails.innerText = "Decompress!";
        hudTime.innerText = `${1200 - elapsed}s`;
        hudTime.className = "text-3xl font-timer font-black text-brand-success leading-none mt-0.5";
        return;
    }

    // Regular active circuit (Minutes 2:00 - 18:00)
    setWarmupOpenState(false);
    warmupHeader.className = "w-full flex items-center justify-between bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-[11px] text-brand-muted border border-white/5 transition-all cursor-pointer";
    warmupIcon.className = "h-3.5 w-3.5 text-brand-muted flex-shrink-0";

    const activeSeconds = elapsed - 120;
    let activeExIdx = -1;
    let activeSetIdx = -1;
    let isWork = true;
    let remaining = 0;
    let label = "";

    if (data.type === "standard") {
        const blockTime = data.workSec + data.restSec;
        const roundTime = blockTime * 4;
        activeSetIdx = Math.floor(activeSeconds / roundTime);
        const roundSeconds = activeSeconds % roundTime;
        
        activeExIdx = Math.floor(roundSeconds / blockTime);
        const blockSeconds = roundSeconds % blockTime;

        isWork = blockSeconds < data.workSec;
        remaining = isWork ? (data.workSec - blockSeconds) : (blockTime - blockSeconds);
        label = `Round ${activeSetIdx + 1}/4 • Ex ${activeExIdx + 1}`;
        
        hudBadge.innerText = isWork ? "WORK" : "REST";
        hudBadge.className = `text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${isWork ? 'bg-brand-accent text-white' : 'bg-brand-warning text-black animate-pulse'}`;
        hudDetails.innerText = label;
        hudTime.innerText = `${remaining}s`;
        hudTime.className = `text-3xl font-timer font-black leading-none mt-0.5 ${isWork ? 'text-brand-accent' : 'text-brand-warning'}`;

        paintAutomatedSets(activeExIdx, activeSetIdx, isWork, 4);

    } else if (data.type === "emom") {
        const currentMin = Math.floor(activeSeconds / 60);
        activeExIdx = currentMin % 4;
        activeSetIdx = Math.floor(currentMin / 4);
        const secOfMin = activeSeconds % 60;

        if (activeExIdx === 3) {
            isWork = secOfMin < 45;
            remaining = isWork ? (45 - secOfMin) : (60 - secOfMin);
            hudBadge.innerText = isWork ? "WORK" : "REST";
        } else {
            isWork = secOfMin < 50; 
            remaining = 60 - secOfMin;
            hudBadge.innerText = "EMOM";
        }

        hudBadge.className = `text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${isWork ? 'bg-brand-accent text-white' : 'bg-brand-warning text-black'}`;
        hudDetails.innerText = `EMOM Min ${currentMin + 1}/16`;
        hudTime.innerText = `${remaining}s`;
        hudTime.className = `text-3xl font-timer font-black leading-none mt-0.5 ${isWork ? 'text-brand-accent' : 'text-brand-warning'}`;

        paintAutomatedSets(activeExIdx, activeSetIdx, isWork, 4);

    } else if (data.type === "amrap" || data.type === "mobility") {
        hudBadge.innerText = data.type.toUpperCase();
        hudBadge.className = "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-purple-500 text-white";
        hudDetails.innerText = "Log sets manually as you complete!";
        hudTime.innerText = `${1080 - elapsed}s`;
        hudTime.className = "text-3xl font-timer font-black text-purple-400 leading-none mt-0.5";

    } else if (data.type === "restoration") {
        activeExIdx = Math.floor(activeSeconds / 240);
        remaining = 240 - (activeSeconds % 240);
        
        hudBadge.innerText = "HOLD";
        hudBadge.className = "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-brand-success text-black";
        hudDetails.innerText = `Pose ${activeExIdx + 1}/4`;
        hudTime.innerText = `${remaining}s`;
        hudTime.className = "text-3xl font-timer font-black text-brand-success leading-none mt-0.5";

        paintAutomatedSets(activeExIdx, 0, true, 1);
    }
}

// Highlight running sets
function paintAutomatedSets(currentActiveExIdx, currentActiveSetIdx, isWorkState, totalSets) {
    for (let ex = 0; ex < 4; ex++) {
        const card = document.getElementById(`exercise-card-${ex}`);
        if (!card) continue;

        if (ex === currentActiveExIdx) {
            card.className = "flex flex-col gap-1.5 p-2.5 rounded-xl border border-brand-accent shadow-lg shadow-brand-accent/10 bg-black/50 transition-all";
        } else {
            card.className = "flex flex-col gap-1.5 p-2.5 rounded-xl border border-white/5 bg-black/50 opacity-40 transition-all";
        }

        for (let s = 0; s < totalSets; s++) {
            const pill = document.getElementById(`set-pill-${ex}-${s}`);
            if (!pill) continue;

            const thisBlock = s * 4 + ex;
            const currentBlock = currentActiveSetIdx * 4 + currentActiveExIdx;

            if (thisBlock < currentBlock) {
                pill.className = "flex-1 py-1 rounded text-[9px] font-black tracking-wider text-center transition-all border bg-brand-success text-brand-bg border-brand-success";
            } else if (thisBlock === currentBlock) {
                if (isWorkState) {
                    pill.className = "flex-1 py-1 rounded text-[9px] font-black tracking-wider text-center transition-all border bg-brand-accent text-white border-brand-accent animate-pulse shadow shadow-brand-accent/30";
                } else {
                    pill.className = "flex-1 py-1 rounded text-[9px] font-black tracking-wider text-center transition-all border bg-brand-warning text-brand-bg border-brand-warning animate-pulse";
                }
            } else {
                pill.className = "flex-1 py-1 rounded text-[9px] font-black tracking-wider text-center transition-all border bg-white/5 border-white/10 text-brand-muted";
            }
        }
    }
}

// Play & Pause control triggers
function toggleTimer() {
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    const timerContainer = document.getElementById('timerContainer');

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        timerContainer.classList.remove('animate-pulse-slow');
    } else {
        timerContainer.classList.add('animate-pulse-slow');
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');

        timerInterval = setInterval(() => {
            timerSecondsLeft--;
            updateTimerDisplay();
            updateActiveHighlight(timerSecondsLeft);

            if (timerSecondsLeft <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                playIcon.classList.remove('hidden');
                pauseIcon.classList.add('hidden');
                timerContainer.classList.remove('animate-pulse-slow');
                playFinishBeep();
            }
        }, 1000);
    }
}

// Reset trigger
function resetTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    document.getElementById('playIcon').classList.remove('hidden');
    document.getElementById('pauseIcon').classList.add('hidden');
    document.getElementById('timerContainer').classList.remove('animate-pulse-slow');
    
    timerSecondsLeft = timerDuration;
    updateTimerDisplay();
    renderWorkoutDetails();
}

function updateTimerDisplay() {
    const m = Math.floor(timerSecondsLeft / 60);
    const s = timerSecondsLeft % 60;
    const minStr = m < 10 ? `0${m}` : m;
    const secStr = s < 10 ? `0${s}` : s;
    document.getElementById('timerDisplay').innerText = `${minStr}:${secStr}`;
}

window.onload = function() {
    initApp();
};
