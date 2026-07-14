# EventFinder

New Zealand based event discovery app built on the MEVN stack (MongoDB, Express, Vue, Node).

> **Status:** Reviving a university project into a portfolio-quality piece. This README documents both the current implementation and the planned architecture — gaps between the two are called out explicitly rather than hidden.

---

## Overview

The EventFinder Web App Project is a New Zealand based event finding web scraper project, it aims to provide a aesthetically appealing UI with intuitive searching and filtering for events within New Zealand.

As this was originally built as a University project the implementation is mostly a prototype proof of concept. Currently missing some defensive JS lines, only missing values are protected against entering the Database for Data integrity (With our Null checks and Mongoose Schema) however if the scraping process, normalization etc. were to crash there is no graceful defensive JS so the entire application would likely crash. I've decided to re-visit this project to refactor this legacy code into a more secure version.

---

## Architecture

### Current Implementation

```
┌─────────────────┐      HTTP (Express Routes)      ┌──────────────┐
│  scraper.js      │ ───────────────────────────────▶│  server.js    │
│  (Node script,    │   /api/venues/normalize          │  (Express)    │
│   run manually)   │   /api/organizers/normalize       │               │
│                    │   /api/events (POST upsert)       │               │
└─────────────────┘                                  └──────┬───────┘
                                                              │ Mongoose
                                                              ▼
                                                        ┌──────────────┐
                                                        │   MongoDB     │
                                                        │  (Events,     │
                                                        │   Venues,     │
                                                        │   Organizers) │
                                                        └──────────────┘
        ┌──────────────────────┐        HTTP (Vue reads /api/events)
        │  index.html            │◀─────────────────────────────────────┘
        │  Vue 3 (CDN, single-file)│
        └──────────────────────┘
```

**Frontend:** Vue 3 loaded via CDN (`unpkg.com/vue@3`), not a build-tool (Vite/Webpack) pipeline. No `.vue` Single File Components; the whole app lives in `index.html`.

Currently this project uses Vue.js via CDN instead of a vite/webpack build tool as a university project this project was first created as a HTML frontend and to avoid refactoring the entire project I decided to implement vue.js as a CDN for this project as apposed to a build tool based project.

The tradeoff for this is that this project does not have code-splitting and component reusability as originally intended.

I may revisit this decision and rebuild this project as a full Vue.js app built from a build tool.

**Backend:** Express REST API, three resources (`/api/events`, `/api/venues`, `/api/organizers`), Mongoose ODM against MongoDB.

**Scraper:** Standalone Node script (`scraper.js`), not part of the running server — invoked manually, reads either local files (`file://`) or live URLs via Axios + Cheerio for HTML parsing.

### Planned Architecture (Roadmap)

#### Natural Fit with Vue.js Architecture:

Vue.js is inherently designed around the MVVM pattern. The framework’s reactive data binding, computed properties, and component structure directly map to MVVM principles. This means that we’re working with the framework’s strengths rather than against them.

Complex Data Relationships:
Eventfinder handles multiple interconnected data types such as events, venues, locations, user preferences and real-time filtering. MVVM excels at managing these complex relationships through reactive computed properties and centralized state management.

Real-Time User Interaction:
Eventfinder will have numerous real-time features that will benefit from using the MVVM such as Live filtering, Location Awareness, Search Suggestions and Map integration (Potentially)

State Management Complexity:
Eventfinder needs to be able to manage states at multiple levels: Component-Level, Page-Level, Application-Level and Location-Level which can be easily done using a MVVM architecture and Pinia

Comparison to other models:
MVC: Would require an additional controller layer adding complexity without benefits for a Vue.js SPA
MVP: Presenter pattern doesn’t leverage Vue’s reactive system effectively
Component Only: Would lead to mixed concerns and harder maintenance as the app grow

---

## Tech Stack

| Layer    | Technology           | Notes                                           |
| -------- | -------------------- | ----------------------------------------------- |
| Frontend | Vue 3 (CDN build)    | No build pipeline currently; see Roadmap        |
| Backend  | Express 5            | REST API                                        |
| Database | MongoDB + Mongoose 9 | ODM with schema validation                      |
| Scraping | Axios + Cheerio      | Supports both local file and live HTTP scraping |
| Config   | dotenv               | `.env` — never committed (see Security section) |

