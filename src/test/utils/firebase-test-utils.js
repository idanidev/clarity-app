import { initializeTestEnvironment } from '@firebase/rules-unit-testing'

let testEnv = null

/**
 * Inicializa el entorno de testing de Firebase con emuladores
 */
export const initializeFirebaseTestEnvironment = async () => {
  if (testEnv) {
    return testEnv
  }

  testEnv = await initializeTestEnvironment({
    projectId: 'test-clarity-app',
    firestore: {
      rules: `
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /users/{userId}/{document=**} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
            }
          }
        }
      `,
      host: 'localhost',
      port: 8080,
    },
  })

  return testEnv
}

/**
 * Limpia el entorno de testing
 */
export const cleanupFirebaseTestEnvironment = async () => {
  if (testEnv) {
    await testEnv.cleanup()
    testEnv = null
  }
}

/**
 * Obtiene un cliente de Firestore autenticado para tests
 */
export const getAuthenticatedFirestore = (userId = 'test-user-id') => {
  return testEnv.authenticatedContext(userId).firestore()
}

/**
 * Obtiene un cliente de Auth para tests
 */
export const getAuthenticatedAuth = (userId = 'test-user-id') => {
  return testEnv.authenticatedContext(userId).auth()
}

/**
 * Helper para limpiar datos de prueba
 */
export const clearFirestoreData = async () => {
  if (testEnv) {
    await testEnv.clearFirestore()
  }
}

