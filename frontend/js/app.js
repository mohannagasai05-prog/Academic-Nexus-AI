// Academic Nexus AI - Core App Controller

document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    loadDashboardOverview();
});

function getUserId() {
    return (typeof getCurrentUserId === 'function') ? getCurrentUserId() : 1;
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-page').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));

    const target = document.getElementById(`tab-${tabId}`);
    if (target) {
        target.classList.remove('hidden');
    }

    const navLink = document.getElementById(`nav-${tabId}`);
    if (navLink) {
        navLink.classList.add('active');
    }

    const titles = {
        'dashboard': 'Dashboard Overview',
        'analyzer': 'AI Document Analyzer & Flashcards',
        'solver': 'AI Step-by-Step Problem Solver',
        'tracker': 'Academic Exam Schedule Tracker',
        'schedule': 'Automated AI Schedule Maker',
        'direction_bot': 'Nexus Direction Assistant'
    };
    document.getElementById('current-tab-title').innerText = titles[tabId] || 'Academic Nexus';

    if (tabId === 'tracker') loadExams();
    if (tabId === 'schedule') loadSchedule();
    if (tabId === 'dashboard') loadDashboardOverview();
}

async function checkHealth() {
    try {
        const res = await fetch('/api/health');
        const data = await res.json();
        if (data.has_gemini_key) {
            document.getElementById('api-status-text').innerText = "Gemini Key Connected";
        } else {
            document.getElementById('api-status-text').innerText = "Built-in Engine Mode";
        }
    } catch (e) {
        console.warn("Backend connection pending initialization", e);
    }
}

async function loadDashboardOverview() {
    const userId = getUserId();
    try {
        // Fetch Exams for current user
        const resExams = await fetch(`/api/exams?user_id=${userId}`);
        const exams = await resExams.json();
        
        const nextExamCard = document.getElementById('dash-next-exam');
        const examsList = document.getElementById('dash-exams-list');

        const activeExams = exams.filter(e => !e.is_past);
        if (activeExams.length > 0) {
            const next = activeExams[0];
            nextExamCard.innerText = `${next.subject_name} (${next.days_left}d left)`;
            
            examsList.innerHTML = activeExams.slice(0, 3).map(e => `
                <div class="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-semibold text-xs text-white">${e.subject_name}</span>
                            <span class="text-[10px] text-white ${e.badge_color} px-2 py-0.5 rounded-full font-bold">${e.priority_level}</span>
                        </div>
                        <p class="text-[11px] text-slate-400">Date: ${e.exam_date.replace('T', ' ')} | Weight: ${e.weightage}%</p>
                    </div>
                    <span class="text-xs font-mono font-bold text-indigo-400">${e.countdown_str}</span>
                </div>
            `).join('');
        } else {
            nextExamCard.innerText = "No Upcoming Exams";
            examsList.innerHTML = `<p class="text-xs text-slate-500 py-3 text-center">No active exams found.</p>`;
        }

        // Fetch Schedule for current user
        const resSched = await fetch(`/api/schedule?user_id=${userId}`);
        const sessions = await resSched.json();
        const schedList = document.getElementById('dash-schedule-list');

        if (sessions.length > 0) {
            const todayStr = new Date().toISOString().split('T')[0];
            const todaySessions = sessions.filter(s => s.date_str === todayStr).slice(0, 3);

            if (todaySessions.length > 0) {
                schedList.innerHTML = todaySessions.map(s => `
                    <div class="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid ${s.is_completed ? 'fa-circle-check text-emerald-400' : 'fa-circle-notch text-indigo-400'}"></i>
                            <div>
                                <h5 class="text-xs font-semibold ${s.is_completed ? 'line-through text-slate-500' : 'text-white'}">${s.title}</h5>
                                <p class="text-[10px] text-slate-400">${s.start_time} - ${s.end_time} (${s.session_type})</p>
                            </div>
                        </div>
                        <button onclick="toggleSessionDash(${s.id})" class="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300">
                            ${s.is_completed ? 'Undo' : 'Complete'}
                        </button>
                    </div>
                `).join('');
            } else {
                schedList.innerHTML = `<p class="text-xs text-slate-500 py-3 text-center">No sessions scheduled for today. Click "Generate Study Plan".</p>`;
            }
        }
    } catch (e) {
        console.error("Dashboard overview error:", e);
    }
}

async function toggleSessionDash(id) {
    const userId = getUserId();
    await fetch(`/api/schedule/toggle/${id}?user_id=${userId}`, { method: 'POST' });
    loadDashboardOverview();
}

function toggleSettingsModal() {
    const modal = document.getElementById('modal-settings');
    modal.classList.toggle('hidden');
}

async function saveSettings() {
    const key = document.getElementById('setting-gemini-key').value;
    await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gemini_api_key: key })
    });
    toggleSettingsModal();
    checkHealth();
}
