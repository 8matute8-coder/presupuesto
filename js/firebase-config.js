/**
 * firebase-config.js - Configuración de Firebase para el proyecto presu-e7466
 */

const FIREBASE_CONFIG_STORAGE_KEY = 'finanzas360_firebase_config';

// Configuración base para el proyecto presu-e7466
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD-DEFAULT-REPLACE-IN-SETTINGS", // Reemplazable desde la pestaña de Configuración o consola Firebase
  authDomain: "presu-e7466.firebaseapp.com",
  projectId: "presu-e7466",
  storageBucket: "presu-e7466.firebasestorage.app",
  messagingSenderId: "389274920194",
  appId: "1:389274920194:web:9a8b7c6d5e4f3a2b1c0d"
};

class FirebaseConfigManager {
  static getConfig() {
    try {
      const custom = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
      if (custom) {
        return { ...DEFAULT_FIREBASE_CONFIG, ...JSON.parse(custom) };
      }
    } catch (e) {
      console.warn('Error reading custom Firebase config:', e);
    }
    return DEFAULT_FIREBASE_CONFIG;
  }

  static saveConfig(newConfig) {
    try {
      localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
      return true;
    } catch (e) {
      console.error('Error saving Firebase config:', e);
      return false;
    }
  }

  static resetConfig() {
    localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
  }
}
