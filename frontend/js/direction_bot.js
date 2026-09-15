// Academic Nexus AI - Direction Bot Controller

async function sendDirectionChat() {
    const input = document.getElementById('direction-input');
    const query = input.value.trim();
    if (!query) return;

    sendDirectionPrompt(query);
    input.value = "";
}

async function sendDirectionPrompt(queryText) {
    const chatLog = document.getElementById('direction-chat-log');
    
    // Append User Message
    chatLog.innerHTML += `
        <div class="flex gap-3 items-start justify-end">
            <div class="bg-indigo-600 p-3.5 rounded-xl rounded-tr-none text-xs text-white max-w-xl">
                ${queryText}
            </div>
        </div>
    `;
    chatLog.scrollTop = chatLog.scrollHeight;

    // Append Typing Indicator
    const typingId = `typing-${Date.now()}`;
    chatLog.innerHTML += `
        <div id="${typingId}" class="flex gap-3 items-start">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs flex-shrink-0">
                <i class="fa-solid fa-compass fa-spin"></i>
            </div>
            <div class="bg-slate-800 p-3 rounded-xl text-xs text-slate-400">
                Nexus Guide is thinking...
            </div>
        </div>
    `;
    chatLog.scrollTop = chatLog.scrollHeight;

    try {
        const res = await fetch('/api/directions/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: queryText })
        });
        const data = await res.json();

        // Remove typing indicator
        const typingElem = document.getElementById(typingId);
        if (typingElem) typingElem.remove();

        // Render Bot Answer
        let actionsHtml = "";
        if (data.suggested_actions && data.suggested_actions.length > 0) {
            actionsHtml = `
                <div class="flex flex-wrap gap-2 pt-2 border-t border-slate-700/60">
                    ${data.suggested_actions.map(a => `
                        <button onclick="switchTab('${a.tab}')" class="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-3 py-1 rounded-lg border border-indigo-500/30 flex items-center gap-1.5 font-semibold">
                            <i class="fa-solid fa-arrow-right text-[10px]"></i> ${a.label}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        const formattedResp = (data.response || "").replace(/\n/g, '<br>');

        chatLog.innerHTML += `
            <div class="flex gap-3 items-start">
                <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs flex-shrink-0">
                    <i class="fa-solid fa-compass"></i>
                </div>
                <div class="bg-slate-800 p-3.5 rounded-xl rounded-tl-none text-xs text-slate-200 max-w-xl space-y-3 border border-slate-700">
                    <div>${formattedResp}</div>
                    ${actionsHtml}
                </div>
            </div>
        `;
        chatLog.scrollTop = chatLog.scrollHeight;

    } catch (e) {
        console.error("Direction Bot Error:", e);
    }
}
