'use client';
import React, { useEffect, useState } from 'react';

const API_BASE_URL = 'https://learn-lng-server.onrender.com/api';
const WordSelector = ({ theme, onWordsChange }) => {
  const [availableWords, setAvailableWords] = useState([]);
  const [selectedWordIds, setSelectedWordIds] = useState(new Set());

  // Загружаем слова для выбранной темы из таблицы
  useEffect(() => {
    const loadWordsForTheme = async () => {
      try {
        // Получаем таблицу данных
        const response = await fetch(`${API_BASE_URL}/table`);
        const tableData = await response.json();
        
        if (!tableData || tableData.length === 0) {
          setAvailableWords([]);
          return;
        }

        // Ищем слова для указанной темы
        const words = [];
        let currentTheme = null;
        let collectingWords = false;
        
        tableData.forEach((row, index) => {
          // Если это заголовок урока с нужной темой
          if (row['Урок название'] && row['Урок название'] === theme) {
            console.log(`Found theme header at row ${index}`);
            currentTheme = theme;
            collectingWords = true;
            return;
          }
          
          // Если это заголовок другого урока - прекращаем сбор
          if (row['Урок название'] && row['Урок название'] !== theme) {
            console.log(`Found different theme at row ${index}: ${row['Урок название']}, stopping collection`);
            currentTheme = null;
            collectingWords = false;
            return;
          }
          
          // Если мы собираем слова для текущей темы и это строка со словом
          if (collectingWords && row['База изображение'] && row['База изображение'].trim() !== '') {
            console.log(`Found word at row ${index}:`, row);
            
            const translations = {};
            
            // Добавляем переводы для всех языков
            Object.keys(row).forEach(col => {
              if (col.includes('База существительные слова')) {
                const language = col.split(' ').pop().toLowerCase();
                const translation = row[col] || '';
                if (translation.trim() !== '') {
                  translations[language] = translation;
                }
              }
            });
            
            const wordObj = {
              id: row['База изображение'], // используем imageBase как ID
              imageBase: row['База изображение'],
              imagePng: row['Картинка png'] || '',
              translations: translations
            };
            
            console.log('Created word object:', wordObj);
            words.push(wordObj);
          }
        });
        
        console.log(`Total words found for theme "${theme}": ${words.length}`, words);
        setAvailableWords(words);
        
      } catch (error) {
        console.error('Error loading words for theme:', error);
        setAvailableWords([]);
      }
    };

    if (theme) {
      loadWordsForTheme();
    } else {
      setAvailableWords([]);
    }
  }, [theme]);

  const toggleWordSelection = (word) => {
    const wordId = word.imageBase || word.id;
    const newSelectedIds = new Set(selectedWordIds);
    
    if (newSelectedIds.has(wordId)) {
      newSelectedIds.delete(wordId);
    } else {
      newSelectedIds.add(wordId);
    }
    
    setSelectedWordIds(newSelectedIds);
    
    // Передаем выбранные слова родительскому компоненту
    const selectedWordsList = availableWords.filter(w => 
      newSelectedIds.has(w.imageBase || w.id)
    );
    onWordsChange(selectedWordsList);
  };

  const getStudiedText = (word) => {
    if (!word || !word.translations) return '—';
    const translations = word.translations;
    
    // Пробуем разные варианты ключей
    const studiedKeys = ['русский', 'russian', 'Русский'];
    for (const key of studiedKeys) {
      if (translations[key]) return translations[key];
    }
    
    return Object.values(translations)[0] || '—';
  };

  const getHintText = (word) => {
    if (!word || !word.translations) return '—';
    const translations = word.translations;
    
    // Пробуем разные варианты ключей для подсказки
    const hintKeys = ['английский', 'english', 'Английский', 'турецкий', 'turkish', 'Турецкий'];
    for (const key of hintKeys) {
      if (translations[key]) return translations[key];
    }
    
    return Object.values(translations)[1] || Object.values(translations)[0] || '—';
  };

  return (
    <div className="space-y-2">
      {availableWords.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          {theme ? 'Слова не найдены для выбранной темы' : 'Выберите тему для отображения слов'}
        </div>
      ) : (
        availableWords.map((word, index) => {
          const wordId = word.imageBase || word.id;
          const isSelected = selectedWordIds.has(wordId);
          
          return (
            <div
              key={wordId}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => toggleWordSelection(word)}
            >
              <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {getStudiedText(word)}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {getHintText(word)}
                </div>
              </div>
              
              {word.imagePng && (
                <div className="w-10 h-10 flex-shrink-0">
                  <img 
                    src={word.imagePng} 
                    alt={getStudiedText(word)}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
export default function AdminPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Table data state
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);

  // Modal states
  const [showAddLanguageModal, setShowAddLanguageModal] = useState(false);
  const [showCreateLessonModal, setShowCreateLessonModal] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [showFlagsModal, setShowFlagsModal] = useState(false);
  const [showLessonsModal, setShowLessonsModal] = useState(false);
  const [showTestsModal, setShowTestsModal] = useState(false);

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentImageRow, setCurrentImageRow] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Words selection state
  const [selectedWords, setSelectedWords] = useState([]);

  // Flags state
  const [flags, setFlags] = useState([]);
  const [uploadingFlag, setUploadingFlag] = useState(null);
  const [tableLanguages, setTableLanguages] = useState([]);

  // Lessons and tests state
  const [lessons, setLessons] = useState([]);
  const [tests, setTests] = useState([]);

  // Form states
  const [newLanguage, setNewLanguage] = useState('');
  const [newLesson, setNewLesson] = useState({
    studiedLanguage: 'русский',
    hintLanguage: 'турецкий',
    level: 'A1',
    theme: '',
    fontColor: '#000000',
    bgColor: '#ffffff'
  });
  const [currentLesson, setCurrentLesson] = useState(null);
const [translationCheck, setTranslationCheck] = useState({
  isValid: true,
  missingWords: [],
  message: ''
});
const [testTranslationCheck, setTestTranslationCheck] = useState({
  isValid: true,
  missingWords: [],
  message: ''
});
  useEffect(() => {
    const checkAuth = () => {
      const savedAuth = localStorage.getItem('adminAuth');
      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          // Проверяем, не истекла ли сессия (например, 24 часа)
          const sessionTime = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
          const currentTime = new Date().getTime();
          
          if (currentTime - authData.timestamp < sessionTime) {
            setIsAuthenticated(true);
          } else {
            // Сессия истекла
            localStorage.removeItem('adminAuth');
          }
        } catch (error) {
          console.error('Error parsing auth data:', error);
          localStorage.removeItem('adminAuth');
        }
      }
    };

    checkAuth();
  }, []);
useEffect(() => {
  if (
    newLesson.studiedLanguage &&
    newLesson.hintLanguage &&
    newLesson.studiedLanguage !== newLesson.hintLanguage &&
    selectedWords.length >= 2
  ) {
    const studiedLang = newLesson.studiedLanguage.charAt(0).toUpperCase() + newLesson.studiedLanguage.slice(1);
    const hintLang = newLesson.hintLanguage.charAt(0).toUpperCase() + newLesson.hintLanguage.slice(1);
    
    const checkResult = checkTranslationsForWords(selectedWords, studiedLang, hintLang);
    setTestTranslationCheck(checkResult);
  } else {
    // Сброс, если не все поля заполнены или мало слов
    setTestTranslationCheck({ isValid: true, missingWords: [], message: '' });
  }
}, [newLesson.studiedLanguage, newLesson.hintLanguage, selectedWords, tableData]);
const checkTranslationsForWords = (words, studiedLang, hintLang) => {
  if (words.length === 0) {
    return { isValid: false, missingWords: [], message: 'Нет выбранных слов' };
  }

  const missingWords = [];
  let hasAllTranslations = true;

  words.forEach((word) => {
    if (!word || !word.translations) return;

    const hasStudiedTranslation = word.translations[studiedLang.toLowerCase()];
    const hasHintTranslation = word.translations[hintLang.toLowerCase()];

    if (!hasStudiedTranslation || !hasHintTranslation) {
      hasAllTranslations = false;
      missingWords.push({
        word: word.imageBase || word.id,
        missingStudied: !hasStudiedTranslation,
        missingHint: !hasHintTranslation,
      });
    }
  });

  return {
    isValid: hasAllTranslations,
    missingWords,
    message: hasAllTranslations ? 'Все переводы присутствуют' : 'Отсутствуют переводы для некоторых слов'
  };
};
useEffect(() => {
  if (
    newLesson.theme &&
    newLesson.studiedLanguage &&
    newLesson.hintLanguage &&
    newLesson.studiedLanguage !== newLesson.hintLanguage
  ) {
    const studiedLang = newLesson.studiedLanguage.charAt(0).toUpperCase() + newLesson.studiedLanguage.slice(1);
    const hintLang = newLesson.hintLanguage.charAt(0).toUpperCase() + newLesson.hintLanguage.slice(1);
    
    const checkResult = checkTranslationsForTheme(newLesson.theme, studiedLang, hintLang);
    setTranslationCheck(checkResult);
  } else {
    // Сброс, если не все поля заполнены
    setTranslationCheck({ isValid: true, missingWords: [], message: '' });
  }
}, [newLesson.theme, newLesson.studiedLanguage, newLesson.hintLanguage, tableData]);
  // Загрузка при монтировании
  useEffect(() => {
    if (!isAuthenticated) return;
    loadDataFromBackend();
    loadFlags();
    loadTableLanguages();
    loadLessons();
    loadTests();
  }, [isAuthenticated]);
  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'eatapple88') {
      setIsAuthenticated(true);
      setAuthError('');
      
      // Сохраняем авторизацию в localStorage
      const authData = {
        isAuthenticated: true,
        timestamp: new Date().getTime()
      };
      localStorage.setItem('adminAuth', JSON.stringify(authData));
    } else {
      setAuthError('Неверный логин или пароль');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    
    // Удаляем авторизацию из localStorage
    localStorage.removeItem('adminAuth');
  };
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Авторизация</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Логин</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Языки — базовые и дополнительные
  const baseLanguages = {
    russian: {
      number: 'База существительные номер Русский',
      word: 'База существительные слова Русский'
    },
    english: {
      number: 'База существительные номер Английский',
      word: 'База существительные слова Английский'
    },
    turkish: {
      number: 'База существительные номер Турецкий',
      word: 'База существительные слова Турецкий'
    }
  };

  const additionalLanguages = {
    spanish: {
      number: 'База существительные номер Испанский',
      word: 'База существительные слова Испанский'
    },
    german: {
      number: 'База существительные номер Немецкий',
      word: 'База существительные слова Немецкий'
    },
    french: {
      number: 'База существительные номер Французский',
      word: 'База существительные слова Французский'
    },
    italian: {
      number: 'База существительные номер Итальянский',
      word: 'База существительные слова Итальянский'
    },
    chinese: {
      number: 'База существительные номер Китайский',
      word: 'База существительные слова Китайский'
    },
    japanese: {
      number: 'База существительные номер Японский',
      word: 'База существительные слова Японский'
    },
    arabic: {
      number: 'База существительные номер Арабский',
      word: 'База существительные слова Арабский'
    },
    portuguese: {
      number: 'База существительные номер Португальский',
      word: 'База существительные слова Португальский'
    },
    korean: {
      number: 'База существительные номер Корейский',
      word: 'База существительные слова Корейский'
    },
    hindi: {
      number: 'База существительные номер Хинди',
      word: 'База существительные слова Хинди'
    },
    dutch: {
      number: 'База существительные номер Голландский',
      word: 'База существительные слова Голландский'
    },
    swedish: {
      number: 'База существительные номер Шведский',
      word: 'База существительные слова Шведский'
    },
    polish: {
      number: 'База существительные номер Польский',
      word: 'База существительные слова Польский'
    },
    greek: {
      number: 'База существительные номер Греческий',
      word: 'База существительные слова Греческий'
    },
    hebrew: {
      number: 'База существительные номер Иврит',
      word: 'База существительные слова Иврит'
    },
    vietnamese: {
      number: 'База существительные номер Вьетнамский',
      word: 'База существительные слова Вьетнамский'
    },
    indonesian: {
      number: 'База существительные номер Индонезийский',
      word: 'База существительные слова Индонезийский'
    }
  };

  const allLanguages = { ...baseLanguages, ...additionalLanguages };

  const baseColumns = [
    'Уровень изучения номер',
    'Урок номер',
    'Урок название',
    'База изображение',
    'Картинка png'
  ];

  // Утилиты: создание строк/таблицы
  const createRow = (columns, values = {}) => {
    const row = {};
    columns.forEach(col => {
      row[col] = values[col] ?? '';
    });
    return row;
  };

  const createInitialTable = () => {
    const allColumns = [...baseColumns];
    Object.values(baseLanguages).forEach(lang => {
      allColumns.push(lang.number);
      allColumns.push(lang.word);
    });

    return [
      createRow(allColumns, {
        'Уровень изучения номер': 'A1',
        'Урок номер': '1.1',
        'Урок название': 'Еда'
      }),
      createRow(allColumns, {
        'База изображение': '1.1.1',
        'База существительные номер Русский': '1.1.1.1',
        'База существительные слова Русский': 'ЯБЛОКО',
        'База существительные номер Английский': '1.1.2.1',
        'База существительные слова Английский': 'An apple',
        'База существительные номер Турецкий': '1.1.3.1',
        'База существительные слова Турецкий': 'elma'
      }),
      createRow(allColumns, {
        'База изображение': '1.1.2',
        'База существительные номер Русский': '1.1.1.2',
        'База существительные слова Русский': 'БАНАН',
        'База существительные номер Английский': '1.1.2.2',
        'База существительные слова Английский': 'A banana',
        'База существительные номер Турецкий': '1.1.3.2',
        'База существительные слова Турецкий': 'muz'
      }),
      createRow(allColumns, {
        'Уровень изучения номер': 'A1',
        'Урок номер': '1.2',
        'Урок название': 'Дом'
      }),
      createRow(allColumns, {
        'База изображение': '1.2.1',
        'База существительные номер Русский': '1.2.1.1',
        'База существительные слова Русский': 'СТОЛ',
        'База существительные номер Английский': '1.2.2.1',
        'База существительные слова Английский': 'A table'
      }),
      createRow(allColumns, {
        'База изображение': '1.2.2',
        'База существительные номер Русский': '1.2.1.2',
        'База существительные слова Русский': 'СТУЛ',
        'База существительные номер Английский': '1.2.2.2',
        'База существительные слова Английский': 'A chair'
      })
    ];
  };

  // Работа с API / local backend
  const loadDataFromBackend = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/db`);
      if (!res.ok) {
        const initialTable = createInitialTable();
        setTableData(initialTable);
        await saveTableToDatabase(initialTable);
        return;
      }
      const data = await res.json();
      if (!data.table || data.table.length === 0) {
        const initialTable = createInitialTable();
        setTableData(initialTable);
        await saveTableToDatabase(initialTable);
      } else {
        setTableData(data.table);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      const initialTable = createInitialTable();
      setTableData(initialTable);
      await saveTableToDatabase(initialTable);
    } finally {
      setLoading(false);
    }
  };

  const saveTableToDatabase = async (dataToSave) => {
    try {
      const response = await fetch(`${API_BASE_URL}/table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableData: dataToSave })
      });
      if (!response.ok) throw new Error('Failed to save table data');
    } catch (error) {
      console.error('Error saving table:', error);
      alert('Ошибка сохранения данных');
    }
  };

  // CRUD для таблицы
  const handleCellEdit = async (rowIndex, colKey, value) => {
    const newData = [...tableData];
    newData[rowIndex] = { ...newData[rowIndex], [colKey]: value };
    setTableData(newData);
    await saveTableToDatabase(newData);
  };

  const deleteRow = async (rowIndex) => {
    if (!confirm('Вы уверены, что хотите удалить эту строку?')) return;
    
    const newData = tableData.filter((_, index) => index !== rowIndex);
    setTableData(newData);
    await saveTableToDatabase(newData);
    alert('Строка удалена успешно!');
  };

  const deleteColumn = async (colKey) => {
    if (!confirm(`Вы уверены, что хотите удалить колонку "${colKey}"?`)) return;
    
    const newData = tableData.map(row => {
      const newRow = { ...row };
      delete newRow[colKey];
      return newRow;
    });
    setTableData(newData);
    await saveTableToDatabase(newData);
    alert('Колонка удалена успешно!');
  };
