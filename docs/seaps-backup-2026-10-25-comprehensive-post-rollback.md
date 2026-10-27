# SEAPS — комплексный бэкап (25 Oct 2026)

| | |
|---|---|
| **Production** | https://www.vps1.store |
| **GitHub** | https://github.com/goropojixoj12-oss/lox-voice |
| **Commit (актуальный kit)** | `777ab04d3be29ce2429565b191848e6d69736d63` |
| **Git tag (локально)** | `backup/2026-10-25-comprehensive` @ `777ab04` |
| **GitHub restore branch** | `backup/2026-10-25-comprehensive` |
| **UTC (финальный kit)** | 2026-10-25T22:51:34Z |
| **Kit stamp (используйте этот)** | `20261025-225130` |

Ранний прогон (до синка с `main`): stamp `20261025-225029` @ `3da18fe` — заменён на **`225130`**.

## Что внутри бэкапа

| Файл | Назначение |
|------|------------|
| `seaps-backup-20261025-225130.tar.gz` | Код проекта без `.git`, без `node_modules` / `.next` |
| `seaps-backup-full-20261025-225130.tar.gz` | То же + полная история `.git` |
| `seaps-main-20261025-225130.bundle` | `git clone` одной ветки офлайн |
| `seaps-all-refs-20261025-225130.bundle` | Все refs (ветки/теги) офлайн |
| `seaps-inventory-20261025-225130.json` | Имена env, чеклист Vercel/GitHub (без секретов) |
| `seaps-backup-kit-20261025-225130.zip` | Всё выше в одном архиве (~204 MB) |

**Где лежит kit:**

- В этом окружении: `/workspace/backups/` (полный zip ~204 MB).
- **Cursor agent store:** `.../media/backups/20261025-225130/` — tarballs + bundles + manifest; **zip в store не копируется** (лимит ~200 MB), берите zip из `backups/` или соберите из частей в store.

## Быстрое восстановление

```bash
unzip seaps-backup-kit-20261025-225130.zip -d ~/seaps-kit
tar -xzf seaps-backup-full-20261025-225130.tar.gz -C ~/Projects/seaps-restore
cd ~/Projects/seaps-restore
npm ci
npm run build
```

Или с GitHub (код без бинарного kit):

```bash
git fetch github backup/2026-10-25-comprehensive
git checkout backup/2026-10-25-comprehensive
```

Локальный тег после push с вашей машины:  
`git push github backup/2026-10-25-comprehensive`

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
git push github refs/tags/backup/YYYY-MM-DD-your-label
```
