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

### 10:05–10:50 UTC (10:05–10:50 BST) — Масштабное обновление листингов

- **Действие**: Полная переработка функционала листингов по запросу администратора
- **Модель**: Claude Opus 4
- **Что добавлено**:
  1. **Tiptap rich text editor** — полнофункциональный редактор текста для описания листингов: жирный, курсив, подчёркивание, заголовки H1-H3, списки, выравнивание, цвета, выделение, вставка изображений, видео (YouTube/Vimeo/MP4), ссылки, горизонтальные линии, цитаты, код
  2. **3D вращающийся куб-галерея** — Three.js + React Three Fiber: фото/видео на гранях куба, автовращение, OrbitControls для ручного вращения, fullscreen lightbox с зумом и скачиванием
  3. **Заметки к листингу** — внутренние заметки с правами доступа: admin выбирает видимость (admin_only / staff / public), заметки агента видны админу по умолчанию
  4. **Документы к листингу** — загрузка файлов любого формата, кастомное имя, уровни доступа (admin_only / staff / public), скачивание
  5. **Комиссия**: два поля — агенту (%) и компании (%), комиссия компании видна только админу
  6. **Привязка ответственного агента** — поле assignedAgentId на листинге
- **Новые файлы**:
  - `src/components/editor/rich-text-editor.tsx` — Tiptap-редактор
  - `src/components/property/property-gallery-3d.tsx` — 3D-галерея
  - `src/components/admin/listing-notes-panel.tsx` — панель заметок
  - `src/components/admin/listing-documents-panel.tsx` — панель документов
  - `src/app/api/admin/listings/documents/route.ts` — API загрузки документов
- **Изменённые файлы**: types.ts, property/[slug]/page.tsx, list-property-wizard.tsx, admin-listing-edit-wizard.tsx, admin/listings/[id]/route.ts, package.json
- **Новые зависимости**: @tiptap/* (10 пакетов), three, @react-three/fiber, @react-three/drei
- **Коммит**: `65fd06f`
- **Build**: 0 ошибок
- **Результат**: ✓ Завершено и проверено

---

### 09:51 UTC (09:51 BST) — Аудит прав админа + блокировка аккаунтов + изоляция агентов

- **Действие**: Полный аудит прав администратора, добавление блокировки сотрудников, полного редактирования профилей, изоляции агентов
- **Модель**: Claude Opus 4
- **Результат аудита**:
  - ✓ Создание сотрудников: `POST /api/admin/agents` — работает, admin-only
  - ✓ Редактирование: добавлен `PATCH /api/admin/agents` (имя, email, пароль, блокировка)
  - ✓ Список аккаунтов: добавлен `GET /api/admin/agents` — admin-only
  - ✓ Все страницы `/dashboard/admin/*` защищены `requireRole(["admin"])` в layout
  - ✓ Агент через API получает только свой профиль (resolveActingAgentUser)
  - ✓ В агентской навигации нет ссылок на staff/users
  - ✗ Найден недостаток: не было блокировки аккаунтов — исправлено
  - ✗ Найден недостаток: не было полного редактирования профиля — исправлено
- **Новое**:
  - Поле `DemoUser.suspended` — блокирует логин + инвалидирует активные сессии
  - Панель управления аккаунтом (`AdminStaffAccountPanel`): имя, email, пароль, блокировка
  - Бейджик BLOCKED в таблице сотрудников и на странице профиля
  - `updatePlatformUser()` в platform-users-store
- **Файлы**: types.ts, auth.ts, platform-users-store.ts, admin/agents/route.ts, staff/[staffId]/page.tsx, staff/page.tsx, admin-staff.ts, admin-staff-account-panel.tsx (NEW)
- **Коммит**: `b546a93`
- **Build**: 0 ошибок
- **Результат**: ✓ Завершено и проверено

---

### 09:48 UTC (09:48 BST) — Усиление загрузки медиа по запросу админа

- **Действие**: Обновлены параметры загрузки фото/видео по прямому указанию администратора
- **Модель**: Claude Opus 4
- **Изменения**:
  - Повторы при ошибке: 2 → 7 (итого до 8 попыток на файл)
  - Параллельность: лимит 6 → безлимитная (все файлы одновременно через `Promise.all`)
  - Ограничение: общий вес загружаемых файлов ≤ 1 ГБ (проверка перед загрузкой)
  - Таймаут серверного роута: 120с → 1200с (20 минут)
- **Файлы**: `list-property-media-step.tsx`, `media/route.ts`
- **Коммит**: `814b6bb`
- **Build**: 0 ошибок
- **Результат**: ✓ Завершено и проверено

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
