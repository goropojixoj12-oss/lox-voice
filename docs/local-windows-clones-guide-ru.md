# Две локальные папки lox-voice (Windows) — что оставить

Документ для ситуации с **двумя копиями** одного репозитория на одном ПК.  
Production (Vercel) смотрит **только** на GitHub: [goropojixoj12-oss/lox-voice](https://github.com/goropojixoj12-oss/lox-voice), ветка `main`.

## Известные пути на вашей машине

| Метка | Полный путь |
|-------|-------------|
| **Clone A** | `C:\Users\Administrator\lox-voice` |
| **Clone B** | `C:\Users\Administrator\Documents\Default Project\khmer_backup\lox-voice` |

Других путей в переписке не фиксировали. Если появится третья копия — снова запустите скрипт сравнения (ниже).

---

## Что мы уже знаем без доступа к вашему диску

Облачный агент **не читает** ваш `C:\`. Выводы из фактов, которые вы уже присылали:

| Факт | Clone B (`khmer_backup`) | Clone A (`Administrator\lox-voice`) |
|------|---------------------------|-------------------------------------|
| `npm install` | ✅ 518 packages, up to date | Не присылали вывод |
| `validate-package-lock.mjs` | ❌ файла нет (ошибка MODULE_NOT_FOUND) | Не проверяли |
| Смысл имени папки | `khmer_backup` = резервная копия | Корень профиля = типичный **основной** клон |
| Риск битого lock с GitHub | Если не делали `del` + `npm install` после pull — lock может быть stub с remote | То же |

**Предварительная гипотеза (до автоматического отчёта на вашем ПК):**

- **Оставить для работы:** чаще **`C:\Users\Administrator\lox-voice`**, если там правильный `git remote` и **`npm ci` проходит**.
- **`khmer_backup`** — архив, **если** после сравнения у него ниже score (старый pull, нет guardrail-скриптов, меньший lock).

Окончательное решение — **только после** `compare-windows-clones.ps1` (см. ниже): там score по remote, размеру lock, `npm ci`.

---

## Автоматическое сравнение (обязательный шаг)

Из **любой** папки, где уже есть актуальный `git pull` (скрипт лежит в репо):

```powershell
cd "C:\Users\Administrator\lox-voice"
git pull origin main

powershell -ExecutionPolicy Bypass -File .\scripts\compare-windows-clones.ps1 `
  -PathA "C:\Users\Administrator\lox-voice" `
  -PathB "C:\Users\Administrator\Documents\Default Project\khmer_backup\lox-voice" `
  -OutFile ".\docs\local-clones-comparison-report.md"
```

Откройте **`docs\local-clones-comparison-report.md`** — там **Verdict**: какую папку Keep, какую Archive.

Критерии scoring (кратко):

1. **+40** — remote `goropojixoj12-oss/lox-voice`
2. **+35** — `package-lock.json` ≥ ~250 KB (полный lock)
3. **+30** — `npm ci` exit 0
4. **+5** — есть `scripts/validate-package-lock.mjs` (свежий `main`)
5. **−30** — lock ~173 B или `LOAD_FROM_DISK` / path-stub

---

## Заключение по процессу (не по байтам ваших папок)

### Что оставить

**Одну** папку с **максимальным score** в отчёте. Это единственная, из которой:

- `git pull` / `git push`
- `npm ci` / `npm run dev`
- коммит **полного** `package-lock.json` на GitHub

### Что сделать со второй

**Рекомендуется:** один ZIP-бэкап, затем автоматическая уборка — см. **[full-backup-playbook-ru.md](./full-backup-playbook-ru.md)** (раздел **0. Windows**):

```powershell
cd C:\Users\Administrator\lox-voice
powershell -ExecutionPolicy Bypass -File .\scripts\windows-full-backup-and-cleanup.ps1 -BackupOnly -IncludeDuplicateTree
# проверить ZIP в C:\Users\Administrator\SEAPS-Backups\
powershell -ExecutionPolicy Bypass -File .\scripts\windows-full-backup-and-cleanup.ps1 -DoCleanup -ConfirmCleanup
```

Вручную (если без скрипта): переименовать дубль, не удалять сразу:

```cmd
ren "C:\Users\Administrator\Documents\Default Project\khmer_backup\lox-voice" lox-voice-ARCHIVE-2026-10-27
```

### Что **не** смешивать

- Не копировать `node_modules` между папками.
- Не push из обеих по очереди.
- Не править `.env` в архивной копии.

---

## Починка Vercel (один раз, из winner-папки)

```cmd
cd /d ПУТЬ_К_WINNER
git pull origin main
del package-lock.json
npm install
npm ci
npm run build
git add package-lock.json
git commit -m "fix: restore package-lock.json via git (production)"
git push origin main
```

Ожидание: GitHub Actions **Validate package-lock** и Vercel Install зелёные.

Проверка локально: [http://127.0.0.1:43123/seaps-build-verify.json](http://127.0.0.1:43123/seaps-build-verify.json) → `buildAlignId`: `SEAPS-ALIGN-9a923d7` (если файл есть в tree).

---

## Git push (Google login → нужен PAT)

См. **[github-push-token-auth-ru.md](./github-push-token-auth-ru.md)** — не путать `origin.cursor.com` с `github.com/goropojixoj12-oss/lox-voice`.

## Связанные документы

- [full-backup-playbook-ru.md](./full-backup-playbook-ru.md) — бэкапы
- Отчёт инцидента lock/Vercel (agent store): `internal/vercel-lockfile-incident-report-2026-10-27.md`
- Cursor rule: `.cursor/rules/no-github-mcp-for-lockfile.mdc` — lock только через `git push`

---

## Ошибка `@tailwindcss/turbopack\dist\index.js` (локальный dev)

Сервер на **43123** стартует, но в браузере **Build Error** / `Cannot find module ...\dist\index.js` — почти всегда **битый `node_modules`** (прерванный `npm install`, `EPERM`, или dev-зависимости не поставились).

**Диагностика** (cmd, из `C:\Users\Administrator\lox-voice`):

```cmd
dir node_modules\@tailwindcss\turbopack\dist\index.js
npm config get omit
echo NODE_ENV=%NODE_ENV%
npm ls @tailwindcss/turbopack
```

Ожидание: файл **index.js** есть; `omit` пустой или `dev` не отключён; `npm ls` показывает `@tailwindcss/turbopack@4.3.3`.

**Починка** (dev-сервер **Ctrl+C**, при необходимости `taskkill /F /IM node.exe`):

```cmd
cd /d C:\Users\Administrator\lox-voice
npm config delete production
set NODE_ENV=
set NPM_CONFIG_OMIT=
rmdir /s /q node_modules
rmdir /s /q .next
npm cache clean --force
npm ci
node -e "require('@tailwindcss/turbopack'); console.log('turbopack OK')"
npm run dev
```

Если `dir ...\dist\index.js` всё ещё **File Not Found** after `npm ci`:

```cmd
npm install @tailwindcss/turbopack@4.3.3 tailwindcss@4.3.3 --save-dev --force
dir node_modules\@tailwindcss\turbopack\dist\index.js
```

Prod (**https://www.seaps.asia**) от этого не страдает — это только локальный Turbopack + Tailwind.

---

## Если нужно прислать агенту доказательство

Пришлите файл **`docs/local-clones-comparison-report.md`** после запуска скрипта — по нему можно зафиксировать финальное заключение без гадания.
