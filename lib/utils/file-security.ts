import { recordFileUploadBlocked } from "@/lib/utils/security-monitor";

// ファイルアップロードセキュリティ設定
export const FILE_SECURITY_CONFIG = {
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ] as const,

  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB

  // 危険なファイル拡張子（アップロード禁止）
  DANGEROUS_EXTENSIONS: [
    ".exe",
    ".bat",
    ".cmd",
    ".com",
    ".pif",
    ".scr",
    ".vbs",
    ".js",
    ".jse",
    ".jar",
    ".msi",
    ".dll",
    ".deb",
    ".dmg",
    ".pkg",
    ".rpm",
    ".app",
    ".php",
    ".asp",
    ".aspx",
    ".jsp",
    ".py",
    ".rb",
    ".pl",
    ".sh",
  ] as const,

  // 偽装された危険なMIMEタイプ
  DANGEROUS_MIME_TYPES: [
    "application/x-executable",
    "application/x-msdos-program",
    "application/x-msdownload",
    "application/x-winexe",
    "application/octet-stream",
  ] as const,
} as const;

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedName?: string;
}

export interface SecurityContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * ファイルのセキュリティ検証
 */
export function validateFileUpload(
  file: File,
  securityContext?: SecurityContext
): FileValidationResult {
  // ファイルサイズチェック
  if (file.size > FILE_SECURITY_CONFIG.MAX_FILE_SIZE) {
    // セキュリティ違反を記録
    if (
      securityContext?.userId &&
      securityContext?.ip &&
      securityContext?.userAgent
    ) {
      recordFileUploadBlocked(
        securityContext.userId,
        securityContext.ip,
        securityContext.userAgent,
        file.name,
        `File size too large: ${file.size} bytes`
      );
    }

    return {
      isValid: false,
      error: `ファイルサイズが大きすぎます。${
        FILE_SECURITY_CONFIG.MAX_FILE_SIZE / 1024 / 1024
      }MB以下にしてください。`,
    };
  }

  // ファイルサイズが0の場合
  if (file.size === 0) {
    return {
      isValid: false,
      error: "ファイルが空です。",
    };
  }

  // MIMEタイプチェック
  if (
    !FILE_SECURITY_CONFIG.ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof FILE_SECURITY_CONFIG.ALLOWED_IMAGE_TYPES)[number]
    )
  ) {
    // セキュリティ違反を記録
    if (
      securityContext?.userId &&
      securityContext?.ip &&
      securityContext?.userAgent
    ) {
      recordFileUploadBlocked(
        securityContext.userId,
        securityContext.ip,
        securityContext.userAgent,
        file.name,
        `Unsupported MIME type: ${file.type}`
      );
    }

    return {
      isValid: false,
      error:
        "サポートされていないファイル形式です。JPEG、PNG、GIF、WebPのみアップロード可能です。",
    };
  }

  // 危険なMIMEタイプチェック
  if (
    FILE_SECURITY_CONFIG.DANGEROUS_MIME_TYPES.includes(
      file.type as (typeof FILE_SECURITY_CONFIG.DANGEROUS_MIME_TYPES)[number]
    )
  ) {
    // セキュリティ違反を記録
    if (
      securityContext?.userId &&
      securityContext?.ip &&
      securityContext?.userAgent
    ) {
      recordFileUploadBlocked(
        securityContext.userId,
        securityContext.ip,
        securityContext.userAgent,
        file.name,
        `Dangerous MIME type: ${file.type}`
      );
    }

    return {
      isValid: false,
      error: "このファイル形式はセキュリティ上アップロードできません。",
    };
  }

  // ファイル名のセキュリティチェック
  const sanitizedName = sanitizeFileName(file.name);
  if (!sanitizedName) {
    return {
      isValid: false,
      error: "ファイル名が無効です。",
    };
  }

  // 危険な拡張子チェック
  const extension = getFileExtension(sanitizedName);
  if (
    FILE_SECURITY_CONFIG.DANGEROUS_EXTENSIONS.includes(
      extension as (typeof FILE_SECURITY_CONFIG.DANGEROUS_EXTENSIONS)[number]
    )
  ) {
    return {
      isValid: false,
      error: "この拡張子のファイルはアップロードできません。",
    };
  }

  return {
    isValid: true,
    sanitizedName,
  };
}

/**
 * ファイル名のサニタイゼーション
 */
export function sanitizeFileName(fileName: string): string {
  // 危険な文字を除去
  const sanitized = fileName
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "") // 危険な文字を削除
    .replace(/^\.+/, "") // 先頭のドットを削除
    .replace(/\.+$/, "") // 末尾のドットを削除
    .trim();

  // 長すぎるファイル名を制限
  if (sanitized.length > 100) {
    const extension = getFileExtension(sanitized);
    const nameWithoutExt = sanitized.slice(0, sanitized.lastIndexOf("."));
    return nameWithoutExt.slice(0, 100 - extension.length) + extension;
  }

  return sanitized;
}

/**
 * ファイル拡張子を取得
 */
export function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex > 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

/**
 * セキュアなファイルパス生成
 */
export function generateSecureFilePath(
  userId: string,
  originalFileName: string
): string {
  const sanitizedName = sanitizeFileName(originalFileName);
  const extension = getFileExtension(sanitizedName);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  return `${userId}/${timestamp}_${randomSuffix}${extension}`;
}

/**
 * ファイルの内容をバイト単位で検証（基本的なマジックナンバーチェック）
 */
export async function validateFileContent(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (!arrayBuffer) {
        resolve(false);
        return;
      }

      const uint8Array = new Uint8Array(arrayBuffer.slice(0, 12));
      const hex = Array.from(uint8Array)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // 画像ファイルのマジックナンバーチェック
      const isValidImage =
        hex.startsWith("ffd8ff") || // JPEG
        hex.startsWith("89504e47") || // PNG
        hex.startsWith("47494638") || // GIF
        hex.startsWith("52494646"); // WebP (RIFF format)

      resolve(isValidImage);
    };

    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}
