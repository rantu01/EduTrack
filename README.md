<div align="center">
  <img src="https://img.freepik.com/free-vector/flat-background-class-2023-graduation_23-2150291538.jpg?semt=ais_hybrid&w=740&q=80" alt="EduTrack Banner" width="100%" style="border-radius: 12px;"/>
  
  <br/><br/>

  # 🎓 EduTrack — Student Study Tracker

  <p align="center">
    <strong>A full-featured study tracking & productivity web app built with Next.js, Firebase & MongoDB</strong>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-16.2.4-000000?style=flat&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase" alt="Firebase" />
    <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb" alt="MongoDB" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat&logo=tailwindcss" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/Gemini_AI-8E75FF?style=flat&logo=google" alt="Gemini AI" />
  </p>

  <br/>
</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Pages & Routes](#-pages--routes)
- [API Endpoints](#-api-endpoints)
- [Data Model (MongoDB)](#-data-model-mongodb)
- [Available Scripts](#-available-scripts)
- [Screenshots](#-screenshots)
- [Deployment](#-deployment)
- [Future Improvements](#-future-improvements)
- [License](#-license)

---

## 📖 Overview

**EduTrack** is a modern, full-stack student productivity web application that helps students **track their daily study time**, **analyze their productivity patterns**, and **plan their study schedule**. Built with the latest web technologies, it offers:

- 🔐 Secure authentication (email/password + Google SSO)
- 📊 **24-hour time segmentation** — log what you do in each part of the day
- 🤖 **AI-powered analysis** via Google Gemini — get smart recommendations
- 📈 **Progress tracking** with weekly averages and visual metrics
- 📅 **Study planner** — manage deadlines and daily schedule
- 🎯 **Smart suggestions** — pressure & progress scoring with actionable tips

Whether you're a student wanting to understand your study habits or someone looking to optimize your daily routine, EduTrack gives you the insights you need.

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **[Next.js 16](https://nextjs.org/)** (App Router) | React framework with server components & API routes |
| **[React 19](https://react.dev/)** | UI library |
| **[TailwindCSS v4](https://tailwindcss.com/)** | Utility-first CSS framework |
| **[Firebase Auth](https://firebase.google.com/docs/auth)** | Email/password & Google sign-in |
| **[Firebase Firestore](https://firebase.google.com/docs/firestore)** | Store student profile data |
| **[MongoDB](https://www.mongodb.com/)** (via native driver) | Store daily input entries |
| **[Google Gemini AI](https://ai.google.dev/)** | AI-powered day analysis |
| **[Framer Motion](https://www.framer.com/motion/)** | Animations & transitions |
| **[Lucide React](https://lucide.dev/)** | Icon library |
| **[SweetAlert2](https://sweetalert2.github.io/)** | Beautiful alert dialogs |

---

## ✨ Features

### 🔐 Authentication
- Email/password registration & login
- Google single sign-on (SSO)
- Registration key system (optional — for controlled sign-ups)
- Auth guard — unauthenticated users are redirected to login
- Firestore profile storage with student ID

### 📝 Daily Input (Smart Suggestion Engine)
The core feature of EduTrack — a **24-hour time segmentation form**:
- **5 time segments**: Early Morning (06–10), Morning (10–14), Afternoon (14–17), Evening (17–21), Night (21–06)
- **Activity selection** with emoji icons (📚 Study, 💼 Work, 😴 Rest, 📱 Mobile, 🎮 Game, 📝 Assignment, 📖 Reading, ✏️ Other)
- **6 input fields per segment**: activity, note, distraction minutes, distraction reason
- **Automatic unaccounted time detection** — 1440 minutes total, see what's missing
- **Real-time daily breakdown** summary — updates as you type
- **Deadline/task management** — add, edit, remove deadlines
- **Mood selector** — log your mood (😫 😐 😊 🤩)
- **Form reset** — clears after successful submission

### 🤖 AI Analysis
- **Google Gemini integration** — analyzes your day's entries
- Provides: summary, recommended actions, recommended reading, quick tips
- **Local fallback** — uses heuristic-based suggestions when AI is unavailable
- Action cards with pressure & progress scores

### 📊 My Progress
- **Weekly averages**: study, work, rest, mobile time
- **Visual progress bars** with completion percentages
- **Activity stats** — quick overview of key metrics
- **Milestones section** — track achievements
- Auto-fetches from MongoDB on page load

### 📅 Study Planner
- **Today's schedule** — table view of tasks derived from daily inputs
- **Statistics cards**: total hours, courses, completion
- **Live data** — pulls from latest daily entry
- Fallback sample data when no entries exist

### 🏠 Dashboard
- **Welcome greeting** with user name
- **Daily overview** — weekly averages & today's breakdown
- **Selected entry viewer** — full details of any day's log
- **Activity breakdown** per time segment
- **Deadline tracking** — countdown timer, upcoming deadline card, all-deadlines modal
- **AI analysis panel** — analyze any date with Gemini
- **Summary card** — pressure level & progress percentage
- **Responsive design** — mobile bottom nav, desktop top nav

### 🎨 UI/UX
- Dark navy & gold color scheme
- Responsive — works on mobile, tablet & desktop
- Animated transitions (Framer Motion)
- Interactive cards & hover effects
- Toast notifications (SweetAlert2)
- Accessible text colors & contrast

---

## 📁 Project Structure

```
EduTrack/
├── app/                          # Next.js App Router
│   ├── layout.js                 # Root layout (fonts, globals)
│   ├── page.js                   # Home page → redirects to login
│   ├── globals.css               # Global styles & Tailwind imports
│   ├── login/
│   │   └── page.js               # Auth page (login + register)
│   ├── dashboard/
│   │   ├── layout.js             # Dashboard layout (Navbar, AuthGuard, Footer)
│   │   ├── page.js               # Main dashboard page
│   │   ├── [course]/page.js      # Dynamic course page
│   │   ├── daily-input/page.js   # Smart Suggestion Engine (core feature)
│   │   ├── my-progress/page.js   # Progress tracking page
│   │   └── study-planner/
│   │       ├── page.js           # Study planner (server component)
│   │       └── PlannerClient.js   # Planner logic (client component)
│   ├── components/
│   │   ├── Navbar.js             # Top navbar + mobile bottom nav
│   │   ├── Footer.js             # Dashboard footer
│   │   ├── AuthForm.js           # Mock auth form (utility)
│   │   ├── AuthGuard.js          # Route protection (redirects if not logged in)
│   │   └── dashboardComponent/
│   │       └── DashboardPage.jsx  # Dashboard UI (stats, entries, deadlines)
│   └── api/
│       ├── daily-input/route.js   # CRUD API for daily entries (POST + GET)
│       └── ai-analyze/route.js    # AI analysis API (Gemini integration)
├── lib/
│   ├── mongodb.js                # MongoDB connection helper
│   └── firebase.js               # Firebase client initialization
├── public/                       # Static assets
├── .env.local.example            # Example environment variables
├── next.config.mjs               # Next.js configuration
├── package.json                  # Dependencies & scripts
├── postcss.config.mjs            # PostCSS config (Tailwind)
├── eslint.config.mjs             # ESLint configuration
├── jsconfig.json                 # JS configuration
├── FEATURES.txt                  # Feature list
├── CHANGES_SUMMARY.md            # Detailed change log
└── README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20 LTS)
- **npm** (comes with Node.js)
- A **MongoDB** database (local or [Atlas](https://www.mongodb.com/atlas))
- A **Firebase** project (with Authentication & Firestore enabled)
- (Optional) A **Google Gemini API key** for AI analysis

### Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-username/EduTrack.git
cd EduTrack

# Install dependencies
npm install
```

### Step 2: Set Up Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Authentication** → **Sign-in methods** → Enable **Email/Password** & **Google**
4. Enable **Cloud Firestore** (for student profiles)
5. Go to **Project Settings** → **General** → **Your apps** → **Web app**
6. Copy the Firebase config values

### Step 3: Set Up MongoDB

1. Create a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or use local MongoDB)
2. Get your connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/`)

### Step 4: Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# MongoDB
MONGODB_URI=mongodb+srv://your-user:your-password@your-cluster.mongodb.net/

# Firebase (from Firebase Console → Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Optional: Registration key (set to true + a key to restrict sign-ups)
NEXT_PUBLIC_REQUIRE_REG_KEY=false
NEXT_PUBLIC_REGISTRATION_KEY=MY_SIMPLE_REG_KEY

# Optional: Google Gemini API key (for AI analysis)
GEMINI_API_KEY=your-gemini-api-key
```

### Step 5: Run

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

- Click **"Create student account"** to register
- Or sign in with Google
- Start logging your daily activities!

---

## 🌍 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ Yes | MongoDB connection string |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ Yes | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ Yes | Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ Yes | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ Yes | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ Yes | Firebase sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ Yes | Firebase app ID |
| `NEXT_PUBLIC_REQUIRE_REG_KEY` | ❌ No | Set `true` to require a registration key for new users |
| `NEXT_PUBLIC_REGISTRATION_KEY` | ❌ No | The registration key (used when `REQUIRE_REG_KEY=true`) |
| `GEMINI_API_KEY` | ❌ No | Google Gemini API key for AI-powered analysis |

---

## 🧭 Pages & Routes

| Route | Description | Auth Required |
|---|---|---|
| `/` | Home page — redirects to `/login` | ❌ |
| `/login` | Login & registration page | ❌ |
| `/dashboard` | Main dashboard with weekly insights, entries, deadlines | ✅ |
| `/dashboard/daily-input` | Smart Suggestion Engine — log your daily activities | ✅ |
| `/dashboard/my-progress` | Progress metrics & weekly averages | ✅ |
| `/dashboard/study-planner` | Study planner with today's schedule | ✅ |
| `/dashboard/[course]` | Dynamic course pages (e.g., `/dashboard/math101`) | ✅ |

---

## 🔌 API Endpoints

### `POST /api/daily-input`

Save a daily entry to MongoDB.

**Request body:**
```json
{
  "userId": "firebase-uid",
  "mood": "😊",
  "taskTitle": "Daily Log",
  "taskDescription": "Segment summary...",
  "studyTime": 120,
  "workTime": 60,
  "restTime": 30,
  "mobileTime": 35,
  "gameTime": 0,
  "segments": [...],
  "deadlines": [...],
  "unaccountedTime": 195,
  "unaccountedActivity": "sleep, eat...",
  "timestamp": "2026-05-06T..."
}
```

**Response:** `{ "success": true, "id": "..." }`

### `GET /api/daily-input`

Retrieve daily entries.

**Query params:**
- `userId` (required) — Firebase user ID
- `insights=weekly` (optional) — returns weekly averages

**Response (list):** `{ "success": true, "items": [...] }`
**Response (weekly):** `{ "success": true, "count": 5, "avgStudyTime": 90, ... }`

### `POST /api/ai-analyze`

Analyze a day's entries using Google Gemini AI.

**Request body:**
```json
{
  "date": "2026-05-06",
  "userId": "firebase-uid",
  "path": "/dashboard/daily-input"
}
```

**Response:** `{ "success": true, "data": { "summary": "...", "recommendedActions": [...], "recommendedReading": [...], "quickTip": "..." } }`

---

## 📦 Data Model (MongoDB)

### Collection: `dailyInputs`

```json
{
  "_id": "ObjectId",
  "userId": "firebase-uid",
  "mood": "😊",
  "taskTitle": "Daily Log",
  "taskDescription": "Early Morning: 📚 Study - algebra | Morning: 💼 Work ...",
  "studyTime": 120,
  "workTime": 60,
  "restTime": 30,
  "mobileTime": 35,
  "gameTime": 0,
  "distractions": 1,
  "distractionTime": 5,
  "unaccountedTime": 195,
  "unaccountedActivity": "180 mins sleep, 60 mins eating",
  "segments": [
    {
      "id": "seg-0",
      "label": "Early Morning",
      "startTime": "06:00",
      "endTime": "10:00",
      "durationMinutes": 240,
      "activity": "study",
      "note": "algebra",
      "distractionMinutes": 5,
      "distractionReason": "mobile"
    }
  ],
  "deadlines": [
    { "id": 123, "title": "Math Assignment", "type": "assignment", "date": "2026-05-10" }
  ],
  "timestamp": "2026-05-06T10:30:00.000Z",
  "createdAt": "2026-05-06T10:30:15.789Z",
  "updatedAt": "2026-05-06T10:30:15.789Z"
}
```

### Collection: `students` (Firestore)

```json
{
  "fullName": "John Doe",
  "email": "john@university.edu",
  "studentId": "2024-12345",
  "createdAt": "Timestamp"
}
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (localhost:3000) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/) → Import repository
3. Add all environment variables from `.env.local` in Vercel's dashboard
4. Deploy — Vercel auto-detects Next.js

### Deploy to Other Platforms

```bash
npm run build
npm start
```

Make sure to set all environment variables on your hosting platform.

**Important:** MongoDB Atlas requires network access — whitelist your deployment's IP address.

---

## 🔮 Future Improvements

Since this project is built with extensibility in mind, here are some possible additions:

- [ ] **User-specific data** — associate all entries with authenticated users (already partially done)
- [ ] **Charts & graphs** — visualize study patterns on the My Progress page
- [ ] **Calendar integration** — recurring tasks & events in Study Planner
- [ ] **Export data** — download entries as CSV/PDF
- [ ] **Admin panel** — manage users, view all entries
- [ ] **Notifications** — deadline reminders
- [ ] **Dark mode** — theme toggle
- [ ] **PWA** — install as a mobile app
- [ ] **Unit & integration tests** — Jest + React Testing Library

---

## 📄 License

This project is for educational purposes. Feel free to use, modify, and learn from it.

---

<div align="center">
  <sub>Built with ❤️ for students, by students.</sub>
  <br/>
  <sub>© 2026 EduTrack</sub>
</div>
