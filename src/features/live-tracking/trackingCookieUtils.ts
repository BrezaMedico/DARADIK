export interface TicketBookmarkItem {
  ticketCode: string;
  schoolName: string;
  schoolNpsn?: string;
  category: string;
  createdAt?: string;
}

export interface PendingReplyFile {
  id: string;
  name: string;
  sizeFormatted: string;
  blob: Blob;
  previewUrl?: string;
}

export const TRACKED_COOKIE_KEY = 'daradik_tracked_tickets';

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setCookie(name: string, value: string, days: number = 60) {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(
    value
  )};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

// Reads locally bookmarked ticket codes; live status is always queried from Supabase.
export function readTicketBookmarksFromCookie(): TicketBookmarkItem[] {
  try {
    const raw = getCookie(TRACKED_COOKIE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => String(item?.ticketCode || '').trim().startsWith('CHK-'))
      .map((item) => ({
        ticketCode: String(item.ticketCode).trim(),
        schoolName: String(item.schoolName || 'Sekolah Terlapor'),
        schoolNpsn: item.schoolNpsn ? String(item.schoolNpsn) : undefined,
        category: String(item.category || 'Laporan Pengaduan'),
        createdAt: String(item.createdAt || item.createdAtRaw || item.date || ''),
      }));
  } catch {
    return [];
  }
}

export function writeTicketBookmarkToCookie(bookmark: TicketBookmarkItem) {
  try {
    const current = readTicketBookmarksFromCookie();
    const next = [
      bookmark,
      ...current.filter((b) => b.ticketCode !== bookmark.ticketCode),
    ].slice(0, 12);
    setCookie(TRACKED_COOKIE_KEY, JSON.stringify(next), 60);
  } catch {}
}

// Re-encodes image attachments on a canvas to strip EXIF and GPS metadata before upload.
export function compressReplyAttachment(file: File): Promise<PendingReplyFile> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        sizeFormatted: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        blob: file,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIM = 1280;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({
                  id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  name: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                  sizeFormatted: `${Math.max(1, Math.round(blob.size / 1024))} KB`,
                  blob,
                  previewUrl: URL.createObjectURL(blob),
                });
              } else {
                resolve({
                  id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  name: file.name,
                  sizeFormatted: `${Math.max(1, Math.round(file.size / 1024))} KB`,
                  blob: file,
                });
              }
            },
            'image/jpeg',
            0.78
          );
        } else {
          resolve({
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            sizeFormatted: `${Math.max(1, Math.round(file.size / 1024))} KB`,
            blob: file,
          });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
