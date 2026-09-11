/**
 * Waply File Security & Anti-Malware / Anti-Injection Validation Utility
 * Protects server and clients from malicious scripts, executables, and injection vectors.
 */

// Explicit blocklist of dangerous extensions (Executable, Shell, Scripting, Macros, Web Shells)
export const DANGEROUS_EXTENSIONS = new Set<string>([
  // Windows & DOS Executables / Batch
  ".bat",
  ".cmd",
  ".exe",
  ".com",
  ".scr",
  ".pif",
  ".msi",
  ".msp",
  ".hta",
  ".cpl",
  ".gadget",
  ".msc",
  ".inf",
  ".ins",
  ".isu",
  ".job",
  ".jse",
  ".vbs",
  ".vbe",
  ".ws",
  ".wsf",
  ".wsh",
  ".reg",
  ".rgs",
  ".sct",
  ".shb",
  ".shs",
  ".u3p",

  // Unix / Linux / Mac Shells & Binaries
  ".sh",
  ".bash",
  ".zsh",
  ".csh",
  ".ksh",
  ".bin",
  ".command",
  ".action",
  ".app",
  ".pkg",
  ".deb",
  ".rpm",
  ".dmg",
  ".dylib",
  ".so",
  ".elf",

  // Scripting Engines & Code Executables
  ".ps1",
  ".psm1",
  ".psd1",
  ".ps1xml",
  ".ps2",
  ".psc1",
  ".psc2",
  ".py",
  ".pyw",
  ".pyc",
  ".pyo",
  ".pyd",
  ".rb",
  ".rbw",
  ".pl",
  ".pm",
  ".cgi",
  ".tcl",
  ".lua",
  ".jar",
  ".class",
  ".jsp",
  ".jspx",
  ".war",
  ".ear",

  // Web Scripts & Server-side execution
  ".php",
  ".php3",
  ".php4",
  ".php5",
  ".phtml",
  ".phps",
  ".phar",
  ".asp",
  ".aspx",
  ".axd",
  ".asx",
  ".ashx",
  ".asmx",
  ".cer",
  ".asa",
  ".cfm",
  ".cfml",

  // Javascript / Typescript / Source Executables
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",

  // Dangerous system / hidden / config formats
  ".lnk",
  ".url",
  ".dll",
  ".sys",
  ".drv",
  ".ocx",
  ".vxd",
  ".iso",
  ".img",
  ".vhd",
  ".vhdx",
  ".htaccess",
  ".htpasswd",
  ".env",
]);

// Whitelist of allowed MIME categories & safe extensions for support attachments
export const ALLOWED_EXTENSIONS = new Set<string>([
  // Images
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".tiff",
  ".svg",

  // Documents & Office
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".ppt",
  ".pptx",
  ".txt",
  ".rtf",
  ".log",
  ".json",
  ".xml",
  ".md",

  // Safe Archives
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
]);

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
  extension?: string;
  isImage?: boolean;
}

export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 Megabytes

/**
 * Validates a file name and size for security hazards.
 */
export function validateAttachmentFile(fileName: string, fileSize: number, mimeType?: string): FileValidationResult {
  if (!fileName || typeof fileName !== "string" || fileName.trim() === "") {
    return { valid: false, error: "Nama file tidak valid." };
  }

  // Check file size
  if (fileSize > MAX_FILE_SIZE) {
    return { valid: false, error: "Ukuran file melebihi batas maksimal 15 MB." };
  }

  if (fileSize <= 0) {
    return { valid: false, error: "File kosong (0 bytes)." };
  }

  // Remove dangerous path traversal characters and null bytes
  const sanitized = fileName
    .replace(/\0/g, "")
    .replace(/[\\\/:*?"<>|]/g, "_")
    .replace(/\.\.+/g, ".")
    .trim();

  const lowerName = sanitized.toLowerCase();

  // Extract all extensions to prevent double extension attacks (e.g., invoice.pdf.exe, exploit.bat.png)
  const segments = lowerName.split(".");
  if (segments.length < 2) {
    return { valid: false, error: "File wajib memiliki ekstensi yang valid." };
  }

  // Check every segment from the second one onward
  for (let i = 1; i < segments.length; i++) {
    const extCandidate = `.${segments[i]}`;
    if (DANGEROUS_EXTENSIONS.has(extCandidate)) {
      return {
        valid: false,
        error: `Ekstensi file "${extCandidate}" dilarang demi keamanan sistem (anti-malware & anti-injection).`,
      };
    }
  }

  // Check primary extension (last segment)
  const primaryExt = `.${segments[segments.length - 1]}`;
  if (!ALLOWED_EXTENSIONS.has(primaryExt)) {
    return {
      valid: false,
      error: `Format file "${primaryExt}" tidak didukung. Harap unggah gambar, PDF, dokumen, log, atau arsip zip.`,
    };
  }

  // Block dangerous mime types
  if (mimeType) {
    const lowerMime = mimeType.toLowerCase();
    if (
      lowerMime.includes("javascript") ||
      lowerMime.includes("x-sh") ||
      lowerMime.includes("x-bat") ||
      lowerMime.includes("x-msdos-program") ||
      lowerMime.includes("x-executable") ||
      lowerMime.includes("x-php")
    ) {
      return { valid: false, error: "Tipe MIME file terdeteksi berbahaya." };
    }
  }

  const isImage = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg"].includes(primaryExt);

  return {
    valid: true,
    sanitizedName: sanitized,
    extension: primaryExt,
    isImage,
  };
}
