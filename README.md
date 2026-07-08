# Finwise — AI Personal Finance Advisor

**Live Application:** [https://my-finwise.netlify.app](https://my-finwise.netlify.app/)

Finwise is a comprehensive, AI-powered personal finance tracking application. It is designed to help users track their income and expenses, set budgets, manage recurring payments, and receive personalized financial insights powered by Google Gemini.

---

## Key Features

- **Authentication:** Secure signup and login functionality utilizing JWT and bcrypt password hashing.
- **Transaction Tracking:** Add, categorize, and filter transactions by type, date, or search term.
- **AI Chat Assistant:** A conversational interface that accesses your financial data to answer budgeting and spending questions.
- **Receipt Scanner:** Upload receipt images to automatically extract merchant names, itemized lists, and total amounts via AI.
- **Split Bill Calculator:** Scan restaurant bills to assign items to specific individuals and calculate exact shares including tax and tip.
- **Dark Pattern Detector:** Analyze e-commerce product URLs to detect manipulative pricing or fake discount practices.
- **Financial Challenges:** Gamified savings challenges with unlockable badges and progress streaks.
- **Money Moments:** Generate highly visual, shareable daily spending summary cards.
- **Wallet Summary:** View real-time balances, budget progress, and monthly income versus savings metrics.
- **Recurring Payments:** Track subscriptions with due-date alerts and pause or resume functionality.

---

## Architecture & Technology Stack

The application is built using the MERN stack and integrates multimodal AI capabilities.

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite), React Router, Recharts, Lucide |
| Styling | Vanilla CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| AI Integration | Google Gemini 2.5 Flash API (Text & Multimodal) |
| Deployment | Netlify (Frontend) + Render (Backend) |

---

## Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account (Free Tier)
- Google Gemini API Key

### 1. Repository Setup

Clone the repository and enter the project directory:

```bash
git clone https://github.com/namansingh302004/personal_financial_advisor.git
cd personal_financial_advisor
```

### 2. Backend Configuration

Install dependencies for the Express backend:

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory and configure the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
```

Start the backend development server:

```bash
npm run dev
```

### 3. Frontend Configuration

Open a new terminal window and install the React dependencies:

```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory and point it to the local backend:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend development server:

```bash
npm run dev
```

The application will be accessible at **http://localhost:5173**.

---

## Project Structure

```text
personal-financial-advisor/
├── client/                    # React Vite application
│   ├── public/
│   ├── src/
│   │   ├── api/               # Axios instance configuration
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-level components
│   │   └── index.css          # Global design system variables
│   └── netlify.toml           # Netlify deployment configuration
├── server/                    # Express REST API
│   ├── models/                # Mongoose database schemas
│   ├── middleware/            # JWT authentication logic
│   ├── routes/                # API endpoints including AI integrations
│   └── index.js               # Application entry point
└── README.md
```

---

## License

Distributed under the MIT License. Built by Naman Singh.