const isTestFormValid = () => {
  return (
    newLesson.studiedLanguage &&
    newLesson.hintLanguage &&
    newLesson.level &&
    newLesson.theme &&
    newLesson.studiedLanguage !== newLesson.hintLanguage &&
    selectedWords.length >= 2 &&
    testTranslationCheck.isValid  // Новая проверка
  );
};

  const addNewLesson = async () => {
    const maxLessonNumber = getMaxLessonNumber();
    const newLessonNumber = (maxLessonNumber + 0.1).toFixed(1);
    const columns = tableData.length > 0 ? Object.keys(tableData[0]) : Object.keys(createInitialTable()[0]);
    const newLessonRow = createRow(columns, {
      'Уровень изучения номер': 'A1',
      'Урок номер': newLessonNumber,
      'Урок название': `Новый урок ${newLessonNumber}`
    });
    const newTableData = [...tableData, newLessonRow];
    setTableData(newTableData);
    await saveTableToDatabase(newTableData);
  };

  const addColumn = async () => {
    const newColName = prompt('Название новой колонки:');
    if (!newColName) return;
    const updated = tableData.map(row => ({ ...row, [newColName]: '' }));
    setTableData(updated);
    await saveTableToDatabase(updated);
  };

  // CRUD для языков
  const handleAddLanguage = async () => {
    if (!newLanguage) { alert('Выберите язык'); return; }
    const languageConfig = allLanguages[newLanguage];
    if (!languageConfig) { alert('Выбран неверный язык'); return; }

    const languageName = languageConfig.number.split(' ').pop();
    
    const getNextLanguageNumber = () => {
      const existingLanguages = getAddedLanguages();
      const languageNumbers = {
        'Русский': 1,
        'Английский': 2,
        'Турецкий': 3,
        'Испанский': 4,
        'Немецкий': 5,
        'Французский': 6,
        'Итальянский': 7,
        'Китайский': 8,
        'Японский': 9
      };
      
      if (languageNumbers[languageName]) {
        return languageNumbers[languageName];
      }
      
      let maxNumber = 0;
      existingLanguages.forEach(lang => {
        const langNumber = languageNumbers[lang] || 0;
        if (langNumber > maxNumber) maxNumber = langNumber;
      });
      
      return maxNumber + 1;
    };

    const languageNumber = getNextLanguageNumber();
    const newColumns = [languageConfig.number, languageConfig.word];
    
    const newTableData = tableData.map(row => {
      const newRow = { ...row };
      
      newRow[languageConfig.number] = '';
      newRow[languageConfig.word] = '';
      
      if (row['База изображение'] && row['База изображение'].trim() !== '') {
        const imageBase = row['База изображение'];
        newRow[languageConfig.number] = `${imageBase}.${languageNumber}`;
      }
      
      return newRow;
    });

    setTableData(newTableData);
    setShowAddLanguageModal(false);
    setNewLanguage('');
    await saveTableToDatabase(newTableData);
    
    alert(`Язык "${languageName}" добавлен успешно! Номер языка: ${languageNumber}`);
  };

  const deleteLanguage = async (language) => {
    if (!confirm(`Вы уверены, что хотите удалить язык "${language}"? Будут удалены все связанные колонки.`)) return;
    
    const columnsToRemove = [
      `База существительные номер ${language}`,
      `База существительные слова ${language}`
    ];

    const newData = tableData.map(row => {
      const newRow = { ...row };
      columnsToRemove.forEach(col => delete newRow[col]);
      return newRow;
    });
    
    setTableData(newData);
    await saveTableToDatabase(newData);
    alert(`Язык "${language}" удален успешно!`);
  };

  // CRUD для флагов
  const loadFlags = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/flags`);
      if (response.ok) {
        const flagsData = await response.json();
        setFlags(flagsData);
      }
    } catch (error) {
      console.error('Error loading flags:', error);
    }
  };

  const loadTableLanguages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/table-languages`);
      if (response.ok) {
        const languages = await response.json();
        setTableLanguages(languages);
      }
    } catch (error) {
      console.error('Error loading table languages:', error);
    }
  };

  const syncFlagsWithTable = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/flags/sync`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        setFlags(result.flags);
        alert(`Флаги синхронизированы! Добавлено: ${result.added}, Удалено: ${result.removed}`);
      } else {
        throw new Error('Failed to sync flags');
      }
    } catch (error) {
      console.error('Error syncing flags:', error);
      alert('Ошибка синхронизации флагов: ' + error.message);
    }
  };

  const saveFlag = async (flagData) => {
    try {
      let response;
      if (flagData._id) {
        response = await fetch(`${API_BASE_URL}/flags/${flagData._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(flagData)
        });
      } else {
        response = await fetch(`${API_BASE_URL}/flags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(flagData)
        });
      }

      if (response.ok) {
        await loadFlags();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving flag:', error);
      return false;
    }
  };

  const deleteFlag = async (flagId, language) => {
    if (!confirm(`Вы уверены, что хотите удалить флаг для языка "${language}"?`)) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/flags/${flagId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadFlags();
        alert('Флаг удален успешно!');
      } else {
        throw new Error('Failed to delete flag');
      }
    } catch (error) {
      console.error('Error deleting flag:', error);
      alert('Ошибка удаления флага: ' + error.message);
    }
  };

  const uploadImageToImgbb = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const dataUrl = reader.result;
          if (!dataUrl) return reject(new Error('Empty file read'));

          const base64Only = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

          const response = await fetch(`${API_BASE_URL}/upload-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64Only })
          });

          const result = await response.json();

          if (response.ok && result.success) {
            resolve(result.imageUrl);
          } else {
            reject(new Error(result.error || 'Upload failed'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFlagImageUpload = async (flag, file) => {
    try {
      setUploadingFlag(flag._id);
      const imageUrl = await uploadImageToImgbb(file);
      
      const updatedFlag = { ...flag, image: imageUrl };
      const success = await saveFlag(updatedFlag);
      
      if (success) {
        alert('Изображение флага успешно обновлено!');
      } else {
        alert('Ошибка при сохранении флага');
      }
    } catch (error) {
      console.error('Error uploading flag image:', error);
      alert('Ошибка загрузки изображения: ' + error.message);
    } finally {
      setUploadingFlag(null);
    }
  };

  const initializeFlags = async () => {
    const defaultFlags = [
      { language: 'Русский', image: '🇷🇺' },
      { language: 'Английский', image: '🇺🇸' },
      { language: 'Турецкий', image: '🇹🇷' }
    ];

    for (const flag of defaultFlags) {
      await saveFlag(flag);
    }
    alert('Стандартные флаги инициализированы!');
  };

  // CRUD для уроков
  const loadLessons = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons`);
      if (response.ok) {
        const lessonsData = await response.json();
        setLessons(lessonsData);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const deleteLesson = async (lessonId, lessonTitle) => {
    if (!confirm(`Вы уверены, что хотите удалить урок "${lessonTitle}"?`)) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadLessons();
        alert('Урок удален успешно!');
      } else {
        throw new Error('Failed to delete lesson');
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Ошибка удаления урока: ' + error.message);
    }
  };

  // CRUD для тестов
  const loadTests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tests`);
      if (response.ok) {
        const testsData = await response.json();
        setTests(testsData);
      }
    } catch (error) {
      console.error('Error loading tests:', error);
    }
  };

  const deleteTest = async (testId, testTheme) => {
    if (!confirm(`Вы уверены, что хотите удалить тест "${testTheme}"?`)) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/tests/${testId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadTests();
        alert('Тест удален успешно!');
      } else {
        throw new Error('Failed to delete test');
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Ошибка удаления теста: ' + error.message);
    }
  };

  // Работа с изображениями
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };
// Внутри AdminPage компонента добавим функцию для проверки переводов
const checkTranslationsForTheme = (theme, studiedLang, hintLang) => {
  const words = getWordsForTheme(theme);
  if (words.length === 0) {
    return { isValid: false, missingWords: [], message: 'В теме нет слов' };
  }

  const missingWords = [];
  let hasAllTranslations = true;

  words.forEach((word, index) => {
    const studiedCol = `База существительные слова ${studiedLang}`;
    const hintCol = `База существительные слова ${hintLang}`;
    
    const hasStudiedTranslation = word.translations[studiedLang.toLowerCase()];
    const hasHintTranslation = word.translations[hintLang.toLowerCase()];
    
    if (!hasStudiedTranslation || !hasHintTranslation) {
      hasAllTranslations = false;
      missingWords.push({
        word: word.imageBase,
        missingStudied: !hasStudiedTranslation,
        missingHint: !hasHintTranslation,
      });
    }
  });

  return {
    isValid: hasAllTranslations,
    missingWords,
    message: hasAllTranslations ? 'Все переводы присутствуют' : 'Отсутствуют переводы для некоторых слов'
  };
};
  const handleImageUpload = async () => {
    if (!selectedFile || currentImageRow === null) return;
    try {
      setUploadingImage(true);
      const imageUrl = await uploadImageToImgbb(selectedFile);

      const newTableData = [...tableData];
      newTableData[currentImageRow]['Картинка png'] = imageUrl;
      setTableData(newTableData);

      await saveTableToDatabase(newTableData);

      setShowImageUploadModal(false);
      setSelectedFile(null);
      setImagePreview(null);
      setCurrentImageRow(null);

      alert('Изображение успешно загружено!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Ошибка загрузки изображения: ' + (error.message || error));
    } finally {
      setUploadingImage(false);
    }
  };

  const openImageUploadModal = (rowIndex) => {
    setCurrentImageRow(rowIndex);
    setShowImageUploadModal(true);
  };

  // Утилиты для таблицы/уроков
  const getAvailableLevels = () => {
    const levels = new Set();
    tableData.forEach(row => {
      const v = row['Уровень изучения номер'];
      if (v && String(v).trim()) levels.add(v);
    });
    return Array.from(levels).sort();
  };

  const getAvailableThemes = () => {
    const themes = new Set();
    tableData.forEach(row => {
      const v = row['Урок название'];
      if (v && String(v).trim()) themes.add(v);
    });
    return Array.from(themes).sort();
  };

