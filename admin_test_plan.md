# Implementation Plan - Admin Interface Testing and Fixes

## 1. Objectives
- [x] Fix `sub_category_id` in `news_articles` table (added missing column).
- [x] Update `dataProvider.ts` to handle:
    - `summary` as an ARRAY column (mapped from newline-separated string in form).
    - `sub_category_id` as a direct column.
    - `poll_data` and `related_launch_ids` as top-level fields for API.
- [x] Update `ArticleForm.tsx` to include:
    - Hierarchical category selection (Category -> Sub-category).
    - Summary points textarea (multiline).
    - Related Launch selection (ReferenceArrayInput).
    - Article Poll creator (ArrayInput).
- [x] Fix `categories` API to support `parent_id` filtering.
- [ ] Test end-to-end article creation in Admin Dashboard.

## 2. Technical Details
### Database Changes
- `ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS sub_category_id INTEGER REFERENCES news_categories(id) ON DELETE SET NULL;`
- `summary` is already an `ARRAY` text column.

### API Changes
- `GET /api/news/categories` now supports `?parent_id=X` or `?parent_id=null`.
- `POST /api/news` and `PATCH /api/news/:id` handle the new fields.

### Admin Dashboard Changes
- Updated `dataProvider.ts` with custom transformations for `articles`.
- Updated `ArticleForm.tsx` with new inputs and layout sections.

## 3. Test Scenarios (to be executed via Browser)
1. Login to Admin Dashboard (`http://localhost:3001`).
2. Navigate to "News" -> "Create".
3. Verify "Category" dropdown works.
4. Verify "Sub Category" dropdown appears after selecting Category.
5. Verify "Summary Points" accepts multiple lines.
6. Verify "Related Launch" allows searching/selecting launches.
7. Verify "Article Poll" allows adding question and options.
8. Submit and verify success.
9. Verify the new article appears correctly in both Admin List and Frontend Website.
