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

1. Браузер → https://github.com → войти через Google.
2. Аватар → **Settings** → **Developer settings** (внизу слева).
3. **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**.
4. Note: например `lox-voice-push-windows`.
5. Expiration: 90 days или No expiration (на ваш риск).
6. Scopes: включить **`repo`** (полный доступ к private/public repos).
7. **Generate token** → **скопировать** (`ghp_...`) — показывают **один раз**.

Документация: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token

---

## Шаг 2 — push по HTTPS с токеном (рекомендуется)

### 2a. Очистить старые неверные credentials (Windows)

1. **Панель управления** → **Диспетчер учётных данных** (Credential Manager).
2. **Учётные данные Windows** → найти `git:https://github.com` или `origin.cursor.com`.
3. **Удалить** устаревшие записи для GitHub/Cursor.

### 2b. Push (токен = пароль)

```cmd
cd /d C:\Users\Administrator\lox-voice
git pull github main
git push github main
```

Запросит:

- **Username** — логин GitHub (например `goropojixoj12-oss`), **не** email Google.
- **Password** — **вставьте токен** `ghp_...`, не пароль.

### 2c. Явный URL

```cmd
git remote set-url github https://github.com/goropojixoj12-oss/lox-voice.git
git push github main
```

---

## Шаг 3 — починка Vercel (полный lock)

```cmd
del package-lock.json
npm install
npm ci
npm run build
git add package-lock.json
git commit -m "fix: restore package-lock.json via git (production)"
git push github main
```

---

## Про origin.cursor.com

Для **Vercel** этот remote **не нужен**. Пушьте **`github`** с **GitHub PAT**. Либо `origin auth login` только если нужно зеркало Cursor.

---

## GitHub CLI

```cmd
gh auth login
gh auth status
git push github main
```
