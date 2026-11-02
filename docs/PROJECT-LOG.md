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

### Мерж cursor-зеркала и защита от устаревших ref

- **Что:** (1) `git merge origin/main -X ours` — в историю влиты 3 коммита Cursor Agent (`2f8a995`, `b9d3823`, `fd66225`), конфликт add/add по `scripts/pull-agent-main-and-push-github.sh` разрешён в нашу пользу; код не изменился — хеш дерева до и после мержа одинаков (`d5b8903`). (2) `git push origin main` → `fd66225..6f3256f`, зеркало догнало прод-историю. (3) правило 17 в `AGENTS.md`: утверждения про опережение/отставание только после свежего `scripts/git-state.sh`. (4) добавлен `scripts/git-state.sh` — делает `fetch --all --prune` и печатает ahead/behind + вердикт по каждому ремоуту.
- **Зачем:** я заявил «fast-forward на 635 коммитов» по устаревшему локальному ref и ошибся; правило + скрипт делают такую ошибку невозможной механически.
- **Файлы:** `AGENTS.md`, `scripts/git-state.sh` (новый), `docs/PROJECT-LOG.md`, история git (merge-коммит `6f3256f`).
- **Проверено:** `git rev-parse HEAD^{tree}` до/после мержа совпадает; `grep -c '<<<<<<<'` по конфликтному файлу = 0; пуш в origin прошёл без force; `bash scripts/git-state.sh` → `github +4 -0 fast-forward possible`, `origin +0 -0`.
- **Не закрыто:** мерж-коммит и новые файлы ещё не запушены в `github` (прод) — жду команду; код идентичен уже задеплоенному, так что ребилд ничего не изменит.

---

### Правило 18: безопасные массовые git-операции

- **Что:** в `AGENTS.md` добавлен пункт 18: `git rm`/`git checkout`/`git reset`/`git clean` по директории — только через предварительный `-n`/`--dry-run` со списком путей, затем проверка `git status --short` на незапланированные `D`; коммит со staged-удалениями «всего подряд» запрещён.
- **Зачем:** я выполнил `git rm --cached -r scripts` и снял с индекса 36 файлов (на диске целы, откатил через `git reset -- scripts`). Проверка `git rm --cached -r -n scripts` показала те же 36 путей — то есть правило ловит эту ошибку до её совершения.
- **Файлы:** `AGENTS.md`, `docs/PROJECT-LOG.md`. Код и конфиги не тронуты — правило чисто процессное, новых рисков не несёт.
- **Проверено:** `git rm -h` подтверждает наличие `-n, --dry-run`; dry-run выдал 36 путей; `git status --short | grep -c "^D"` = 0.

---

### Прод-пуш по умолчанию (отмена правила «ждать команду»)

- **Что:** (1) правило 11 в `AGENTS.md` переведено в «любой коммит `main` сразу пушим в `github`, Vercel подхватывает сам», build+скриншот-контроль перед пушем остаются обязательными; (2) раздел 7 переписан: перед пушем `bash scripts/git-state.sh`, пуш `git push github main`, зеркала не блокируют прод; (3) `scripts/push-production.sh`: пуш в `origin` больше не валит весь скрипт (`|| warning`) и больше не переставляет upstream ветки (убран `-u` — иначе `main` начал бы отслеживать `origin/main` вместо `github/main`); (4) память пользователя обновлена.
- **Зачем:** заказчик (2026-11-01, вечер): «любые изменения пуши по умолчанию... тут не хуй ждать команды».
- **Файлы:** `AGENTS.md`, `scripts/push-production.sh`, `docs/PROJECT-LOG.md`.
- **Проверено:** будет в этом же шаге — build, резервный тег, пуш в github и origin, свёрка живого сайта.
- **Найдено попутно:** автодеплой из GitHub работает — коммит `e2493d0` (22:40:44) породил production-деплой `4yrsa8izb` в 22:40:56, то есть через ~12 секунд после пуша; задержки деплоя не было, просто коммиты после него ещё не отправлялись.

---

### Правило 19: тестировать изменённую страницу до пуша (формулировка заказчика дословно)

