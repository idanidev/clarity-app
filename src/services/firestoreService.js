// src/services/firestoreService.js
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const normalizeSubcategories = (rawSubcategories) => {
  if (!rawSubcategories) {
    return [];
  }

  if (Array.isArray(rawSubcategories)) {
    return rawSubcategories.filter((sub) => typeof sub === "string" && sub.trim().length > 0);
  }

  if (typeof rawSubcategories === "string") {
    return rawSubcategories.trim().length > 0 ? [rawSubcategories.trim()] : [];
  }

  if (typeof rawSubcategories === "object") {
    return Object.values(rawSubcategories)
      .filter((sub) => typeof sub === "string" && sub.trim().length > 0);
  }

  return [];
};

// ==================== EXPENSES ====================

export const addExpense = async (userId, expenseData) => {
  try {
    // Validación: asegurar que amount no sea negativo
    if (expenseData.amount !== undefined && expenseData.amount < 0) {
      throw new Error("El monto del gasto no puede ser negativo");
    }

    const expensesRef = collection(db, "users", userId, "expenses");
    const docRef = await addDoc(expensesRef, {
      ...expenseData,
      amount: Math.max(0, expenseData.amount || 0), // Asegurar que sea >= 0
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...expenseData };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

export const updateExpense = async (userId, expenseId, expenseData) => {
  try {
    // Validación: asegurar que amount no sea negativo
    if (expenseData.amount !== undefined && expenseData.amount < 0) {
      throw new Error("El monto del gasto no puede ser negativo");
    }

    const expenseRef = doc(db, "users", userId, "expenses", expenseId);
    const updateData = {
      ...expenseData,
      updatedAt: new Date().toISOString(),
    };
    
    // Asegurar que amount sea >= 0 si está presente
    if (updateData.amount !== undefined) {
      updateData.amount = Math.max(0, updateData.amount);
    }

    await updateDoc(expenseRef, updateData);
    return { id: expenseId, ...expenseData };
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

export const deleteExpense = async (userId, expenseId) => {
  try {
    const expenseRef = doc(db, "users", userId, "expenses", expenseId);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

export const getExpenses = async (userId) => {
  try {
    const expensesRef = collection(db, "users", userId, "expenses");
    const q = query(expensesRef, orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting expenses:", error);
    throw error;
  }
};

export const subscribeToExpenses = (userId, callback) => {
  const expensesRef = collection(db, "users", userId, "expenses");
  const q = query(expensesRef, orderBy("date", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(expenses);
    },
    (error) => {
      console.error("Error in expenses subscription:", error);
    }
  );
};

// ==================== RECURRING EXPENSES ====================

export const addRecurringExpense = async (userId, recurringData) => {
  try {
    // Validación: asegurar que amount no sea negativo
    if (recurringData.amount !== undefined && recurringData.amount < 0) {
      throw new Error("El monto del gasto recurrente no puede ser negativo");
    }

    const recurringRef = collection(db, "users", userId, "recurringExpenses");
    const docRef = await addDoc(recurringRef, {
      ...recurringData,
      amount: Math.max(0, recurringData.amount || 0), // Asegurar que sea >= 0
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...recurringData };
  } catch (error) {
    console.error("Error adding recurring expense:", error);
    throw error;
  }
};

export const updateRecurringExpense = async (
  userId,
  recurringId,
  recurringData
) => {
  try {
    // Validación: asegurar que amount no sea negativo
    if (recurringData.amount !== undefined && recurringData.amount < 0) {
      throw new Error("El monto del gasto recurrente no puede ser negativo");
    }

    const recurringRef = doc(
      db,
      "users",
      userId,
      "recurringExpenses",
      recurringId
    );
    const updateData = {
      ...recurringData,
      updatedAt: new Date().toISOString(),
    };
    
    // Asegurar que amount sea >= 0 si está presente
    if (updateData.amount !== undefined) {
      updateData.amount = Math.max(0, updateData.amount);
    }

    await updateDoc(recurringRef, updateData);
    return { id: recurringId, ...recurringData };
  } catch (error) {
    console.error("Error updating recurring expense:", error);
    throw error;
  }
};

export const deleteRecurringExpense = async (userId, recurringId) => {
  try {
    const recurringRef = doc(
      db,
      "users",
      userId,
      "recurringExpenses",
      recurringId
    );
    await deleteDoc(recurringRef);
  } catch (error) {
    console.error("Error deleting recurring expense:", error);
    throw error;
  }
};

export const getRecurringExpenses = async (userId) => {
  try {
    const recurringRef = collection(db, "users", userId, "recurringExpenses");
    // Traer TODOS los gastos recurrentes (activos e inactivos)
    const querySnapshot = await getDocs(recurringRef);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting recurring expenses:", error);
    throw error;
  }
};

export const subscribeToRecurringExpenses = (userId, callback) => {
  const recurringRef = collection(db, "users", userId, "recurringExpenses");
  // Traer TODOS los gastos recurrentes (activos e inactivos)

  return onSnapshot(
    recurringRef,
    (snapshot) => {
      const recurring = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(recurring);
    },
    (error) => {
      console.error("Error in recurring expenses subscription:", error);
    }
  );
};

// ==================== CATEGORIES ====================

// Helper functions for category structure compatibility
export const getCategorySubcategories = (categoryData) => {
  if (Array.isArray(categoryData)) {
    // Old format: ["Sub1", "Sub2"]
    return normalizeSubcategories(categoryData);
  }

  if (categoryData && typeof categoryData === "object") {
    // New format or unknown structure
    return normalizeSubcategories(categoryData.subcategories);
  }

  return [];
};

export const getCategoryColor = (categoryData, defaultColor = "#8B5CF6") => {
  // Si es undefined o null, devolver color por defecto
  if (!categoryData) {
    return defaultColor;
  }
  
  // Si es un array (formato antiguo), devolver color por defecto
  if (Array.isArray(categoryData)) {
    return defaultColor;
  }
  
  // Si es un objeto y tiene la propiedad color, devolverla
  if (typeof categoryData === "object" && categoryData.color) {
    return categoryData.color;
  }
  
  // Si es un string (color directo), devolverlo
  if (typeof categoryData === "string") {
    return categoryData;
  }
  
  // Por defecto, devolver color por defecto
  return defaultColor;
};

export const migrateCategoriesToNewFormat = (categories) => {
  if (!categories || typeof categories !== "object") return {};

  const migrated = {};
  const defaultColors = [
    "#8B5CF6", // purple
    "#3B82F6", // blue
    "#EC4899", // pink
    "#10B981", // green
    "#F59E0B", // amber
    "#EF4444", // red
    "#6366F1", // indigo
    "#A855F7", // violet
  ];

  let colorIndex = 0;

  Object.entries(categories).forEach(([categoryName, categoryData]) => {
    if (!categoryName) {
      return;
    }

    const normalizedSubcategories = Array.isArray(categoryData)
      ? normalizeSubcategories(categoryData)
      : normalizeSubcategories(categoryData?.subcategories);

    // CRÍTICO: PRESERVAR el color existente SIEMPRE que exista
    // Solo asignar color por defecto si es formato antiguo (array) y NO tiene color
    let color;
    if (categoryData && typeof categoryData === "object" && categoryData.color) {
      // Si ya tiene color, PRESERVARLO EXACTAMENTE (no cambiarlo nunca)
      color = categoryData.color;
    } else if (Array.isArray(categoryData)) {
      // Formato antiguo (array), usar color por defecto solo para migración
      color = defaultColors[colorIndex % defaultColors.length];
    } else if (categoryData && typeof categoryData === "object" && !categoryData.color) {
      // Objeto sin color: NO asignar color por defecto, dejar que el usuario lo configure
      // O usar el color existente si hay uno en algún lugar
      color = categoryData.color || defaultColors[colorIndex % defaultColors.length];
    } else {
      // No tiene color, usar color por defecto solo para migración
      color = defaultColors[colorIndex % defaultColors.length];
    }

    // PRESERVAR todos los campos existentes (icon, etc.)
    migrated[categoryName] = {
      ...(typeof categoryData === "object" && !Array.isArray(categoryData) ? categoryData : {}),
      subcategories: Array.from(new Set(normalizedSubcategories)).sort((a, b) =>
        a.localeCompare(b)
      ),
      color, // El color ya fue determinado arriba (preservado o asignado)
    };

    colorIndex++;
  });

  return migrated;
};

/**
 * Guarda las categorías de forma segura, preservando todas las subcategorías existentes
 * y fusionando con las nuevas para evitar pérdida de datos
 * 
 * Estrategia de fusión:
 * 1. Para categorías que se están modificando explícitamente: usar los datos proporcionados
 * 2. Para categorías que NO se están modificando: preservar las existentes de Firestore
 * 3. Fusionar subcategorías solo cuando sea necesario (restauración automática)
 */
export const saveCategories = async (userId, categories, options = {}) => {
  try {
    // VALIDACIÓN CRÍTICA: NUNCA permitir arrays, solo objetos
    if (!categories) {
      console.error("Invalid categories data provided to saveCategories: null or undefined");
      throw new Error("Invalid categories data");
    }
    
    // Si es un array, rechazarlo explícitamente
    if (Array.isArray(categories)) {
      console.error("ERROR CRÍTICO: Se intentó guardar categorías como array. Las categorías deben ser un objeto, nunca un array.");
      throw new Error("Categories cannot be an array. Must be an object.");
    }
    
    // Verificar que sea un objeto
    if (typeof categories !== "object") {
      console.error("Invalid categories data provided to saveCategories: not an object");
      throw new Error("Invalid categories data: must be an object");
    }

    const { mergeMode = "smart" } = options; // "smart" | "replace" | "merge"

    // Leer categorías actuales de Firestore para preservar datos existentes
    let existingCategories = {};
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const existing = userDoc.data().categories;
        if (existing) {
          existingCategories = migrateCategoriesToNewFormat(existing);
        }
      }
    } catch (readError) {
      console.warn("Could not read existing categories, proceeding with new data:", readError);
    }

    // Migrar las nuevas categorías al formato correcto
    const migratedNewCategories = migrateCategoriesToNewFormat(categories);

    let finalCategories;

    if (mergeMode === "replace") {
      // Modo reemplazo: usar solo las nuevas categorías (útil para restauración)
      finalCategories = { ...migratedNewCategories };
      
      // Pero preservar categorías que no se están modificando
      Object.keys(existingCategories).forEach((categoryName) => {
        if (!finalCategories[categoryName]) {
          finalCategories[categoryName] = existingCategories[categoryName];
        }
      });
    } else if (mergeMode === "merge") {
      // Modo fusión: combinar todo (útil para restauración automática)
      finalCategories = { ...existingCategories };

      Object.entries(migratedNewCategories).forEach(([categoryName, categoryData]) => {
        if (!categoryName || !categoryData) {
          return;
        }

        const existingCategory = existingCategories[categoryName];
        const existingSubcategories = existingCategory
          ? getCategorySubcategories(existingCategory)
          : [];

        const newSubcategories = getCategorySubcategories(categoryData);
        
        // Unión de subcategorías: combinar existentes + nuevas, sin duplicados
        const allSubcategories = Array.from(
          new Set([...existingSubcategories, ...newSubcategories])
        ).sort((a, b) => a.localeCompare(b));

        const color = categoryData.color || 
                     (existingCategory ? getCategoryColor(existingCategory) : "#8B5CF6");

        finalCategories[categoryName] = {
          subcategories: allSubcategories,
          color: color,
        };
      });
    } else {
      // Modo "smart" (por defecto): 
      // IMPORTANTE: Se espera que `categories` contenga TODAS las categorías que debe tener el usuario
      // - Si una categoría está en `categories`, se actualiza/modifica
      // - Si una categoría NO está en `categories`, se elimina explícitamente
      // - Preservar solo las categorías que están en `migratedNewCategories`
      finalCategories = {};

      // Procesar todas las categorías en migratedNewCategories
      Object.entries(migratedNewCategories).forEach(([categoryName, categoryData]) => {
        if (!categoryName || !categoryData) {
          return;
        }

        const existingCategory = existingCategories[categoryName];
        const existingSubs = existingCategory ? getCategorySubcategories(existingCategory) : [];
        const newSubs = getCategorySubcategories(categoryData);
        
        // Detectar si se está eliminando subcategorías (subconjunto estricto) o añadiendo
        const isSubset = newSubs.every((sub) => existingSubs.includes(sub));
        const isStrictSubset = isSubset && newSubs.length < existingSubs.length;
        
        if (isStrictSubset) {
          // ELIMINACIÓN EXPLÍCITA DE SUBCATEGORÍAS: El usuario eliminó subcategorías
          // Respetar la decisión del usuario y NO fusionar con Firestore
          // (Ya se verificó que no hay gastos antes de permitir la eliminación)
          finalCategories[categoryName] = {
            subcategories: newSubs,
            color: categoryData.color || (existingCategory ? getCategoryColor(existingCategory) : "#8B5CF6"),
          };
        } else if (newSubs.length > existingSubs.length || !isSubset) {
          // AÑADIR/MODIFICAR: Se están añadiendo nuevas subcategorías
          // Fusionar para preservar todas las subcategorías (existentes + nuevas)
          // Esto es una protección adicional por si acaso
          const allSubs = Array.from(new Set([...existingSubs, ...newSubs])).sort(
            (a, b) => a.localeCompare(b)
          );
          finalCategories[categoryName] = {
            subcategories: allSubs,
            color: categoryData.color || (existingCategory ? getCategoryColor(existingCategory) : "#8B5CF6"),
          };
        } else {
          // Mismo número, cambio de color, o nueva categoría
          // Usar los datos proporcionados
          finalCategories[categoryName] = {
            subcategories: newSubs,
            color: categoryData.color || (existingCategory ? getCategoryColor(existingCategory) : "#8B5CF6"),
          };
        }
      });
      
      // En modo "smart", NO preservar categorías que no están en migratedNewCategories
      // Si una categoría no está en el objeto pasado, se está eliminando explícitamente
    }

    // Validación final: en modo "smart", si una categoría no está en migratedNewCategories,
    // significa que se está eliminando explícitamente, así que NO la preservamos
    // En otros modos, preservar categorías que no se están modificando
    if (mergeMode === "smart") {
      // En modo smart, solo preservar categorías que están explícitamente en los datos nuevos
      // Si una categoría no está en migratedNewCategories, se está eliminando explícitamente
      // y NO debe preservarse
      
      // PROTECCIÓN ADICIONAL: Verificar que no se estén borrando categorías que existen en Firestore
      // pero no están en los datos nuevos. Si una categoría existe en Firestore pero no en los nuevos,
      // podría ser un error. En modo "smart", solo borramos si está explícitamente en el objeto pasado.
      // Si no está en el objeto pasado, significa que el usuario la eliminó intencionalmente.
    } else {
      // En modo "replace" o "merge", preservar categorías existentes que no se están modificando
      Object.keys(existingCategories).forEach((categoryName) => {
        if (!finalCategories[categoryName] && !migratedNewCategories[categoryName]) {
          // Categoría existente que no está en los datos nuevos ni en los finales
          // Solo preservarla en modos que no sean "smart"
          console.log(`[saveCategories] Preserving existing category in ${mergeMode} mode: ${categoryName}`);
          finalCategories[categoryName] = existingCategories[categoryName];
        }
      });
    }

    // VALIDACIÓN FINAL DE SEGURIDAD: Verificar que no se estén borrando categorías críticas
    // Si una categoría existía en Firestore y no está en finalCategories, registrar advertencia
    Object.keys(existingCategories).forEach((categoryName) => {
      if (!finalCategories[categoryName]) {
        console.warn(
          `[saveCategories] ⚠️ Categoría "${categoryName}" será eliminada. ` +
          `Modo: ${mergeMode}. Esto es normal si el usuario la eliminó explícitamente.`
        );
      }
    });

    // Guardar en Firestore
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      categories: finalCategories,
      updatedAt: new Date().toISOString(),
    });

    return finalCategories;
  } catch (error) {
    console.error("Error saving categories:", error);
    throw error;
  }
};

// Migrar categorías duplicadas (por ejemplo, versiones con y sin emoji)
const mergeDuplicateDefaultCategories = (categories) => {
  if (!categories || typeof categories !== "object") return categories;

  const duplicatesMap = {
    Alimentacion: "Alimentacion🫄",
    "Coche/Moto": "Coche/Moto 🏍️🏎️",
    Compras: "Compras🛍️",
    Educacion: "Educacion 🤖📚",
    Ocio: "Ocio 🍻",
    Salud: "Salud 🏋️‍♀️",
    Vivienda: "Vivienda🏡",
  };

  const updated = { ...categories };

  Object.entries(duplicatesMap).forEach(([baseName, emojiName]) => {
    const baseCat = updated[baseName];
    const emojiCat = updated[emojiName];

    if (baseCat && emojiCat) {
      // Fusionar subcategorías (únicas, ordenadas)
      const baseSubs = Array.isArray(baseCat.subcategories) ? baseCat.subcategories : [];
      const emojiSubs = Array.isArray(emojiCat.subcategories) ? emojiCat.subcategories : [];
      const mergedSubs = Array.from(new Set([...baseSubs, ...emojiSubs])).sort((a, b) =>
        a.localeCompare(b)
      );

      updated[emojiName] = {
        ...emojiCat,
        subcategories: mergedSubs,
      };

      // Eliminar la categoría base duplicada
      delete updated[baseName];
    }
  });

  return updated;
};

export const getUserCategories = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      const categories = data.categories || null;
      if (!categories) return null;
      
      // CRÍTICO: Si el usuario ya tiene categorías, NO hacer ninguna modificación automática
      // Solo migrar el formato si es absolutamente necesario (formato antiguo con arrays)
      const needsMigration = Object.values(categories).some(cat => Array.isArray(cat));
      
      if (needsMigration) {
        // Solo migrar formato (arrays -> objetos con color), pero PRESERVAR colores existentes
        const finalCategories = migrateCategoriesToNewFormat(categories);
        
        // Actualizar Firestore solo si hubo migración de formato
        const changed = JSON.stringify(finalCategories) !== JSON.stringify(categories);
        if (changed) {
          await updateDoc(userDocRef, {
            categories: finalCategories,
            updatedAt: new Date().toISOString(),
          });
          console.log(`[getUserCategories] Migrado formato de categorías para usuario ${userId}`);
        }
        
        // IMPORTANTE: NO fusionar categorías duplicadas automáticamente
        // El usuario puede tener categorías con nombres similares intencionalmente
        return finalCategories;
      }

      // Si no necesita migración, devolver las categorías TAL CUAL están
      // NO hacer ninguna modificación automática
      return categories;
    }
    return null;
  } catch (error) {
    console.error("Error getting categories:", error);
    throw error;
  }
};

export const getCategories = async (userId) => {
  return getUserCategories(userId);
};

// ==================== BUDGETS ====================

export const saveBudgets = async (userId, budgets) => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      budgets,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving budgets:", error);
    throw error;
  }
};

