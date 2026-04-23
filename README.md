# Quiz Game System

**A fully functional backend REST API for managing and playing an interactive Kahoot-style quiz game.**

---

## The Problem
Most quizzes are static and boring. Managing a dynamic question bank, tracking user scores securely, and maintaining an engaging global leaderboard requires a robust backend architecture. Right now, many simple games lack secure data persistence. This API provides a fully-fledged backend system to store, retrieve, evaluate, and secure quiz data for any frontend application.

---

## What It Does
*   **Role-Based Access:** Secure differentiation between standard Users and Administrators.
*   **Question Bank Management:** Admins can effortlessly Create, Read, Update, and Delete questions.
*   **Dynamic Quiz Engine:** Users can start customized quizzes filtered by specific difficulty levels and question counts.
*   **Instant Server-Side Grading:** Answers are securely evaluated on the server, returning a percentage, grade, and a review of incorrect answers.
*   **Global Leaderboard:** Automatically tracks and ranks the top-performing players based on their scores.
*   **Interactive Frontend Included:** A beautiful, "Next Level" dark-mode Glassmorphism frontend that seamlessly connects to the API.

---

## Demo
*Add a link to your Loom or YouTube video here, e.g., [Watch Demo Video](https://youtube.com/)*

*Screenshot of the `/docs` page:*
*(Replace this text with an actual screenshot image `![Swagger Docs](./screenshot.png)`)*

---

## Tech Stack
*   **Language:** Python
*   **Framework:** FastAPI
*   **Database:** SQLite (via SQLAlchemy ORM)
*   **Authentication:** JWT Tokens (`python-jose`) + bcrypt password hashing (`passlib`)
*   **Server:** Uvicorn

---

## How to Run It Locally

Follow these exact steps to run the API on your machine:

1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   cd my_quiz_system
   ```

2. **Navigate to the Backend and create a virtual environment:**
   ```bash
   cd Backend
   python3 -m venv venv
   ```

3. **Activate the virtual environment:**
   *   Linux/Mac: `source venv/bin/activate`
   *   Windows: `venv\Scripts\activate`

4. **Install the dependencies:**
   ```bash
   pip install -r app/requirements.txt
   ```

5. **Ensure you have a `.env` file:**
   Create a file named `.env` in the `Backend` directory with the following:
   ```env
   DATABASE_URL=sqlite:///./quiz.db
   SECRET_KEY=a-very-secure-secret-key
   ```

6. **Start the API Server:**
   ```bash
   uvicorn app.main:app --reload
   ```

7. **Start the Frontend (Optional but Recommended):**
   Open a *second* terminal, navigate to the `Frontend` folder, and start a simple web server:
   ```bash
   cd Frontend
   python3 -m http.server 5173
   ```
   Then visit `http://127.0.0.1:5173` in your browser to play the game!

---

## API Endpoints

| Method | Path | Description | Example Request Body / Params |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/register` | Register a new user | `{"username": "player1", "email": "p1@test.com", "password": "pass"}` |
| **POST** | `/auth/login` | Login & receive JWT token | Form Data: `username=player1&password=pass` |
| **GET** | `/questions/` | (Admin) Get all questions | *Optional query: `?difficulty=Easy`* |
| **POST** | `/questions/` | (Admin) Add new question | `{"text": "...", "option_a": "...", "correct_answer": "A", ...}` |
| **PUT** | `/questions/{id}`| (Admin) Update a question | `{"text": "updated text..."}` |
| **DELETE**| `/questions/{id}`| (Admin) Delete a question | - |
| **GET** | `/quiz/start` | (User) Fetch shuffled questions | *Optional queries: `?count=5&difficulty=Easy`* |
| **POST** | `/quiz/submit` | (User) Submit answers & grade | `{"answers": [{"question_id": 1, "selected_answer": "A"}]}` |
| **POST** | `/leaderboard/save`| (User) Save score to DB | `{"total_questions": 5, "correct_answers": 4, ...}` |
| **GET** | `/leaderboard/` | (Public) Get Top 10 scores | - |

---

## How to Test It Without the Frontend

1. Ensure the server is running (`uvicorn app.main:app --reload`).
2. Open your browser and go to **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**.
3. This is the **Swagger UI**. It automatically generates a beautiful interface for testing APIs.
4. Click on the **POST `/auth/login`** route, click **"Try it out"**, enter a username and password, and click Execute.
5. Copy the `access_token` from the response.
6. Scroll to the top of the page, click the green **"Authorize"** button, and paste your token.
7. Now you can securely test all other endpoints (like `/questions/` or `/quiz/start`) exactly as a frontend application would!
