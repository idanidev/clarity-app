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
    const expensesRef = collection(db, "users", userId, "expenses");
    const docRef = await addDoc(expensesRef, {
      ...expenseData,
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
    const expenseRef = doc(db, "users", userId, "expenses", expenseId);
    await updateDoc(expenseRef, {
      ...expenseData,
      updatedAt: new Date().toISOString(),
    });
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
    const recurringRef = collection(db, "users", userId, "recurringExpenses");
    const docRef = await addDoc(recurringRef, {
      ...recurringData,
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
    const recurringRef = doc(
      db,
      "users",
      userId,
      "recurringExpenses",
      recurringId
    );
    await updateDoc(recurringRef, {
      ...recurringData,
      updatedAt: new Date().toISOString(),
    });
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

    // PRESERVAR el color existente si existe, solo usar default si NO hay color
    let color;
    if (categoryData && typeof categoryData === "object" && categoryData.color) {
      // Si ya tiene color, preservarlo
      color = categoryData.color;
    } else if (Array.isArray(categoryData)) {
      // Formato antiguo (array), usar color por defecto
      color = defaultColors[colorIndex % defaultColors.length];
    } else {
      // No tiene color, usar color por defecto
      color = defaultColors[colorIndex % defaultColors.length];
    }

    migrated[categoryName] = {
      subcategories: Array.from(new Set(normalizedSubcategories)).sort((a, b) =>
        a.localeCompare(b)
      ),
      color,
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
    if (!categories || typeof categories !== "object") {
      console.error("Invalid categories data provided to saveCategories");
      throw new Error("Invalid categories data");
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

export const getUserCategories = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const categories = userDoc.data().categories || null;
      if (!categories) return null;
      
      // Si las categorías ya están en el formato nuevo (tienen color), devolverlas tal cual
      // Solo migrar si están en formato antiguo (arrays)
      const needsMigration = Object.values(categories).some(cat => Array.isArray(cat));
      
      if (needsMigration) {
        // Solo migrar si es necesario (formato antiguo)
        return migrateCategoriesToNewFormat(categories);
      } else {
        // Ya están en formato nuevo, devolverlas sin modificar
        return categories;
      }
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
      // Usuario existente: NO tocar las categorías si ya tiene
      const currentData = userDoc.data();
      const existingCategories = currentData.categories;
      const hasCategories = 
        existingCategories &&
        typeof existingCategories === "object" &&
        Object.keys(existingCategories).length > 0;

      // Construir updateData sin incluir categories si el usuario ya las tiene
      const updateData = {
        updatedAt: new Date().toISOString(),
      };

      // Actualizar email si se proporciona (solo si es diferente)
      if (userData.email && userData.email !== currentData.email) {
        updateData.email = userData.email;
      }

      // SOLO establecer categorías predeterminadas si el usuario NO tiene ninguna
      if (!hasCategories) {
        console.log(`[initializeUser] Usuario ${userId} no tiene categorías, estableciendo predeterminadas`);
        updateData.categories = defaultCategories;
      } else {
        console.log(`[initializeUser] Usuario ${userId} ya tiene ${Object.keys(existingCategories).length} categorías, NO se tocan`);
        // EXPLÍCITAMENTE NO incluir categories en updateData
        // Esto garantiza que las categorías existentes nunca se sobrescriban
      }

      // Solo establecer valores por defecto si no existen
      if (currentData.budgets === undefined || currentData.budgets === null) {
        updateData.budgets = {};
      }
      if (!currentData.theme) {
        updateData.theme = "light";
      }

      // Solo actualizar si hay algo que actualizar (evitar escrituras innecesarias)
      const fieldsToUpdate = Object.keys(updateData).filter(key => key !== "updatedAt");
      if (fieldsToUpdate.length > 0) {
        await updateDoc(userDocRef, updateData);
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
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      income: parseFloat(income) || 0,
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
      return userDoc.data().income || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error getting income:", error);
    throw error;
  }
};

// ==================== GOALS ====================

export const saveGoals = async (userId, goals) => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      goals: {
        ...goals,
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
      const goals = userDoc.data().goals || null;
      
      // Migrar estructura antigua a nueva si es necesario
      if (goals && goals.totalSavingsGoal !== undefined) {
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
      
      return goals || {
        monthlySavingsGoal: 0,
        totalSavingsGoal: 0, // Compatibilidad
        categoryGoals: {},
        longTermGoals: [],
        achievements: {
          totalCompleted: 0,
          streakMonths: 0,
          badges: [],
        },
        monthlyHistory: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return {
      monthlySavingsGoal: 0,
      totalSavingsGoal: 0, // Compatibilidad
      categoryGoals: {},
      longTermGoals: [],
      achievements: {
        totalCompleted: 0,
        streakMonths: 0,
        badges: [],
      },
      monthlyHistory: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting notification settings:", error);
    throw error;
  }
};
