# Бэкап SEAPS: Postgres + Vercel Blob + секреты

**Не входит в scope проекта:** отдельные VPS-серверы, B2/khmer-collector, сторонние «базы фото». Медиа листингов и store — **Vercel Blob** (`lox-voice-blob`).

---

## 1. Postgres (Vercel Production)

```cmd
cd C:\Users\Administrator\lox-voice
vercel login
bash scripts/export-vercel-env-production.sh backups\export-drop\.env.vercel.production
bash scripts/export-postgres-vercel.sh backups\export-drop\.env.vercel.production backups\export-drop\postgres.dump.sql
```

Нужны: **`vercel env pull`** (полный `.env.vercel.production`) и **`pg_dump`**.

Документация: [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

---

## 2. Фото и файлы — Vercel Blob

После `vercel env pull` (в файле должен быть **`BLOB_READ_WRITE_TOKEN`**):

```cmd
node scripts/export-vercel-blob-download.mjs backups\export-drop\vercel-blob-files
```

Список без скачивания: `node scripts/export-vercel-blob-list.mjs backups\export-drop\blob-list.json`

Документация: [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)

---

## 3. Полные секреты Vercel

```cmd
vercel link --project lox-voice
vercel env pull backups\export-drop\.env.vercel.production --environment=production --yes
```

Проверьте непустые: `AUTH_SECRET`, `CRON_SECRET`, `SMTP_PASS`, `DATABASE_URL`, `BLOB_*`, `KV_*` / `UPSTASH_*`.

---

## 4. One-click kit

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-one-file-restore-kit.ps1
```

Перед сборкой положите в `backups\export-drop\`: `.env.vercel.production`, `postgres.dump.sql`, папку `vercel-blob-files\`.

См. [one-click-restore-ru.md](./one-click-restore-ru.md)
