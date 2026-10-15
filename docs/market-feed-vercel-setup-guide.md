# Market Feed на Vercel: пошаговая настройка (vps1.store)

Эта инструкция для продакшена на **Vercel**, где публичная лента: [`/market-feed`](https://www.vps1.store/market-feed), админка: [`/admin/market-feed`](https://www.vps1.store/admin/market-feed).

**Зачем:** без постоянного хранилища (Blob или Redis) каждый serverless-инстанс пишет во **временный `/tmp`** — cron и «Sync now» отрабатывают, но на сайте лента остаётся пустой.

---

## Что понадобится

- Доступ к проекту Vercel, куда задеплоен сайт (например `vps1.store`).
- Учётная запись админа сайта (`admin@seaps.com.kh` или ваша).
- 10–20 минут на Storage + секреты + redeploy; **Full import once** может занять **15–30 минут** (вкладку браузера не закрывайте).

---

## Шаг 1. Подключить постоянное хранилище (Blob **или** Redis/Upstash)

Выберите **один** вариант (Blob проще для JSON-файлов ленты; Redis тоже поддерживается кодом).

### Вариант A — Vercel Blob

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard).
2. Выберите **проект** вашего сайта (тот, где домен `vps1.store` / `www.vps1.store`).
3. Перейдите на вкладку **Storage** (или **Add Storage** / **Create Database** в зависимости от версии UI).
4. Нажмите **Create** → выберите **Blob** → задайте имя store → **Create** / **Connect to project**.
5. Убедитесь, что store **привязан к этому проекту** (Connect Project).
6. **Ожидаемый результат:** в **Settings → Environment Variables** появится переменная **`BLOB_READ_WRITE_TOKEN`** (иногда также `VERCEL_BLOB_READ_WRITE_TOKEN`) для окружения **Production** (и часто Preview).