export const getUserBudgets = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data().budgets || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting budgets:", error);
    throw error;
  }
};

export const getBudgets = async (userId) => {
  return getUserBudgets(userId);
};

// ==================== THEME ====================

export const saveTheme = async (userId, theme) => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      theme,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving theme:", error);
    throw error;
  }
};

export const getUserTheme = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data().theme || "light";
    }
    return "light";
  } catch (error) {
    console.error("Error getting theme:", error);
    return "light";
  }
};

// ==================== LANGUAGE ====================

export const saveUserLanguage = async (userId, language) => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      language,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving language:", error);
    throw error;
  }
};

export const getUserLanguage = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data().language || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting language:", error);
    return null;
  }
};

// ==================== CHANGELOG ====================

export const markChangelogAsSeen = async (userId, version) => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      changelogSeen: version,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error marking changelog as seen:", error);
    throw error;
  }
};

export const markOnboardingAsCompleted = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error marking onboarding as completed:", error);
    throw error;
  }
};

export const getOnboardingStatus = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        completed: data.onboardingCompleted || false,
        completedAt: data.onboardingCompletedAt || null,
      };
    }
    return { completed: false, completedAt: null };
  } catch (error) {
    console.error("Error getting onboarding status:", error);
    return { completed: false, completedAt: null };
  }
};

