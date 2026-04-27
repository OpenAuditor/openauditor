# File Upload Security

File uploads are one of the most exploited features in web applications. Attackers use them to upload web shells, bypass content filters, or exhaust your storage.

---

## The Risks

1. **Malicious files:** Attacker uploads a PHP shell and executes it
2. **Path traversal:** Filename like `../../config/database.yml` overwrites config files
3. **MIME type spoofing:** Rename `shell.php` to `image.jpg` to bypass type checks
4. **Large file DoS:** Upload a 10GB file to exhaust disk space
5. **Malware distribution:** Use your storage to host malware for others

---

## Validation Checklist

### 1. Validate File Type (Server-Side)

Don't trust the `Content-Type` header or file extension — they can be spoofed. Check the actual file magic bytes.

```javascript
import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

async function validateFile(file: Buffer, originalName: string): Promise<void> {
  // Check actual file content, not the claimed type
  const detected = await fileTypeFromBuffer(file);
  
  if (!detected || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
    throw new Error(`Invalid file type: ${detected?.mime ?? 'unknown'}`);
  }
}
```

```python
import magic  # pip install python-magic

ALLOWED_TYPES = {'image/jpeg', 'image/png', 'image/webp'}

def validate_file(file_bytes: bytes) -> None:
    mime = magic.from_buffer(file_bytes, mime=True)
    if mime not in ALLOWED_TYPES:
        raise ValueError(f"Invalid file type: {mime}")
```

### 2. Validate File Size

```javascript
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

if (file.size > MAX_SIZE) {
  throw new Error('File exceeds maximum size of 10MB');
}
```

### 3. Sanitise File Names

```javascript
import { sanitize } from 'sanitize-filename';
import { extname } from 'path';
import { randomUUID } from 'crypto';

function safeFileName(originalName: string): string {
  const ext = extname(originalName).toLowerCase();
  // Generate a random name — don't trust the original
  return `${randomUUID()}${ext}`;
}
```

Never use the original filename for storage. Generate a random UUID-based name.

### 4. Enforce Quotas Per User

```javascript
const MAX_STORAGE_PER_USER = 100 * 1024 * 1024; // 100MB

const { total } = await db.files.aggregate({
  where: { userId },
  _sum: { size: true },
});

if ((total._sum.size || 0) + newFileSize > MAX_STORAGE_PER_USER) {
  throw new Error('Storage quota exceeded');
}
```

---

## Storage: Never Serve Uploads Directly

Don't store uploads in your web server's document root. Use cloud storage (S3, Supabase Storage) or a path outside the web root.

### Supabase Storage (Recommended for Supabase Apps)

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

async function uploadFile(file: File, userId: string) {
  const fileBytes = await file.arrayBuffer();
  const buffer = Buffer.from(fileBytes);
  
  // Validate before upload
  await validateFile(buffer, file.name);
  
  const fileName = safeFileName(file.name);
  const path = `${userId}/${fileName}`; // user-scoped path

  const { data, error } = await supabase.storage
    .from('user-uploads')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false, // don't overwrite existing files
    });

  if (error) throw error;
  return data.path;
}
```

### Supabase Storage Policies

```sql
-- Only allow users to upload to their own folder
CREATE POLICY "Users upload own files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- Users can only read their own files
CREATE POLICY "Users read own files"
  ON storage.objects
  FOR SELECT
  USING (auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Serving Files Safely

```javascript
// WRONG — serving files from a path derived from user input
app.get('/uploads/:filename', (req, res) => {
  res.sendFile(path.join(uploadsDir, req.params.filename)); // path traversal risk!
});

// RIGHT — look up file by UUID in database, then serve
app.get('/files/:id', authenticate, async (req, res) => {
  const file = await db.files.findOne({ 
    where: { id: req.params.id, userId: req.user.id } // auth check!
  });
  
  if (!file) return res.status(404).end();
  
  res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
  res.setHeader('Content-Type', file.mimeType);
  
  // Stream from S3/storage, not from filesystem path
  const stream = storage.getStream(file.storagePath);
  stream.pipe(res);
});
```

Set `Content-Disposition: attachment` to force downloads, preventing the browser from executing uploaded HTML or SVG files.

---

## Images: Re-encode to Strip Metadata

```javascript
import sharp from 'sharp'; // npm install sharp

async function processImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 }) // re-encode — strips EXIF, malicious data
    .toBuffer();
}
```

Re-encoding images with Sharp strips EXIF metadata (which can contain GPS coordinates) and removes any embedded scripts or malicious payloads.

---

## Why This Matters

The 2020 Pantheon CMS vulnerability allowed arbitrary file uploads. Attackers uploaded PHP web shells to gain remote code execution. Full server access in minutes.

In 2019, a popular WordPress plugin allowed unauthenticated file uploads. Over 200,000 sites were compromised within days.

---

## Checklist

- [ ] File type validated by magic bytes, not extension or Content-Type header
- [ ] File size limit enforced
- [ ] File names replaced with UUID-based names
- [ ] Files stored in cloud storage, not web server document root
- [ ] Files served via lookup by ID, not by path
- [ ] `Content-Disposition: attachment` on file responses
- [ ] Per-user storage quota enforced
- [ ] Images re-encoded to strip metadata and embedded code
- [ ] Upload endpoint rate-limited

---

## Learn More

- [Secure File Uploads prompt](./prompts/secure-file-uploads.md)
- [OWASP A05: Security Misconfiguration](../02-owasp/web-top10/A05-security-misconfiguration.md)
