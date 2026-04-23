const API_BASE = "http://127.0.0.1:8000";
let token = localStorage.getItem("quiz_token") || "";
let role = localStorage.getItem("quiz_role") || "";
let username = localStorage.getItem("quiz_username") || "";

let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let adminQuestions = [];
let selectedDifficulty = "";
let selectedCount = 5;

const appDiv = document.getElementById("app");

// UI Utilities
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function transitionScreen(renderFunc) {
    appDiv.classList.remove("fade-in");
    appDiv.classList.add("fade-out");
    setTimeout(() => {
        renderFunc();
        appDiv.classList.remove("fade-out");
        appDiv.classList.add("fade-in");
    }, 250); // faster, softer transition
}

function logout() {
    token = "";
    role = "";
    username = "";
    localStorage.clear();
    transitionScreen(() => renderAuthScreen('login'));
}

// ======================= AUTH SCREENS =======================
function renderAuthScreen(mode = 'login') {


    const isLogin = mode === 'login';
    appDiv.innerHTML = `
        <div class="card" style="max-width: 480px; margin: 40px auto; text-align: center;">
            <h1 class="title">Quiz Game System</h1>
            <p class="subtitle">${isLogin ? 'Welcome, Lets play a game' : 'Join the community. Let\'s learn together.'}</p>
            
            <form onsubmit="handleAuth(event, '${mode}')" style="text-align: left;">
                <div class="input-group">
                    <label class="input-label">Username</label>
                    <input type="text" id="username" class="input-field" autocomplete="off" required />
                </div>
                
                ${!isLogin ? `
                <div class="input-group">
                    <label class="input-label">Email</label>
                    <input type="email" id="email" class="input-field" autocomplete="off" required />
                </div>` : ''}
                
                <div class="input-group">
                    <label class="input-label">Password</label>
                    <input type="password" id="password" class="input-field" autocomplete="off" required />
                </div>
                
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
                    ${isLogin ? 'Login' : 'Create Account'}
                </button>
            </form>
            
            <div style="margin-top: 24px;">
                <p style="color: var(--text-muted); font-size: 0.95rem;">
                    ${isLogin ? "New here?" : "Already have an account?"} 
                    <span style="color: var(--primary); font-weight: 700; cursor: pointer;" onclick="transitionScreen(() => renderAuthScreen('${isLogin ? 'register' : 'login'}'))">
                        ${isLogin ? 'Create an account' : 'Log in'}
                    </span>
                </p>
            </div>
        </div>
    `;
}

async function handleAuth(event, mode) {
    event.preventDefault();
    const uname = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    
    try {
        if (mode === 'register') {
            const email = document.getElementById("email").value.trim();
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: uname, email: email, password: pass })
            });
            if (!res.ok) throw new Error((await res.json()).detail);
            
            showToast("Account created! Let's get you logged in.");
            transitionScreen(() => renderAuthScreen('login'));
        } else {
            const formData = new URLSearchParams();
            formData.append("username", uname);
            formData.append("password", pass);

            const res = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData
            });

            if (!res.ok) throw new Error("Incorrect username or password");

            const data = await res.json();
            token = data.access_token;
            role = data.role;
            username = data.username;

            localStorage.setItem("quiz_token", token);
            localStorage.setItem("quiz_role", role);
            localStorage.setItem("quiz_username", username);

            transitionScreen(redirectUser);
        }
    } catch (e) {
        showToast(e.message, "error");
    }
}

function redirectUser() {


    if (role === "admin") {
        renderAdminDashboard();
    } else {
        renderUserDashboard();
    }
}

