import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gofolyx.admin',
  appName: 'GoFolyX Admin',
  webDir: 'dist',
  // hostname: 'gofolyx.com' a été tenté puis retiré — ça fait passer TOUTES
  // les requêtes (y compris /api/*) par l'interception locale de fichiers
  // Capacitor (WebViewAssetLoader), pas seulement les assets statiques.
  // Résultat : POST /auth/login recevait du HTML local (index.html) au lieu
  // d'atteindre le vrai backend. Le hostname par défaut (localhost) reste
  // donc nécessaire — voir CORS_ORIGINS côté backend qui l'autorise.
};

export default config;
