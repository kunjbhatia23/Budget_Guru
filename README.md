# Budget Guru - Personal Finance Management Dashboard

A comprehensive personal finance management application built with Next.js, TypeScript, and MongoDB.

## Features

- 📊 **Transaction Management**: Add, edit, and delete income and expense transactions  
- 👤 **Multi-Profile & Group Management**: Create multiple personal profiles, organize them into groups (e.g., family, roommates, business partners), and switch between individual and group financial views.  
- 🤝 **Expense Splitting (Splitwise-like)**:  
    - Automatically calculate who owes whom in a group based on shared expenses.  
    - Visualize outstanding balances and suggested settlements.  
    - "Settle Up" functionality to record payments made between group members, accurately adjusting their balances.  
- 💰 **Group Income Distribution**: Add a single income transaction (e.g., business profit) and distribute it among selected profiles within a group.  
- 📈 **Visual Analytics**: Interactive charts for spending patterns, category breakdowns, and monthly trends.  
- 🎯 **Budget Tracking**: Set monthly budgets for various categories and track spending against your goals, with real-time updates on spent, remaining, and percentage.  
- 📊 **Comprehensive Financial Overviews**: Dashboard statistics (Total Balance, Monthly Income, Monthly Expenses, Savings Rate) accurately reflect all financial movements, including the net effect of settlements, while distinguishing between actual income/expenses for budgeting.  
- 📱 **Responsive Design**: Optimized for desktop, tablet, and mobile devices  
- 🔒 **Data Security**: Secure data handling with input validation and sanitization  
- ⚡ **Performance**: Optimized for fast loading and smooth user experience  

## Tech Stack

- **Frontend**: Next.js 13, React 18, TypeScript  
- **Styling**: Tailwind CSS, Radix UI Components  
- **Database**: MongoDB with Mongoose ODM  
- **Charts**: Recharts  
- **Icons**: Lucide React  
- **Deployment**: Vercel (recommended)  

## Getting Started

### Prerequisites

- Node.js 18+  
- npm 8+  
- MongoDB Atlas account or local MongoDB instance  

### Installation

1. Clone the repository:

    ```bash
    git clone <repository-url>
    cd budget-guru
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up environment variables:

    ```bash
    cp .env.example .env.local
    ```

4. Update `.env.local` with your MongoDB connection string:

    ```env
    MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
    ```

5. Run the development server:

    ```bash
    npm run dev
    ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
budgetguru/
├── app/                    # Next.js 13 app directory
│   ├── api/               # API routes
│   │   ├── expense-split/ # Endpoint for calculating expense splits
│   │   ├── profile-budgets/ # Endpoints for budget management
│   │   ├── profile-transactions/ # Endpoints for individual/group transactions
│   │   ├── profiles/      # Endpoints for profile and group management
│   │   └── settle-expense/ # Endpoint for recording settlements
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (main dashboard)
│   ├── loading.tsx        # Loading UI
│   ├── error.tsx          # Error UI
│   ├── not-found.tsx      # 404 page
├── components/            # React components
│   ├── ui/                # Reusable UI components (shadcn/ui)
│   ├── profile/           # Components for profile and group management
│   └── ...                # Feature-specific components (BudgetChart, ExpenseSplit, TransactionForm, etc.)
├── lib/                   # Utility functions
│   ├── api.ts             # General API client base
│   ├── constants.ts       # App constants (validation, UI configs)
│   ├── db.ts              # Database connection utility
│   ├── finance-utils.ts   # Finance-specific utility functions (currency, date, categories, budget calculations)
│   ├── mongodb.ts         # MongoDB connection helper
│   ├── profile-api.ts     # Client functions for profile, group, transaction, budget, and settlement APIs
│   └── theme-config.ts    # Chart theme configurations
├── models/                # MongoDB Mongoose models (Profile, UserGroup, ProfileTransaction, ProfileBudget)
├── store/                 # Zustand store for global state management (e.g., current profile/group, view mode)
├── types/                 # TypeScript type definitions (finance, profile)
└── public/                # Static assets
```

## API Endpoints

### User Groups & Profiles

- `GET /api/profiles` - Get all user groups and their associated profiles.  
- `POST /api/profiles` - Create a new user group with initial profiles.  
- `PUT /api/profiles/[id]` - Update an existing user group (e.g., group name, profiles).  
- `DELETE /api/profiles/[id]` - Delete a user group.  
- `DELETE /api/profiles/[groupId]?profileId=[profileId]` - Delete a specific profile from a group.  

### Profile Transactions

- `GET /api/profile-transactions` - Get transactions filtered by profile, group, or view mode.  
- `POST /api/profile-transactions` - Create a new transaction (income, expense, or part of a group income distribution).  
- `PUT /api/profile-transactions/[id]` - Update an existing transaction.  
- `DELETE /api/profile-transactions/[id]` - Delete a transaction.  

### Profile Budgets

- `GET /api/profile-budgets` - Get all budgets for a given profile/group with calculated spending status.  
- `POST /api/profile-budgets` - Create or update multiple budget categories for a profile/group.  

### Expense Splitting & Settlements

- `GET /api/expense-split/[groupId]` - Calculate and retrieve expense split data (balances and minimal settlements) for a given group.  
- `POST /api/settle-expense` - Record a settlement payment between two profiles within a group, creating `settlement_paid` and `settlement_received` transactions.  

## Deployment

### Manual Deployment

1. Build the application:

    ```bash
    npm run build
    ```

2. Start the production server:

    ```bash
    npm start
    ```

## Environment Variables

| Variable        | Description                      | Required |
|----------------|----------------------------------|----------|
| `MONGODB_URI`  | MongoDB connection string         | Yes      |
| `NODE_ENV`     | Environment (development/production) | No   |