export const config = {
  authUrl: window.__APP_CONFIG__?.authUrl || import.meta.env.VITE_AUTH_URL || 'http://localhost:3001',
  activitiesUrl:
    window.__APP_CONFIG__?.activitiesUrl || import.meta.env.VITE_ACTIVITIES_URL || 'http://localhost:3002',
  wsUrl: window.__APP_CONFIG__?.wsUrl || import.meta.env.VITE_WS_URL || 'http://localhost:3002',
};

export function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${config.activitiesUrl}${path}`;
}
