# LUMS Beginner Cricket Camp — setup guide

This version uses **Supabase** for a shared database, administrator authentication and image storage. It is a static HTML/CSS/JavaScript website and can be hosted on Cloudflare Pages, Netlify or another static host.

## Before you start

You need:
- A Supabase account and a new project.
- Your existing hosting account (for example Cloudflare Pages).
- The LUMS logo image, if you want it shown. Put it beside `index.html` as `lums-logo.png` for the initial fallback, or upload it later from the admin panel.

## Step 1 — Create the database

1. Open https://supabase.com and create a project.
2. Open **SQL Editor** in the Supabase dashboard.
3. Open `supabase-setup.sql` from this project, copy all its contents and run it.
4. The script creates the tables, access rules and two image buckets.

## Step 2 — Create the administrator account

1. In Supabase, open **Authentication → Users**.
2. Create an account using an email address controlled by the camp administrator.
3. Copy the user's UUID.
4. Return to SQL Editor and run this statement, replacing the placeholder with the UUID:

```sql
insert into public.admin_users(user_id)
values ('YOUR_AUTH_USER_UUID');
```

Do not share the admin password or give admin access to ordinary members. You can add another authorised admin by creating another Auth user and inserting that user's UUID into `admin_users`.

## Step 3 — Connect the website to Supabase

1. In Supabase, open **Project Settings → API** (or **Data API** depending on dashboard version).
2. Copy the Project URL.
3. Copy the public **anon/publishable** key. Never use the `service_role` or secret key in browser code.
4. Open `app.js`.
5. Replace:

```js
const SUPABASE_URL = "qglxkwbcvpgshwdfnjxa";
const SUPABASE_ANON_KEY = "sb_publishable_U1wd_QPG0kR4C6TJPupk2g_uYsqSe9L";
```

with your own Project URL and anon/publishable key.

## Step 4 — Run it locally

Keep all files in the same folder:
- `index.html`
- `styles.css`
- `app.js`
- `supabase-setup.sql`
- `SETUP.md`
- `lums-logo.png` (optional)

In VS Code, open Terminal in this folder and run:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

You can also use the VS Code Live Server extension. Do not test by double-clicking the HTML file; use a local web server.

## Step 5 — Deploy

Upload the project folder to your existing Git repository / hosting provider and redeploy. Your host should serve `index.html` from the project root.

## What the admin can change

After signing in through the **Admin** button:
- Website heading, subtitle, homepage description and About text.
- Hero background image, logo and overlay colour.
- Practice days, time, venue, equipment, what to bring and weekly frequency.
- Add, edit and delete fixtures, dates, venues, results and statuses.
- Edit or delete squad members and their profile pictures.
- Export private squad details as a CSV file.

Changes are stored in Supabase and appear to other visitors after refresh.

## Important security and privacy notes

- The browser only contains the public anon/publishable key. Row Level Security (RLS) policies protect the private registration table and admin functions.
- Never put a Supabase service-role/secret key in `app.js`, HTML, GitHub or a public hosting dashboard.
- This starter allows public registration submissions. It does not verify that the submitted LUMS ID or email truly belongs to a current LUMS student. For a real campus-only registration process, add email verification and/or have an administrator verify each registration before publishing it.
- Public profile names, roles and profile photos are visible on the website. Do not upload anyone's picture without permission.
- The current form adds a public squad card immediately after successful registration. If you prefer approval before publication, I can change it to a pending-approval workflow.
- The public registration endpoint can receive spam. Before a high-traffic launch, add CAPTCHA/rate limiting and a server-side validation step (for example Supabase Edge Function).
- This is a flexible admin panel for the content and features included here, not literally unrestricted editing of the underlying source code or database schema. Structural changes still require a developer.

## Troubleshooting

- **"Connect Supabase first"**: check that both project values in `app.js` are correct and that the page is reloaded.
- **Admin says unauthorised**: make sure you inserted the exact Auth user's UUID into `public.admin_users`.
- **No fixtures or members appear**: confirm that the SQL script ran successfully and check the browser console for Supabase errors.
- **Images fail**: confirm that both storage buckets exist and that the storage policies from the SQL script were created.
- **Changes do not appear on another device**: make sure both devices are using the same deployed website and the same Supabase project.
