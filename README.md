# 💰 Clarity - Gestor de Gastos Personales

> Aplicación moderna de seguimiento de gastos con entrada de voz potenciada por IA

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Inicio Rápido](#-inicio-rápido)
- [Configuración](#-configuración)
- [Scripts Disponibles](#-scripts-disponibles)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Configuración de Firebase](#-configuración-de-firebase)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)
- [Autor](#-autor)

---

## 🎯 Descripción

**Clarity** es una aplicación web completa de gestión de finanzas personales y seguimiento de gastos construida con tecnologías web modernas. Ayuda a los usuarios a gestionar sus gastos, hacer seguimiento de presupuestos y obtener información sobre sus hábitos de gasto a través de una interfaz intuitiva mobile-first.

### Objetivos Clave

- 📱 Proporcionar seguimiento de gastos fluido en móvil y escritorio
- 🎤 Permitir entrada rápida de gastos mediante reconocimiento de voz potenciado por IA
- 📊 Visualizar patrones y tendencias de gasto
- 🔄 Sincronizar datos en tiempo real entre dispositivos
- 💾 Funcionar offline con sincronización automática al conectarse
- 🌓 Soportar temas oscuro y claro

---

## ✨ Características

### Características Principales

- ✅ **Gestión de Gastos**: Operaciones CRUD completas para gastos
- ✅ **Categorías y Subcategorías**: Organiza gastos jerárquicamente
- ✅ **Seguimiento de Presupuestos**: Define y monitoriza presupuestos mensuales con alertas
- ✅ **Gastos Recurrentes**: Automatiza transacciones mensuales recurrentes
- ✅ **Visualización de Datos**: Gráficos y tablas para análisis de gastos
- ✅ **Exportación**: Descarga datos de gastos en formato CSV

### Características Avanzadas

- 🎤 **Entrada por Voz**: Entrada de gastos en lenguaje natural con categorización IA
- 🔄 **Sincronización en Tiempo Real**: Actualizaciones en vivo entre dispositivos vía Firestore
- 📴 **Soporte Offline**: Funcionalidad completa sin conexión a internet
- 🌓 **Modo Oscuro**: Tema oscuro amigable para la vista
- 📱 **PWA**: Instálala como app nativa en iOS/Android
- 🔐 **Autenticación**: Inicio de sesión con Google y email/contraseña
- 📊 **Insights Inteligentes**: Categorización de gastos basada en aprendizaje

---

## 📱 Capturas de Pantalla

### Vista Móvil

```
┌────────────────────┐
│   📊 Dashboard     │
│                    │
│  Total del Mes     │
│    € 1,247.80     │
│                    │
│  [Añadir Gasto]🎤 │
│                    │
│  📊 Alimentación   │
│  ████████░░ 80%    │
│                    │
│  🚗 Transporte     │
│  ██████░░░░ 60%    │
│                    │
│  🎮 Ocio          │
│  ████░░░░░░ 40%    │
└────────────────────┘
```

### Entrada por Voz

```
┌────────────────────┐
│  🎤 Grabando...    │
│                    │
│  "20 en tabaco"    │
│                    │
│  ✓ Detectado:      │
│  20€ → Vicios      │
│  Confianza: 85%    │
│                    │
│  [Confirmar]       │
└────────────────────┘
```

---

## 🛠 Stack Tecnológico

### Frontend

- **React 18**: Framework UI con hooks
- **TypeScript**: Tipado estático (migración gradual desde JS)
- **Tailwind CSS**: Estilos utility-first
- **Wouter**: Routing ligero
- **Zustand**: Gestión de estado
- **Framer Motion**: Animaciones
- **Lucide React**: Librería de iconos

### Backend

- **Firebase Authentication**: Gestión de usuarios
- **Cloud Firestore**: Base de datos NoSQL
- **Cloud Functions**: Automatización serverless
- **Cloud Scheduler**: Cron jobs para gastos recurrentes

### Desarrollo

- **Vite**: Herramienta de build y servidor de desarrollo
- **Cursor**: IDE potenciado por IA
- **Vitest**: Testing unitario
- **ESLint**: Linting de código
- **Prettier**: Formateo de código

### Deployment

- **Vercel**: Hosting y CDN
- **Firebase Hosting**: Hosting alternativo

---

## 🏗 Arquitectura

```
┌─────────────┐
│   User UI   │ (Componentes React)
└──────┬──────┘
       │
       ├─────────┬─────────┬─────────┐
       │         │         │         │
   ┌───▼────┐ ┌─▼──────┐ ┌▼────────┐ ┌──────────┐
   │ Entrada│ │ Entrada│ │ Filtros │ │ Ajustes  │
   │ Manual │ │  Voz   │ │         │ │          │
   └───┬────┘ └─┬──────┘ └┬────────┘ └────┬─────┘
       │        │          │               │
       └────────┴──────────┴───────────────┘
                      │
                 ┌────▼────┐
                 │ Zustand │ (Gestión de Estado)
                 └────┬────┘
                      │
              ┌───────┴───────┐
              │               │
         ┌────▼────┐    ┌────▼─────┐
         │Firebase │    │ IndexedDB│ (Offline)
         │Firestore│    │          │
         └────┬────┘    └────┬─────┘
              │              │
         ┌────▼──────────────▼────┐
         │   Sincronización       │
         │   en Tiempo Real       │
         └────────────────────────┘
                   │
            ┌──────▼──────┐
            │   Cloud     │
            │  Functions  │ (Gastos recurrentes)
            └─────────────┘
```

### Flujo de Datos

1. **Entrada del Usuario** → Componente React
2. **Actualización de Estado** → Store Zustand
3. **Escritura en BD** → Firestore
4. **Listener en Tiempo Real** → Snapshot de Firestore
5. **Actualización de Estado** → Store Zustand
6. **Re-render de UI** → Componente React

---

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+ (se recomienda LTS)
- npm o yarn
- Cuenta de Firebase
- Git

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/idanidev/clarity.git
cd clarity

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración de Firebase

# Iniciar servidor de desarrollo
npm run dev
```

### Variables de Entorno

Crea un archivo `.env`:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

---

## 💻 Configuración

### Scripts Disponibles

```bash
npm run dev          # Iniciar servidor de desarrollo (puerto 5173)
npm run build        # Build para producción
npm run preview      # Previsualizar build de producción
npm run lint         # Revisar código
npm run type-check   # Verificar TypeScript
npm test             # Ejecutar tests
npm test:watch       # Ejecutar tests en modo watch
```

### Flujo de Trabajo de Desarrollo

1. **Crear una rama** para tu funcionalidad

   ```bash
   git checkout -b feature/filtros-gastos
   ```

2. **Hacer cambios** siguiendo las guías de `.cursorrules`

3. **Probar localmente**

   ```bash
   npm run dev
   # Probar en móvil: http://TU_IP:5173
   ```

4. **Verificar tipos y lint**

   ```bash
   npm run type-check
   npm run lint
   ```

5. **Commit con conventional commits**

   ```bash
   git commit -m "feat: añadir filtros de gastos"
   ```

6. **Push y crear PR**
   ```bash
   git push origin feature/filtros-gastos
   ```

### Estilo de Código

- Usar TypeScript para archivos nuevos
- Seguir reglas de ESLint
- Usar componentes funcionales
- Preferir hooks sobre clases
- Diseño responsive mobile-first
- Soportar modo oscuro

---

## 📁 Estructura del Proyecto

```
clarity/
├── .cursorrules              # Reglas de Cursor IDE
├── PROJECT.md                # Documentación del proyecto
├── README.md                 # Este archivo
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
│
├── public/
│   ├── manifest.json         # Manifest PWA
│   └── icons/                # Iconos de la app
│
├── src/
│   ├── main.tsx              # Punto de entrada
│   ├── App.tsx               # Componente raíz
│   │
│   ├── components/           # Componentes reutilizables
│   │   ├── ui/              # Componentes UI base
│   │   ├── features/        # Componentes de funcionalidades
│   │   └── layout/          # Componentes de layout
│   │
│   ├── screens/             # Componentes de nivel página
│   │   ├── Dashboard/
│   │   ├── Settings/
│   │   └── Auth/
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useExpenses.ts
│   │   ├── useCategories.ts
│   │   └── useVoice.ts
│   │
│   ├── utils/               # Funciones utilitarias
│   │   ├── currency.ts
│   │   ├── date.ts
│   │   └── firebase.ts
│   │
│   ├── types/               # Definiciones TypeScript
│   │   ├── expense.ts
│   │   ├── category.ts
│   │   └── index.ts
│   │
│   ├── contexts/            # Contextos de React
│   ├── services/            # Servicios API/Firebase
│   ├── config/              # Configuración
│   └── styles/              # Estilos globales
│
├── functions/               # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts
│   │   └── recurringExpenses.ts
│   └── package.json
│
└── tests/                   # Archivos de test
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 🔥 Configuración de Firebase

### 1. Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un nuevo proyecto
3. Habilita Google Analytics (opcional)

### 2. Habilitar Servicios

#### Autenticación

1. Navega a Authentication
2. Habilita Email/Contraseña
3. Habilita Google Sign-In
4. Añade dominios autorizados

#### Base de Datos Firestore

1. Navega a Firestore Database
2. Crea base de datos (empezar en modo test)
3. Elige ubicación (europe-west1 recomendado)

#### Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

### 3. Reglas de Seguridad

#### Reglas de Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }

    match /expenses/{expenseId} {
      allow read: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
    }

    match /categories/{categoryId} {
      allow read, write: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
    }

    match /budgets/{budgetId} {
      allow read, write: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### 4. Índices Necesarios

Índices requeridos en Firestore:

```json
{
  "indexes": [
    {
      "collectionGroup": "expenses",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "expenses",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "recurringExpenses",
      "fields": [
        { "fieldPath": "active", "order": "ASCENDING" },
        { "fieldPath": "dayOfMonth", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 🚢 Deployment

### Vercel (Recomendado)

1. **Conectar Repositorio**

   - Ve a [Vercel](https://vercel.com)
   - Importa repositorio Git
   - Selecciona proyecto Clarity

2. **Configurar Build**

   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Añadir Variables de Entorno**

   - Añade todas las variables VITE\_\* desde .env

4. **Deploy**
   - Vercel despliega automáticamente en push a main

### Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar
firebase init hosting

# Build
npm run build

# Deploy
firebase deploy --only hosting
```

### Instalación PWA

#### iOS

1. Abre la app en Safari
2. Toca el botón Compartir
3. Toca "Añadir a pantalla de inicio"
4. Toca "Añadir"

#### Android

1. Abre la app en Chrome
2. Toca el menú (tres puntos)
3. Toca "Instalar app"
4. Toca "Instalar"

---

## 🔮 Roadmap

### Fase 1: Fundamentos ✅

- [x] CRUD básico de gastos
- [x] Sistema de categorías
- [x] Seguimiento de presupuestos
- [x] Modo oscuro
- [x] Autenticación

### Fase 2: Funcionalidades IA 🚧

- [x] Entrada por voz
- [x] Categorización inteligente
- [ ] Escaneo de recibos
- [ ] Predicción de gastos

### Fase 3: Insights 📋

- [ ] Gráficos avanzados
- [ ] Patrones de gasto
- [ ] Recomendaciones de presupuesto
- [ ] Reportes exportables

### Fase 4: Social 🔮

- [ ] Compartir presupuestos
- [ ] Cuentas familiares
- [ ] División de gastos
- [ ] Gastos grupales

---

## 🤝 Contribuir

### Guías de Contribución

1. **Seguir `.cursorrules`** para estilo de código
2. **Escribir tests** para nuevas funcionalidades
3. **Actualizar documentación** si es necesario
4. **Enfoque mobile-first** siempre
5. **Soporte modo oscuro** requerido
6. **TypeScript** para archivos nuevos

### Convención de Commits

```
feat: Añadir filtros de gastos
fix: Resolver bug del selector de fechas
docs: Actualizar README
style: Formatear con Prettier
refactor: Extraer custom hook
test: Añadir tests de utils de moneda
chore: Actualizar dependencias
```

### Proceso de Pull Request

1. Crear rama de funcionalidad
2. Hacer cambios
3. Probar exhaustivamente (móvil + escritorio)
4. Crear PR con descripción clara
5. Esperar revisión
6. Atender feedback
7. Merge cuando esté aprobado

---

## 📊 Métricas Clave

| Métrica          | Objetivo | Actual         |
| ---------------- | -------- | -------------- |
| Lighthouse Score | 90+      | Por determinar |
| Tiempo de Carga  | <2s      | Por determinar |
| Tamaño Bundle    | <500KB   | Por determinar |
| Cobertura Tests  | 60%+     | Por determinar |

---

## 📚 Recursos

### Documentación

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

### Herramientas

- [Cursor IDE](https://cursor.sh)
- [Firebase Console](https://console.firebase.google.com)
- [Vercel Dashboard](https://vercel.com/dashboard)

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👤 Autor

**Daniel Benito**

- 📍 Madrid, España
- 💼 Desarrollador Full Stack
- 🌐 GitHub: [@idanidev](https://github.com/idanidev)
- 📧 Email: idanideveloper@gmail.com
- 💬 Discord: `dani_villa`

### Acerca del Proyecto

Clarity nació de la necesidad de tener una herramienta sencilla pero potente para gestionar gastos personales. Como desarrollador, quería crear algo que combinara las últimas tecnologías web con una experiencia de usuario excepcional.

El proyecto se centra en:

- 🎯 **Simplicidad**: Hacer el seguimiento de gastos lo más fácil posible
- 🚀 **Modernidad**: Usar las últimas tecnologías web
- 📱 **Móvil primero**: Diseñado para uso en el día a día
- 🤖 **IA integrada**: Aprovechar la IA para mejorar la UX
- 🔐 **Privacidad**: Tus datos son solo tuyos

---

## 🙏 Agradecimientos

- **Claude AI** por la asistencia en el desarrollo
- **Firebase** por la infraestructura backend
- **Vercel** por el hosting
- **Comunidad open source** por las herramientas increíbles

---

## 💡 Inspiración

Este proyecto está inspirado en:

- **YNAB** - Filosofía de presupuesto proactivo
- **Mint** - Simplicidad en el seguimiento
- **Notion** - Diseño limpio y moderno
- **Linear** - Atención al detalle en UX

---

## 📈 Estado del Proyecto

![Status](https://img.shields.io/badge/Status-En%20Desarrollo%20Activo-green?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0%20Beta-blue?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-Bienvenidos-brightgreen?style=for-the-badge)

### Últimas Actualizaciones

**v1.0.0-beta** (Diciembre 2024)

- ✨ Entrada por voz con IA
- 🌓 Modo oscuro completo
- 📊 Visualizaciones mejoradas
- 🔄 Sincronización en tiempo real
- 📱 PWA completamente funcional

---

## 🐛 Reportar Bugs

¿Encontraste un bug? Por favor:

1. Revisa si ya está reportado en [Issues](https://github.com/idanidev/clarity/issues)
2. Si no, crea un nuevo issue con:
   - Descripción clara del problema
   - Pasos para reproducirlo
   - Comportamiento esperado vs actual
   - Capturas de pantalla si es posible
   - Navegador y dispositivo

---

## 💬 Contacto

¿Tienes preguntas o sugerencias?

- 📧 Email: idanideveloper@gmail.com
- 💬 Discord: `dani_villa`
- 🐛 Issues: [GitHub Issues](https://github.com/idanidev/clarity/issues)
- 💡 Discusiones: [GitHub Discussions](https://github.com/idanidev/clarity/discussions)

---

## ⭐ Dale una Estrella

Si este proyecto te ha sido útil o te gusta, ¡considera darle una estrella! ⭐

Ayuda a que más personas descubran Clarity.

---

## 🎯 Misión

> "Hacer que la gestión de finanzas personales sea tan sencilla y natural como tener una conversación."

Clarity no es solo una app de gastos, es tu asistente financiero personal que te ayuda a tomar mejores decisiones sin complicaciones.

---

**Hecho con 💜 y ☕**