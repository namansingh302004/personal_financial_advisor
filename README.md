# Finwise — AI Personal Finance Advisor 💸

**Live App:** [https://my-finwise.netlify.app](https://my-finwise.netlify.app/)

Finwise is a modern, AI-powered personal finance tracker. Beyond just tracking income and expenses, it uses Google Gemini to parse receipts, analyze your spending habits, generate shareable insights, and detect dark patterns while shopping online.

---

## ✨ Features

- **Smart Tracking:** Log income, expenses, and recurring payments.
- **📸 Receipt Scanner:** Upload a receipt photo; AI extracts the merchant, items, and amount.
- **✂️ Split the Vibe:** Snap a restaurant bill, assign items to friends, and let AI calculate shares including tax/tip.
- **💬 AI Chat Assistant:** Talk naturally to your financial data (e.g., *"How much did I spend on food this month?"*).
- **🏆 Challenges & Streaks:** Gamify your savings with preset challenges and unlockable badges.
- **🛡️ Dark Pattern Detector:** Paste e-commerce product URLs to detect fake discounts and manipulative pricing.
- **✨ Money Moments:** Shareable, beautiful daily spending story cards.

---

## 🏗️ Architecture & Tech Stack

Finwise uses a standard **MERN** stack architecture enhanced with AI integrations:

- **Frontend:** React (Vite), React Router, Recharts, Lucide Icons
- **Backend:** Node.js, Express.js (REST API)
- **Database:** MongoDB (Mongoose)
- **AI Integration:** Google Gemini 1.5 Flash (Text & Multimodal Vision)
- **Hosting:** Frontend on Netlify, Backend on Render, DB on MongoDB Atlas

---

## 🚀 Run Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI
- A [Google Gemini API Key](https://aistudio.google.com/)

### 2. Clone & Install
```bash
git clone https://github.com/namansingh302004/personal_financial_advisor.git
cd personal_financial_advisor
```

### 3. Backend Setup
```bash
cd server
npm install
```
Create `server/.env`:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
```
Run the server:
```bash
npm run dev
```

### 4. Frontend Setup
Open a new terminal window:
```bash
cd client
npm install
```
Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000
```
Run the client:
```bash
npm run dev
```

The app will now be running at **http://localhost:5173**!

---
*Built with ❤️ by Naman Singh*
