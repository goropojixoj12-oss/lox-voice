"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { AdminTask } from "@/lib/admin-types";

export function AdminTaskPanel({ staffId, staffName }: { staffId: string; staffName: string }) {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const q = new URLSearchParams({ staffId });
    const res = await fetch(`/api/admin/tasks?${q}`);
    const data = (await res.json()) as { items?: AdminTask[] };
    setTasks(data.items ?? []);
  }, [staffId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTask() {
    if (title.trim().length < 3) {
      setError("Task title is required.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assigneeStaffId: staffId,
        title: title.trim(),
        body: body.trim(),
        dueDate: dueDate || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not create task.");
      return;
    }
    setTitle("");
    setBody("");
    setDueDate("");
    await load();
  }

  async function setStatus(taskId: string, status: AdminTask["status"]) {
    await fetch(`/api/admin/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="text-sm font-semibold">Tasks for {staffName}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {tasks.length === 0 ? (
          <li className="text-[var(--color-muted)]">No tasks assigned.</li>
        ) : (
          tasks.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2"
            >
              <div>
                <p className="font-medium">{t.title}</p>
                {t.body ? <p className="text-[var(--color-muted)]">{t.body}</p> : null}
                <p className="text-xs text-[var(--color-muted)]">
                  {t.status.replace("_", " ")}
                  {t.dueDate ? ` · due ${t.dueDate}` : ""}
                </p>
              </div>
              <div className="flex gap-1">
                {t.status !== "done" ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => void setStatus(t.id, "done")}>
                    Done
                  </Button>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>

      <div className="mt-4 grid gap-2 border-t border-[var(--color-border)] pt-4">
        <Label htmlFor="task-title">New task</Label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Upload signed contract"
        />
        <Textarea
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Instructions for the agent…"
        />
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
        <Button type="button" size="sm" disabled={busy} onClick={() => void createTask()}>
          Assign task
        </Button>
      </div>
    </div>
  );
}
