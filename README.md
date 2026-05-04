# EduTrack

EduTrack is a small study-tracker web app built with Next.js (App Router), React, TailwindCSS and Firebase authentication. It stores daily study inputs in MongoDB and provides simple dashboard pages for tracking progress and planning study sessions.

## Key features
- Email/password sign-in via Firebase (see `lib/firebase.js`).
- Dashboard with routes: `Dashboard`, `Daily Input`, `My Progress`, `Study Planner`.
- `Daily Input` form posts to the local API and saves entries to MongoDB (`dailyInputs` collection).

## Quick start

Prerequisites: Node.js 18+ and npm.

1. Install dependencies

```bash
npm install
```

2. Add environment variables

Create a file named `.env.local` in the project root and add your MongoDB connection string:

```
MONGODB_URI=your_mongodb_connection_string
```

This project expects a MongoDB database and will save daily inputs to the `EduTrack` database in the `dailyInputs` collection. A sample URI was used during development and should be replaced with your credentials.

3. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000 and sign in to access the dashboard.

## Important files
- `app/components/Navbar.js` — header and navigation links.
- `app/dashboard/daily-input/page.js` — the Daily Input form (sends POST to `/api/daily-input`).
- `app/api/daily-input/route.js` — API route that writes to MongoDB.
- `lib/mongodb.js` — MongoDB client helper.
- `.env.local` — place your `MONGODB_URI` here.

## How Daily Input works

The `Daily Input` page sends a JSON POST to `/api/daily-input`. The API route (server) uses `lib/mongodb.js` to connect and inserts the document into the `dailyInputs` collection with a `createdAt` timestamp.

If you want to extend the data model (add user association, tags, or analytics), update both the client form and the API insertion logic in `app/api/daily-input/route.js`.

## Styling & accessibility
- TailwindCSS is used for styling. Global accessible text colors and contrast overrides are in `app/globals.css` to ensure readable text across light/dark modes.

## Additions you may want next
- Connect inputs to authenticated users (store `userId` with entries).
- Add charts to `My Progress` to visualize study time.
- Add recurring tasks and calendar integration to `Study Planner`.

## Deployment

Build for production:

```bash
npm run build
npm start
```

When deploying (Vercel, Render, etc.) make sure to set `MONGODB_URI` in the deployment environment variables.

---

If you want, I can update this README to include screenshots, example API responses, or step-by-step Firebase setup — tell me which and I’ll add them.
