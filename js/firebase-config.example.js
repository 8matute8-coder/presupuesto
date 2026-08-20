/**
 * firebase-config.example.js - Plantilla pública para GitHub
 * 
 * Para configurar en local:
 * 1. Copia este archivo como js/firebase-config.js (ignorado por git)
 * 2. O ingresa tus claves en la pestaña 'Configuración & Firebase' dentro de la aplicación.
 */

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "presu-e7466.firebaseapp.com",
  projectId: "presu-e7466",
  storageBucket: "presu-e7466.firebasestorage.app",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

class FirebaseConfigManager {
  static getConfig() {
    try {
      const custom = localStorage.getItem('finanzas360_firebase_config');
      if (custom) {
        return { ...DEFAULT_FIREBASE_CONFIG, ...JSON.parse(custom) };
      }
    } catch (e) {
      console.warn('Error leyendo configuración de Firebase:', e);
    }
    return DEFAULT_FIREBASE_CONFIG;
  }

  static saveConfig(newConfig) {
    try {
      localStorage.setItem('finanzas360_firebase_config', JSON.stringify(newConfig));
      return true;
    } catch (e) {
      console.error('Error guardando configuración de Firebase:', e);
      return false;
    }
  }

  static resetConfig() {
    localStorage.removeItem('finanzas360_firebase_config');
  }
}
