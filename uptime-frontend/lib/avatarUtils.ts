const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

export function getAvatarUrl(userId: string): string | null {
  if (!userId) return null
  
  // Check if avatar exists by trying to load it
  // This is a simple approach - in production you might want to cache this
  return `${API_BASE_URL}/avatars/${userId}.jpg`
}

export function getAvatarUrlWithFallback(userId: string): string | null {
  const avatarUrl = getAvatarUrl(userId)
  if (!avatarUrl) return null
  
  // You could add additional logic here to check if the avatar actually exists
  // For now, we'll return the URL and let the browser handle 404s
  return avatarUrl
}

export function isValidAvatarUrl(url: string | null): boolean {
  if (!url) return false
  return url.startsWith('http') || url.startsWith('/api/avatars/')
}