// ======================= ADMIN DASHBOARD =======================
async function renderAdminDashboard() {


    appDiv.innerHTML = `<div class="card" style="text-align:center"><p class="subtitle">Fetching questions...</p></div>`;
    try {
        const res = await fetch(`${API_BASE}/questions/`, {
            headers: { "Authorization": "Bearer " + token }
        });
        if (!res.ok) throw new Error("Unauthorized");
        adminQuestions = await res.json();

        let listHTML = adminQuestions.map(q => `
            <li class="admin-q-item">
                <div style="flex-grow: 1; padding-right: 20px;">
                    <div style="margin-bottom: 8px;">
                        <span class="badge badge-${q.difficulty.toLowerCase()}">${q.difficulty}</span>
                    </div>
                    <strong style="font-size: 1.1rem; color: var(--text-dark);">${q.text}</strong>
                    <div style="color: var(--text-muted); margin-top: 8px; font-size: 0.9rem;">
                        A: ${q.option_a} | B: ${q.option_b} | C: ${q.option_c} | D: ${q.option_d} <br>
                        <span style="color: var(--success); font-weight:700; display:inline-block; margin-top:4px;">Correct: ${q.correct_answer}</span>
                    </div>
                </div>
                <div>
                    <button class="btn btn-danger" style="padding: 8px 12px;" onclick="deleteQuestion(${q.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </li>
        `).join('');

        if(adminQuestions.length === 0) listHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted);">No questions found. Add some!</div>`;

        appDiv.innerHTML = `
            <div class="card" style="max-width: 800px;">
                <div class="top-bar">
                    <div>
                        <h2 class="title" style="font-size: 2rem;">Admin Dashboard</h2>
                        <p style="color: var(--text-muted)">Manage the question bank.</p>
                    </div>
                    <button class="btn btn-secondary" onclick="logout()">Log out</button>
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items: center; margin-bottom: 24px;">
                    <h3 style="color: var(--text-dark);">All Questions (${adminQuestions.length})</h3>
                    <button class="btn btn-primary" onclick="transitionScreen(renderAddQuestionForm)">+ Add Question</button>
                </div>
                
                <ul style="list-style:none; max-height: 60vh; overflow-y: auto; padding-right: 5px;">
                    ${listHTML}
                </ul>
            </div>
        `;
    } catch(e) {
        showToast("Access Denied", "error");
        logout();
    }
}

function renderAddQuestionForm() {
    appDiv.innerHTML = `
        <div class="card" style="max-width: 700px;">
            <div class="top-bar">
                <h2 class="title" style="font-size: 2rem;">New Question</h2>
                <button class="btn btn-secondary" onclick="transitionScreen(renderAdminDashboard)">Cancel</button>
            </div>
            
            <form id="addQForm" onsubmit="handleAddQuestion(event)" style="display: grid; gap: 20px;">
                <div class="input-group" style="margin-bottom:0;">
                    <label class="input-label">Question Text</label>
                    <input type="text" id="q_text" class="input-field" placeholder="e.g., What does API stand for?" required />
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="input-group" style="margin-bottom:0;">
                        <label class="input-label">Option A</label>
                        <input type="text" id="opt_a" class="input-field" required />
                    </div>
                    <div class="input-group" style="margin-bottom:0;">
                        <label class="input-label">Option B</label>
                        <input type="text" id="opt_b" class="input-field" required />
                    </div>
                    <div class="input-group" style="margin-bottom:0;">
                        <label class="input-label">Option C</label>
                        <input type="text" id="opt_c" class="input-field" required />
                    </div>
                    <div class="input-group" style="margin-bottom:0;">
                        <label class="input-label">Option D</label>
                        <input type="text" id="opt_d" class="input-field" required />
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="input-group" style="margin-bottom:0;">
                        <label class="input-label">Correct Answer</label>
                        <select id="correct_ans" class="input-field">
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                        </select>
                    </div>
                    <div class="input-group" style="margin-bottom:0;">
                        <label class="input-label">Difficulty</label>
                        <select id="diff" class="input-field">
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary" style="margin-top: 16px;">Save Question</button>
            </form>
        </div>
    `;
}

async function handleAddQuestion(e) {
    e.preventDefault();
    const payload = {
        text: document.getElementById('q_text').value,
        option_a: document.getElementById('opt_a').value,
        option_b: document.getElementById('opt_b').value,
        option_c: document.getElementById('opt_c').value,
        option_d: document.getElementById('opt_d').value,
        correct_answer: document.getElementById('correct_ans').value,
        difficulty: document.getElementById('diff').value,
    };

    try {
        const res = await fetch(`${API_BASE}/questions/`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token 
            },
            body: JSON.stringify(payload)
        });
        if(!res.ok) throw new Error("Failed to add question");
        showToast("Question added successfully!");
        transitionScreen(renderAdminDashboard);
    } catch(e) {
        showToast(e.message, "error");
    }
}

