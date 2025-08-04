/**
 * 画像最適化ユーティリティ
 */

/**
 * 画像のアスペクト比を保持してリサイズ
 * @param file 元の画像ファイル
 * @param maxWidth 最大幅
 * @param maxHeight 最大高さ
 * @param quality 品質（0-1）
 * @returns 最適化された画像ファイル
 */
export const resizeImage = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // アスペクト比を保持してリサイズ
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            resolve(file); // リサイズに失敗した場合は元のファイルを返す
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * 画像の品質を最適化
 * @param file 元の画像ファイル
 * @param quality 品質（0-1）
 * @returns 最適化された画像ファイル
 */
export const optimizeImageQuality = (
  file: File,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx?.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(optimizedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * 画像の適切なサイズを計算
 * @param originalWidth 元の幅
 * @param originalHeight 元の高さ
 * @param maxWidth 最大幅
 * @param maxHeight 最大高さ
 * @returns 最適化されたサイズ
 */
export const calculateOptimalSize = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let { width, height } = { width: originalWidth, height: originalHeight };

  if (width > height) {
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }
  }

  return { width: Math.round(width), height: Math.round(height) };
};

/**
 * 画像ファイルのサイズを取得（MB単位）
 * @param file 画像ファイル
 * @returns ファイルサイズ（MB）
 */
export const getFileSizeInMB = (file: File): number => {
  return file.size / (1024 * 1024);
};

/**
 * 画像ファイルが適切なサイズかチェック
 * @param file 画像ファイル
 * @param maxSizeMB 最大サイズ（MB）
 * @returns 適切なサイズかどうか
 */
export const isImageSizeAppropriate = (
  file: File,
  maxSizeMB: number = 5
): boolean => {
  return getFileSizeInMB(file) <= maxSizeMB;
};