export const getChangelogSeenVersion = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data().changelogSeen || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting changelog seen version:", error);
    return null;
  }
};

// ==================== USER INITIALIZATION ====================

/**
 * Inicializa un usuario nuevo o actualiza datos básicos de un usuario existente.
 * IMPORTANTE: Las categorías predeterminadas SOLO se establecen para usuarios nuevos.
 * Si un usuario ya tiene categorías (aunque sea una), NUNCA se sobrescriben.
 */
export const initializeUser = async (userId, userData) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    const defaultCategories = {
      Alimentacion: {
        subcategories: ["Supermercado", "Restaurantes", "Cafeterias"],
        color: "#8B5CF6",
      },
      Transporte: {
        subcategories: ["Combustible", "Transporte publico", "Taxi"],
        color: "#3B82F6",
      },
      Vivienda: {
        subcategories: ["Alquiler", "Hipoteca", "Suministros"],
        color: "#EC4899",
      },
      Ocio: {
        subcategories: ["Streaming", "Deportes", "Hobbies"],
        color: "#10B981",
      },
      Salud: {
        subcategories: ["Medico", "Farmacia", "Gimnasio"],
        color: "#F59E0B",
      },
      Compras: {
        subcategories: ["Ropa", "Electronica", "Otros"],
        color: "#EF4444",
      },
      Educacion: {
        subcategories: ["Cursos", "Libros", "Material"],
        color: "#6366F1",
      },
    };

    if (userDoc.exists()) {
      // Usuario existente: NO MODIFICAR NADA que ya exista
      const currentData = userDoc.data();
      
      // CRÍTICO: Para usuarios existentes, NO hacer NINGUNA modificación automática
      // Solo actualizar el email si es diferente y se proporciona
      const updateData = {};
      
      // Actualizar email SOLO si se proporciona Y es diferente
      if (userData.email && userData.email !== currentData.email) {
        updateData.email = userData.email;
        updateData.updatedAt = new Date().toISOString();
      }

      // NUNCA modificar estos campos para usuarios existentes:
      // - categories (aunque estén vacías o en formato antiguo)
      // - theme (aunque no exista, no establecer "light" por defecto)
      // - budgets (aunque no exista, no establecer {} por defecto)
      // - income (aunque no exista, no establecer 0 por defecto)
      // - goals (aunque no exista, no establecer {} por defecto)
      // - language (aunque no exista, no establecer "es" por defecto)
      // 
      // El usuario debe configurar estos valores manualmente si los necesita.
      // Si no existen, es porque el usuario no los ha configurado aún o los eliminó intencionalmente.

      // Solo actualizar si hay algo que actualizar (solo email)
      if (Object.keys(updateData).length > 0) {
        await updateDoc(userDocRef, updateData);
        console.log(`[initializeUser] Usuario existente ${userId}: solo actualizado email si cambió`);
      } else {
        console.log(`[initializeUser] Usuario existente ${userId}: NO se modificó nada`);
      }
      return;
    }

    // Usuario nuevo: establecer todas las categorías predeterminadas
    console.log(`[initializeUser] Creando nuevo usuario ${userId} con categorías predeterminadas`);
    await setDoc(userDocRef, {
      ...userData,
      categories: defaultCategories,
      budgets: {},
      theme: "light",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error initializing user:", error);
    throw error;
  }
};

