// Quick Tasks & Bookmark Hub Module

let quickTasks = [
    { id: 1, title: "Review Operating Systems Chapter 3 Notes", category: "Assignment", completed: false },
    { id: 2, title: "Submit Data Structures Lab Report", category: "Lab", completed: true },
    { id: 3, title: "Practice Python Problem Solver Queries", category: "Practice", completed: false }
];

let resourceBookmarks = [
    { name: "University Student Portal", url: "https://portal.university.edu", icon: "fa-graduation-cap" },
    { name: "Academic Library Catalog", url: "https://library.university.edu", icon: "fa-book-bookmark" },
    { name: "Course GitHub Repository", url: "https://github.com/mohannagasai05-prog/Academic-Nexus-AI", icon: "fa-code-branch" }
];

function initTasksAndBookmarks() {
    renderQuickTasks();
    renderBookmarks();
}

function renderQuickTasks() {
    const listEl = document.getElementById('quick-tasks-list');
    if (!listEl) return;

    if (quickTasks.length === 0) {
        listEl.innerHTML = `<p class="text-xs text-slate-500 py-3 text-center">No active tasks. Add one below!</p>`;
        return;
    }

    listEl.innerHTML = quickTasks.map(t => `
        <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div class="flex items-center gap-3">
                <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleQuickTask(${t.id})"
                    class="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer">
                <div>
                    <p class="text-xs font-medium ${t.completed ? 'line-through text-slate-500' : 'text-slate-200'}">${t.title}</p>
                    <span class="text-[10px] text-indigo-400 font-mono">${t.category}</span>
                </div>
            </div>
            <button onclick="deleteQuickTask(${t.id})" class="text-slate-500 hover:text-red-400 text-xs px-1">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `).join('');
}

function addQuickTask() {
    const input = document.getElementById('new-task-input');
    const catInput = document.getElementById('new-task-cat');
    if (!input || !input.value.trim()) return;

    const newTask = {
        id: Date.now(),
        title: input.value.trim(),
        category: catInput ? catInput.value : "General",
        completed: false
    };

    quickTasks.unshift(newTask);
    input.value = '';
    renderQuickTasks();
}

function toggleQuickTask(id) {
    const task = quickTasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        renderQuickTasks();
    }
}

function deleteQuickTask(id) {
    quickTasks = quickTasks.filter(t => t.id !== id);
    renderQuickTasks();
}

function renderBookmarks() {
    const listEl = document.getElementById('resource-bookmarks-list');
    if (!listEl) return;

    listEl.innerHTML = resourceBookmarks.map(b => `
        <a href="${b.url}" target="_blank" class="flex items-center gap-3 p-3 rounded-lg bg-slate-950/50 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition group">
            <div class="w-8 h-8 rounded-lg bg-indigo-600/10 group-hover:bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-sm border border-indigo-500/20">
                <i class="fa-solid ${b.icon}"></i>
            </div>
            <div class="flex-1 truncate">
                <p class="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 transition truncate">${b.name}</p>
                <p class="text-[10px] text-slate-500 truncate">${b.url}</p>
            </div>
            <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-slate-500 group-hover:text-indigo-400"></i>
        </a>
    `).join('');
}

function addBookmark() {
    const nameIn = prompt("Enter Resource Bookmark Name:");
    if (!nameIn) return;
    const urlIn = prompt("Enter URL (e.g., https://...):");
    if (!urlIn) return;

    resourceBookmarks.push({
        name: nameIn,
        url: urlIn.startsWith('http') ? urlIn : `https://${urlIn}`,
        icon: 'fa-link'
    });
    renderBookmarks();
}
