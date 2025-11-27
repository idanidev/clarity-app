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
  const [localNotificationSettings, setLocalNotificationSettings] = useState(() => {
    const defaultSettings = {
      budgetAlerts: { enabled: true, at80: true, at90: true, at100: true },
      recurringReminders: { enabled: true },
      customReminders: { enabled: true, message: "No olvides registrar tus gastos", hour: 20, minute: 0 },
      weeklyReminder: { enabled: true, dayOfWeek: 0, hour: 21, minute: 0, message: "¡No olvides registrar tus gastos de esta semana en Clarity!" },
      pushNotifications: { enabled: false },
    };
    
    if (notificationSettings) {
      // Asegurar que customReminders tenga hour y minute
      if (notificationSettings.customReminders) {
        defaultSettings.customReminders = {
          ...defaultSettings.customReminders,
          ...notificationSettings.customReminders,
          hour: notificationSettings.customReminders.hour ?? 20,
          minute: notificationSettings.customReminders.minute ?? 0,
        };
      }
      // Asegurar que weeklyReminder tenga hour y minute
      if (notificationSettings.weeklyReminder) {
        defaultSettings.weeklyReminder = {
          ...defaultSettings.weeklyReminder,
          ...notificationSettings.weeklyReminder,
          hour: notificationSettings.weeklyReminder.hour ?? 21,
          minute: notificationSettings.weeklyReminder.minute ?? 0,
        };
      }
      return {
        ...defaultSettings,
        ...notificationSettings,
        customReminders: defaultSettings.customReminders,
        weeklyReminder: defaultSettings.weeklyReminder,
      };
    }
    
    return defaultSettings;
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      onMouseDown={onClose}
    >
      <div
        className={`${cardClass} rounded-xl sm:rounded-2xl p-0 max-w-2xl w-full border shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className={`sticky top-0 z-10 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center ${
            darkMode
              ? "bg-gray-800/95 border-b border-gray-700"
              : "bg-white/80 border-b border-purple-100"
          } backdrop-blur`}
        >
          <h3 className={`text-xl sm:text-2xl font-bold ${textClass}`}>
            {t("settings.title")}
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 sm:p-2 rounded-lg ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
            } transition-all`}
          >
            <X className={`w-5 h-5 sm:w-6 sm:h-6 ${textClass}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 flex gap-1 sm:gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-t-lg text-sm sm:text-base font-medium transition-all whitespace-nowrap ${
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
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-t-lg text-sm sm:text-base font-medium transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === "notifications"
                ? darkMode
                  ? "bg-gray-700 text-white border-b-2 border-purple-500"
                  : "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
                : darkMode
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-600 hover:text-purple-600"
            }`}
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t("settings.notifications")}
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {activeTab === "general" && (
            <>
              {/* Ingresos */}
              <div
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <DollarSign
                    className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                      darkMode ? "text-purple-400" : "text-purple-600"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm sm:text-base font-medium ${textClass}`}>
                      {t("settings.income")}
                    </p>
                    <p className={`text-xs sm:text-sm ${textSecondaryClass} mt-0.5 sm:mt-1`}>
                      {t("settings.incomeDescription")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-3">
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
                    className={`flex-1 px-3 sm:px-4 py-2 text-base rounded-lg border ${
                      darkMode
                        ? "bg-gray-800 border-gray-600 text-gray-100"
                        : "bg-white border-purple-200 text-purple-900"
                    } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                    placeholder="0.00"
                  />
                  <button
                    onClick={handleSaveIncome}
                    className="px-4 sm:px-6 py-2 rounded-lg bg-purple-600 text-white text-sm sm:text-base font-medium hover:bg-purple-700 transition-all whitespace-nowrap"
                  >
                    {t("common.save")}
                  </button>
                </div>
              </div>

              {/* Presupuestos */}
              <div
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      darkMode ? "bg-purple-900/50" : "bg-purple-100"
                    }`}>
                      <span className="text-base sm:text-lg">💰</span>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm sm:text-base font-medium ${textClass}`}>
                        {t("dashboard.budgets")}
                      </p>
                      <p className={`text-xs sm:text-sm ${textSecondaryClass}`}>
                        {t("settings.budgetsDescription")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onOpenBudgets}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm sm:text-base font-medium hover:bg-purple-700 transition-all whitespace-nowrap"
                  >
                    {t("settings.manageBudgets")}
                  </button>
                </div>
              </div>

              {/* Tema */}
              <div
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {darkMode ? (
                      <Moon
                        className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                          darkMode ? "text-purple-400" : "text-purple-600"
                        }`}
                      />
                    ) : (
                      <Sun
                        className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                          darkMode ? "text-purple-400" : "text-purple-600"
                        }`}
                      />
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm sm:text-base font-medium ${textClass}`}>
                        {darkMode
                          ? t("settings.darkMode")
                          : t("settings.lightMode")}
                      </p>
                      <p className={`text-xs sm:text-sm ${textSecondaryClass}`}>
                        {t("settings.changeTheme")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative w-12 h-6 sm:w-14 sm:h-7 rounded-full transition-colors flex-shrink-0 ${
                      darkMode ? "bg-purple-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        darkMode ? "translate-x-6 sm:translate-x-7" : ""
                      }`}
                    ></div>
                  </button>
                </div>
              </div>

              {/* Idioma */}
              <div
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <Globe
                    className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                      darkMode ? "text-purple-400" : "text-purple-600"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm sm:text-base font-medium ${textClass}`}>
                      {t("settings.language")}
                    </p>
                    <p className={`text-xs sm:text-sm ${textSecondaryClass} mt-0.5 sm:mt-1`}>
                      {t("settings.languageDescription")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap mt-2 sm:mt-3">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
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
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <p className={`text-sm sm:text-base font-medium ${textClass}`}>{t("settings.about")}</p>
                <p className={`text-xs sm:text-sm ${textSecondaryClass} mt-0.5 sm:mt-1`}>
                  {t("settings.version")} 2.0.1 - Gestión de gastos personales
                </p>
              </div>
            </>
          )}

          {activeTab === "notifications" && (
            <>
              {/* Recordatorio Semanal */}
              <div
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Calendar
                      className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                        darkMode ? "text-purple-400" : "text-purple-600"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className={`text-sm sm:text-base font-medium ${textClass}`}>
                        {t("settings.weeklyReminder")}
                      </p>
                      <p className={`text-xs sm:text-sm ${textSecondaryClass}`}>
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
                    className={`relative w-12 h-6 sm:w-14 sm:h-7 rounded-full transition-colors flex-shrink-0 ${
                      localNotificationSettings.weeklyReminder?.enabled
                        ? "bg-purple-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        localNotificationSettings.weeklyReminder?.enabled
                          ? "translate-x-6 sm:translate-x-7"
                          : ""
                      }`}
                    ></div>
                  </button>
                </div>
                {localNotificationSettings.weeklyReminder?.enabled && (
                  <div className="mt-3 sm:mt-4 pl-0 sm:pl-8 space-y-2 sm:space-y-3">
                    <div>
                      <label className={`block text-xs sm:text-sm font-medium ${textClass} mb-1.5 sm:mb-2`}>
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
                        className={`w-full px-3 sm:px-4 py-2 text-base rounded-lg border ${
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
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <label className={`block text-xs sm:text-sm font-medium ${textClass} mb-1.5 sm:mb-2`}>
                          Hora
                        </label>
                        <select
                          value={localNotificationSettings.weeklyReminder?.hour ?? 21}
                          onChange={(e) => {
                            setLocalNotificationSettings({
                              ...localNotificationSettings,
                              weeklyReminder: {
                                ...localNotificationSettings.weeklyReminder,
                                hour: parseInt(e.target.value),
                              },
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className={`w-full px-3 sm:px-4 py-2 text-base rounded-lg border ${
                            darkMode
                              ? "bg-gray-800 border-gray-600 text-gray-100"
                              : "bg-white border-purple-200 text-purple-900"
                          } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {String(i).padStart(2, '0')}:00
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-xs sm:text-sm font-medium ${textClass} mb-1.5 sm:mb-2`}>
                          Minutos
                        </label>
                        <select
                          value={localNotificationSettings.weeklyReminder?.minute ?? 0}
                          onChange={(e) => {
                            setLocalNotificationSettings({
                              ...localNotificationSettings,
                              weeklyReminder: {
                                ...localNotificationSettings.weeklyReminder,
                                minute: parseInt(e.target.value),
                              },
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className={`w-full px-3 sm:px-4 py-2 text-base rounded-lg border ${
                            darkMode
                              ? "bg-gray-800 border-gray-600 text-gray-100"
                              : "bg-white border-purple-200 text-purple-900"
                          } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                        >
                          {Array.from({ length: 60 }, (_, i) => (
                            <option key={i} value={i}>
                              {String(i).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón guardar notificaciones */}
              <button
                onClick={handleSaveNotifications}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-purple-600 text-white text-sm sm:text-base font-medium hover:bg-purple-700 transition-all"
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
