# PROJECT-LOG — журнал изменений SEAPS / lox-voice

Каждое изменение файлов проекта фиксируется здесь. Формат: дата (абсолютная) → что сделано → зачем → файлы → как проверено.

---

## 2026-11-01

### Переключение upstream на github/main

- **Что:** `git branch --set-upstream-to=github/main main`.
- **Зачем:** деплой Vercel идёт только из GitHub `main`; прежний upstream `origin/main` — старое зеркало Cursor (`origin.cursor.com`).
- **Файлы:** `.git/config` (не версионируется).
- **Проверено:** `git branch -vv` → `main [github/main]` без ahead/behind.

### Восстановление локальных env-переменных

- **Что:** `vercel link` для проекта lox-voice, затем `vercel env pull .env.local --environment=production`; созданы `.env.local` и `.env.production.local`.
- **Зачем:** локальный запуск требует `DATABASE_URL` и `AUTH_SECRET`.
- **Файлы:** `.env.local`, `.env.production.local` (оба в `.gitignore`, строка `.env*`).
- **Результат:** 7 переменных помечены Vercel как Sensitive и выгружаются только заглушкой `[SENSITIVE]` (`AGGREGATION_SYNC_SECRET`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`, `SITE_AGENT_SECRET`, `SITE_AGENT_WEBHOOK_BEARER`, `SMTP_PASS`). Sensitive-значения нельзя прочитать ни через dashboard, ни через CLI/API.
- **Решение:** локально сгенерирован новый `AUTH_SECRET` (он подписывает cookie сессии, совпадение с прод-значением не требуется). Остальные 6 переменных локалке не нужны.
- **Проверено:** `grep -c '^AUTH_SECRET=.\{40,\}'` → по 1 в обоих файлах.

### Перенос правил в AGENTS.md

- **Что:** все правила из `.cursor/rules/*.mdc` перенесены в `AGENTS.md`; добавлены блоки «Роль и режим работы», «Знание проекта до действий», «Журнал проекта», «Общение».
- **Зачем:** Qoder читает автоматически только `AGENTS.md`; `.cursor/rules` применяются лишь в Cursor.
- **Файлы:** `AGENTS.md`.
- **Проверено:** файл записан, блок `nextjs-agent-rules` сохранён (его восстанавливает `next dev`).

### Удаление мусорного файла правил

- **Что:** удалён `.cursor/rules/Untitled` (14 байт, содержимое — имя переменной `OLLAMA_API_KEY` без значения).
- **Зачем:** случайный файл в папке правил.
- **Проверено:** файл отсутствует в `.cursor/rules/`.

### Создан журнал проекта

- **Что:** создан `docs/PROJECT-LOG.md`, с этого момента каждое изменение файлов проекта фиксируется здесь.
- **Зачем:** требование заказчика — детальная история всех правок в одном месте.
- **Файлы:** `docs/PROJECT-LOG.md`.

### NEXT_PUBLIC_SITE_URL → www.seaps.asia

- **Что:** Vercel Production `NEXT_PUBLIC_SITE_URL` изменён с `https://www.vps1.store` на `https://www.seaps.asia` (`vercel env update ... --environment production`). Локальные `.env.local` и `.env.production.local` обновлены тем же значением.
- **Зачем:** правило `admin-platform-safety` — публичный канонический домен `https://www.seaps.asia`.
- **Файлы:** env Vercel (Production), `.env.local`, `.env.production.local`.
- **Проверено:** `vercel env update` вернул `✓ Updated`; оба локальных файла содержат новое значение.
- **Осталось:** `NEXT_PUBLIC_*` вшивается на этапе сборки, поэтому живой сайт получит новое значение только после нового деплоя. Fallback в `src/config/brand.ts` всё ещё `https://www.vps1.store` — не менялся.

### Главная: аббревиатура (SEAPS) разбита пробелами

- **Что:** в hero-заголовке главной `South East Asia Property Services (SEAPS)` → `( S E A P S )`.
- **Зачем:** просьба заказчика — каждая буква через пробел.
- **Файлы:** `src/app/page.tsx`.
- **Проверено:** `npm run build` прошёл без ошибок.
- **Пуш:** первый `git push github main` отклонён — на github было 27 коммитов из другого клона (база `e4260d9`). Сделан `git rebase github/main`, наши 2 коммита перенесены сверху, конфликтов нет (удалённый клон не трогал `page.tsx`, `AGENTS.md`, `docs/PROJECT-LOG.md`). Зависимости изменились → `npm ci` + повторный `npm run build` (успешно). Пуш: `44e77e9..db2dd3b main -> main`.

---

## Известные расхождения (требуют решения)

- Fallback-домен в `src/config/brand.ts` (`VERCEL_ENV === "production"` → `https://www.vps1.store`) противоречит каноническому `https://www.seaps.asia`.
- Локальная разработка использует **прод-базу** (`DATABASE_URL` → `db.prisma.io`, стор Vercel Storage, не console.prisma.io). Изменения через localhost попадают на живой сайт. Решение о второй (dev) базе не принято.
