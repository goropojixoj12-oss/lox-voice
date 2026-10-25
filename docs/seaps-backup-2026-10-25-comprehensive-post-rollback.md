# SEAPS — комплексный бэкап (25 Oct 2026, после отката листингов)

| | |
|---|---|
| **Production** | https://www.vps1.store |
| **GitHub** | https://github.com/goropojixoj12-oss/lox-voice |
| **Commit** | `3da18fe0bf449432b02a3983be16480e21f3c3e3` |
| **Git tag (local)** | `backup/2026-10-25-comprehensive-post-rollback` |
| **GitHub restore branch** | `backup/2026-10-25-comprehensive-post-rollback` |
| **UTC** | 2026-10-25T22:50:33Z |
| **Kit stamp** | `20261025-225029` |

## Что внутри бэkaпа

| Файл | Назначение |
|------|------------|
| `seaps-backup-20261025-225029.tar.gz` | Код проекта без `.git`, без `node_modules` / `.next` |
| `seaps-backup-full-20261025-225029.tar.gz` | То же + полная история `.git` |
| `seaps-main-20261025-225029.bundle` | `git clone` одной ветки офлайн |
| `seaps-all-refs-20261025-225029.bundle` | Все refs (ветки/теги) офлайн |
| `seaps-inventory-20261025-225029.json` | Имена env, чеклист Vercel/GitHub (без секретов) |
| `seaps-backup-kit-20261025-225029.zip` | Всё выше в одном архиве (~203 MB) |

Локально: папка `backups/` в репозитории.

**Cursor agent store:**  
`/cursor/stores/bc-73660627-477d-47a4-92a5-8d15712a5dd8/media/backups/20261025-225029/`  
(тарballs + bundles + manifest; полный zip — в `backups/` в репо или скачайте части из store).

## Быстрое восстановление

```bash
tar -xzf seaps-backup-full-20261025-225029.tar.gz -C ~/Projects/seaps-restore
cd ~/Projects/seaps-restore
npm ci
npm run build
```

Или с GitHub:

```bash
git fetch github backup/2026-10-25-comprehensive-post-rollback
git checkout backup/2026-10-25-comprehensive-post-rollback
```

Локальный тег (если запушен): `git fetch github tag backup/2026-10-25-comprehensive-post-rollback`

## Что **не** в архиве (сохраните вручную)

1. **Vercel → Settings → Environment Variables (Production):** значения `AUTH_SECRET`, `SMTP_*`, `SITE_AGENT_*`, `CRON_SECRET`, Blob/KV tokens.  
   Документация: https://vercel.com/docs/projects/environment-variables  
2. **Vercel Storage:** данные Blob / Redis (листинги, inquiries в проде).  
3. **Пароли почты** — только в Vercel, не в git.

Подробный чеклист: [full-backup-playbook-ru.md](./full-backup-playbook-ru.md)

## Повторить бэкап

```bash
export SEAPS_BACKUP_STORE_DIR="/path/to/your/store/media/backups"  # опционально
bash ./scripts/create-site-backup.sh backup/YYYY-MM-DD-your-label
git push github backup/YYYY-MM-DD-your-label
```
