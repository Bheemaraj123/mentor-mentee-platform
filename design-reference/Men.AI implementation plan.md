# Men.AI implementation plan

## Product direction

Men.AI is a mentor–mentee intelligence workspace that captures or accepts meeting conversations and turns them into structured progress reports. The first release is a polished responsive dashboard prototype with local interactions that demonstrate the complete report workflow without requiring user credentials or external media assets.

## Design

Three candidate styles:

- **Editorial glass workspace** — 0.07 probability: soft blue glass panels, crisp editorial hierarchy, and calm productivity cues.
- **Warm academic notebook** — 0.06 probability: paper-like surfaces, ink typography, and warm study-room accents.
- **Dark command center** — 0.05 probability: high-contrast navy canvas, neon AI accents, and dense data panels.

### Chosen movement: editorial glass workspace

- **Core principles:** clarity before density; AI should feel helpful and inspectable; progress should be visible at a glance; every action should have a clear next step.
- **Color philosophy:** a pale blue-gray base keeps the product calm and trustworthy, cobalt is reserved for navigation and AI actions, and a small coral accent marks human momentum and attention without making the interface feel urgent.
- **Layout paradigm:** a persistent left rail anchors orientation while the main canvas uses a wide asymmetric hero row, stacked report/action cards, and a right-side insight column instead of a centered marketing grid.
- **Signature elements:** a soft mesh background, frosted cards with hairline borders, and a cobalt-to-sky AI gradient pill used for intelligence moments.
- **Interaction philosophy:** actions stay close to context; modals are lightweight and task-specific; completion states use visible motion and color shifts; filtering and search update the workspace immediately.
- **Animation:** short ease-out transitions for cards and modals, a gentle pulse around active capture states, and no decorative motion that competes with report content.
- **Typography system:** a system sans stack with strong 28–34px display titles, 14–15px labels, and compact all-caps metadata. High-contrast ink text carries hierarchy while muted slate text recedes.
- **Brand essence:** AI-assisted mentorship operations for teams that want every conversation to become accountable progress. Personality: thoughtful, precise, encouraging.
- **Brand voice:** headlines are direct and warm; CTAs describe the outcome. Example lines: “Turn conversations into momentum.” and “See what needs attention before the next session.”
- **Wordmark & logo:** a compact rounded-square mark containing two offset conversation bars, suggesting mentor and mentee converging into one report; pair it with a dot-separated Men.AI wordmark.
- **Signature brand color:** **Men cobalt** `#2F6BFF`, supported by ice blue `#EAF3FF` and coral `#FF8D73`.

## Implementation approach

- Keep the existing React/Vite/TypeScript starter and use a single responsive `Home` workspace with state-driven views and modals.
- Replace starter styles with a dedicated CSS system in `client/src/index.css`; use Lucide icons already installed in the project.
- Use local component state for report selection, navigation, checklist completion, report filters, search, toast feedback, and the new-report flow so the prototype is demonstrably interactive.
- Add `public/manus-routes.json` with the `/` route before starting the server.
- Preserve the server/database scaffold for the next phase; this slice does not add a database schema because the request is primarily a design and workflow build.

## Project structure

- `client/src/pages/Home.tsx` — Men.AI workspace shell, navigation, dashboard views, report modal, and local interactions.
- `client/src/index.css` — global design tokens, responsive layout, glass surfaces, charts, empty/loading/interaction states.
- `client/src/App.tsx` — route wiring and app providers.
- `public/manus-routes.json` — page route manifest for the web runtime.
- `app.config.ts` — project logo metadata.
- `plan.md` / `TODO.md` — approved design and outcome tracking.
