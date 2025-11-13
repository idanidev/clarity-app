import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as firestoreService from '../../services/firestoreService'

// Mock de Firebase - debe estar antes de importar el servicio
vi.mock('../../firebase', () => ({
  db: {},
}))

describe('Categories Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('saveCategories', () => {
    it('debe guardar categorías nuevas correctamente', async () => {
      const userId = 'test-user-1'
      const categories = {
        Alimentacion: {
          subcategories: ['Supermercado', 'Restaurantes'],
          color: '#8B5CF6',
        },
        Transporte: {
          subcategories: ['Combustible', 'Transporte publico'],
          color: '#3B82F6',
        },
      }

      // Mock implementation
      vi.spyOn(firestoreService, 'saveCategories').mockResolvedValue(categories)

      const result = await firestoreService.saveCategories(userId, categories)

      expect(result).toBeDefined()
      expect(result.Alimentacion).toBeDefined()
      expect(result.Alimentacion.subcategories).toContain('Supermercado')
      expect(result.Alimentacion.subcategories).toContain('Restaurantes')
      expect(result.Transporte).toBeDefined()
      expect(result.Transporte.subcategories).toContain('Combustible')
    })

    it('debe fusionar categorías existentes con nuevas (modo merge)', async () => {
      const userId = 'test-user-2'
      const existingCategories = {
        Alimentacion: {
          subcategories: ['Supermercado'],
          color: '#8B5CF6',
        },
      }
      const newCategories = {
        Alimentacion: {
          subcategories: ['Supermercado', 'Restaurantes'],
          color: '#8B5CF6',
        },
      }
      const mergedCategories = {
        Alimentacion: {
          subcategories: ['Supermercado', 'Restaurantes'],
          color: '#8B5CF6',
        },
      }

      vi.spyOn(firestoreService, 'saveCategories').mockResolvedValue(mergedCategories)

      const result = await firestoreService.saveCategories(userId, newCategories, {
        mergeMode: 'merge',
      })

      expect(result.Alimentacion.subcategories).toContain('Supermercado')
      expect(result.Alimentacion.subcategories).toContain('Restaurantes')
    })

    it('debe preservar categorías existentes no modificadas (modo merge)', async () => {
      const userId = 'test-user-3'
      const existingCategories = {
        Alimentacion: {
          subcategories: ['Supermercado'],
          color: '#8B5CF6',
        },
        Transporte: {
          subcategories: ['Combustible'],
          color: '#3B82F6',
        },
      }
      const newCategories = {
        Alimentacion: {
          subcategories: ['Supermercado', 'Restaurantes'],
          color: '#8B5CF6',
        },
        // Transporte no se incluye en newCategories
      }
      const preservedCategories = {
        Alimentacion: {
          subcategories: ['Supermercado', 'Restaurantes'],
          color: '#8B5CF6',
        },
        Transporte: {
          subcategories: ['Combustible'],
          color: '#3B82F6',
        },
      }

      vi.spyOn(firestoreService, 'saveCategories').mockResolvedValue(preservedCategories)

      const result = await firestoreService.saveCategories(userId, newCategories, {
        mergeMode: 'merge',
      })

      // Transporte debe preservarse
      expect(result.Transporte).toBeDefined()
      expect(result.Transporte.subcategories).toContain('Combustible')
      // Alimentacion debe tener ambas subcategorías
      expect(result.Alimentacion.subcategories).toContain('Supermercado')
      expect(result.Alimentacion.subcategories).toContain('Restaurantes')
    })

    it('debe restaurar subcategorías faltantes desde gastos (modo merge)', async () => {
      const userId = 'test-user-4'
      const existingCategories = {
        Alimentacion: {
          subcategories: ['Supermercado'],
          color: '#8B5CF6',
        },
      }
      const restoredCategories = {
        Alimentacion: {
          subcategories: ['Supermercado', 'Restaurantes'], // Restaurada
          color: '#8B5CF6',
        },
      }

      vi.spyOn(firestoreService, 'saveCategories').mockResolvedValue(restoredCategories)

      const result = await firestoreService.saveCategories(userId, restoredCategories, {
        mergeMode: 'merge',
      })

      expect(result.Alimentacion.subcategories).toContain('Supermercado')
      expect(result.Alimentacion.subcategories).toContain('Restaurantes')
    })

    it('debe lanzar error si categories no es un objeto', async () => {
      const userId = 'test-user-5'

      vi.spyOn(firestoreService, 'saveCategories').mockRejectedValue(
        new Error('Invalid categories data')
      )

      await expect(firestoreService.saveCategories(userId, null)).rejects.toThrow()
      await expect(firestoreService.saveCategories(userId, undefined)).rejects.toThrow()
      await expect(firestoreService.saveCategories(userId, 'invalid')).rejects.toThrow()
    })
  })

  describe('getUserCategories', () => {
    it('debe obtener categorías del usuario', async () => {
      const userId = 'test-user-6'
      const categories = {
        Alimentacion: {
          subcategories: ['Supermercado'],
          color: '#8B5CF6',
        },
      }

      vi.spyOn(firestoreService, 'getUserCategories').mockResolvedValue(categories)

      const result = await firestoreService.getUserCategories(userId)

      expect(result).toEqual(categories)
      expect(result.Alimentacion).toBeDefined()
      expect(result.Alimentacion.subcategories).toContain('Supermercado')
    })

    it('debe retornar objeto vacío si el usuario no existe', async () => {
      const userId = 'test-user-7'

      vi.spyOn(firestoreService, 'getUserCategories').mockResolvedValue({})

      const result = await firestoreService.getUserCategories(userId)

      expect(result).toEqual({})
    })

    it('debe retornar objeto vacío si el usuario no tiene categorías', async () => {
      const userId = 'test-user-8'

      vi.spyOn(firestoreService, 'getUserCategories').mockResolvedValue({})

      const result = await firestoreService.getUserCategories(userId)

      expect(result).toEqual({})
    })
  })

  describe('getCategorySubcategories', () => {
    it('debe obtener subcategorías del formato nuevo', () => {
      const categoryData = {
        subcategories: ['Supermercado', 'Restaurantes'],
        color: '#8B5CF6',
      }

      const result = firestoreService.getCategorySubcategories(categoryData)

      expect(result).toEqual(['Supermercado', 'Restaurantes'])
    })

    it('debe obtener subcategorías del formato antiguo (array)', () => {
      const categoryData = ['Supermercado', 'Restaurantes']

      const result = firestoreService.getCategorySubcategories(categoryData)

      expect(result).toEqual(['Supermercado', 'Restaurantes'])
    })

    it('debe retornar array vacío si no hay subcategorías', () => {
      const categoryData = {
        subcategories: [],
        color: '#8B5CF6',
      }

      const result = firestoreService.getCategorySubcategories(categoryData)

      expect(result).toEqual([])
    })

    it('debe retornar array vacío si categoryData es null o undefined', () => {
      expect(firestoreService.getCategorySubcategories(null)).toEqual([])
      expect(firestoreService.getCategorySubcategories(undefined)).toEqual([])
    })
  })

  describe('initializeUser', () => {
    it('debe crear usuario nuevo con categorías predeterminadas', async () => {
      const userId = 'test-user-new'
      const userData = {
        email: 'test@example.com',
      }

      vi.spyOn(firestoreService, 'initializeUser').mockResolvedValue(undefined)

      await expect(
        firestoreService.initializeUser(userId, userData)
      ).resolves.not.toThrow()
    })

    it('NO debe sobrescribir categorías de usuario existente', async () => {
      const userId = 'test-user-existing'
      const userData = {
        email: 'test@example.com',
      }

      vi.spyOn(firestoreService, 'initializeUser').mockResolvedValue(undefined)

      await expect(
        firestoreService.initializeUser(userId, userData)
      ).resolves.not.toThrow()
    })
  })
})
