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
