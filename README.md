# MemoAI

A persistent-memory study companion. It remembers what you ask, connects new doubts to old ones, spots concepts you keep struggling with, and schedules revision. Works for any exam.

## Run the frontend (local mode, no backend needed)

    npm install
    npm run dev        # http://localhost:5173

In local mode everything is stored in the browser. AI answers need a free Groq key pasted on the Memory page.

## Run with the backend (real login, database, vector memory)

1. Copy `server/.env.example` to `server/.env` and fill it in:
   - MONGODB_URI (MongoDB Atlas, free)
   - JWT_SECRET (long random string)
   - GROQ_API_KEY (console.groq.com, free)
   - GEMINI_API_KEY (aistudio.google.com, free, used only for embeddings)
   - QDRANT_URL and QDRANT_API_KEY (cloud.qdrant.io, free cluster)
2. Start the API:

       cd server
       npm install
       npm run dev       # http://localhost:5000, check /api/health

3. In the project root, copy `.env.example` to `.env` (sets `VITE_API_URL=http://localhost:5000`), then restart `npm run dev`.

Before the first run, test every key in one go:

    cd server
    npm run check

It prints OK or FAIL for MongoDB, Groq, Gemini and Qdrant separately, with the provider's own error message. If Qdrant or Gemini fail at runtime, Ask still answers using Groq and shows a note explaining that memory was skipped.

## Deploy

- Frontend: Vercel. Add env var `VITE_API_URL` pointing to the backend URL.
- Backend: Render (Web Service, root directory `server`, start command `npm start`). Set the env vars above and set `CLIENT_ORIGIN` to your Vercel URL.

## How the memory works

1. You ask a doubt. The server embeds it (Gemini) and searches Qdrant for your similar past doubts, filtered by your user id.
2. Those past doubts are added to the Groq prompt so the answer connects to what you studied before.
3. The new doubt and answer are saved: structured data in MongoDB, the embedding in Qdrant.
4. Each saved doubt enters a spaced review schedule (1, 3, 7, 14, 30 days). Remembering pushes it out, forgetting resets it.
5. Concepts asked about repeatedly, or forgotten in review, show up as weak spots.

Local mode does the same with a simple TF-IDF similarity search in the browser instead of embeddings.

## Implemented

- Landing, signup, login, onboarding, slide page transitions, protected routes
- Focus timer: custom length, full-screen focus room, ambient sounds generated in the browser (rain, ocean, deep focus, calm pad), completion chime, 5 minute break
- Dashboard (get-started checklist, exam countdown, streak, focus hours, heatmap, calendar, weak spots), planner with task groups, focus timer, Ask, Memory review, profile with data export
- Backend: Express, bcrypt password hashing, JWT, rate limiting, input validation, MongoDB persistence, Groq, Gemini embeddings, Qdrant
- 7 automated backend tests (`cd server && JWT_SECRET=test GROQ_API_KEY=g GEMINI_API_KEY=m QDRANT_URL=http://qd.test npm test`) with the database and AI services mocked

## Honest limitations (say these in the viva)

- Exam topic lists summarise each exam's published format. They are a study structure, not an official syllabus. Check the official link for the latest pattern.
- Ambient sounds are synthesised noise and tones, not recorded music. They were not listened to during development, so adjust volume to taste.
- The live Groq, Gemini, Qdrant and MongoDB calls were not run in the development sandbox. The backend is tested against mocks, so run it once with your own keys before the demo.
- The review scheduler uses fixed intervals, not an adaptive algorithm like SM-2.
- Weak-spot detection is keyword based, not a trained model.
- AI answers can be wrong. They are drafts for the student to verify.
- No frontend automated tests, no email verification or password reset, tokens are kept in localStorage.
- Proactive revision notifications (email or push) are not built.

## Stack

React 18, Vite, Tailwind CSS 3, Framer Motion, React Router, Lucide. Node, Express, MongoDB (Mongoose), Qdrant, Groq (Llama 3.3), Gemini embeddings.
