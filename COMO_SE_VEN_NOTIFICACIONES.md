# 👀 Cómo se Ven las Notificaciones Push en la Web

## 📱 Visualización de Notificaciones Push

Las notificaciones push en la web aparecen en la **bandeja de notificaciones del sistema operativo**, igual que las notificaciones de otras aplicaciones.

## 🖥️ En Desktop (Windows/Mac/Linux)

### Chrome/Edge (Windows):
```
┌─────────────────────────────────────┐
│ 🔔 Clarity                          │ ← Aparece en la esquina
│ ⚠️ Has gastado el 80% de tu         │   inferior derecha
│ presupuesto en "Comida"              │
│ Hace 2 minutos                      │
└─────────────────────────────────────┘
```

### Chrome/Edge (Mac):
```
┌─────────────────────────────────────┐
│ 🔔 Clarity                          │ ← Aparece en la esquina
│ ⚠️ Has gastado el 80% de tu         │   superior derecha
│ presupuesto en "Comida"              │
│ Hace 2 minutos                      │
└─────────────────────────────────────┘
```

### Firefox:
Similar a Chrome, pero con un estilo ligeramente diferente.

## 📱 En Mobile (Android/iOS)

### Android (Chrome):
```
┌─────────────────────────────────────┐
│ [Icono] Clarity                      │ ← Aparece en la barra
│ ⚠️ Has gastado el 80% de tu          │   superior y se expande
│ presupuesto                          │   al deslizar hacia abajo
│ Hace 2 minutos                      │
└─────────────────────────────────────┘
```

### iOS (Safari - Solo si la PWA está instalada):
```
┌─────────────────────────────────────┐
│ [Icono] Clarity                      │ ← Similar a Android
│ ⚠️ Has gastado el 80% de tu          │
│ presupuesto                          │
└─────────────────────────────────────┘
```

## 🎨 Elementos Visuales

Cada notificación incluye:

1. **Icono de la app** (icon-192.png)
   - Aparece a la izquierda de la notificación
   - Es el icono de tu PWA

2. **Título**
   - En negrita, arriba
   - Ejemplo: "Clarity" o "⚠️ Presupuesto superado"

3. **Cuerpo del mensaje**
   - Texto descriptivo
   - Ejemplo: "Has gastado el 80% de tu presupuesto en Comida"

4. **Badge** (opcional)
   - Pequeño icono adicional
   - Aparece en algunos navegadores

5. **Timestamp** (automático)
   - "Hace 2 minutos", "Ahora", etc.
   - Lo maneja el sistema operativo

## 🔔 Comportamiento

### Cuando la App está ABIERTA:
- La notificación aparece igualmente en la bandeja
- También puedes mostrar una notificación interna en la app (opcional)

### Cuando la App está CERRADA:
- La notificación aparece en la bandeja del sistema
- Al hacer click, se abre la app
- Funciona gracias al Service Worker

### Cuando la App está en SEGUNDO PLANO:
- La notificación aparece normalmente
- Al hacer click, se enfoca la app

## 📸 Ejemplo Real

Cuando recibas una notificación de prueba, verás algo así:

**En Windows:**
```
┌─────────────────────────────────────────┐
│ 🔔 Clarity                              │
│                                         │
│ Prueba Clarity                          │
│ ¡Hola! Esta es una notificación push    │
│ de prueba 🎉                            │
│                                         │
│ Hace 1 minuto                           │
└─────────────────────────────────────────┘
```

**En Mac:**
```
┌─────────────────────────────────────────┐
│ 🔔 Clarity                              │
│                                         │
│ ⚠️ Presupuesto superado                 │
│ Has gastado el 80% de tu presupuesto    │
│ en "Comida"                             │
│                                         │
│ Hace 5 minutos                          │
└─────────────────────────────────────────┘
```

## 🎯 Dónde Aparecen

### Windows:
- **Esquina inferior derecha** (por defecto)
- Puede moverse según configuración del usuario

### Mac:
- **Esquina superior derecha** (por defecto)
- Se desliza desde arriba

### Linux:
- Depende del entorno de escritorio
- Generalmente esquina superior o inferior derecha

### Android:
- **Barra superior** (notificación compacta)
- Se expande al deslizar hacia abajo

### iOS:
- Solo si la PWA está **instalada** en el home screen
- Aparece como notificación nativa

## ⚙️ Configuración del Usuario

Los usuarios pueden:
- **Permitir** notificaciones (aparecen normalmente)
- **Bloquear** notificaciones (no aparecen)
- **Silenciar** temporalmente
- **Personalizar** qué notificaciones ver

## 🔍 Verificar que Funciona

1. **Activa permisos** en Settings > Notifications
2. **Envía una notificación de prueba** desde Firebase Console
3. **Deberías verla** aparecer en la bandeja del sistema
4. **Haz click** y debería abrir/focusar la app

## 💡 Nota Importante

Las notificaciones push en la web son **idénticas** a las notificaciones de apps nativas. El usuario no notará diferencia entre una notificación de WhatsApp, Gmail, o tu app Clarity.

