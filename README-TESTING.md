# Guía de Testing - Clarity App

## Configuración de Testing

Esta aplicación utiliza **Vitest** como framework de testing, junto con **React Testing Library** para pruebas de componentes y **Firebase Emulator** para pruebas de integración con Firebase.

## Instalación

Las dependencias ya están instaladas. Para verificar:

```bash
npm install
```

## Scripts Disponibles

- `npm test` - Ejecuta los tests en modo watch
- `npm run test:ui` - Abre la interfaz visual de Vitest
- `npm run test:coverage` - Ejecuta tests con reporte de cobertura
- `npm run test:run` - Ejecuta todos los tests una vez

## Estructura de Tests

```
src/
  test/
    components/        # Tests de componentes React
    services/          # Tests de servicios (Firebase)
    utils/             # Utilidades de testing
    setup.js          # Configuración global de tests
```

## Ejecutar Tests

### Modo Watch (desarrollo)
```bash
npm test
```

### Interfaz Visual
```bash
npm run test:ui
```

### Cobertura
```bash
npm run test:coverage
```

## Escribir Tests

### Test de Componente

```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from '../components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Test con Firebase Emulator

Para tests que requieren Firebase, se utilizan mocks por defecto. Para tests de integración reales con Firebase Emulator:

1. Inicia el emulador de Firebase:
```bash
firebase emulators:start
```

2. En tu test, usa las utilidades de testing:
```javascript
import { initializeFirebaseTestEnvironment } from '../test/utils/firebase-test-utils'

describe('Firebase Integration', () => {
  beforeEach(async () => {
    await initializeFirebaseTestEnvironment()
  })

  it('should save data to Firestore', async () => {
    // Tu test aquí
  })
})
```

## Mocks Configurados

- **Firebase Auth**: Mockeado por defecto
- **Firestore**: Mockeado por defecto
- **window.scrollTo**: Mockeado para tests de navegación
- **LanguageContext**: Disponible a través de `renderWithProviders`

## Funcionalidades Críticas Cubiertas

Los tests cubren las siguientes funcionalidades críticas de la aplicación:

### ✅ Creación y Guardado
- Crear categorías y subcategorías
- Crear gastos (normales y recurrentes)
- Guardar datos en Firebase con timestamps
- Validar datos antes de guardar

### ✅ Protección contra Pérdida de Datos
- Restaurar categorías faltantes desde gastos
- Restaurar subcategorías faltantes
- Preservar categorías existentes no modificadas (modo merge)
- Preservar colores de categorías existentes
- Fusionar subcategorías sin duplicados

### ✅ Validaciones
- Validar que categories sea un objeto
- Validar que los datos estén completos antes de guardar
- Manejar errores de Firebase correctamente

### ✅ Inicialización
- Crear usuario nuevo con categorías predeterminadas
- NO sobrescribir categorías de usuario existente
- Inicializar solo usuarios nuevos

## Buenas Prácticas

1. **Tests unitarios**: Prueba la lógica de negocio de forma aislada
2. **Tests de componentes**: Usa React Testing Library para probar comportamiento del usuario
3. **Tests de integración**: Usa Firebase Emulator para pruebas end-to-end
4. **Mocking**: Mockea dependencias externas (Firebase, APIs, etc.)
5. **Cobertura**: Los tests cubren las funcionalidades críticas (creación, guardado, protección)
6. **Tests de protección**: Verifica que las protecciones contra pérdida de datos funcionen correctamente

## Tests Implementados

### Tests de Servicios (Firebase)

#### 1. `categories.test.js` - Tests de Categorías (14 tests)
- ✅ Crear categorías nuevas correctamente
- ✅ Fusionar categorías existentes con nuevas (modo merge)
- ✅ Preservar categorías existentes no modificadas (modo merge)
- ✅ Restaurar subcategorías faltantes desde gastos (modo merge)
- ✅ Validar que categories sea un objeto
- ✅ Obtener categorías del usuario
- ✅ Retornar objeto vacío si el usuario no existe
- ✅ Retornar objeto vacío si el usuario no tiene categorías
- ✅ Obtener subcategorías del formato nuevo
- ✅ Obtener subcategorías del formato antiguo (array)
- ✅ Retornar array vacío si no hay subcategorías
- ✅ Retornar array vacío si categoryData es null o undefined
- ✅ Crear usuario nuevo con categorías predeterminadas
- ✅ NO sobrescribir categorías de usuario existente

#### 2. `expenses.test.js` - Tests de Gastos (12 tests)
- ✅ Crear un gasto correctamente
- ✅ Añadir timestamps (createdAt, updatedAt) al crear gasto
- ✅ Crear gasto recurrente correctamente
- ✅ Manejar errores al crear gasto
- ✅ Actualizar un gasto correctamente
- ✅ Actualizar el timestamp (updatedAt) al modificar gasto
- ✅ Manejar errores al actualizar gasto
- ✅ Eliminar un gasto correctamente
- ✅ Manejar errores al eliminar gasto
- ✅ Obtener gastos del usuario ordenados por fecha (desc)
- ✅ Retornar array vacío si el usuario no tiene gastos
- ✅ Manejar errores al obtener gastos

#### 3. `categoryProtection.test.js` - Tests de Protección (7 tests)
- ✅ NO borrar categorías existentes en modo merge
- ✅ Restaurar categorías faltantes desde gastos (modo merge)
- ✅ Restaurar subcategorías faltantes dentro de categorías existentes
- ✅ Preservar colores de categorías existentes
- ✅ Fusionar subcategorías sin duplicados
- ✅ Ordenar subcategorías alfabéticamente
- ✅ Validar que categories sea un objeto

#### 4. `firestoreService.test.js` - Tests Básicos (3 tests)
- ✅ Añadir gasto exitosamente
- ✅ Obtener categorías del usuario
- ✅ Guardar categorías exitosamente

### Tests de Componentes

#### 5. `Notification.test.jsx` - Tests de Notificación (4 tests)
- ✅ Renderizar notificación de éxito
- ✅ Renderizar notificación de error
- ✅ No renderizar cuando notification es null
- ✅ Llamar onClose cuando se hace clic en el botón de cerrar

## Estadísticas de Tests

- **Total de Tests**: 40 tests
- **Archivos de Test**: 5 archivos
- **Cobertura**: 14.84% (usando mocks, pero cubriendo funcionalidades críticas)

## Ejemplos de Tests

Ver los archivos en `src/test/` para ejemplos completos:
- `src/test/components/Notification.test.jsx` - Test de componente
- `src/test/services/firestoreService.test.js` - Test de servicio básico
- `src/test/services/categories.test.js` - Tests completos de categorías
- `src/test/services/expenses.test.js` - Tests completos de gastos
- `src/test/services/categoryProtection.test.js` - Tests de protección contra borrado
- `src/test/utils/test-utils.jsx` - Utilidades de testing

## Troubleshooting

### Error: "Cannot find module '@testing-library/jest-dom'"
```bash
npm install --save-dev @testing-library/jest-dom
```

### Error: "window is not defined"
Asegúrate de que `environment: 'jsdom'` esté configurado en `vitest.config.js`

### Tests con Firebase fallan
Verifica que los mocks estén correctamente configurados en `src/test/setup.js`

