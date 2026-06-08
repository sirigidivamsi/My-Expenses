-- Database Schema for "My Expenses" Application

-- ENABLE UUID GENERATOR
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE (extending Supabase Auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  full_name text,
  email text,
  auth_provider text check (auth_provider in ('email', 'google')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. USER PREFERENCES TABLE
create table public.user_preferences (
  user_id uuid references public.users(id) on delete cascade primary key,
  theme text default 'system' not null check (theme in ('light', 'dark', 'system')),
  currency text default 'INR' not null,
  notifications_enabled boolean default true not null,
  recurring_reminders boolean default true not null,
  budget_alerts boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. WALLETS TABLE (Multi-Wallet)
create table public.wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('cash', 'bank', 'credit_card', 'upi', 'other')),
  balance numeric(15,2) default 0.00 not null,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_deleted boolean default false not null
);

-- 4. CATEGORIES TABLE (System & Custom)
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade, -- null means default system category
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text not null,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_deleted boolean default false not null
);

-- 5. TRANSACTIONS TABLE
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  wallet_id uuid references public.wallets(id) on delete restrict not null,
  category_id uuid references public.categories(id) on delete restrict not null,
  amount numeric(15,2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  date timestamp with time zone not null,
  notes text,
  tags text[] default '{}'::text[] not null,
  payment_method text not null,
  attachment_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_deleted boolean default false not null
);

-- 6. BUDGETS TABLE (Monthly budget limits)
create table public.budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  amount numeric(15,2) not null check (amount > 0),
  month text not null, -- Format: 'YYYY-MM'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_deleted boolean default false not null,
  unique (user_id, category_id, month)
);

-- 7. SAVINGS GOALS TABLE
create table public.savings_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric(15,2) not null check (target_amount > 0),
  target_date timestamp with time zone not null,
  saved_amount numeric(15,2) default 0.00 not null check (saved_amount >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_deleted boolean default false not null
);

