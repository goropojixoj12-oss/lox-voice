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

## Вывод про базу (2026-11-01, изучение кода)

- **Факт:** в `prisma/schema.prisma` 18 моделей, но `@prisma/client` не импортируется ни в одном файле `src/`, `DATABASE_URL` в `src/` не используется. Сайт показывает данные из статических файлов `src/data/*`.
- **Следствие:** локальный запуск `npm run dev` не требует базы. Создание dev-базы отложено — актуально только при миграции данных из статики в Postgres.
- Проверено: `grep` по `src/`, `package.json` scripts.

---

## 2026-11-01 (продолжение)

### Локальный запуск и фикс hydration mismatch

- **Что:** запущен `npm run dev` (порт 43123). В консоли браузера — `A tree hydrated but some attributes...` на `<html lang>`: `public/scripts/seaps-lang-boot.js` (beforeInteractive) ставит `lang` по языку браузера до гидратации, React ожидает `lang="en"`.
- **Фикс:** добавлен `suppressHydrationWarning` к `<html>` в `src/app/layout.tsx` — стандартное решение для lang/theme, выставляемых ранним скриптом.
- **Проверено:** Playwright → http://localhost:43123, консоль: 0 ошибок, 0 предупреждений.
- **Замечание:** dev-сервер остаётся запущенным в фоне сессии; при перезапуске — `npm run dev` из папки проекта.

---

## 2026-11-01 — комплексный аудит проекта

Проведён полный аудит (3 параллельных агента + собственные проверки + визуальный проход в браузере). Сводка в отчёте чата; ключевое:

- **tsc** — 0 ошибок. **eslint** — 20 ошибок (react-hooks в lib-файлах, prefer-const), 37 предупреждений.
- **Разрешения** 360/390/768/1280/1440/1920 × 6 страниц — горизонтального переполнения нет; ошибки первого прогона были лагами компиляции dev.
- **Критично:** plaintext-пароли демо-аккаунтов (в т.ч. админ `ceo@seaps.asia`) в `README.md` + `src/data/users.ts`; stored XSS через `dangerouslySetInnerHTML` описаний листингов + CSP с `'unsafe-inline' 'unsafe-eval'`.
- **Высокое:** публичный blob-прокси игнорирует `access`-уровни документов; рейт-лимит в памяти по подделываемому IP.
- **Видимое юзерам:** мок-видео (медуза/Big Buck Bunny с test-videos.co.uk) на карточке листинга `/buy/residential`; 7 мёртвых соцссылок `#`; только 1 листинг в продаже; `/inquires` в сайтмапе.
- **Мёртвый код:** prisma целиком (18 моделей, клиент не импортируется), 8 неиспользуемых компонентов, `src/data/market.ts`, Mapbox-заглушка.
- **Мелочи:** дубль редиректа в next.config, `test-videos.co.uk` в CSP, `/about` кнопка Contact Us ведёт на `/contact` а модалка мёртвая, dropdown-меню без aria-expanded.
- Скриншоты аудита: `tmp/audit/` (не коммитятся).

---

### Листинг p-001: реальные фото вместо мок-медиа

- **Что:** 43 фото кондоминиума (`C:\Users\Administrator\Downloads\estate_real\Condo\Condo`, 40 HEIC + 3 JPG) сконвертированы в JPEG 1600px max, q80 progressive, EXIF-повороты применены (`heic-convert` + `sharp`, тулзина в `tmp/heic-tool`, в деплой не идёт) и положены в `public/media/listings/bkk1-riverside/01.jpg`–`43.jpg` (12 МБ суммарно).
- **Зачем:** просьба заказчика — убрать мок-видео (медуза с test-videos.co.uk) из первого листинга.
- **Файлы:** `src/data/properties.ts` (листинг p-001 / `bkk1-riverside-apartment`, опознан по уникальному `updatedAt`): массив `images` → 43 новых записей (01 — `isCover: true`), `videos: []`, удалён `cardPreviewVideoUrl`, `hasVideoTour: false`. Новые файлы `public/media/listings/bkk1-riverside/*`.
- **Проверено:** `tsc --noEmit` exit 0; Playwright: карточка на `/buy/residential` показывает реальное фото без бейджа «Video tour» (`tmp/audit/buy-residential-after.png`); страница `/property/bkk1-riverside-apartment` отрисовывает 43 файла в галерее-тессеракте (`tmp/audit/property-detail.png`).
- **Замечание:** в консоли детальной страницы — hydration mismatch SVG-тессеракта (координаты вершин зависят от времени анимации), прежняя проблема компонента, на медиа не влияет.

---

### Новые правила: доведение прерванных задач до конца

