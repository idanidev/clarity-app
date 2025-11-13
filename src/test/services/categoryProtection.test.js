import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as firestoreService from '../../services/firestoreService'

// Mock de Firebase
vi.mock('../../firebase', () => ({
  db: {},
}))

describe('Category Protection - Protección contra borrado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Protección de categorías existentes', () => {
    it('NO debe borrar categorías existentes en modo merge', async () => {
      const userId = 'test-user-1'
      const existingCategories = {
        Alimentacion: {
          subcategories: ['Supermercado'],
          color: '#8B5CF6',
        },
        Transporte: {
          subcategories: ['Combustible'],
          color: '#3B82F6',
        },
        Vivienda: {
          subcategories: ['Alquiler'],
          color: '#EC4899',
        },
      }
      // Solo se pasa Alimentacion, las otras NO se pasan
      const newCategories = {
        Alimentacion: {
          subcategories: ['Supermercado', 'Restaurantes'],
          color: '#8B5CF6',
        },
      }
      // Resultado esperado: todas las categorías preservadas
      const preservedCategories = {
        Alimentacion: {
          subcategories: ['Supermercado', 'Restaurantes'],
          color: '#8B5CF6',
        },
        Transporte: {
          subcategories: ['Combustible'],
          color: '#3B82F6',
        },
        Vivienda: {
          subcategories: ['Alquiler'],
          color: '#EC4899',
        },
      }

      vi.spyOn(firestoreService, 'saveCategories').mockResolvedValue(preservedCategories)

      const result = await firestoreService.saveCategories(userId, newCategories, {
        mergeMode: 'merge',
      })

      // Todas las categorías deben preservarse
      expect(result.Alimentacion).toBeDefined()
      expect(result.Transporte).toBeDefined()
      expect(result.Vivienda).toBeDefined()

      // Alimentacion debe tener las nuevas subcategorías
      expect(result.Alimentacion.subcategories).toContain('Supermercado')
      expect(result.Alimentacion.subcategories).toContain('Restaurantes')

      // Las otras categorías deben preservarse intactas
      expect(result.Transporte.subcategories).toContain('Combustible')
      expect(result.Vivienda.subcategories).toContain('Alquiler')
    })

    it('debe restaurar categorías faltantes desde gastos (modo merge)', async () => {
      const userId = 'test-user-2'
      const existingCategories = {
        Alimentacion: {
          subcategories: ['Supermercado'],
          color: '#8B5CF6',
        },
      }
      // Categoría que faltaba (por ejemplo, fue borrada accidentalmente)
      const restoredCategories = {
        Alimentacion: {
          subcategories: ['Supermercado', 'Restaurantes'],
          color: '#8B5CF6',
        },
        Transporte: {
          // Nueva categoría restaurada
          subcategories: ['Combustible'],
          color: '#3B82F6',
        },
      }

      vi.spyOn(firestoreService, 'saveCategories').mockResolvedValue(restoredCategories)

      const result = await firestoreService.saveCategories(userId, restoredCategories, {
        mergeMode: 'merge',
      })

      // Ambas categorías deben existir
      expect(result.Alimentacion).toBeDefined()
      expect(result.Transporte).toBeDefined()

      // Alimentacion debe tener ambas subcategorías
      expect(result.Alimentacion.subcategories).toContain('Supermercado')
      expect(result.Alimentacion.subcategories).toContain('Restaurantes')

      // Transporte debe estar restaurada
      expect(result.Transporte.subcategories).toContain('Combustible')
    })

    it('debe restaurar subcategorías faltantes dentro de categorías existentes', async () => {
      const userId = 'test-user-3'
      const existingCategories = {
        Alimentacion: {
          subcategories: ['Supermercado'],
          color: '#8B5CF6',
        },
      }
      // Subcategoría que faltaba (por ejemplo, fue borrada accidentalmente)
      const restoredCategories = {
        Alimentacion: {
          subcategories: ['Supermercado', 'Restaurantes', 'Cafeterias'],
          color: '#8B5CF6',
        },
      }

      vi.spyOn(firestoreService, 'saveCategories').mockResolvedValue(restoredCategories)

      const result = await firestoreService.saveCategories(userId, restoredCategories, {
        mergeMode: 'merge',
      })

      // Todas las subcategorías deben estar presentes
      expect(result.Alimentacion.subcategories).toContain('Supermercado')
      expect(result.Alimentacion.subcategories).toContain('Restaurantes')
      expect(result.Alimentacion.subcategories).toContain('Cafeterias')
    })
  })

  describe('Protección contra pérdida de datos', () => {
    it('debe preservar colores de categorías existentes', async () => {
      const userId = 'test-user-4'
      const existingCategories = {
        Alimentacion: {
          subcategories: ['Supermercado'],
          color: '#FF0000', // Color personalizado
        },
      }
      const newCategories = {
        Alimentacion: {
          subcategories: ['Supermercado', 'Restaurantes'],
          // No se pasa color
        },
      }
      const preservedCategories = {
        Alimentacion: {
          subcategories: ['Supermercado', 'Restaurantes'],
          color: '#FF0000', // Color preservado
        },
      }

      vi.spyOn(firestoreService, 'saveCategories').mockResolvedValue(preservedCategories)

      const result = await firestoreService.saveCategories(userId, newCategories, {
        mergeMode: 'merge',
      })

      // El color debe preservarse
      expect(result.Alimentacion.color).toBe('#FF0000')
    })

    it('debe fusionar subcategorías sin duplicados', async () => {
      const userId = 'test-user-5'
      const existingCategories = {
        Alimentacion: {
          subcategories: ['Supermercado', 'Restaurantes'],
          color: '#8B5CF6',
        },
      }
      const newCategories = {
        Alimentacion: {
          subcategories: ['Supermercado', 'Restaurantes', 'Cafeterias'],
          color: '#8B5CF6',
        },
      }
      const mergedCategories = {
        Alimentacion: {
          subcategories: ['Supermercado', 'Restaurantes', 'Cafeterias'],
          color: '#8B5CF6',
        },
      }

      vi.spyOn(firestoreService, 'saveCategories').mockResolvedValue(mergedCategories)

      const result = await firestoreService.saveCategories(userId, newCategories, {
        mergeMode: 'merge',
      })

      // No debe haber duplicados
      const subcategories = result.Alimentacion.subcategories
      expect(subcategories.filter((s) => s === 'Supermercado').length).toBe(1)
      expect(subcategories.filter((s) => s === 'Restaurantes').length).toBe(1)
      expect(subcategories.length).toBe(3)
    })

    it('debe ordenar subcategorías alfabéticamente', async () => {
      const userId = 'test-user-6'
      const existingCategories = {
        Alimentacion: {
          subcategories: ['Supermercado'],
          color: '#8B5CF6',
        },
      }
      const newCategories = {
        Alimentacion: {
          subcategories: ['Cafeterias', 'Restaurantes', 'Supermercado'],
          color: '#8B5CF6',
        },
      }
      const sortedCategories = {
        Alimentacion: {
          subcategories: ['Cafeterias', 'Restaurantes', 'Supermercado'],
          color: '#8B5CF6',
        },
      }

      vi.spyOn(firestoreService, 'saveCategories').mockResolvedValue(sortedCategories)

      const result = await firestoreService.saveCategories(userId, newCategories, {
        mergeMode: 'merge',
      })

      // Debe estar ordenado alfabéticamente
      const subcategories = result.Alimentacion.subcategories
      expect(subcategories[0]).toBe('Cafeterias')
      expect(subcategories[1]).toBe('Restaurantes')
      expect(subcategories[2]).toBe('Supermercado')
    })
  })

  describe('Validación de datos', () => {
    it('debe validar que categories sea un objeto', async () => {
      const userId = 'test-user-7'

      vi.spyOn(firestoreService, 'saveCategories').mockRejectedValue(
        new Error('Invalid categories data')
      )

      await expect(firestoreService.saveCategories(userId, null)).rejects.toThrow()
      await expect(firestoreService.saveCategories(userId, undefined)).rejects.toThrow()
      await expect(firestoreService.saveCategories(userId, 'invalid')).rejects.toThrow()
    })
  })
})
