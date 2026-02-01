# How News Categories & Sections Are Managed in Admin

This guide explains how each section on the public news page (**http://localhost:5173/news**) is controlled from the admin panel (**http://localhost:3001**).

---

## 1. Category filter: LAUNCH, IN SPACE, TECHNOLOGY, MILITARY, FINANCE

**On the public site:** The main news page has category buttons (LAUNCH, IN SPACE, TECHNOLOGY, MILITARY, FINANCE). Clicking one filters the article list by that category.

**In Admin:**

- **Where to manage categories:** **Categories** (sidebar: Categories).
  - Create/edit categories with **Name**, **Slug**, and **Description**.
  - Slugs must match what the frontend expects (see below).

- **Per article:** When creating or editing an **Article**, set the **Category** dropdown (e.g. "LAUNCH", "In Space", "Technology", "Military", "Finance").  
  Only **published** articles appear on the public site; the list is filtered by the selected category using the category’s **slug**.

**Slug mapping (public page → API):**

| Display name | Slug (API / URLs) |
|--------------|-------------------|
| LAUNCH       | `launch`          |
| IN SPACE     | `in-space`        |
| TECHNOLOGY   | `technology`      |
| MILITARY     | `military`       |
| FINANCE      | `finance`        |

Category pages like `/news/in-space`, `/news/technology`, etc. use the same slugs.

---

## 2. Featured article (hero at top)

**On the public site:** The large featured article at the top (e.g. “BREAKING: SPACEX LAUNCHES…”).

**In Admin:**

- **Articles** → Create or Edit an article.
- In **Article Settings** → **Visibility & Promotion**, turn **Featured Article** ON.
- Set **Published** to ON so it’s visible publicly.

**Backend:** The API endpoint `GET /api/news/featured` returns articles where `is_featured = true` and `status = 'published'`. The frontend uses the first one (limit 1) for the hero.

Only one article is typically shown as the main hero; if multiple are featured, the first from the API is used.

---

## 3. Recent Interviews

**On the public site:** The “RECENT INTERVIEWS” carousel/section.

**In Admin:**

- **Articles** → Create or Edit an article.
- In **Article Settings** → **Visibility & Promotion**, turn **Interview Article** ON.
- Set **Published** to ON.

**Backend:** The frontend calls `GET /api/news?is_interview=true&limit=12`. Only articles with `is_interview = true` and `status = 'published'` appear in this section.

---

## 4. Top Stories (THIS MONTH / THIS WEEK / TODAY)

**On the public site:** The “TOP STORIES” block with time filters (THIS MONTH, THIS WEEK, TODAY).

**How it works today:**

- **Top Stories** is the first 5 articles from the **main article list** for the currently selected category and time range.
- The time filter (TODAY / THIS WEEK / THIS MONTH) filters the main list by `date_from`; “Top Stories” is just `articles.slice(0, 5)`.

**In Admin:**

- To influence which articles appear here:
  - Set the article **Category** (e.g. LAUNCH, IN SPACE) so it appears in the right category view.
  - Set **Published** and **Published at** date so it falls in the desired time range.
- Optionally, you can turn **Top Story** ON in **Article Settings**; the backend supports `is_top_story`, but the current public News page does **not** filter “Top Stories” by this flag—it only uses the first 5 of the main list. A future change could use `is_top_story` for this section.

---

## 5. America section (trending articles)

**On the public site:** The “America” (or similar) section that shows trending articles.

**In Admin:**

- **Articles** → Create or Edit an article.
- In **Article Settings** → **Visibility & Promotion**, turn **Trending** ON.
- Set **Published** to ON.

**Backend:** The frontend calls `GET /api/news/trending` (e.g. limit 6). The API returns articles where `is_trending = true` and `status = 'published'`.

---

## 6. Main article list (and category filter)

**On the public site:** The main list of articles, and the category buttons that filter it.

**In Admin:**

- **Category** on each article (Articles → Create/Edit → **Category** dropdown) decides in which category the article appears (LAUNCH, IN SPACE, TECHNOLOGY, MILITARY, FINANCE).
- **Published** must be ON for the article to appear at all.
- **Author** and **Tags** are optional but affect display and filtering (e.g. by tag via `?tag=...`).

**Backend:** `GET /api/news` supports query params: `category` (slug), `date_from` / `date_to`, `tag`, `search`, etc. The public page uses these when you change category or time.

---

## 7. TRENDING tags: SPACEX, ARTEMIS 2, MARS SAMPLE RETURN, etc.

**On the public site:** The tag buttons under the main categories (TRENDING, SPACEX, ARTEMIS 2, MARS SAMPLE RETURN, DARPA LUNAR ORBITER).

**How it works:**

- These are **search** filters: clicking one sends a **search** term to the API (e.g. “spacex”, “artemis”, “mars sample return”).
- The labels and search terms are **hardcoded** in the frontend (`web/src/pages/News.jsx`); they are **not** managed in the admin.
- Articles appear in the results if their **title**, **subtitle**, or **excerpt** match the search term.

To influence which articles show for “SPACEX” or “ARTEMIS 2”, use those terms in the article’s title, subtitle, or excerpt. You can also assign **Tags** (e.g. SPACEX, ARTEMIS) in the article form; the public page can filter by tag when the URL has `?tag=...`.

---

## 8. Tags (e.g. SPACEX, NASA, ARTEMIS)

**On the public site:** Used when the URL has a tag filter (e.g. `/news?tag=spacex`). Tags can also be shown on article cards/detail.

**In Admin:**

- **Tags** (sidebar): Create and manage tag names (and slugs if used).
- **Articles** → Create or Edit → **Tags** multi-select: assign one or more tags to the article.

**Backend:** `GET /api/news?tag=<slug-or-id>` returns only articles that have that tag. Tag filtering is separate from the TRENDING search buttons above.

---

## Quick reference: Article form “Article Settings”

| Switch / field   | Effect on public site                                      |
|------------------|------------------------------------------------------------|
| **Featured Article** | Can appear as the hero featured article (`/api/news/featured`). |
| **Trending**     | Can appear in trending section (`/api/news/trending`).     |
| **Interview Article** | Appears in “Recent Interviews” (`/api/news?is_interview=true`). |
| **Top Story**    | Stored in DB; not yet used for “Top Stories” on the page.  |
| **Published**    | Article is visible on the public site at all.              |
| **Category**     | Which category filter shows this article (Launch, In Space, etc.). |
| **Tags**         | Which tag filters (e.g. `?tag=spacex`) show this article. |

---

## Where to find things in Admin

| Goal                         | Where in Admin                    |
|-----------------------------|-----------------------------------|
| Create/edit categories      | **Categories** (list/create/edit)  |
| Create/edit tags            | **Tags** (list/create/edit)       |
| Assign category to article  | **Articles** → Create/Edit → **Category** |
| Assign tags to article      | **Articles** → Create/Edit → **Tags**   |
| Feature an article          | **Articles** → Create/Edit → **Featured Article** ON |
| Show in “Recent Interviews”  | **Articles** → Create/Edit → **Interview Article** ON |
| Show in trending section    | **Articles** → Create/Edit → **Trending** ON |
| Publish an article          | **Articles** → Create/Edit → **Published** ON |

All of the above only affect the public site when the article is **Published**.
