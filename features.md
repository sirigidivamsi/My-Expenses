# My Expenses - Features List

"My Expenses" is a comprehensive, offline-first personal finance management application built with Expo and React Native, integrated with Supabase. It offers users full control over their cash flow, credit accounts, subscriptions, budgets, savings, and analytics.

---

## Key Features

### 1. Interactive Financial Dashboard
*   **Net Worth Overview:** Tracks your total balance aggregated across all active wallets (Cash, Bank, etc.).
*   **Credit Cards Toggle:** Switch to include or exclude credit card debts dynamically in your total net worth calculations.
*   **Quick Actions:** Access shortcuts to quickly add new transactions, pay credit card bills, and log subscription expenses.
*   **Wallets Summary:** Live status of cash, bank accounts, and credit limits.

### 2. Intelligent Transaction Management
*   **Balance Safety Check:** Prevents recording transactions if the expense amount exceeds the selected wallet's available balance. It shows real-time validation warnings before saving.
*   **Detailed Logging:** Categorize transactions with tags, custom dates, descriptions, and account mappings.
*   **Reversible Deletions:** Deleting an expense automatically refunds the amount to the corresponding wallet.
*   **Split Payments:** Support for distinct payment modes (Cash vs. Bank) with proper mapping across offline and cloud databases.

### 3. Analytics & Expense Reports
*   **Dynamic Visualizations:** Beautiful custom bar charts with clean transition animations.
*   **Multi-View Timeframes:** Switch between:
    *   **Daily Reports:** Visualizes expenses for each day of the current week (Monday – Sunday).
    *   **Weekly Reports:** Displays expenses grouped by week (Week 1 – Week 5) for the selected month.
    *   **Monthly Reports:** Shows a rolling 6-month view of overall spending.
*   **Period Navigation:** Interactive left and right arrow buttons allow you to browse past or future days, weeks, and months.

### 4. Subscription & Recurring Bill Tracker
*   **Manual Payments:** Utility bills (e.g., YouTube Premium, Spotify) are registered with a "Pay" action, giving you manual control over when the payment is completed.
*   **Deduction & Transaction Integration:** Tapping "Pay" deducts the amount from your designated wallet, registers a new utility expense in your transactions log, and automatically rolls the next billing date forward by one month.

### 5. Smart Budgets & Savings Goals
*   **Category Budgets:** Set monthly limits per category (e.g., Food, Shopping, Transport). Live progress bars highlight how much budget is left.
*   **Savings Goals:** Define target amounts and timelines for your savings goals. Deposit or withdraw funds with real-time progress calculations.

### 6. Daily Expense Reminders
*   **Scheduled Push Notifications:** Uses local notifications to schedule a daily reminder at **9:30 PM** prompting you to log your daily expenses.

### 7. Offline-First & Cloud Synchronization
*   **Zustand & AsyncStorage:** All transactions, wallets, goals, and budgets are saved locally first, ensuring instant load times and offline accessibility.
*   **Supabase Cloud Sync:** Syncs local/guest session transactions with your remote database upon user sign-in.
*   **Guest-to-User Remapping:** Automatically maps guest wallet IDs (such as local Cash/Bank entries) to your cloud profile's synchronized wallets to prevent orphaned transactions and maintain correct account balances.
