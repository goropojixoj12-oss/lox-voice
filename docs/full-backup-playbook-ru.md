# Полный бэкап SEAPS (код + GitHub + Vercel + инвентарь)

## 0. Windows — один ZIP + убрать дубли (ваш ПК)

**Единственная рабочая папка:** `C:\Users\Administrator\lox-voice`  
**Дубль для архивации/удаления:** `C:\Users\Administrator\Documents\Default Project\khmer_backup\lox-voice`  
**Мусор в профиле** (ломает Turbopack): `C:\Users\Administrator\package.json`, `yarn.lock`, `package-lock.json`, `pnpm-lock.yaml`

### Шаг A — только бэкап (без удалений)

```powershell
cd C:\Users\Administrator\lox-voice
git pull github main
powershell -ExecutionPolicy Bypass -File .\scripts\windows-full-backup-and-cleanup.ps1 -BackupOnly -IncludeDuplicateTree
```

**Ожидание:** файл  
`C:\Users\Administrator\SEAPS-Backups\SEAPS-FULL-BACKUP-YYYYMMDD-HHMMSS.zip`  
(внутри: git bundle, source tar, full tar с `.git`, `.env*` если есть, README).

### Шаг B — после проверки ZIP: переименовать дубль + убрать lock-мусор из `C:\Users\Administrator`

```powershell
cd C:\Users\Administrator\lox-voice
powershell -ExecutionPolicy Bypass -File .\scripts\windows-full-backup-and-cleanup.ps1 -DoCleanup -ConfirmCleanup
```

**Ожидание:** дубль переименован в `lox-voice-ARCHIVED-…`; в домашней папке lock-файлы → `*.bak-…`.

### Шаг C — GitHub / облако (уже работает prod)

- Сайт: https://www.seaps.asia  
- Репо: https://github.com/goropojixoj12-oss/lox-voice (`main`)  
- Опционально: **Code → Download ZIP** или тег `backup/*` на GitHub.

### Шаг D — Vercel (вручную, секреты)

См. раздел **2** ниже — значения env в менеджер паролей.

---

## 1. Код и Git (автоматически)

```bash
cd /path/to/lox-voice
./scripts/create-site-backup.sh backup/2026-10-25-full-site-agent-automation
```

**Ожидаемый результат:** папка `backups/` с архивами и `seaps-backup-kit-*.zip`.

На PC с доступом к GitHub:

```bash
./scripts/push-production.sh
git push github backup/2026-10-25-full-site-agent-automation
```

**GitHub restore branch (already created):** `backup/2026-10-25-full-site-agent-automation`

---

## 2. Vercel (вручную — секреты не в git)

1. [Vercel Dashboard](https://vercel.com/dashboard) → проект **lox-voice**.
2. **Settings → Environment Variables → Production** — скопируйте значения в менеджер паролей (`AUTH_SECRET`, `SITE_AGENT_*`, `CRON_SECRET`, Blob/KV).
3. **Storage** — имена Blob / Redis stores.
4. **Settings → Cron Jobs** — `/api/cron/site-agent`.
5. **Deployments** — последний Production **Ready**.

Документация: [Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

## 3. GitHub (вручную)

1. https://github.com/goropojixoj12-oss/lox-voice/tags — теги `backup/*`.
2. **Releases** — опционально приложить `seaps-backup-kit-*.zip`.
3. **Code → Download ZIP** — быстрый снимок `main`.

---

## 4. Cursor agent store

`/cursor/stores/bc-73660627-477d-47a4-92a5-8d15712a5dd8/media/backups/20261025-093252/`

Скачайте `.tar.gz` / `.bundle` через Files в Cursor.

---

## 5. После восстановления

```bash
npm ci && npm run build
./scripts/push-production.sh
```
