# Real accounts in 15 minutes

GitHub Pages only serves files. It cannot store accounts. So today the app keeps each account on the device it was created on.

To make registration real (one account per email, progress saved to the account, sign-ups counted across every device), connect a free Supabase project. The app already has the code for it in `js/backend.js`. You only fill in two values.

What changes for a visitor once this is connected: after typing their email they get a 6-digit code by email, type it in, and they are in. No password.

> Not tested against a live Supabase project yet. It is tested against a stand-in backend in `tools/walk.js`. Do one real sign-up yourself after step 5.

## 1. Create the project

1. Go to https://supabase.com and create an account, then **New project**.
2. Name it `icon-green`. Pick the region closest to Saudi Arabia (for example Frankfurt or Bahrain if offered). Save the database password somewhere safe. You will not need it in the app.

## 2. Create the tables and rules

In the project, open **SQL Editor**, paste this, and press **Run**.

```sql
-- one row per registered person
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  name text,
  role text,
  city text,
  fields jsonb default '{}'::jsonb,
  lang text default 'ar',
  created_at timestamptz default now()
);

-- one row per person: what they changed in the app
create table public.progress (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;

-- everyone can read and write their own row only
create policy "own profile" on public.profiles for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "own progress" on public.progress for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- totals for the demand panel: role, city and a count. No names, no emails.
create or replace function public.signup_counts()
returns table (role text, city text, n bigint)
language sql security definer set search_path = public as $$
  select role, city, count(*) from public.profiles group by role, city;
$$;
revoke all on function public.signup_counts() from public, anon;
grant execute on function public.signup_counts() to authenticated;
```

## 3. Make the email carry a code

1. Open **Authentication**, then **Emails** (or **Email Templates**), then **Magic Link**.
2. Put this in the message body, so the email shows the 6-digit code:

   ```html
   <h2>ICON Green</h2>
   <p>Your code: <strong>{{ .Token }}</strong></p>
   <p>رمز الدخول: <strong>{{ .Token }}</strong></p>
   ```

3. Open **Authentication**, then **URL Configuration**. Set **Site URL** to `https://yazan-hammad0.github.io/ICON-Green/`.

Supabase's built-in email sender only allows a few emails per hour. That is enough to try it. Before sharing the link widely, add your own sender under **Authentication**, then **SMTP Settings**.

## 4. Put the two values in the app

1. In Supabase open **Project Settings**, then **API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `js/config.js` and paste them:

   ```js
   window.ICON_CONFIG = {
     supabaseUrl: "https://xxxxxxxx.supabase.co",
     supabaseKey: "eyJ..."
   };
   ```

The anon key is meant to be public. The rules from step 2 are what protect the data. Never put the `service_role` key in this file.

## 5. Release

```bash
python3 release.py "Accounts now work across devices"
```

Then commit and push. Open the live app, register with your own email, type the code, and check that a row appears in **Table Editor**, `profiles`.

## What is stored

| Where | What |
|---|---|
| `auth.users` (Supabase) | Email address, sign-in times |
| `profiles` | Name, email, role, city, the few answers from registration, language |
| `progress` | The records the person changed or added in the app |

This is personal data. Before real people register, update `SECURITY.md` and add a short privacy notice to the registration screen saying what is stored, why, and how to ask for deletion.

## Seeing who registered

Open **Table Editor**, `profiles` in Supabase. The app's team view only shows totals by role, on purpose: in this version anyone can pick the ICON team role, so the app must not show names or emails.

## Turning it off

Empty the two values in `js/config.js`, release, push. The app goes back to keeping accounts on the device.