- **Что:** в `AGENTS.md` раздел 0 добавлены пункты 9 и 10: (9) прерванную задачу обязан довести до конца — при возобновлении сначала восстановить состояние (журнал, git, память) и закончить её до новых задач, незакрытые задачи держать в конце журнала и в памяти; (10) задача закрыта только когда выполнены все шаги: код, проверка, запись в журнал, коммит.
- **Зачем:** требование заказчика — не терять прерванные задачи между чатами.
- **Файлы:** `AGENTS.md`. Создана память `project-current-state.md` (незакрытые задачи: 4 непушенных коммита, подтверждение автоперевода, выбор фазы аудита, решение про dev-базу).
- **Проверено:** файл сохранён, индекс памяти обновлён.

---

### Новые правила: контроль пуша, бэкап-теги, запрет моков

- **Что:** в `AGENTS.md` раздел 0 добавлены пункты 11–14: (11) перед прод-пушем — `npm run build` + скриншот-контроль главной; (12) резервный тег `backup/YYYY-MM-DD-<имя>` перед каждым прод-пушем; (13) запрет новых мок-данных без согласования; (14) агент сам и почаще предлагает новые правила развития.
- **Зачем:** просьба заказчика — защита прод-деплоя от сломанных сборок и откат в один шаг; чистота контента; развитие процесса.
- **Файлы:** `AGENTS.md`.
- **Проверено:** файл сохранён.

---

### Новые правила: удаление файлов и сверка живого сайта

- **Что:** в `AGENTS.md` раздел 0 добавлены пункты 15–16: (15) перед удалением файлов/папок — показывать заказчику список и ждать явного «да» (кроме временных файлов текущей задачи); (16) каждый прод-пуш сопровождается сверкой живого сайта по чек-листу раздела 8.
- **Зачем:** одобрены заказчиком 2026-11-01.
- **Файлы:** `AGENTS.md`.
- **Проверено:** файл сохранён.

---

### Прод-пуш 2026-11-01 + установка Origin CLI для cursor-зеркала

- **Что:** по новым правилам 11–12 перед пушем: `npm run build` (без ошибок) + скриншот главной (`tmp/audit/pre-push-home.png`, `( S E A P S )` на месте), поставлен резервный тег `backup/2026-11-01-pre-photo-and-rules` (указывает на прежний `github/main`), пуш в `github` выполнен (`c1cbdaa`), Vercel Production `● Ready`.
- **Что ещё:** установлен нативный Windows **Origin CLI** (`irm/curl …/origin/install.ps1`, без обхода политик) → `C:\Users\Administrator\AppData\Local\cursor\bin\origin.exe`, версия `2026.10.28-16-42-28-e1b8407`; `origin auth login` прошёл через браузер, аккаунт `goropojixoj12@gmail.com`; в global git config прописан credential helper для `origin.cursor.com`.
- **Зачем:** заказчик захотел дублировать историю в cursor-зеркало и авторизоваться подтверждением в браузере, а не логином/паролем.
- **Файлы:** `docs/PROJECT-LOG.md`, `AGENTS.md` (правила 15–16 ранее), глобальный `~/.gitconfig` (вне репозитория), `~/.local`/`AppData\Local\cursor\bin` (вне репозитория).
- **Проверено:** `origin auth status` → `Token: valid`; `git push github main` → `Everything up-to-date` (уже доставлено); живой сайт: curl нашёл `S E A P S` на главной, `/media/listings/bkk1-riverside/01.jpg` → HTTP 200 (344 КБ); браузером `https://www.seaps.asia/buy/residential` — карточка BKK 1 с реальным фото ванной, медузы нет (`tmp/audit/live-buy-residential.png`).
- **НЕ закрыто:** пуш в `origin` (cursor) отклонён — `origin/main` ушёл вперёд на 3 коммита Cursor Agent (`2f8a995` storeId-фикс, `b9d3823` правка ряда «recently added», `fd66225` скрипт мержа). Проверено содержимое: storeId-фикс и скрипт **уже есть** в нашей истории (`src/lib/store-persistence.ts:132`, `scripts/pull-agent-main-and-push-github.sh`), правка `page.tsx` относилась к старой структуре главной и нашим новым кодом вытеснена. Требуется решение заказчика: `git merge origin/main -X ours` (история зеркала сохранится, файлы останутся как у нас) или иной вариант. Force-push запрещён правилами.

---

## Известные расхождения (требуют решения)

- Fallback-домен в `src/config/brand.ts` (`VERCEL_ENV === "production"` → `https://www.vps1.store`) противоречит каноническому `https://www.seaps.asia`.
- Локальная разработка использует **прод-базу** (`DATABASE_URL` → `db.prisma.io`, стор Vercel Storage, не console.prisma.io). Изменения через localhost попадают на живой сайт. Решение о второй (dev) базе не принято.
