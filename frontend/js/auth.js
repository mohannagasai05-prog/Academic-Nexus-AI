// Academic Nexus AI - Student Auth Controller

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    checkSavedAuth();
});

function checkSavedAuth() {
    const saved = localStorage.getItem('nexus_student_user');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            updateUserUI();
        } catch (e) {
            localStorage.removeItem('nexus_student_user');
        }
    } else {
        showAuthModal();
    }
}

function getCurrentUserId() {
    return currentUser ? currentUser.id : 1;
}

function updateUserUI() {
    const userDisplay = document.getElementById('user-profile-display');
    const authModal = document.getElementById('modal-auth');

    if (currentUser) {
        if (authModal) authModal.classList.add('hidden');
        if (userDisplay) {
            userDisplay.innerHTML = `
                <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
                    <div class="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-[10px]">
                        ${currentUser.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <span class="font-bold text-white block text-[11px]">${currentUser.full_name}</span>
                        <span class="text-[9px] text-indigo-400 font-mono">Roll No: ${currentUser.roll_no}</span>
                    </div>
                    <button onclick="logoutStudent()" title="Logout" class="ml-2 text-slate-500 hover:text-red-400">
                        <i class="fa-solid fa-right-from-bracket text-xs"></i>
                    </button>
                </div>
            `;
        }
        // Refresh dashboard data for logged-in user
        if (window.loadDashboardOverview) loadDashboardOverview();
    } else {
        if (userDisplay) {
            userDisplay.innerHTML = `
                <button onclick="showAuthModal()" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold">
                    Sign In / Register
                </button>
            `;
        }
        showAuthModal();
    }
}

function showAuthModal() {
    const modal = document.getElementById('modal-auth');
    if (modal) modal.classList.remove('hidden');
}

function switchAuthTab(tab) {
    const formLogin = document.getElementById('form-login');
    const formSignup = document.getElementById('form-signup');
    const tabBtnLogin = document.getElementById('tab-btn-login');
    const tabBtnSignup = document.getElementById('tab-btn-signup');

    if (tab === 'login') {
        formLogin.classList.remove('hidden');
        formSignup.classList.add('hidden');
        tabBtnLogin.className = "flex-1 py-2 text-xs font-bold border-b-2 border-indigo-500 text-indigo-400";
        tabBtnSignup.className = "flex-1 py-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-white";
    } else {
        formLogin.classList.add('hidden');
        formSignup.classList.remove('hidden');
        tabBtnSignup.className = "flex-1 py-2 text-xs font-bold border-b-2 border-indigo-500 text-indigo-400";
        tabBtnLogin.className = "flex-1 py-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-white";
    }
}

async function handleStudentLogin(e) {
    e.preventDefault();
    const rollNo = document.getElementById('login-roll').value;
    const password = document.getElementById('login-password').value;
    const errDiv = document.getElementById('auth-error');

    errDiv.classList.add('hidden');

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roll_no: rollNo, password: password })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Login failed");
        }

        const data = await res.json();
        currentUser = data.user;
        localStorage.setItem('nexus_student_user', JSON.stringify(currentUser));
        updateUserUI();

    } catch (err) {
        errDiv.innerText = err.message;
        errDiv.classList.remove('hidden');
    }
}

async function handleStudentSignup(e) {
    e.preventDefault();
    const rollNo = document.getElementById('signup-roll').value;
    const fullName = document.getElementById('signup-name').value;
    const password = document.getElementById('signup-password').value;
    const errDiv = document.getElementById('auth-error');

    errDiv.classList.add('hidden');

    try {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roll_no: rollNo, full_name: fullName, password: password })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Registration failed");
        }

        const data = await res.json();
        currentUser = data.user;
        localStorage.setItem('nexus_student_user', JSON.stringify(currentUser));
        updateUserUI();

    } catch (err) {
        errDiv.innerText = err.message;
        errDiv.classList.remove('hidden');
    }
}

function logoutStudent() {
    currentUser = null;
    localStorage.removeItem('nexus_student_user');
    updateUserUI();
}
