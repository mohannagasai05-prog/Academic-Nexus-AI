// Academic Nexus AI - LeetCode & DSA Code Arena Controller

let leetcodeProblems = [];
let currentProblem = null;
let solvedProblemIds = new Set();

async function initLeetCodeArena() {
    try {
        const res = await fetch('/api/leetcode/problems');
        leetcodeProblems = await res.json();
        renderProblemList();
        if (leetcodeProblems.length > 0) {
            selectLeetCodeProblem(leetcodeProblems[0].id);
        }
    } catch (e) {
        console.error("Failed to load LeetCode problems", e);
    }
}

function renderProblemList() {
    const listEl = document.getElementById('leetcode-problem-list');
    if (!listEl) return;

    listEl.innerHTML = leetcodeProblems.map(p => `
        <div onclick="selectLeetCodeProblem(${p.id})" id="lc-item-${p.id}" class="lc-item-btn flex items-center justify-between p-3 rounded-lg bg-slate-950/40 hover:bg-slate-900 border border-slate-800 cursor-pointer transition">
            <div class="space-y-1">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-white">${p.id}. ${p.title}</span>
                    <span class="text-[10px] ${p.badge_color} px-2 py-0.5 rounded-full font-bold">${p.difficulty}</span>
                </div>
                <p class="text-[10px] text-slate-400">${p.category}</p>
            </div>
            <span id="lc-status-${p.id}" class="text-xs">
                ${solvedProblemIds.has(p.id) ? '<i class="fa-solid fa-circle-check text-emerald-400"></i>' : '<i class="fa-regular fa-circle text-slate-600"></i>'}
            </span>
        </div>
    `).join('');
}

function selectLeetCodeProblem(id) {
    currentProblem = leetcodeProblems.find(p => p.id === id);
    if (!currentProblem) return;

    document.querySelectorAll('.lc-item-btn').forEach(el => el.classList.remove('border-indigo-500', 'bg-indigo-600/10'));
    const activeItem = document.getElementById(`lc-item-${id}`);
    if (activeItem) activeItem.classList.add('border-indigo-500', 'bg-indigo-600/10');

    document.getElementById('lc-problem-title').innerText = `${currentProblem.id}. ${currentProblem.title}`;
    const diffBadge = document.getElementById('lc-problem-diff');
    if (diffBadge) {
        diffBadge.className = `text-xs ${currentProblem.badge_color} px-2.5 py-1 rounded-full font-bold`;
        diffBadge.innerText = currentProblem.difficulty;
    }

    document.getElementById('lc-problem-category').innerText = currentProblem.category;
    document.getElementById('lc-problem-desc').innerText = currentProblem.description;

    const editor = document.getElementById('lc-code-editor');
    if (editor) editor.value = currentProblem.starter_code;

    // Reset Test Case Output Area
    const resPanel = document.getElementById('lc-test-results-panel');
    if (resPanel) resPanel.innerHTML = `<p class="text-xs text-slate-500 text-center py-6">Run your code to test against sample test cases.</p>`;
}

async function runLeetCodeSolution() {
    if (!currentProblem) return;
    const editor = document.getElementById('lc-code-editor');
    const code = editor ? editor.value : '';

    const resPanel = document.getElementById('lc-test-results-panel');
    if (resPanel) {
        resPanel.innerHTML = `
            <div class="flex items-center justify-center p-6 text-slate-400 gap-2">
                <i class="fa-solid fa-spinner fa-spin text-indigo-400"></i>
                <span class="text-xs">Executing code in Python sandbox...</span>
            </div>
        `;
    }

    try {
        const res = await fetch('/api/leetcode/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                problem_id: currentProblem.id,
                user_code: code
            })
        });

        const data = await res.json();
        renderTestResults(data);
        if (data.is_accepted) {
            solvedProblemIds.add(currentProblem.id);
            const statusIcon = document.getElementById(`lc-status-${currentProblem.id}`);
            if (statusIcon) statusIcon.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i>`;
            updateSolvedCount();
        }
    } catch (e) {
        console.error("Execution failed", e);
        if (resPanel) resPanel.innerHTML = `<p class="text-xs text-red-400 p-4">Execution error occurred.</p>`;
    }
}

function renderTestResults(data) {
    const resPanel = document.getElementById('lc-test-results-panel');
    if (!resPanel) return;

    let badgeClass = data.is_accepted ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30";

    resPanel.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div class="flex items-center gap-3">
                    <span class="text-xs font-bold px-3 py-1 rounded-full border ${badgeClass}">${data.status}</span>
                    <span class="text-xs text-slate-300">Passed: <strong class="text-white">${data.passed_count}/${data.total_count}</strong></span>
                </div>
                <div class="flex items-center gap-4 text-xs font-mono">
                    <span class="text-slate-400"><i class="fa-solid fa-stopwatch text-indigo-400"></i> ${data.runtime_ms} ms</span>
                    <span class="text-slate-400"><i class="fa-solid fa-memory text-purple-400"></i> ${data.memory_mb} MB</span>
                </div>
            </div>

            <div class="space-y-2">
                ${data.test_results.map(t => `
                    <div class="p-3 rounded-lg bg-slate-950/60 border ${t.passed ? 'border-slate-800' : 'border-red-500/30'} space-y-1">
                        <div class="flex justify-between text-xs">
                            <span class="font-bold ${t.passed ? 'text-emerald-400' : 'text-red-400'}">Test Case #${t.test_case}</span>
                            <span class="text-[10px] font-mono text-slate-400">${t.passed ? 'PASSED ✅' : 'FAILED ❌'}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 pt-1">
                            <div><span class="text-slate-500">Input:</span> ${t.input}</div>
                            <div><span class="text-slate-500">Expected:</span> ${t.expected}</div>
                        </div>
                        ${!t.passed ? `<div class="text-[11px] font-mono text-red-300 pt-1"><span class="text-slate-500">Actual:</span> ${t.actual}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

async function getLeetCodeHint() {
    if (!currentProblem) return;
    const editor = document.getElementById('lc-code-editor');
    const code = editor ? editor.value : '';

    const hintContainer = document.getElementById('lc-hint-output');
    if (hintContainer) {
        hintContainer.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-indigo-400"></i> Generating AI Hint...`;
    }

    try {
        const res = await fetch('/api/leetcode/hint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                problem_id: currentProblem.id,
                user_code: code
            })
        });

        const data = await res.json();
        if (hintContainer) {
            hintContainer.innerHTML = `
                <div class="space-y-3">
                    <div class="text-xs text-slate-200 leading-relaxed">${markedParse(data.hint)}</div>
                    <div class="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-300">
                        <strong>💡 Optimal Strategy:</strong> ${data.optimal_approach}
                    </div>
                </div>
            `;
        }
    } catch (e) {
        console.error("Hint error", e);
    }
}

function updateSolvedCount() {
    const solvedEl = document.getElementById('lc-solved-count');
    if (solvedEl) solvedEl.innerText = `${solvedProblemIds.size}/${leetcodeProblems.length}`;
}
