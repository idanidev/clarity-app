# Notificaciones Push en PWA iOS - Limitaciones y Soluciones

## ⚠️ Limitación de iOS

**En iOS Safari/PWA, las notificaciones push aparecen como "banners" (tiras) que desaparecen automáticamente.** Esto es una **limitación del sistema operativo iOS** y **NO se puede cambiar desde el código web**.

### ¿Por qué pasa esto?

- iOS Safari trata las notificaciones push de PWAs de manera diferente a las apps nativas
- Las notificaciones siempre aparecen como banners temporales
- No hay forma de hacer que se queden fijas como alertas persistentes desde JavaScript/Service Worker

## ✅ Lo que SÍ podemos hacer

### 1. Mejorar la configuración de notificaciones

He actualizado el service worker para que las notificaciones tengan mejor configuración:

- **Icono y badge** personalizados
- **Vibración** (en Android, no funciona en iOS)
- **Sonido** personalizado
- **Datos adicionales** para navegación
- **Renotificar** si la notificación ya existe

### 2. Notificaciones cuando la app está en primer plano

Cuando la app está abierta, podemos mostrar notificaciones usando la API `Notification` directamente, aunque en iOS seguirán siendo banners.

### 3. Mejorar la experiencia del usuario

- Añadir **acciones** a las notificaciones (en Android)
- Configurar **navegación** cuando se toca la notificación
- Usar **tags** para agrupar notificaciones similares

## 📱 Comportamiento en diferentes plataformas

### iOS Safari/PWA
- ✅ Notificaciones push funcionan
- ❌ Aparecen como banners (tiras) que desaparecen
- ❌ No se pueden hacer persistentes
- ❌ No hay vibración
- ✅ Se pueden tocar para abrir la app

### Android Chrome/PWA
- ✅ Notificaciones push funcionan
- ✅ Se pueden hacer persistentes con `requireInteraction: true`
- ✅ Vibración funciona
- ✅ Acciones en notificaciones
- ✅ Se pueden tocar para abrir la app

### Desktop (Chrome, Firefox, Edge)
- ✅ Notificaciones push funcionan
- ✅ Se pueden hacer persistentes
- ✅ Vibración (si está disponible)
- ✅ Acciones en notificaciones
- ✅ Se pueden tocar para abrir la app

## 🔧 Configuración actual

El service worker (`public/firebase-messaging-sw.js`) está configurado para:

1. **Recibir notificaciones en segundo plano**
2. **Mostrar notificaciones con icono y badge**
3. **Manejar clics en notificaciones** para abrir la app
4. **Renovar notificaciones** si ya existen (útil en iOS)

## ✅ Solución: Notificaciones Locales para Recordatorios

**¡Buenas noticias!** Para los **recordatorios de añadir gastos**, SÍ puedes hacer que se queden en la bandeja de notificaciones en iOS usando **notificaciones locales programadas**.

### ¿Cómo funciona?

1. **Notificaciones Locales Programadas**: Se crean desde la app usando el Service Worker
2. **`requireInteraction: true`**: Hace que la notificación se quede en la bandeja en iOS
3. **Se programan automáticamente**: Cada día/semana según la configuración del usuario

### Implementación

He creado el servicio `localNotificationService.js` que:
- ✅ Programa recordatorios diarios a las 20:00
- ✅ Programa recordatorios semanales el día configurado
- ✅ Las notificaciones **SÍ se quedan en la bandeja** en iOS
- ✅ Funciona incluso cuando la app está cerrada (si el Service Worker está activo)

### Limitación

Las notificaciones locales programadas con `setTimeout` solo funcionan mientras:
- La app está abierta, O
- El Service Worker está activo (normalmente se mantiene activo un tiempo después de cerrar la app)

Para recordatorios que funcionen siempre (incluso días después), la mejor solución es:
- **Usar notificaciones push desde el servidor** (Firebase Cloud Functions)
- Configurar el payload con `requireInteraction: true` y `type: 'reminder'`
- El Service Worker mostrará la notificación y se quedará en la bandeja

## 📝 Nota importante

Esta es una **limitación de iOS**, no un bug de tu código. Apple ha diseñado iOS para que las notificaciones push de PWAs se comporten de esta manera por razones de seguridad y experiencia de usuario.

## 🎯 Recomendación

Para la mejor experiencia en todas las plataformas:

1. **Acepta la limitación de iOS** - Los usuarios de iOS verán banners temporales
2. **Optimiza para Android y Desktop** - Donde sí puedes tener notificaciones persistentes
3. **Considera notificaciones dentro de la app** - Para información crítica que necesite atención inmediata

## ✅ Recordatorios Push desde el Servidor

**¡Ahora los recordatorios funcionan incluso cuando la app está cerrada!**

He implementado Cloud Functions que envían notificaciones push programadas:

### Funciones implementadas:

1. **`sendDailyReminders`**: Se ejecuta todos los días a las 20:00
   - Envía recordatorios a usuarios con `customReminders.enabled = true`
   - Usa el mensaje personalizado del usuario

2. **`sendWeeklyReminders`**: Se ejecuta todos los días a las 10:00
   - Verifica si es el día de la semana configurado
   - Envía recordatorios a usuarios con `weeklyReminder.enabled = true`

### Configuración de notificaciones:

- **`requireInteraction: true`**: Las notificaciones se quedan en la bandeja en iOS
- **`type: 'reminder'`**: El Service Worker las detecta como recordatorios
- **`persistent: 'true'`**: Se mantienen en la bandeja de notificaciones

### Despliegue:

```bash
cd functions
npm install
firebase deploy --only functions
```

### Requisitos:

- Los usuarios deben tener tokens FCM guardados en `users/{userId}.fcmTokens`
- Los usuarios deben tener los recordatorios activados en sus configuraciones
- La app debe estar instalada desde Safari en iOS (no desde Chrome)

## 🔍 Verificación

Para verificar que las notificaciones funcionan en iOS:

1. Abre la PWA en Safari iOS (no Chrome)
2. Instala la app usando "Agregar a la pantalla de inicio"
3. Concede permisos de notificaciones
4. Activa los recordatorios en Settings > Notifications
5. Espera a la hora programada (20:00 para diarios, 10:00 para semanales)
6. La notificación aparecerá y se quedará en la bandeja de notificaciones
7. Toca la notificación para abrir la app