async function deleteQuestion(id) {
    if(!confirm("Are you sure you want to delete this?")) return;
    try {
        await fetch(`${API_BASE}/questions/${id}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        });
        showToast("Question removed");
        renderAdminDashboard(); 
    } catch(e) {
        showToast("Failed to delete", "error");
    }
}

// ======================= USER DASHBOARD & QUIZ =======================
function renderUserDashboard() {


    appDiv.innerHTML = `
        <div class="card" style="max-width: 500px; text-align: center;">
            <div class="top-bar" style="justify-content: flex-end; margin-bottom: 20px;">
                <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.9rem;" onclick="logout()">Log out</button>
            </div>
            
            <h1 class="title" style="margin-bottom: 8px;">Let's get you ready, ${username}</h1>
            <p class="subtitle">Customize your session below.</p>
            
            <div style="text-align: left; margin-bottom: 32px;">
                <div class="input-group">
                    <label class="input-label">Select Difficulty</label>
                    <select id="quiz_diff" class="input-field">
                        <option value="">All</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </div>
                <div class="input-group" style="margin-bottom: 0;">
                    <label class="input-label">Number of Questions</label>
                    <input type="number" id="quiz_count" class="input-field" value="5" min="1" max="25">
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button class="btn btn-primary" style="width: 100%; font-size: 1.1rem; padding: 16px;" onclick="goToInstructions()">Start Quiz</button>
                <button class="btn btn-secondary" style="width: 100%;" onclick="transitionScreen(showLeaderboard)">View Leaderboard</button>
            </div>
        </div>
    `;
}

function goToInstructions() {
    selectedDifficulty = document.getElementById("quiz_diff").value;
    selectedCount = document.getElementById("quiz_count").value;
    transitionScreen(renderInstructions);
}

function renderInstructions() {
    appDiv.innerHTML = `
        <div class="card" style="max-width: 600px; text-align: center;">
            <h2 class="title-soft">Before we begin</h2>
            <div style="text-align: left; color: var(--text-muted); font-size: 1.1rem; line-height: 1.6; margin: 30px 0; background: #f9fafb; padding: 24px; border-radius: 16px;">
                <p style="margin-bottom: 12px;">Welcome to your Tech4Girls evaluation!</p>
                <p style="margin-bottom: 12px;">• You will face <strong>${selectedCount}</strong> questions.</p>
                <p style="margin-bottom: 12px;">• Read carefully. You cannot go back once you click an answer.</p>
                <p>• At the end, you'll see your grade and a review of anything you missed.</p>
            </div>
            <div style="display: flex; gap: 16px;">
                <button class="btn btn-secondary" style="flex: 1;" onclick="transitionScreen(renderUserDashboard)">Go Back</button>
                <button class="btn btn-accent" style="flex: 2;" onclick="startQuiz()">I'm ready, let's go!</button>
            </div>
        </div>
    `;
}

async function startQuiz() {
    let url = `${API_BASE}/quiz/start?count=${selectedCount}`;
    if (selectedDifficulty) url += `&difficulty=${selectedDifficulty}`;

    appDiv.innerHTML = `<div class="card" style="text-align:center"><p class="subtitle">Fetching your questions...</p></div>`;

    try {
        const quizRes = await fetch(url, {
            headers: { "Authorization": "Bearer " + token }
        });
        questions = await quizRes.json();

        if (questions.length === 0) {
            showToast("No questions found for this criteria.", "error");
            transitionScreen(renderUserDashboard);
            return;
        }

        currentQuestionIndex = 0;
        userAnswers = [];
        transitionScreen(renderQuestionScreen);

    } catch (e) {
        showToast("Failed to load quiz", "error");
        transitionScreen(renderUserDashboard);
    }
}

function renderQuestionScreen() {


    if (currentQuestionIndex >= questions.length) {
        transitionScreen(submitQuiz);
        return;
    }

    const q = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / questions.length) * 100;
    
    appDiv.innerHTML = `
        <div style="width: 100%; max-width: 700px; margin: 0 auto;">
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-weight: 700; color: var(--text-muted); font-size: 0.95rem;">
                <span>Question ${currentQuestionIndex + 1} of ${questions.length}</span>
            </div>
            
            <!-- Minimal Progress Bar -->
            <div class="progress-container">
                <div class="progress-bar" style="width: ${progress}%;"></div>
            </div>

            <div class="card" style="margin-bottom: 24px; padding: 40px 30px;">
                <div class="question-header">${q.text}</div>
            </div>
            
            <div class="options-grid">
                <div class="option-card opt-a" onclick="selectAnswer(${q.id}, 'A')">
                    <i class="fa-solid fa-circle"></i> <span>${q.option_a}</span>
                </div>
                <div class="option-card opt-b" onclick="selectAnswer(${q.id}, 'B')">
                    <i class="fa-solid fa-square"></i> <span>${q.option_b}</span>
                </div>
                <div class="option-card opt-c" onclick="selectAnswer(${q.id}, 'C')">
                    <i class="fa-solid fa-play" style="transform: rotate(-90deg)"></i> <span>${q.option_c}</span>
                </div>
                <div class="option-card opt-d" onclick="selectAnswer(${q.id}, 'D')">
                    <i class="fa-solid fa-diamond"></i> <span>${q.option_d}</span>
                </div>
            </div>
        </div>
    `;
}

function selectAnswer(qId, answer) {
    userAnswers.push({
        question_id: qId,
        selected_answer: answer
    });
    currentQuestionIndex++;
    transitionScreen(renderQuestionScreen);
}

async function submitQuiz() {
    appDiv.innerHTML = `<div class="card" style="text-align:center"><p class="subtitle">Grading your answers...</p></div>`;

    try {
        const res = await fetch(`${API_BASE}/quiz/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ answers: userAnswers })
        });
        const result = await res.json();

        // Save score to leaderboard silently
        fetch(`${API_BASE}/leaderboard/save?difficulty=Mixed`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(result)
        });

        setTimeout(() => transitionScreen(showLeaderboard), 800);
    } catch (e) {
        showToast("Error submitting answers", "error");
        transitionScreen(renderUserDashboard);
    }
}

