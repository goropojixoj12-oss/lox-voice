# Один файл → новая машина без ручной настройки

Scope бэкапа **только проект SEAPS на Vercel**: код, **Postgres**, **Vercel Blob**, Production env. Отдельные VPS / сторонние photo DB **не** входят.

---

## Собрать kit (рабочий ПК)

```powershell
cd C:\Users\Administrator\lox-voice
git pull github main
vercel login

vercel env pull backups\export-drop\.env.vercel.production --environment=production --yes
bash scripts/export-postgres-vercel.sh backups\export-drop\.env.vercel.production backups\export-drop\postgres.dump.sql
node scripts/export-vercel-blob-download.mjs backups\export-drop\vercel-blob-files

powershell -ExecutionPolicy Bypass -File .\scripts\build-one-file-restore-kit.ps1
```

**Результат:** `C:\Users\Administrator\SEAPS-Backups\SEAPS-ONE-CLICK-RESTORE-YYYYMMDD-HHMMSS.tar.gz`

Внутри:

- проект (**node_modules**, **.git**);
- `.env.vercel.production` (полные секреты);
- `postgres.dump.sql`;
- **`payload/blob/`** — файлы из Vercel Blob;
- **`AUTO-INSTALL.bat`**.

Подробнее: [backup-postgres-and-media-ru.md](./backup-postgres-and-media-ru.md)

---

## Новая машина

```cmd
tar -xzf SEAPS-ONE-CLICK-RESTORE-....tar.gz
cd SEAPS-ONE-CLICK-RESTORE-....
AUTO-INSTALL.bat
```

Проект: `%USERPROFILE%\lox-voice`, запуск: **`START-DEV.bat`**.

---

## Prod

**https://www.seaps.asia** — kit не перезаписывает Vercel Production, только восстанавливает локальную копию.