// ==================== INCOME ====================

export const saveIncome = async (userId, income) => {
  try {
    // Si income es null o undefined, guardar null (no configurado)
    if (income === null || income === undefined) {
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        income: null,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    // Validar que el ingreso no sea negativo
    const incomeValue = parseFloat(income);
    if (isNaN(incomeValue) || incomeValue < 0) {
      throw new Error("El ingreso debe ser un número positivo");
    }
    
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      income: incomeValue,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving income:", error);
    throw error;
  }
};

export const getUserIncome = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const income = userDoc.data().income;
      // Si no existe el campo income o es 0, devolver null (usuario no ha configurado ingresos)
      // Solo devolver 0 si explícitamente está guardado como 0
      if (income === undefined || income === null) {
        return null;
      }
      return income;
    }
    // Usuario nuevo, no tiene ingresos configurados
    return null;
  } catch (error) {
    console.error("Error getting income:", error);
    throw error;
  }
};

// ==================== GOALS ====================

export const saveGoals = async (userId, goals) => {
  try {
    // Validar que los objetivos no sean negativos
    const validatedGoals = { ...goals };
    
    // Validar monthlySavingsGoal
    if (validatedGoals.monthlySavingsGoal !== undefined) {
      const value = parseFloat(validatedGoals.monthlySavingsGoal) || 0;
      if (value < 0) {
        throw new Error("El objetivo de ahorro mensual no puede ser negativo");
      }
      validatedGoals.monthlySavingsGoal = value;
    }
    
    // Validar totalSavingsGoal
    if (validatedGoals.totalSavingsGoal !== undefined) {
      const value = parseFloat(validatedGoals.totalSavingsGoal) || 0;
      if (value < 0) {
        throw new Error("El objetivo de ahorro total no puede ser negativo");
      }
      validatedGoals.totalSavingsGoal = value;
    }
    
    // Validar categoryGoals
    if (validatedGoals.categoryGoals) {
      Object.keys(validatedGoals.categoryGoals).forEach((category) => {
        const value = parseFloat(validatedGoals.categoryGoals[category]) || 0;
        if (value < 0) {
          throw new Error(`El objetivo de la categoría ${category} no puede ser negativo`);
        }
        validatedGoals.categoryGoals[category] = value;
      });
    }
    
    // Validar longTermGoals
    if (validatedGoals.longTermGoals && Array.isArray(validatedGoals.longTermGoals)) {
      validatedGoals.longTermGoals = validatedGoals.longTermGoals.map((goal) => {
        const targetAmount = parseFloat(goal.targetAmount) || 0;
        const currentAmount = parseFloat(goal.currentAmount) || 0;
        if (targetAmount < 0) {
          throw new Error(`El objetivo a largo plazo "${goal.name}" no puede tener un monto objetivo negativo`);
        }
        if (currentAmount < 0) {
          throw new Error(`El objetivo a largo plazo "${goal.name}" no puede tener un monto actual negativo`);
        }
        return {
          ...goal,
          targetAmount,
          currentAmount,
        };
      });
    }
    
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      goals: {
        ...validatedGoals,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving goals:", error);
    throw error;
  }
};

export const getUserGoals = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const goals = userDoc.data().goals;
      
      // Si no existe el campo goals, devolver null (usuario no ha configurado objetivos)
      if (!goals) {
        return null;
      }
      
      // Migrar estructura antigua a nueva si es necesario
      if (goals.totalSavingsGoal !== undefined) {
        return {
          // Mantener compatibilidad con estructura anterior
          monthlySavingsGoal: goals.totalSavingsGoal || goals.monthlySavingsGoal || 0,
          totalSavingsGoal: goals.totalSavingsGoal || 0, // Mantener por compatibilidad
          categoryGoals: goals.categoryGoals || {},
          longTermGoals: goals.longTermGoals || [],
          achievements: goals.achievements || {
            totalCompleted: 0,
            streakMonths: 0,
            badges: [],
          },
          monthlyHistory: goals.monthlyHistory || {},
          createdAt: goals.createdAt || new Date().toISOString(),
          updatedAt: goals.updatedAt || new Date().toISOString(),
        };
      }
      
      // Si existe pero está vacío, devolver null
      const hasAnyGoal = 
        (goals.monthlySavingsGoal && goals.monthlySavingsGoal > 0) ||
        (goals.totalSavingsGoal && goals.totalSavingsGoal > 0) ||
        (goals.categoryGoals && Object.keys(goals.categoryGoals).length > 0) ||
        (goals.longTermGoals && goals.longTermGoals.length > 0);
      
      if (!hasAnyGoal) {
        return null;
      }
      
      return goals;
    }
    // Usuario nuevo, no tiene objetivos configurados
    return null;
  } catch (error) {
    console.error("Error getting goals:", error);
    throw error;
  }
};