function renderResultScreen(result) {
    let wrongHTML = '';
    if (result.wrong_answers.length > 0) {
        wrongHTML = `<div style="text-align:left; margin-top: 32px;">
            <h3 style="color:var(--text-dark); margin-bottom: 16px; font-size:1.2rem;">Things to review:</h3>
            ${result.wrong_answers.map(w => `
                <div class="review-item">
                    <strong style="font-size:1rem; display:block; margin-bottom:6px;">${w.question_text}</strong>
                    <span style="color:var(--danger); font-size:0.9rem;">You chose: ${w.selected_answer}</span><br>
                    <span style="color:var(--success); font-size:0.9rem; font-weight:700;">Correct: ${w.correct_answer}</span>
                </div>
            `).join('')}
        </div>`;
    }

    const isPerfect = result.percentage_score === 100;

    appDiv.innerHTML = `
        <div class="card" style="max-width: 600px; text-align: center;">

            <h1 class="title">${isPerfect ? 'Flawless!' : 'Good effort!'}</h1>
            
            <div style="background: #f9fafb; padding: 32px; border-radius: 16px; margin: 24px 0; border: 1px solid var(--border-color);">
                <h2 style="font-size: 4rem; color: var(--primary); line-height: 1; margin-bottom: 16px;">${result.percentage_score}%</h2>
                <div style="display:flex; justify-content:center; gap: 32px; color: var(--text-dark);">
                    <div><span style="font-size:1.5rem; font-weight:800;">${result.grade}</span><br><span style="color:var(--text-muted); font-size:0.9rem;">Grade</span></div>
                    <div><span style="font-size:1.5rem; font-weight:800; color:var(--success);">${result.correct_answers}</span><br><span style="color:var(--text-muted); font-size:0.9rem;">Correct</span></div>
                    <div><span style="font-size:1.5rem; font-weight:800;">${result.total_questions}</span><br><span style="color:var(--text-muted); font-size:0.9rem;">Total</span></div>
                </div>
            </div>
            
            <div style="display: flex; gap: 16px;">
                <button class="btn btn-secondary" style="flex: 1;" onclick="transitionScreen(renderUserDashboard)">Home</button>
                <button class="btn btn-primary" style="flex: 1;" onclick="transitionScreen(showLeaderboard)">Leaderboard</button>
            </div>

            ${wrongHTML}
        </div>
    `;
}

async function showLeaderboard() {


    appDiv.innerHTML = `<div class="card" style="text-align:center"><p class="subtitle">Loading scores...</p></div>`;
    
    try {
        const res = await fetch(`${API_BASE}/leaderboard/`);
        const scores = await res.json();
        
        let listHTML = scores.map((s, i) => {
            let rankClass = i < 3 ? `rank-${i+1}` : '';
            let medal = '';
            return `
            <li class="leaderboard-item">
                <div class="rank ${rankClass}" style="width: 30px; text-align:center;">${medal || (i+1)}</div>
                <div style="flex-grow: 1; margin-left: 16px;">
                    <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-dark);">${s.username}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.2rem; font-weight: 800; color: var(--primary);">${s.percentage}%</div>
                    <div style="color: var(--text-muted); font-size: 0.85rem;">${s.score}/${s.total}</div>
                </div>
            </li>
        `}).join('');

        if (scores.length === 0) listHTML = `<div style="text-align:center; padding: 30px; color:var(--text-muted);">No scores recorded yet.</div>`;

        appDiv.innerHTML = `
            <div class="card" style="max-width: 600px;">
                <div class="top-bar">
                    <h2 class="title" style="margin-bottom:0;">Leaderboard</h2>
                    <button class="btn btn-secondary" onclick="transitionScreen(${token && role==='admin' ? 'renderAdminDashboard' : (token ? 'renderUserDashboard' : `()=>renderAuthScreen('login')`)})">
                        Back
                    </button>
                </div>
                <ul style="list-style:none;">
                    ${listHTML}
                </ul>
            </div>
        `;
    } catch (e) {
        showToast("Failed to load leaderboard", "error");
    }
}

// ======================= INIT =======================
if (token && role) {
    redirectUser();
} else {
    renderAuthScreen('login');
}
