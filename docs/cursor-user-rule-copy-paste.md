# Глобальное правило Cursor (все проекты на вашем аккаунте)

Правила в папке **`.cursor/rules/`** этого репозитория действуют **только в этом проекте**.  
Чтобы одно и то же правило работало **во всех чатах и во всех репозиториях** на вашем аккаунте Cursor, добавьте его в **User Rules** (пользовательские правила).

> **Важно:** из кода или из репозитория нельзя автоматически «прикрепить» правило к чужим аккаунтам Cursor. Каждый пользователь вставляет текст ниже **сам** в настройках своего аккаунта.

---

## Как открыть User Rules (пошагово)

1. Откройте **Cursor**.
2. Откройте настройки:
   - **Windows/Linux:** меню **File → Preferences → Cursor Settings**  
     или сочетание **Ctrl + ,** (запятая), затем перейдите в раздел Cursor.
   - **macOS:** **Cursor → Settings → Cursor Settings**  
     или **Cmd + ,**.
3. В левой панели найдите раздел **Rules** (или **Rules, Memories, Commands**).
4. Откройте вкладку **User Rules** (не «Project Rules»).
5. Нажмите **Add rule** / **+** или вставьте текст в существующее поле правил пользователя.
6. Скопируйте блок **«Текст для вставки»** ниже целиком, вставьте, сохраните (настройки обычно сохраняются автоматически).
7. **Ожидаемый результат:** новые и существующие чаты во **всех** проектах будут учитывать это правило (может понадобиться начать новый чат).

### Видео и документация (если интерфейс отличается)

- Поиск на YouTube: [cursor user rules setup](https://www.youtube.com/results?search_query=cursor+user+rules+setup)
- Поиск на YouTube: [cursor rules how to add](https://www.youtube.com/results?search_query=cursor+ide+rules+how+to+add)
- Документация Cursor (правила): [https://docs.cursor.com/context/rules](https://docs.cursor.com/context/rules)

Если что-то не совпадает с вашим экраном — **вставьте скриншот** настроек в чат; ассистент подскажет, куда нажать дальше.

---

## Текст для вставки (скопируйте всё между линиями)

```
When you ask me to perform any manual step outside the codebase (Vercel, GitHub, GitLab, Netlify, env vars, DNS, OAuth, deploy, billing, Cursor settings, etc.), ALWAYS give full detailed instructions:

1. Numbered steps — what to open, what to click, what to type, what to save.
2. Expected result after each major step (what I should see on screen).
3. Links to official documentation for that exact feature.
4. If you cannot provide a screenshot: include at least one YouTube search URL (https://www.youtube.com/results?search_query=...) or a specific tutorial link for that task.
5. Offer to interpret screenshots I paste if my UI looks different.

Use my language when I write in that language (e.g. Russian instructions when I write in Russian).
Do not give vague one-liners like "set the env var in Vercel" without navigation steps.
```

---

## Дублирование в этом репозитории

В этом проекте то же требование уже зафиксировано в файле:

`.cursor/rules/detailed-user-action-instructions.mdc`

Имеет смысл держать **User Rules** и **project rule** синхронизированными по смыслу, чтобы поведение было одинаковым везде.
