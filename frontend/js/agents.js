// Academic Nexus AI - Autonomous AI Agents Controller

let activeAgentType = 'scholar';

function selectAgent(agentType) {
    activeAgentType = agentType;

    document.querySelectorAll('.agent-card-btn').forEach(btn => {
        btn.classList.remove('border-indigo-500', 'bg-indigo-600/10', 'border-emerald-500', 'bg-emerald-600/10', 'border-amber-500', 'bg-amber-600/10', 'border-purple-500', 'bg-purple-600/10');
        btn.classList.add('border-slate-800', 'bg-slate-950/40');
    });

    const activeCard = document.getElementById(`agent-card-${agentType}`);
    if (activeCard) {
        activeCard.classList.remove('border-slate-800', 'bg-slate-950/40');
        if (agentType === 'scholar') activeCard.classList.add('border-indigo-500', 'bg-indigo-600/10');
        if (agentType === 'coder') activeCard.classList.add('border-emerald-500', 'bg-emerald-600/10');
        if (agentType === 'quiz') activeCard.classList.add('border-amber-500', 'bg-amber-600/10');
        if (agentType === 'citation') activeCard.classList.add('border-purple-500', 'bg-purple-600/10');
    }

    const placeholders = {
        'scholar': 'e.g. Research Transformer architecture in deep learning and self-attention mechanisms...',
        'coder': 'e.g. Implement a Binary Search Tree with insert & delete methods in Python with test cases...',
        'quiz': 'e.g. Generate practice quiz on Operating Systems Process Synchronization & Semaphores...',
        'citation': 'e.g. Format IEEE & APA citation for Attention Is All You Need paper (Vaswani et al., 2017)...'
    };

    const promptInput = document.getElementById('agent-prompt-input');
    if (promptInput) promptInput.placeholder = placeholders[agentType] || 'Enter task prompt for AI Agent...';
}

function setAgentPrompt(text) {
    const input = document.getElementById('agent-prompt-input');
    if (input) input.value = text;
}

async function runAgentTask() {
    const input = document.getElementById('agent-prompt-input');
    const promptText = input ? input.value.trim() : '';

    if (!promptText) {
        alert("Please enter a task or topic for the AI Agent.");
        return;
    }

    const statusPanel = document.getElementById('agent-status-panel');
    const outputContainer = document.getElementById('agent-output-container');
    const runBtn = document.getElementById('agent-run-btn');

    if (statusPanel) statusPanel.classList.remove('hidden');
    if (outputContainer) outputContainer.innerHTML = `
        <div class="flex items-center justify-center p-12 text-slate-400 gap-3">
            <i class="fa-solid fa-circle-notch fa-spin text-2xl text-indigo-400"></i>
            <span class="text-xs font-semibold">AI Agent is thinking and executing task pipeline...</span>
        </div>
    `;

    if (runBtn) {
        runBtn.disabled = true;
        runBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Running Agent...`;
    }

    try {
        const res = await fetch('/api/agents/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agent_type: activeAgentType,
                user_prompt: promptText,
                target_depth: 'comprehensive'
            })
        });

        const data = await res.json();
        renderAgentOutput(data);
    } catch (e) {
        console.error("Agent execution failed", e);
        if (outputContainer) outputContainer.innerHTML = `<p class="text-xs text-red-400 p-4">Agent execution failed. Please check connection.</p>`;
    } finally {
        if (runBtn) {
            runBtn.disabled = false;
            runBtn.innerHTML = `<span>Dispatch Agent Task</span> <i class="fa-solid fa-bolt"></i>`;
        }
    }
}

function renderAgentOutput(data) {
    const stepsEl = document.getElementById('agent-reasoning-steps');
    const outputContainer = document.getElementById('agent-output-container');

    if (stepsEl && data.reasoning_steps) {
        stepsEl.innerHTML = data.reasoning_steps.map(s => `
            <div class="flex items-center gap-2 text-xs bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <i class="fa-solid fa-check text-emerald-400 text-[10px]"></i>
                <span class="text-slate-300 font-medium">Step ${s.step}: ${s.title}</span>
            </div>
        `).join('');
    }

    if (outputContainer) {
        let rawHtml = markedParse(data.output);
        outputContainer.innerHTML = `
            <div class="p-6 space-y-4 text-xs text-slate-200 leading-relaxed font-sans">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-sm border border-indigo-500/30">
                            <i class="fa-solid ${data.agent.icon}"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-white text-sm">${data.agent.name} Result</h4>
                            <p class="text-[10px] text-indigo-400">${data.agent.role}</p>
                        </div>
                    </div>
                    <button onclick="copyAgentOutput()" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition">
                        <i class="fa-solid fa-copy text-indigo-400"></i> Copy Output
                    </button>
                </div>
                <div id="agent-raw-output" class="prose prose-invert max-w-none text-xs space-y-3">
                    ${rawHtml}
                </div>
            </div>
        `;

        // Render KaTeX math if present
        if (window.renderMathInElement) {
            renderMathInElement(outputContainer, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                ]
            });
        }
    }
}

function copyAgentOutput() {
    const raw = document.getElementById('agent-raw-output');
    if (raw) {
        navigator.clipboard.writeText(raw.innerText);
        alert("📋 Agent output copied to clipboard!");
    }
}

// Simple Markdown parser for clean agent rendering
function markedParse(text) {
    if (!text) return "";
    return text
        .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-white mt-4 mb-2">$1</h3>')
        .replace(/^#### (.*$)/gim, '<h4 class="text-xs font-bold text-indigo-400 mt-3 mb-1">$1</h4>')
        .replace(/```python([\s\S]*?)```/gim, '<pre class="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-emerald-400 overflow-x-auto text-[11px] my-2"><code>$1</code></pre>')
        .replace(/```([\s\S]*?)```/gim, '<pre class="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-slate-300 overflow-x-auto text-[11px] my-2"><code>$1</code></pre>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-white font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em class="text-indigo-300">$1</em>')
        .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-slate-300 mb-1">$1</li>')
        .replace(/\n\n/g, '<br/>');
}