- **Что:** (1) в `AGENTS.md` добавлено правило 19 — слова заказчика записаны дословно и не подлежат правке: перед пушем открыть локально именно ту страницу, где внесены изменения, внимательно изучить, и пушить только если результат нужен и ничего не сломано; (2) правило 11 уточнено: локальный контроль именно изменённого маршрута + главная, а не только скриншот главной; (3) дубликат правила в постоянной памяти (`feedback-test-before-push.md`).
- **Зачем:** заказчик указал, что я отправлял изменения, не посмотрев локально на изменённую страницу.
- **Файлы:** `AGENTS.md`, `docs/PROJECT-LOG.md`.
- **Проверено:** `npm run build` → `✓ Compiled successfully`, exit 0; перед пушем просмотрен локальный `/property/bkk1-riverside-apartment` (полная страница, `tmp/audit/local-detail-before-push.png`): фото листинга в тессеракте и на обложке реальные, мока нет. **Найдено попутно (прежние дефекты, не от этой правки):** блок «Similar listings» пустой; в форме плейхолерный телефон `+855 12 345 678`; в dev-оверлее 1 hydration-ошибка тессеракта; в футере пустой чёрный блок Google Maps; правый блок «HERE IS EXACTLY WHAT YOU ARE LOOKING FOR!» с обрезанной кнопкой «SCHEDULE V».
- **Пуш:** `e2493d0..0d7be24` в github (автодеплой `im92nv0ed` → `● Ready`) и `6f3256f..0d7be24` в cursor-зеркало; резервный тег `backup/2026-11-01-pre-push-by-default`.

---

### Fix: пустой блок «Similar listings» на странице листинга

- **Что:** (1) `getRelatedProperties()` в `src/data/properties.ts:795` получил третий параметр `source` (по умолчанию — прежняя статика, поведение вызывающих без параметра не меняется); (2) страница `/property/[slug]` теперь передаёт объединённый каталог `all` (статика + листинги из рантайм-хранилища, `src/app/property/[slug]/page.tsx:93`); (3) сам блок рендерится только при `related.length > 0` — пустой заголовок больше не появляется.
- **Зачем:** блок был пустой на проде, потому что поиск похожих предложений смотрел только в статический массив `properties`, а реальные опубликованные листинги (Vue Aston) лежат в рантайм-хранилище; опубликованных статических листингов ровно один — `bkk1-riverside-apartment`.
- **Файлы:** `src/data/properties.ts`, `src/app/property/[slug]/page.tsx`, `docs/PROJECT-LOG.md`.
- **Проверено:** `npx tsc --noEmit` exit 0; локально `/property/bkk1-riverside-apartment` — пустого заголовка больше нет (локательное хранилище Vue Aston не содержит, поэтому срабатывает фолбэк «нет похожих — не показываем блок»); полноценно фикс виден на проде, где два опубликованных листинга — проверено после деплоя ниже.
- **Механический проход по 25 публичным страницам (Playwright):** статус 200 везде, сломанных картинок нет, горизонтального переполнения нет, консоль чистая кроме одной hydration-ошибки на `/property/[slug]`; ложное срабатывание «undefined» — текст внутри служебного скрипта Next, не видимый контент. Реальные дефекты: пустой «Similar listings» (закрыт этим фиксом), обрезанная подпись кнопки `SCHEDULE V` (буквально в исходнике `src/components/forms/property-inquiry-language-actions.tsx:73`), плейсхолдерный телефон `+855 12 345 678` в `placeholder` четырёх форм, пустой блок карты в футере, мёртвые соцссылки `#` в `src/config/brand.ts`.

---

### Fix: подпись кнопки «SCHEDULE V» → «SCHEDULE VIEWING»

- **Что:** в блоке «HERE IS EXACTLY WHAT YOU ARE LOOKING FOR!» на странице листинга исправлена подпись кнопки, ведущей на `/contact`.
- **Зачем:** текст был укорочен в самом исходнике (`src/components/forms/property-inquiry-language-actions.tsx:73`), а не обрезан стилями — кнопка выглядела сломанной.
- **Файлы:** `src/components/forms/property-inquiry-language-actions.tsx`, `docs/PROJECT-LOG.md`.
- **Проверено:** локально на `/property/bkk1-riverside-apartment` через браузер — текст `SCHEDULE VIEWING`, `clipped: false` (scrollWidth ≤ clientWidth), контейнер `flex-wrap: wrap`, горизонтального переполнения страницы нет.

### Fix: hydration mismatch у 4D-тессеракта в галерее листинга

