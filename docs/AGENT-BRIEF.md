# AGENT-BRIEF — карта проекта для быстрого старта агента

Компактная справка: что где лежит, как проверить правку одной командой, на каких
ловушках агенты теряют время. Правила процесса — в `AGENTS.md`, здесь только факты.
Всё ниже сверено с репозиторием 2026-11-04.

## 1. Стеки и адреса

- Next.js **16.4.3** (App Router, Turbopack), React 19.3, TypeScript, Tailwind 4, Prisma 7.
- Прод: **https://www.seaps.asia**, проект Vercel `estate11/lox-voice`, собираётся из
  `github` = `goropojixoj12-oss/lox-voice`, ветка `main`.
- Локально: dev-сервер **порт 43123** (`npm run dev`), прод-сборка тем же `next start`.
- Данные: Prisma/Postgres (`DATABASE_URL`) + **Vercel Blob** (рантайм-карточки, медиа,
  профили, очереди) + Vercel KV/Upstash (кэш). Ключи — в `.env.local`, `.env.test`.

## 2. Одна команда вместо двадцати

```bash
npm run gate                  # next build → smoke → tmp/gate-pass.json (ничего не пушит)
npm run gate -- --fast        # только smoke, build пропущен
npm run gate -- --lint        # + eslint
npm run gate -- --json        # stdout = один JSON-объект, прогресс в stderr
bash scripts/ship.sh <имя>    # backup-тег → push github → push origin → ждёт READY → prod-smoke
```

`ship.sh` отказывается пушить, если: (а) нет `tmp/gate-pass.json` на текущий HEAD или он
старше 60 минут; (б) есть незакоммиченные отслеживаемые файлы; (в) локальная `main`
отстаёт от `github/main`. Порядок, который он принимает: **визуальный контроль §19 →
коммит → `npm run gate` → `npm run ship`**. Визуальный контроль и сверку §8 на трёх
разрешениях (§16) скрипт не заменяет.

Полезно знать: `gate` поднимает собственный прод-сервер на 43198 с `BLOB_DISABLED=1`
только если на 43123 никто не отвечает — живой dev-сервер он не трогает.

## 3. Smoke

- `npm run smoke` — GET-проверки контракта (сейчас 39–40, список через `--list`),
  параллельно (6 в полёте), ~5с локально и ~3с против прода. Флаги: `--base=`, `--only=`,
  `--concurrency=`, `--timeout=`, `--json`, `--list`, `--no-session-cache`.
- Сессии agent/admin кэшируются в `tmp/smoke-sessions.json` (в `tmp/`, не коммитится) и
  перепроверяются одним GET — повторные прогоны не тратят логины.
- **Ловушка:** `/api/auth/login` ограничена **5 входами в минуту на IP** (`src/lib/rate-limit.ts`).
  До кэша три подряд прогона давали 429 и пачку «skipped: no session» вместо честного
  результата. Если видишь 429 — скрипт сам ждёт по `Retry-After`, не удваивай прогоны.
- Новый чек добавляется в массив `CHECKS` в `scripts/smoke-site.mjs` тем же коммитом,
  что и фича/регрессия (правило 20).

## 4. Где что лежит

```
src/app/                    72 страницы, 41 api-роута
  page.tsx                  главная (герой, бренд — см. §8 AGENTS.md)
  (публичное)               /about /contact /search /map /projects /property-guide
                            /buy/* /rent/* /land /commercial /short-stay /insights/*
                            /guides/* /locations/* /property/[slug] /usefullinks
  auth/                     /auth/login /auth/register
  dashboard/agent/…         кабинет агента (overview, listings, list-property/[[...step]],
                            inquiries, favorites, saved-searches, stats, profile)
  dashboard/admin/…         кабинет админа (+ site-changes, staff, users, operations)
  api/                      auth, listings, properties, dashboard, admin, cron, aggregate
src/components/             layout/ (site-header), dashboard/, forms/, ui/
src/lib/                    auth.ts, listing-access.ts (isPublicListing), store-*.ts,
                            listing-media-*.ts, admin-listing-patch.ts, rate-limit.ts
src/data/properties.ts      статический каталог (git)
public/                     фото бренда/демо (git)
scripts/                    gate.mjs, ship.sh, wait-vercel.mjs, smoke-site.mjs,
                            store-audit.mjs, git-state.sh, push-production.sh,
                            create-absolute-backup.sh, postgres-dump.sh, export-vercel-blob-*.mjs
docs/PROJECT-LOG.md         журнал — запись обязательна в том же ответе
tmp/                        рабочий мусор, в .gitignore (прогоночки, кэш сессий)
backups/                    снимки стора, в .gitignore
```

## 5. Два контура, их нельзя путать

- **Git** — код + `src/data/properties.ts` + `public/`. Полная синхронность
  `github` ↔ `origin` (cursor-зеркало) ↔ локальная машина.
- **Vercel Blob** — рантайм-данные. Из локалки **только чтение**: токена нет, правка
  возможна лишь через прод-админку. Локальные прогоны идут через файловое хранилище
  (`BLOB_DISABLED=1`, `.data/`), это отдельная ветка кода в `src/lib/store-persistence.ts`.

## 6. Флаги и пороги

- `BLOB_DISABLED=1` — файловое хранилище вместо Blob (локальные прогоны, gate).
- `SEAPS_ENABLE_ADMIN_AGGREGATION_CONTROL` — аггрегация из админки, по умолчанию выкл.
- `AUTH_SECRET` — подписывает `en_session`; без него вход падает.
- `NEXT_PUBLIC_SITE_URL` = `https://www.seaps.asia` (не `vps1.store`).
- Cron: `/api/cron/site-agent` 09:00 (`vercel.json`).
- Кэш заголовки: `next.config.ts` (`/media|/videos|/brand|/fonts` — immutable год);
  отдача загруженных медиа — `max-age=0, s-maxage=60` (`src/app/api/listings/media/**`),
  снятый кадр уходит с edge за минуту.

## 7. Ловушки, на которых теряют время

1. `--only vue` и `--base https://…` теперь работают в обеих формах (`--flag=value` и
   `--flag value`); раньше вариант через пробел молча игнорировался, и агент получал все
   проверки вместо одной нужной.
2. `next dev` перезаписывает блок `<!-- BEGIN:nextjs-agent-rules -->` в `AGENTS.md` —
   не откатывай его, коммить как есть.
3. Документация Next в репозитории: `node_modules/next/dist/docs/` — это NOT тот Next,
   что в знаниях модели, сначала читай её.
4. `package-lock.json` и файлы > 50 KB через GitHub MCP не писать (§6 правил).
5. Утверждения про ремоуты — только после `bash scripts/git-state.sh` (он делает fetch).
6. Строчка `LF will be replaced by CRLF` в `git diff` — норма, не «испорченный файл».
7. Перед правкой файла посмотри `git status --short`: если файл уже изменён не тобой,
   в нём чужая незакоммиченная работа — не смешивай, спроси заказчика (правило 22).
8. Параллельная работа здесь реальна: второй агент + cron сайта (`/api/cron/site-agent`).
   `git commit --amend` и `git reset --hard` — только когда `git rev-parse HEAD` прямо
   перед командой это **твой** коммит; чужой коммит не переписывай, добавляй свой новый
   (правило 23). После любой git-команды смотри `git log --oneline -3`.
9. Промо-баны и снятые с прода блоки проверяются чек-листом §8 +(smoke exclude), чтобы
   не вернуться.
