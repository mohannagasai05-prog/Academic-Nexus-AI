// Academic Nexus AI - Analyzer Controller

let activeDocText = "";

function getUserId() {
    return (typeof getCurrentUserId === 'function') ? getCurrentUserId() : 1;
}

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-indigo-500');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-indigo-500');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-indigo-500');
            if (e.dataTransfer.files.length > 0) {
                uploadFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                uploadFile(e.target.files[0]);
            }
        });
    }
});

async function uploadFile(file) {
    const statusDiv = document.getElementById('upload-status');
    statusDiv.classList.remove('hidden');
    statusDiv.className = 'p-3 rounded-lg text-xs bg-indigo-950/60 text-indigo-300 border border-indigo-500/30';
    statusDiv.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Extracting and analyzing <strong>${file.name}</strong>...`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', getUserId());

    try {
        const res = await fetch('/api/analyzer/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Server returned ${res.status}: ${errText.slice(0, 100)}`);
        }

        const data = await res.json();

        if (data.analysis) {
            statusDiv.className = 'p-3 rounded-lg text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-500/30';
            statusDiv.innerHTML = `<i class="fa-solid fa-circle-check mr-2"></i> Document analyzed successfully!`;

            document.getElementById('doc-meta-card').classList.remove('hidden');
            document.getElementById('active-doc-name').innerText = data.filename;
            document.getElementById('active-doc-words').innerText = `${data.analysis.word_count || 0} words extracted`;

            activeDocText = data.extracted_text_snippet || "";

            renderAnalysisResults(data.analysis);
        }
    } catch (e) {
        statusDiv.className = 'p-3 rounded-lg text-xs bg-red-950/60 text-red-300 border border-red-500/30';
        statusDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-2"></i> Upload failed: ${e.message}`;
    }
}

function renderAnalysisResults(analysis) {
    const conceptsContainer = document.getElementById('key-concepts-container');
    if (analysis.key_concepts && analysis.key_concepts.length > 0) {
        conceptsContainer.innerHTML = analysis.key_concepts.map(c => `
            <div class="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <span class="text-xs font-bold text-indigo-400 block">${c.concept || c}</span>
                <p class="text-[11px] text-slate-300 mt-1">${c.definition || 'Key concept extracted from document.'}</p>
            </div>
        `).join('');
    }

    const summaryContainer = document.getElementById('summary-text-container');
    summaryContainer.innerHTML = `<div class="bg-slate-950/40 p-4 rounded-xl border border-slate-800 whitespace-pre-line">${analysis.summary}</div>`;

    const flashcardsContainer = document.getElementById('flashcards-container');
    if (analysis.flashcards && analysis.flashcards.length > 0) {
        flashcardsContainer.innerHTML = analysis.flashcards.map((f, i) => `
            <div onclick="this.classList.toggle('flipped')" class="glass-panel p-4 bg-slate-950 border-slate-800 cursor-pointer hover:border-indigo-500/40 transition">
                <div class="flex justify-between items-center text-[10px] text-indigo-400 font-bold mb-2">
                    <span>CARD #${i+1}</span>
                    <span class="text-slate-500">Click to reveal answer</span>
                </div>
                <h5 class="text-xs font-semibold text-white mb-2">Q: ${f.question}</h5>
                <p class="text-xs text-indigo-300 pt-2 border-t border-slate-800">A: ${f.answer}</p>
            </div>
        `).join('');
    }
}

function switchAnalyzerSubTab(subTab) {
    document.getElementById('analyzer-sub-summary').classList.add('hidden');
    document.getElementById('analyzer-sub-flashcards').classList.add('hidden');
    document.getElementById('analyzer-sub-qa').classList.add('hidden');

    document.getElementById(`analyzer-sub-${subTab}`).classList.remove('hidden');
}

async function sendDocumentQA() {
    const input = document.getElementById('qa-input');
    const q = input.value.trim();
    if (!q) return;

    const chatBox = document.getElementById('qa-chat-box');
    chatBox.innerHTML += `
        <div class="bg-slate-800 p-3 rounded-lg text-xs text-white text-right">
            <strong>You:</strong> ${q}
        </div>
    `;
    input.value = "";

    try {
        const res = await fetch('/api/analyzer/qa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_text: activeDocText, question: q })
        });
        const data = await res.json();

        chatBox.innerHTML += `
            <div class="bg-indigo-950/40 p-3 rounded-lg border border-indigo-500/20 text-xs text-slate-200">
                <strong class="text-indigo-400">AI Analyzer Answer:</strong><br>${data.answer}
            </div>
        `;
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) {
        console.error(e);
    }
}
