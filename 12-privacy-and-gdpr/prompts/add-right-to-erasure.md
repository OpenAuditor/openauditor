# Prompt: Implement Right to Erasure

## When to use this

Use this when building user account deletion, when preparing for GDPR compliance, or after receiving a user data deletion request you can't handle. GDPR requires deletion within 30 days.

## Works with

Cursor, Claude, GitHub Copilot, Windsurf, Cline, Aider

## Agent prompt

> Copy everything below this line and paste into your agent.

---

You are a backend engineer implementing GDPR right-to-erasure (Article 17). Build a complete data deletion system for this application.

**Step 1: Map all user data**
Find every table, collection, file store, or external service that holds user-specific data:
- Database tables with a user_id or created_by column
- File storage (uploads, avatars, documents)
- Caches (Redis keys scoped by user)
- Logs (if they contain user PII)
- Third-party services (email lists, analytics, error tracking, CRM)

List each location with: what data is stored and whether it must be deleted or anonymised.

**Step 2: Determine what to delete vs anonymise**

Delete completely:
- Account data, profiles, preferences
- User-generated content (posts, comments, files)
- Sessions, tokens, refresh tokens

Anonymise (replace PII, keep the record):
- Financial transactions (keep amount/date, remove name/email)
- Audit logs (keep event type, remove user identifier)
- Aggregate statistics (already anonymised)

**Step 3: Implement cascading deletion**
In the database, add ON DELETE CASCADE constraints where appropriate:
```sql
-- Example for Supabase/PostgreSQL
ALTER TABLE posts ADD CONSTRAINT posts_user_fk 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

Show the schema changes needed.

**Step 4: Build the deletion service**
Create a `deleteUserData(userId, requestedBy)` function that:
1. Deletes all user data in dependency order (children before parents)
2. Handles the anonymisation cases
3. Logs the deletion event for compliance
4. Calls third-party services to delete user data (email unsubscribe, analytics delete)
5. Deletes storage files (images, uploads)
6. Deletes the user account itself

Show working code for this function.

**Step 5: Create the API endpoint**
```javascript
DELETE /api/users/me  // self-service deletion
DELETE /api/admin/users/:id  // admin-initiated deletion (with audit)
```

Require explicit confirmation (e.g., type "delete my account").

**Step 6: Handle third-party services**
Identify and handle deletion in:
- Email providers (unsubscribe + delete contact)
- Analytics platforms (delete user ID)
- Error tracking (delete user data)
- Any other service with user PII

**Step 7: Backup policy**
Define and document how deletion requests are handled for existing backups.

Show complete working implementation with tests.

---

## What to expect

A complete data deletion implementation including: database cascade configuration, a deletion service function, API endpoints for self-service and admin deletion, third-party service deletion calls, and a compliance audit log. Tests verifying all user data is removed.

## Learn more

[Right to Erasure](../right-to-erasure.md)
