# Article Image Upload to Cloudflare R2 - Implementation

## Summary

Article images (`hero_image_url` and `featured_image_url`) now use Cloudflare R2 bucket for storage, matching the implementation used for crew member profile images.

---

## Changes Made

### 1. **Backend: New Upload Endpoint** (`api/routes/upload.js`)

Added `/api/upload/article` endpoint:
- **Route:** `POST /api/upload/article`
- **Auth:** Admin only (requires authentication + admin role)
- **Storage:** Cloudflare R2 bucket in `articles/` folder
- **Returns:** Uploaded image URL, key, filename, and metadata

```javascript
router.post('/article', authenticate, role('admin'), upload.single('image'), asyncHandler(async (req, res) => {
  // Uploads to R2 bucket in 'articles/' folder
  const result = await r2Storage.uploadFile(req.file, 'articles');
  // Returns URL and metadata
}));
```

### 2. **Frontend: Article Form** (`api/admin/src/components/ArticleForm.tsx`)

Updated to use `ImageInput` component from react-admin:
- **Hero Image:** `ImageInput` + `TextInput` (for direct URL entry)
- **Featured Image:** `ImageInput` + `TextInput` (for direct URL entry)
- Users can either:
  - Upload an image file (automatically uploads to R2)
  - Enter a direct image URL manually

**Before:**
- Custom file input that only created blob URLs
- No actual upload functionality

**After:**
- `ImageInput` component handles file selection
- Files are automatically uploaded to R2 when form is saved
- TextInput still available for direct URL entry

### 3. **Frontend: Data Provider** (`api/admin/src/dataProvider.ts`)

Added image upload handling in both `create` and `update` methods:

**For `hero_image_url` and `featured_image_url`:**
- Checks if field has `rawFile` property (file upload from ImageInput)
- If file exists → uploads to `/api/upload/article` → gets R2 URL
- If object with `src` → uses the `src` value
- If string URL → uses as-is
- Cleans URLs to remove any server IP addresses

**Implementation:**
```typescript
const handleArticleImageUpload = async (imageField: any) => {
  if (imageField && imageField.rawFile) {
    // Upload to R2 via /api/upload/article
    // Returns cleaned R2 URL
  }
  // Handle existing URLs or objects
};
```

---

## How It Works

### Upload Flow:

1. **User selects image** in ArticleForm → `ImageInput` stores file object
2. **User clicks Save** → Form submits data to dataProvider
3. **DataProvider detects** `rawFile` property in `hero_image_url` or `featured_image_url`
4. **Uploads file** to `/api/upload/article` endpoint
5. **Backend uploads** to Cloudflare R2 bucket (`articles/` folder)
6. **Returns R2 URL** → DataProvider cleans URL and sets it in article data
7. **Article saved** with R2 image URL in database

### URL Entry Flow:

1. **User enters URL** in TextInput → Stored as string
2. **User clicks Save** → Form submits data
3. **DataProvider checks** for `rawFile` (none) → uses string URL as-is
4. **Article saved** with provided URL

---

## File Structure in R2

```
R2 Bucket/
├── crew/              (crew member profile images)
├── mission/           (mission page images)
├── articles/          (article hero/featured images) ← NEW
└── uploads/           (generic uploads)
```

---

## API Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/upload/article` | POST | Upload article images to R2 | Admin only |
| `/api/upload/crew` | POST | Upload crew images to R2 | Admin only |
| `/api/upload/mission` | POST | Upload mission images to R2 | Admin only |
| `/api/upload` | POST | Generic uploads to R2 | Admin only |

---

## Usage in Admin Panel

### Creating/Editing Articles:

1. **Upload Image:**
   - Click "Hero Image" or "Featured Image" section
   - Select image file from computer
   - Image preview appears
   - Save article → Image automatically uploads to R2

2. **Enter URL:**
   - Type image URL in "Hero Image URL" or "Featured Image URL" text field
   - Save article → URL saved directly (no upload)

3. **Both Methods:**
   - Can upload file OR enter URL
   - If both are provided, uploaded file takes precedence

---

## Benefits

✅ **Consistent Storage:** All images (crew, mission, articles) use same R2 bucket  
✅ **Scalable:** R2 handles large files and high traffic  
✅ **CDN Integration:** R2 URLs can be served via Cloudflare CDN  
✅ **Cost Effective:** R2 pricing is competitive  
✅ **Reliable:** Cloudflare infrastructure  
✅ **Flexible:** Still supports direct URL entry for external images  

---

## Testing

### Verify Upload Works:

1. **Admin Panel:** Create/Edit article
2. **Upload Image:** Select image file for hero_image_url
3. **Save Article:** Check browser network tab for `/api/upload/article` request
4. **Verify Response:** Should return R2 URL (e.g., `https://pub-xxx.r2.dev/articles/...`)
5. **Check Database:** Article should have R2 URL in `hero_image_url` column
6. **View Article:** Image should display correctly on public site

### Verify URL Entry Works:

1. **Admin Panel:** Create/Edit article
2. **Enter URL:** Type image URL in TextInput field
3. **Save Article:** URL should be saved directly (no upload request)
4. **Check Database:** Article should have provided URL

---

## Configuration

### Required Environment Variables:

```bash
# Cloudflare R2 Configuration (already configured)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

These are already configured for crew/mission uploads, so article uploads will work automatically.

---

## Notes

- **File Size Limit:** 5MB per image (configured in `upload.js`)
- **Allowed Types:** JPEG, JPG, PNG, GIF, WEBP
- **Folder Structure:** All article images stored in `articles/` folder in R2
- **URL Cleaning:** DataProvider automatically cleans URLs to remove server IP addresses
- **Backward Compatible:** Existing articles with URL strings continue to work

---

## Migration

**No migration needed** - existing articles with URL strings will continue to work. New uploads will use R2 automatically.

---

## Related Files

- `api/routes/upload.js` - Upload endpoints
- `api/services/r2Storage.js` - R2 storage service
- `api/admin/src/components/ArticleForm.tsx` - Article form UI
- `api/admin/src/dataProvider.ts` - Data provider with upload logic
- `api/admin/src/resources/Crew.tsx` - Reference implementation (crew images)
