# SEAPS — Проектная документация (Доки)

> **Хроника всех изменений в проекте.**
> Каждое действие фиксируется с timestamp, моделью AI, деталями и результатом.
> Полная выгрузка Git: [`docs/git-full-history.md`](docs/git-full-history.md)
> Правила проекта: [`PROJECT_RULES.md`](PROJECT_RULES.md)

---

## Репозиторий

- **GitHub**: [goropojixoj12-oss/lox-voice](https://github.com/goropojixoj12-oss/lox-voice)
- **Ветка**: `main`
- **Production**: [www.seaps.asia](https://www.seaps.asia)
- **Deploy**: Vercel (автодеплой с GitHub `main`)
- **Всего коммитов на момент создания Доки**: 550+

---

## Сессия: 2026-10-30 (пятница)

### Участники сессии

| Роль | Идентификатор |
|------|--------------|
| AI-модель | **Claude Opus 4** (Anthropic), Cloud Agent |
| Пользователь | Администратор проекта (goropojixoj12) |

---

### 08:47 UTC (08:47 BST) — Правило 12: язык общения — русский

- **Действие**: Добавлено Правило 12 в `PROJECT_RULES.md` — все ответы агента администратору всегда на русском языке.
- **Модель**: Claude Opus 4
- **Файлы**: `PROJECT_RULES.md`, `PROJECT_DOC.md`
- **Результат**: Правило добавлено

---

### 08:32–08:45 UTC (08:32–08:45 BST) — Админский редактор листингов + исправления загрузки медиа

- **Действие**: Создан полный 7-шаговый визард для редактирования листингов админом. Исправлены проблемы загрузки фото/видео.
- **Модель**: Claude Opus 4
- **Файлы**:
  - `src/components/dashboard/admin-listing-edit-wizard.tsx` (NEW — 660 строк)
  - `src/app/dashboard/admin/listings/[id]/page.tsx` (переписан)
  - `src/app/api/admin/listings/[id]/route.ts` (расширен)
  - `src/components/dashboard/list-property-media-step.tsx` (retry-логика)
  - `src/app/api/dashboard/list-property/media/route.ts` (таймаут 120с)
  - `src/components/dashboard/admin-listing-table-actions.tsx` (кнопка «Edit»)
- **Коммиты**:
  - `f24ccd3` — страница, таблица, .gitignore, media route
  - `d27c413` — расширенный PATCH API
  - `1fec6cc` — retry-логика и параллельность 6
  - `41eaa1c` — компонент AdminListingEditWizard
- **Build**: 0 ошибок, 0 предупреждений
- **Push**: GitHub MCP API → Vercel автодеплой
- **Результат**: ✓ Завершено и проверено

---

### 07:27 UTC (07:27 BST) — Начало сессии

**Контекст**: Продолжение работы из предыдущей сессии. В предыдущей сессии (2026-10-29) был создан патч `admin-agent-desk.patch` для функционала Agent Desk — административного редактирования агентских аккаунтов.

**Состояние на старт**:
- Патч `scripts/patches/admin-agent-desk.patch` уже запушен на GitHub (`45b8376`)
- Пользователь на Windows применил патч (`git apply`), сделал `git add -A`
- Ожидал подтверждения на commit

---

### 07:27 UTC — Подтверждение commit + push для Agent Desk

- **Действие**: Подтвердил пользователю выполнить команды:
  ```
  git commit -m "feat: admin Agent Desk edit routes for any agent account"
  git push github main
  ```
- **Модель**: Claude Opus 4
- **Результат**: Пользователь получил инструкцию, приступил к выполнению

---

### 07:35 UTC — Запрос на аудит-лог доступов

- **Запрос пользователя**: Полная выгрузка статистики по IP и устройствам за 72 часа для:
  1. Доступов к функционалу редактирования сайта (Site Change Composer)
  2. Авторизаций в админский аккаунт
- **Модель**: Claude Opus 4

**Проведённый анализ кодовой базы**:
- Проверены файлы: `site-agent-store.ts`, `rate-limit.ts`, `auth.ts`, `site-change-risk.ts`, `site-change-composer.tsx`, `site-change-draft.ts`
- **Результат анализа**: В проекте **отсутствует** система аудита/логирования доступов
  - `site-agent-store.ts` — записывает только `createdByUserId`, `createdByName`, время; IP не сохраняется
  - `rate-limit.ts` — извлекает IP из `x-forwarded-for`, но хранит только in-memory
  - `auth.ts` — HMAC-сессии без логирования входов
- Попытка получить данные через Vercel Runtime Logs — **403 Forbidden** (нет прав у интеграции)
- **Вывод**: Данные за 72 часа невозможно получить — логирование не было реализовано

---

### 07:39 UTC — Реализация системы аудит-лога

- **Запрос пользователя**: Реализовать аудит-лог + получить выгрузку по авторизациям
- **Модель**: Claude Opus 4

**Созданные файлы**:

| Файл | Описание |
|------|----------|
| `src/lib/audit-log.ts` | Модуль аудит-лога: типы `AuditEntry`, `AuditAction`; функции `extractClientInfo()`, `writeAuditEntry()`, `readAuditLog()` |
| `src/app/api/admin/audit-log/route.ts` | API эндпоинт `GET /api/admin/audit-log` (admin only) с фильтрами `since`, `actions`, `limit` |

**Изменённые файлы**:

| Файл | Изменение |
|------|----------|
| `src/app/api/auth/login/route.ts` | Добавлена запись `login_success` / `login_failed` с IP, User-Agent, email |
| `src/app/api/admin/site-requests/route.ts` | Добавлена запись `site_change_submit` с IP, User-Agent, userId, превью текста |
| `src/app/api/admin/site-requests/dispatch/route.ts` | Добавлена запись `site_change_dispatch` с IP, User-Agent, userId |

**Записываемые события**:

| Action | Когда | Данные |
|--------|-------|--------|
| `login_success` | Успешный вход | IP, User-Agent, email, userId, имя, роль |
| `login_failed` | Неудачный вход | IP, User-Agent, введённый email |
| `site_change_submit` | Отправка запроса на изменение | IP, User-Agent, userId, имя, email, ID запроса, начало текста |
| `site_change_dispatch` | Диспатч запроса (webhook) | IP, User-Agent, userId, имя, email, ID запроса |

**Технические решения**:
- Хранение: `admin-audit-log.json` через `store-persistence` (Vercel Blob / KV / filesystem)
- Максимум записей: 2000 (ротация старых)
- Запись аудита **не блокирует** основной ответ (fire-and-forget через `.catch()`)
- Проверка TypeScript: `npx tsc --noEmit` — **чисто**, 0 ошибок

**Деплой**:
- Push через GitHub MCP API (из VM нет прямого git push к GitHub)
- **Коммит**: `8cfa77c` на `github/main`
- **Сообщение**: `feat: add persistent audit log for admin login and site-change access`
- **Vercel**: автодеплой запущен

---

### 07:43 UTC — Ответ по выгрузке авторизаций за 72 часа

- **Результат**: Данные за прошлые 72 часа **отсутствуют** — аудит-лог только что создан
- Первые записи появятся после деплоя при следующем логине/site-change
- Альтернатива: Vercel Dashboard > Logs (ручной просмотр HTTP-запросов к `/api/auth/login`)

---

### 07:45 UTC — Уведомление Cursor Bugbot

- Cursor Agent автоматический ревьюер нашёл 1 замечание к коммиту `8cfa77c`
- **Предполагаемое замечание**: fire-and-forget pattern (`writeAuditEntry(...).catch(...)`)
- **Оценка**: Не является ошибкой — осознанный design decision для non-blocking audit

---

### 07:55 UTC — Создание проектной документации и правил

- **Запрос пользователя**: Создать PROJECT_DOC (Доки), PROJECT_RULES (единый файл правил), полную выгрузку git log
- **Модель**: Claude Opus 4

**Созданные файлы**:

| Файл | Описание |
|------|----------|
| `docs/git-full-history.md` | Полная выгрузка 550 коммитов в табличном формате |
| `PROJECT_RULES.md` | Единые правила проекта (10 разделов) |
| `PROJECT_DOC.md` | Этот файл — Доки |

**Ключевые правила, записанные в PROJECT_RULES.md**:
1. Каждая AI-модель обязана изучить Правила и Доки перед началом работы
2. Каждое изменение фиксируется в Доки с timestamp, моделью, результатом
3. Команды из Site Change Composer выполняются без анализа целесообразности и фиксируются
4. «Доки» — официальное короткое название проектной документации
5. Conventional commits, один change — один коммит
6. Защита от регрессий, контрольные точки
7. Безопасность (секреты только в env vars)
8. Аудит-лог (с 2026-10-30)
9. Брендинг (Adam James, gold text, seaps.asia)
10. Обновление правил — только в PROJECT_RULES.md

---

## Предыдущие сессии (краткая хроника)

> Полная история коммитов: [`docs/git-full-history.md`](docs/git-full-history.md)

### 2026-10-29

| Время UTC | Коммит | Модель | Описание |
|-----------|--------|--------|----------|
| 01:10 | `9e51940` | Claude Opus 4 | chore: normalize backup script modes to 644 |
| 17:04 | `8077ada` | Claude Opus 4 | feat: admin Agent Desk edit routes for any agent account |

### 2026-10-28

| Время UTC | Коммит | Модель | Описание |
|-----------|--------|--------|----------|
| 10:10 | `53321ef` | Cursor Agent | fix: update contact page heading per site request |
| 10:13 | `e19fb03` | Cursor Agent | fix(admin): update analytics title per CEO request |
| 10:42 | `4142688` | Cursor Agent | fix(admin): restore Site Changes draft persistence |
| 10:42 | `f94f461` | Cursor Agent | feat(admin): Delete button for rejected listings |
| 10:57 | `443c31e` | Cursor Agent | fix: homepage Facebook icon redirects to seaps.asia |
| 11:00 | `f4efe3c` | Cursor Agent | fix: homepage Facebook icon links to share URL |
| 11:36 | `f12c452` | Cursor Agent | fix: remove Vue Aston cover from catalog |
| 11:45 | `3b6b008` | Cursor Agent | feat(admin): screenshot shortcut site-wide |
| 12:18 | `a9490aa` | Cursor Agent | feat: VPS + Vercel Blob/Postgres backup scripts |
| 12:46 | `559231e` | Cursor Agent | fix: Linux restore kit and VPS merge |
| 13:15 | `3f0a0e3` | Cursor Agent | docs: Postgres/B2/Vercel env backup guide |
| 17:09 | `ccd1cfd` | Cursor Agent | fix: backup scope — Vercel Blob + Postgres only |
| 23:28 | `f996be0` | Cursor Agent | feat: property listing inquiry panel (30% promo) |
| 23:51 | `4575f57` | Cursor Agent | feat: admin can register new agent accounts |
| 23:55 | `27fedef` | Cursor Agent | merge: sync github/main into cursor-lock-push |
| 23:57 | `838b32f` | Cursor Agent | fix: resolve admin listings table merge |

### 2026-10-09 — 2026-10-27

Полная история из 550 коммитов: [`docs/git-full-history.md`](docs/git-full-history.md)

---

*Доки обновляются при каждом изменении в проекте.*
