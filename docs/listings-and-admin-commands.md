# Листинги и команды админа: одна точка правды в репозитории

Дата: 2026-11-06. Относится к `seaps.asia` (`C:\Users\Administrator\lox-voice`, репозиторий `goropojixoj12-oss/lox-voice`).

Принцип: **карточки и команды живут в git**. Никаких Supabase, Vercel Blob, KV, внешних баз. Каждое изменение — обычный коммит в `main`, Vercel пересобирает сайт из него.

---

## 1. Где что лежит

| Что | Путь | Кто пишет |
|---|---|---|
| Карточка листинга | `content/listings/<file>.json` | админ/агент через экспорт, либо вручную коммитом |
| Фото карточки | `public/media/listings/<slug>/NN.jpg` | экспорт (скачивает и кладёт файлом) |
| Генерируемый код каталога | `src/data/properties.ts` | **только** `npm run listings:build`, руками не править |
| Очередь команд админа | `content/requests.json` | админка (`/api/admin/site-requests`) |
| Скриншоты к командам | `content/requests/<id>/<file>` | админка |
| Валидатор карточек | `scripts/validate-listings.mjs` | запускается в `npm run gate` |

Маркеры в `properties.ts`: `// <listings:begin>` … `// <listings:end>` — всё между ними перегенерируется, остальное (хелперы `getPropertyBySlug` и т.д.) не трогается.

---

## 2. Четыре входа, один конвейер

1. **Владелец → агенту (чат)**: агент создаёт/меняет `content/listings/*.json` + фото, прогоняет `npm run gate`, коммитит.
2. **Агент в кабинете**: `/dashboard/agent/listings/<id>` → кнопка «Записать в репозиторий» → `POST /api/listings/export`.
3. **Админ в кабинете**: `/dashboard/admin/listings/<id>` → та же кнопка, плюс полное редактирование.
4. **Админ через админку управления сайтом**: `/dashboard/admin/site-changes` → текстовая команда (+скриншот) → `content/requests.json` → агент/крон забирает через `GET /api/admin/site-requests/pull` (Bearer `SITE_AGENT_SECRET` или `CRON_SECRET`) → выполняет → `PATCH /api/admin/site-requests/<id>` со статусом `done` и ссылкой на коммит.

Пути 2 и 3 используют один API, разница только в правах:

| Роль | Что может |
|---|---|
| admin | любая карточка, любой scope команды (`site`, `listing`, `design`, `ui_auth`) |
| agent | только свои карточки (`createdByUserId` / `ownerId`), экспорт без публикации чужих |
| owner | только свои карточки |

---

## 3. Как добавить карточку (канонический путь)

```bash
# 1. фото в репозиторий
public/media/listings/<slug>/01.jpg
public/media/listings/<slug>/02.jpg

# 2. сама карточка
content/listings/<slug>.json

# 3. проверить и собрать
npm run listings:check     # схема, дубли, наличие всех файлов фото
npm run listings:build     # content -> src/data/properties.ts
npm run gate                # build + smoke + header clearance

# 4. выпустить
npm run ship -- <short-name>
```

Из кабинета то же самое делает кнопка «Записать в репозиторий»: берёт запись из стора, скачивает её фото в `public/media/...`, и коммитит `content/listings/<file>.json` + фото одним атомарным коммитом (Git Trees API).

---

## 4. Что гарантирует валидатор (`scripts/validate-listings.mjs`)

Ошибки (gate краснеет, пуш невозможен):
- нет обязательных полей (`id`, `slug`, `title`, `summary`, `description`, `transactionType`, `propertyType`, `status`, `price`, `currency`, `location`);
- неизвестный `transactionType` / `propertyType` / `visibility` / `design`;
- дубли `slug` или `id`;
- фото указано не локальным `/media/...` путём (внешние URL запрещены);
- файла фото нет на диске;
- ноль фото и нет флага `mediaPending`.

Предупреждения (не блокируют):
- нет координат (`lat`/`lng` = 0) — карта на странице покажет «нет координат»;
- фото тяжелее 400 КБ — стоит пережать;
- в `public/media/listings/` лежит файл, на который никто не ссылается.

Публикация карточки — это данные, а не глобальное правило: `"visibility": "public" | "hidden"`. Раньше весь `rent` молча вырезался из каталога — именно так карточки «исчезали».

---

## 5. Очередь команд: как это работает

```
POST /api/admin/site-requests       -> коммит content/requests.json (status=queued)
GET  /api/admin/site-requests       -> список заявок из git
GET  /api/admin/site-requests/pull  -> берёт старейшую queued, ставит in_progress (Bearer)
PATCH /api/admin/site-requests/<id> -> done / failed + agentNote + commitUrl (Bearer или админ)
POST /api/admin/site-requests/dispatch -> вернуть failed в queued (ретрай)
GET  /api/cron/site-agent           -> крон-обёртка над pull
```

Особенности:
- вебхук-обход удалён: единственный канал доставки — очередь в git;
- `scope` больше не зашит в `ui_auth`, админ командует любым аспектом сайта;
- каждая смена статуса — коммит, поэтому история «кто попросил → что сделали → какой коммит» лежит в одном месте;
- скриншоты едут в `content/requests/<id>/`.

---

## 6. Переменные окружения

| Переменная | Зачем |
|---|---|
| `GITHUB_CONTENT_TOKEN` | **обязательна** для очереди и экспорта. Fine-grained PAT, `Contents: Read and write`, только репозиторий `lox-voice` |
| `GITHUB_CONTENT_REPO` | опционально, по умолчанию `goropojixoj12-oss/lox-voice` |
| `GITHUB_CONTENT_BRANCH` | опционально, по умолчанию `main` |
| `SITE_AGENT_SECRET` / `CRON_SECRET` | Bearer для `pull` и `PATCH` |

