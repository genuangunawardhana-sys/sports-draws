# Salesianum Pickleball Tournament tracker

Live round-robin standings, a court board, and playoff brackets for the Salesianum Tennis pickleball FUNraiser.

- **Everyone** can see scores, court assignments, standings and brackets. No login needed.
- **Score keepers** tap **Admin**, enter the admin password, and can then add teams, enter scores, set courts, change settings and create brackets.
- Every open phone refreshes within about 4 seconds of a change.

## What's in the box

```
public/index.html   The app (single page)
api/state.js        GET  - public read of all tournament data
api/login.js        POST - checks the admin password, returns a 12-hour session
api/write.js        POST - admin-only saves (rejected without a valid session)
lib/store.js        Upstash Redis storage
lib/auth.js         Password check and signed sessions
```

The admin password lives only on the server, in an environment variable. It is not in the page source.

## Deploy (about 10 minutes)

1. **Put the code on GitHub.** Create a new repository and upload this folder, or run `git init && git add . && git commit -m "init"` and push.
2. **Import it into Vercel.** In Vercel, choose **Add New → Project** and pick the repository. Leave **Framework Preset** as **Other**, with no build command and no output directory. Click **Deploy**. The first deploy will show "Storage isn't connected" until step 3 is done.
3. **Add storage.** In the project, open **Storage** (or the **Marketplace**), choose **Upstash for Redis**, create a database (free tier is plenty) and connect it to this project. This adds the Redis environment variables for you.
4. **Set the admin password.** Go to **Settings → Environment Variables** and add `ADMIN_PASSWORD` = `SalesPickle` for Production and Preview.
5. **Redeploy.** Go to **Deployments**, open the latest one's **⋯** menu and choose **Redeploy** so the new variables take effect.
6. **Test it.** Open the site, tap **Admin**, and enter the password. Under **Settings**, choose **Load sample tournament** and try entering scores from two phones. Choose **Reset everything** before event day.

Command-line alternative: `npm i -g vercel`, then `vercel` in this folder. Add Redis and `ADMIN_PASSWORD` in the dashboard, then run `vercel --prod`.

## Run locally

```
npm install
vercel link
vercel env pull .env.development.local
vercel dev   # run from this folder
```

## Day-of tips

- **Share the main URL with everyone.** Participants only see results.
- **Change the password after the event,** or any time it leaks. Edit `ADMIN_PASSWORD`, then redeploy. That signs out every admin.
- **For a second tournament on the same database,** set `STORE_PREFIX` to a new value (for example `pb2026spring`).
- **Admin sessions last 12 hours** on each device. Tap **Admin on. Lock** to end one early, for example on a shared tablet.
