# 💰 Clarity - Gestor de Gastos Personales

Una aplicación web moderna y elegante para gestionar tus gastos personales con estilo Liquid Glass.

![Clarity App](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-10.7-FFCA28?style=for-the-badge&logo=firebase)
![Tailwind](https://img.shields.io/badge/Tailwind-3.3-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Características

### 🔐 Autenticación
- Login con email y contraseña
- Login con Google
- Recuperación de contraseña
- Sesión persistente

### 💸 Gestión de Gastos
- Añadir, editar y eliminar gastos
- Categorías y subcategorías personalizables
- Método de pago (Tarjeta, Efectivo, Transferencia)
- Gastos recurrentes
- Filtrado por mes y categoría

### 📊 Presupuestos
- Establecer presupuestos por categoría
- Alertas cuando superas el 90% del presupuesto
- Visualización con barras de progreso
- Seguimiento en tiempo real

### 📈 Visualización
- Vista de tabla con todos los detalles
- Vista de gráficos con presupuestos
- Exportación a CSV
- Totales mensuales

### 🎨 Diseño
- Interfaz Liquid Glass (glassmorphism)
- Gradientes morado/rosa
- Tema claro optimizado
- Responsive (móvil y desktop)
- Animaciones suaves

### ☁️ Sincronización
- Datos en la nube (Firebase)
- Sincronización en tiempo real
- Acceso desde cualquier dispositivo
- Backup automático

## 🚀 Inicio Rápido

### Requisitos previos
- Node.js 18+ instalado
- Cuenta de Firebase (gratis)
- Git (opcional)

### Instalación

```bash
# 1. Clonar repositorio (o descargar ZIP)
git clone https://github.com/tu-usuario/clarity-app.git
cd clarity-app

# 2. Instalar dependencias
npm install

# 3. Configurar Firebase (ver SETUP.md)
# Crea .env.local con tus credenciales

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en: http://localhost:5173

## 🔧 Configuración

### Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

Ver guía completa en: [GUÍA DE IMPLEMENTACIÓN](./SETUP.md)

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Crea build optimizado
npm run preview      # Previsualiza build

# Linting
npm run lint         # Revisa código con ESLint
```

## 🗂️ Estructura del Proyecto

```
clarity-app/
├── public/              # Archivos estáticos
│   ├── icon-192.png    # Icono PWA pequeño
│   ├── icon-512.png    # Icono PWA grande
│   └── manifest.json   # Configuración PWA
├── src/
│   ├── components/     # Componentes React
│   │   └── Auth.jsx    # Componente de login/registro
│   ├── services/       # Servicios externos
│   │   └── firestoreService.js  # Operaciones BD
│   ├── App.jsx         # Componente principal
│   ├── firebase.js     # Configuración Firebase
│   ├── main.jsx        # Punto de entrada
│   └── index.css       # Estilos globales
├── .env.local          # Variables de entorno (NO subir a Git)
├── .gitignore          # Archivos ignorados por Git
├── package.json        # Dependencias y scripts
├── tailwind.config.js  # Configuración Tailwind
├── vite.config.js      # Configuración Vite
└── README.md           # Este archivo
```

## 🔥 Tecnologías Utilizadas

- **React 18** - Framework de UI
- **Vite** - Build tool y dev server
- **Firebase**
  - Authentication - Gestión de usuarios
  - Firestore - Base de datos NoSQL
- **Tailwind CSS** - Framework de estilos
- **Lucide React** - Iconos
- **JavaScript ES6+** - Lenguaje

## 📱 PWA (Progressive Web App)

Clarity es una PWA instalable:

1. Abre la app en tu navegador móvil
2. Clic en "Añadir a pantalla de inicio"
3. ¡Úsala como app nativa!

Funcionalidades PWA:
- ✅ Instalable en móvil y desktop
- ✅ Icono en pantalla de inicio
- ✅ Funciona offline (próximamente)
- ✅ Notificaciones push (próximamente)

## 🔒 Seguridad

- Autenticación mediante Firebase
- Reglas de seguridad en Firestore
- Datos encriptados en tránsito
- Variables de entorno para secrets
- Solo usuarios autenticados acceden a sus datos

## 🌍 Deployment

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel login
vercel
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Netlify
```bash
npm run build
# Sube la carpeta 'dist' en netlify.com
```

## 📊 Esquema de Base de Datos

```
Firestore Structure:
└── users/
    └── {userId}/
        ├── categories: Object
        ├── budgets: Object
        ├── createdAt: Timestamp
        ├── updatedAt: Timestamp
        └── expenses/
            └── {expenseId}/
                ├── amount: Number
                ├── category: String
                ├── subcategory: String
                ├── date: String
                ├── paymentMethod: String
                ├── recurring: Boolean
                ├── createdAt: Timestamp
                └── updatedAt: Timestamp
```

## 🤝 Contribuir

Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Añadir nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📝 Roadmap

- [x] Autenticación con email/Google
- [x] CRUD de gastos
- [x] Categorías personalizables
- [x] Presupuestos con alertas
- [x] Exportar a CSV
- [x] Sincronización en tiempo real
- [ ] Modo oscuro
- [ ] Gráficos avanzados (Chart.js)
- [ ] Exportar a PDF
- [ ] Gastos compartidos
- [ ] Notificaciones push
- [ ] Funcionalidad offline
- [ ] Importar desde banco (Tink API)
- [ ] App móvil nativa (React Native)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👤 Autor

**Tu Nombre**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- Email: tu@email.com

## 🙏 Agradecimientos

- Diseño inspirado en Liquid Glass
- Firebase por la infraestructura
- Tailwind CSS por los estilos
- Lucide por los iconos

---

⭐ ¡Si te gusta el proyecto, dale una estrella en GitHub!

**Made with 💜 by [Tu Nombre]**