**Документация:** [Vercel Blob — Getting started](https://vercel.com/docs/storage/vercel-blob)

**YouTube (поиск):**

- [vercel blob storage setup](https://www.youtube.com/results?search_query=vercel+blob+storage+setup)
- [vercel blob connect project](https://www.youtube.com/results?search_query=vercel+blob+connect+to+project)

### Вариант B — Redis (Upstash через Marketplace)

1. В том же **проекте Vercel** откройте **Storage** или [Marketplace → Storage → Redis](https://vercel.com/marketplace?category=storage&search=redis).
2. Установите интеграцию **Upstash Redis** (или другую Redis из Marketplace) → **Add integration** → выберите **этот проект** → подтвердите.
3. Создайте базу / примите defaults → **Connect**.
4. **Ожидаемый результат:** в Environment Variables появятся **`KV_REST_API_URL`** и **`KV_REST_API_TOKEN`** (или **`UPSTASH_REDIS_REST_URL`** / **`UPSTASH_REDIS_REST_TOKEN`** — код понимает оба варианта).

**Документация:**

- [Vercel Marketplace — Redis](https://vercel.com/marketplace?category=storage&search=redis)
- [Upstash Redis with Vercel](https://upstash.com/docs/redis/howto/vercelintegration)

**YouTube (поиск):**

- [vercel upstash redis setup](https://www.youtube.com/results?search_query=vercel+upstash+redis+setup)
- [vercel marketplace redis integration](https://www.youtube.com/results?search_query=vercel+marketplace+redis+integration)

> Если интерфейс Vercel отличается — **вставьте скриншот** вкладки Storage в чат; по подписям кнопок подскажем следующий шаг.

---

## Шаг 2. Задать секреты для cron и ручного sync (`CRON_SECRET` / `AGGREGATION_SYNC_SECRET`)

API [`/api/aggregations/sync`](https://www.vps1.store/api/aggregations/sync) принимает:

- сессию **админа** в браузере, **или**
- заголовок `Authorization: Bearer <секрет>`.

Для cron и `curl` нужен длинный случайный секрет.

1. Сгенерируйте строку (локально в терминале):

   ```bash
   openssl rand -hex 32
   ```

   **Ожидаемый результат:** одна длинная hex-строка (64 символа).

2. В Vercel: **Project → Settings → Environment Variables**.
3. Добавьте переменную:
   - **Key:** `CRON_SECRET`
   - **Value:** вставьте сгенерированную строку
   - **Environment:** отметьте **Production** (при необходимости Preview)
   - **Save**
4. (Рекомендуется) Добавьте вторую переменную с **тем же значением**:
   - **Key:** `AGGREGATION_SYNC_SECRET`
   - **Value:** тот же секрет
   - **Environment:** Production
5. Проверьте также (если ещё не заданы):

   | Key | Назначение |
   | --- | --- |
   | `AUTH_SECRET` | подпись сессий |
   | `NEXT_PUBLIC_SITE_URL` | например `https://www.vps1.store` |

**Документация:** [Vercel — Environment Variables](https://vercel.com/docs/projects/environment-variables)

**YouTube (поиск):**

- [vercel environment variables production](https://www.youtube.com/results?search_query=vercel+environment+variables+production)
- [vercel cron secret authorization bearer](https://www.youtube.com/results?search_query=vercel+cron+jobs+environment+variables)

---

## Шаг 3. Redeploy (обязательно после Storage и env)

Новые переменные и Storage **не** подхватываются уже запущенными инстансами без нового деплоя.

1. **Project → Deployments**.
2. У последнего успешного деплоя нажмите **⋯** (три точки) → **Redeploy**.
3. Подтвердите **Redeploy** для **Production**.
4. **Ожидаемый результат:** новый deployment в статусе **Ready** (обычно несколько минут).

**YouTube (поиск):** [vercel redeploy production](https://www.youtube.com/results?search_query=vercel+redeploy+production)

---

## Шаг 4. Проверить `/api/aggregations/status`

1. В браузере или терминале откройте:

   ```text
   https://www.vps1.store/api/aggregations/status
   ```

2. **Ожидаемый результат (JSON):**
   - `storageBackend` — **`blob`** или **`redis`** (не только «filesystem» в смысле ephemeral на Vercel).
   - `ephemeralFilesystem` — **`false`** (если поле есть).
   - После синка: `total` **> 0** (может быть 0 до первого успешного sync — см. шаг 5).

Пример проверки в терминале:

```bash
curl -s https://www.vps1.store/api/aggregations/status | jq .
```

(Если `jq` нет — откройте URL в браузере и прочитайте JSON.)

---

## Шаг 5. Первый полный импорт ленты

### Способ 1 — через админку (без curl)

1. Войдите как админ: [`/auth/login`](https://www.vps1.store/auth/login).
2. Откройте [`/admin/market-feed`](https://www.vps1.store/admin/market-feed).
3. **Быстрый тест:** кнопка **Sync now** — один batch (~24 источника).
   - **Ожидаемый результат:** сообщение вида `Synced: fetched … → … total` и `storage: blob` или `storage: redis`.
4. **Полный проход по реестру (~773 источника):** кнопка **Full import once**.
   - Держите вкладку открытой **~15–30 минут**.
   - **Ожидаемый результат:** `Full import done: … listings`.
   - Чтобы остановить — **Stop full import**.

### Способ 2 — через curl (с плейсхолдерами)

Подставьте **свой домен** и **секрет** вместо плейсхолдеров:

```bash
export SITE_URL="https://www.vps1.store"
export CRON_SECRET="ВАШ_СЕКРЕТ_ИЗ_VERCEL"

# Один batch
curl -s -X POST "${SITE_URL}/api/aggregations/sync?batchSize=50" \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Статус после sync
curl -s "${SITE_URL}/api/aggregations/status"
```

**Ожидаемый результат POST:** JSON с полями `total`, `created`, `storageBackend`, без `401 Unauthorized`.

---

## Шаг 6. Cron на Vercel (авто-sync)

На тарифе **Hobby** расписание cron в этом проекте рассчитано на **не чаще одного раза в день** (см. README репозитория). Vercel Cron вызывает **`GET /api/aggregations/sync`** с `Authorization: Bearer CRON_SECRET`.

- Для **ежедневного** cron достаточно заданного `CRON_SECRET` и успешного redeploy.
- Для sync **чаще раза в день** нужен **Pro/Enterprise**, внешний scheduler (cron-job.org и т.п.) с тем же Bearer URL, или основной хостинг на **Netlify** (там есть минутный scheduler в репозитории).

**Документация:** [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

**YouTube (поиск):** [vercel cron jobs setup](https://www.youtube.com/results?search_query=vercel+cron+jobs+setup)

---

## Чеклист «всё работает»

| Проверка | OK |
| -------- | -- |
| `/api/aggregations/status` → `storageBackend` = `blob` или `redis` | ☐ |
| `ephemeralFilesystem` = `false` на Vercel | ☐ |
| После **Sync now** или **Full import once** → `total` > 0 | ☐ |
| [`/market-feed`](https://www.vps1.store/market-feed) показывает карточки | ☐ |
| В админке видны источники и дата последнего sync | ☐ |

---

## Глобальное правило «подробные инструкции для любых ручных шагов»

Чтобы Cursor **во всех проектах** всегда давал пошаговые инструкции с ссылками и YouTube, добавьте правило в **User Rules** — см. [cursor-user-rule-copy-paste.md](./cursor-user-rule-copy-paste.md).

---

## Если что-то пошло не так

- **`storageBackend` всё ещё filesystem и `ephemeralFilesystem: true`** — Storage не подключён к проекту или не было **Redeploy** после подключения.
- **`401` на curl** — неверный `CRON_SECRET` / не redeploy после смены env.
- **Sync OK, но `total` 0** — часть из ~773 URL не отдаёт объявления без отдельного парсера; demo-адаптеры и порталы должны дать ненулевой результат после **Full import once**.
- Пришлите **скриншот** Vercel (Storage + Environment Variables) и JSON **`/api/aggregations/status`** — по ним можно точечно указать следующий шаг.
