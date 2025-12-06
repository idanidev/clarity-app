/**
 * Script para restaurar categorías y subcategorías desde los gastos del usuario
 * 
 * Uso:
 *   node scripts/restoreCategoriesFromExpenses.js USER_ID
 * 
 * O con variables de entorno:
 *   USER_ID=tu_user_id node scripts/restoreCategoriesFromExpenses.js
 */

import admin from "firebase-admin";

// Inicializar Firebase Admin SDK
// Solo necesitamos el projectId, el Admin SDK usará las credenciales de aplicación por defecto
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error("\n❌ Error: VITE_FIREBASE_PROJECT_ID no está configurado");
  console.error("\nPor favor, exporta la variable de entorno:");
  console.error("  export VITE_FIREBASE_PROJECT_ID=tu_project_id\n");
  process.exit(1);
}

// Inicializar Admin SDK
// Si no hay credenciales de servicio, intentará usar las credenciales de aplicación por defecto
// o puedes configurar GOOGLE_APPLICATION_CREDENTIALS apuntando a un archivo JSON de credenciales
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: projectId,
    });
  }
} catch (error) {
  console.error("\n❌ Error al inicializar Firebase Admin SDK:", error.message);
  console.error("\nSi ves un error de credenciales, puedes:");
  console.error("  1. Exportar GOOGLE_APPLICATION_CREDENTIALS apuntando a un archivo JSON de credenciales de servicio");
  console.error("  2. O usar 'gcloud auth application-default login' para autenticarte\n");
  process.exit(1);
}

const db = admin.firestore();

// Colores predeterminados para categorías (si no tienen color)
const DEFAULT_COLORS = [
  "#8B5CF6", // Morado
  "#3B82F6", // Azul
  "#EC4899", // Rosa
  "#10B981", // Verde
  "#F59E0B", // Amarillo
  "#EF4444", // Rojo
  "#6366F1", // Índigo
  "#14B8A6", // Cian
  "#F97316", // Naranja
  "#84CC16", // Lima
];

let colorIndex = 0;

function getNextColor() {
  const color = DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length];
  colorIndex++;
  return color;
}

async function restoreCategoriesFromExpenses(userId) {
  try {
    console.log(`\n🔍 Buscando gastos para el usuario: ${userId}\n`);

    // 1. Obtener todos los gastos del usuario
    const expensesRef = db.collection("users").doc(userId).collection("expenses");
    const expensesSnapshot = await expensesRef.orderBy("date", "desc").get();

    if (expensesSnapshot.empty) {
      console.log("❌ No se encontraron gastos para este usuario.");
      return;
    }

    const expenses = expensesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Se encontraron ${expenses.length} gastos\n`);

    // 2. Extraer categorías y subcategorías únicas
    const categoriesMap = new Map();

    expenses.forEach((expense) => {
      const category = expense.category;
      const subcategory = expense.subcategory;

      if (!category) {
        return; // Saltar gastos sin categoría
      }

      // Si la categoría no existe, crearla
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, {
          subcategories: new Set(),
          color: null, // Se asignará después si no existe
        });
      }

      // Agregar subcategoría si existe
      if (subcategory && subcategory.trim()) {
        categoriesMap.get(category).subcategories.add(subcategory.trim());
      }
    });

    // 3. Convertir Sets a Arrays y preparar el objeto de categorías
    const restoredCategories = {};
    colorIndex = 0;

    categoriesMap.forEach((data, categoryName) => {
      restoredCategories[categoryName] = {
        subcategories: Array.from(data.subcategories).sort(),
        color: data.color || getNextColor(),
      };
    });

    console.log("📊 Categorías encontradas en los gastos:\n");
    Object.entries(restoredCategories).forEach(([category, data]) => {
      console.log(`  • ${category}`);
      console.log(`    Subcategorías: ${data.subcategories.length > 0 ? data.subcategories.join(", ") : "(ninguna)"}`);
      console.log(`    Color: ${data.color}\n`);
    });

    // 4. Obtener las categorías actuales del usuario
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.log("❌ El usuario no existe en Firestore.");
      return;
    }

    const currentUserData = userDoc.data();
    const currentCategories = currentUserData.categories || {};

    console.log(`\n📋 Categorías actuales del usuario: ${Object.keys(currentCategories).length}\n`);

    // 5. Fusionar: mantener las categorías existentes y agregar las nuevas
    const mergedCategories = { ...currentCategories };

    Object.entries(restoredCategories).forEach(([categoryName, categoryData]) => {
      if (mergedCategories[categoryName]) {
        // Categoría existente: fusionar subcategorías
        const existingSubs = Array.isArray(mergedCategories[categoryName].subcategories)
          ? mergedCategories[categoryName].subcategories
          : [];

        const newSubs = categoryData.subcategories;
        const allSubs = Array.from(new Set([...existingSubs, ...newSubs])).sort();

        mergedCategories[categoryName] = {
          ...mergedCategories[categoryName], // Mantener color y otros datos existentes
          subcategories: allSubs,
        };

        console.log(`  ✅ Actualizada: ${categoryName} (${allSubs.length} subcategorías)`);
      } else {
        // Nueva categoría: agregarla
        mergedCategories[categoryName] = categoryData;
        console.log(`  ➕ Nueva: ${categoryName} (${categoryData.subcategories.length} subcategorías)`);
      }
    });

    // 6. Actualizar el documento del usuario
    console.log(`\n💾 Actualizando categorías en Firestore...\n`);

    await userDocRef.update({
      categories: mergedCategories,
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ ¡Categorías restauradas exitosamente!\n`);
    console.log(`📊 Resumen:`);
    console.log(`   - Total de categorías: ${Object.keys(mergedCategories).length}`);
    console.log(`   - Categorías restauradas desde gastos: ${Object.keys(restoredCategories).length}`);
    console.log(`   - Categorías que ya existían: ${Object.keys(currentCategories).length}\n`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error al restaurar categorías:", error);
    console.error("\nDetalles:", error.message);
    if (error.stack) {
      console.error("\nStack:", error.stack);
    }
    process.exit(1);
  }
}

// Obtener USER_ID de argumentos o variables de entorno
const userId = process.argv[2] || process.env.USER_ID;

if (!userId) {
  console.error("\n❌ Error: Debes proporcionar el ID del usuario");
  console.error("\nUso:");
  console.error("  node scripts/restoreCategoriesFromExpenses.js USER_ID");
  console.error("\nO con variable de entorno:");
  console.error("  USER_ID=tu_user_id node scripts/restoreCategoriesFromExpenses.js\n");
  process.exit(1);
}

// Ejecutar el script
restoreCategoriesFromExpenses(userId);