const isLessonFormValid = () => {
  if (
    !newLesson.studiedLanguage ||
    !newLesson.hintLanguage ||
    !newLesson.level ||
    !newLesson.theme ||
    newLesson.studiedLanguage === newLesson.hintLanguage
  ) {
    return false;
  }

  // Используем результат из состояния
  return translationCheck.isValid;
};

// Обновим функцию createLesson
const createLesson = async () => {
  if (!isLessonFormValid()) {
    const { missingWords, message } = checkTranslationsForTheme(
      newLesson.theme,
      newLesson.studiedLanguage.charAt(0).toUpperCase() + newLesson.studiedLanguage.slice(1),
      newLesson.hintLanguage.charAt(0).toUpperCase() + newLesson.hintLanguage.slice(1)
    );

    if (missingWords.length > 0) {
      const missingDetails = missingWords.map(w => 
        `Слово "${w.word}": ${w.missingStudied ? `отсутствует перевод для ${newLesson.studiedLanguage}` : ''}${w.missingStudied && w.missingHint ? ', ' : ''}${w.missingHint ? `отсутствует перевод для ${newLesson.hintLanguage}` : ''}`
      ).join('\n');
      alert(`Нельзя создать урок:\n${message}\n\nДетали:\n${missingDetails}`);
      return;
    }
    alert('Заполните все поля корректно');
    return;
  }

  try {
    console.log('Starting lesson creation with theme:', newLesson.theme);
    const wordsForTheme = getWordsForTheme(newLesson.theme);
    
    if (wordsForTheme.length === 0) {
      alert('В выбранной теме не найдено слов! Убедитесь, что:\n1. Тема существует в таблице\n2. Есть строки с словами после заголовка темы\n3. В строках слов заполнено поле "База изображение"');
      return;
    }

    const lessonData = {
      title: newLesson.theme,
      level: newLesson.level,
      theme: newLesson.theme,
      studiedLanguage: newLesson.studiedLanguage,
      hintLanguage: newLesson.hintLanguage,
      fontColor: newLesson.fontColor,
      bgColor: newLesson.bgColor,
      lessonNumber: generateNewLessonNumber(),
      words: wordsForTheme
    };

    console.log('Sending lesson data to server:', lessonData);

    const response = await fetch(`${API_BASE_URL}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lessonData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Lesson created successfully:', result);
      alert(`Урок "${newLesson.theme}" создан успешно! Слов: ${wordsForTheme.length}\nID: ${result._id}`);
      
      setShowCreateLessonModal(false);
      setNewLesson({ 
        studiedLanguage: 'русский',
        hintLanguage: 'турецкий',
        level: 'A1', 
        theme: '', 
        fontColor: '#000000', 
        bgColor: '#ffffff' 
      });
      await loadLessons();
    } else {
      throw new Error(result.error || 'Failed to create lesson');
    }
  } catch (error) {
    console.error('Error creating lesson:', error);
    alert('Ошибка создания урока: ' + error.message);
  }
};

  const getMaxLessonNumber = () => {
    let maxLessonNumber = 0;
    tableData.forEach(row => {
      if (row['Урок номер']) {
        const lessonNum = parseFloat(String(row['Урок номер']).replace(',', '.')) || 0;
        if (lessonNum > maxLessonNumber) maxLessonNumber = lessonNum;
      }
    });
    return maxLessonNumber;
  };

  const generateNewLessonNumber = () => ((getMaxLessonNumber() + 0.1).toFixed(1));

  const isLessonHeader = (row) => {
    return row['Уровень изучения номер'] && row['Урок номер'] && row['Урок название'];
  };

  const getAddedLanguages = () => {
    if (tableData.length === 0) return [];
    const languages = new Set();
    Object.keys(tableData[0]).forEach(col => {
      if (col.includes('База существительные номер')) {
        const lang = col.split(' ').pop();
        languages.add(lang);
      }
    });
    return Array.from(languages);
  };

  const getAvailableLanguages = () => {
    const added = getAddedLanguages();
    return Object.entries(allLanguages).filter(([key, config]) => !added.includes(config.number.split(' ').pop()));
  };

  const addWordToLesson = async (lessonRowIndex) => {
    const lessonRow = tableData[lessonRowIndex];
    const lessonNumber = lessonRow['Урок номер'] || '0.0';
    
    let wordCount = 0;
    for (let i = lessonRowIndex + 1; i < tableData.length; i++) {
      const r = tableData[i];
      if (r['Уровень изучения номер'] && r['Урок номер']) break;
      if (r['База изображение']) wordCount++;
    }
    
    const wordNumber = wordCount + 1;
    const imageBase = `${lessonNumber}.${wordNumber}`;

    const wordValues = { 'База изображение': imageBase };
    
    if (tableData.length > 0) {
      Object.keys(tableData[0]).forEach(col => {
        if (col.includes('База существительные номер')) {
          const language = col.split(' ').pop();
          const wordCol = `База существительные слова ${language}`;
          
          const languageNumber = getLanguageNumber(language);
          wordValues[col] = `${imageBase}.${languageNumber}`;
          wordValues[wordCol] = '';
        }
      });
    }

    const newWordRow = createRow(Object.keys(tableData[0] || createInitialTable()[0]), wordValues);
    const newTableData = [...tableData];
    
    let insertIndex = lessonRowIndex + 1;
    while (insertIndex < newTableData.length && !newTableData[insertIndex]['Урок номер']) insertIndex++;
    
    newTableData.splice(insertIndex, 0, newWordRow);
    setTableData(newTableData);
    setShowAddWordModal(false);
    setCurrentLesson(null);
    await saveTableToDatabase(newTableData);
  };

  const getLanguageNumber = (language) => {
    const languageNumbers = {
      'Русский': '1',
      'Английский': '2', 
      'Турецкий': '3',
      'Испанский': '4',
      'Немецкий': '5',
      'Французский': '6',
      'Итальянский': '7',
      'Китайский': '8',
      'Японский': '9'
    };
    
    if (languageNumbers[language]) {
      return languageNumbers[language];
    }
    
    const existingLanguages = getAddedLanguages();
    let maxNumber = 0;
    
    existingLanguages.forEach(lang => {
      const langNumber = parseInt(languageNumbers[lang] || '0');
      if (langNumber > maxNumber) maxNumber = langNumber;
    });
    
    return (maxNumber + 1).toString();
  };

  const getWordsForTheme = (theme) => {
    console.log('Searching for words in theme:', theme);
    const words = [];
    let currentTheme = null;
    let collectingWords = false;
    
    tableData.forEach((row, index) => {
      if (row['Урок название'] && row['Урок название'] === theme) {
        console.log(`Found theme header at row ${index}`);
        currentTheme = theme;
        collectingWords = true;
        return;
      }
      
      if (row['Урок название'] && row['Урок название'] !== theme) {
        console.log(`Found different theme at row ${index}: ${row['Урок название']}, stopping collection`);
        currentTheme = null;
        collectingWords = false;
        return;
      }
      
      if (collectingWords && row['База изображение'] && row['База изображение'].trim() !== '') {
        console.log(`Found word at row ${index}:`, row);
        
        const translations = {};
        
        Object.keys(row).forEach(col => {
          if (col.includes('База существительные слова')) {
            const language = col.split(' ').pop().toLowerCase();
            const translation = row[col] || '';
            if (translation.trim() !== '') {
              translations[language] = translation;
            }
          }
        });
        
        const wordObj = {
          imageBase: row['База изображение'],
          imagePng: row['Картинка png'] || '',
          translations: translations
        };
        
        console.log('Created word object:', wordObj);
        words.push(wordObj);
      }
    });
    
    console.log(`Total words found for theme "${theme}": ${words.length}`, words);
    return words;
  };



  const createTest = async () => {
    try {
      const selectedWordIds = selectedWords.map(word => word.imageBase || word.id);

      const testData = {
        lessonId: `table_${newLesson.theme}_${Date.now()}`,
        studiedLanguage: newLesson.studiedLanguage,
        hintLanguage: newLesson.hintLanguage,
        level: newLesson.level,
        theme: newLesson.theme,
        fontColor: newLesson.fontColor,
        bgColor: newLesson.bgColor,
        wordIds: selectedWordIds,
        words: selectedWords
      };

      const response = await fetch(`${API_BASE_URL}/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
if (!isTestFormValid()) {
    if (testTranslationCheck.missingWords.length > 0) {
      const missingDetails = testTranslationCheck.missingWords.map(w => 
        `Слово "${w.word}": ${w.missingStudied ? `отсутствует перевод для ${newLesson.studiedLanguage}` : ''}${w.missingStudied && w.missingHint ? ', ' : ''}${w.missingHint ? ` отсутствует перевод для ${newLesson.hintLanguage}` : ''}`
      ).join('\n');
      alert(`Нельзя создать тест:\n${testTranslationCheck.message}\n\nДетали:\n${missingDetails}`);
    } else {
      alert('Заполните все поля корректно и выберите минимум 2 слова');
    }
    return;
  }
      if (response.ok) {
        setShowCreateTestModal(false);
        setNewLesson({ 
          studiedLanguage: 'русский',
          hintLanguage: 'турецкий',
          level: 'A1', 
          theme: '', 
          fontColor: '#000000', 
          bgColor: '#ffffff' 
        });
        setSelectedWords([]);
        alert(`Тест "${newLesson.theme}" создан успешно! Слов: ${selectedWords.length}`);
        loadTests();
      } else {
        throw new Error('Server error');
      }
    } catch (error) {
      console.error('Error creating test:', error);
      alert('Ошибка создания теста: ' + error.message);
    }
  };

  const createTestFromLesson = async (lesson) => {
    if (lesson.words.length < 2) {
      alert('В уроке меньше 2 слов. Нельзя создать тест.');
      return;
    }

    try {
      const testData = {
        lessonId: lesson._id,
        studiedLanguage: lesson.studiedLanguage,
        hintLanguage: lesson.hintLanguage,
        level: lesson.level,
        theme: lesson.theme,
        fontColor: lesson.fontColor,
        bgColor: lesson.bgColor,
        wordIds: lesson.words.map(word => word.imageBase || word.id),
        words: lesson.words
      };

      const response = await fetch(`${API_BASE_URL}/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        alert(`Тест "${lesson.theme}" автогенерирован успешно! Слов: ${lesson.words.length}`);
        loadTests();
        loadLessons();
      } else {
        throw new Error('Server error');
      }
    } catch (error) {
      console.error('Error auto-generating test:', error);
      alert('Ошибка автогенерации теста: ' + error.message);
    }
  };

  // Рендер
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Загрузка данных...</div>
      </div>
    );
  }

  const availableLanguages = getAvailableLanguages();
  const addedLanguages = getAddedLanguages();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Админка - Управление базой данных</h1>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => setShowFlagsModal(true)} 
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Управление флагами
          </button>
          <button 
            onClick={() => setShowLessonsModal(true)} 
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Управление уроками
          </button>
          <button 
            onClick={() => setShowTestsModal(true)} 
            className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
          >
            Управление тестами
          </button>
          <button onClick={loadDataFromBackend} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Обновить</button>
          <button onClick={() => setShowCreateLessonModal(true)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Создать урок</button>
          <button onClick={() => setShowCreateTestModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Создать тест</button>
            <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-2"
            title="Выйти из системы"
          >
            Выйти
          </button>
        </div>
      </div>

      <section className="mb-4 p-3 bg-white rounded-lg border">
        <h3 className="font-semibold mb-2">Добавленные языки:</h3>
        <div className="flex flex-wrap gap-2">
          {addedLanguages.map(lang => (
            <div key={lang} className="flex items-center gap-1">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{lang}</span>
              <button 
                onClick={() => deleteLanguage(lang)}
                className="w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                title={`Удалить язык ${lang}`}
              >
                ×
              </button>
            </div>
          ))}
          {availableLanguages.length > 0 && (
            <button onClick={() => setShowAddLanguageModal(true)} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200">+ Добавить язык</button>
          )}
        </div>
      </section>

      <section className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Таблица базы данных</h3>
          <div className="flex gap-2 flex-wrap">
            <button onClick={addNewLesson} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Новый урок</button>
            {availableLanguages.length > 0 && <button onClick={() => setShowAddLanguageModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ Добавить язык</button>}
          </div>
        </div>

        <div className="overflow-auto border rounded-lg" style={{ maxHeight: '70vh' }}>
          <div className="min-w-full inline-block">
            <table className="min-w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="border p-2 bg-gray-100 sticky left-0 z-20 whitespace-nowrap">Действия</th>
                  {tableData.length > 0 && Object.keys(tableData[0]).map(key => (
                    <th key={key} className="border p-2 bg-gray-100 whitespace-nowrap group relative min-w-32">
                      <div className="flex items-center justify-between">
                        <span className="truncate max-w-xs">{key}</span>
                        <button
                          onClick={() => deleteColumn(key)}
                          className="ml-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 flex-shrink-0"
                          title={`Удалить колонку ${key}`}
                        >
                          ×
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, rowIndex) => (
                  <tr key={rowIndex} className={isLessonHeader(row) ? 'bg-blue-50' : ''}>
                    <td className="border p-1 bg-white sticky left-0 z-10">
                      <div className="flex flex-col gap-1 min-w-24">
                        {isLessonHeader(row) ? (
                          <button onClick={() => { setCurrentLesson(rowIndex); setShowAddWordModal(true); }} className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 w-full">+ Слово</button>
                        ) : row['База изображение'] ? (
                          <button onClick={() => openImageUploadModal(rowIndex)} className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 w-full">📷 Картинка</button>
                        ) : <div className="text-xs text-gray-400">—</div>}
                        <button 
                          onClick={() => deleteRow(rowIndex)}
                          className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 w-full"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>

                    {Object.keys(row).map(colKey => (
                      <td key={colKey} className="border p-1 min-w-32">
                        {editingCell?.rowIndex === rowIndex && editingCell?.colKey === colKey ? (
                          <input 
                            value={row[colKey] || ''} 
                            onChange={(e) => handleCellEdit(rowIndex, colKey, e.target.value)} 
                            onBlur={() => setEditingCell(null)} 
                            autoFocus 
                            className="w-full p-1 border rounded" 
                          />
                        ) : (
                          <span 
                            onClick={() => setEditingCell({ rowIndex, colKey })} 
                            className="cursor-pointer hover:bg-yellow-100 block p-1 rounded min-h-6"
                          >
                            {colKey === 'Картинка png' && row[colKey] ? (
                              <img 
                                src={row[colKey]} 
                                alt="Preview" 
                                className="h-8 w-8 object-cover rounded mx-auto" 
                                onError={(e) => { e.target.style.display = 'none'; }} 
                              />
                            ) : (
                              <span className="block truncate max-w-xs">{row[colKey] || ''}</span>
                            )}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {tableData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Таблица пуста. Нажмите "Обновить" для загрузки данных.</p>
          </div>
        )}
      </section>

      {showFlagsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-6xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-center">Управление флагами</h3>
            
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800">Языки в таблице</h4>
                <p className="text-2xl font-bold text-blue-600">{tableLanguages.length}</p>
                <p className="text-sm text-blue-600">{tableLanguages.join(', ')}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800">Флагов в системе</h4>
                <p className="text-2xl font-bold text-green-600">{flags.length}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800">Действия</h4>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={syncFlagsWithTable}
                    className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                  >
                    Синхронизировать
                  </button>
                  <button 
                    onClick={initializeFlags}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Стандартные
                  </button>
                  <button 
                    onClick={loadFlags}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                  >
                    Обновить
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flags.map((flag, index) => (
                <div key={flag._id || index} className="border rounded-lg p-4 bg-gray-50 relative">
                  <button
                    onClick={() => deleteFlag(flag._id, flag.language)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
                    title={`Удалить флаг ${flag.language}`}
                  >
                    ×
                  </button>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Язык</label>
                      <input
                        type="text"
                        value={flag.language}
                        onChange={(e) => {
                          const newFlags = [...flags];
                          newFlags[index] = { ...newFlags[index], language: e.target.value };
                          setFlags(newFlags);
                        }}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Например: Русский"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Изображение флага</label>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-16 h-12 border rounded overflow-hidden flex items-center justify-center bg-white">
                          {flag.image && flag.image.startsWith('http') ? (
                            <img 
                              src={flag.image} 
                              alt={flag.language}
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                          <span className={`text-2xl ${flag.image && !flag.image.startsWith('http') ? 'flex' : 'hidden'} items-center justify-center w-full h-full`}>
                            {flag.image}
                          </span>
                          {!flag.image && (
                            <span className="text-gray-400 text-sm">Нет изображения</span>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFlagImageUpload(flag, file);
                              }
                            }}
                            className="w-full text-sm"
                            disabled={uploadingFlag === flag._id}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {uploadingFlag === flag._id ? 'Загрузка...' : 'Выберите файл изображения'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={async () => {
                        const success = await saveFlag(flag);
                        if (success) {
                          alert('Флаг сохранен успешно!');
                        } else {
                          alert('Ошибка при сохранении флага');
                        }
                      }}
                      disabled={uploadingFlag === flag._id}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {uploadingFlag === flag._id ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {flags.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Флаги не найдены. Нажмите "Синхронизировать" чтобы создать флаги для всех языков из таблицы.</p>
              </div>
            )}

            {tableLanguages.length > 0 && (
              <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Языки из таблицы, для которых нет флагов:</h4>
                <div className="flex flex-wrap gap-2">
                  {tableLanguages
                    .filter(lang => !flags.some(flag => flag.language === lang))
                    .map(lang => (
                      <span key={lang} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        {lang}
                      </span>
                    ))}
                </div>
                <p className="text-sm text-yellow-600 mt-2">
                  Нажмите "Синхронизировать" чтобы автоматически создать флаги для этих языков.
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-2 justify-end">
              <button 
                onClick={() => setShowFlagsModal(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {showLessonsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-center">Управление уроками</h3>
            
            <div className="mb-4">
              <button 
                onClick={() => setShowCreateLessonModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + Создать новый урок
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lessons.map(lesson => (
                <div key={lesson._id} className="border rounded-lg p-4 bg-gray-50 relative">
                  <button
                    onClick={() => deleteLesson(lesson._id, lesson.title)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
                    title={`Удалить урок ${lesson.title}`}
                  >
                    ×
                  </button>
                  
                  <h4 className="font-semibold text-lg mb-2">{lesson.title}</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Уровень:</strong> {lesson.level}</p>
                    <p><strong>Тема:</strong> {lesson.theme}</p>
                    <p><strong>Изучаемый язык:</strong> {lesson.studiedLanguage}</p>
                    <p><strong>Язык подсказки:</strong> {lesson.hintLanguage}</p>
                    <p><strong>Количество слов:</strong> {lesson.words?.length || 0}</p>
                    <p><strong>Номер урока:</strong> {lesson.lessonNumber}</p>
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                  
                    <button 
                      onClick={() => createTestFromLesson(lesson)}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                    >
                      Автогенерация теста
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {lessons.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Уроки не найдены. Создайте первый урок!</p>
              </div>
            )}

            <div className="mt-6 flex gap-2 justify-end">
              <button 
                onClick={() => setShowLessonsModal(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {showTestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-center">Управление тестами</h3>
            
            <div className="mb-4">
              <button 
                onClick={() => setShowCreateTestModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + Создать новый тест
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.map(test => (
                <div key={test._id} className="border rounded-lg p-4 bg-gray-50 relative">
                  <button
                    onClick={() => deleteTest(test._id, test.theme)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
                    title={`Удалить тест ${test.theme}`}
                  >
                    ×
                  </button>
                  
                  <h4 className="font-semibold text-lg mb-2">{test.theme}</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Уровень:</strong> {test.level}</p>
                    <p><strong>Тема:</strong> {test.theme}</p>
                    <p><strong>Изучаемый язык:</strong> {test.studiedLanguage}</p>
                    <p><strong>Язык подсказки:</strong> {test.hintLanguage}</p>
                    <p><strong>ID урока:</strong> {test.lessonId}</p>
                    <p><strong>Количество слов:</strong> {test.wordIds?.length || 0}</p>
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                  </div>
                </div>
              ))}
            </div>

            {tests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Тесты не найдены. Создайте первый тест!</p>
              </div>
            )}

            <div className="mt-6 flex gap-2 justify-end">
              <button 
                onClick={() => setShowTestsModal(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg w-[500px]">
            <h3 className="text-2xl font-bold mb-6 text-center">Создать урок</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm font-medium text-right">Изучаемый язык</label>
                <select 
                  value={newLesson.studiedLanguage}
                  onChange={(e) => setNewLesson({...newLesson, studiedLanguage: e.target.value})}
                  className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white"
                >
                  <option value="">-- Выберите язык --</option>
                  {addedLanguages.map(lang => (
                    <option key={lang} value={lang.toLowerCase()}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm font-medium text-right">Язык подсказки</label>
                <select 
                  value={newLesson.hintLanguage}
                  onChange={(e) => setNewLesson({...newLesson, hintLanguage: e.target.value})}
                  className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white"
                >
                  <option value="">-- Выберите язык --</option>
                  {addedLanguages.map(lang => (
                    <option key={lang} value={lang.toLowerCase()}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
<div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Тема урока</label>
          <select 
            value={newLesson.theme}
            onChange={(e) => setNewLesson({...newLesson, theme: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white"
          >
            <option value="">-- Выберите тему --</option>
            {getAvailableThemes().map(theme => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </div>

        {/* Новый блок: Информация о переводах */}
        {newLesson.theme && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold mb-2">Проверка переводов для темы "{newLesson.theme}"</h4>
            {translationCheck.isValid ? (
              <p className="text-green-600">Все слова имеют переводы на выбранные языки. Урок можно создать.</p>
            ) : (
              <>
                <p className="text-red-600 mb-2">{translationCheck.message}</p>
                <ul className="list-disc pl-5 text-sm text-red-600">
                  {translationCheck.missingWords.map((w, index) => (
                    <li key={index}>
                      Слово "{w.word}": 
                      {w.missingStudied ? ` отсутствует перевод для ${newLesson.studiedLanguage}` : ''}
                      {w.missingStudied && w.missingHint ? ', ' : ''}
                      {w.missingHint ? ` отсутствует перевод для ${newLesson.hintLanguage}` : ''}
                    </li>
                  ))}
                </ul>
                <p className="text-gray-600 mt-2 text-sm">Исправьте переводы в таблице и обновите страницу.</p>
              </>
            )}
          </div>
        )}
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm font-medium text-right">Уровень сложности</label>
                <select 
                  value={newLesson.level}
                  onChange={(e) => setNewLesson({...newLesson, level: e.target.value})}
                  className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white"
                >
                  <option value="">-- Выберите уровень --</option>
                  {getAvailableLevels().map(level => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm font-medium text-right">Тема урока</label>
                <select 
                  value={newLesson.theme}
                  onChange={(e) => setNewLesson({...newLesson, theme: e.target.value})}
                  className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white"
                >
                  <option value="">-- Выберите тему --</option>
                  {getAvailableThemes().map(theme => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm font-medium text-right">Задать цвет шрифта</label>
                <div className="col-span-2 flex items-center gap-3">
                  <input 
                    type="color"
                    value={newLesson.fontColor}
                    onChange={(e) => setNewLesson({...newLesson, fontColor: e.target.value})}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{newLesson.fontColor}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm font-medium text-right">Задать цвет фона</label>
                <div className="col-span-2 flex items-center gap-3">
                  <input 
                    type="color"
                    value={newLesson.bgColor}
                    onChange={(e) => setNewLesson({...newLesson, bgColor: e.target.value})}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{newLesson.bgColor}</span>
                </div>
              </div>

              <div className="flex justify-center pt-4 gap-5">
                <button 
                  onClick={() => setShowCreateLessonModal(false)}
                  className="px-12 py-3 bg-gray-500 text-white rounded-lg text-lg font-medium hover:bg-gray-600"
                >
                  Отмена
                </button>
                
                <button 
                  onClick={createLesson}
                  disabled={!isLessonFormValid()}
                  className="px-12 py-3 bg-green-600 text-white rounded-lg text-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Ок
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Остальные модалки (image upload, add language, add word, create test) остаются без изменений */}
      {showImageUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Загрузка изображения</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Выберите файл изображения</label>
                <input type="file" accept="image/*" onChange={handleFileSelect} className="w-full border rounded p-2" />
              </div>
              {imagePreview && <div><label className="block text-sm font-medium mb-2">Предпросмотр:</label><img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded border" /></div>}
              <div className="text-sm text-gray-600"><p>Изображение будет загружено на imgbb и сохранено в базе данных.</p></div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => { setShowImageUploadModal(false); setSelectedFile(null); setImagePreview(null); }} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600" disabled={uploadingImage}>Отмена</button>
              <button onClick={handleImageUpload} disabled={!selectedFile || uploadingImage} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400">{uploadingImage ? 'Загрузка...' : 'Загрузить'}</button>
            </div>
          </div>
        </div>
      )}

      {showAddLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Добавить новый язык</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Выберите язык</label>
                <select value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="">-- Выберите язык --</option>
                  {availableLanguages.map(([key, config]) => <option key={key} value={key}>{config.number.split(' ').pop()}</option>)}
                </select>
              </div>
              {newLanguage && <div className="p-3 bg-gray-50 rounded"><p className="text-sm font-medium">Будут созданы колонки:</p><p className="text-blue-600 font-semibold">{allLanguages[newLanguage]?.number}</p><p className="text-blue-600 font-semibold">{allLanguages[newLanguage]?.word}</p></div>}
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => setShowAddLanguageModal(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Отмена</button>
              <button onClick={handleAddLanguage} disabled={!newLanguage} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">Добавить язык</button>
            </div>
          </div>
        </div>
      )}

      {showAddWordModal && currentLesson !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Добавить слово к уроку: {tableData[currentLesson]?.['Урок название']}</h3>
            <p className="text-gray-600 mb-4">Будет создано новое слово с автоматической нумерацией для всех добавленных языков.</p>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => { setShowAddWordModal(false); setCurrentLesson(null); }} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Отмена</button>
              <button onClick={() => addWordToLesson(currentLesson)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Добавить слово</button>
            </div>
          </div>
        </div>
      )}

    {showCreateTestModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
      <h3 className="text-2xl font-bold mb-6 text-center">Создать тест</h3>
      
      <div className="space-y-6">
        {/* Изучаемый язык */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Изучаемый язык</label>
          <select 
            value={newLesson.studiedLanguage}
            onChange={(e) => setNewLesson({...newLesson, studiedLanguage: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white"
          >
            <option value="">-- Выберите язык --</option>
            {addedLanguages.map(lang => (
              <option key={lang} value={lang.toLowerCase()}>
                {lang}
              </option>
            ))}
          </select>
        </div>
{newLesson.theme && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold mb-3">Выберите слова для теста (минимум 2):</h4>
            <div className="max-h-40 overflow-y-auto">
              <WordSelector 
                theme={newLesson.theme}
                onWordsChange={setSelectedWords}
              />
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Выбрано слов: {selectedWords.length}
              {selectedWords.length < 2 && (
                <span className="text-red-500 ml-2">* Необходимо выбрать минимум 2 слова</span>
              )}
            </div>
          </div>
        )}

        {/* Новый блок: Информация о переводах */}
        {selectedWords.length >= 2 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold mb-2">Проверка переводов для выбранных слов</h4>
            {testTranslationCheck.isValid ? (
              <p className="text-green-600">Все выбранные слова имеют переводы на выбранные языки. Тест можно создать.</p>
            ) : (
              <>
                <p className="text-red-600 mb-2">{testTranslationCheck.message}</p>
                <ul className="list-disc pl-5 text-sm text-red-600">
                  {testTranslationCheck.missingWords.map((w, index) => (
                    <li key={index}>
                      Слово "{w.word}": 
                      {w.missingStudied ? ` отсутствует перевод для ${newLesson.studiedLanguage}` : ''}
                      {w.missingStudied && w.missingHint ? ', ' : ''}
                      {w.missingHint ? ` отсутствует перевод для ${newLesson.hintLanguage}` : ''}
                    </li>
                  ))}
                </ul>
                <p className="text-gray-600 mt-2 text-sm">Исправьте переводы в таблице и обновите выбор слов.</p>
              </>
            )}
          </div>
        )}
        {/* Язык подсказки */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Язык подсказки</label>
          <select 
            value={newLesson.hintLanguage}
            onChange={(e) => setNewLesson({...newLesson, hintLanguage: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white"
          >
            <option value="">-- Выберите язык --</option>
            {addedLanguages.map(lang => (
              <option key={lang} value={lang.toLowerCase()}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Уровень сложности */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Уровень сложности</label>
          <select 
            value={newLesson.level}
            onChange={(e) => setNewLesson({...newLesson, level: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white"
          >
            <option value="">-- Выберите уровень --</option>
            {getAvailableLevels().map(level => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        {/* Тема урока */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Тема урока</label>
          <select 
            value={newLesson.theme}
            onChange={(e) => {
              setNewLesson({...newLesson, theme: e.target.value});
              // При смене темы сбрасываем выбранные слова
              setSelectedWords([]);
            }}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white"
          >
            <option value="">-- Выберите тему --</option>
            {getAvailableThemes().map(theme => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </div>

        {/* Выбор слов из темы */}
    

        {/* Задать цвет шрифта */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Задать цвет шрифта</label>
          <div className="col-span-2 flex items-center gap-3">
            <input 
              type="color"
              value={newLesson.fontColor}
              onChange={(e) => setNewLesson({...newLesson, fontColor: e.target.value})}
              className="h-10 w-20 cursor-pointer"
            />
            <span className="text-sm text-gray-600">{newLesson.fontColor}</span>
          </div>
        </div>

        {/* Задать цвет фона */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Задать цвет фона</label>
          <div className="col-span-2 flex items-center gap-3">
            <input 
              type="color"
              value={newLesson.bgColor}
              onChange={(e) => setNewLesson({...newLesson, bgColor: e.target.value})}
              className="h-10 w-20 cursor-pointer"
            />
            <span className="text-sm text-gray-600">{newLesson.bgColor}</span>
          </div>
        </div>

        {/* Кнопка ОК */}
        <div className="flex justify-center pt-4 gap-5">
          <button 
            onClick={() => {
              setShowCreateTestModal(false);
              setSelectedWords([]);
            }}
            className="px-12 py-3 bg-gray-500 text-white rounded-lg text-lg font-medium hover:bg-gray-600"
          >
            Отмена
          </button>
          
          <button 
            onClick={createTest}
            disabled={!isTestFormValid()}
            className="px-12 py-3 bg-purple-600 text-white rounded-lg text-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Создать тест
          </button>

        </div>
      </div>
    </div>
  </div>
)}

      <div className="text-sm text-gray-500 mt-4">Данные автоматически сохраняются в MongoDB при изменении</div>
    </div>
  );
}