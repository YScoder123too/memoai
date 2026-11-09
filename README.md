# MemoAI

A study companion with persistent memory. MemoAI remembers every doubt a student asks, connects new questions to earlier ones, flags concepts that keep coming back, and schedules revision at spaced intervals. It supports multiple exams (GRE, UPSC, CAT, JEE, NEET, SAT, IELTS, placements, university finals and custom subjects).

## Why this exists

Most AI chat tools forget the conversation once it ends. Students preparing for an exam revisit the same concepts over weeks, so a tool that keeps a model of what the learner finds difficult is more useful than a one-off answer. MemoAI is built around two ideas from learning research: retrieval practice (testing yourself beats re-reading) and spaced repetition (reviewing at growing intervals improves retention).

## Features

**Learning**
- **Ask:** AI answers a doubt, using the student's related past doubts as context.
- **Memory:** every doubt is saved and reviewed on a 1, 3, 7, 14 and 30 day schedule. Remembering pushes it further out, forgetting resets it.
- **Weak spots:** concepts asked about repeatedly, or forgotten in review, are surfaced on the dashboard.

**Planning and focus**
- **Dashboard:** exam countdown, streak, weekly focus hours, subject heatmap, calendar and a get-started checklist.
- **Planner:** tasks grouped by subject with progress tracking.
- **Focus timer:** custom length, full-screen focus room, ambient sounds generated in the browser, completion chime and break timer. An optional anti-focus detector pauses the timer when the student leaves the tab.
- **XP, levels and badges:** calculated from sessions, tasks, saved doubts and reviews. Recalling a doubt earns the most XP.

**Exams**
- Section and topic structure for each supported exam, with links to the official organiser's material. University finals and custom exams use the student's own subject list.

**Accounts and data**
- Email and password accounts with hashed passwords and token-based sessions. Data export to JSON.

## Architecture

```
React (Vite) frontend
        |  REST + JWT
Express API  --->  MongoDB      users and structured app data
        |
        +------->  Groq         answer generation
        +------->  Gemini       text embeddings (768 dimensions)
        +------->  Qdrant       semantic memory, filtered per user
```

Structured data (tasks, sessions, schedules) is kept separate from vector memory (embeddings of doubts). Every Qdrant search is filtered by user id, so one student can never retrieve another student's memories.

The frontend also runs without the backend. In that mode data is stored in the browser, related-doubt search uses TF-IDF similarity instead of embeddings, and AI answers use a Groq key the student pastes on the Memory page.

If embeddings or Qdrant fail while the backend is running, Ask still answers through Groq and shows a note that memory was skipped.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS 3, Framer Motion, React Router, Lucide |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| Vector memory | Qdrant Cloud |
| AI | Groq (`openai/gpt-oss-120b` by default), Gemini embeddings |
| Security | bcrypt, JWT, rate limiting, input validation, per-user vector filtering |

## Getting started

### Frontend only

```bash
npm install
npm run dev
```

Open http://localhost:5173. Everything is stored in the browser.

### Full stack

1. Create `server/.env` from `server/.env.example`:

   | Variable | Purpose |
   | --- | --- |
   | `MONGODB_URI` | MongoDB Atlas connection string, including a database name |
   | `JWT_SECRET` | Long random string used to sign tokens |
   | `GROQ_API_KEY` | Groq API key |
   | `GROQ_MODEL` | Optional. Defaults to `openai/gpt-oss-120b` |
   | `GEMINI_API_KEY` | Used for embeddings only |
   | `QDRANT_URL`, `QDRANT_API_KEY` | Qdrant Cloud cluster |
   | `CLIENT_ORIGIN` | Frontend URL allowed to call the API |

2. Verify every service before starting:

   ```bash
   cd server
   npm install
   npm run check
   ```

   This tests MongoDB, Groq, Gemini and Qdrant separately and prints the provider's own error if one fails.

3. Start the API:

   ```bash
   npm run dev
   ```

4. In the project root, create `.env` containing `VITE_API_URL=http://localhost:5000`, then run `npm run dev` again.

## Tests

```bash
cd server
JWT_SECRET=test GROQ_API_KEY=g GEMINI_API_KEY=m QDRANT_URL=http://qd.test npm test
```

The backend suite covers signup and login validation, password hashing, protected routes, state sanitising, CORS, retrieval of a user's own memories only, and the fallback when vector memory fails. The database and AI providers are mocked in these tests.

## Deployment

- **Frontend:** Vercel. Set `VITE_API_URL` to the backend URL.
- **Backend:** Render web service with root directory `server` and start command `npm start`. Set the environment variables above, with `CLIENT_ORIGIN` set to the frontend URL.
- **MongoDB Atlas:** allow the backend's network access under Network Access.

## Known limitations and roadmap

- Review intervals are fixed. An adaptive scheduler such as SM-2 is the next improvement.
- Weak-spot detection is keyword based. Clustering on embeddings would be more accurate.
- AI answers can be wrong and should be verified. Answers are drafts, not authoritative explanations.
- Exam topic lists summarise each exam's published format. Always check the official link for the current syllabus.
- XP is calculated in the browser from stored data, so it is suitable for personal motivation but not for a competitive leaderboard.
- Tokens are stored in `localStorage`. Email verification, password reset and refresh tokens are not implemented.
- There are no frontend automated tests yet.
- Proactive revision reminders (email or push) are planned.

## Research behind the approach

- Roediger and Karpicke (2006), "Test-enhanced learning", Psychological Science.
- Cepeda et al. (2006), "Distributed practice in verbal recall tasks", Psychological Bulletin.
- Dunlosky et al. (2013), "Improving students' learning with effective learning techniques", Psychological Science in the Public Interest.