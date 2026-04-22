/** Maps file extensions to a semantic category used for icon selection */
export type FileCategory =
  | "folder"
  | "word"
  | "excel"
  | "powerpoint"
  | "pdf"
  | "image"
  | "video"
  | "audio"
  | "archive"
  | "code"
  | "text"
  | "generic";

const EXTENSION_MAP: Record<string, FileCategory> = {
  // Word
  doc: "word",
  docx: "word",
  odt: "word",
  rtf: "word",
  // Excel
  xls: "excel",
  xlsx: "excel",
  csv: "excel",
  ods: "excel",
  // PowerPoint
  ppt: "powerpoint",
  pptx: "powerpoint",
  odp: "powerpoint",
  // PDF
  pdf: "pdf",
  // Images
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  svg: "image",
  webp: "image",
  bmp: "image",
  ico: "image",
  tiff: "image",
  tif: "image",
  // Video
  mp4: "video",
  mov: "video",
  avi: "video",
  mkv: "video",
  webm: "video",
  wmv: "video",
  // Audio
  mp3: "audio",
  wav: "audio",
  flac: "audio",
  aac: "audio",
  ogg: "audio",
  // Archive
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
  // Code
  js: "code",
  ts: "code",
  jsx: "code",
  tsx: "code",
  py: "code",
  java: "code",
  cs: "code",
  cpp: "code",
  c: "code",
  html: "code",
  css: "code",
  json: "code",
  xml: "code",
  sql: "code",
  sh: "code",
  // Text
  txt: "text",
  md: "text",
  log: "text",
};

export function getFileCategory(name: string, isFolder?: boolean): FileCategory {
  if (isFolder) return "folder";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MAP[ext] ?? "generic";
}