Без токена админка честно отвечает `503` с текстом про токен — молчаливого fallback в Blob нет.

---

## 7. Ограничения и известные нюансы

- Экспорт идемпотентен: ищет карточку по `id`, пишет в тот же файл и тот же slug (регистр сохраняется), фото **добавляет**, а не заменяет.
- Если slug занят другой карточкой (`id` другой) — экспорт падает с понятной ошибкой, а не перезаписывает.
- Каждый шаг очереди — коммит, а значит пересборка Vercel. При активной работе имеет смысл `ignoreCommand`, который пропускает билд, если изменился только `content/requests.json`.
- Файл `content/requests.json` хранит последние 200 заявок.
- Фото в репозитории: держим ≤ 400 КБ на файл, предпочтительно webp; 100 карточек ≈ 10–15 МБ.

---

## 8. Диагностика

| Симптом | Причина | Что делать |
|---|---|---|
| `503 ... GITHUB_CONTENT_TOKEN` | токен не задан или не в том Vercel-проекте (нужен `lox-voice`, не `data`) | добавить переменную → redeploy |
| `403 Forbidden` | нет роли admin / не своя карточка | проверить пользователя |
| `slug уже занят` | две карточки претендуют на один slug | поправить slug или удалить дубль |
| gate падает на `listings check` | битая карточка (нет фото/полей/дубль) | текст ошибки говорит, какой файл и что именно |
| после коммита сайт не обновился | Vercel ещё собирает | подождать деплой, проверить `/api/properties` |
---

## 9. Идемпотентность экспорта (проверено на проде 2026-11-06)

- Фото называются **по хешу содержимого**: `photo-<sha1-10>.<ext>`. Повторный экспорт той же карточки не создаёт `04.jpg`, `05.jpg` и т.д. — файл переиспользуется.
- Экспорт ищет карточку по `id`, пишет в **её** файл и **её** slug (регистр сохраняется: `fBb84` не превращается в `fbb84`).
- Фото **мержатся**: то, что уже лежит в репозитории, не затирается пустым списком из кабинета.
- Координаты и `design` из репозитория **не перетираются нулями** из записи кабинета.
- Экспорт пересобирает `src/data/properties.ts` **в том же коммите** — иначе карточка попадала в git, а сайт продолжал отдавать прошлый билд.
- Повторный экспорт без изменений даёт коммит **без диффа** (проверено: последний прогон — «изменённых файлов нет»).

---

## 10. Экономия сборок: ignored build step (2026-11-06)

Очередь команд лежит в git, значит каждый переход (queued → in_progress → done) — коммит, а раньше любой коммит запускал полную пересборку Vercel.

Теперь в `vercel.json`:

```json
"ignoreCommand": "node scripts/vercel-ignore-build.mjs"
```

Логика `scripts/vercel-ignore-build.mjs`:

- сравнивает `VERCEL_GIT_PREVIOUS_SHA..VERCEL_GIT_COMMIT_SHA` (при отсутствии — файлы последнего коммита);
- если **все** изменённые файлы попадают под `content/requests/...` или `content/requests.json` → выход 0, деплой пропускается;
- любой другой файл, пустой список изменений, ошибка git или мелкий клон → выход 1, сборка как обычно.

Проверено на проде: коммит с одной заявкой дал в `vercel ls` деплой **Canceled (3s)** вместо сборки на ~20s; предыдущий production остаётся живым.

Важно: экспорт карточки трогает `content/listings/*` и `src/data/properties.ts` — такой коммит **всегда собирается**.


## 11. Загрузка фото и видео: почему понадобились срезы

Два лимита, которые не видны в коде, но режут загрузку:

| Ограничение | Значение | Что ломалось |
| --- | --- | --- |
| тело запроса к serverless-функции Vercel | ~4.5 МБ | фото 5–12 МБ → `413 FUNCTION_PAYLOAD_TOO_LARGE`, UI показывал «Upload failed» |
| GitHub Contents API | inline base64 только до 1 МБ | загруженный файл 5 МБ отдавался как 404 из `/api/uploads/...` |
| размер ответа функции | ограничен | отдача файла буфером обрезалась, поэтому ответ идёт потоком по 512 КБ |

Порядок загрузки крупного файла:

```
POST /api/dashboard/list-property/media/init      {name,size,type} -> {uploadId, chunkSize, totalChunks}
PUT  /api/dashboard/list-property/media/chunk?uploadId=..&index=0   (3 МБ, binary)
PUT  /api/dashboard/list-property/media/chunk?uploadId=..&index=1
POST /api/dashboard/list-property/media/complete  {uploadId} -> {item:{url, storageKey, size}}
```

- файлы до 3 МБ по-прежнему уходят одним `POST /api/dashboard/list-property/media` (multipart);
- срезы лежат в `seaps_blobs` (Postgres) под ключом `listing-upload-staging/<uploadId>/<NNNN>.bin` и удаляются сразу после склейки; в dev — в `.data/blobs`;
- сессия загрузки живёт 2 часа, срез можно переслать повторно (тот же индекс перезаписывается);
- готовый файл коммитится в `content/uploads/<user>/<sha1-12>.<ext>`, при публикации копируется в `public/media/listings/<slug>/photo-<sha1-12>.jpg`;
- фото больше 1.5 МБ ужимаются в браузере до 2560 px / JPEG q0.9 до отправки.

Диагностика, если снова «Upload failed»: посмотреть статус ответа в devtools. `413` — файл пошёл одним запросом (проверить, что клиент выбрал путь со срезами); `410` — истекла сессия загрузки; `404` на `/api/uploads/...` — файла нет в git по этому пути.
