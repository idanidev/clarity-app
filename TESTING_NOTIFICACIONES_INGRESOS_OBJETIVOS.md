# Testing: Notificaciones, Ingresos y Objetivos

## Cambios Realizados

### 1. Validación de Negativos

#### Frontend (Inputs)
- ✅ Todos los inputs numéricos tienen `min="0"` y validación `parseFloat(value) >= 0`
- ✅ Validación en:
  - AddExpenseModal
  - EditExpenseModal
  - GoalsModal (monthlySavingsGoal, categoryGoals, longTermGoals)
  - SettingsModal (income)
  - BudgetsModal
  - RecurringExpensesModal

#### Backend (Firebase)
- ✅ Validación añadida en `saveIncome()` - previene valores negativos
- ✅ Validación añadida en `saveGoals()` - previene valores negativos en:
  - monthlySavingsGoal
  - totalSavingsGoal
  - categoryGoals (cada categoría)
  - longTermGoals (targetAmount y currentAmount)
- ✅ Validación existente en `addExpense()` y `updateExpense()`

### 2. Guardado en Firebase

#### Ingresos
- ✅ Función: `saveIncome(userId, income)` en `firestoreService.js`
- ✅ Se guarda en: `users/{userId}/income`
- ✅ Se llama desde: `SettingsModal` → `handleSaveIncome()` → `onSaveIncome()`
- ✅ Validación: No permite valores negativos

#### Objetivos
- ✅ Función: `saveGoals(userId, goals)` en `firestoreService.js`
- ✅ Se guarda en: `users/{userId}/goals`
- ✅ Se llama desde: `GoalsModal` → `handleSave()` → `onSaveGoals()`
- ✅ Estructura guardada:
  - monthlySavingsGoal
  - totalSavingsGoal (compatibilidad)
  - categoryGoals
  - longTermGoals
  - achievements
  - monthlyHistory
- ✅ Validación: No permite valores negativos en ningún campo

#### Notificaciones
- ✅ Función: `saveNotificationSettings(userId, settings)` en `firestoreService.js`
- ✅ Se guarda en: `users/{userId}/notificationSettings`
- ✅ Se llama desde: `SettingsModal` → `handleSaveNotifications()` → `onSaveNotificationSettings()`
- ✅ Estructura guardada:
  - budgetAlerts
  - recurringReminders
  - customReminders
  - weeklyReminder (nuevo)
  - pushNotifications

## Checklist de Pruebas

### Ingresos
- [ ] Abrir SettingsModal
- [ ] Cambiar el valor de ingresos
- [ ] Hacer clic en "Guardar"
- [ ] Verificar que se muestra notificación de éxito
- [ ] Cerrar y volver a abrir SettingsModal
- [ ] Verificar que el valor se mantiene
- [ ] Intentar ingresar un valor negativo
- [ ] Verificar que no se puede ingresar negativo
- [ ] Verificar en Firebase Console que el valor se guardó correctamente

### Objetivos
- [ ] Abrir GoalsModal
- [ ] Cambiar objetivo de ahorro mensual
- [ ] Añadir objetivo por categoría
- [ ] Añadir objetivo a largo plazo
- [ ] Hacer clic en "Guardar"
- [ ] Verificar que se muestra notificación de éxito
- [ ] Cerrar y volver a abrir GoalsModal
- [ ] Verificar que los valores se mantienen
- [ ] Intentar ingresar valores negativos en:
  - Objetivo mensual
  - Objetivo por categoría
  - Objetivo a largo plazo (targetAmount y currentAmount)
- [ ] Verificar que no se pueden ingresar negativos
- [ ] Verificar en Firebase Console que los valores se guardaron correctamente

### Notificaciones
- [ ] Abrir SettingsModal
- [ ] Cambiar configuración de notificaciones:
  - Alertas de presupuesto
  - Recordatorios recurrentes
  - Recordatorios personalizados
  - Recordatorio semanal (nuevo)
  - Notificaciones push
- [ ] Hacer clic en "Guardar"
- [ ] Verificar que se muestra notificación de éxito
- [ ] Cerrar y volver a abrir SettingsModal
- [ ] Verificar que las configuraciones se mantienen
- [ ] Verificar en Firebase Console que las configuraciones se guardaron correctamente

### Validación de Negativos
- [ ] Intentar ingresar valores negativos en todos los inputs numéricos
- [ ] Verificar que el frontend previene la entrada de negativos
- [ ] Verificar que el backend también valida (aunque no debería llegar un negativo)
- [ ] Verificar mensajes de error si se intenta guardar un negativo

## Notas

- Los valores se guardan cuando se hace clic en "Guardar" en cada modal
- No hay guardado automático, requiere acción del usuario
- La validación funciona tanto en frontend como en backend
- Los valores se persisten en Firebase y se cargan al iniciar sesión

