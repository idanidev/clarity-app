/**
 * Script para actualizar tu usuario a admin
 * Ejecutar en la consola del navegador (F12) en tu app
 */

// Copia y pega esto en la consola del navegador (F12) cuando estés en tu app

import { getAuth } from "firebase/auth";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { db } from "./src/firebase";

const auth = getAuth();
const user = auth.currentUser;

if (user) {
  console.log("🔄 Actualizando usuario a admin...");
  console.log("Tu User ID:", user.uid);
  
  const userRef = doc(db, "users", user.uid);
  
  updateDoc(userRef, {
    role: "admin",
    unlimited: true,
    plan: "admin",
    "aiQuotas.unlimited": true,
    "aiQuotas.plan": "admin"
  }).then(() => {
    console.log("✅ ¡Usuario configurado como admin!");
    console.log("🔄 Recarga la página para ver los cambios");
    alert("✅ ¡Admin configurado! Recarga la página para ver el badge de infinito");
  }).catch((error) => {
    console.error("❌ Error:", error);
    alert("❌ Error: " + error.message);
  });
} else {
  console.error("❌ No hay usuario autenticado. Asegúrate de estar logueado.");
}


