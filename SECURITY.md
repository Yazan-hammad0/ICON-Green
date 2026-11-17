# Security

## What this app handles today

- Accounts are kept in a Supabase project (`js/config.js`, `docs/BACKEND.md`). Registration sends the email and password to Supabase Auth over HTTPS. The app never stores the password.
- Stored per account: email, name, role, city, the few answers from registration, language, and the records the person changed or added in the app.
- Each person can read and write only their own rows (row level security). The team view gets totals by role and city only, never names or emails.
- The key in `js/config.js` is the public anon key. It is meant to be public. The `service_role` key must never be in this repository.
- Emails are not verified in this version, and there is no password reset from the app.
- A copy of the account's profile and progress, and its session token, are kept in the browser's localStorage (`iconGreenV1`) until sign-out.
- To delete an account, ask the team; they remove it in Supabase and the stored rows go with it.
- The app loads no third-party scripts, fonts or trackers. The only network requests are for its own files and the accounts backend.
- All companies, people and numbers shown in the app are demo data. News items link out to their sources.

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private reporting instead: on this repository open the **Security** tab and choose **Report a vulnerability**.

Include the steps to reproduce, the browser and device, and what you expected instead. You will get a reply as soon as the team has looked at it.
