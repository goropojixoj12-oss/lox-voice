# SMTP для форм SEAPS

Письма с публичных форм отправляются через Hostinger SMTP и доставляются на `ceo@seaps.asia` с адреса `internal@seaps.asia`. Тема письма — **категория страницы** (поле `category` в форме).

## Переменные окружения (Vercel → Production)

1. Откройте [Vercel Dashboard](https://vercel.com/docs/projects/environment-variables) → ваш проект → **Settings** → **Environment Variables**.
2. Добавьте переменные (значения по умолчанию уже в `.env.example`):

| Переменная   | Значение                 |
|-------------|--------------------------|
| `SMTP_HOST` | `smtp.hostinger.com`     |
| `SMTP_PORT` | `465`                    |
| `SMTP_USER` | `internal@seaps.asia`    |
| `SMTP_PASS` | пароль почтового ящика   |
| `SMTP_FROM` | `internal@seaps.asia`    |
| `SMTP_TO`   | `ceo@seaps.asia`         |

3. Для **каждой** переменной отметьте окружение **Production** (и при необходимости Preview). Пустой `SMTP_PASS` или переменная только в Development на проде **не работает**.
4. Сохраните и выполните **Redeploy** production (Deployments → … → Redeploy), иначе новые переменные не подхватятся.

Официальная справка Hostinger по SMTP: [Email account setup](https://support.hostinger.com/en/articles/1583229-email-account-setup).

Документация Vercel по переменным: [Environment Variables](https://vercel.com/docs/projects/environment-variables).

## Поведение

- API: `POST /api/forms/submit` (`multipart/form-data`), вложения до 5 MB (CV и файлы форм).
- Без `SMTP_PASS` API вернёт **503** и `"code":"smtp_not_configured"` — письмо не отправится.
- Неверный пароль / блокировка SMTP → **502** и `"code":"smtp_send_failed"` (детали в логах Vercel → Functions).
- Пустые формы и отправка без валидного **Email** блокируются на клиенте и на сервере.

## Проверка

1. **Без отправки формы** (после redeploy):

   ```bash
   curl -sS https://www.vps1.store/api/forms/submit
   ```

   Ожидается: `{"smtpConfigured":true}`. Если `false` — на production нет `SMTP_PASS`.

2. Тестовая отправка (должна вернуть JSON с `"ok":true`, не 503):

   ```bash
   curl -sS -X POST https://www.vps1.store/api/forms/submit \
     -F 'category=Contact page' \
     -F 'name=Test User' \
     -F 'email=you@example.com' \
     -F 'message=Test message at least ten chars' \
     -F 'consent=on'
   ```

3. Отправьте тест с страницы [Contact](https://www.vps1.store/contact) с реальным email. На `ceo@seaps.asia` должно прийти письмо с темой `Contact page`.

Если после `smtpConfigured:true` письма нет — проверьте спам, добавьте в Vercel `SMTP_FORCE_IPV4=true` и redeploy (иногда помогает на serverless).

Если что-то не совпадает с панелью Hostinger — пришлите скрин настроек SMTP, подскажем следующий шаг.
