# SEAPS — полный бэкап (26 Oct 2026)

| | |
|---|---|
| **Production** | https://www.vps1.store |
| **GitHub** | https://github.com/goropojixoj12-oss/lox-voice |
| **Commit** | `19a817374352c3990c2b84415b6b8f0f0f3c6adb` |
| **Git tag (локально)** | `backup/2026-10-26-comprehensive` |
| **GitHub restore branch** | `backup/2026-10-26-comprehensive` |
| **UTC** | 2026-10-26T09:12:17Z |
| **Kit stamp** | `20261026-091213` |

## Файлы kit

| Файл | Назначение |
|------|------------|
| `seaps-backup-20261026-091213.tar.gz` | Код без `.git` / `node_modules` / `.next` |
| `seaps-backup-full-20261026-091213.tar.gz` | Код + история `.git` |
| `seaps-main-20261026-091213.bundle` | Офлайн `git clone` ветки `main` |
| `seaps-all-refs-20261026-091213.bundle` | Все refs |
| `seaps-inventory-20261026-091213.json` | Env-имена и чеклист (без секретов) |
| `seaps-backup-kit-20261026-091213.zip` | Всё в одном (~204 MB) |

Локально в агенте: `/workspace/backups/`.  
Cursor store: `media/backups/20261026-091213/` (без рабочего zip — лимит ~200 MB).

## Восстановление

```bash
unzip seaps-backup-kit-20261026-091213.zip -d ~/seaps-kit
tar -xzf seaps-backup-full-20261026-091213.tar.gz -C ~/Projects/seaps-restore
cd ~/Projects/seaps-restore && npm ci && npm run build
```

С GitHub:

```bash
git fetch github backup/2026-10-26-comprehensive
git checkout backup/2026-10-26-comprehensive
```

Тег на GitHub (с вашей машины): `git push github backup/2026-10-26-comprehensive`

## Вне архива

Vercel Production env (значения), Blob/KV — см. [full-backup-playbook-ru.md](./full-backup-playbook-ru.md).
