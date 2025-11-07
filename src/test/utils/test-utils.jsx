import { render } from '@testing-library/react'
import { LanguageProvider } from '../../contexts/LanguageContext'
import { vi } from 'vitest'

// Mock de Firebase para tests
vi.mock('../../firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(() => () => {}),
  },
  db: {},
}))

// Helper para renderizar componentes con providers
export const renderWithProviders = (ui, options = {}) => {
  const { user = null, onLanguageChange = vi.fn(), ...renderOptions } = options

  const Wrapper = ({ children }) => {
    return (
      <LanguageProvider user={user} onLanguageChange={onLanguageChange}>
        {children}
      </LanguageProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Helper para mock de Firebase Auth
export const createMockUser = (overrides = {}) => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  ...overrides,
})

// Helper para esperar que se complete una acción asíncrona
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

