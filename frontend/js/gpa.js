// Academic GPA & CGPA Calculator Module

let gpaCourses = [
    { name: "Data Structures & Algorithms", credits: 4, grade: "A", points: 10.0 },
    { name: "Operating Systems", credits: 3, grade: "A-", points: 9.0 },
    { name: "Database Management Systems", credits: 3, grade: "B+", points: 8.0 }
];

const GRADE_SCALE = {
    "O": 10.0,
    "A+": 10.0,
    "A": 9.0,
    "A-": 8.5,
    "B+": 8.0,
    "B": 7.0,
    "C": 6.0,
    "D": 5.0,
    "F": 0.0
};

function renderGpaCalculator() {
    const listEl = document.getElementById('gpa-course-list');
    if (!listEl) return;

    listEl.innerHTML = gpaCourses.map((c, index) => `
        <div class="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 gap-3">
            <input type="text" value="${c.name}" onchange="updateCourseName(${index}, this.value)" 
                class="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white flex-1 focus:outline-none focus:border-indigo-500">
            
            <div class="flex items-center gap-2">
                <span class="text-xs text-slate-400">Credits:</span>
                <input type="number" min="1" max="10" value="${c.credits}" onchange="updateCourseCredits(${index}, this.value)"
                    class="bg-slate-900 border border-slate-700 rounded w-14 px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-indigo-500">
            </div>

            <div class="flex items-center gap-2">
                <span class="text-xs text-slate-400">Grade:</span>
                <select onchange="updateCourseGrade(${index}, this.value)" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500">
                    ${Object.keys(GRADE_SCALE).map(g => `<option value="${g}" ${c.grade === g ? 'selected' : ''}>${g} (${GRADE_SCALE[g]})</option>`).join('')}
                </select>
            </div>

            <button onclick="removeCourse(${index})" class="text-slate-400 hover:text-red-400 text-xs px-1">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');

    calculateGpaSummary();
}

function addGpaCourse() {
    gpaCourses.push({ name: `Subject ${gpaCourses.length + 1}`, credits: 3, grade: "A", points: 9.0 });
    renderGpaCalculator();
}

function removeCourse(index) {
    gpaCourses.splice(index, 1);
    renderGpaCalculator();
}

function updateCourseName(index, val) {
    gpaCourses[index].name = val;
}

function updateCourseCredits(index, val) {
    gpaCourses[index].credits = parseFloat(val) || 1;
    calculateGpaSummary();
}

function updateCourseGrade(index, val) {
    gpaCourses[index].grade = val;
    gpaCourses[index].points = GRADE_SCALE[val] || 0;
    calculateGpaSummary();
}

function calculateGpaSummary() {
    let totalCredits = 0;
    let totalPoints = 0;

    gpaCourses.forEach(c => {
        const pts = GRADE_SCALE[c.grade] || 0;
        totalCredits += c.credits;
        totalPoints += c.credits * pts;
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
    
    const displayGpa = document.getElementById('gpa-score-display');
    const displayCredits = document.getElementById('gpa-credits-display');
    const displayHonor = document.getElementById('gpa-honor-badge');

    if (displayGpa) displayGpa.innerText = gpa;
    if (displayCredits) displayCredits.innerText = totalCredits;

    if (displayHonor) {
        if (parseFloat(gpa) >= 9.0) {
            displayHonor.innerText = "⭐ Distinction Level (First Class)";
            displayHonor.className = "text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20";
        } else if (parseFloat(gpa) >= 7.5) {
            displayHonor.innerText = "👍 High Pass / Upper Credit";
            displayHonor.className = "text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20";
        } else {
            displayHonor.innerText = "📖 Good Standing";
            displayHonor.className = "text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20";
        }
    }
}
