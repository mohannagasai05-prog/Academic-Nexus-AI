// Academic Nexus AI - Exam Schedule Tracker Controller

function getUserId() {
    return (typeof getCurrentUserId === 'function') ? getCurrentUserId() : 1;
}

async function loadExams() {
    const grid = document.getElementById('exam-cards-grid');
    grid.innerHTML = `<p class="text-xs text-slate-400 py-6 col-span-3 text-center">Loading exams list...</p>`;

    const userId = getUserId();
    try {
        const res = await fetch(`/api/exams?user_id=${userId}`);
        const exams = await res.json();

        if (exams.length === 0) {
            grid.innerHTML = `
                <div class="col-span-3 glass-panel p-8 text-center space-y-3">
                    <i class="fa-solid fa-calendar-xmark text-4xl text-slate-600"></i>
                    <h4 class="text-sm font-bold text-white">No Exams Tracked Yet</h4>
                    <p class="text-xs text-slate-400 max-w-sm mx-auto">Add your upcoming midterms, finals, or quiz dates to calculate live countdowns and generate your study plan.</p>
                    <button onclick="toggleAddExamModal()" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-2">
                        <i class="fa-solid fa-plus"></i> Add Your First Exam
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = exams.map(e => `
            <div class="glass-panel p-5 space-y-4 border border-slate-800 hover:border-slate-700 transition relative group">
                <div class="flex items-start justify-between">
                    <div>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">${e.course_code || 'COURSE'}</span>
                        <h4 class="text-base font-bold text-white">${e.subject_name}</h4>
                    </div>
                    <span class="text-[10px] text-white ${e.badge_color} px-2.5 py-0.5 rounded-full font-bold shadow-sm">${e.priority_level} PRIORITY</span>
                </div>

                <!-- Countdown Box -->
                <div class="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                    <div>
                        <span class="text-[10px] text-slate-400 uppercase font-semibold block">COUNTDOWN</span>
                        <span class="text-sm font-mono font-bold ${e.is_past ? 'text-slate-500' : 'text-indigo-400'}">${e.countdown_str}</span>
                    </div>
                    <div class="text-right">
                        <span class="text-[10px] text-slate-400 uppercase font-semibold block">WEIGHTAGE</span>
                        <span class="text-xs font-bold text-emerald-400">${e.weightage}% of Grade</span>
                    </div>
                </div>

                <!-- Details -->
                <div class="space-y-1.5 text-xs text-slate-300">
                    <p class="flex items-center gap-2">
                        <i class="fa-regular fa-clock text-slate-500 w-4"></i>
                        <span>${e.exam_date.replace('T', ' at ')}</span>
                    </p>
                    <p class="flex items-center gap-2">
                        <i class="fa-solid fa-location-dot text-slate-500 w-4"></i>
                        <span>${e.location}</span>
                    </p>
                    ${e.topics ? `
                    <div class="pt-2 border-t border-slate-800">
                        <span class="text-[10px] text-slate-400 font-semibold block">SYLLABUS TOPICS:</span>
                        <p class="text-[11px] text-indigo-300 line-clamp-2">${e.topics}</p>
                    </div>` : ''}
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div class="flex items-center gap-1 text-amber-400 text-xs">
                        ${Array.from({length: e.difficulty}).map(() => '<i class="fa-solid fa-star"></i>').join('')}
                    </div>
                    <button onclick="deleteExam(${e.id})" class="text-slate-500 hover:text-red-400 text-xs transition">
                        <i class="fa-solid fa-trash mr-1"></i> Remove
                    </button>
                </div>
            </div>
        `).join('');

    } catch (e) {
        console.error("Load Exams error:", e);
    }
}

function toggleAddExamModal() {
    const modal = document.getElementById('modal-add-exam');
    modal.classList.toggle('hidden');
}

async function submitNewExam(e) {
    e.preventDefault();
    const userId = getUserId();
    const payload = {
        subject_name: document.getElementById('exam-subject').value,
        course_code: document.getElementById('exam-code').value,
        exam_date: document.getElementById('exam-date').value,
        weightage: parseInt(document.getElementById('exam-weightage').value) || 20,
        difficulty: parseInt(document.getElementById('exam-difficulty').value) || 3,
        topics: document.getElementById('exam-topics').value,
        user_id: userId
    };

    await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    toggleAddExamModal();
    document.getElementById('form-add-exam').reset();
    loadExams();
    loadDashboardOverview();
}

async function deleteExam(id) {
    if (!confirm("Are you sure you want to remove this exam?")) return;
    const userId = getUserId();
    await fetch(`/api/exams/${id}?user_id=${userId}`, { method: 'DELETE' });
    loadExams();
    loadDashboardOverview();
}
