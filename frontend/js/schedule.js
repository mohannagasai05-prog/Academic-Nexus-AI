// Academic Nexus AI - Schedule Maker Controller

function getUserId() {
    return (typeof getCurrentUserId === 'function') ? getCurrentUserId() : 1;
}

async function loadSchedule() {
    const container = document.getElementById('schedule-container');
    container.innerHTML = `<p class="text-xs text-slate-400 py-6 text-center">Loading study schedule...</p>`;

    const userId = getUserId();
    try {
        const res = await fetch(`/api/schedule?user_id=${userId}`);
        const sessions = await res.json();

        if (sessions.length === 0) {
            container.innerHTML = `
                <div class="glass-panel p-8 text-center space-y-3 bg-slate-950/40">
                    <i class="fa-solid fa-calendar-week text-4xl text-slate-600"></i>
                    <h4 class="text-sm font-bold text-white">No Timetable Sessions Generated</h4>
                    <p class="text-xs text-slate-400 max-w-md mx-auto">Select your target study hours above and click "Generate Timetable" to create your customized daily routine.</p>
                    <button onclick="generateSchedule()" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-2">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Generate Smart Timetable Now
                    </button>
                </div>
            `;
            return;
        }

        const grouped = {};
        sessions.forEach(s => {
            if (!grouped[s.date_str]) grouped[s.date_str] = [];
            grouped[s.date_str].push(s);
        });

        container.innerHTML = Object.keys(grouped).map(dateStr => `
            <div class="space-y-3">
                <div class="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <i class="fa-solid fa-calendar text-indigo-400 text-xs"></i>
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider">${new Date(dateStr + 'T00:00:00').toDateString()}</h4>
                    <span class="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">${grouped[dateStr].length} Sessions</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    ${grouped[dateStr].map(s => `
                        <div class="p-3.5 rounded-xl ${s.is_completed ? 'bg-slate-950/40 border-slate-800/50 opacity-60' : 'bg-slate-950/80 border-slate-800'} border space-y-2 flex flex-col justify-between">
                            <div class="space-y-1">
                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] font-mono font-semibold text-indigo-400">${s.start_time} - ${s.end_time}</span>
                                    <span class="text-[9px] uppercase font-bold px-2 py-0.5 rounded ${s.session_type === 'revision' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}">${s.session_type}</span>
                                </div>
                                <h5 class="text-xs font-bold ${s.is_completed ? 'line-through text-slate-500' : 'text-white'}">${s.title}</h5>
                                <p class="text-[11px] text-slate-400 line-clamp-2">${s.notes}</p>
                            </div>

                            <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                <span class="text-[10px] text-slate-500">${s.subject_name}</span>
                                <button onclick="toggleSession(${s.id})" class="text-[10px] ${s.is_completed ? 'bg-slate-800 text-slate-400' : 'bg-indigo-600 text-white'} hover:opacity-90 px-2.5 py-1 rounded font-medium transition">
                                    ${s.is_completed ? 'Completed ✓' : 'Mark Complete'}
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

    } catch (e) {
        console.error("Load Schedule Error:", e);
    }
}

async function generateSchedule() {
    const hours = parseFloat(document.getElementById('sched-hours').value) || 4.0;
    const container = document.getElementById('schedule-container');
    const userId = getUserId();

    container.innerHTML = `<p class="text-xs text-indigo-400 py-6 text-center"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Optimizing timetable based on exam weightages and target hours...</p>`;

    try {
        await fetch('/api/schedule/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target_hours: hours, days_ahead: 7, user_id: userId })
        });
        loadSchedule();
        loadDashboardOverview();
    } catch (e) {
        console.error(e);
    }
}

async function toggleSession(id) {
    const userId = getUserId();
    await fetch(`/api/schedule/toggle/${id}?user_id=${userId}`, { method: 'POST' });
    loadSchedule();
    loadDashboardOverview();
}

function exportICS() {
    const userId = getUserId();
    window.location.href = `/api/schedule/export.ics?user_id=${userId}`;
}
