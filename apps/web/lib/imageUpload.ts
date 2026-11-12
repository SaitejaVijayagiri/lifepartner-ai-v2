export const MAX_PROFILE_PHOTOS = 10;
export const MAX_PHOTO_FILE_BYTES = 20 * 1024 * 1024; // 20MB raw input limit before compression

export interface CompressPhotoOptions {
    maxDim?: number;
    quality?: number;
    maxBytes?: number;
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
    onError?: (fileName: string, reason: string) => void;
}

const resizeImageElement = (img: HTMLImageElement, maxDim: number, quality: number): string | null => {
    try {
        let { width, height } = img;
        if (!width || !height) return null;
        if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0, width, height);
        return canvas.toDataURL('image/jpeg', quality);
    } catch {
        return null;
    }
};

const readAsDataUrlFallback = (file: File): Promise<string | null> =>
    new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });

/**
 * Compresses a single File into a compact JPEG data URL using zero-copy Object URLs first
 * (avoids loading multiple multi-megabyte raw base64 strings simultaneously in mobile WebView RAM).
 */
export async function compressSinglePhoto(
    file: File,
    maxDim = 1080,
    quality = 0.78
): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    const objectUrl = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(file)
        : null;

    if (objectUrl) {
        const result = await new Promise<string | null>((resolve) => {
            const img = new Image();
            let settled = false;
            const finish = (val: string | null) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                try { URL.revokeObjectURL(objectUrl); } catch { /* noop */ }
                resolve(val);
            };
            const timer = setTimeout(() => finish(null), 5000);
            img.onload = () => finish(resizeImageElement(img, maxDim, quality));
            img.onerror = () => finish(null);
            img.src = objectUrl;
        });

        if (result) return result;
    }

    const fallbackDataUrl = await readAsDataUrlFallback(file);
    if (!fallbackDataUrl) return null;

    return new Promise<string>((resolve) => {
        const img = new Image();
        let settled = false;
        const finish = (val: string) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve(val);
        };
        const timer = setTimeout(() => finish(fallbackDataUrl), 4000);
        img.onload = () => {
            const compressed = resizeImageElement(img, maxDim, quality);
            finish(compressed || fallbackDataUrl);
        };
        img.onerror = () => finish(fallbackDataUrl);
        img.src = fallbackDataUrl;
    });
}

/**
 * Compresses up to N image files in small concurrent batches (default 2) so selecting up to
 * 10 mobile camera photos never stalls the main UI thread or spikes WebView memory.
 */
export async function compressProfilePhotos(
    files: File[],
    options: CompressPhotoOptions = {}
): Promise<string[]> {
    const {
        maxDim = 1080,
        quality = 0.78,
        maxBytes = MAX_PHOTO_FILE_BYTES,
        concurrency = 2,
        onProgress,
        onError,
    } = options;

    const validFiles: File[] = [];
    for (const f of files) {
        if (f.size > maxBytes) {
            onError?.(f.name, `"${f.name}" is too large (>20MB).`);
        } else {
            validFiles.push(f);
        }
    }

    const results: string[] = [];
    let completed = 0;

    for (let i = 0; i < validFiles.length; i += concurrency) {
        const batch = validFiles.slice(i, i + concurrency);
        const batchOut = await Promise.all(
            batch.map(async (file) => {
                const compressed = await compressSinglePhoto(file, maxDim, quality);
                completed += 1;
                onProgress?.(completed, validFiles.length);
                if (!compressed) {
                    onError?.(file.name, `Could not process "${file.name}".`);
                }
                return compressed;
            })
        );
        for (const item of batchOut) {
            if (item) results.push(item);
        }
        // Yield a frame between micro-batches so scrolling / UI animations stay smooth
        if (i + concurrency < validFiles.length) {
            await new Promise((r) => setTimeout(r, 0));
        }
    }

    return results;
}
