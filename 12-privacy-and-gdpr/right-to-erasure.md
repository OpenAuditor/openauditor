# Right to Erasure (GDPR Article 17)

Users can ask you to delete their data. You must comply within 30 days in most cases. This requires technical implementation, not just a policy.

---

## When Does the Right Apply?

Users can request erasure when:
- The data is no longer needed for the original purpose
- They withdraw consent (and consent was the lawful basis)
- They object to processing and you have no overriding legitimate interest
- The data was unlawfully processed

You can refuse when:
- Processing is necessary for legal obligations (e.g., keeping invoices for 7 years)
- Processing is necessary for legal claims
- Data is needed for public interest/scientific research

---

## What "Delete" Actually Means

You must delete personal data from:
- Your primary database
- Backups (within reasonable timeframes — typically next backup cycle)
- Caches and temporary storage
- Email lists and CRM
- Analytics platforms (where possible)
- Third-party services you've shared data with

You don't need to delete:
- Anonymised, aggregated data where the user can't be identified
- Data you're legally required to retain (invoices, audit logs for compliance)

---

## Implementation: Cascading Deletion (Supabase / PostgreSQL)

```sql
-- Set up cascading deletes in the database schema
-- When a user is deleted, their data is automatically deleted

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Other columns...
);

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  -- Other columns...
);

-- When auth.users record is deleted, all posts and comments auto-delete
```

---

## Implementation: Deletion Service (Node.js)

```javascript
// Deletion service — handles all related data
async function deleteUserData(userId: string, requestedBy: string): Promise<void> {
  // Log the erasure request for compliance
  await db.auditLogs.create({
    event: 'data_erasure_request',
    targetUserId: userId,
    requestedBy,
    timestamp: new Date(),
  });

  // Delete in dependency order (children first)
  await db.$transaction(async (tx) => {
    // 1. Delete user-generated content
    await tx.comments.deleteMany({ where: { userId } });
    await tx.posts.deleteMany({ where: { userId } });
    await tx.files.deleteMany({ where: { userId } });
    
    // 2. Delete profile data
    await tx.profiles.deleteMany({ where: { userId } });
    
    // 3. Delete sessions and tokens
    await tx.sessions.deleteMany({ where: { userId } });
    await tx.refreshTokens.deleteMany({ where: { userId } });
    
    // 4. Anonymise what you must retain (not delete)
    await tx.orders.updateMany({
      where: { userId },
      data: {
        userId: null,             // dissociate from user
        email: '[deleted]',       // replace PII
        name: '[deleted]',
        // Retain: amount, date, product — for accounting
      },
    });
    
    // 5. Delete the user account itself
    await tx.users.delete({ where: { id: userId } });
  });

  // 6. Remove from external services
  await emailProvider.unsubscribe(userId);
  await analyticsProvider.deleteUser(userId);
  
  // 7. Confirm deletion
  console.log({ event: 'data_erased', userId, timestamp: new Date() });
}
```

---

## Backups

You don't need to restore backups to delete a user. You do need a policy:

```
Data Erasure in Backups Policy:
- Deletion requests are processed immediately in production
- Production backups older than [X days] are automatically deleted
- If a backup must be restored, user deletion requests are re-applied before restoration
```

---

## Self-Service Deletion UI

```javascript
// Settings page — allow users to delete their own account
app.delete('/api/users/me', authenticate, async (req, res) => {
  const { confirmation } = req.body;
  
  if (confirmation !== 'delete my account') {
    return res.status(400).json({ error: 'Please confirm with the exact phrase.' });
  }
  
  await deleteUserData(req.user.id, 'self-requested');
  
  // Invalidate session
  res.clearCookie('session');
  res.json({ message: 'Your account and all associated data have been deleted.' });
});
```

---

## Checklist

- [ ] Deletion endpoint exists and removes all user data
- [ ] Cascade deletes configured in database schema
- [ ] Audit log of deletion requests maintained
- [ ] Third-party services receive deletion requests (email, analytics)
- [ ] Backups policy covers erasure requests
- [ ] Users can request deletion via UI or email
- [ ] Legal retention items (invoices etc.) are anonymised, not deleted
- [ ] Deletion confirmed to user within 30 days

---

## Learn More

- [GDPR for Founders](./uk-gdpr-for-founders.md)
- [Add Right to Erasure prompt](./prompts/add-right-to-erasure.md)