-- 8. RECURRING TRANSACTIONS TABLE
create table public.recurring_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  wallet_id uuid references public.wallets(id) on delete restrict not null,
  category_id uuid references public.categories(id) on delete restrict not null,
  amount numeric(15,2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  interval text not null check (interval in ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  next_occurrence timestamp with time zone not null,
  notes text,
  tags text[] default '{}'::text[] not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_deleted boolean default false not null
);

-- 9. NOTIFICATIONS TABLE
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null, -- 'budget_alert', 'goal_reminder', 'recurring_tx', 'system'
  read_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. ATTACHMENTS TABLE
create table public.attachments (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid references public.transactions(id) on delete cascade not null,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CREATE INDEXES FOR PERFORMANCES
create index idx_transactions_user_date on public.transactions(user_id, date desc);
create index idx_transactions_wallet on public.transactions(wallet_id);
create index idx_transactions_category on public.transactions(category_id);
create index idx_budgets_user_month on public.budgets(user_id, month);
create index idx_recurring_next_occurrence on public.recurring_transactions(next_occurrence) where is_active = true and is_deleted = false;
create index idx_savings_goals_user on public.savings_goals(user_id);
create index idx_notifications_user_unread on public.notifications(user_id) where read_at is null;

-- ENABLE ROW LEVEL SECURITY
alter table public.users enable row level security;
alter table public.user_preferences enable row level security;
alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.attachments enable row level security;

-- ROW LEVEL SECURITY POLICIES

-- Users
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Auth trigger can insert users" on public.users for insert with check (true);

-- User Preferences
create policy "Users can view own preferences" on public.user_preferences for select using (auth.uid() = user_id);
create policy "Users can update own preferences" on public.user_preferences for update using (auth.uid() = user_id);
create policy "Users can insert own preferences" on public.user_preferences for insert with check (auth.uid() = user_id);

-- Wallets
create policy "Users can perform all operations on own wallets" on public.wallets for all using (auth.uid() = user_id);

-- Categories
create policy "Users can view custom categories and default categories" on public.categories 
  for select using (user_id is null or auth.uid() = user_id);
create policy "Users can create custom categories" on public.categories for insert with check (auth.uid() = user_id);
create policy "Users can update custom categories" on public.categories for update using (auth.uid() = user_id);
create policy "Users can delete custom categories" on public.categories for delete using (auth.uid() = user_id);

-- Transactions
create policy "Users can perform all operations on own transactions" on public.transactions for all using (auth.uid() = user_id);

-- Budgets
create policy "Users can perform all operations on own budgets" on public.budgets for all using (auth.uid() = user_id);

-- Savings Goals
create policy "Users can perform all operations on own savings goals" on public.savings_goals for all using (auth.uid() = user_id);

-- Recurring Transactions
create policy "Users can perform all operations on own recurring transactions" on public.recurring_transactions for all using (auth.uid() = user_id);

-- Notifications
create policy "Users can perform all operations on own notifications" on public.notifications for all using (auth.uid() = user_id);

-- Attachments
create policy "Users can perform all operations on own attachments" on public.attachments 
  for all using (exists(select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid()));

-- AUTOMATIC AUTH PROFILE & PREFERENCES TRIGGERS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Create or update user profile
  insert into public.users (id, name, full_name, email, avatar_url, auth_provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Valued User'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Valued User'),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  )
  on conflict (id) do update set
    name = excluded.name,
    full_name = excluded.full_name,
    email = excluded.email,
    avatar_url = excluded.avatar_url,
    auth_provider = excluded.auth_provider,
    updated_at = now();

  -- Create default user preferences
  insert into public.user_preferences (user_id, theme, currency, notifications_enabled, recurring_reminders, budget_alerts)
  values (
    new.id,
    'system',
    'INR',
    true,
    true,
    true
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 11. CREDIT CARDS TABLE
create table public.credit_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  wallet_id uuid references public.wallets(id) on delete cascade not null,
  card_name text not null,
  bank_name text not null,
  last_four text not null check (length(last_four) = 4),
  card_type text not null check (card_type in ('visa', 'mastercard', 'rupay', 'amex')),
  credit_limit numeric(15,2) not null check (credit_limit > 0),
  available_limit numeric(15,2) not null check (available_limit >= 0),
  statement_date integer not null check (statement_date between 1 and 31),
  due_date integer not null check (due_date between 1 and 31),
  interest_rate numeric(5,2),
  card_color text not null,
  annual_fee numeric(15,2) default 0.00,
  annual_fee_waiver_spend numeric(15,2) default 0.00,
  expiry_month integer check (expiry_month between 1 and 12),
  expiry_year integer check (expiry_year >= 2026),
  lounge_visits_remaining integer default 0,
  is_deleted boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. CREDIT CARD STATEMENTS TABLE
create table public.credit_card_statements (
  id uuid primary key default uuid_generate_v4(),
  card_id uuid references public.credit_cards(id) on delete cascade not null,
  statement_period_start timestamp with time zone not null,
  statement_period_end timestamp with time zone not null,
  statement_amount numeric(15,2) not null check (statement_amount >= 0),
  current_outstanding numeric(15,2) not null check (current_outstanding >= 0),
  minimum_due numeric(15,2) not null check (minimum_due >= 0),
  due_date timestamp with time zone not null,
  paid_amount numeric(15,2) default 0.00 not null check (paid_amount >= 0),
  status text default 'unpaid' not null check (status in ('unpaid', 'partially_paid', 'paid')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. CREDIT CARD EMIS TABLE
create table public.credit_card_emis (
  id uuid primary key default uuid_generate_v4(),
  card_id uuid references public.credit_cards(id) on delete cascade not null,
  purchase_name text not null,
  purchase_amount numeric(15,2) not null check (purchase_amount > 0),
  emi_amount numeric(15,2) not null check (emi_amount > 0),
  interest_rate numeric(5,2) not null,
  total_months integer not null check (total_months > 0),
  remaining_months integer not null check (remaining_months >= 0),
  paid_emis integer default 0 not null check (paid_emis >= 0),
  start_date timestamp with time zone not null,
  is_active boolean default true not null,
  is_deleted boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. CREDIT CARD REWARDS TABLE
create table public.credit_card_rewards (
  id uuid primary key default uuid_generate_v4(),
  card_id uuid references public.credit_cards(id) on delete cascade not null,
  cashback_earned numeric(15,2) default 0.00 not null check (cashback_earned >= 0),
  points_earned numeric(15,2) default 0.00 not null check (points_earned >= 0),
  points_redeemed numeric(15,2) default 0.00 not null check (points_redeemed >= 0),
  lounge_visits_remaining integer default 0 not null check (lounge_visits_remaining >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 15. SAVINGS PLANS TABLE
create table public.savings_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('rd', 'sip', 'gold', 'chit', 'fd', 'ppf', 'nps', 'emergency_fund', 'goal')),
  name text not null,
  institution_name text not null,
  monthly_contribution numeric(15,2) not null check (monthly_contribution >= 0),
  contribution_date integer check (contribution_date between 1 and 31),
  start_date timestamp with time zone not null,
  maturity_date timestamp with time zone,
  interest_rate numeric(5,2),
  target_amount numeric(15,2) not null check (target_amount >= 0),
  current_amount numeric(15,2) default 0.00 not null check (current_amount >= 0),
  is_active boolean default true not null,
  is_deleted boolean default false not null,
  details jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 16. SUBSCRIPTIONS TABLE
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  amount numeric(15,2) not null check (amount > 0),
  billing_period text not null check (billing_period in ('monthly', 'yearly')),
  next_billing_date timestamp with time zone not null,
  payment_wallet_id uuid references public.wallets(id) on delete set null,
  is_active boolean default true not null,
  is_deleted boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 17. BILL SPLITS TABLE
create table public.bill_splits (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid references public.transactions(id) on delete cascade not null,
  description text not null,
  total_amount numeric(15,2) not null check (total_amount > 0),
  your_share numeric(15,2) not null check (your_share >= 0),
  friend_name text not null,
  friend_share numeric(15,2) not null check (friend_share >= 0),
  status text default 'pending' not null check (status in ('pending', 'settled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CREATE INDEXES FOR WEALTH MODULES
create index idx_credit_cards_user on public.credit_cards(user_id) where is_deleted = false;
create index idx_savings_plans_user on public.savings_plans(user_id) where is_deleted = false;
create index idx_subscriptions_user_active on public.subscriptions(user_id, next_billing_date) where is_active = true and is_deleted = false;

-- ENABLE ROW LEVEL SECURITY
alter table public.credit_cards enable row level security;
alter table public.credit_card_statements enable row level security;
alter table public.credit_card_emis enable row level security;
alter table public.credit_card_rewards enable row level security;
alter table public.savings_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.bill_splits enable row level security;

-- ROW LEVEL SECURITY POLICIES FOR NEW TABLES
create policy "Users can perform all operations on own cards" on public.credit_cards for all using (auth.uid() = user_id);
create policy "Users can perform all operations on own statements" on public.credit_card_statements for all 
  using (exists(select 1 from public.credit_cards c where c.id = card_id and c.user_id = auth.uid()));
create policy "Users can perform all operations on own EMIs" on public.credit_card_emis for all 
  using (exists(select 1 from public.credit_cards c where c.id = card_id and c.user_id = auth.uid()));
create policy "Users can perform all operations on own card rewards" on public.credit_card_rewards for all 
  using (exists(select 1 from public.credit_cards c where c.id = card_id and c.user_id = auth.uid()));
create policy "Users can perform all operations on own savings plans" on public.savings_plans for all using (auth.uid() = user_id);
create policy "Users can perform all operations on own subscriptions" on public.subscriptions for all using (auth.uid() = user_id);
create policy "Users can perform all operations on own splits" on public.bill_splits for all
  using (exists(select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid()));

-- SEED DEFAULT CATEGORIES
INSERT INTO public.categories (id, user_id, name, type, icon, color) VALUES
  ('d1111111-1111-1111-1111-111111111101', null, 'Food', 'expense', 'Utensils', '#EF4444'),
  ('d1111111-1111-1111-1111-111111111102', null, 'Travel', 'expense', 'Car', '#3B82F6'),
  ('d1111111-1111-1111-1111-111111111103', null, 'Shopping', 'expense', 'ShoppingBag', '#EC4899'),
  ('d1111111-1111-1111-1111-111111111104', null, 'Bills', 'expense', 'Receipt', '#10B981'),
  ('d1111111-1111-1111-1111-111111111105', null, 'Fuel', 'expense', 'Fuel', '#F59E0B'),
  ('d1111111-1111-1111-1111-111111111106', null, 'Entertainment', 'expense', 'Film', '#8B5CF6'),
  ('d1111111-1111-1111-1111-111111111107', null, 'Health', 'expense', 'Activity', '#14B8A6'),
  ('d1111111-1111-1111-1111-111111111108', null, 'Education', 'expense', 'GraduationCap', '#06B6D4'),
  ('d1111111-1111-1111-1111-111111111109', null, 'EMI', 'expense', 'CreditCard', '#F97316'),
  ('d1111111-1111-1111-1111-111111111110', null, 'Rent', 'expense', 'Home', '#6366F1'),
  ('d2222222-2222-2222-2222-222222222201', null, 'Salary', 'income', 'Briefcase', '#10B981'),
  ('d2222222-2222-2222-2222-222222222202', null, 'Freelance', 'income', 'Laptop', '#3B82F6'),
  ('d2222222-2222-2222-2222-222222222203', null, 'Business', 'income', 'TrendingUp', '#8B5CF6'),
  ('d2222222-2222-2222-2222-222222222204', null, 'Bonus', 'income', 'Gift', '#F59E0B'),
  ('d2222222-2222-2222-2222-222222222205', null, 'Investment', 'income', 'PiggyBank', '#14B8A6')
ON CONFLICT (id) DO NOTHING;


-- 18. CREDITS & LOANS TABLES
create table public.credits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  person_name text not null,
  mobile_number text,
  type text not null check (type in ('lent', 'borrowed')),
  amount numeric(15,2) not null check (amount > 0),
  date timestamp with time zone not null,
  due_date timestamp with time zone,
  reason text,
  notes text,
  status text default 'active' not null check (status in ('active', 'partially_paid', 'closed')),
  attachment_url text,
  is_deleted boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.credit_payments (
  id uuid primary key default uuid_generate_v4(),
  credit_id uuid references public.credits(id) on delete cascade not null,
  amount numeric(15,2) not null check (amount > 0),
  date timestamp with time zone not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.credit_reminders (
  id uuid primary key default uuid_generate_v4(),
  credit_id uuid references public.credits(id) on delete cascade not null,
  reminder_date timestamp with time zone not null,
  status text default 'pending' not null check (status in ('pending', 'sent', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 19. SMART EXPENSE DETECTION TABLE
create table public.detected_notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  notification_id text,
  app_name text not null,
  title text,
  body text,
  timestamp timestamp with time zone not null,
  amount numeric(15,2),
  merchant text,
  transaction_type text check (transaction_type in ('income', 'expense')),
  status text default 'pending' not null check (status in ('pending', 'saved', 'ignored')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CREATE INDEXES FOR NEW TABLES
create index idx_credits_user on public.credits(user_id) where is_deleted = false;
create index idx_credit_payments_credit on public.credit_payments(credit_id);
create index idx_credit_reminders_date on public.credit_reminders(reminder_date) where status = 'pending';
create index idx_detected_notifications_user on public.detected_notifications(user_id);

-- ENABLE ROW LEVEL SECURITY
alter table public.credits enable row level security;
alter table public.credit_payments enable row level security;
alter table public.credit_reminders enable row level security;
alter table public.detected_notifications enable row level security;

-- ROW LEVEL SECURITY POLICIES
create policy "Users can perform all operations on own credits" on public.credits for all using (auth.uid() = user_id);
create policy "Users can perform all operations on own credit payments" on public.credit_payments for all 
  using (exists(select 1 from public.credits c where c.id = credit_id and c.user_id = auth.uid()));
create policy "Users can perform all operations on own credit reminders" on public.credit_reminders for all 
  using (exists(select 1 from public.credits c where c.id = credit_id and c.user_id = auth.uid()));
create policy "Users can perform all operations on own detected notifications" on public.detected_notifications for all using (auth.uid() = user_id);
