# ClarkLoop

A Clark-first reuse app that helps students, staff, and the campus thrift store
give items a next life instead of sending them to a landfill, especially at move-out.
Built for the Environment track.

Post or grab free items, buy and sell, reserve from the thrift store, chat, and get a
rule-based "best next life" recommendation (reuse, repair, donate, or recycle).
There is also a suggestion box for campus sustainability ideas.

## Run it
It's a plain web app, no install. Either:
- **Double-click `index.html`** to open it in your browser, or
- In VS Code, install the **Live Server** extension, then right-click `index.html`
  and choose **Open with Live Server** (recommended; the saved-data feature is more
  reliable over `http://` than opening the file directly).

## Files
- `index.html` — the page shell and what loads the styles and scripts
- `styles.css` — all styling (dark and light themes, Clark red accent)
- `data.js` — categories, partner orgs, impact assumptions, and the scoring rules
- `app.js` — app state, screens (Feed, Market, Post, Chat, LoopBack), and interactions

## Try it
Tap a demo account on the sign-in screen (Clark student, Clark staff, outside visitor,
or thrift store), then open an item, reserve or message, pick up a free item, and open
the LoopBack tab for the recommender and suggestion box.

## Honest limits (say these in the demo)
- Data is saved in your browser only. It does not sync between phones or people.
  Real multi-user sharing needs a backend, which is a next step.
- Emails are not verified yet. A real version sends a confirmation link.
- In-app payment and shipping are not built; those buttons say "coming soon".
- The thrift store partnership is a demo idea, not an agreement.
- Repair/recycle partners and all impact numbers (pounds, dollars, CO₂) are
  samples or placeholders. Replace them with sourced figures before relying on them.

## Possible next steps
- A backend so posts, chat, and the suggestion box are shared across devices.
- Verified Clark email sign-in.
- An AI assistant (for example Gemini) that reads a photo and suggests what to do.
