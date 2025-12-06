# Scripts de Utilidad

## restoreCategoriesFromExpenses.js

Este script restaura las categorías y subcategorías de un usuario basándose en los gastos que tiene guardados en Firestore.

### ¿Qué hace?

1. Busca todos los gastos del usuario en Firestore
2. Extrae las categorías y subcategorías únicas de esos gastos
3. Fusiona las categorías encontradas con las categorías existentes del usuario (si las hay)
4. Actualiza el documento del usuario con todas las categorías restauradas

### Uso

#### Opción 1: Con npm script (recomendado)

```bash
npm run restore-categories TU_USER_ID
```

#### Opción 2: Directamente con Node

```bash
node scripts/restoreCategoriesFromExpenses.js TU_USER_ID
```

#### Opción 3: Con variable de entorno

```bash
USER_ID=TU_USER_ID node scripts/restoreCategoriesFromExpenses.js
```

### Variables de entorno necesarias

El script necesita las variables de configuración de Firebase. Puedes exportarlas antes de ejecutar:

```bash
export VITE_FIREBASE_API_KEY=tu_api_key
export VITE_FIREBASE_PROJECT_ID=tu_project_id
export VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
export VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
export VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
export VITE_FIREBASE_APP_ID=tu_app_id
export VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id

npm run restore-categories TU_USER_ID
```

O inline:

```bash
VITE_FIREBASE_API_KEY=... VITE_FIREBASE_PROJECT_ID=... npm run restore-categories TU_USER_ID
```

### Ejemplo de salida

```
🔍 Buscando gastos para el usuario: abc123

✅ Se encontraron 45 gastos

📊 Categorías encontradas en los gastos:

  • Alimentacion
    Subcategorías: Supermercado, Restaurantes, Cafeterias
    Color: #8B5CF6

  • Transporte
    Subcategorías: Combustible, Transporte publico
    Color: #3B82F6

📋 Categorías actuales del usuario: 2

  ✅ Actualizada: Alimentacion (3 subcategorías)
  ➕ Nueva: Transporte (2 subcategorías)

💾 Actualizando categorías en Firestore...

✅ ¡Categorías restauradas exitosamente!

📊 Resumen:
   - Total de categorías: 2
   - Categorías restauradas desde gastos: 2
   - Categorías que ya existían: 1
```

### Notas importantes

- El script **fusiona** las categorías: si una categoría ya existe, se mantienen sus datos (como el color) y solo se agregan las subcategorías nuevas
- Las categorías nuevas reciben un color automáticamente de una paleta predeterminada
- El script **NO elimina** categorías existentes que no tengan gastos asociados
- Solo se restauran categorías que tienen al menos un gasto asociado


