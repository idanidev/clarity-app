# Configuración de Notificaciones Push

## 📋 Requisitos Previos

Las notificaciones push están implementadas usando Firebase Cloud Messaging (FCM). Para que funcionen correctamente, necesitas:

1. **Clave VAPID** desde Firebase Console
2. **Service Worker** registrado (ya implementado)
3. **Permisos del usuario** (solicitados desde Settings)

## 🔑 Paso 1: Obtener la Clave VAPID

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `clarity-gastos`
3. Ve a **Project Settings** (⚙️) > **Cloud Messaging**
4. En la sección **Web Push certificates**, haz clic en **Generate key pair**
5. Copia la **clave pública** (public key) que se genera

## ⚙️ Paso 2: Configurar la Clave VAPID en el Código

Abre el archivo `src/screens/Dashboard/Dashboard.jsx` y busca esta línea (alrededor de la línea 1217):

```javascript
const VAPID_KEY_FROM_FIREBASE = null; // Reemplazar con tu clave VAPID
```

Reemplaza `null` con tu clave VAPID:

```javascript
const VAPID_KEY_FROM_FIREBASE = "tu-clave-vapid-aqui"; // Reemplazar con tu clave VAPID
```

**Ejemplo:**
```javascript
const VAPID_KEY_FROM_FIREBASE = "BDZxVZrN2LqZJ8HkLQwNqNxYHpGmDfPqRwStUvXyZaBcDeFgHiJkLmNoPqRsT"; 
```

## ✅ Paso 3: Verificar que Funciona

1. Abre la aplicación en un navegador compatible (Chrome, Edge, Firefox)
2. Ve a **Settings** > **Notifications**
3. Activa el toggle de **Notificaciones Push**
4. Deberías ver un diálogo pidiendo permisos
5. Si concedes permisos, el token FCM se guardará automáticamente en Firestore

## 🔍 Verificación

Para verificar que todo está funcionando:

1. Abre la consola del navegador (F12)
2. Deberías ver mensajes como:
   - `Service Worker registrado correctamente`
   - `Token FCM obtenido: ...`
   - `Token FCM guardado en Firestore`

## 📱 Envío de Notificaciones

Para enviar notificaciones push a los usuarios, puedes usar:

1. **Firebase Console**: Ve a Cloud Messaging y envía notificaciones desde ahí
2. **Firebase Admin SDK**: Usa el SDK para enviar notificaciones programáticamente
3. **Cloud Functions**: Crea funciones de Firebase para enviar notificaciones automáticas

### Ejemplo: Enviar notificación desde Firebase Console

1. Ve a **Cloud Messaging** en Firebase Console
2. Haz clic en **Send your first message**
3. Escribe el título y mensaje
4. Selecciona **Web** como plataforma
5. Envía el mensaje

### Ejemplo: Enviar notificación desde Cloud Functions

```javascript
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendNotification = functions.https.onCall(async (data, context) => {
  const message = {
    notification: {
      title: data.title,
      body: data.body,
    },
    token: data.token, // Token FCM del usuario
  };

  return admin.messaging().send(message);
});
```

## 🔧 Troubleshooting

### "VAPID key no configurada"
- Verifica que hayas configurado la clave VAPID en `Dashboard.jsx`
- Asegúrate de que la clave sea la pública (no la privada)

### "Service Worker no se registra"
- Verifica que el archivo `public/firebase-messaging-sw.js` existe
- Asegúrate de que la aplicación esté servida sobre HTTPS (requisito de Service Workers)

### "Permisos denegados"
- El usuario debe permitir notificaciones manualmente en la configuración del navegador
- En Chrome: Settings > Privacy and Security > Site Settings > Notifications

### "Token FCM no se obtiene"
- Verifica que la clave VAPID sea correcta
- Asegúrate de que el Service Worker esté registrado correctamente
- Verifica la consola del navegador para errores

## 📚 Recursos

- [Documentación oficial de FCM](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Guía de Service Workers](https://developer.mozilla.org/es/docs/Web/API/Service_Worker_API)
- [Notificaciones Push en PWAs](https://web.dev/push-notifications-overview/)

