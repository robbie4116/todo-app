# Todo Manager

Full-stack todo app with FastAPI + React (Vite + TypeScript), MongoDB, JWT auth, Google login, priority/status workflow, deadlines, and live countdowns.

## Features

- Email/password auth + JWT
- Google OAuth login
- Todo status workflow: `not_started` → `in_progress` → `finished`
- Priority: `low`, `medium`, `high`, `urgent`
- Deadlines (date-only or date+time) + live countdown + overdue detection
- Long description support
- Priority-column board UI
- Create/Edit/Detail modals
- Archive + delete confirmations
- Backend tests with `pytest`

## Tech Stack

- **Backend:** FastAPI, PyMongo, python-jose, Passlib/Bcrypt, google-auth
- **Frontend:** React, TypeScript, Vite, Axios
- **Database:** MongoDB

---

## Project Structure

```txt
todo-app/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py
│   │   │   └── routes/
│   │   │       ├── auth.py
│   │   │       └── todos.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models/
│   │   │   ├── todo.py
│   │   │   └── user.py
│   │   ├── schemas/
│   │   │   ├── todo.py
│   │   │   └── user.py
│   │   └── main.py
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_auth_and_todos.py
│   ├── .env.example
│   ├── .gitignore
│   ├── pytest.ini
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/ui/
    │   ├── contexts/AuthContext.tsx
    │   ├── lib/utils.ts
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── LoginPage.css
    │   │   ├── TodosPage.tsx
    │   │   └── TodosPage.css
    │   ├── App.tsx
    │   ├── App.css
    │   ├── index.css
    │   ├── main.tsx
    │   └── vite-env.d.ts
    ├── .env
    ├── .gitignore
    ├── package.json
    └── vite.config.ts
```

---

## Quickstart

### Backend

```bash
cd backend
cp .env.example .env

python -m venv .venv
# macOS/Linux
source .venv/bin/activate
# Windows (PowerShell)
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm i
npm run dev
```

### Run tests (backend)

```bash
cd backend
pytest
```

---

<details>
  <summary><strong>Environment Variables</strong></summary>

### Backend (`backend/.env`)

```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=todo_app

JWT_SECRET=change-me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Google OAuth (if using Google login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

</details>

<details>
  <summary><strong>Behavior & Data Model</strong></summary>

### Status

- `not_started`
- `in_progress`
- `finished`

### Priority

- `low`
- `medium`
- `high`
- `urgent`

### Deadlines

- Supports date-only or date+time.
- UI shows a live countdown when a deadline exists.
- Past deadlines are marked overdue.

</details>

<details>
  <summary><strong>Google OAuth Notes</strong></summary>

High-level steps:

1. Create an OAuth Client in Google Cloud Console.
2. Add the authorized redirect URI you use in `GOOGLE_REDIRECT_URI`.
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`.
4. Set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`.

Common local redirect examples:

- Backend callback: `http://localhost:8000/api/auth/google/callback`
- Frontend origin: `http://localhost:5173`

</details>

<details>
  <summary><strong>Common Commands</strong></summary>

### Backend

```bash
uvicorn app.main:app --reload
pytest
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

</details>

---

## License

MIT License

Copyright (c) 2026 <YOUR_NAME>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
