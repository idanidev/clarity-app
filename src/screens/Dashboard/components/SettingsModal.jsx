import { useState } from "react";
import { Bell, DollarSign, Globe, Moon, Sun, X, TestTube, Calendar } from "lucide-react";
import { useLanguage, useTranslation } from "../../../contexts/LanguageContext";
import { showTestNotification, areNotificationsEnabled } from "../../../services/pushNotificationService";

const SettingsModal = ({
  visible,
  darkMode,
  cardClass,
  textClass,
  textSecondaryClass,
  toggleDarkMode,
  onClose,
  income,
  onSaveIncome,
  notificationSettings,
  onSaveNotificationSettings,
  onRequestPushPermission,
  onOpenBudgets,
  showNotification,
}) => {
  const { t } = useTranslation();
  const { language, changeLanguage, availableLanguages } = useLanguage();
  const [localIncome, setLocalIncome] = useState(income || 0);
  const [localNotificationSettings, setLocalNotificationSettings] = useState(notificationSettings || {
    budgetAlerts: { enabled: true, at80: true, at90: true, at100: true },
    recurringReminders: { enabled: true },
    customReminders: { enabled: true, message: "No olvides registrar tus gastos" },
    weeklyReminder: { enabled: true, dayOfWeek: 0, message: "¡No olvides registrar tus gastos de esta semana en Clarity!" },
    pushNotifications: { enabled: false },
  });
  const [activeTab, setActiveTab] = useState("general"); // "general" | "notifications"

  if (!visible) {
    return null;
  }

  const handleSaveIncome = () => {
    onSaveIncome(localIncome);
  };

  const handleSaveNotifications = () => {
    onSaveNotificationSettings(localNotificationSettings);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={onClose}
    >
      <div
        className={`${cardClass} rounded-2xl p-0 max-w-2xl w-full border shadow-2xl max-h-[90vh] overflow-y-auto`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className={`sticky top-0 z-10 px-6 py-4 flex justify-between items-center ${
            darkMode
              ? "bg-gray-800/95 border-b border-gray-700"
              : "bg-white/80 border-b border-purple-100"
          } backdrop-blur`}
        >
          <h3 className={`text-2xl font-bold ${textClass}`}>
            {t("settings.title")}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
            } transition-all`}
          >
            <X className={`w-6 h-6 ${textClass}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all ${
              activeTab === "general"
                ? darkMode
                  ? "bg-gray-700 text-white border-b-2 border-purple-500"
                  : "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
                : darkMode
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-600 hover:text-purple-600"
            }`}
          >
            {t("settings.general")}
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === "notifications"
                ? darkMode
                  ? "bg-gray-700 text-white border-b-2 border-purple-500"
                  : "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
                : darkMode
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-600 hover:text-purple-600"
            }`}
          >
            <Bell className="w-4 h-4" />
            {t("settings.notifications")}
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {activeTab === "general" && (
            <>
              {/* Ingresos */}
              <div
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign
                    className={`w-5 h-5 ${
                      darkMode ? "text-purple-400" : "text-purple-600"
                    }`}
                  />
                  <div className="flex-1">
                    <p className={`font-medium ${textClass}`}>
                      {t("settings.income")}
                    </p>
                    <p className={`text-sm ${textSecondaryClass} mt-1`}>
                      {t("settings.incomeDescription")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={localIncome}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || parseFloat(value) >= 0) {
                        setLocalIncome(parseFloat(value) || 0);
                      }
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-800 border-gray-600 text-gray-100"
                        : "bg-white border-purple-200 text-purple-900"
                    } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                    placeholder="0.00"
                  />
                  <button
                    onClick={handleSaveIncome}
                    className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-all"
                  >
                    {t("common.save")}
                  </button>
                </div>
              </div>

              {/* Presupuestos */}
              <div
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      darkMode ? "bg-purple-900/50" : "bg-purple-100"
                    }`}>
                      <span className="text-lg">💰</span>
                    </div>
                    <div>
                      <p className={`font-medium ${textClass}`}>
                        {t("dashboard.budgets")}
                      </p>
                      <p className={`text-sm ${textSecondaryClass}`}>
                        {t("settings.budgetsDescription")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onOpenBudgets}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-all"
                  >
                    {t("settings.manageBudgets")}
                  </button>
                </div>
              </div>

              {/* Tema */}
              <div
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {darkMode ? (
                      <Moon
                        className={`w-5 h-5 ${
                          darkMode ? "text-purple-400" : "text-purple-600"
                        }`}
                      />
                    ) : (
                      <Sun
                        className={`w-5 h-5 ${
                          darkMode ? "text-purple-400" : "text-purple-600"
                        }`}
                      />
                    )}
                    <div>
                      <p className={`font-medium ${textClass}`}>
                        {darkMode
                          ? t("settings.darkMode")
                          : t("settings.lightMode")}
                      </p>
                      <p className={`text-sm ${textSecondaryClass}`}>
                        {t("settings.changeTheme")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      darkMode ? "bg-purple-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        darkMode ? "translate-x-7" : ""
                      }`}
                    ></div>
                  </button>
                </div>
              </div>

              {/* Idioma */}
              <div
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Globe
                    className={`w-5 h-5 ${
                      darkMode ? "text-purple-400" : "text-purple-600"
                    }`}
                  />
                  <div className="flex-1">
                    <p className={`font-medium ${textClass}`}>
                      {t("settings.language")}
                    </p>
                    <p className={`text-sm ${textSecondaryClass} mt-1`}>
                      {t("settings.languageDescription")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mt-3">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        language === lang.code
                          ? darkMode
                            ? "bg-purple-600 text-white"
                            : "bg-purple-600 text-white"
                          : darkMode
                          ? "bg-gray-600 text-gray-200 hover:bg-gray-500"
                          : "bg-white text-gray-700 hover:bg-purple-100 border border-gray-200"
                      }`}
                    >
                      {lang.flag} {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Acerca de */}
              <div
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <p className={`font-medium ${textClass}`}>{t("settings.about")}</p>
                <p className={`text-sm ${textSecondaryClass}`}>
                  {t("settings.version")} 2.0.1 - Gestión de gastos personales
                </p>
              </div>
            </>
          )}

          {activeTab === "notifications" && (
            <>
              {/* Alertas de presupuesto */}
              <div
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Bell
                      className={`w-5 h-5 ${
                        darkMode ? "text-purple-400" : "text-purple-600"
                      }`}
                    />
                    <div>
                      <p className={`font-medium ${textClass}`}>
                        {t("settings.budgetAlerts")}
                      </p>
                      <p className={`text-sm ${textSecondaryClass}`}>
                        {t("settings.budgetAlertsDescription")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setLocalNotificationSettings({
                        ...localNotificationSettings,
                        budgetAlerts: {
                          ...localNotificationSettings.budgetAlerts,
                          enabled: !localNotificationSettings.budgetAlerts.enabled,
                        },
                      });
                    }}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      localNotificationSettings.budgetAlerts.enabled
                        ? "bg-purple-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        localNotificationSettings.budgetAlerts.enabled
                          ? "translate-x-7"
                          : ""
                      }`}
                    ></div>
                  </button>
                </div>
                {localNotificationSettings.budgetAlerts.enabled && (
                  <div className="space-y-2 mt-4 pl-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localNotificationSettings.budgetAlerts.at80}
                        onChange={(e) => {
                          setLocalNotificationSettings({
                            ...localNotificationSettings,
                            budgetAlerts: {
                              ...localNotificationSettings.budgetAlerts,
                              at80: e.target.checked,
                            },
                          });
                        }}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className={textClass}>{t("settings.alertAt80")}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localNotificationSettings.budgetAlerts.at90}
                        onChange={(e) => {
                          setLocalNotificationSettings({
                            ...localNotificationSettings,
                            budgetAlerts: {
                              ...localNotificationSettings.budgetAlerts,
                              at90: e.target.checked,
                            },
                          });
                        }}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className={textClass}>{t("settings.alertAt90")}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localNotificationSettings.budgetAlerts.at100}
                        onChange={(e) => {
                          setLocalNotificationSettings({
                            ...localNotificationSettings,
                            budgetAlerts: {
                              ...localNotificationSettings.budgetAlerts,
                              at100: e.target.checked,
                            },
                          });
                        }}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className={textClass}>{t("settings.alertAt100")}</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Recordatorios de gastos recurrentes */}
              <div
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell
                      className={`w-5 h-5 ${
                        darkMode ? "text-purple-400" : "text-purple-600"
                      }`}
                    />
                    <div>
                      <p className={`font-medium ${textClass}`}>
                        {t("settings.recurringReminders")}
                      </p>
                      <p className={`text-sm ${textSecondaryClass}`}>
                        {t("settings.recurringRemindersDescription")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setLocalNotificationSettings({
                        ...localNotificationSettings,
                        recurringReminders: {
                          ...localNotificationSettings.recurringReminders,
                          enabled: !localNotificationSettings.recurringReminders.enabled,
                        },
                      });
                    }}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      localNotificationSettings.recurringReminders.enabled
                        ? "bg-purple-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        localNotificationSettings.recurringReminders.enabled
                          ? "translate-x-7"
                          : ""
                      }`}
                    ></div>
                  </button>
                </div>
              </div>

              {/* Recordatorios personalizados */}
              <div
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Bell
                      className={`w-5 h-5 ${
                        darkMode ? "text-purple-400" : "text-purple-600"
                      }`}
                    />
                    <div>
                      <p className={`font-medium ${textClass}`}>
                        {t("settings.customReminders")}
                      </p>
                      <p className={`text-sm ${textSecondaryClass}`}>
                        {t("settings.customRemindersDescription")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setLocalNotificationSettings({
                        ...localNotificationSettings,
                        customReminders: {
                          ...localNotificationSettings.customReminders,
                          enabled: !localNotificationSettings.customReminders.enabled,
                        },
                      });
                    }}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      localNotificationSettings.customReminders.enabled
                        ? "bg-purple-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        localNotificationSettings.customReminders.enabled
                          ? "translate-x-7"
                          : ""
                      }`}
                    ></div>
                  </button>
                </div>
                {localNotificationSettings.customReminders.enabled && (
                  <div className="mt-4 pl-8">
                    <input
                      type="text"
                      value={localNotificationSettings.customReminders.message}
                      onChange={(e) => {
                        setLocalNotificationSettings({
                          ...localNotificationSettings,
                          customReminders: {
                            ...localNotificationSettings.customReminders,
                            message: e.target.value,
                          },
                        });
                      }}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-gray-100"
                          : "bg-white border-purple-200 text-purple-900"
                      } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                      placeholder={t("settings.customReminderPlaceholder")}
                    />
                  </div>
                )}
              </div>

              {/* Recordatorio Semanal */}
              <div
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Calendar
                      className={`w-5 h-5 ${
                        darkMode ? "text-purple-400" : "text-purple-600"
                      }`}
                    />
                    <div>
                      <p className={`font-medium ${textClass}`}>
                        {t("settings.weeklyReminder")}
                      </p>
                      <p className={`text-sm ${textSecondaryClass}`}>
                        {t("settings.weeklyReminderDescription")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setLocalNotificationSettings({
                        ...localNotificationSettings,
                        weeklyReminder: {
                          ...localNotificationSettings.weeklyReminder,
                          enabled: !localNotificationSettings.weeklyReminder?.enabled,
                        },
                      });
                    }}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      localNotificationSettings.weeklyReminder?.enabled
                        ? "bg-purple-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        localNotificationSettings.weeklyReminder?.enabled
                          ? "translate-x-7"
                          : ""
                      }`}
                    ></div>
                  </button>
                </div>
                {localNotificationSettings.weeklyReminder?.enabled && (
                  <div className="mt-4 pl-8 space-y-3">
                    <div>
                      <label className={`block text-sm font-medium ${textClass} mb-2`}>
                        {t("settings.weeklyReminderDay")}
                      </label>
                      <select
                        value={localNotificationSettings.weeklyReminder?.dayOfWeek ?? 0}
                        onChange={(e) => {
                          setLocalNotificationSettings({
                            ...localNotificationSettings,
                            weeklyReminder: {
                              ...localNotificationSettings.weeklyReminder,
                              dayOfWeek: parseInt(e.target.value),
                            },
                          });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          darkMode
                            ? "bg-gray-800 border-gray-600 text-gray-100"
                            : "bg-white border-purple-200 text-purple-900"
                        } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                      >
                        <option value="0">Domingo</option>
                        <option value="1">Lunes</option>
                        <option value="2">Martes</option>
                        <option value="3">Miércoles</option>
                        <option value="4">Jueves</option>
                        <option value="5">Viernes</option>
                        <option value="6">Sábado</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textClass} mb-2`}>
                        {t("settings.weeklyReminderMessage")}
                      </label>
                      <input
                        type="text"
                        value={localNotificationSettings.weeklyReminder?.message || ""}
                        onChange={(e) => {
                          setLocalNotificationSettings({
                            ...localNotificationSettings,
                            weeklyReminder: {
                              ...localNotificationSettings.weeklyReminder,
                              message: e.target.value,
                            },
                          });
                        }}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          darkMode
                            ? "bg-gray-800 border-gray-600 text-gray-100"
                            : "bg-white border-purple-200 text-purple-900"
                        } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                        placeholder="¡No olvides registrar tus gastos de esta semana en Clarity!"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notificaciones Push */}
              <div
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Bell
                      className={`w-5 h-5 ${
                        darkMode ? "text-purple-400" : "text-purple-600"
                      }`}
                    />
                    <div>
                      <p className={`font-medium ${textClass}`}>
                        Notificaciones Push
                      </p>
                      <p className={`text-sm ${textSecondaryClass}`}>
                        Recibe notificaciones incluso cuando la app está cerrada
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (onRequestPushPermission) {
                        await onRequestPushPermission();
                      } else {
                        // Fallback: solicitar permisos directamente
                        if (typeof window !== "undefined" && "Notification" in window) {
                          const permission = await Notification.requestPermission();
                          if (permission === "granted") {
                            console.log("Permisos de notificaciones concedidos");
                          }
                        }
                      }
                    }}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      typeof window !== "undefined" &&
                      "Notification" in window &&
                      Notification.permission === "granted"
                        ? "bg-purple-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        typeof window !== "undefined" &&
                        "Notification" in window &&
                        Notification.permission === "granted"
                          ? "translate-x-7"
                          : ""
                      }`}
                    ></div>
                  </button>
                </div>
                <div className={`text-xs mb-3 ${
                  typeof window !== "undefined" && "Notification" in window
                    ? Notification.permission === "granted"
                      ? "text-green-500"
                      : Notification.permission === "denied"
                      ? "text-red-500"
                      : "text-yellow-500"
                    : "text-gray-500"
                }`}>
                  {typeof window !== "undefined" && "Notification" in window
                    ? Notification.permission === "granted"
                      ? "✓ Permisos concedidos"
                      : Notification.permission === "denied"
                      ? "⚠️ Permisos denegados. Actívalos en la configuración del navegador"
                      : "⏳ Permisos pendientes. Activa el toggle para solicitar permisos"
                    : "Tu navegador no soporta notificaciones push"}
                </div>
                
                {/* Botón de prueba de notificación */}
                {areNotificationsEnabled() && (
                  <button
                    onClick={() => {
                      try {
                        showTestNotification();
                        if (showNotification) {
                          showNotification("Notificación de prueba enviada. Deberías verla en la bandeja del sistema.", "success");
                        }
                      } catch (error) {
                        console.error("Error mostrando notificación de prueba:", error);
                        if (showNotification) {
                          showNotification(`Error: ${error.message}`, "error");
                        } else {
                          alert(`Error: ${error.message}`);
                        }
                      }
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                      darkMode
                        ? "bg-purple-600/20 border-purple-500/50 text-purple-300 hover:bg-purple-600/30"
                        : "bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200"
                    }`}
                  >
                    <TestTube className="w-4 h-4" />
                    <span className="font-medium text-sm">Enviar Notificación de Prueba</span>
                  </button>
                )}
              </div>

              {/* Botón guardar notificaciones */}
              <button
                onClick={handleSaveNotifications}
                className="w-full px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-all"
              >
                {t("common.save")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
