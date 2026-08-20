# Finanzas360 | Gestor de Gastos y Presupuesto Mensual

Aplicación web moderna, responsiva y autónoma (Single Page Application) diseñada para llevar el control de los gastos del mes, presupuestar de forma inteligente y optimizar tu salud financiera.

El diseño y la lógica de esta aplicación fueron construidos integrando las metodologías de tres referencias financieras líderes:
1. **Banco Galicia**: [Finanzas personales en 3 simples pasos](https://www.galicia.ar/personas/educacion-financiera/finanzas-personales-en-3-simples-pasos)
2. **BBVA**: [La regla 50/30/20: una fórmula sencilla para lograr ahorrar y controlar gastos](https://www.bbva.com/es/salud-financiera/la-regla-50-30-20-una-formula-sencilla-para-lograr-ahorrar-y-controlar-gastos/)
3. **Washington Trust**: [7 easy ways to organize your finances](https://www.washtrust.com/es/blog/7-easy-ways-to-organize-your-finances)

---

## 🚀 Características Principales

- 📊 **Panel de Control Integral (Dashboard)**:
  - Monitoreo en tiempo real de Ingresos, Gastos y Saldo Disponible.
  - **Score de Salud Financiera (0 a 100)** con diagnóstico y recomendaciones dinámicas.
  - Termómetros visuales de la **Regla 50/30/20** con alertas tempranas.
  - Widget de próximos vencimientos de facturas.
- 💸 **Registro de Movimientos**:
  - Clasificación ágil de gastos e ingresos: *Necesidad (50%)*, *Deseo (30%)* y *Ahorro/Deuda (20%)*.
  - Búsqueda en tiempo real, filtros por categoría y periodo.
- ⚖️ **Módulo Regla 50/30/20 (BBVA)**:
  - Comparativa de presupuesto ideal vs. gasto real con gráficos de barras interactivos.
  - Calculadora y simulador de distribución para cualquier ingreso neto.
- 🪜 **Módulo 3 Pasos (Banco Galicia)**:
  - **Paso 1**: Presupuesto base y balance de flujo de caja.
  - **Paso 2**: Plan de desendeudamiento con selección de estrategia (**Método Bola de Nieve** vs. **Método Avalancha**) y simulador de amortización.
  - **Paso 3**: Metas de Ahorro y Fondo de Emergencia con cálculo de cuota mensual sugerida y fecha límite.
- 📅 **Facturas & Organización (Washington Trust)**:
  - Agenda y control de vencimientos con estados (*Pagado*, *Pendiente*, *Vencido*, *Vence pronto*).
  - Calculadora "Págate a ti primero" (automatización del ahorro al momento del cobro).
- 📈 **Analítica y Reportes**:
  - Gráfico Donut de gastos por categoría (Chart.js).
  - Gráfico de línea con curva de gasto acumulado diario.
  - Exportación de reportes a **CSV** para Excel o Google Sheets.
- 💾 **Privacidad y Respaldos**:
  - 100% privado en `localStorage` (sin base de datos externa ni registro de cuentas).
  - Descarga y restauración de copias de seguridad completas en **JSON**.
  - Soporte de modo oscuro/claro y múltiples monedas ($ ARS, USD, EUR, etc.).

---

## 🌐 Cómo Publicar en GitHub Pages

El repositorio está listo para alojarse gratuitamente en GitHub Pages.

### Paso 1: Subir los cambios a GitHub con Git
Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
# 1. Inicializar repositorio git (si no está inicializado)
git init

# 2. Agregar los archivos
git add .

# 3. Realizar el primer commit
git commit -m "feat: Lanzamiento de Finanzas360 - Gestor de gastos y presupuesto"

# 4. Vincular con tu repositorio remoto en GitHub
git branch -M main
git remote add origin https://github.com/8matute8-coder/presupuesto.git

# 5. Subir a GitHub
git push -u origin main --force
```

### Paso 2: Activar GitHub Pages en el Repositorio
1. Dirígete a tu repositorio: `https://github.com/8matute8-coder/presupuesto`
2. Haz clic en la pestaña **Settings** (Configuración) en la parte superior.
3. En el menú lateral izquierdo, haz clic en **Pages**.
4. En la sección **Build and deployment > Source**, selecciona **Deploy from a branch**.
5. En **Branch**, selecciona `main` y la carpeta `/ (root)`, luego haz clic en **Save**.
6. ¡Listo! En 1 a 2 minutos tu web estará activa en:
   👉 `https://8matute8-coder.github.io/presupuesto/`

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 & CSS3 semántico**
- **Tailwind CSS (CDN)**
- **JavaScript Moderno (ES6+ modular)**
- **Chart.js** (Gráficos interactivos)
- **Lucide Icons** (Iconografía limpia)
- **Local Storage API** (Persistencia en el navegador)
