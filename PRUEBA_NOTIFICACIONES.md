# 🧪 Cómo Probar las Notificaciones Push

## Paso 1: Activar Permisos en la App

1. **Abre tu aplicación** en el navegador (Chrome, Edge o Firefox)
2. **Inicia sesión** si no lo has hecho
3. Ve a **Settings** (⚙️) > **Notifications**
4. **Activa el toggle** de "Notificaciones Push"
5. Cuando el navegador pregunte, **concede permisos** (haz clic en "Permitir")

## Paso 2: Verificar en la Consola del Navegador

1. Abre la **consola del navegador** (F12 o Cmd+Option+I en Mac)
2. Ve a la pestaña **"Console"**
3. Deberías ver mensajes como:
   ```
   Service Worker registrado correctamente: http://localhost:5173/
   Token FCM obtenido: dKxYzAbC123...
   Token FCM guardado en Firestore
   ```
4. **Copia el Token FCM** que aparece (lo necesitarás para la prueba)

## Paso 3: Enviar Notificación desde Firebase Console

### Opción A: Enviar Mensaje de Prueba (Recomendado)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **Clarity-Gastos**
3. Ve a **Messaging** (en el menú lateral)
4. Haz clic en **"Send test message"** o **"Enviar mensaje de prueba"**
   - Si no lo ves, busca un botón o enlace que diga "Test" o "Prueba"
5. En el formulario:
   - **FCM registration token**: Pega el token que copiaste del paso 2
   - **Notification title**: `Prueba de Clarity`
   - **Notification text**: `¡Hola! Esta es una notificación push de prueba 🎉`
6. Haz clic en **"Test"** o **"Enviar"**

### Opción B: Crear Campaña de Prueba

1. En Firebase Console > **Messaging**
2. Haz clic en **"Crear la primera campaña"** o **"New campaign"**
3. Selecciona **"Firebase Notification messages"**
4. Configura:
   - **Notification title**: `Prueba de Clarity`
   - **Notification text**: `¡Hola! Esta es una notificación push de prueba 🎉`
5. En **Target**, selecciona:
   - **User segment** > **Single device**
   - Pega el **FCM token** que copiaste
6. Haz clic en **"Review"** y luego **"Publish"**

## Paso 4: Ver la Notificación

Después de enviar:

1. **Si la app está abierta**: Verás la notificación en la esquina superior derecha (o donde tu sistema muestre notificaciones)
2. **Si la app está cerrada**: La notificación aparecerá en la bandeja del sistema
3. **Haz clic en la notificación**: Debería abrir/focusar tu aplicación

## ✅ Verificación Exitosa

Si todo funciona correctamente, verás:

- ✅ Notificación en la bandeja del sistema
- ✅ Icono de tu app visible
- ✅ Título y mensaje correctos
- ✅ Al hacer click, se abre la app

## 🔧 Si No Funciona

### No aparece el token FCM:
- Verifica que hayas concedido permisos
- Revisa la consola del navegador para errores
- Asegúrate de que la clave VAPID esté configurada correctamente

### La notificación no llega:
- Verifica que el token FCM sea correcto
- Asegúrate de que el Service Worker esté registrado
- Revisa que la app esté servida sobre HTTPS (o localhost para desarrollo)

### Error en la consola:
- Abre la consola del navegador (F12)
- Busca mensajes en rojo
- Comparte el error para diagnosticar

## 🎯 Prueba Rápida desde el Código

También puedes probar desde la consola del navegador:

```javascript
// En la consola del navegador (F12)
if ('Notification' in window && Notification.permission === 'granted') {
  new Notification('Prueba Manual', {
    body: 'Esta es una notificación de prueba',
    icon: '/icon-192.png'
  });
}
```

Esto debería mostrar una notificación inmediatamente si los permisos están concedidos.

