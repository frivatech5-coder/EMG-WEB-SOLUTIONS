# EMG WEB SOLUTIONS: website, admin panel and AI assistant

React 19 + Vite + Tailwind 4 front end, Firebase (Firestore, Auth, optional Storage) for all editable content, and a small Express server (`server.ts`) that serves the site and powers the **Evans** chatbot (`/api/chat`, Gemini, API key kept server-side).

## What is stored in Firebase
Everything edited in the admin panel is saved to Firestore and read back live by the public site:

| Collection | Contents | Public access |
|---|---|---|
| `settings/global` | company info, hero/section text, CTA labels, contact + WhatsApp, social links, SEO, announcement bar, estimator prices | read |
| `services` | services, descriptions, features, **KSh prices**, order | read |
| `portfolio` | projects, descriptions, technologies, live URL, image URL, featured | read |
| `reviews` | customer reviews (`pending` → `approved`/`hidden`) and manually added Google reviews | read **approved only**; create **pending only** |
| `inquiries` | contact-form enquiries | create only (admins read) |
| `admins` | optional extra admin UIDs (add in Firebase console) | none |

Images are uploaded to **Firebase Storage** (`site-images/…`, resized in the browser, max 5 MB) and only the URL is stored in Firestore.

Default content in `src/data/defaultData.ts` is a **display fallback only**. It is never written to Firebase automatically, so it can never overwrite your data. After an admin edits a collection, deleting everything in it stays empty.

## Setup
```bash
npm install --legacy-peer-deps
cp .env.example .env        # add GEMINI_API_KEY (server-side secret)
npm run dev                 # http://localhost:3000  (Express + Vite)
npm run build && npm start  # production (NODE_ENV=production)
npm run typecheck
```

### Firebase checklist (do this once)
1. **Config**: `firebase-applet-config.json` already points to project `oval-exchange-7t8c4` and its Firestore database. To use another project, edit that file or set the `VITE_FIREBASE_*` variables in `.env`.
2. **Authentication**: enable the **Google** provider and add your domain under *Authentication → Settings → Authorized domains*.
3. **Firestore rules**: deploy `firestore.rules`.
4. **Storage**: enable Firebase Storage (needs the Blaze plan on newer projects) and deploy `storage.rules`.
   ```bash
   npm i -g firebase-tools && firebase login
   firebase deploy --only firestore:rules,storage --project oval-exchange-7t8c4
   ```
5. **Admin e-mail**: the admin is `frivatech5@gmail.com`. To change it, edit it in **three places**: `firestore.rules`, `storage.rules` and `VITE_ADMIN_EMAILS`. Extra admins: create a document `admins/{their-uid}` in the Firebase console.
6. Open the site → footer → **Admin** → enter the admin password (see `GATE_HASH` in `src/components/admin/AdminPanel.tsx`; it is a SHA-256 hash) → sign in with Google. The **Dashboard** will offer to delete the fictional demo records from the original template and to add the starter services.

## Admin panel
Dashboard (counts, warnings) · Content (hero, headings, CTA text, announcement bar) · Services (add/edit/delete, **KSh price**, “custom quote only”, features) · Portfolio (add/edit/delete, image upload, technologies, live URL, featured) · Reviews (approve / hide / delete / respond; add a *verified Google review* manually) · Enquiries · Estimator (KSh prices) · Settings (phone, WhatsApp, email, socials, SEO) · Backup (export / restore / add missing starter content).
Saves show a success or error notification; destructive actions ask for confirmation; writes that get no response from Firebase fail after 15 s with a clear message.

## Pricing (KSh)
No prices were invented. Services and the estimator ship **without** prices and show “Custom quote” until you enter real amounts in Admin. Dollar amounts from the original template were removed. Services missing a price are flagged “price needs review” in Admin.

## Reviews
Visitors can submit reviews (name, 1-5 stars, service, feedback). They are saved as `pending`, labelled “Customer review”, and appear only after you approve them. They are **not** posted to Google; use Google's own review process for that. Abuse protection: validation, text sanitising, honeypot field, per-browser cooldown / daily limit, duplicate-text check, and strict Firestore rules (shape, size, forced `pending`, never “verified”).

## Evans (chatbot)
Name “Evans”, no model/provider branding shown. It receives only live website data (services, KSh prices, projects, contact details) and is instructed not to invent anything. Typing indicator, clear-chat button, WhatsApp fallback and mobile layout included. Optional `GEMINI_MODEL` env var overrides the model. `/api/chat` is rate-limited (20/min/IP) and input-capped.

## Before you go live
- Add real projects (and their live URLs) and your social links in Admin.
- Set absolute URLs for `og:image` in `index.html` once your domain is known.
- Privacy Policy and Terms pages are general templates: have them reviewed.
- Enter your real KSh prices.
- The server uses in-memory rate limiting; use a shared store if you run several instances.

## Project layout
`src/context/SiteContext.tsx` (Firestore + auth) · `src/components/admin/*` (admin) · `src/components/*` (public sections) · `src/pages/Pages.tsx` (privacy, terms, 404) · `src/lib/*` (format, upload, router, toast) · `server.ts` (Express + chat API) · `firestore.rules`, `storage.rules`, `firebase.json`.
