# Budget Guru - Personal Finance Management Dashboard

A comprehensive personal finance management application built with Next.js, TypeScript, and MongoDB, designed to provide clear financial insights for individuals and groups.

## Features

  - 👤 **Multi-Profile & Group Management**: Create personal profiles, organize them into groups (e.g., family, roommates), and seamlessly switch between individual and group financial views.
  - 🤝 **Advanced Expense Splitting**:
      - Automatically calculate who owes whom in a group based on shared expenses, similar to Splitwise.
      - "Settle Up" functionality to record payments between members, which accurately adjusts balances by creating corresponding `settlement_paid` and `settlement_received` transactions.
  - 💰 **Group Income Distribution**: Add a single income transaction (e.g., business profit) and distribute it evenly among selected profiles within a group.
  - 🎯 **Budget Tracking**: Set monthly budgets for various categories and track spending against your goals with real-time progress bars showing spent, remaining, and percentage used.
  - 📈 **Visual Analytics**: Interactive charts for spending patterns by category and monthly trends over time.
  - 📄 **Comprehensive Financial Reports**:
      - Generate detailed monthly reports for any profile or group using a dedicated month-and-year picker.
      - View summaries of income vs. expenses, breakdowns of spending by category, and budget vs. actual performance.
      - Export reports to both **PDF** and **CSV** formats for record-keeping or sharing.
  - 🎨 **Theme Customization**: Switch between **Dark** and **Light** mode for comfortable viewing day or night.
  - 📱 **Fully Responsive Design**: Optimized for a seamless experience on desktop, tablet, and mobile devices.

### New Features

  - 🔁 **Recurring Transactions**:
      - Automate the tracking of regular income and expenses with specific frequencies (e.g., daily, weekly, monthly, yearly).
      - Transactions are automatically added on the correct day, eliminating the need for repetitive manual entry.
  - 🚗 **Comprehensive Asset Management**:
      - A dedicated section to track the value and costs associated with your significant assets.
      - Automatically calculates and applies annual depreciation to assets like vehicles to provide a realistic current valuation.
      - Log expenses against specific assets, such as car repairs or home improvements, to track their lifetime cost of ownership.

## Tech Stack

  - **Framework**: Next.js 14 (App Router)
  - **Language**: TypeScript
  - **Database**: MongoDB with Mongoose
  - **Styling**: Tailwind CSS
  - **UI Components**: shadcn/ui, Radix UI
  - **State Management**: Zustand
  - **Charts**: Recharts
  - **PDF Generation**: jsPDF, jspdf-autotable
  - **CSV/Excel Export**: `xlsx` (SheetJS)
  - **Icons**: Lucide React

## Screenshots Of Project
**Dashboard**
![Dashboard](Screenshots/Screenshot%202025-08-01%20000843.png)
**Transaction History**
![Transaction History](Screenshots/Screenshot%202025-08-01%20001019.png)
**Add Transaction**
![Add Transaction](Screenshots/Screenshot%202025-08-01%20001037.png)
**Split Group Expenses**
![Split Group Expenses](Screenshots/Screenshot%202025-08-01%20001052.png)
**Generate Financial Report**
![Generate Financial Report](Screenshots/Screenshot%202025-08-01%20002000.png)

## Getting Started

### Prerequisites

  - Node.js 18+
  - npm 8+
  - MongoDB Atlas account or a local MongoDB instance

### Installation

1.  Clone the repository:

    ```bash
    git clone <repository-url>
    cd budget-guru
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Set up your environment variables by creating a `.env.local` file from the example:

    ```bash
    cp .env.example .env.local
    ```

4.  Update `.env.local` with your MongoDB connection string:

    ```env
    MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
    ```

5.  Run the development server:

    ```bash
    npm run dev
    ```

6.  Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser.

## Project Structure

```
budget-guru/
├── app/
│   ├── api/
│   │   ├── assets/               # Endpoints for managing assets
│   │   ├── expense-split/
│   │   ├── financial-reports/    # Endpoint for generating monthly reports
│   │   ├── profile-budgets/
│   │   ├── profile-transactions/ # Endpoint for managing transactions (including recurring)
│   │   ├── profiles/
│   │   └── settle-expense/
│   ├── layout.tsx
│   └── page.tsx              # Main dashboard page
├── components/
│   ├── ui/
│   │   ├── month-year-picker.tsx # Custom component for report date selection
│   │   └── ...                 # Reusable UI components (shadcn/ui)
│   ├── profile/
│   ├── AssetForm.tsx           # Form for adding/editing assets
│   ├── AssetList.tsx           # Component to display assets
│   ├── RecurringTransactionForm.tsx # Form for setting up recurring transactions
│   ├── FinancialReports.tsx    # Component for the reports feature
│   └── ...                     # Other feature-specific components
├── lib/
│   ├── api.ts
│   ├── db.ts
│   ├── finance-utils.ts
│   └── profile-api.ts          # Client-side API functions
├── models/                     # Mongoose models (UserGroup, ProfileTransaction, Asset, etc.)
├── store/                      # Zustand store for global state
├── types/                      # TypeScript type definitions
└── public/
```

## API Endpoints

A brief overview of the available API routes.

#### User Groups & Profiles

  - `GET /api/profiles`: Fetch all groups and their profiles.
  - `POST /api/profiles`: Create a new group.
  - `PUT /api/profiles/[id]`: Update a group.

#### Transactions & Budgets

  - `GET /api/profile-transactions`: Fetch transactions based on filters.
  - `POST /api/profile-transactions`: Create a new transaction.
  - `PUT /api/profile-transactions/[id]`: Update a transaction.
  - `DELETE /api/profile-transactions/[id]`: Delete a transaction.
  - `GET /api/profile-budgets`: Fetch budgets for a profile/group.
  - `POST /api/profile-budgets`: Create or update budgets for a profile/group.

#### Assets

  - `GET /api/assets`: Fetch assets for a profile/group.
  - `POST /api/assets`: Create a new asset.
  - `PUT /api/assets/[id]`: Update an existing asset.
  - `DELETE /api/assets/[id]`: Delete an asset.

#### Expense Splitting & Settlements

  - `GET /api/expense-split/[groupId]`: Calculate expense splits for a group.
  - `POST /api/settle-expense`: Record a settlement payment.

#### Financial Reports

  - `GET /api/financial-reports`: Generate a detailed monthly report for a given scope (profile/group) and month.

## Deployment

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Required |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string. | Yes |
| `NODE_ENV` | Set to `production` for builds. | No |

