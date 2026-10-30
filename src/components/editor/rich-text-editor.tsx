"use client";

import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { Image as TiptapImage } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Typography } from "@tiptap/extension-typography";
import { Underline } from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

function MenuBar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          editor.chain().focus().setImage({ src: reader.result }).run();
        }
      };
      reader.readAsDataURL(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [editor],
  );

  const addLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addVideo = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Video URL (YouTube, Vimeo, or direct MP4)");
    if (!url) return;
    let embedHtml: string;
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const id =
        url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1] ?? "";
      embedHtml = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%"><iframe src="https://www.youtube.com/embed/${id}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allowfullscreen></iframe></div>`;
    } else if (url.includes("vimeo.com")) {
      const id = url.match(/vimeo\.com\/(\d+)/)?.[1] ?? "";
      embedHtml = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%"><iframe src="https://player.vimeo.com/video/${id}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allowfullscreen></iframe></div>`;
    } else {
      embedHtml = `<video controls style="max-width:100%;border-radius:8px"><source src="${url}" /></video>`;
    }
    editor.chain().focus().insertContent(embedHtml).run();
  }, [editor]);

  if (!editor) return null;

  const btn = (active: boolean) =>
    cn(
      "rounded px-2 py-1 text-xs font-medium transition",
      active
        ? "bg-[var(--color-primary)] text-white"
        : "bg-[var(--color-mist)] hover:bg-[var(--color-secondary)]",
    );

  return (
    <div className="flex flex-wrap gap-1 border-b border-[var(--color-border)] p-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void handleImageUpload(e)}
      />

      <button type="button" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
        B
      </button>
      <button type="button" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}>
        I
      </button>
      <button type="button" className={btn(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        U
      </button>
      <button type="button" className={btn(editor.isActive("strike"))} onClick={() => editor.chain().focus().toggleStrike().run()}>
        S̶
      </button>

      <span className="mx-1 border-l border-[var(--color-border)]" />

      <button type="button" className={btn(editor.isActive("heading", { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </button>
      <button type="button" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </button>
      <button type="button" className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </button>

      <span className="mx-1 border-l border-[var(--color-border)]" />

      <button type="button" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • List
      </button>
      <button type="button" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. List
      </button>
      <button type="button" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        Quote
      </button>

      <span className="mx-1 border-l border-[var(--color-border)]" />

      <button type="button" className={btn(editor.isActive({ textAlign: "left" }))} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        Left
      </button>
      <button type="button" className={btn(editor.isActive({ textAlign: "center" }))} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        Center
      </button>
      <button type="button" className={btn(editor.isActive({ textAlign: "right" }))} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        Right
      </button>
      <button type="button" className={btn(editor.isActive({ textAlign: "justify" }))} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
        Justify
      </button>

      <span className="mx-1 border-l border-[var(--color-border)]" />

      <button type="button" className={btn(editor.isActive("highlight"))} onClick={() => editor.chain().focus().toggleHighlight().run()}>
        Highlight
      </button>
      <button type="button" className={btn(editor.isActive("link"))} onClick={addLink}>
        Link
      </button>
      <button type="button" className={btn(false)} onClick={addImage}>
        Image
      </button>
      <button type="button" className={btn(false)} onClick={addVideo}>
        Video
      </button>

      <span className="mx-1 border-l border-[var(--color-border)]" />

      <button type="button" className={btn(false)} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        — HR
      </button>
      <button type="button" className={btn(editor.isActive("codeBlock"))} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        Code
      </button>

      <span className="mx-1 border-l border-[var(--color-border)]" />

      <button type="button" className={btn(false)} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        Undo
      </button>
      <button type="button" className={btn(false)} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        Redo
      </button>

      <span className="mx-1 border-l border-[var(--color-border)]" />

      <select
        className="rounded bg-[var(--color-mist)] px-2 py-1 text-xs"
        value=""
        onChange={(e) => {
          if (e.target.value) {
            editor.chain().focus().setColor(e.target.value).run();
          }
          e.target.value = "";
        }}
      >
        <option value="">Color</option>
        <option value="#000000">Black</option>
        <option value="#DC2626">Red</option>
        <option value="#2563EB">Blue</option>
        <option value="#16A34A">Green</option>
        <option value="#CA8A04">Gold</option>
        <option value="#9333EA">Purple</option>
        <option value="#6B7280">Gray</option>
      </select>
    </div>
  );
}

export function RichTextEditor({
  content,
  onChange,
  placeholder,
  className,
}: {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TiptapImage.configure({ inline: true, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Write your description here…" }),
      Typography,
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none",
      },
    },
  });

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        className,
      )}
    >
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