---

## Data Flow: Scrape → Normalize → Save

1. Scraper.js reads HTML mock-up (test-events.html) or reads from a live URL and parses `.event` blocks via cheerio.
2. For each scraped event, venue and organizer names are sent to dedicated normalization end points. This normalization prevents events with missing required information from being submitted into our MongoDB protecting our Database's data integrity.
3. Only events were both the venue and organizer normalization have succeeded are saved into the Database, also only events containing all required fields will be saved into our database.
4. Saving uses an atomic findOneAndUpdate upsert keyed on a unique slug, so re-running the scraper won't duplicate existing events.

---

## API Reference

| Method | Endpoint                    | Purpose                                                                    | Auth |
| ------ | --------------------------- | -------------------------------------------------------------------------- | ---- |
| GET    | `/api/events`               | List events, supports `startDate`, `endDate`, `search`, `category` filters | None |
| GET    | `/api/events/:id`           | Get single event                                                           | None |
| POST   | `/api/events`               | Upsert event by slug                                                       | None |
| PUT    | `/api/events/:id`           | Update event by ID                                                         | None |
| DELETE | `/api/events/:id`           | Delete event by ID                                                         | None |
| POST   | `/api/venues/normalize`     | Find-or-create a venue by name                                             | None |
| POST   | `/api/organizers/normalize` | Find-or-create an organizer by name                                        | None |

<!-- FLAG FOR YOURSELF: every write endpoint above has "Auth: None". Is that acceptable for
     a portfolio piece, or is "add auth middleware to write routes" your next real TODO?
     Worth a line in Known Limitations either way. -->

---

## Environment Variables

| Variable      | Purpose                               | Example (placeholder only)                                    |
| ------------- | ------------------------------------- | ------------------------------------------------------------- |
| `MONGODB_URI` | MongoDB Atlas/local connection string | `mongodb+srv://<user>:<pass>@cluster.mongodb.net/eventfinder` |
| `PORT`        | Express server port                   | `3000`                                                        |

⚠️ **Never commit real values.** `.env` is git-ignored. Copy `.env.example` (create one!) and fill in your own credentials locally.

---

## Setup

```bash
git clone https://github.com/PMarcel03/EventFinder.git
cd EventFinder
npm install
cp .env.example .env   # then fill in your MONGODB_URI
npm start
```

To run the scraper against the local test fixture:

```bash
node scraper.js
```

---

## Known Limitations / Security TODOs

Naming these explicitly, rather than hiding them, because acknowledging known gaps is a stronger portfolio signal than pretending the project is finished.

- **No write-endpoint authentication.** `POST`/`PUT`/`DELETE` on `/api/events`, `/api/venues`, `/api/organizers` currently accept unauthenticated requests. TODO: add auth middleware (JWT or API key) before any public deployment.
- **Organizer name is not denormalized onto the Event document**, unlike `venueName`. As a result, organizer name is excluded from the `/api/events` search filter (`$or` query) — events cannot currently be searched by organizer without an additional lookup/populate step. This is an inconsistency in the schema design, not an intentional constraint.
- **No retry/circuit-breaker logic in the scraper's normalization calls.** `normalizeVenue()`/`normalizeOrganizer()` handle _per-event_ failures (e.g. a malformed name) gracefully, but if the `/normalize` endpoint itself went down mid-run, the scraper would silently skip every remaining event with no alerting or retry — it defends against bad input, not downstream service outages.
- **Server startup doesn't .env values** On boot server startup does not validate .env values a malformed value (e.g. non-numeric port) fails silently
- **No automated tests currently exist.** <!-- your testing strategy plan goes here once you get to that block of the curriculum -->

---

## Roadmap

- [ ] Migrate frontend from CDN Vue to a Vite + Pinia + component-based architecture (see Planned Architecture above)
- [ ] Add authentication middleware to write endpoints
- [ ] Denormalize organizer name for search parity with venue
- [ ] Add retry/circuit-breaker handling for scraper's normalization calls
- [ ] Add automated test suite (unit + integration)
- [ ] Containerize + deploy (AWS/Azure target — TBD based on Block C of study plan)

---

## License

ISC
