# 🔥 Guía de Configuración en Firebase Console

## Pasos necesarios en Firebase Console

### 1️⃣ Acceder a Firebase Console
1. Ve a [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Selecciona tu proyecto: **`clarity-gastos`**

### 2️⃣ Habilitar Cloud Messaging (si no está habilitado)
1. En el menú lateral izquierdo, busca **"Build"** o **"Construir"**
2. Haz clic en **"Cloud Messaging"**
3. Si te aparece un mensaje para habilitar la API, haz clic en **"Enable"** o **"Habilitar"**
4. Esto puede tardar unos minutos

### 3️⃣ Obtener la Clave VAPID (MUY IMPORTANTE) ⚠️

**Esta es la configuración más importante:**

1. En Firebase Console, ve a **⚙️ Configuración del proyecto** (Settings)
   - Puedes encontrarlo haciendo clic en el ícono de engranaje (⚙️) en la parte superior izquierda
   
2. Ve a la pestaña **"Cloud Messaging"**

3. En la sección **"Web Push certificates"** o **"Certificados de push web"**:
   - Si ya tienes una clave VAPID, la verás ahí
   - Si **NO** tienes una, haz clic en **"Generate key pair"** o **"Generar par de claves"**
   
4. Se generará una **clave pública (public key)**:
   - Será una cadena larga de texto que empieza con letras y números
   - **COPIA ESTA CLAVE** (necesitarás pegarla en el código)
   - Ejemplo: `BDZxVZrN2LqZJ8HkLQwNqNxYHpGmDfPqRwStUvXyZaBcDeFgHiJkLmNoPqRsT`
   
5. **IMPORTANTE**: Solo copia la clave **pública**, NO la privada

### 4️⃣ Configurar Dominios Autorizados (opcional pero recomendado)

Si tu app está en producción, debes añadir tu dominio:

1. En la misma página de **Cloud Messaging**
2. Busca la sección **"Web configuration"** o **"Configuración web"**
3. En **"Authorized domains"** o **"Dominios autorizados"**:
   - Verás que ya está tu dominio de Firebase (`clarity-gastos.firebaseapp.com`)
   - Si tienes un dominio personalizado (ej: `tudominio.com`), añádelo aquí
   - Haz clic en **"Add domain"** o **"Añadir dominio"**

### 5️⃣ Verificar la Configuración de la App Web

1. Ve a **⚙️ Configuración del proyecto** > pestaña **"General"**
2. En la sección **"Your apps"** o **"Tus apps"**, verifica que tu app web esté registrada:
   - Deberías ver una entrada con el ícono `</>` (web)
   - Si no está, haz clic en **"Add app"** > **"Web"** (`</>`)
3. Verifica que el **App ID** coincida con el de tu código:
   - En tu código: `1:318846020421:web:d55aadfbe492db8d29ec2c`
   - Debe coincidir exactamente

## 📝 Después de configurar en Firebase

Una vez que tengas la **clave VAPID**, necesitas añadirla al código:

1. Abre el archivo: `src/screens/Dashboard/Dashboard.jsx`
2. Busca esta línea (alrededor de la línea 1217):
   ```javascript
   const VAPID_KEY_FROM_FIREBASE = null; // Reemplazar con tu clave VAPID
   ```
3. Reemplaza `null` con tu clave VAPID:
   ```javascript
   const VAPID_KEY_FROM_FIREBASE = "tu-clave-vapid-copiada-de-firebase"; 
   ```

## ✅ Resumen de lo que necesitas hacer

- [ ] Habilitar Cloud Messaging en Firebase Console
- [ ] Generar la clave VAPID en Firebase Console
- [ ] Copiar la clave VAPID
- [ ] Pegar la clave VAPID en `Dashboard.jsx` (línea ~1217)
- [ ] (Opcional) Añadir tu dominio personalizado en dominios autorizados

## 🎯 Pasos rápidos (TL;DR)

1. **Firebase Console** → Tu proyecto → ⚙️ **Settings** → **Cloud Messaging**
2. Genera/obtén la **clave VAPID** (Web Push certificates)
3. Copia la clave **pública**
4. Pégala en `src/screens/Dashboard/Dashboard.jsx` línea ~1217
5. ¡Listo!

## 🔍 ¿Dónde está cada cosa?

**Firebase Console:**
- ⚙️ Settings (Configuración): Icono de engranaje arriba a la izquierda
- Cloud Messaging: Settings → Pestaña "Cloud Messaging"
- VAPID Key: Cloud Messaging → Sección "Web Push certificates"

**En tu código:**
- `src/screens/Dashboard/Dashboard.jsx` línea ~1217
- Busca: `const VAPID_KEY_FROM_FIREBASE = null;`

## 🆘 ¿Problemas?

Si no encuentras la sección de "Web Push certificates":
- Asegúrate de estar en la pestaña correcta: **Cloud Messaging** (no General)
- Verifica que Cloud Messaging esté habilitado en tu proyecto
- Intenta recargar la página de Firebase Console

Si la clave no funciona:
- Asegúrate de copiar solo la clave **pública**, no la privada
- Verifica que no haya espacios extras al copiar/pegar
- La clave debe empezar con letras/números, no con símbolos especiales

