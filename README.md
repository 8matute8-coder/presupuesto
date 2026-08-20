# Finanzas360 | Gestor de Gastos y Presupuesto Mensual

Aplicación web moderna para el control de gastos fijos y presupuesto mensual con backend en **Google Firebase** (**Firebase Authentication** + **Cloud Firestore**).

Basada en las metodologías financieras de **Banco Galicia**, **BBVA (Regla 50/30/20)** y **Washington Trust**.

---

## 🔥 Configuración de Backend Firebase (`presu-e7466`)

El proyecto ya está vinculado al proyecto Firebase `presu-e7466` con los siguientes archivos:
- `.firebaserc` (Proyecto por defecto: `presu-e7466`)
- `firebase.json` (Hosting & Firestore)
- `firestore.rules` (Aislamiento de seguridad por usuario)
- `firestore.indexes.json`
- `js/firebase-config.js` (Configuración de Web App)
- `js/firebase-service.js` (Google Sign-in y sincronización en tiempo real)

### Cómo obtener la Web API Key de tu proyecto Firebase:
1. Ingresa a la [Consola de Firebase](https://console.firebase.google.com/project/presu-e7466/overview).
2. Ve a **Configuración del proyecto** ⚙️ (Project Settings) > **General**.
3. En la sección **Tus apps** (Your apps), haz clic en el ícono Web `</>` y registra la app (ej. `Finanzas360 Web`).
4. Copia el objeto `firebaseConfig` que contiene tu `apiKey` y `appId`.
5. En la aplicación web, ve a la pestaña **Configuración & Firebase** y pega tu `API Key` y `App ID`, o edita directamente [`js/firebase-config.js`](file:///C:/Users/RMCor/.gemini/antigravity/scratch/gestor-gastos-mensual/js/firebase-config.js).

### Activar Google Sign-In en Firebase:
1. En la consola de Firebase, ve a **Authentication** > **Sign-in method** (Método de inicio de sesión).
2. Habilita el proveedor **Google** y guarda los cambios.
3. En **Authorized domains** (Dominios autorizados), asegúrate de que figuren:
   - `localhost`
   - `8matute8-coder.github.io` (para cuando esté en GitHub Pages).

### Activar Cloud Firestore:
1. En la consola de Firebase, ve a **Firestore Database** > **Crear base de datos**.
2. Selecciona tu ubicación preferida y el modo producción.
3. En la pestaña **Reglas**, pega el contenido de [`firestore.rules`](file:///C:/Users/RMCor/.gemini/antigravity/scratch/gestor-gastos-mensual/firestore.rules).

---

## 🚀 Subir los cambios a GitHub

```powershell
cd C:\Users\RMCor\.gemini\antigravity\scratch\gestor-gastos-mensual
git add .
git commit -m "feat: Integracion de Firebase Authentication con Google Sign-In y Cloud Firestore"
git push -u origin main
```
