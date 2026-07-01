# WealthQuest (standalone local build)

This is your uploaded WealthQuest code, reassembled into a runnable Vite + React
project with **no dependency on Base44**. All user progress (XP, coins, hearts,
exam attempts) is stored in your browser's `localStorage` instead of Base44's
hosted backend.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## What's original vs. what I added

**Untouched, straight from your upload:**
- `src/pages/Exam.jsx`
- `src/lib/examData.js`
- `src/lib/glossaryData.js`
- `src/lib/streakUtils.js`
- `src/lib/utils.js`
- `src/components/ui/button.jsx`

**Changed (one line):**
- `src/lib/useUserProgress.js` — the only edit is the import at the top,
  swapped from `@/api/base44Client` to `@/lib/localClient`. The rest of the
  hook — hearts refill logic, `updateProgress`, everything — is identical to
  your original file.

**New, since they weren't in your upload but were referenced by `Exam.jsx`:**
- `src/lib/localClient.js` — a drop-in mock of the Base44 SDK. It implements
  `base44.entities.UserProgress.list/create/update` against `localStorage`
  with the exact same method signatures, so nothing else had to change.
- `src/pages/Home.jsx` — simple landing page with XP/cash/streak and links
  into Flashcards and the Exam (`Exam.jsx` links to `/` and `/flashcards`,
  but neither existed in your upload).
- `src/pages/Flashcards.jsx` — built from your `glossaryData.js` since the
  Exam page links to `/flashcards` but that page wasn't included.
- `src/App.jsx`, `src/main.jsx`, `index.html` — routing and app entry point.
- `tailwind.config.js`, `src/index.css` — standard shadcn/ui CSS-variable
  theme, since your components use classes like `bg-primary`, `text-foreground`,
  `bg-card` that need these variables defined somewhere.
- `package.json`, `vite.config.js`, `postcss.config.js` — build tooling,
  including the `@` import alias your code relies on (`@/lib/...`, `@/components/ui/...`).

## Resetting progress

Since progress lives in `localStorage`, you can reset it any time from the
browser console:

```js
localStorage.removeItem('wealthquest_user_progress')
```

## Not included (wasn't in the uploaded dump)

If you had more pages/components in the real app (a lesson/course flow,
portfolio simulator, other UI components), they weren't in the file you
uploaded, so they aren't here. Send those over and I'll wire them in the
same way.

## Migrating back to Base44 later

If you ever want to reconnect to Base44's real backend instead of the local
mock, just revert the one-line import in `src/lib/useUserProgress.js` back
to `@/api/base44Client`, restore that file (recreate `src/api/base44Client.js`
and `src/lib/app-params.js` from your original upload — both are still valid,
I just didn't wire them in since you asked for standalone), and provide a
real Base44 `appId`/token.
