# Prompt: Secure File Uploads

## When to use this

Use this whenever you're implementing file uploads, or auditing an existing upload feature. File uploads are consistently exploited and require multiple layered defences.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a security engineer. Audit and secure the file upload functionality in this application.

**Step 1: Find all upload endpoints**
Locate every place in the app that accepts file uploads:
- API routes that accept multipart/form-data
- Storage service integrations (Supabase Storage, S3, Cloudinary)
- Avatar, document, or image upload features

**Step 2: Audit current validation**
For each upload endpoint, check:
- Is file type validated? (By magic bytes/file-type library, not just extension or Content-Type header)
- Is file size limited?
- Is the filename sanitised? (Or replaced entirely with a random UUID)
- Is there a per-user storage quota?
- Is the upload endpoint rate-limited?
- Where are files stored? (Web server document root is dangerous)

**Step 3: Implement file type validation by magic bytes**

Install: `npm install file-type` (Node.js)

```typescript
import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

async function validateFile(buffer: Buffer): Promise<string> {
  if (buffer.length > MAX_SIZE) throw new Error('File too large');
  const type = await fileTypeFromBuffer(buffer);
  if (!type || !ALLOWED_TYPES.includes(type.mime)) {
    throw new Error(`Invalid file type: ${type?.mime ?? 'unknown'}`);
  }
  return type.mime;
}
```

**Step 4: Sanitise filenames**
Replace user-supplied filenames with UUID-based names:
```typescript
import { randomUUID } from 'crypto';
import { extname } from 'path';

function safeFilename(originalName: string, mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp'
  };
  return randomUUID() + (extensions[mimeType] ?? '');
}
```

**Step 5: Ensure files are NOT in web root**
Files must be stored in:
- Cloud storage (Supabase Storage, S3) ✓
- A directory outside the web server's document root ✓
- NOT in `public/uploads/` or similar directories served directly ✗

**Step 6: Set correct response headers when serving files**
```typescript
res.setHeader('Content-Disposition', `attachment; filename="${safeDisplayName}"`);
res.setHeader('Content-Type', validatedMimeType);
// Never set: Content-Disposition: inline for user-uploaded files
```

**Step 7: For images — re-encode with Sharp**
```typescript
import sharp from 'sharp'; // npm install sharp
const processedImage = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();
// This strips EXIF data, embedded scripts, and metadata
```

**Step 8: Implement per-user quota**
Check total storage used before accepting new upload. Return 429 or custom error if quota exceeded.

Show complete working implementation for the upload handler with all security measures applied.

---

## What to expect

A fully secured file upload implementation with: magic byte validation, size limits, UUID filenames, correct storage location, Content-Disposition headers, image re-encoding, and per-user quotas. Any existing vulnerabilities will be identified and fixed.

## Learn more

[File Upload Security](../file-upload-security.md)
