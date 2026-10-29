# Git push через токен (Windows, вход на GitHub через Google)

Google-почта — это только **вход на сайт** github.com. Команда `git push` **не принимает** пароль Google.

Для Vercel production нужен push в **GitHub**, не в Cursor mirror:

| Remote | URL (пример) | Нужен для prod? |
|--------|----------------|-----------------|
| **github** / **origin** на GitHub | `https://github.com/goropojixoj12-oss/lox-voice.git` | **Да** |
| **origin** Cursor | `https://origin.cursor.com/.../lox-voice.git` | **Нет** (зеркало Cursor) |

Ошибка вида `Authentication failed for 'https://origin.cursor.com/...'` значит: вы пушите **не туда** или токен Cursor/сессия протух.

---

## Шаг 0 — посмотреть remotes

```cmd
cd /d C:\Users\Administrator\lox-voice
git remote -v
```

**Цель для prod:** remote с `github.com/goropojixoj12-oss/lox-voice`.

Если его нет:

```cmd
git remote add github https://github.com/goropojixoj12-oss/lox-voice.git
```

Если `origin` указывает на `origin.cursor.com`, **не используйте `git push origin`** для Vercel — используйте **`git push github main`**.

---

## Шаг 1 — создать Personal Access Token (GitHub)

1. Браузер → [https://github.com](https://github.com) → войти через Google.
2. Аватар → **Settings** → **Developer settings** (внизу слева).
3. **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**.
4. Note: например `lox-voice-push-windows`.
5. Expiration: 90 days или No expiration (на ваш риск).
6. Scopes: включить **`repo`** (полный доступ к private/public repos).
7. **Generate token** → **скопировать** (`ghp_...`) — показывают **один раз**.

Документация: [Creating a personal access token (classic)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

---

## Шаг 2 — push по HTTPS с токеном (рекомендуется)

### 2a. Очистить старые неверные credentials (Windows)

1. **Панель управления** → **Диспетчер учётных данных** (Credential Manager).
2. **Учётные данные Windows** → найти `git:https://github.com` или `origin.cursor.com`.
3. **Удалить** устаревшие записи для GitHub/Cursor.

Документация GCM: [Git Credential Manager](https://github.com/git-ecosystem/git-credential-manager/blob/main/docs/README.md)

### 2b. Push (токен = пароль)

```cmd
cd /d C:\Users\Administrator\lox-voice
git pull github main
git push github main
```

Запросит:

- **Username** — логин GitHub (например `goropojixoj12-oss`), **не** email Google.
- **Password** — **вставьте токен** `ghp_...`, не пароль.

**Ожидание:** push без `Authentication failed`.

Если remote называется `origin`, но URL — GitHub:

```cmd
git push origin main
```

(тот же username + token).

### 2c. Явный URL (если менеджер credentials не спрашивает)

```cmd
git remote set-url github https://github.com/goropojixoj12-oss/lox-voice.git
git push github main
```

При запросе пароля снова — **токен**.  
**Не** вставляйте токен в URL в чат/скриншоты; локально можно один раз через Credential Manager.

---

## Шаг 3 — что пушить для починки Vercel

```cmd
del package-lock.json
npm install
npm ci
npm run build
git add package-lock.json
git commit -m "fix: restore package-lock.json via git (production)"
git push github main
```

Проверка на GitHub: файл `package-lock.json` ~**270 KB**, не 173 bytes.

---

## Про ошибку `origin.cursor.com`

```text
fatal: Authentication failed for 'https://origin.cursor.com/sari-code/lox-voice.git/'
Run `origin auth login` to refresh your credentials
```

- Для **сайта/Vercel** этот remote **не обязателен**.
- Либо обновите Cursor CLI: `origin auth login` (если пользуетесь зеркалом Cursor).
- Либо **игнорируйте** и пушьте только **`github`** с **GitHub PAT** (шаги выше).

---

## Альтернатива: GitHub CLI

```cmd
gh auth login
```

→ GitHub.com → HTTPS → Login with a web browser → Google как на сайте.

```cmd
gh auth status
git push github main
```

[gh auth login](https://cli.github.com/manual/gh_auth_login)

---

## Частые ошибки

| Сообщение | Причина | Действие |
|-----------|---------|----------|
| `Authentication failed` + origin.cursor.com | Push в Cursor, не GitHub | `git push github main` + PAT |
| `403` | Нет прав на repo | Token with scope `repo`, аккаунт — owner/collaborator |
| `could not read Username` | Нет сохранённых credentials | PAT при push или `gh auth login` |
| Push OK, Vercel red | Битый lock на GitHub | Commit полного `package-lock.json` |

---

## Видео

[YouTube: github personal access token git push windows](https://www.youtube.com/results?search_query=github+personal+access+token+git+push+windows)

Если UI не совпадает — пришлите скрин `git remote -v` и текст ошибки **без токена**.
