import React, { useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../config/i18n';
import { useI18n } from '../hooks/useI18n';

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  showLabel = true,
  compact = false,
}
) => {
  const {
    currentLanguage,
    changeLanguage,
    isLoading,
    autoDetectEnabled,
    setAutoDetectEnabled,
  } = useLanguage();
  const { t } = useI18n('settings');
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = async (lang: SupportedLanguage
) => {
    try {
      await changeLanguage(lang);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const currentLangInfo = SUPPORTED_LANGUAGES[currentLanguage];

  return (
    <div className={`relative ${className}`}>
      {showLabel && !compact && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('general.language')}
        </label>
      )}

      {/* Auto-detect toggle */}
      {!compact && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('language.autoDetect')}
          </span>
          <button
            type="button"
            onClick={(
) => setAutoDetectEnabled(!autoDetectEnabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${
              autoDetectEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            role="switch"
            aria-checked={autoDetectEnabled}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                autoDetectEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      )}

      {/* Language Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={(
) => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`${
            compact ? 'p-2' : 'w-full pl-3 pr-10 py-2'
          } text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center">
            {compact ? (
              <>
                <Globe className="w-5 h-5" />
                <span className="ml-1 text-lg">{currentLangInfo?.flag}</span>
              </>
            ) : (
              <>
                <span className="text-lg mr-3">{currentLangInfo?.flag}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentLangInfo?.nativeName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {currentLangInfo?.name}
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </>
            )}
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
            <div className="py-1" role="listbox">
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, langInfo]
) => (
                <button
                  key={code}
                  type="button"
                  onClick={(
) => handleLanguageChange(code as SupportedLanguage)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 transition-colors ${
                    code === currentLanguage
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : ''
                  }`}
                  role="option"
                  aria-selected={code === currentLanguage}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">{langInfo.flag}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {langInfo.nativeName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {langInfo.name}
                        </div>
                      </div>
                    </div>
                    {code === currentLanguage && (
                      <Check className="w-5 h-5 text-primary-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Auto-detect description */}
      {!compact && autoDetectEnabled && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {t('language.autoDetectDescription')}
        </p>
      )}
    </div>
  );
};

export default LanguageSelector;
