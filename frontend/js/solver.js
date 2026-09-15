// Academic Nexus AI - Step-by-Step Problem Solver Controller

function setSampleProblem(text) {
    document.getElementById('solver-input').value = text;
}

async function executeProblemSolver() {
    const query = document.getElementById('solver-input').value.trim();
    const category = document.getElementById('solver-category').value;
    if (!query) return;

    const outputContainer = document.getElementById('solver-output-container');
    outputContainer.classList.remove('hidden');

    document.getElementById('solver-title').innerText = "Solving problem...";
    document.getElementById('solver-given').innerText = query;
    document.getElementById('solver-steps').innerHTML = `
        <div class="p-4 text-xs text-indigo-400 bg-slate-950/40 rounded-xl flex items-center gap-2">
            <i class="fa-solid fa-spinner fa-spin"></i> Breaking down problem into logical chain of thought steps...
        </div>
    `;

    try {
        const res = await fetch('/api/solver/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ problem_query: query, subject_category: category })
        });
        const data = await res.json();

        // Render Solution Details
        document.getElementById('solver-title').innerText = data.title || "Step-by-Step Solution";
        document.getElementById('solver-category-badge').innerText = category;
        document.getElementById('solver-given').innerText = data.given || query;

        // Render Formulas
        const formulasDiv = document.getElementById('solver-formulas');
        if (data.formulas && data.formulas.length > 0) {
            formulasDiv.innerHTML = data.formulas.join("<br>");
        } else {
            formulasDiv.innerText = "Direct Analytical Principles";
        }

        // Render Steps
        const stepsContainer = document.getElementById('solver-steps');
        if (data.steps && data.steps.length > 0) {
            stepsContainer.innerHTML = data.steps.map(s => `
                <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">${s.step_number || 1}</span>
                        <h6 class="text-xs font-bold text-white">${s.heading || 'Step Execution'}</h6>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">${s.explanation}</p>
                    ${s.math ? `<div class="p-2.5 bg-slate-900 rounded-lg text-xs font-mono text-indigo-300 border border-indigo-500/20 math-rendered">${s.math}</div>` : ''}
                </div>
            `).join('');
        }

        // Final Answer & Practice
        document.getElementById('solver-final-answer').innerText = data.final_answer || "Done";
        document.getElementById('solver-practice').innerText = data.practice_problem || "Try solving with different constants.";

        // Render math equations if KaTeX auto-render is loaded
        if (window.renderMathInElement) {
            renderMathInElement(outputContainer, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                ]
            });
        }
    } catch (e) {
        console.error("Solver Error:", e);
    }
}

function copyPracticeProblem() {
    const text = document.getElementById('solver-practice').innerText;
    document.getElementById('solver-input').value = text;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