// ==================== NOTIFICATIONS ====================

export const saveNotificationSettings = async (userId, settings) => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      notificationSettings: {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving notification settings:", error);
    throw error;
  }
};

export const getUserNotificationSettings = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const settings = userDoc.data().notificationSettings || null;
      return settings || {
        budgetAlerts: {
          enabled: true,
          at80: true,
          at90: true,
          at100: true,
        },
        recurringReminders: {
          enabled: true,
        },
        customReminders: {
          enabled: true,
          message: "No olvides registrar tus gastos",
        },
        weeklyReminder: {
          enabled: true,
          dayOfWeek: 0, // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
          message: "¡No olvides registrar tus gastos de esta semana en Clarity!",
        },
        monthlyIncomeReminder: {
          enabled: true,
          dayOfMonth: 28, // Día del mes para enviar el recordatorio
        },
        pushNotifications: {
          enabled: false,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return {
      budgetAlerts: {
        enabled: true,
        at80: true,
        at90: true,
        at100: true,
      },
      recurringReminders: {
        enabled: true,
      },
      customReminders: {
        enabled: true,
        message: "No olvides registrar tus gastos",
      },
      weeklyReminder: {
        enabled: true,
        dayOfWeek: 0, // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
        message: "¡No olvides registrar tus gastos de esta semana en Clarity!",
      },
      monthlyIncomeReminder: {
        enabled: true,
        dayOfMonth: 28, // Día del mes para enviar el recordatorio
      },
      pushNotifications: {
        enabled: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting notification settings:", error);
    throw error;
  }
};
