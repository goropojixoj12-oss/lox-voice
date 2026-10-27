# Site changes → Cloud Agent (вариант B, Vercel)

Когда админ нажимает **Send** на [`/dashboard/admin/site-changes`](https://www.vps1.store/dashboard/admin/site-changes), заявка попадает в очередь. Чтобы **сайт реально менялся**, нужны ещё два звена: **Cursor Automation (webhook)** и (опционально) **Vercel Cron** как подстраховка.

Ниже — только то, что вы настраиваете **сами** в браузере. URL «для сайта» уже зашиты в код; вручную их в Vercel вставлять не нужно, кроме webhook Cursor.

---

## Шаг 0. Проверьте имя переменной (частая ошибка)

В Vercel должна быть **ровно одна** переменная:

| Key | Value |
| --- | --- |
| `SITE_AGENT_SECRET` | длинная случайная строка (ваш секрет) |

**Не** `SITE_AGENT_SECRETSITE_AGENT_SECRET` и не два имени склеенных — иначе API не увидит секрет.

После любой правки env — **Redeploy** Production.

---

## Шаг 1. Cursor Automation (откуда берётся URL для webhook)

Это **не** URL вашего сайта. Это **приватный адрес Cursor**, куда **сайт шлёт POST**, когда есть новая заявка.

1. Откройте [cursor.com/automations](https://cursor.com/automations) (нужен аккаунт Cursor).
2. **New automation** / создать автomation.
3. **Trigger:** выберите **Webhook**.
4. **Repository:** `goropojixoj12-oss/lox-voice`, ветка **`main`** (агент должен менять код этого репо).
5. **Instructions (промпт)** — вставьте что-то в таком духе:

   ```text
   Тебе приходит JSON webhook в конце этого сообщения.
   Это заявка на изменение UI/авторизованных экранов SEAPS (vps1.store).
   Прочитай поле task или message, выполни изменение в репозитории lox-voice,
   push на GitHub main (production Vercel), затем PATCH patchUrl со status done и commitUrl.
   Bearer для PATCH — тот же секрет, что SITE_AGENT_SECRET на Vercel (не публикуй его в логах).
   ```

6. Сохраните и **активируйте** automation.
7. В карточке webhook нажмите **Generate auth header** (или аналог) — появятся:
   - **Webhook URL** (часто на `api2.cursor.sh/...`)
   - **Bearer token** (`crsr_...`)

**Ожидаемый результат:** есть URL и Bearer; без Bearer Cursor **отклонит** запрос (в логах automation ничего не появится).

Документация: [Cursor Automations](https://cursor.com/docs/cloud-agent/automations) (раздел Webhook triggers).

YouTube (поиск): [cursor automations webhook](https://www.youtube.com/results?search_query=cursor+automations+webhook)

---

## Шаг 2. Переменные в Vercel (3 штуки)

**Project** (lox-voice / vps1.store) → **Settings** → **Environment Variables** → **Production**:

| Key | Value | Зачем |
| --- | --- | --- |
| `SITE_AGENT_SECRET` | ваш секрет (уже есть) | PATCH/pull/cron |
| `SITE_AGENT_WEBHOOK_URL` | **Webhook URL** из шага 1 | куда слать заявку |
| `SITE_AGENT_WEBHOOK_BEARER` | **Bearer `crsr_...`** из шага 1 | заголовок Authorization для Cursor |

Рекомендуется (для Vercel Cron):

| Key | Value |
| --- | --- |
| `CRON_SECRET` | **тот же** секрет, что и `SITE_AGENT_SECRET` |

Vercel при вызове cron сам добавит `Authorization: Bearer <CRON_SECRET>`.

1. **Save** каждую переменную.
2. **Deployments** → последний Production → **Redeploy**.

Документация: [Environment Variables](https://vercel.com/docs/projects/environment-variables), [Securing cron jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs)

YouTube: [vercel environment variables production](https://www.youtube.com/results?search_query=vercel+environment+variables+production)

---

## Шаг 3. Cron — уже в репозитории (ничего вручную в cron-job.org не нужно)

В `vercel.json` задано:

- **Путь:** `GET /api/cron/site-agent`
- **Расписание:** `0 9 * * *` (раз в сутки, 09:00 UTC)

После деплоя с этим файлом Vercel сам создаёт cron в проекте.

**Что делает cron:** забирает **одну** старую заявку со статусом `queued`, шлёт тот же webhook в Cursor (если Send не сработал или webhook не был настроен).

На тарифе **Pro** можно чаще — поменяйте `schedule` в `vercel.json` (например `*/30 * * * *`) и снова push в `main`.

Проверка в Vercel: **Project → Settings → Cron Jobs** — должна быть строка `/api/cron/site-agent`.

---

## Шаг 4. Проверка (curl)

Подставьте свой секрет и выполните локально:

```bash
export SECRET="ваш_SITE_AGENT_SECRET"
curl -sS "https://www.vps1.store/api/admin/site-requests/pull" \
  -H "Authorization: Bearer ${SECRET}"
```

**Ожидаемый результат:** JSON с `request` (заявка) или `"request": null`, если очередь пуста.

Проверка cron (после деплоя):

```bash
curl -sS "https://www.vps1.store/api/cron/site-agent" \
  -H "Authorization: Bearer ${SECRET}"
```

**Ожидаемый результат:** `{"ok":true,"picked":true,...}` или `picked:false`, если нечего забирать. Если `503` про `SITE_AGENT_WEBHOOK_URL` — не задан шаг 2.

---

## Справочник URL (ваш домен, ничего «брать» не нужно)

| Назначение | URL |
| --- | --- |
| Админ-форма | https://www.vps1.store/dashboard/admin/site-changes |
| Забрать заявку (агент) | `GET https://www.vps1.store/api/admin/site-requests/pull` |
| Отметить выполненной | `PATCH https://www.vps1.store/api/admin/site-requests/{id}` |
| Скрин | `GET https://www.vps1.store/api/admin/site-requests/file?key=...` |
| Cron (Vercel) | `GET https://www.vps1.store/api/cron/site-agent` |
| **Webhook Cursor** | только из dashboard Automation → **не** vps1.store |

Во всех API выше (кроме формы в браузере):  
`Authorization: Bearer <SITE_AGENT_SECRET>`.

---

## Как понять, что цепочка живая

1. **Send** в админке → в **Recent requests** статус **Queued** (или **In progress** после pull/cron).
2. В [cursor.com/automations](https://cursor.com/automations) у вашей automation появился **новый run**.
3. Через несколько минут — коммит на GitHub `main`, деплой Vercel **Ready**.
4. Статус заявки **Done** (если агент сделал PATCH).

Если Send OK, но run в Cursor **нет** — почти всегда не хватает **`SITE_AGENT_WEBHOOK_URL`** / **`SITE_AGENT_WEBHOOK_BEARER`** или не было redeploy.

Если run есть, а сайт не меняется — смотрите лог run (ошибка push, scope, и т.д.).

---

## Скриншоты

Если пункт меню в Vercel или Cursor не совпадает с текстом — **вставьте скрин** в чат, подскажем следующий клик.
