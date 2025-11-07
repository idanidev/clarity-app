import { Globe, Moon, Sun, X } from "lucide-react";
import { useLanguage, useTranslation } from "../../../contexts/LanguageContext";

const SettingsModal = ({
  visible,
  darkMode,
  cardClass,
  textClass,
  textSecondaryClass,
  toggleDarkMode,
  onClose,
}) => {
  const { t } = useTranslation();
  const { language, changeLanguage, availableLanguages } = useLanguage();
  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={onClose}
    >
      <div
        className={`${cardClass} rounded-2xl p-0 max-w-md w-full border shadow-2xl max-h-[90vh] overflow-y-auto`}
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

        <div className="px-6 py-6 space-y-6">
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

          <div
            className={`p-4 rounded-xl ${
              darkMode ? "bg-gray-700" : "bg-purple-50"
            }`}
          >
            <p className={`font-medium ${textClass}`}>{t("settings.about")}</p>
            <p className={`text-sm ${textSecondaryClass}`}>
              {t("settings.version")} 2.0.0 - Gestión de gastos personales
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
