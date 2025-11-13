import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Limpiar después de cada test
afterEach(() => {
  cleanup()
})

// Mock de window.scrollTo para los tests
globalThis.scrollTo = vi.fn()
window.scrollTo = vi.fn()

// Mock de Firebase para tests
vi.mock('../firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(() => () => {}),
  },
  db: {},
}))

// NOTA: Los mocks de firestoreService se hacen en cada test individual
// para permitir pruebas más específicas y realistas