- **Что:** в `src/components/property/property-gallery-3d.tsx` добавлен `suppressHydrationWarning` на все узлы, которые до гидратации мутирует пред-запуск `paint()` — `<svg data-tesseract>`, слои `faces`/`edges`/`verts`, полигоны `data-fc`/`data-ft`/`data-fpb`, `<image data-fi>`, `<line data-e>`, `<circle data-v>`, и отдельно на обёртку `<g clipPath={uid-cN}>`.
- **Зачем:** тессеракт специально стартует до гидратации (иначе при троттлинге React он стоял на месте). React 19 применяет `suppressHydrationWarning` только к атрибутам конкретного узла и не распространяет его на детей, поэтому каждый мутируемый узел нужен был пометить сам. Отдельно мешал `appendChild(group)` в слое faces: он менял порядок детей, и `clipPath` на узлах-близнецах разъезжался.
- **Файлы:** `src/components/property/property-gallery-3d.tsx`, `docs/PROJECT-LOG.md`.
- **Проверено:** локально на `/property/bkk1-riverside-apartment` через браузер — консоль чистая (0 ошибок, раньше была 1), вращение подтверждено (`0.8939 → 1.0162`, `spinning: true`), 24 грани с фото, клик по грани открывает лайтбокс «BKK 1 apartment — photo 7 · 7/43».

### Fix: мёртвые иконки соцсетей в hero главной

- **Что:** `src/components/home/hero-social-links.tsx` больше не рендерит сети с `href === "#"` — отфильтрованы до вывода, при полном отсутствии настроенных каналов блок скрывается целиком.
- **Зачем:** из 8 иконок 7 вели в никуда (`#` — прыжок наверх), это противоречит правилу 13 о запрещении мок-ссылок. Реальный канал в `src/config/brand.ts` только Facebook; telegram/whatsapp/tiktok/linkedin/reddit/wechat/instagram остаются `#`.
- **Файлы:** `src/components/home/hero-social-links.tsx`, `docs/PROJECT-LOG.md`.
- **Проверено:** локально на `/` через браузер — в `ul[aria-label="SEAPS on social media"]` одна ссылка, `deadCount: 0`, Facebook открывается в новой вкладке; скриншот hero — ряд центрирован, вёрстка не поехала, консоль чистая. Отдельно проверено, что `/inquires` из `src/app/sitemap.ts` — живая страница (200), а не битая запись.

### Fix: плейсхолдеры форм — «Your Number» и почти невидимый серый

- **Что:** введён токен `--color-placeholder: rgba(232,238,247,0.26)` в `src/app/globals.css`, `Input`/`Textarea` в `src/components/ui/input.tsx` переведены на него; фейковый `+855 12 345 678` заменён на `Your Number` в `inquiry-form.tsx`, `page-feedback-form.tsx`, `contact-us-modal.tsx`, `careers-application-modal.tsx`, а `+855 …` в `agent-profile-panel.tsx` — тоже. Плюс убрана служебная фраза «No phone numbers are invented on this page» из публичной формы (`inquiry-form.tsx:120`).
- **Зачем:** в подсказках телефонов был выдуманный номер (правило 13), а сами подсказки были слишком заметными — заказчик просит «светло-серым, почти незаметным». Реального телефона компании в репозитории нет, поэтому текст-подсказка сделан нейтральным, а не выдуманным.
- **Файлы:** `src/app/globals.css`, `src/components/ui/input.tsx`, `src/components/forms/inquiry-form.tsx`, `src/components/forms/page-feedback-form.tsx`, `src/components/about/contact-us-modal.tsx`, `src/components/careers/careers-application-modal.tsx`, `src/components/dashboard/agent-profile-panel.tsx`, `docs/PROJECT-LOG.md`.
- **Проверено:** локально на `/contact` — `getComputedStyle(el,'::placeholder').color` = `rgba(232, 238, 247, 0.26)` у email и phone, `placeholder="Your Number"`, скриншот формы: подсказки читаются, но заметно тусклее текста пользователя. Иконки соцсетей заказчик велел не трогать.
- **Отдельно:** Turbopack отдавал старый `:root` после правки `globals.css` (утилита появилась, токен — нет). Лечится сносом `.next` и перезапуском `npm run dev`; в чистом билде токен присутствует.

---

## Известные расхождения (требуют решения)

- Fallback-домен в `src/config/brand.ts` (`VERCEL_ENV === "production"` → `https://www.vps1.store`) противоречит каноническому `https://www.seaps.asia`.
- Локальная разработка использует **прод-базу** (`DATABASE_URL` → `db.prisma.io`, стор Vercel Storage, не console.prisma.io). Изменения через localhost попадают на живой сайт. Решение о второй (dev) базе не принято.
