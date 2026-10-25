type FormIssue = { path: (string | number)[]; message: string };

export type SubmitSiteFormResult =
  | { ok: true; inquiryId?: string }
  | { ok: false; error: string; issues?: FormIssue[] };

export async function submitSiteForm(form: HTMLFormElement): Promise<SubmitSiteFormResult> {
  const formData = new FormData(form);
  if (!formData.get("category")) {
    const fallback = form.dataset.formCategory;
    if (fallback) {
      formData.set("category", fallback);
    }
  }
  if (!formData.get("pageUrl") && typeof window !== "undefined") {
    formData.set("pageUrl", window.location.href);
  }
  if (formData.get("consent") === "on") {
    formData.set("consent", "true");
  }

  const res = await fetch("/api/forms/submit", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let error = "Could not send. Please try again.";
    let issues: FormIssue[] | undefined;
    try {
      const body = (await res.json()) as {
        error?: string;
        code?: string;
        issues?: { path: (string | number)[]; message: string }[];
      };
      if (body.code === "smtp_not_configured") {
        error =
          "Отправка писем на сервере не настроена (нет SMTP_PASS в Vercel). Администратору: см. docs/smtp-forms-setup-ru.md";
      } else if (body.code === "smtp_send_failed") {
        error =
          "Письмо не удалось отправить через SMTP. Проверьте пароль ящика internal@seaps.asia и настройки Hostinger.";
      } else if (body.error) {
        error = body.error;
      }
      issues = body.issues;
    } catch {
      /* ignore */
    }
    return { ok: false, error, issues };
  }

  const data = (await res.json()) as { inquiry?: { id?: string } };
  return { ok: true, inquiryId: data.inquiry?.id };
}
