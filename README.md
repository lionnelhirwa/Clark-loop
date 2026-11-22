# ClarkLoop

**Keep it in the loop.** Clarkies' first reuse app, built for environmental sustainability and social impact.

## What it is
ClarkLoop is a campus reuse app for Clark University. Instead of throwing usable things away,
especially during move-out, students, staff, and the campus thrift store can give items a next
life: grab something left out for free, buy or sell second-hand, reserve from the thrift store,
chat to arrange a handoff, and get a "best next life" suggestion (reuse, repair, donate, recycle).
There's also a suggestion box for campus sustainability ideas, and an impact tracker.

It's a self-contained web app (HTML, CSS, JavaScript). No build step, no server. Data is saved
in the browser, so it runs even offline.

## Inspired by
- **Fizz** (the campus social app): the clean feed and the bottom tab bar.
- **Modern app onboarding screens**: the landing page with a moving grid of items and a big
  "Get started" button.
- **The circular economy**: keeping products in use longer instead of sending them to landfill,
  which is the core idea behind the whole app.

## How to access the demo
- **Easiest (live link):** once GitHub Pages is on for this repo, open
  `https://lionnelhirwa.github.io/Clark-loop/` on any phone or computer. No install.
- **On your computer:** double-click `index.html`, or in VS Code use the Live Server extension
  (right-click `index.html` -> Open with Live Server), or run `python -m http.server 5500` and
  open `http://localhost:5500`.
- **Try it fast:** on the landing page tap **Demo** (top-right) to jump straight in, or
  **Get started** to make an account.

## Files
- `index.html` - the page shell that loads the styles and scripts
- `styles.css` - all styling (dark app, white login/sign-up, Clark red gradient)
- `data.js` - categories, campus buildings, partner orgs, impact assumptions, scoring, icons
- `app.js` - onboarding, accounts, screens (Feed, Market, Post, Chat, LoopBack), chat, notifications, profile
- `logo.svg` - the app icon (a loop that reads as a "C")
- `logo-lockup.svg` - the logo next to the "ClarkLoop" wordmark

## limits So far  
- Data is saved in this browser only; it does not sync between phones or people yet. A shared
  backend is the main next step.
- Accounts and passwords are a prototype, not real security.
- In-app payment and shipping are not built; those buttons say "coming soon."
- Some chat replies are simulated so the demo feels alive.
- Impact numbers (pounds, dollars, CO2) are placeholders, not sourced yet.

## Next steps
- A backend so posts, chat, and ideas are shared across devices.
- Verified Clark email sign-in.
- An AI assistant (for example Gemini) that reads a photo and suggests what to do with an item.
