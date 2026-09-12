const PUBLIC_DOCUMENT_MARKER = '/storage/v1/object/public/documents/'

export function isOwnedStoragePath(path: string, userId: string): boolean {
  if (!userId || !path.startsWith(`${userId}/`)) return false
  const objectName = path.slice(userId.length + 1)
  return objectName.length > 0 && !objectName.includes('/') && !path.includes('..') && !path.includes('\\')
}

export function storagePathFromLegacyUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const decodedValue = decodeURIComponent(value)
    if (decodedValue.includes('..') || decodedValue.includes('\\')) return null
    const url = new URL(value)
    const markerIndex = url.pathname.indexOf(PUBLIC_DOCUMENT_MARKER)
    if (markerIndex < 0) return null
    const encodedPath = url.pathname.slice(markerIndex + PUBLIC_DOCUMENT_MARKER.length)
    const path = decodeURIComponent(encodedPath)
    return path && !path.includes('..') && !path.includes('\\') ? path : null
  } catch {
    return null
  }
}

export function resolveStoragePath(storagePath: string | null, legacyUrl: string | null): string | null {
  return storagePath || storagePathFromLegacyUrl(legacyUrl)
}
