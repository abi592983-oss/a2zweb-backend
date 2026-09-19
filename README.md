# A2Z Web Backend

Google Apps Script backend for the A2Z Tec Solutions website ecosystem.

## Deployment target

- Apps Script project: **A2Z Web**
- Script ID: `1NpzDD-40LzdsX7ATucgYDenoLjhw7l8iXOaAHI_LRKzsHCb3F0_U7MPT`
- Apps Script source root: `src/`
- Time zone: `Asia/Colombo`

## Current migration baseline

The first migration preserves the existing production behavior from `a2zweb/backend/BookingBackend.gs`:

- Public website booking intake through Apps Script
- Programmatic Google Form response creation
- Website request UUID idempotency
- ERP pull queue
- ERP acknowledgement
- Health-check JSON archive to Google Drive

This repository is intended to become the source of truth for the Apps Script backend. Secrets remain in Apps Script Script Properties and must never be committed to GitHub.

## Script Properties currently expected

- `A2Z_FORM_ID`
- `A2Z_ERP_SYNC_SECRET`
- `A2Z_HEALTH_ARCHIVE_FOLDER_ID`

## Local development

Install clasp:

```bash
npm install -g @google/clasp
clasp login
clasp pull
clasp push
```

Do not run `clasp pull` over uncommitted work without reviewing the result first.

## Validation

```bash
npm run check
```

## Next architecture step

After migration is verified against the existing deployment, the backend can be split into modules and upgraded to support multiple forms, multiple ERP consumers, destination-scoped ACK state, and configuration-driven routing.


## Admin security and token UI

Admin access is deny-by-default. Set the Script Property `A2Z_ADMIN_EMAILS` to a comma-separated list of explicitly authorized Google account email addresses.

The admin UI is served with `?admin=1`, but authorization is enforced again inside every admin server function. Do not rely on the UI route itself for security.

For reliable Google identity, use a separate admin web-app deployment configured to run as **User accessing the web app** and require a signed-in Google user. Keep the public booking deployment separate so anonymous website submissions continue to work.

Token configuration is runtime state stored in Script Properties:
- `A2Z_TOKEN_PREFIX`
- `A2Z_TOKEN_START`
- `A2Z_TOKEN_END`
- `A2Z_TOKEN_PADDING`
- `A2Z_TOKEN_RESET`

Booking tokens are human-facing references only. The website request UUID and Google Form response ID remain the immutable internal identities.
