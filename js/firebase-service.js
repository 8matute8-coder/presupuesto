/**
 * firebase-service.js - Autenticación con Google y sincronización en tiempo real con Cloud Firestore
 */

class FirebaseService {
  static app = null;
  static auth = null;
  static db = null;
  static currentUser = null;
  static isInitialized = false;
  static unsubscribeSnapshot = null;
  static syncStatus = 'offline'; // 'offline', 'connecting', 'synced', 'syncing', 'error'
  static onStatusChangeCallback = null;

  static init() {
    try {
      if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK no está cargado en el documento.');
        this.updateStatus('offline');
        return false;
      }

      const config = FirebaseConfigManager.getConfig();

      // Si ya está inicializado, no duplicar
      if (!firebase.apps.length) {
        this.app = firebase.initializeApp(config);
      } else {
        this.app = firebase.app();
      }

      this.auth = firebase.auth();
      this.db = firebase.firestore();

      // Habilitar persistencia offline en Firestore si está disponible
      try {
        this.db.enablePersistence({ synchronizeTabs: true }).catch(err => {
          if (err.code === 'failed-precondition') {
            console.warn('Persistencia de Firestore: múltiples pestañas abiertas');
          } else if (err.code === 'unimplemented') {
            console.warn('Persistencia de Firestore no soportada en este navegador');
          }
        });
      } catch (e) {
        // Ignorar si ya está inicializado
      }

      this.isInitialized = true;
      this.listenAuthState();
      return true;
    } catch (error) {
      console.error('Error inicializando Firebase:', error);
      this.updateStatus('error');
      return false;
    }
  }

  static updateStatus(status) {
    this.syncStatus = status;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status, this.currentUser);
    }
  }

  static listenAuthState() {
    if (!this.auth) return;

    this.auth.onAuthStateChanged(async (user) => {
      this.currentUser = user;
      if (user) {
        this.updateStatus('connecting');
        console.log(`Usuario autenticado: ${user.displayName} (${user.email})`);
        UIManager.showToast(`Bienvenido, ${user.displayName || user.email}`, 'info');
        // Iniciar escucha en tiempo real de Firestore
        this.startFirestoreListener(user.uid);
      } else {
        console.log('Usuario no autenticado (Modo local)');
        if (this.unsubscribeSnapshot) {
          this.unsubscribeSnapshot();
          this.unsubscribeSnapshot = null;
        }
        this.updateStatus('offline');
      }
      UIManager.updateAuthUI(user);
    });
  }

  /**
   * Inicio de sesión con Google (Popup con fallback a Redirect)
   */
  static async loginWithGoogle() {
    if (!this.isInitialized) {
      const ok = this.init();
      if (!ok) {
        UIManager.showToast('Configura tu API Key de Firebase en Configuración para iniciar sesión', 'warning');
        return;
      }
    }

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      this.updateStatus('connecting');
      const result = await this.auth.signInWithPopup(provider);
      return result.user;
    } catch (error) {
      console.error('Error en signInWithPopup:', error);
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        try {
          const provider = new firebase.auth.GoogleAuthProvider();
          await this.auth.signInWithRedirect(provider);
        } catch (redirectErr) {
          console.error('Error en signInWithRedirect:', redirectErr);
          UIManager.showToast('Error al autenticar con Google: ' + redirectErr.message, 'error');
        }
      } else if (error.code === 'auth/api-key-not-valid' || error.code === 'auth/invalid-api-key') {
        UIManager.showToast('La API Key de Firebase no es válida. Revisa la pestaña de Configuración.', 'error');
      } else {
        UIManager.showToast('Error al iniciar sesión: ' + error.message, 'error');
      }
      this.updateStatus('offline');
    }
  }

  /**
   * Cierre de sesión
   */
  static async logout() {
    if (!this.auth) return;
    try {
      await this.auth.signOut();
      UIManager.showToast('Sesión cerrada. Los datos se mantienen en modo local.', 'info');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      UIManager.showToast('Error al cerrar sesión', 'error');
    }
  }

  /**
   * Escucha en tiempo real de los datos del usuario en Cloud Firestore
   */
  static startFirestoreListener(uid) {
    if (!this.db) return;

    const userDocRef = this.db.collection('users').doc(uid).collection('data').doc('budget_v1');

    this.unsubscribeSnapshot = userDocRef.onSnapshot(async (doc) => {
      if (doc.exists) {
        const cloudData = doc.data();
        console.log('Datos recibidos en tiempo real desde Firestore:', cloudData);

        // Actualizar almacenamiento local con los datos de la nube
        if (cloudData.fixedExpenses) StorageManager.saveFixedExpenses(cloudData.fixedExpenses);
        if (cloudData.incomeConfig) StorageManager.saveIncomeConfig(cloudData.incomeConfig);
        if (cloudData.transactions) StorageManager.saveTransactions(cloudData.transactions);
        if (cloudData.debts) StorageManager.saveDebts(cloudData.debts);
        if (cloudData.goals) StorageManager.saveGoals(cloudData.goals);
        if (cloudData.config) StorageManager.saveConfig(cloudData.config);

        this.updateStatus('synced');
        UIManager.refreshCurrentView();
      } else {
        // Primera vez del usuario en la nube: migrar los datos locales a Firestore
        console.log('Creando documento inicial en Firestore con datos locales...');
        await this.syncToFirestore();
      }
    }, (error) => {
      console.error('Error en listener de Firestore:', error);
      this.updateStatus('error');
    });
  }

  /**
   * Sube los datos locales actuales a Cloud Firestore
   */
  static async syncToFirestore() {
    if (!this.currentUser || !this.db) return;

    try {
      this.updateStatus('syncing');
      const payload = {
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        userId: this.currentUser.uid,
        userEmail: this.currentUser.email,
        userName: this.currentUser.displayName,
        incomeConfig: StorageManager.getIncomeConfig(),
        fixedExpenses: StorageManager.getFixedExpenses(),
        transactions: StorageManager.getTransactions(),
        debts: StorageManager.getDebts(),
        goals: StorageManager.getGoals(),
        config: StorageManager.getConfig()
      };

      const userDocRef = this.db.collection('users').doc(this.currentUser.uid).collection('data').doc('budget_v1');
      await userDocRef.set(payload, { merge: true });
      this.updateStatus('synced');
    } catch (error) {
      console.error('Error guardando en Firestore:', error);
      this.updateStatus('error');
      if (error.code === 'permission-denied') {
        UIManager.showToast('Permiso denegado en Firestore. Revisa las reglas de seguridad.', 'warning');
      }
    }
  }

  /**
   * Hook para llamar tras cualquier modificación local de datos
   */
  static triggerAutoSync() {
    if (this.currentUser) {
      this.syncToFirestore();
    }
  }
}
