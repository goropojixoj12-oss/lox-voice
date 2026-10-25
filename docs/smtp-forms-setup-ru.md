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

3. Сохраните и выполните **Redeploy** production.

Официальная справка Hostinger по SMTP: [Email account setup](https://support.hostinger.com/en/articles/1583229-email-account-setup).

## Поведение

- API: `POST /api/forms/submit` (`multipart/form-data`), вложения до 5 MB (CV и файлы форм).
- Без `SMTP_PASS` форма вернёт **503** — письмо не отправится.
- Пустые формы и отправка без валидного **Email** блокируются на клиенте и на сервере.

## Проверка

После redeploy отправьте тест с страницы [Contact](/contact) с реальным email. На `ceo@seaps.asia` должно прийти письмо с темой `Contact page`.

Если что-то не совпадает с панелью Hostinger — пришлите скрин настроек SMTP, подскажем следующий шаг.
