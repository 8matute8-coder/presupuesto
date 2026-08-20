/**
 * firebase-config.js - Configuración oficial de Firebase para el proyecto presu-e7466
 */

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCqjzVDeCDXG5UvRhDrKDYRuYRwPcazHVc",
  authDomain: "presu-e7466.firebaseapp.com",
  projectId: "presu-e7466",
  storageBucket: "presu-e7466.firebasestorage.app",
  messagingSenderId: "793889321904",
  appId: "1:793889321904:web:658e9ef1acb3b6505d1c75"
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
