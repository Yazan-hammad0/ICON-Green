# Real accounts

GitHub Pages only serves files. It cannot store accounts. So the app uses a free Supabase project for them: one account per email with a password, progress saved to the account, and sign-ups counted across every device. The code is in `js/backend.js`. The project's address and public key are in `js/config.js`.

This is connected since version 0.3.0. The steps below are how it was set up, in case the project is ever replaced.

## Why a password and not an emailed code

On Supabase's free built-in email sender the email templates are locked, and it only delivers to members of the Supabase team. So an emailed code cannot reach real visitors. Registration therefore uses email and password, with email confirmation turned off. The two costs: emails are not verified, and a forgotten password cannot be reset from the app.

To move to verified emails later: add your own sender under **Authentication**, **Emails**, **SMTP Settings** (this needs a domain you own), turn **Confirm email** back on, and add a reset-password screen.

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

## 3. Sign-up settings

1. Open **Authentication**, then **Sign In / Providers**. Under **User Signups** turn **Confirm email** off and press **Save changes**. Leave **Allow new users to sign up** on.
2. Open **Authentication**, then **URL Configuration**. Set **Site URL** to `https://yazan-hammad0.github.io/ICON-Green/`.

## 4. Put the two values in the app

1. In Supabase open **Project Settings**, then **API Keys**, then the **Legacy** tab.
2. Copy the **anon public** key. The Project URL is `https://<project id>.supabase.co`.
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

Then commit and push. Open the live app, register with your own email and a password, and check that a row appears in **Table Editor**, `profiles`.

## What is stored

| Where | What |
|---|---|
| `auth.users` (Supabase) | Email address, the password as a one-way hash, sign-in times |
| `profiles` | Name, email, role, city, the few answers from registration, language |
| `progress` | The records the person changed or added in the app |

This is personal data. The registration screen says what is stored and why. To delete an account, remove the person under **Authentication**, **Users**; their `profiles` and `progress` rows go with it.

## Forgotten passwords

There is no reset from the app yet. Under **Authentication**, **Users**, delete the account and ask the person to register again. Their saved progress is lost.

## Seeing who registered

Open **Table Editor**, `profiles` in Supabase. The app's team view only shows totals by role, on purpose: in this version anyone can pick the ICON team role, so the app must not show names or emails.

## Turning it off

Empty the two values in `js/config.js`, release, push. The app goes back to keeping accounts on the device.
