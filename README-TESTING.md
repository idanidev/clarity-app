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

## Buenas Prácticas

1. **Tests unitarios**: Prueba la lógica de negocio de forma aislada
2. **Tests de componentes**: Usa React Testing Library para probar comportamiento del usuario
3. **Tests de integración**: Usa Firebase Emulator para pruebas end-to-end
4. **Mocking**: Mockea dependencias externas (Firebase, APIs, etc.)
5. **Cobertura**: Mantén una cobertura de código superior al 70%

## Ejemplos de Tests

Ver los archivos en `src/test/` para ejemplos completos:
- `src/test/components/Notification.test.jsx` - Test de componente
- `src/test/services/firestoreService.test.js` - Test de servicio
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

