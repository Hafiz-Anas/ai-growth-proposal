# Growth Engine: clickable design proposal

A front-end-only prototype of **Growth Engine**, an AI-powered Instagram growth app by Raid Technologies for small food businesses in Kuwait. It is built to be shown in a client meeting: every screen and button works, but **all data is mock data**. There is no backend, database, login or API call; nothing you do in the app is sent anywhere.

## Run it

Requires Node.js 20 or newer.

```bash
npm install
npm run dev          # http://localhost:3000
```

For the smoothest demo, use a production build:

```bash
npm run build
npm start            # http://localhost:3000
```

Other checks: `npm run lint`, `npx tsc --noEmit`.

> **Windows: open the folder with its exact letter case.** The folder on disk is `C:\Users\Sulyman\Documents\Raid-techs\ai-growth-proposal`. If a terminal is opened as `...\documents\raid-techs\...`, Node loads React twice and the build breaks. `next.config.ts` detects this and prints the exact `cd` command to use.

### Show it on a phone

- **Same Wi-Fi:** run `npm run build && npx next start -H 0.0.0.0`, then open `http://<your-computer-ip>:3000` on the phone. Use Share → **Add to Home Screen** (iPhone) or **Install app** (Android) to open it full-screen like a real app.
- Offline caching (service worker) only runs over HTTPS or on `localhost`, so over plain Wi-Fi the app still installs to the home screen but needs the connection.

## What's inside

| Screen | What it shows |
| --- | --- |
| **Gallery** (home) | Photos-style Library grouped by date, Albums (All Photos, Uploads, Instagram, Drafts, Scheduled, AI Generated, Favorites, plus albums you create), select mode, full-screen viewer with swipe, and a mock upload picker |
| **Create post** | Instagram-style preview, AI caption in English/Arabic with Regenerate / Shorter / More formal / Friendlier, hashtag chips, AI best time, Post now / Schedule / Save draft |
| **Engagement** | DM-style inbox: Comments, Messages, Sent. Each item has an AI reply to send, edit or regenerate; sent replies are labelled *Sent as-is*, *Edited* or *Written by you* |
| **Insights** | Account overview, AI status, recommendations (Accept / Dismiss / Done), last 10 posts chart, best posting times, content types, promoted vs normal, monitored posts, weekly report |
| **Competitors** | Competitors as small Instagram profiles, comparison against your account (frequency, engagement, content mix, best times) labelled as an AI estimate, Add competitor |
| **Profile & settings** | Profile header, plan, connected accounts, notifications, language, theme, help, reset demo data, log out |
| **AI chat** | Bottom sheet on phones, side panel on desktop. Post / Analytics / Competitors modes with suggested questions; answers use the active account's data, including a chart and a suggested post |

Also: account switcher (3 accounts), notifications sheet, English/Arabic with full right-to-left layout, light and true-dark mode, skeleton loading, empty states, safe areas, visible keyboard focus, reduced-motion support, and an installable PWA.

## About the mock data

- Three accounts, each with its own ~40 photos, numbers, conversations and competitors: **@mathanet_baity** (home-cooked food), **@qahwat_alfareej** (café) and **@tannour_bakery** (bakery).
- The app runs on a **fixed demo clock: Friday 16 October 2026, 7:30 PM Kuwait time**, so "today", "tomorrow" and scheduled times always read the same.
- Changes you make (posting, scheduling, replies, albums…) live in memory and reset on reload. Language, theme and the active account are remembered in the browser. **Profile → Reset demo data** restores everything.
- Everything is in typed files in [`/mock`](./mock). Photos are free Unsplash photos stored in [`/public/photos`](./public/photos); sources are listed in [`public/CREDITS.md`](./public/CREDITS.md).

## Project layout

```
app/          Routes: / (Gallery), /create, /engagement, /insights, /competitors, /profile, PWA manifest
components/   Screens, sheets, shell (top bar, tab bar, sidebar, AI banner), charts, small UI kit
lib/          Store (zustand), translations, formatting (Kuwait time, Arabic digits), hooks
mock/         All demo data and the mock AI answers
public/       Photos, PWA icons, service worker, photo credits
```

Built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui (Base UI), lucide icons and Framer Motion.
