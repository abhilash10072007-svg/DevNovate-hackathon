# 🚀 AI Career Advisor — Full Stack App

A complete AI-powered career mentoring platform for students to track skills, projects, and internship applications — with an AI assistant powered by Groq, email OTP via AWS SES/Nodemailer, and a MongoDB Atlas backend.

---

## 📁 Project Structure

```
ai-career-advisor/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema with OTP fields
│   │   ├── Skill.js         # Skills with level/progress
│   │   ├── Project.js       # Projects with GitHub/LinkedIn
│   │   └── Internship.js    # Internship tracker
│   ├── routes/
│   │   ├── auth.js          # Register, OTP verify, Login
│   │   ├── skills.js        # CRUD for skills
│   │   ├── projects.js      # CRUD for projects
│   │   ├── internships.js   # CRUD for internships
│   │   ├── profile.js       # Get/update profile
│   │   └── ai.js            # Groq AI chat endpoint
│   ├── middleware/
│   │   └── auth.js          # JWT protect middleware
│   ├── utils/
│   │   └── email.js         # Nodemailer OTP sender
│   ├── server.js            # Express app entry
│   ├── package.json
│   └── .env.example         # → copy to .env and fill
│
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── pages/
    │   │   ├── Register.js    # Registration form
    │   │   ├── Login.js       # Login form
    │   │   ├── VerifyOTP.js   # 6-digit OTP verification
    │   │   ├── Dashboard.js   # Stats, trends, quick actions
    │   │   ├── Skills.js      # Skills + gap analysis
    │   │   ├── Projects.js    # Project portfolio
    │   │   ├── Internships.js # Kanban + list tracker
    │   │   └── Profile.js     # User profile
    │   ├── components/
    │   │   └── Layout.js      # Sidebar + AI chat popup
    │   ├── context/
    │   │   └── AuthContext.js # Auth state management
    │   ├── utils/
    │   │   └── api.js         # Axios instance
    │   ├── App.js             # Routes
    │   ├── index.js
    │   └── index.css          # All styles
    └── package.json
```

---

## ⚙️ Setup Instructions

### 1. Clone / Copy the project
```bash
cd ai-career-advisor
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# MongoDB Atlas (create free cluster at mongodb.com/atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai_career_advisor

# JWT secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_very_long_random_secret_here

# ── EMAIL OPTION A: AWS SES (production) ──────────────────
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=AKIAIOSFODNN7EXAMPLE       # SES SMTP credentials
EMAIL_PASS=wJalrXUtnFEMI/K7MDENG/abc # from AWS Console
EMAIL_FROM=noreply@yourdomain.com

# ── EMAIL OPTION B: Gmail (development) ───────────────────
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=you@gmail.com
# EMAIL_PASS=xxxx xxxx xxxx xxxx   # App Password from Google
# EMAIL_FROM=you@gmail.com

# Groq API key (free at console.groq.com)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx

FRONTEND_URL=http://localhost:3000
PORT=5000
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

### 4. Run Development Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev       # uses nodemon for hot reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start         # React dev server on :3000
```

Open: **http://localhost:3000**

---

## 🔑 Getting API Keys

### MongoDB Atlas (Free)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free cluster → Connect → Drivers → Copy URI
3. Replace `<username>` and `<password>` in your URI
4. Whitelist your IP in Network Access

### Groq API (Free)
1. Go to [console.groq.com](https://console.groq.com)
2. Create account → API Keys → Create key
3. Copy key to `GROQ_API_KEY`

### AWS SES (Email OTP)
1. Go to AWS Console → Simple Email Service
2. Verify your domain or email address
3. Create SMTP credentials
4. Use those in `EMAIL_USER` / `EMAIL_PASS`

**For Gmail (dev only):**
1. Enable 2FA on Google account
2. Go to myaccount.google.com → Security → App Passwords
3. Create app password → use as `EMAIL_PASS`

---

## 🌟 Features

| Feature | Details |
|---------|---------|
| **Auth** | Register → Email OTP → Login with JWT |
| **Dashboard** | Stats, trending tech 2026, pipeline summary |
| **Skills** | Add/edit/delete, progress bar, category filter, gap analysis, trending suggestions |
| **Projects** | Portfolio cards with GitHub + LinkedIn + Live links |
| **Internships** | Kanban board view + List view, move between stages |
| **Profile** | Name, bio, college, GitHub, LinkedIn, portfolio |
| **AI Assistant** | Groq-powered popup, tech-only responses, conversation memory |

---

## 🚀 Production Deployment

### Backend → Railway / Render / AWS EC2
```bash
# Set all .env variables in the platform's env settings
npm start
```

### Frontend → Vercel / Netlify
```bash
npm run build
# Set REACT_APP_API_URL if backend is on different domain
```

If deploying separately, update the proxy in `frontend/package.json`:
```json
"proxy": "https://your-backend-url.railway.app"
```

Or add to `frontend/.env`:
```env
REACT_APP_API_URL=https://your-backend-url.railway.app
```

And update `frontend/src/utils/api.js`:
```js
const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || '/api' });
```

---

## 🎨 Color Palette

| Purpose | Color |
|---------|-------|
| Background | `#0f172a` (deep navy) |
| Card | `#1e293b` |
| Primary (blue) | `#2563eb` |
| Accent | `#0ea5e9` |
| Text | `#f1f5f9` |
| AI Chat green | `#10b981` |
| AI Chat bg | `#0d1f17` |

---

## 📝 Notes

- The AI assistant **only answers tech/career questions** (enforced via system prompt)
- All data is per-user and requires JWT authentication
- OTP expires in **10 minutes**
- Token expires in **7 days**
