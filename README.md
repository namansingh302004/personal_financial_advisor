# finwise — your money, simplified.

> An AI-powered personal finance tracking web application. Track income and expenses, set budgets, manage recurring payments, view analytics, and get personalized financial insights powered by Google Gemini.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite), React Router, Recharts, Axios |
| Styling | Vanilla CSS (Finwise design system, Outfit font) |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT + bcrypt |
| AI | Google Gemini 1.5 Flash |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Features

- **Authentication** — Secure signup/login with JWT and bcrypt password hashing
- **Transaction Tracking** — Add, filter (by type, category, date, search), and delete transactions
- **Wallet Summary** — Real-time balance, budget progress, monthly income/savings cards
- **AI Insights** — Gemini AI analyzes your spending and gives personalized financial advice
- **Analytics** — Monthly bar charts (income vs expense), category donut chart, 30-day activity chart
- **Recurring Payments** — Track bills/subscriptions with due-date alerts, pause/resume support
- **Profile Management** — Update name, email, wallet balance, budget, and password

---

## Local Development Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier)
- Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

### 1. Clone the repo

```bash
git clone https://github.com/namansingh302004/personal_financial_advisor.git
cd personal_financial_advisor
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/finwise?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev
```

The API will run at `http://localhost:5000`

### 3. Set up the frontend

```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
```

The app will run at `http://localhost:5173`

---

## Environment Variables

### Backend (`server/.env`)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing (use a long random string) |
| `GEMINI_API_KEY` | Google Gemini API key for AI insights |
| `CLIENT_URL` | Frontend URL for CORS (e.g., `https://finwise.vercel.app`) |
| `PORT` | Server port (default: 5000) |

### Frontend (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (e.g., `https://finwise-api.onrender.com`) |

> ⚠️ **Never commit `.env` files to Git.** They are listed in `.gitignore`.

---

## Deployment

### Frontend → Vercel

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → select the GitHub repo
3. Set **Root Directory** to `client`
4. Add environment variable: `VITE_API_URL=https://your-render-backend-url.onrender.com`
5. Deploy

### Backend → Render

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. Set **Root Directory** to `server`
4. **Build Command**: `npm install`
5. **Start Command**: `node index.js`
6. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
   - `CLIENT_URL` (your Vercel frontend URL)
7. Deploy

### Database → MongoDB Atlas

1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user with read/write permissions
3. Under **Network Access**, allow `0.0.0.0/0` (all IPs, needed for Render)
4. Get your connection string and set it as `MONGODB_URI`

---

## API Reference

### Auth
```
POST /api/auth/signup
POST /api/auth/login
```

### Transactions
```
GET    /api/transactions?type=&category=&startDate=&endDate=&search=
POST   /api/transactions
DELETE /api/transactions/:id
```

### Analytics
```
GET /api/analytics/monthly?year=
GET /api/analytics/categories?startDate=&endDate=
GET /api/analytics/daily
GET /api/analytics/summary
```

### AI Insights
```
POST /api/ai/insights  { timeframe: "week" | "month" | "3months" | "year" }
```

### Recurring Payments
```
GET    /api/recurring
POST   /api/recurring
PUT    /api/recurring/:id
DELETE /api/recurring/:id
```

### Profile
```
GET /api/profile
PUT /api/profile
```

---

## Project Structure

```
personal-financial-advisor/
├── client/                    # React Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── api/               # Axios instance
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # Auth context
│   │   ├── pages/             # Route-level pages
│   │   └── index.css          # Global design system
│   ├── vercel.json            # Vercel SPA routing config
│   └── .env.example
├── server/                    # Express backend
│   ├── models/                # Mongoose schemas
│   ├── middleware/            # JWT auth middleware
│   ├── routes/                # API route handlers
│   ├── render.yaml            # Render deployment config
│   └── .env.example
├── .gitignore
└── README.md
```

---

## Future Features (V2/V3)

- **V2**: Smart savings suggestions, grocery price comparison, product tracking
- **V3**: OCR receipt scanner, voice transaction logging, AI financial assistant chatbot

---

## License

MIT — built with ❤️ by [Naman Singh](https://github.com/namansingh302004)
