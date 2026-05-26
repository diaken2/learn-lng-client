// app/hooks/useTranslation.js
import { useMemo } from 'react';
import translations from '../app/translations';

export function useTranslation(language = 'русский') {
  console.log('🔤 useTranslation hook called with language:', language);
  console.log('📚 Available translations keys:', Object.keys(translations));
  
  const t = useMemo(() => {
    // Нормализуем язык
    const normalizedLanguage = language?.toLowerCase().trim() || 'русский';
    console.log('🎯 Normalized language:', normalizedLanguage);
    
    // Словарь соответствий русских названий ключам в translations
    const languageMap = {
      'русский': 'русский',
      'russian': 'русский',
      'английский': 'english',
      'english': 'english',
      'турецкий': 'turkish',
      'turkish': 'turkish',
      'испанский': 'spanish',
      'spanish': 'spanish',
      'немецкий': 'german',
      'german': 'german',
      'польский': 'polish',
      'polish': 'polish',
      'французский': 'french',
      'french': 'french',
      'итальянский': 'italian',
      'italian': 'italian',
      'китайский': 'chinese',
      'chinese': 'chinese',
      'японский': 'japanese',
      'japanese': 'japanese',
      'корейский': 'korean',
      'korean': 'korean',
      'арабский': 'arabic',
      'arabic': 'arabic',
    };
    
    // Получаем ключ для translations
    const langKey = languageMap[normalizedLanguage] || 'русский';
    console.log('✅ Selected language key:', langKey);
    console.log('📖 Translations for this language:', Object.keys(translations[langKey] || {}));
    
    return (key, params = {}) => {
      // Пытаемся получить перевод на выбранном языке, если нет - на русском
      let translation = translations[langKey]?.[key];
      
      if (!translation) {
        console.warn(`⚠️ Missing translation for key "${key}" in language "${langKey}"`);
        translation = translations['русский']?.[key] || key;
      }
      
      // Заменяем параметры в строке
      if (params && Object.keys(params).length > 0) {
        return Object.entries(params).reduce(
          (str, [param, value]) => str.replace(new RegExp(`{${param}}`, 'g'), value),
          translation
        );
      }
      
      return translation;
    };
  }, [language]);

  return { t };
}