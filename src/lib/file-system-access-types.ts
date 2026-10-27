/** Minimal File System Access API shapes for browsers that support directory picking. */
export type SeapsDirectoryHandle = {
  kind: "directory";
  name: string;
  queryPermission(descriptor: { mode: "read" | "readwrite" }): Promise<PermissionState>;
  requestPermission(descriptor: { mode: "read" | "readwrite" }): Promise<PermissionState>;
  values(): AsyncIterable<FileSystemHandle>;
};

export type SeapsWindowWithDirectoryPicker = Window & {
  showDirectoryPicker(options?: {
    mode?: "read" | "readwrite";
    id?: string;
  }): Promise<SeapsDirectoryHandle>;
};

export function getDirectoryPickerWindow(
  value: Window & typeof globalThis,
): SeapsWindowWithDirectoryPicker | null {
  if (!("showDirectoryPicker" in value)) return null;
  return value as SeapsWindowWithDirectoryPicker;
}
