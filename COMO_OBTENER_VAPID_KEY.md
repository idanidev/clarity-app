# 🔑 Cómo Obtener la Clave VAPID - Guía Visual

## Estás en la pantalla correcta, pero necesitas ir a Settings

### 📍 Paso 1: Ir a Settings (Configuración)

Desde donde estás ahora (Messaging):

1. **Mira arriba a la izquierda** - verás el logo de Firebase (🔥)
2. **Haz clic en el ícono de engranaje ⚙️** que está al lado del nombre del proyecto "Clarity-Gastos"
   - O busca "Settings" / "Configuración del proyecto" en el menú lateral

### 📍 Paso 2: Ir a la pestaña Cloud Messaging

Una vez en Settings:

1. Verás varias pestañas en la parte superior:
   - General
   - **Cloud Messaging** ← **ESTA ES LA QUE NECESITAS**
   - Service accounts
   - etc.

2. **Haz clic en la pestaña "Cloud Messaging"**

### 📍 Paso 3: Buscar "Web Push certificates"

En la pestaña Cloud Messaging:

1. Busca la sección **"Web Push certificates"** o **"Certificados de push web"**
2. Si ya tienes una clave VAPID, la verás ahí
3. Si **NO** tienes una, verás un botón:
   - **"Generate key pair"** o **"Generar par de claves"**
   - Haz clic en ese botón

### 📍 Paso 4: Copiar la Clave Pública

Después de generar (o si ya existe):

1. Verás una **clave pública** (public key)
   - Es una cadena larga de texto
   - Ejemplo: `BDZxVZrN2LqZJ8HkLQwNqNxYHpGmDfPqRwStUvXyZaBcDeFgHiJkLmNoPqRsT`
2. **COPIA esta clave** (solo la pública, no la privada)
3. Pégalo en tu código (ver siguiente paso)

## 🎯 Ruta Completa

```
Firebase Console
  ↓
Messaging (donde estás ahora)
  ↓
⚙️ Settings (engranaje arriba a la izquierda)
  ↓
Pestaña "Cloud Messaging"
  ↓
Sección "Web Push certificates"
  ↓
"Generate key pair" (si no tienes una)
  ↓
Copiar la clave pública
```

## ⚠️ Nota Importante

La pantalla que estás viendo ahora es para **crear campañas de mensajería**, pero la clave VAPID está en la **configuración del proyecto**, no en esta pantalla.

## 🔍 Si no encuentras "Web Push certificates"

1. Asegúrate de estar en la pestaña **"Cloud Messaging"** dentro de Settings
2. Desplázate hacia abajo - puede estar más abajo en la página
3. Si no aparece, puede que necesites habilitar Cloud Messaging primero:
   - Ve a la sección "Messaging" (donde estás ahora)
   - Haz clic en "Crear la primera campaña" o simplemente navega por ahí
   - Luego vuelve a Settings > Cloud Messaging

## ✅ Después de copiar la clave

Una vez que tengas la clave VAPID:

1. Abre: `src/screens/Dashboard/Dashboard.jsx`
2. Busca la línea 1201:
   ```javascript
   const VAPID_KEY_FROM_FIREBASE = null;
   ```
3. Reemplaza `null` con tu clave:
   ```javascript
   const VAPID_KEY_FROM_FIREBASE = "tu-clave-aqui";
   ```

