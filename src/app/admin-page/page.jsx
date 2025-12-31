
"use client"
import React, { useEffect, useState, useMemo } from 'react';
import { getAvailableThemes } from '@/utils/themeUtils'
import { normalizeSentence, normalizeWord } from '@/utils/normalize';
const API_BASE_URL = 'https://learn-lng-server-8jf0.onrender.com/api';
// Компонент для визуализации предложений
// Компонент SentenceTable
const getDatabaseDisplayName = (database) => {
  const databaseNames = {
    'nouns': 'Существительное',
    'adjectives': 'Прилагательное',
    'verbs': 'Глагол',
    'pronouns': 'Местоимение', 
    'numerals': 'Числительное',
    'adverbs': 'Наречие',
    'prepositions': 'Предлог',
    'question-words': 'Вопросительное слово'
  };
  return databaseNames[database] || database;
};
// Создайте новый компонент SentenceColumn.jsx
const SentenceColumn = ({ 
  config, 
  columnIndex, 
  columnData,
  onColumnChange,
  lessonData,
  getAvailableThemes 
}) => {
  
  return (
    <div className="space-y-3">
      {/* Выбор урока */}
      <div>
        <label className="block text-sm font-medium mb-1">Выбрать урок</label>
        <select
          value={columnData.lesson || ''}
          onChange={(e) => onColumnChange(columnIndex, 'lesson', e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Выберите урок</option>
          {getAvailableThemes().map(theme => (
            <option key={theme} value={theme}>{theme}</option>
          ))}
        </select>
      </div>

      {/* ФИЛЬТРЫ С ПАДЕЖАМИ */}
      <div className="grid grid-cols-2 gap-2">
        {/* Число для существительных и прилагательных */}
        {(config.database === 'nouns' || config.database === 'adjectives') && (
          <div>
            <label className="block text-sm font-medium mb-1">Число</label>
            <select
              value={columnData.number || ''}
              onChange={(e) => onColumnChange(columnIndex, 'number', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любое</option>
              <option value="единственное">Единственное</option>
              <option value="множественное">Множественное</option>
            </select>
          </div>
        )}

        {/* Род для прилагательных */}
        {config.database === 'adjectives' && (
          <div>
            <label className="block text-sm font-medium mb-1">Род</label>
            <select
              value={columnData.gender || ''}
              onChange={(e) => onColumnChange(columnIndex, 'gender', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любой</option>
              <option value="мужской">Мужской</option>
              <option value="женский">Женский</option>
              <option value="средний">Средний</option>
            </select>
          </div>
        )}

        {/* ПАДЕЖ ДЛЯ СУЩЕСТВИТЕЛЬНЫХ И ПРИЛАГАТЕЛЬНЫХ */}
        {(config.database === 'nouns' || config.database === 'adjectives') && (
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Падеж</label>
            <select
              value={columnData.case || ''}
              onChange={(e) => onColumnChange(columnIndex, 'case', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любой</option>
              <option value="именительный">Именительный</option>
              <option value="родительный">Родительный</option>
              <option value="дательный">Дательный</option>
              <option value="винительный">Винительный</option>
              <option value="творительный">Творительный</option>
              <option value="предложный">Предложный</option>
            </select>
          </div>
        )}
      </div>

      {/* Выбор слова */}
      <div>
        <label className="block text-sm font-medium mb-1">Выбрать слово</label>
        
        <WordSelector
          studiedLanguage={lessonData?.studiedLanguage || 'русский'}
          theme={columnData.lesson || ''}
          database={config.database}
          filters={{
            number: columnData.number,
            gender: columnData.gender,
            case: columnData.case
          }}
          onWordSelect={(selectedWord) => {
            onColumnChange(columnIndex, 'word', selectedWord.displayWord || selectedWord.word);
            onColumnChange(columnIndex, 'wordData', selectedWord);
          }}
          selectedWord={columnData.wordData}
        />
      </div>
    </div>
  );
};
const AdjectiveCaseManagementModal = ({ isOpen, onClose, word, onSave, language = 'русский' }) => {
  const [cases, setCases] = useState({
    singular: {
      masculine: {
        nominative: '',
        genitive: '',
        dative: '',
        accusative: '',
        instrumental: '',
        prepositional: ''
      },
      feminine: {
        nominative: '',
        genitive: '',
        dative: '',
        accusative: '',
        instrumental: '',
        prepositional: ''
      },
      neuter: {
        nominative: '',
        genitive: '',
        dative: '',
        accusative: '',
        instrumental: '',
        prepositional: ''
      }
    },
    plural: {
      nominative: '',
      genitive: '',
      dative: '',
      accusative: '',
      instrumental: '',
      prepositional: ''
    }
  });

  useEffect(() => {
    if (word) {
      loadCases();
    }
  }, [word]);

  const loadCases = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/adjective-cases/${word.imageBase}`);
      const data = await response.json();
      if (data.singular || data.plural) {
        setCases({
          singular: data.singular || {
            masculine: {}, feminine: {}, neuter: {}
          },
          plural: data.plural || {}
        });
      }
    } catch (error) {
      console.error('Error loading adjective cases:', error);
    }
  };

 const handleSave = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/adjective-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase: word.imageBase,
        singular: cases.singular,
        plural: cases.plural,
        language: 'русский' // ← ДОБАВЬТЕ ЭТО ПОЛЕ
      })
    });
    
    if (response.ok) {
      const savedData = await response.json();
      console.log('Adjective cases saved successfully:', savedData);
      
      // Вызываем callback с обновленными данными
      if (onSave) {
        onSave(savedData);
      }
      
      // Показываем уведомление
      alert('Падежи прилагательного успешно сохранены!');
      
      onClose();
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to save adjective cases');
    }
  } catch (error) {
    console.error('Error saving adjective cases:', error);
    alert('Ошибка сохранения падежей: ' + error.message);
  }
};

  const handleCaseChange = (gender, number, caseType, value) => {
    if (gender) {
      setCases(prev => ({
        ...prev,
        singular: {
          ...prev.singular,
          [gender]: {
            ...prev.singular[gender],
            [caseType]: value
          }
        }
      }));
    } else {
      setCases(prev => ({
        ...prev,
        plural: {
          ...prev.plural,
          [caseType]: value
        }
      }));
    }
  };

  if (!isOpen) return null;

  const caseTypes = [
    { key: 'nominative', label: 'Именительный' },
    { key: 'genitive', label: 'Родительный' },
    { key: 'dative', label: 'Дательный' },
    { key: 'accusative', label: 'Винительный' },
    { key: 'instrumental', label: 'Творительный' },
    { key: 'prepositional', label: 'Предложный' }
  ];

  const genders = [
    { key: 'masculine', label: 'Мужской род' },
    { key: 'feminine', label: 'Женский род' },
    { key: 'neuter', label: 'Средний род' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          Склонения прилагательного: <span className="text-blue-600">{word?.translations?.russian || word?.word}</span>
        </h3>
         <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center">
            <span className="font-medium">Язык падежей:</span>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {language}
            </span>
            {language === 'русский' && (
              <span className="ml-2 text-sm text-gray-600">
                (полная поддержка родов, чисел и падежей)
              </span>
            )}
          </div>
        </div>
        {/* Таблица падежей */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              {/* Заголовок для единственного числа */}
              <tr>
                <th colSpan="19" className="border border-gray-300 p-2 text-center font-semibold bg-blue-100">
                  Единственное число
                </th>
              </tr>
              <tr className="bg-gray-100">
                <th rowSpan="2" className="border border-gray-300 p-2 text-sm font-medium">Падеж</th>
                {genders.map(gender => (
                  <th key={gender.key} colSpan="6" className="border border-gray-300 p-2 text-center font-semibold">
                    {gender.label}
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-50">
                {genders.map(gender => (
                  caseTypes.map(caseType => (
                    <th key={`${gender.key}-${caseType.key}`} className="border border-gray-300 p-2 text-xs font-medium">
                      {caseType.label}
                    </th>
                  ))
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-sm font-medium bg-gray-50">
                  Формы
                </td>
                {genders.map(gender => (
                  caseTypes.map(caseType => (
                    <td key={`input-${gender.key}-${caseType.key}`} className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={cases.singular[gender.key]?.[caseType.key] || ''}
                        onChange={(e) => handleCaseChange(gender.key, 'singular', caseType.key, e.target.value)}
                        className="w-full p-2 border-none focus:outline-none focus:bg-blue-50"
                        placeholder={`${gender.label.slice(0, 3)}. ${caseType.label}`}
                      />
                    </td>
                  ))
                ))}
              </tr>
            </tbody>
          </table>

          {/* Таблица для множественного числа */}
          <table className="min-w-full border-collapse border border-gray-300 mt-6">
            <thead>
              <tr>
                <th colSpan="6" className="border border-gray-300 p-2 text-center font-semibold bg-green-100">
                  Множественное число
                </th>
              </tr>
              <tr className="bg-gray-100">
                {caseTypes.map(caseType => (
                  <th key={`plural-${caseType.key}`} className="border border-gray-300 p-2 text-sm font-medium">
                    {caseType.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {caseTypes.map(caseType => (
                  <td key={`plural-input-${caseType.key}`} className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={cases.plural[caseType.key] || ''}
                      onChange={(e) => handleCaseChange(null, 'plural', caseType.key, e.target.value)}
                      className="w-full p-2 border-none focus:outline-none focus:bg-green-50"
                      placeholder={`мн.ч. ${caseType.label}`}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Подсказка */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-semibold text-yellow-800 mb-1">Подсказки по падежам прилагательных:</h4>
          <div className="text-sm text-yellow-700">
            <div className="grid grid-cols-2 gap-2">
              <div><strong>Именительный:</strong> какой? какая? какое? (есть)</div>
              <div><strong>Родительный:</strong> какого? какой? какого? (нет)</div>
              <div><strong>Дательный:</strong> какому? какой? какому? (дать)</div>
              <div><strong>Винительный:</strong> какого? какую? какое? (вижу)</div>
              <div><strong>Творительный:</strong> каким? какой? каким? (горжусь)</div>
              <div><strong>Предложный:</strong> о каком? о какой? о каком? (думаю)</div>
            </div>
            <p className="mt-2 text-xs">Прилагательные согласуются с существительными в роде, числе и падеже.</p>
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Отмена
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Сохранить падежи
          </button>
        </div>
      </div>
    </div>
  );
};
const SentenceTable = ({ sentences, moduleConfig, onEdit, onDelete }) => {
  const columnConfigs = moduleConfig?.config?.columnConfigs || moduleConfig?.columnConfigs || [];
  
  if (!sentences || sentences.length === 0) {
    return <div className="text-center py-4 text-gray-500">Нет добавленных предложений</div>;
  }

  return (
    <div className="mt-4">
      <h5 className="font-semibold mb-2">Таблица предложений:</h5>
      <div className="overflow-x-auto max-w-full">
        <table className="min-w-full border-collapse border border-gray-300 table-auto">
          <thead>
            <tr className="bg-gray-100">
              {columnConfigs.map((config, index) => (
                <th key={index} className="border border-gray-300 p-2 text-sm min-w-[150px] whitespace-normal break-words">
                  Колонка {index + 1} ({getDatabaseDisplayName(config.database)})
                </th>
              ))}
              <th className="border border-gray-300 p-2 text-sm min-w-[100px] whitespace-normal break-words">Картинка</th>
              <th className="border border-gray-300 p-2 text-sm min-w-[150px] sticky right-0 bg-gray-100 z-10">Действия</th>
            </tr>
          </thead>
          <tbody suppressHydrationWarning={true}>
            {sentences.map((sentence, rowIndex) => (
              <tr key={sentence._id || rowIndex} className="hover:bg-gray-50">
                {sentence.sentenceStructure && sentence.sentenceStructure.map((wordObj, colIndex) => {
                  const displayWord = wordObj.word || wordObj.wordData?.word || '—';
                  const config = columnConfigs[colIndex];
                  
                  return (
                    <td key={colIndex} className="border border-gray-300 p-2 text-sm min-w-[150px] whitespace-normal break-words">
                      <div className="font-medium">{displayWord}</div>
                      
                      {/* Отображение примененных фильтров */}
                      {(wordObj.number || wordObj.gender || wordObj.case) && (
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                          {wordObj.number && (
                            <div>Число: {wordObj.number}</div>
                          )}
                          {config?.database === 'adjectives' && wordObj.gender && (
                            <div>Род: {wordObj.gender}</div>
                          )}
                          {wordObj.case && (
                            <div>Падеж: {wordObj.case}</div>
                          )}
                        </div>
                      )}
                      
                      {wordObj.wordData && (
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {wordObj.wordData.imageBase}
                        </div>
                      )}
                    </td>
                  );
                })}
                
                {columnConfigs.slice(sentence.sentenceStructure?.length || 0).map((_, emptyIndex) => (
                  <td key={`empty-${emptyIndex}`} className="border border-gray-300 p-2 text-sm text-gray-400 min-w-[150px] whitespace-normal break-words">
                    —
                  </td>
                ))}
                
                <td className="border border-gray-300 p-2 min-w-[100px]">
                  {sentence.image ? (
                    <img
                      src={sentence.image}
                      alt="Preview"
                      className="h-10 w-10 object-cover rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-xs text-gray-500">Нет изображения</div>
                  )}
                </td>
                
                <td className="border border-gray-300 p-2 sticky right-0 bg-white z-10">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEdit(sentence)}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => onDelete(sentence._id)}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
const WordSelector = ({ 
  theme, 
  database, 
  onWordSelect, 
  selectedWord, 
  selectedWords = [],  // Добавляем значение по умолчанию
  filters = {}, 
  studiedLanguage = 'русский' 
}) => {
  const [availableWords, setAvailableWords] = useState([]);
  const [prepositions, setPrepositions] = useState([]);
  const [questionWords, setQuestionWords] = useState([]);

  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  // Загрузка предлогов
  useEffect(() => {
    const loadPrepositions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/prepositions-table`);
        const data = await response.json();
        setPrepositions(data || []);
      } catch (error) {
        console.error('Error loading prepositions:', error);
        setPrepositions([]);
      }
    };

    // Загрузка вопросительных слов
    const loadQuestionWords = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/question-words`);
        const data = await response.json();
        setQuestionWords(data || []);
      } catch (error) {
        console.error('Error loading question words:', error);
        setQuestionWords([]);
      }
    };

    if (database === 'prepositions') {
      loadPrepositions();
    } else if (database === 'question-words') {
      loadQuestionWords();
    }
  }, [database]);

  // Остальная логика загрузки слов для существительных и прилагательных
  useEffect(() => {
    const loadWordsForTheme = async () => {
      if (database === 'prepositions' || database === 'question-words') {
        return;
      }

      try {
        const endpoint = database === 'nouns' ? '/table' : '/adjectives-table';
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        const tableData = await response.json();
     
        if (!tableData || tableData.length === 0) {
          setAvailableWords([]);
          return;
        }

        const words = [];
        let currentTheme = null;
        let collectingWords = false;
     
        tableData.forEach((row, index) => {
          // Находим начало темы
          if (row['Урок название'] && row['Урок название'] === theme) {
            currentTheme = theme;
            collectingWords = true;
            return;
          }
       
          // Если нашли другую тему - прекращаем сбор
          if (row['Урок название'] && row['Урок название'] !== theme) {
            if (collectingWords) {
              collectingWords = false;
              currentTheme = null;
            }
            return;
          }
       
          // Собираем слова только для текущей темы
          if (collectingWords && row['База изображение'] && row['База изображение'].trim() !== '') {
            const translations = {};
            const forms = {};
         
            Object.keys(row).forEach(col => {
              // Для существительных
              if (database === 'nouns') {
                const prefix = 'База существительные слова';
                const pluralPrefix = 'База существительные множественное';
               
                if (col.includes(prefix)) {
                  const language = col.split(' ').pop().toLowerCase();
                  const translation = row[col] || '';
                  if (translation.trim() !== '') {
                    translations[language] = translation;
                    forms[`${language}_singular`] = translation;
                  }
                }
               
                if (col.includes(pluralPrefix)) {
                  const language = col.split(' ').pop().toLowerCase();
                  const pluralForm = row[col] || '';
                  if (pluralForm.trim() !== '') {
                    forms[`${language}_plural`] = pluralForm;
                  }
                }
              }
             
              // Для прилагательных
              if (database === 'adjectives') {
                const masculinePrefix = 'База прилагательные мужской род';
                const femininePrefix = 'База прилагательные женский род';
                const neuterPrefix = 'База прилагательные средний род';
                const pluralPrefix = 'База прилагательные множественное число';

                if (col.includes(masculinePrefix)) {
                  const language = col.split(' ').pop().toLowerCase();
                  const form = row[col] || '';
                  if (form.trim() !== '') {
                    forms[`${language}_masculine`] = form;
                    translations[language] = form;
                  }
                }

                if (col.includes(femininePrefix)) {
                  const language = col.split(' ').pop().toLowerCase();
                  const form = row[col] || '';
                  if (form.trim() !== '') {
                    forms[`${language}_feminine`] = form;
                  }
                }

                if (col.includes(neuterPrefix)) {
                  const language = col.split(' ').pop().toLowerCase();
                  const form = row[col] || '';
                  if (form.trim() !== '') {
                    forms[`${language}_neuter`] = form;
                  }
                }

                if (col.includes(pluralPrefix)) {
                  const language = col.split(' ').pop().toLowerCase();
                  const form = row[col] || '';
                  if (form.trim() !== '') {
                    forms[`${language}_plural`] = form;
                  }
                }
              }
            });
         
            const wordObj = {
              id: row['База изображение'],
              imageBase: row['База изображение'],
              imagePng: row['Картинка png'] || '',
              translations: translations,
              forms: forms
            };
         
            words.push(wordObj);
          }
        });
     
        // АСИНХРОННО применяем фильтры к каждому слову
        const filteredWords = [];
        for (const word of words) {
          const filteredWord = await applyFiltersToWord(word, database, memoizedFilters, studiedLanguage);
          if (filteredWord !== null) {
            filteredWords.push(filteredWord);
          }
        }
     
        setAvailableWords(filteredWords);
        console.log(`Loaded ${filteredWords.length} filtered words for theme "${theme}" from ${database}`, { filters });
     
      } catch (error) {
        console.error('Error loading words for theme:', error);
        setAvailableWords([]);
      }
    };
   
    if (theme && theme.trim() !== '' && database !== 'prepositions' && database !== 'question-words') {
      loadWordsForTheme();
    } else {
      setAvailableWords([]);
    }
  }, [theme, database, JSON.stringify(memoizedFilters), studiedLanguage]);

  // Функция применения фильтров к слову
  const applyFiltersToWord = async (word, database, filters = {}, studiedLanguage = 'русский') => {
    const { number, gender, case: caseType } = filters || {};
    
    console.log('Applying filters:', { database, filters, studiedLanguage, word });

    // Для прилагательных с падежами
    if (database === 'adjectives' && caseType && caseType !== 'именительный') {
      try {
        const langConfig = getAdjectiveLanguageConfig(studiedLanguage);
        
        // Только для языков с поддержкой падежей
        if (langConfig.hasCases) {
          const response = await fetch(`${API_BASE_URL}/adjective-cases/${word.imageBase}`);
          if (response.ok) {
            const caseData = await response.json();
            
            console.log('Loaded adjective case data:', caseData);
            
            if (caseData && (caseData.singular || caseData.plural)) {
              const caseMapping = {
                'именительный': 'nominative',
                'родительный': 'genitive', 
                'дательный': 'dative',
                'винительный': 'accusative',
                'творительный': 'instrumental',
                'предложный': 'prepositional'
              };
              
              const caseKey = caseMapping[caseType];
              
              // Множественное число
              if (number && (number === 'множественное' || number === 'plural')) {
                if (caseData.plural && caseData.plural[caseKey]) {
                  const displayWord = caseData.plural[caseKey];
                  console.log(`Found plural case form: ${displayWord}`);
                  return { 
                    ...word, 
                    displayWord: displayWord,
                    caseForm: displayWord
                  };
                }
              } 
              // Единственное число
              else {
                const genderMapping = {
                  'мужской': 'masculine',
                  'женский': 'feminine',
                  'средний': 'neuter'
                };
                
                const genderKey = genderMapping[gender] || 'masculine';
                
                if (caseData.singular && 
                    caseData.singular[genderKey] && 
                    caseData.singular[genderKey][caseKey]) {
                  const displayWord = caseData.singular[genderKey][caseKey];
                  console.log(`Found singular case form: ${displayWord} (${genderKey}, ${caseKey})`);
                  return { 
                    ...word, 
                    displayWord: displayWord,
                    caseForm: displayWord
                  };
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading adjective cases:', error);
      }
    }

    // Для существительных с падежами
    if (database === 'nouns' && caseType && caseType !== 'именительный') {
      try {
        const response = await fetch(`${API_BASE_URL}/noun-cases/${word.imageBase}`);
        if (response.ok) {
          const caseData = await response.json();
          
          if (caseData) {
            const caseMapping = {
              'именительный': 'nominative',
              'родительный': 'genitive', 
              'дательный': 'dative',
              'винительный': 'accusative',
              'творительный': 'instrumental',
              'предложный': 'prepositional'
            };
            
            const caseKey = caseMapping[caseType];
            
            // Множественное число
            if (number && (number === 'множественное' || number === 'plural')) {
              if (caseData.plural && caseData.plural[caseKey]) {
                const displayWord = caseData.plural[caseKey];
                console.log(`Found noun plural case form: ${displayWord}`);
                return { 
                  ...word, 
                  displayWord: displayWord,
                  caseForm: displayWord
                };
              }
            } else {
              // Единственное число
              if (caseData.singular && caseData.singular[caseKey]) {
                const displayWord = caseData.singular[caseKey];
                console.log(`Found noun singular case form: ${displayWord}`);
                return { 
                  ...word, 
                  displayWord: displayWord,
                  caseForm: displayWord
                };
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading noun cases:', error);
      }
    }

    // Fallback логика для обычных фильтров (без падежей)
    const langMap = {
      'русский': ['русский', 'russian'],
      'russian': ['russian', 'русский'],
      'английский': ['английский', 'english', 'English'],
      'english': ['english', 'английский', 'Английский'],
      'турецкий': ['турецкий', 'turkish', 'Турецкий'],
      'turkish': ['turkish', 'турецкий', 'Turkish'],
    };
    
    const langKey = (studiedLanguage || 'русский').toLowerCase();
    const langCandidates = (langMap[langKey] || [langKey]).map(l => l.toLowerCase());
    
    const pickFromForms = (suffixes = [], fallbackSuffixes = []) => {
      if (!word.forms) return null;
      
      for (const lang of langCandidates) {
        for (const s of suffixes) {
          const key = (s ? `${lang}_${s}` : lang).toLowerCase();
          if (word.forms[key] && word.forms[key].trim() !== '') {
            return word.forms[key];
          }
        }
        for (const s of fallbackSuffixes) {
          const key = (s ? `${lang}_${s}` : lang).toLowerCase();
          if (word.forms[key] && word.forms[key].trim() !== '') {
            return word.forms[key];
          }
        }
      }
      return null;
    };

    // Для существительных без падежей
    if (database === 'nouns') {
      if (number && (number === 'множественное' || number === 'plural')) {
        const plural = pickFromForms(['plural', 'множественное'], ['word']);
        if (plural) {
          console.log(`Using noun plural: ${plural}`);
          return { ...word, displayWord: plural };
        }
      } else {
        const singular = pickFromForms(['singular', 'единственное', 'word'], ['']);
        if (singular) {
          console.log(`Using noun singular: ${singular}`);
          return { ...word, displayWord: singular };
        }
      }
    }

    // Для прилагательных без падежей
    if (database === 'adjectives') {
      const langConfig = getAdjectiveLanguageConfig(studiedLanguage);
      
      // Если есть фильтр по числу и язык его поддерживает
      if (number && (number === 'множественное' || number === 'plural') && langConfig.hasNumber) {
        const pluralKey = `${studiedLanguage.toLowerCase()}_plural`;
        if (word.forms && word.forms[pluralKey]) {
          console.log(`Using adjective plural: ${word.forms[pluralKey]}`);
          return { ...word, displayWord: word.forms[pluralKey] };
        }
      }
      
      // Если есть фильтр по роду и язык его поддерживает
      if (gender && langConfig.hasGender) {
        const genderMap = {
          'мужской': 'masculine',
          'женский': 'feminine',
          'средний': 'neuter',
          'masculine': 'masculine',
          'feminine': 'feminine',
          'neuter': 'neuter'
        }[gender];
        
        if (genderMap && langConfig.columns.includes(genderMap)) {
          const genderKey = `${studiedLanguage.toLowerCase()}_${genderMap}`;
          if (word.forms && word.forms[genderKey]) {
            console.log(`Using adjective gender form: ${word.forms[genderKey]} (${genderMap})`);
            return { ...word, displayWord: word.forms[genderKey] };
          }
        }
      }
      
      // Для языков с родом возвращаем мужской род по умолчанию
      if (langConfig.hasGender) {
        const masculineKey = `${studiedLanguage.toLowerCase()}_masculine`;
        if (word.forms && word.forms[masculineKey]) {
          console.log(`Using adjective masculine default: ${word.forms[masculineKey]}`);
          return { ...word, displayWord: word.forms[masculineKey] };
        }
      }
    }

    // Fallback на базовый перевод
    const fallback = getStudiedText(word, studiedLanguage);
    console.log(`Using fallback: ${fallback}`);
    return { ...word, displayWord: fallback };
  };

  // Функция для получения отображаемого текста из предлогов/вопросительных слов
 const getDisplayTextForSpecialWords = (word, database) => {
  if (!word) return '';
  
  // Получаем язык из настроек или используем русский по умолчанию
  const lang = studiedLanguage || 'русский';
  
  // Пробуем разные варианты ключей
  const possibleKeys = [
    lang,
    lang.toLowerCase(),
    lang.toUpperCase(),
    'русский',
    'Русский',
    'russian',
    'Russian'
  ];
  
  // Ищем перевод
  for (const key of possibleKeys) {
    if (word[key] && word[key].trim() !== '') {
      return word[key];
    }
  }
  
  // Если не нашли, берем первый непустой перевод
  for (const key in word) {
    if (key !== 'Картинка' && word[key] && word[key].trim() !== '') {
      return word[key];
    }
  }
  
  return '';
};

  // Функция для получения подсказки для специальных слов
  const getHintForSpecialWords = (word, database) => {
    if (database === 'prepositions') {
      // Показываем английский перевод как подсказку
      return word['Английский'] || word['english'] || '';
    } else if (database === 'question-words') {
      return word['Английский'] || word['english'] || '';
    }
    return '';
  };

  const getStudiedText = (word, studiedLanguage = 'русский') => {
    if (!word || !word.translations) return '—';
    const translations = word.translations;
    const preferred = (studiedLanguage || 'русский').toLowerCase();
    const map = {
      'русский': ['русский', 'russian', 'Русский'],
      'russian': ['russian', 'русский', 'Русский'],
      'английский': ['английский', 'english', 'English'],
      'english': ['english', 'английский', 'Английский'],
      'турецкий': ['турецкий', 'turkish', 'Турецкий'],
      'turkish': ['turkish', 'турецкий', 'Turkish'],
      'испанский': ['испанский', 'spanish', 'Испанский'],
      'spanish': ['spanish', 'испанский', 'Spanish'],
      'немецкий': ['немецкий', 'german', 'Немецкий'],
      'german': ['german', 'немецкий', 'German'],
      'французский': ['французский', 'french', 'Французский'],
      'french': ['french', 'французский', 'French'],
      'итальянский': ['итальянский', 'italian', 'Итальянский'],
      'italian': ['italian', 'итальянский', 'Italian'],
      'китайский': ['китайский', 'chinese', 'Китайский'],
      'chinese': ['chinese', 'китайский', 'Chinese'],
      'японский': ['японский', 'japanese', 'Японский'],
      'japanese': ['japanese', 'японский', 'Japanese'],
      'арабский': ['арабский', 'arabic', 'Арабский'],
      'arabic': ['arabic', 'арабский', 'Arabic'],
      'португальский': ['португальский', 'portuguese', 'Португальский'],
      'portuguese': ['portuguese', 'португальский', 'Portuguese'],
      'корейский': ['корейский', 'korean', 'Корейский'],
      'korean': ['korean', 'корейский', 'Korean'],
      'хинди': ['хинди', 'hindi', 'Хинди'],
      'hindi': ['hindi', 'хинди', 'Hindi'],
      'голландский': ['голландский', 'dutch', 'Голландский'],
      'dutch': ['dutch', 'голландский', 'Dutch'],
      'шведский': ['шведский', 'swedish', 'Шведский'],
      'swedish': ['swedish', 'шведский', 'Swedish'],
      'польский': ['польский', 'polish', 'Польский'],
      'polish': ['polish', 'польский', 'Polish'],
      'греческий': ['греческий', 'greek', 'Греческий'],
      'greek': ['greek', 'греческий', 'Greek'],
      'иврит': ['иврит', 'hebrew', 'Иврит'],
      'hebrew': ['hebrew', 'иврит', 'Hebrew'],
      'вьетнамский': ['вьетнамский', 'vietnamese', 'Вьетнамский'],
      'vietnamese': ['vietnamese', 'вьетнамский', 'Vietnamese'],
      'индонезийский': ['индонезийский', 'indonesian', 'Индонезийский'],
      'indonesian': ['indonesian', 'индонезийский', 'Indonesian']
    };
    const keys = map[preferred] || [preferred];
    for (const k of keys) if (translations[k]) return translations[k];
    return Object.values(translations)[0] || '—';
  };

  const getHintText = (word, hintLanguage = 'english') => {
    if (!word || !word.translations) return '—';
    const translations = word.translations;

    // Сначала ищем перевод на язык подсказки
    if (hintLanguage && translations[hintLanguage]) {
      return translations[hintLanguage];
    }

    // Затем ищем английский как fallback
    const hintKeys = ['английский', 'english', 'Английский'];
    for (const key of hintKeys) {
      if (translations[key]) return translations[key];
    }

    // Fallback на любой доступный перевод
    return Object.values(translations)[1] || Object.values(translations)[0] || '—';
  };

  // Обработчик выбора слова
  const handleWordClick = async (word) => {
    let chosen;
    
    // ПРИМЕНЯЕМ ФИЛЬТРЫ ПРИ ВЫБОРЕ СЛОВА
    const filteredWord = await applyFiltersToWord(word, database, memoizedFilters, studiedLanguage);
    
    if (database === 'prepositions' || database === 'question-words') {
      // ДОБАВЬТЕ ОТЛАДКУ
      console.log('Special word selected:', word);
      
      // Преобразуем структуру специальных слов в правильный формат
      const translations = {};
      Object.keys(word).forEach(key => {
        if (key !== 'Картинка' && word[key] && word[key].trim() !== '') {
          // Приводим ключи к нижнему регистру для consistency
          const langKey = key.toLowerCase();
          translations[langKey] = word[key];
        }
      });
      
      console.log('Processed translations:', translations);
      
      chosen = {
        id: `special_${Date.now()}_${Math.random()}`,
        imageBase: '',
        imagePng: '',
        translations: translations, // ← ИСПРАВЛЕНО: используем преобразованные translations
        displayWord: getDisplayTextForSpecialWords(word, database),
        word: getDisplayTextForSpecialWords(word, database),
        isSpecialWord: true,
        database: database
      };
    } else {
      // ДОБАВЬТЕ ОТЛАДКУ ДЛЯ ОБЫЧНЫХ СЛОВ
      console.log('Regular word selected:', {
        word: filteredWord,
        translations: filteredWord.translations,
        displayWord: filteredWord.displayWord
      });
      
      chosen = {
        ...filteredWord,
        displayWord: filteredWord.displayWord || getStudiedText(filteredWord, studiedLanguage)
      };
    }
    
    console.log('Final chosen word:', chosen);
    onWordSelect && onWordSelect(chosen);
  };

  // Рендеринг для предлогов
  const renderPrepositionsList = () => {
  return (
    <div className="space-y-2 max-h-40 overflow-y-auto">
      {prepositions.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          Предлоги не найдены
        </div>
      ) : (
        prepositions.map((preposition, index) => {
          const displayWord = getDisplayTextForSpecialWords(preposition, 'prepositions');
          
          // ПРАВИЛЬНАЯ ПРОВЕРКА ВЫБРАННОГО СЛОВА
          const isSelected = (() => {
            // Ищем в selectedWords (переданные из родителя)
            if (selectedWords && selectedWords.length > 0) {
              return selectedWords.some(sw => {
                // Проверяем разными способами
                const swDisplayWord = sw.displayWord || sw.word;
                return swDisplayWord === displayWord;
              });
            }
            
            // Или проверяем через selectedWord (одиночный выбор)
            if (selectedWord) {
              return selectedWord.displayWord === displayWord || 
                     selectedWord.word === displayWord;
            }
            
            return false;
          })();
          
          return (
            <div
              key={`preposition_${index}`}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleWordClick(preposition)}
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
                  {displayWord}
                </div>
                {getHintForSpecialWords(preposition, 'prepositions') && (
                  <div className="text-sm text-gray-500 truncate">
                    {getHintForSpecialWords(preposition, 'prepositions')}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
  // Рендеринг для вопросительных слов
  const renderQuestionWordsList = () => {
  return (
    <div className="space-y-2 max-h-40 overflow-y-auto">
      {questionWords.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          Вопросительные слова не найдены
        </div>
      ) : (
        questionWords.map((questionWord, index) => {
          const displayWord = getDisplayTextForSpecialWords(questionWord, 'question-words');
          
          // Проверяем, выбран ли это слово
          const isSelected = (() => {
            if (selectedWords && selectedWords.length > 0) {
              return selectedWords.some(sw => {
                const swDisplayWord = sw.displayWord || sw.word;
                return swDisplayWord === displayWord;
              });
            }
            
            if (selectedWord) {
              return selectedWord.displayWord === displayWord || 
                     selectedWord.word === displayWord;
            }
            
            return false;
          })();
          
          return (
            <div
              key={`question_word_${index}`}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleWordClick(questionWord)}
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
                  {displayWord}
                </div>
                {getHintForSpecialWords(questionWord, 'question-words') && (
                  <div className="text-sm text-gray-500 truncate">
                    {getHintForSpecialWords(questionWord, 'question-words')}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

  // Рендеринг для обычных слов (существительные, прилагательные)
 const renderRegularWordsList = () => {
  return (
    <div className="space-y-2 max-h-40 overflow-y-auto">
      {availableWords.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          {theme ? 'Слова не найдены для выбранной темы и фильтров' : 'Выберите урок для отображения слов'}
        </div>
      ) : (
        availableWords.map((word, index) => {
          const wordId = word.imageBase || word.id;
          const displayWord = word.displayWord || getStudiedText(word);
          
          // Проверяем, выбран ли это слово
          const isSelected = (() => {
            if (selectedWords && selectedWords.length > 0) {
              return selectedWords.some(sw => {
                const swId = sw.imageBase || sw.id;
                return swId === wordId;
              });
            }
            
            if (selectedWord) {
              return (selectedWord.imageBase || selectedWord.id) === wordId;
            }
            
            return false;
          })();
          
          return (
            <div
              key={wordId}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleWordClick(word)}
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
                  {displayWord}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {getHintText(word)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  ID: {word.imageBase} | Форма: {word.displayWord ? 'фильтрованная' : 'базовая'}
                </div>
              </div>
          
              {word.imagePng && (
                <div className="w-10 h-10 flex-shrink-0">
                  <img
                    src={word.imagePng}
                    alt={displayWord}
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

  // Основной рендер компонента
  if (database === 'prepositions') {
    return renderPrepositionsList();
  } else if (database === 'question-words') {
    return renderQuestionWordsList();
  } else {
    return renderRegularWordsList();
  }
};


// Конфигурации языков для существительных
const baseLanguages = {
    russian: {
        number: 'База существительные номер Русский',
        word: 'База существительные слова Русский',
        plural: 'База существительные множественное Русский'
    },
    english: {
        number: 'База существительные номер Английский',
        word: 'База существительные слова Английский',
        plural: 'База существительные множественное Английский'
    },
    turkish: {
        number: 'База существительные номер Турецкий',
        word: 'База существительные слова Турецкий',
        plural: 'База существительные множественное Турецкий'
    }
};
const additionalLanguages = {
    spanish: {
        number: 'База существительные номер Испанский',
        word: 'База существительные слова Испанский',
        plural: 'База существительные множественное Испанский'
    },
    german: {
        number: 'База существительные номер Немецкий',
        word: 'База существительные слова Немецкий',
        plural: 'База существительные множественное Немецкий'
    },
    french: {
        number: 'База существительные номер Французский',
        word: 'База существительные слова Французский',
        plural: 'База существительные множественное Французский'
    },
    italian: {
        number: 'База существительные номер Итальянский',
        word: 'База существительные слова Итальянский',
        plural: 'База существительные множественное Итальянский'
    },
    chinese: {
        number: 'База существительные номер Китайский',
        word: 'База существительные слова Китайский',
        plural: 'База существительные множественное Китайский'
    },
    japanese: {
        number: 'База существительные номер Японский',
        word: 'База существительные слова Японский',
        plural: 'База существительные множественное Японский'
    },
    arabic: {
        number: 'База существительные номер Арабский',
        word: 'База существительные слова Арабский',
        plural: 'База существительные множественное Арабский'
    },
    portuguese: {
        number: 'База существительные номер Португальский',
        word: 'База существительные слова Португальский',
        plural: 'База существительные множественное Португальский'
    },
    korean: {
        number: 'База существительные номер Корейский',
        word: 'База существительные слова Корейский',
        plural: 'База существительные множественное Корейский'
    },
    hindi: {
        number: 'База существительные номер Хинди',
        word: 'База существительные слова Хинди',
        plural: 'База существительные множественное Хинди'
    },
    dutch: {
        number: 'База существительные номер Голландский',
        word: 'База существительные слова Голландский',
        plural: 'База существительные множественное Голландский'
    },
    swedish: {
        number: 'База существительные номер Шведский',
        word: 'База существительные слова Шведский',
        plural: 'База существительные множественное Шведский'
    },
    polish: {
        number: 'База существительные номер Польский',
        word: 'База существительные слова Польский',
        plural: 'База существительные множественное Польский'
    },
    greek: {
        number: 'База существительные номер Греческий',
        word: 'База существительные слова Греческий',
        plural: 'База существительные множественное Греческий'
    },
    hebrew: {
        number: 'База существительные номер Иврит',
        word: 'База существительные слова Иврит',
        plural: 'База существительные множественное Иврит'
    },
    vietnamese: {
        number: 'База существительные номер Вьетнамский',
        word: 'База существительные слова Вьетнамский',
        plural: 'База существительные множественное Вьетнамский'
    },
    indonesian: {
        number: 'База существительные номер Индонезийский',
        word: 'База существительные слова Индонезийский',
        plural: 'База существительные множественное Индонезийский'
    }
};
// Конфигурации языков для прилагательных
const adjectivesBaseLanguages = {
    russian: {
        number: 'База прилагательные номер Русский',
        word: 'База прилагательные слова Русский',
        masculine: 'База прилагательные мужской род Русский',
        feminine: 'База прилагательные женский род Русский',
        neuter: 'База прилагательные средний род Русский',
        plural: 'База прилагательные множественное число Русский'
    },
    english: {
        number: 'База прилагательные номер Английский',
        word: 'База прилагательные слова Английский',
        masculine: 'База прилагательные мужской род Английский',
        feminine: 'База прилагательные женский род Английский',
        neuter: 'База прилагательные средний род Английский',
        plural: 'База прилагательные множественное число Английский'
    },
    turkish: {
        number: 'База прилагательные номер Турецкий',
        word: 'База прилагательные слова Турецкий',
        masculine: 'База прилагательные мужской род Турецкий',
        feminine: 'База прилагательные женский род Турецкий',
        neuter: 'База прилагательные средний род Турецкий',
        plural: 'База прилагательные множественное число Турецкий'
    }
};
const adjectivesAdditionalLanguages = {
    spanish: {
        number: 'База прилагательные номер Испанский',
        word: 'База прилагательные слова Испанский',
        masculine: 'База прилагательные мужской род Испанский',
        feminine: 'База прилагательные женский род Испанский',
        neuter: 'База прилагательные средний род Испанский',
        plural: 'База прилагательные множественное число Испанский'
    },
    german: {
        number: 'База прилагательные номер Немецкий',
        word: 'База прилагательные слова Немецкий',
        masculine: 'База прилагательные мужской род Немецкий',
        feminine: 'База прилагательные женский род Немецкий',
        neuter: 'База прилагательные средний род Немецкий',
        plural: 'База прилагательные множественное число Немецкий'
    },
    french: {
        number: 'База прилагательные номер Французский',
        word: 'База прилагательные слова Французский',
        masculine: 'База прилагательные мужской род Французский',
        feminine: 'База прилагательные женский род Французский',
        neuter: 'База прилагательные средний род Французский',
        plural: 'База прилагательные множественное число Французский'
    },
    italian: {
        number: 'База прилагательные номер Итальянский',
        word: 'База прилагательные слова Итальянский',
        masculine: 'База прилагательные мужской род Итальянский',
        feminine: 'База прилагательные женский род Итальянский',
        neuter: 'База прилагательные средний род Итальянский',
        plural: 'База прилагательные множественное число Итальянский'
    },
    chinese: {
        number: 'База прилагательные номер Китайский',
        word: 'База прилагательные слова Китайский',
        masculine: 'База прилагательные мужской род Китайский',
        feminine: 'База прилагательные женский род Китайский',
        neuter: 'База прилагательные средний род Китайский',
        plural: 'База прилагательные множественное число Китайский'
    },
    japanese: {
        number: 'База прилагательные номер Японский',
        word: 'База прилагательные слова Японский',
        masculine: 'База прилагательные мужской род Японский',
        feminine: 'База прилагательные женский род Японский',
        neuter: 'База прилагательные средний род Японский',
        plural: 'База прилагательные множественное число Японский'
    },
    arabic: {
        number: 'База прилагательные номер Арабский',
        word: 'База прилагательные слова Арабский',
        masculine: 'База прилагательные мужской род Арабский',
        feminine: 'База прилагательные женский род Арабский',
        neuter: 'База прилагательные средний род Арабский',
        plural: 'База прилагательные множественное число Арабский'
    },
    portuguese: {
        number: 'База прилагательные номер Португальский',
        word: 'База прилагательные слова Португальский',
        masculine: 'База прилагательные мужской род Португальский',
        feminine: 'База прилагательные женский род Португальский',
        neuter: 'База прилагательные средний род Португальский',
        plural: 'База прилагательные множественное число Португальский'
    },
    korean: {
        number: 'База прилагательные номер Корейский',
        word: 'База прилагательные слова Корейский',
        masculine: 'База прилагательные мужской род Корейский',
        feminine: 'База прилагательные женский род Корейский',
        neuter: 'База прилагательные средний род Корейский',
        plural: 'База прилагательные множественное число Корейский'
    },
    hindi: {
        number: 'База прилагательные номер Хинди',
        word: 'База прилагательные слова Хинди',
        masculine: 'База прилагательные мужской род Хинди',
        feminine: 'База прилагательные женский род Хинди',
        neuter: 'База прилагательные средний род Хинди',
        plural: 'База прилагательные множественное число Хинди'
    },
    dutch: {
        number: 'База прилагательные номер Голландский',
        word: 'База прилагательные слова Голландский',
        masculine: 'База прилагательные мужской род Голландский',
        feminine: 'База прилагательные женский род Голландский',
        neuter: 'База прилагательные средний род Голландский',
        plural: 'База прилагательные множественное число Голландский'
    },
    swedish: {
        number: 'База прилагательные номер Шведский',
        word: 'База прилагательные слова Шведский',
        masculine: 'База прилагательные мужской род Шведский',
        feminine: 'База прилагательные женский род Шведский',
        neuter: 'База прилагательные средний род Шведский',
        plural: 'База прилагательные множественное число Шведский'
    },
    polish: {
        number: 'База прилагательные номер Польский',
        word: 'База прилагательные слова Польский',
        masculine: 'База прилагательные мужской род Польский',
        feminine: 'База прилагательные женский род Польский',
        neuter: 'База прилагательные средний род Польский',
        plural: 'База прилагательные множественное число Польский'
    },
    greek: {
        number: 'База прилагательные номер Греческий',
        word: 'База прилагательные слова Греческий',
        masculine: 'База прилагательные мужской род Греческий',
        feminine: 'База прилагательные женский род Греческий',
        neuter: 'База прилагательные средний род Греческий',
        plural: 'База прилагательные множественное число Греческий'
    },
    hebrew: {
        number: 'База прилагательные номер Иврит',
        word: 'База прилагательные слова Иврит',
        masculine: 'База прилагательные мужской род Иврит',
        feminine: 'База прилагательные женский род Иврит',
        neuter: 'База прилагательные средний род Иврит',
        plural: 'База прилагательные множественное число Иврит'
    },
    vietnamese: {
        number: 'База прилагательные номер Вьетнамский',
        word: 'База прилагательные слова Вьетнамский',
        masculine: 'База прилагательные мужской род Вьетнамский',
        feminine: 'База прилагательные женский род Вьетнамский',
        neuter: 'База прилагательные средний род Вьетнамский',
        plural: 'База прилагательные множественное число Вьетнамский'
    },
    indonesian: {
        number: 'База прилагательные номер Индонезийский',
        word: 'База прилагательные слова Индонезийский',
        masculine: 'База прилагательные мужской род Индонезийский',
        feminine: 'База прилагательные женский род Индонезийский',
        neuter: 'База прилагательные средний род Индонезийский',
        plural: 'База прилагательные множественное число Индонезийский'
    }
};
const allLanguages = { ...baseLanguages, ...additionalLanguages };
const adjectivesAllLanguages = { ...adjectivesBaseLanguages, ...adjectivesAdditionalLanguages };
const baseColumns = [
    'Уровень изучения номер',
    'Урок номер',
    'Урок название',
    'База изображение',
    'Картинка png'
];
const adjectivesBaseColumns = [
    'Уровень изучения номер',
    'Урок номер',
    'Урок название',
    'База изображение',
    'Картинка png'
];
const adjectivesLanguageConfig = {
  // Русский язык - полная поддержка родов, чисел и падежей
  'russian': {
    hasGender: true,
    hasNumber: true,
    hasCases: true,
    columns: ['masculine', 'feminine', 'neuter', 'plural']
  },
  // Французский - род и число, но нет падежей
  'french': {
    hasGender: true,
    hasNumber: true,
    hasCases: false,
    columns: ['masculine', 'feminine', 'plural']
  },
  // Немецкий - род, число и падежи
  'german': {
    hasGender: true,
    hasNumber: true,
    hasCases: true,
    columns: ['masculine', 'feminine', 'neuter', 'plural']
  },
  // Испанский - род и число, но нет падежей
  'spanish': {
    hasGender: true,
    hasNumber: true,
    hasCases: false,
    columns: ['masculine', 'feminine', 'plural']
  },
  // Итальянский - род и число, но нет падежей
  'italian': {
    hasGender: true,
    hasNumber: true,
    hasCases: false,
    columns: ['masculine', 'feminine', 'plural']
  },
  // Арабский - род и число, но нет падежей
  'arabic': {
    hasGender: true,
    hasNumber: true,
    hasCases: false,
    columns: ['masculine', 'feminine']
  },
  // Остальные языки - только базовое прилагательное
  'english': {
    hasGender: false,
    hasNumber: false,
    hasCases: false,
    columns: ['word']
  },
  'turkish': {
    hasGender: false,
    hasNumber: false,
    hasCases: false,
    columns: ['word']
  },
  'chinese': {
    hasGender: false,
    hasNumber: false,
    hasCases: false,
    columns: ['word']
  },
  'japanese': {
    hasGender: false,
    hasNumber: false,
    hasCases: false,
    columns: ['word']
  },
  'korean': {
    hasGender: false,
    hasNumber: false,
    hasCases: false,
    columns: ['word']
  }
};
// Функция для получения конфигурации языка
// Функция для получения конфигурации языка
const getAdjectiveLanguageConfig = (language) => {
  // Приводим к нижнему регистру и убираем пробелы
  const langKey = language.toLowerCase().trim();
  
  // Маппинг русских названий на ключи
  const languageMap = {
    'русский': 'russian',
    'russian': 'russian',
    'английский': 'english',
    'english': 'english',
    'турецкий': 'turkish',
    'turkish': 'turkish',
    'испанский': 'spanish',
    'spanish': 'spanish',
    'немецкий': 'german',
    'german': 'german',
    'французский': 'french',
    'french': 'french',
    'итальянский': 'italian',
    'italian': 'italian',
    'китайский': 'chinese',
    'chinese': 'chinese',
    'японский': 'japanese',
    'japanese': 'japanese',
    'арабский': 'arabic',
    'arabic': 'arabic'
  };
  
  const mappedKey = languageMap[langKey] || langKey;
  
  return adjectivesLanguageConfig[mappedKey] || {
    hasGender: false,
    hasNumber: false,
    hasCases: false,
    columns: ['word']
  };
};

const CaseManagementModal = ({ isOpen, onClose, word, onSave }) => {
  const [cases, setCases] = useState({
    singular: {
      nominative: '',
      genitive: '',
      dative: '',
      accusative: '',
      instrumental: '',
      prepositional: ''
    },
    plural: {
      nominative: '',
      genitive: '',
      dative: '',
      accusative: '',
      instrumental: '',
      prepositional: ''
    }
  });

  useEffect(() => {
    if (word) {
      loadCases();
    }
  }, [word]);

  const loadCases = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/noun-cases/${word.imageBase}`);
      const data = await response.json();
      if (data.singular || data.plural) {
        setCases({
          singular: data.singular || {},
          plural: data.plural || {}
        });
      }
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const handleSave = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/noun-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase: word.imageBase,
        singular: cases.singular,
        plural: cases.plural
      })
    });
    
    if (response.ok) {
      const savedData = await response.json();
      console.log('Noun cases saved successfully:', savedData);
      
      // Вызываем callback с обновленными данными
      if (onSave) {
        onSave(savedData);
      }
      
      // Показываем уведомление
      alert('Падежи существительного успешно сохранены!');
      
      onClose();
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to save cases');
    }
  } catch (error) {
    console.error('Error saving cases:', error);
    alert('Ошибка сохранения падежей: ' + error.message);
  }
};

  const handleCaseChange = (number, caseType, value) => {
    setCases(prev => ({
      ...prev,
      [number]: {
        ...prev[number],
        [caseType]: value
      }
    }));
  };

  if (!isOpen) return null;

  const caseTypes = [
    { key: 'nominative', label: 'Именительный' },
    { key: 'genitive', label: 'Родительный' },
    { key: 'dative', label: 'Дательный' },
    { key: 'accusative', label: 'Винительный' },
    { key: 'instrumental', label: 'Творительный' },
    { key: 'prepositional', label: 'Предложный' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          Склонения для: <span className="text-blue-600">{word?.translations?.russian || word?.word}</span>
        </h3>
        
        {/* Таблица падежей */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th colSpan="6" className="border border-gray-300 p-2 text-center font-semibold">
                  Единственное число
                </th>
                <th colSpan="6" className="border border-gray-300 p-2 text-center font-semibold">
                  Множественное число
                </th>
              </tr>
              <tr className="bg-gray-50">
                {/* Единственное число - заголовки падежей */}
                {caseTypes.map((caseType, index) => (
                  <th key={`singular-${caseType.key}`} className="border border-gray-300 p-2 text-sm font-medium">
                    {caseType.label}
                  </th>
                ))}
                {/* Множественное число - заголовки падежей */}
                {caseTypes.map((caseType, index) => (
                  <th key={`plural-${caseType.key}`} className="border border-gray-300 p-2 text-sm font-medium">
                    {caseType.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {/* Единственное число - поля ввода */}
                {caseTypes.map((caseType) => (
                  <td key={`singular-input-${caseType.key}`} className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={cases.singular[caseType.key] || ''}
                      onChange={(e) => handleCaseChange('singular', caseType.key, e.target.value)}
                      className="w-full p-2 border-none focus:outline-none focus:bg-blue-50"
                      placeholder={`${caseType.label} ед.ч.`}
                    />
                  </td>
                ))}
                {/* Множественное число - поля ввода */}
                {caseTypes.map((caseType) => (
                  <td key={`plural-input-${caseType.key}`} className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={cases.plural[caseType.key] || ''}
                      onChange={(e) => handleCaseChange('plural', caseType.key, e.target.value)}
                      className="w-full p-2 border-none focus:outline-none focus:bg-blue-50"
                      placeholder={`${caseType.label} мн.ч.`}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Подсказка */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-semibold text-yellow-800 mb-1">Подсказки по падежам:</h4>
          <div className="text-sm text-yellow-700 grid grid-cols-2 gap-2">
            <div><strong>Именительный:</strong> кто? что? (есть)</div>
            <div><strong>Родительный:</strong> кого? чего? (нет)</div>
            <div><strong>Дательный:</strong> кому? чему? (дать)</div>
            <div><strong>Винительный:</strong> кого? что? (вижу)</div>
            <div><strong>Творительный:</strong> кем? чем? (горжусь)</div>
            <div><strong>Предложный:</strong> о ком? о чём? (думаю)</div>
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Отмена
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Сохранить падежи
          </button>
        </div>
      </div>
    </div>
  );
};

// QuestionColumn.jsx (обновленная версия)
// В QuestionColumn.jsx обновите компонент
const QuestionColumn = ({ 
  config, 
  columnIndex, 
  structure, 
  onStructureChange, 
  lessonData, 
  isAnswer = false,
  getAvailableThemes 
}) => {
  const columnData = structure[columnIndex] || {
    lesson: '',
    number: '',
    gender: '',
    case: '',
    word: '',
    wordData: null
  };

  const updateColumnData = (updates) => {
    const updatedStructure = [...structure];
    updatedStructure[columnIndex] = { ...columnData, ...updates };
    onStructureChange(updatedStructure);
  };

  const showFilters = !['prepositions', 'question-words'].includes(config.database);

  return (
    <div className="space-y-3">
      {/* Выбор урока */}
      {config.database !== 'prepositions' && config.database !== 'question-words' && (
        <div>
          <label className="block text-sm font-medium mb-1">Выбрать урок</label>
          <select
            value={columnData.lesson}
            onChange={(e) => updateColumnData({ lesson: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Выберите урок</option>
            {getAvailableThemes().map(theme => (
              <option key={theme} value={theme}>{theme}</option>
            ))}
          </select>
        </div>
      )}

      {/* ФИЛЬТРЫ С ПАДЕЖАМИ */}
      {showFilters && (
        <div className="grid grid-cols-2 gap-2">
          {/* Число */}
          {(config.database === 'nouns' || config.database === 'adjectives') && (
            <div>
              <label className="block text-sm font-medium mb-1">Число</label>
              <select
                value={columnData.number}
                onChange={(e) => updateColumnData({ number: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Любое</option>
                <option value="единственное">Единственное</option>
                <option value="множественное">Множественное</option>
              </select>
            </div>
          )}

          {/* Род для прилагательных */}
          {config.database === 'adjectives' && (
            <div>
              <label className="block text-sm font-medium mb-1">Род</label>
              <select
                value={columnData.gender}
                onChange={(e) => updateColumnData({ gender: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Любой</option>
                <option value="мужской">Мужской</option>
                <option value="женский">Женский</option>
                <option value="средний">Средний</option>
              </select>
            </div>
          )}

          {/* ПАДЕЖ ДЛЯ СУЩЕСТВИТЕЛЬНЫХ И ПРИЛАГАТЕЛЬНЫХ */}
          {(config.database === 'nouns' || config.database === 'adjectives') && (
            <div>
              <label className="block text-sm font-medium mb-1">Падеж</label>
              <select
                value={columnData.case}
                onChange={(e) => updateColumnData({ case: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Любой</option>
                <option value="именительный">Именительный</option>
                <option value="родительный">Родительный</option>
                <option value="дательный">Дательный</option>
                <option value="винительный">Винительный</option>
                <option value="творительный">Творительный</option>
                <option value="предложный">Предложный</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Выбор слова с учетом фильтров */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {config.database === 'prepositions' ? 'Выбрать предлог' : 
           config.database === 'question-words' ? 'Выбрать вопросительное слово' : 
           'Выбрать слово'}
        </label>
        
      <WordSelector
  studiedLanguage={lessonData?.studiedLanguage || 'русский'}
  theme={columnData.lesson || ''}
  database={config.database}
  filters={{
    number: columnData.number,
    gender: columnData.gender,
    case: columnData.case
  }}
  onWordSelect={(selectedWord) => {
    updateColumnData({
      word: selectedWord.displayWord || selectedWord.word,
      wordData: selectedWord
    });
  }}
  selectedWord={columnData.wordData}
  // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ - передаем выбранные слова для всех колонок
  selectedWords={columnData.wordData ? [columnData.wordData] : []}
/>
        
        {/* Индикатор выбранного слова */}
        {columnData.word && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-green-800">
                  Выбрано: {columnData.word}
                </span>
                {columnData.wordData?.imagePng && (
                  <div className="mt-1">
                    <img
                      src={columnData.wordData.imagePng}
                      alt="Preview"
                      className="h-8 w-8 object-cover rounded"
                    />
                  </div>
                )}
                {/* Отображение примененных фильтров */}
                {(columnData.number || columnData.gender || columnData.case) && (
                  <div className="text-xs text-gray-500 mt-1">
                    Фильтры: 
                    {columnData.number && ` Число: ${columnData.number}`}
                    {columnData.gender && ` Род: ${columnData.gender}`}
                    {columnData.case && ` Падеж: ${columnData.case}`}
                  </div>
                )}
              </div>
              <button
                onClick={() => updateColumnData({
                  word: '',
                  wordData: null
                })}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default function AdminPage() {
const [showAdjectiveCaseModal, setShowAdjectiveCaseModal] = useState(false);

const [uploadingImageType, setUploadingImageType] = useState(null); 
const [selectedAdjective, setSelectedAdjective] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');
  const [lessonData, setLessonData] = useState(null);
    // Table data states
    const [activeTable, setActiveTable] = useState('nouns');
    const [tableData, setTableData] = useState([]);
    const [adjectivesTableData, setAdjectivesTableData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCell, setEditingCell] = useState(null);

const [questionWordsData, setQuestionWordsData] = useState([]); // ← ДОБАВЬ ЭТО
const [prepositionsTableData, setPrepositionsTableData] = useState([]);

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
    const [showCaseModal, setShowCaseModal] = useState(false);
const [selectedWord, setSelectedWord] = useState(null);
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
   const [newQuestionModule, setNewQuestionModule] = useState({
  typeId: 4,
  title: '',
  questionColumnsCount: 3,
  answerColumnsCount: 3,
  requiresPairAnswer: true, // ← ЭТОТ ПРИЗНАК
  questionColumnConfigs: [
    { database: 'question-words', filters: {} },
    { database: 'nouns', filters: {} },
    { database: 'adjectives', filters: {} }
  ],
  answerColumnConfigs: [
    { database: 'nouns', filters: {} },
    { database: 'prepositions', filters: {} },
    { database: 'nouns', filters: {} }
  ]
});

const [newQuestion, setNewQuestion] = useState({
  questionStructure: [],
  answerStructure: [],
  questionImage: '',
  answerImage: '',
  hint: '',
  requiresPairAnswer: true,
  englishQuestion: '',
  englishAnswer: ''
});
const [newPodcast, setNewPodcast] = useState({
  title: '',
  audioFile: null,
  audioPreview: null,
  originalTranscript: '',
  hintTranscript: '',
  hint: '',
  duration: 0
});
const [newTestModule, setNewTestModule] = useState({
  database: 'nouns',
  wordCount: 8,
  theme: '',
  selectedWords: []
});

const [showPodcastModal, setShowPodcastModal] = useState(false);
const [modulePodcasts, setModulePodcasts] = useState([]);

const [moduleQuestions, setModuleQuestions] = useState([]);
const [showQuestionModal, setShowQuestionModal] = useState(false);
  
    // Form states
    const [newLanguage, setNewLanguage] = useState('');
const [newLesson, setNewLesson] = useState({
  studiedLanguage: 'русский',
  hintLanguage: 'турецкий',
  level: 'A1',
  theme: '',
  lessonType: 1,
  lessonNumber: '',
  fontColor: '#000000',
  bgColor: '#ffffff',
  columnsCount: 2,
  columnConfigs: [{ database: 'nouns', filters: {} }, { database: 'nouns', filters: {} }],
  checkDatabase: 'nouns' // Добавляем это поле
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
    // НОВЫЕ СОСТОЯНИЯ ДЛЯ МОДУЛЕЙ
    const [lessonTypes, setLessonTypes] = useState([]);
    const [showCreateModuleModal, setShowCreateModuleModal] = useState(false);
    const [showSentenceModal, setShowSentenceModal] = useState(false);
    const [currentLessonForModule, setCurrentLessonForModule] = useState(null);
    const [lessonModules, setLessonModules] = useState([]);
    const [moduleSentences, setModuleSentences] = useState([]);
    const [editingSentence, setEditingSentence] = useState(null);
 useEffect(() => {
  if (newLesson.theme && newLesson.studiedLanguage && newLesson.hintLanguage) {
    const check = checkTranslationsForTheme(
      newLesson.theme,
      newLesson.studiedLanguage.charAt(0).toUpperCase() + newLesson.studiedLanguage.slice(1),
      newLesson.hintLanguage.charAt(0).toUpperCase() + newLesson.hintLanguage.slice(1),
      newLesson.checkDatabase || activeTable
    );
    setTranslationCheck(check);
  } else {
    setTranslationCheck({ isValid: true, missingWords: [], message: '' });
  }
}, [newLesson.theme, newLesson.studiedLanguage, newLesson.hintLanguage, newLesson.checkDatabase, activeTable]);
    // Состояния для создания модуля
    const [newModule, setNewModule] = useState({
        typeId: 1,
        title: '',
        columnsCount: 2,
        columnConfigs: [{database: 'nouns', filters: {}}, {database: 'adjectives', filters: {}}]
    });
    // Состояния для создания предложения
    const [newSentence, setNewSentence] = useState({
        columnData: [],
        image: ''
    });
    // Предыдущие настройки для колонок
    const [previousColumnSettings, setPreviousColumnSettings] = useState([]);
    // Загрузка типов уроков
    useEffect(() => {
        if (isAuthenticated) {
            loadLessonTypes();
        }
    }, [isAuthenticated]);
 const loadModuleSentences = async (moduleId) => {
  try {
    console.log('Loading sentences for module:', moduleId);
    const response = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/sentences`);
    if (response.ok) {
      const sentences = await response.json();
      console.log('Loaded sentences:', sentences);
      setModuleSentences(sentences);
    } else {
      console.error('Failed to load sentences');
      setModuleSentences([]);
    }
  } catch (error) {
    console.error('Error loading module sentences:', error);
    setModuleSentences([]);
  }
};
const [autoTranslations, setAutoTranslations] = useState({
  question: '',
  answer: ''
});
const openPodcastModal = async (module) => {
  console.log('Opening podcast modal for module:', module);
  
  setCurrentLessonForModule(module);
  setModulePodcasts([]);
  
  // Загружаем урок для получения языка
  try {
    const lessonResponse = await fetch(`${API_BASE_URL}/lessons/${module.lessonId}`);
    const lesson = await lessonResponse.json();
    setLessonData(lesson);
  } catch (error) {
    console.error('Error loading lesson for module:', error);
    setLessonData(null);
  }

  // Сбрасываем форму
  setNewPodcast({
    title: '',
    audioFile: null,
    audioPreview: null,
    originalTranscript: '',
    hintTranscript: '',
    hint: '',
    duration: 0
  });
  
  setShowPodcastModal(true);
  
  // Загружаем существующие подкасты модуля
  await loadModulePodcasts(module._id);
};

const loadModulePodcasts = async (moduleId) => {
  try {
    console.log('Loading podcasts for module:', moduleId);
    const response = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/podcasts`);
    if (response.ok) {
      const podcasts = await response.json();
      console.log('Loaded podcasts:', podcasts);
      setModulePodcasts(podcasts);
    } else {
      console.error('Failed to load podcasts');
      setModulePodcasts([]);
    }
  } catch (error) {
    console.error('Error loading module podcasts:', error);
    setModulePodcasts([]);
  }
};
const addPodcast = async () => {
  try {
    // Проверка обязательных полей
    if (!newPodcast.title.trim()) {
      alert('Введите название подкаста');
      return;
    }

    if (!newPodcast.audioFile) {
      alert('Выберите аудио файл');
      return;
    }

    if (!newPodcast.originalTranscript.trim()) {
      alert('Введите титры на оригинальном языке');
      return;
    }

    // Создаем FormData для отправки файла
    const formData = new FormData();
    formData.append('moduleId', currentLessonForModule._id);
    formData.append('title', newPodcast.title);
    formData.append('originalTranscript', newPodcast.originalTranscript);
    formData.append('hintTranscript', newPodcast.hintTranscript || '');
    formData.append('hint', newPodcast.hint || '');
    formData.append('duration', newPodcast.duration || 0);
    formData.append('audioFile', newPodcast.audioFile);

    const response = await fetch(`${API_BASE_URL}/podcasts`, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const savedPodcast = await response.json();
      console.log('Podcast saved successfully:', savedPodcast);
      
      await loadModulePodcasts(currentLessonForModule._id);
      alert('Подкаст добавлен успешно!');
      
      // Сбрасываем форму
      setNewPodcast({
        title: '',
        audioFile: null,
        audioPreview: null,
        originalTranscript: '',
        hintTranscript: '',
        hint: '',
        duration: 0
      });
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to save podcast');
    }
  } catch (error) {
    console.error('Error saving podcast:', error);
    alert('Ошибка сохранения подкаста: ' + error.message);
  }
};
const deletePodcast = async (podcastId) => {
  if (!confirm('Удалить подкаст?')) return;
  try {
    await fetch(`${API_BASE_URL}/podcasts/${podcastId}`, { method: 'DELETE' });
    await loadModulePodcasts(currentLessonForModule._id);
    alert('Подкаст удален!');
  } catch (error) {
    alert('Ошибка удаления: ' + error.message);
  }
};
// Функция для автоматического перевода структуры
// Улучшенная функция перевода с учетом порядка слов
// Улучшенная функция перевода с учетом языка подсказки
// Улучшенная функция перевода с учетом языка подсказки
// Улучшенная функция перевода с фильтрацией URL
// Улучшенная функция перевода с автоматическим добавлением вопросительного знака
// Улучшенная функция перевода с разделением вопроса и ответа
const generateAutoTranslation = (structure, targetLanguage, isQuestion = true) => {
  if (!structure || !Array.isArray(structure)) return '';
  
  const words = structure
    .map((item, index) => {
      // Пропускаем URL картинок
      if (!item.word || 
          item.word.startsWith('http') || 
          item.word.includes('i.ibb.co') ||
          item.word.includes('.jpg') ||
          item.word.includes('.png') ||
          item.word.includes('.jpeg')) {
        return null;
      }
      
      let translatedWord = '';
      
      // Для специальных слов (предлоги, вопросительные слова)
      if (item.wordData?.isSpecialWord) {
        const translations = item.wordData.translations || {};
        translatedWord = translations[targetLanguage] || 
                        Object.values(translations)[0] || 
                        item.word || '';
      } 
      // Для обычных слов
      else if (item.wordData?.translations) {
        const translations = item.wordData.translations;
        translatedWord = translations[targetLanguage] || 
                        Object.values(translations)[0] || 
                        item.word || '';
      } else {
        translatedWord = item.word || '';
      }
      
      return {
        word: translatedWord,
        isFirstWord: index === 0
      };
    })
    .filter(item => item && item.word.trim() !== '');

  // Собираем текст с нормализацией
  let normalizedText = '';
  
  if (isQuestion) {
    // Для вопросов: первое слово с заглавной, остальные строчные
    normalizedText = words.map((item, index) => {
      if (index === 0) {
        return item.word.charAt(0).toUpperCase() + item.word.slice(1).toLowerCase();
      }
      return item.word.toLowerCase();
    }).join(' ');
    
    // Добавляем вопросительный знак если его нет
    if (!normalizedText.endsWith('?')) {
      normalizedText += '?';
    }
  } else {
    // Для ответов: первое слово с заглавной, остальные как есть
    normalizedText = words.map((item, index) => {
      if (index === 0) {
        return item.word.charAt(0).toUpperCase() + item.word.slice(1);
      }
      return item.word;
    }).join(' ');
    
    // Добавляем точку если нет знака препинания
    if (!/[.!?]$/.test(normalizedText)) {
      normalizedText += '.';
    }
  }
  
  return normalizedText || '—';
};
// В useEffect для перевода вопроса
useEffect(() => {
  if (newQuestion && newQuestion.questionStructure && newQuestion.questionStructure.length > 0) {
    const hintLanguage = lessonData?.hintLanguage || 'english';
    const autoQuestion = generateAutoTranslation(newQuestion.questionStructure, hintLanguage);
    setAutoTranslations(prev => ({
      ...prev,
      question: autoQuestion
    }));
  }
}, [newQuestion?.questionStructure, lessonData?.hintLanguage]);

// В useEffect для перевода ответа
useEffect(() => {
  if (newQuestion && newQuestion.answerStructure && newQuestion.answerStructure.length > 0) {
    const hintLanguage = lessonData?.hintLanguage || 'english';
    const autoAnswer = generateAutoTranslation(newQuestion.answerStructure, hintLanguage);
    setAutoTranslations(prev => ({
      ...prev,
      answer: autoAnswer
    }));
  }
}, [newQuestion?.answerStructure, lessonData?.hintLanguage]);

// При изменении структуры вопроса/ответа генерируем автоматический перевод
useEffect(() => {
  if (newQuestion.questionStructure.length > 0) {
    const hintLanguage = lessonData?.hintLanguage || 'english';
    const autoQuestion = generateAutoTranslation(newQuestion.questionStructure, hintLanguage, true);
    setAutoTranslations(prev => ({
      ...prev,
      question: autoQuestion || ''
    }));
  }
}, [newQuestion.questionStructure, lessonData?.hintLanguage]);

useEffect(() => {
  if (newQuestion.answerStructure.length > 0) {
    const hintLanguage = lessonData?.hintLanguage || 'english';
    const autoAnswer = generateAutoTranslation(newQuestion.answerStructure, hintLanguage, false);
    setAutoTranslations(prev => ({
      ...prev,
      answer: autoAnswer || ''
    }));
  }
}, [newQuestion.answerStructure, lessonData?.hintLanguage]);
const checkAndAddQuestionType = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/lesson-types/add-missing`, {
      method: 'POST'
    });
    const result = await response.json();
    console.log('Question type check:', result);
    
    // Перезагружаем типы уроков
    await loadLessonTypes();
  } catch (error) {
    console.error('Error checking question type:', error);
  }
};

// Вызовите эту функцию после загрузки приложения
useEffect(() => {
  if (isAuthenticated) {
    loadLessonTypes();
    checkAndAddQuestionType(); // Добавьте этот вызов
  }
}, [isAuthenticated]);
  const loadLessonTypes = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/lesson-types`);
    let types = [];
    
    if (response.ok) {
      types = await response.json();
      console.log('Types from backend:', types);
    }
    
    // ВРЕМЕННО: Если тип "Вопрос" отсутствует, добавляем его на фронтенде
    if (!types.some(t => t.typeId === 4)) {
      console.log('Adding question type on frontend temporarily');
      types.push({
        typeId: 4,
        name: 'вопрос',
        description: 'Урок с вопросами и ответами',
        config: {
          requiresPairAnswer: true,
          questionColumns: 3,
          answerColumns: 3,
          availableDatabases: ['nouns', 'adjectives', 'verbs', 'pronouns', 'numerals', 'adverbs', 'prepositions', 'question-words']
        }
      });
    }
     if (!types.some(t => t.typeId === 5)) {
      console.log('Adding question type on frontend temporarily');
      types.push({
      typeId: 5,
      name: 'Подкаст',
      description: 'Аудио урок с титрами и подсказками',
      config: {
        hasAudio: true,
        requiresTranscript: true,
        supportsMultipleLanguages: true
      }
    });
    }
    
    setLessonTypes(types);
    console.log('Final lesson types:', types);
    
  } catch (error) {
    console.error('Error loading lesson types:', error);
    // Fallback types
    const fallbackTypes = [
      {
        typeId: 1,
        name: 'Лексика',
        description: 'Урок с отдельными словами и картинками'
      },
      {
        typeId: 2, 
        name: 'Тест лексика',
        description: 'Тест на знание слов'
      },
      {
        typeId: 3,
        name: 'Фразы',
        description: 'Урок с составлением предложений'
      },
      {
        typeId: 4,
        name: 'Вопрос',
        description: 'Урок с вопросами и ответами'
      }
    ];
    setLessonTypes(fallbackTypes);
  }
};

const loadModuleQuestions = async (moduleId) => {
  try {
    console.log('Loading questions for module:', moduleId);
    // ИСПРАВЛЕННЫЙ URL - используйте тот, который есть в бэкенде
    const response = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/questions`);
    if (response.ok) {
      const questions = await response.json();
      console.log('Loaded questions:', questions);
      setModuleQuestions(questions);
    } else {
      console.error('Failed to load questions');
      setModuleQuestions([]);
    }
  } catch (error) {
    console.error('Error loading module questions:', error);
    setModuleQuestions([]);
  }
};
const getLanguageFromColumn = (columnName) => {
  if (columnName.includes('Русский')) return 'русский';
  if (columnName.includes('Английский')) return 'английский';
  if (columnName.includes('Турецкий')) return 'турецкий';
  if (columnName.includes('Испанский')) return 'испанский';
  if (columnName.includes('Немецкий')) return 'немецкий';
  if (columnName.includes('Французский')) return 'французский';
  if (columnName.includes('Итальянский')) return 'итальянский';
  if (columnName.includes('Китайский')) return 'китайский';
  if (columnName.includes('Японский')) return 'японский';
  if (columnName.includes('Корейский')) return 'корейский';
  if (columnName.includes('Арабский')) return 'арабский';
  return columnName.split(' ').pop();
};
// Сохраняем настройки для следующего вопроса
const saveQuestionSettings = () => {
  const questionSettings = newQuestion.questionStructure.map(data => ({
    lesson: data.lesson || '',
    number: data.number || '',
    gender: data.gender || '',
    case: data.case || ''
  }));
  
  const answerSettings = newQuestion.answerStructure.map(data => ({
    lesson: data.lesson || '',
    number: data.number || '',
    gender: data.gender || '',
    case: data.case || ''
  }));
  
  // Сохраняем в localStorage или state для использования в следующем вопросе
  localStorage.setItem('questionSettings', JSON.stringify(questionSettings));
  localStorage.setItem('answerSettings', JSON.stringify(answerSettings));
};

// Сбрасываем форму с сохранением настроек
const resetQuestionFormWithSettings = () => {
  const savedQuestionSettings = JSON.parse(localStorage.getItem('questionSettings') || '[]');
  const savedAnswerSettings = JSON.parse(localStorage.getItem('answerSettings') || '[]');
  
  const questionColumnCount = currentLessonForModule?.config?.questionColumnConfigs?.length || 3;
  const answerColumnCount = currentLessonForModule?.config?.answerColumnConfigs?.length || 3;
  
  const initialQuestionStructure = Array.from({ length: questionColumnCount }, (_, index) => {
    const saved = savedQuestionSettings[index] || {};
    return {
      lesson: saved.lesson || '',
      number: saved.number || '',
      gender: saved.gender || '',
      case: saved.case || '',
      word: '',
      wordData: null
    };
  });
  
  const initialAnswerStructure = Array.from({ length: answerColumnCount }, (_, index) => {
    const saved = savedAnswerSettings[index] || {};
    return {
      lesson: saved.lesson || '',
      number: saved.number || '',
      gender: saved.gender || '',
      case: saved.case || '',
      word: '',
      wordData: null
    };
  });
  
  setNewQuestion({
    questionStructure: initialQuestionStructure,
    answerStructure: initialAnswerStructure,
    questionImage: '',
    answerImage: '',
    hint: '',
    requiresPairAnswer: true, // ← Добавьте это
    englishQuestion: '',
    englishAnswer: ''
  });
};

// Полный сброс формы
const resetQuestionForm = () => {
  const questionColumnCount = currentLessonForModule?.config?.questionColumnConfigs?.length || 3;
  const answerColumnCount = currentLessonForModule?.config?.answerColumnConfigs?.length || 3;
  
  const initialQuestionStructure = Array.from({ length: questionColumnCount }, (_, index) => ({
    lesson: '',
    number: '',
    gender: '',
    case: '',
    word: '',
    wordData: null
  }));
  
  const initialAnswerStructure = Array.from({ length: answerColumnCount }, (_, index) => ({
    lesson: '',
    number: '',
    gender: '',
    case: '',
    word: '',
    wordData: null
  }));
  
  setNewQuestion({
    questionStructure: initialQuestionStructure,
    answerStructure: initialAnswerStructure,
    questionImage: '',
    answerImage: '',
    hint: '',
    requiresPairAnswer: true, // ← Значение по умолчанию
    englishQuestion: '',
    englishAnswer: ''
  });
};
// Добавьте этот код где-нибудь в начале компонента AdminPage, например после других функций
const getDatabaseDisplayName = (database) => {
  const databaseNames = {
    'nouns': 'Существительное',
    'adjectives': 'Прилагательное',
    'verbs': 'Глагол',
    'pronouns': 'Местоимение', 
    'numerals': 'Числительное',
    'adverbs': 'Наречие',
    'prepositions': 'Предлог',
    'question-words': 'Вопросительное слово'
  };
  return databaseNames[database] || database;
};
const openQuestionModal = async (module) => {
  console.log('Opening question modal for module:', module);
  
  setCurrentLessonForModule(module);
  setModuleQuestions([]);
  
  // Загружаем урок для модуля, чтобы получить studiedLanguage
  try {
    const lessonResponse = await fetch(`${API_BASE_URL}/lessons/${module.lessonId}`);
    const lesson = await lessonResponse.json();
    setLessonData(lesson);
  } catch (error) {
    console.error('Error loading lesson for module:', error);
    setLessonData(null);
  }

  // Инициализируем структуры вопросов и ответов
  const questionColumnCount = module.config?.questionColumnConfigs?.length || 3;
  const answerColumnCount = module.config?.answerColumnConfigs?.length || 3;
  
  const initialQuestionStructure = Array.from({ length: questionColumnCount }, (_, index) => ({
    lesson: '',
    number: '',
    gender: '',
    case: '',
    word: '',
    wordData: null
  }));

  const initialAnswerStructure = Array.from({ length: answerColumnCount }, (_, index) => ({
    lesson: '',
    number: '',
    gender: '',
    case: '',
    word: '',
    wordData: null
  }));

  console.log('Creating new question with structure:', {
    questionStructure: initialQuestionStructure,
    answerStructure: initialAnswerStructure
  });

  setNewQuestion({
  questionStructure: initialQuestionStructure,
  answerStructure: initialAnswerStructure,
  questionImage: '',
  answerImage: '',
  hint: '',
  requiresPairAnswer: true, // ← Добавьте это
  englishQuestion: '',
  englishAnswer: ''
});
  setShowQuestionModal(true);
  
  // Загружаем существующие вопросы модуля
  await loadModuleQuestions(module._id);
};
const deleteQuestion = async (questionId) => {
  if (!confirm('Удалить вопрос?')) return;
  try {
    await fetch(`${API_BASE_URL}/questions/${questionId}`, { method: 'DELETE' });
    await loadModuleQuestions(currentLessonForModule._id);
    alert('Вопрос удален!');
  } catch (error) {
    alert('Ошибка удаления: ' + error.message);
  }
};
   const loadLessonModules = async (lessonId) => {
    try {
        console.log('Loading modules for lesson:', lessonId);
        const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/modules`);
        if (response.ok) {
            const modules = await response.json();
            console.log('Loaded modules:', modules);
           setLessonModules(prev => {
  const prevArray = Array.isArray(prev) ? prev : [];
  const filtered = prevArray.filter(m => m.lessonId !== lessonId);
  return [...filtered, ...modules];
});
            return modules; // Возвращаем модули для использования
        } else {
            console.error('Failed to load modules');
            setLessonModules([]);
            return [];
        }
    } catch (error) {
        console.error('Error loading lesson modules:', error);
        setLessonModules([]);
        return [];
    }
};
 
    // Модалка создания модуля
   const openCreateModuleModal = async (lesson) => {
    
     if (lesson._id && lesson._id.startsWith('table_')) {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons/create-from-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableLessonId: lesson._id,
          studiedLanguage: lesson.studiedLanguage,
          hintLanguage: lesson.hintLanguage
        })
      });
      
      if (response.ok) {
        const dbLesson = await response.json();
        lesson = dbLesson; // Заменяем табличный урок на урок из базы данных
        console.log('Created lesson in database:', dbLesson);
      }
    } catch (error) {
      console.error('Error creating lesson from table:', error);
      alert('Ошибка создания урока в базе данных: ' + error.message);
      return;
    }
  }
    setCurrentLessonForModule(lesson);
  
    // Загружаем модули для этого урока и ждем завершения
    const modules = await loadLessonModules(lesson._id);
  
    // Инициализируем конфигурации колонок на основе загруженных модулей
    const initialColumnConfigs = Array.from({ length: newModule.columnsCount }, (_, i) =>
        newModule.columnConfigs[i] || {database: 'nouns', filters: {}}
    );
  
    setNewModule({
        ...newModule,
        title: `${lesson.title} - модуль`,
        columnConfigs: initialColumnConfigs
    });
    if (newModule.typeId === 2) {
  // Инициализируем конфигурацию теста
  setNewTestModule({
    database: 'nouns',
    wordCount: 8,
    theme: '',
    selectedWords: []
  });
}
  
    setShowCreateModuleModal(true);
};
 useEffect(() => {
    if (showCreateLessonModal && newLesson.theme) {
      const currentData = getActiveTableData();
      let foundNumber = '';
      for (const row of currentData) {
        if (row['Урок название'] === newLesson.theme) {
          foundNumber = row['Урок номер'];
          break;
        }
      }
      setNewLesson(prev => ({ ...prev, lessonNumber: foundNumber }));
    }
  }, [newLesson.theme, showCreateLessonModal, activeTable]);   // Создание модуля
const createModule = async () => {
  try {
    const selectedType = lessonTypes.find(t => t.typeId === newModule.typeId);
    if (!selectedType) {
      alert('Выбран неверный тип урока');
      return;
    }

    let moduleData = {
      lessonId: currentLessonForModule._id,
      typeId: newModule.typeId,
      title: newModule.title,
      order: lessonModules.length + 1,
      content: [],
      isActive: true
    };
       console.log('Creating module with data:', moduleData);

    // Добавляем конфигурацию в зависимости от типа
  if (newModule.typeId === 3) {
  moduleData.config = {
    columnsCount: newModule.columnsCount,
    columnConfigs: newModule.columnConfigs.map(config => ({
      database: config.database,
      filters: {
        number: config.filters?.number || '',
        gender: config.filters?.gender || '',
        case: config.filters?.case || '' // ДОБАВЛЕН ПАДЕЖ
      }
    }))
  };
}else if (newModule.typeId === 4) {
      moduleData.config = {
        questionColumnsCount: newQuestionModule.questionColumnsCount,
        answerColumnsCount: newQuestionModule.answerColumnsCount,
        requiresPairAnswer: newQuestionModule.requiresPairAnswer,
        questionColumnConfigs: newQuestionModule.questionColumnConfigs,
        answerColumnConfigs: newQuestionModule.answerColumnConfigs
      };
    }
    // В функции createModule, после проверки для типа 3 и 4, добавьте:
else if (newModule.typeId === 2) {
  // Проверяем, что выбрано достаточно слов
  if (newTestModule.selectedWords.length !== newTestModule.wordCount) {
    alert(`Выберите ровно ${newTestModule.wordCount} слов для теста`);
    return;
  }

  moduleData.config = {
    database: newTestModule.database,
    wordCount: newTestModule.wordCount,
    theme: newTestModule.theme,
    words: newTestModule.selectedWords.map(word => ({
      imageBase: word.imageBase || word.id,
      imagePng: word.imagePng || '',
      translations: word.translations || {},
      displayWord: word.displayWord || word.word
    }))
  };
}

    console.log('Creating module:', moduleData);
    const response = await fetch(`${API_BASE_URL}/lesson-modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moduleData)
    });

    if (response.ok) {
      const savedModule = await response.json();
      alert(`Модуль "${newModule.title}" создан успешно!`);
      setShowCreateModuleModal(false);
      setNewTestModule({
  database: 'nouns',
  wordCount: 8,
  theme: '',
  selectedWords: []
});
      
      // Сброс форм
      setNewModule({
        typeId: 1,
        title: '',
        columnsCount: 2,
        columnConfigs: []
      });
      setNewQuestionModule({
        typeId: 4,
        title: '',
        questionColumnsCount: 3,
        answerColumnsCount: 3,
        requiresPairAnswer: true,
        questionColumnConfigs: [
          { database: 'question-words', filters: {} },
          { database: 'nouns', filters: {} },
          { database: 'adjectives', filters: {} }
        ],
        answerColumnConfigs: [
          { database: 'nouns', filters: {} },
          { database: 'prepositions', filters: {} },
          { database: 'nouns', filters: {} }
        ]
      });

      // Немедленно обновляем список модулей
      await loadLessonModules(currentLessonForModule._id);

      // Если это модуль вопросов, открываем модалку для добавления вопросов
      if (newModule.typeId === 4) {
        setCurrentLessonForModule(savedModule);
        setShowQuestionModal(true);
      }
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to create module');
    }
  } catch (error) {
    console.error('Error creating module:', error);
    alert('Ошибка создания модуля: ' + error.message);
  }
};
useEffect(() => {
  if (showLessonsModal && lessons && lessons.length > 0) {
    lessons.forEach(l => {
      const already = lessonModules && lessonModules.some(m => m.lessonId === l._id);
      if (!already) {
        loadLessonModules(l._id);
      }
    });
  }
}, [showLessonsModal, lessons]);
    // Удаление модуля
const deleteModule = async (moduleId, moduleTitle, lessonId) => { 

  if (!confirm(`Вы уверены, что хотите удалить модуль "${moduleTitle}"?`)) return;

  try {
    const response = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      await loadLessonModules(lessonId);  
      alert('Модуль удален успешно!');
    } else {
      throw new Error('Failed to delete module');
    }
  } catch (error) {
    console.error('Error deleting module:', error);
    alert('Ошибка удаления модуля: ' + error.message);
  }
};
    // Обновление конфигурации колонки
    const updateColumnConfig = (columnIndex, field, value) => {
        const updatedConfigs = [...newModule.columnConfigs];
        updatedConfigs[columnIndex] = {
            ...updatedConfigs[columnIndex],
            [field]: value
        };
        setNewModule({
            ...newModule,
            columnConfigs: updatedConfigs
        });
    };
const openSentenceModal = async (module, sentence = null) => {
  console.log('Opening sentence modal for module:', module);
  
  setCurrentLessonForModule(module);
  setModuleSentences([]);
  
  // Загружаем урок для получения языка
  try {
    const lessonResponse = await fetch(`${API_BASE_URL}/lessons/${module.lessonId}`);
    const lesson = await lessonResponse.json();
    setLessonData(lesson);
  } catch (error) {
    console.error('Error loading lesson for module:', error);
    setLessonData(null);
  }

  // Инициализация структуры с учетом фильтров
  const columnCount = module.config?.columnConfigs?.length || 2;
  
  if (sentence) {
    // Редактирование существующего
    console.log('Editing existing sentence:', sentence);
    setNewSentence({
      ...sentence,
      columnData: sentence.sentenceStructure || []
    });
    setEditingSentence(true);
  } else {
    // Создание нового с предзаполнением фильтров
    const initialColumnData = Array.from({ length: columnCount }, (_, index) => {
      const prev = previousColumnSettings[index] || {};
      return {
        lesson: prev.lesson || '',
        number: prev.number || '',
        gender: prev.gender || '',
        case: prev.case || '', // ДОБАВЛЕН ПАДЕЖ
        word: '',
        wordData: null
      };
    });

    setNewSentence({
      columnData: initialColumnData,
      image: ''
    });
    setEditingSentence(false);
  }
  
  setShowSentenceModal(true);
  loadModuleSentences(module._id);
};
useEffect(() => {
  // Автоматически устанавливаем картинку из первого выбранного слова
  const firstWordWithImage = newSentence.columnData.find(data =>
    data?.wordData?.imagePng
  );
 
  if (firstWordWithImage && !newSentence.image) {
    setNewSentence(prev => ({
      ...prev,
      image: firstWordWithImage.wordData.imagePng
    }));
  }
}, [newSentence.columnData]);
const debugModuleStructure = (module) => {
  console.log('Module structure:', {
    id: module._id,
    title: module.title,
    typeId: module.typeId,
    config: module.config,
    columnConfigs: module.config?.columnConfigs,
    hasConfig: !!module.config,
    hasColumnConfigs: !!module.config?.columnConfigs,
    columnCount: module.config?.columnConfigs?.length || 0
  });
};
const addOrUpdateSentence = async () => {
  try {
    console.log('=== SAVING SENTENCE ===');
    
    // Проверка, что все колонки заполнены
    const isFormValid = newSentence.columnData.every((data, index) => {
      const hasWord = !!data?.wordData;
      console.log(`Column ${index + 1}:`, { hasWord, word: data?.word, config: currentLessonForModule.config?.columnConfigs?.[index] });
      return hasWord;
    });

    if (!isFormValid) {
    const invalidColumns = newSentence.columnData
  .map((data, index) => ({ index, valid: !!data?.wordData }))
        .filter(col => !col.valid)
        .map(col => col.index + 1);
      
      alert(`Выберите слова для колонок: ${invalidColumns.join(', ')}`);
      return;
    }

    // Подготовка структуры предложения
    const sentenceStructure = newSentence.columnData.map((data, index) => {
      const columnConfig = currentLessonForModule.config?.columnConfigs?.[index];
      
    const rawWord =
  data.wordData?.displayWord ||
  data.wordData?.word ||
  data.word ||
  '';

let normalizedWord = rawWord;

if (index === 0 && rawWord) {
  normalizedWord = rawWord.charAt(0).toUpperCase() + rawWord.slice(1);
} else if (rawWord) {
  normalizedWord = rawWord.toLowerCase();
}
   return {
  word: normalizedWord,
  wordData: {
    ...data.wordData,
    word: rawWord,
    displayWord: rawWord
  },
  database: columnConfig?.database || 'nouns',
  lesson: data.lesson || '',
  number: data.number || '',
  gender: data.gender || '',
  case: data.case || ''
};
    });

    // Автоматическая установка картинки
    const image = newSentence.image || newSentence.columnData[0]?.wordData?.imagePng || '';
    
    const sentenceData = {
      moduleId: currentLessonForModule._id,
      sentenceStructure: sentenceStructure,
      image: image
    };

    console.log('Saving sentence data:', sentenceData);

    // Сохранение
    const endpoint = editingSentence && newSentence._id
      ? `/sentences/${newSentence._id}`
      : '/sentences';
    const method = editingSentence && newSentence._id ? 'PUT' : 'POST';

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sentenceData)
    });

    if (response.ok) {
      const savedSentence = await response.json();
      console.log('Sentence saved successfully:', savedSentence);

      // Сохраняем настройки для следующего предложения
      const savedSettings = newSentence.columnData.map(data => ({
        lesson: data.lesson || '',
        number: data.number || '',
        gender: data.gender || '',
        case: data.case || ''
      }));

      setPreviousColumnSettings(savedSettings);
      await loadModuleSentences(currentLessonForModule._id);
      alert('Предложение сохранено!');

      // Сбрасываем форму с сохранением настроек
      resetSentenceForm(savedSettings);
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to save sentence');
    }
  } catch (error) {
    console.error('Error saving sentence:', error);
    alert('Ошибка сохранения предложения: ' + error.message);
  }
};
    // Функция сброса формы
 const resetSentenceForm = (prevSettings = null) => {
  const settingsToUse = prevSettings || previousColumnSettings;

  const columnCount = currentLessonForModule.config?.columnConfigs?.length || 2;
  const initialColumnData = Array.from({ length: columnCount }, (_, index) => {
    const prev = settingsToUse[index] || {};
    return {
      lesson: prev.lesson || '',
      number: prev.number || '',
      gender: prev.gender || '',
      case: prev.case || '', // СОХРАНЯЕМ ПАДЕЖ
      word: '',
      wordData: null
    };
  });

  setNewSentence({
    columnData: initialColumnData,
    image: ''
  });
  setEditingSentence(false);
};
    const deleteSentence = async (sentenceId) => {
        if (!confirm('Удалить строку?')) return;
        try {
            await fetch(`${API_BASE_URL}/sentences/${sentenceId}`, { method: 'DELETE' });
            await loadModuleSentences(currentLessonForModule._id);
            alert('Строка удалена!');
        } catch (error) {
            alert('Ошибка удаления: ' + error.message);
        }
    };
    // Визуализация модулей урока
 const renderLessonModules = (lesson) => {
    // Фильтруем модули для текущего урока
    const lessonModulesList = lessonModules.filter(m => m.lessonId === lesson._id);
   
    console.log('Rendering modules for lesson:', lesson._id, 'found:', lessonModulesList.length);
  
    return (
 
<div className="mt-4 p-4 bg-gray-50 rounded-lg">
    <h4 className="font-semibold mb-3">Модули урока:</h4>
    <div className="space-y-2">
        {lessonModulesList.map(module => (
            <div key={module._id} className="flex items-center justify-between p-3 bg-white border rounded">
                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center">
                        <span className="font-medium truncate">{module.title}</span>
                        <span className="text-sm text-gray-600 ml-2 flex-shrink-0">
                            ({lessonTypes.find(t => t.typeId === module.typeId)?.name || `Тип ${module.typeId}`})
                        </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                        Колонок: {module.config?.columnsCount || module.config?.columnConfigs?.length || 0}
                    </div>
                </div>
              
                <div className="flex gap-2 flex-shrink-0">
                  {module.typeId === 4 && (
    <button
      onClick={() => openQuestionModal(module)}
      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 whitespace-nowrap"
    >
      Добавить вопрос
    </button>
  )}
  {module.typeId === 5 && (
  <button
    onClick={() => openPodcastModal(module)}
    className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 whitespace-nowrap"
  >
    Добавить подкаст
  </button>
)}
                    {module.typeId === 3 && (
                        <button
                            onClick={() => openSentenceModal(module)}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 whitespace-nowrap"
                        >
                            Добавить предложение
                        </button>
                    )}

                <button
                
  onClick={() => deleteModule(module._id, module.title, lesson._id)}  // <-- Добавьте lesson._id
  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 whitespace-nowrap"
>
  Удалить
</button>
                </div>
            </div>
        ))}
        {lessonModulesList.length === 0 && (
            <div className="text-center py-2 text-gray-500">
                Нет добавленных модулей
            </div>
        )}
    </div>
    <button
        onClick={() => openCreateModuleModal(lesson)}
        className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
    >
        + Добавить модуль
    </button>
</div>

    );
};
    useEffect(() => {
        const checkAuth = () => {
            const savedAuth = localStorage.getItem('adminAuth');
            if (savedAuth) {
                try {
                    const authData = JSON.parse(savedAuth);
                    const sessionTime = 24 * 60 * 60 * 1000;
                    const currentTime = new Date().getTime();
                 
                    if (currentTime - authData.timestamp < sessionTime) {
                        setIsAuthenticated(true);
                    } else {
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
 const addNewQuestionWord = async () => {
  const currentData = getActiveTableData();
  const columns = currentData.length > 0 
    ? Object.keys(currentData[0]) 
    : ['Картинка', 'Русский', 'Английский', 'Турецкий'];
  
  const newRow = {};
  columns.forEach(col => {
    newRow[col] = ''; // Создаем пустую строку
  });
  
  const newTableData = [...currentData, newRow];
  setActiveTableData(newTableData);
  await saveActiveTable(newTableData);
};
    const createRow = (columns, values = {}) => {
        const row = {};
        columns.forEach(col => {
            row[col] = values[col] ?? '';
        });
        return row;
    };
const createInitialQuestionWordsTable = () => {
  const baseColumns = ['Картинка', 'Русский', 'Английский', 'Турецкий'];
  
  return [
    {
      'Картинка': '',
      'Русский': 'Что',
      'Английский': 'What',
      'Турецкий': 'Ne'
    },
    {
      'Картинка': '',
      'Русский': 'Это',
      'Английский': 'This', 
      'Турецкий': 'Bu'
    },
    {
      'Картинка': '',
      'Русский': 'Где',
      'Английский': 'Where',
      'Турецкий': 'Nerede'
    },
    {
      'Картинка': '',
      'Русский': 'Кто',
      'Английский': 'Who',
      'Турецкий': 'Kim'
    },
    {
      'Картинка': '',
      'Русский': 'Когда',
      'Английский': 'When',
      'Турецкий': 'Ne zaman'
    }
  ];
};
const compressImage = async (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    // Если файл маленький (< 300KB), не сжимаем
    if (file.size < 300 * 1024) {
      resolve(file);
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      // Если изображение слишком широкое, уменьшаем
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Рисуем сжатое изображение
      ctx.drawImage(img, 0, 0, width, height);
      
      // Конвертируем в Blob с качеством
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Не удалось сжать изображение'));
            return;
          }
          
          // Создаем новый File из Blob
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          
          console.log(`Сжатие: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      console.warn('Не удалось загрузить изображение для сжатия, использую оригинал');
      resolve(file);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

const fileToBase64 = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
};
const handleOptimizedImageUpload = async (event, imageType) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setUploadingImage(true);
  setUploadingImageType(imageType);

  try {
    console.log(`Оригинальный файл: ${file.name}, размер: ${(file.size / 1024).toFixed(1)}KB`);
    
    // 1. Сжимаем изображение если нужно
    let processedFile = file;
    if (file.size > 300 * 1024) { // > 300KB
      console.log('Сжимаем изображение...');
      processedFile = await compressImage(file, 800, 0.7);
      console.log(`Сжатый размер: ${(processedFile.size / 1024).toFixed(1)}KB`);
    }

    // 2. Конвертируем в base64
    const base64 = await fileToBase64(processedFile);
    
    // 3. Извлекаем только base64 часть
    let base64Data = base64;
    if (base64.startsWith('data:')) {
      const matches = base64.match(/^data:.+\/(.+);base64,(.*)$/);
      if (matches && matches.length === 3) {
        base64Data = matches[2];
      }
    }

    console.log(`Отправляем на сервер (длина base64: ${base64Data.length})`);

    // 4. Отправляем на сервер
    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageBase64: base64Data,
        fileName: processedFile.name,
        originalSize: file.size,
        compressedSize: processedFile.size
      })
    });

    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        if (imageType === 'question') {
          setNewQuestion(prev => ({
            ...prev,
            questionImage: result.imageUrl
          }));
        } else {
          setNewQuestion(prev => ({
            ...prev,
            answerImage: result.imageUrl
          }));
        }
        
        alert(`✅ Изображение загружено! (сжато с ${(file.size / 1024).toFixed(0)}KB до ${(processedFile.size / 1024).toFixed(0)}KB)`);
      }
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Ошибка сервера');
    }
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    alert('Ошибка загрузки изображения: ' + error.message);
  } finally {
    setUploadingImage(false);
    setUploadingImageType(null);
    if (event.target) {
      event.target.value = '';
    }
  }
};



// Вспомогательная функция конвертации в base64

const handleAddLanguageToQuestionWords = async () => {
  if (!newLanguage) { 
    alert('Выберите язык'); 
    return; 
  }

  const languageName = newLanguage.split(' ').pop(); // "Русский", "Английский" и т.д.
  
  const currentData = getActiveTableData();
  const newTableData = currentData.map(row => {
    const newRow = { ...row };
    newRow[languageName] = ''; // Добавляем новую колонку с пустыми значениями
    return newRow;
  });

  setActiveTableData(newTableData);
  setShowAddLanguageModal(false);
  setNewLanguage('');
  await saveActiveTable(newTableData);

  alert(`Язык "${languageName}" добавлен успешно!`);
};const createInitialPrepositionsTable = () => {
  const baseColumns = ['Картинка', 'Русский', 'Английский', 'Турецкий'];
  
  return [
    {
      'Картинка': '',
      'Русский': 'В',
      'Английский': 'In',
      'Турецкий': 'İçinde'
    },
    {
      'Картинка': '',
      'Русский': 'На',
      'Английский': 'On',
      'Турецкий': 'Üzerinde'
    },
    {
      'Картинка': '',
      'Русский': 'Под',
      'Английский': 'Under',
      'Турецкий': 'Altında'
    },
    {
      'Картинка': '',
      'Русский': 'За',
      'Английский': 'Behind',
      'Турецкий': 'Arkasında'
    },
    {
      'Картинка': '',
      'Русский': 'Перед',
      'Английский': 'In front of',
      'Турецкий': 'Önünde'
    }
  ];
};
    const createInitialNounsTable = () => {
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
            })
        ];
    };
    const shouldShowCaseButton = (language) => {
  const langConfig = getAdjectiveLanguageConfig(language);
  return langConfig.hasCases;
};

// Функция для получения доступных языков с падежами
const getLanguagesWithCases = () => {
  return Object.entries(adjectivesLanguageConfig)
    .filter(([lang, config]) => config.hasCases)
    .map(([lang]) => lang);
};

// Функция для отображения только нужных колонок при редактировании
// Функция для отображения только нужных колонок при редактировании
const getVisibleColumnsForLanguage = (language) => {
  const config = getAdjectiveLanguageConfig(language);
  
  // Сначала получаем базовое название языка (без пробелов и в правильном регистре)
  const langKey = language.toLowerCase().trim();
  const languageMap = {
    'russian': 'Русский',
    'english': 'Английский',
    'turkish': 'Турецкий',
    'spanish': 'Испанский',
    'german': 'Немецкий',
    'french': 'Французский',
    'italian': 'Итальянский',
    'chinese': 'Китайский',
    'japanese': 'Японский',
    'arabic': 'Арабский'
  };
  
  const displayLanguage = languageMap[langKey] || language;
  
  const columnMap = {
    'word': `База прилагательные слова ${displayLanguage}`,
    'masculine': `База прилагательные мужской род ${displayLanguage}`,
    'feminine': `База прилагательные женский род ${displayLanguage}`,
    'neuter': `База прилагательные средний род ${displayLanguage}`,
    'plural': `База прилагательные множественное число ${displayLanguage}`
  };
  
  return config.columns.map(col => columnMap[col]);
};
 const createInitialAdjectivesTable = () => {
  // Базовые колонки
  const baseColumns = [
    'Уровень изучения номер',
    'Урок номер',
    'Урок название',
    'База изображение',
    'Картинка png'
  ];
  
  // Колонки для русского языка (полный набор)
  const russianColumns = [
    'База прилагательные номер Русский',
    'База прилагательные мужской род Русский',
    'База прилагательные женский род Русский',
    'База прилагательные средний род Русский',
    'База прилагательные множественное число Русский'
  ];
  
  // Колонки для других языков (только базовое слово)
  const otherLanguages = ['Английский', 'Турецкий', 'Китайский', 'Японский'];
  const otherLanguageColumns = otherLanguages.map(lang => 
    `База прилагательные слова ${lang}`
  );
  
  const allColumns = [...baseColumns, ...russianColumns, ...otherLanguageColumns];
  
  return [
    createRow(allColumns, {
      'Уровень изучения номер': 'A1',
      'Урок номер': '1.1',
      'Урок название': 'Еда'
    }),
    createRow(allColumns, {
      'База изображение': '1.1.1',
      'База прилагательные мужской род Русский': 'КРАСИВЫЙ',
      'База прилагательные женский род Русский': 'красивая',
      'База прилагательные средний род Русский': 'красивое',
      'База прилагательные множественное число Русский': 'красивые',
      'База прилагательные слова Английский': 'beautiful',
      'База прилагательные слова Турецкий': 'güzel',
      'База прилагательные слова Китайский': '美丽',
      'База прилагательные слова Японский': '美しい'
    })
  ];
};
const initializeAdjectivesLanguages = async () => {
    try {
        const currentData = getActiveTableData();
        if (currentData.length === 0) return;
        // Создаем базовые колонки для прилагательных
        const baseLanguagesToAdd = ['Русский', 'Английский', 'Турецкий'];
        const newTableData = currentData.map(row => {
            const newRow = { ...row };
          
            baseLanguagesToAdd.forEach(language => {
                // Добавляем все необходимые колонки для каждого языка
                newRow[`База прилагательные номер ${language}`] = '';
                newRow[`База прилагательные слова ${language}`] = '';
                newRow[`База прилагательные мужской род ${language}`] = '';
                newRow[`База прилагательные женский род ${language}`] = '';
                newRow[`База прилагательные средний род ${language}`] = '';
                newRow[`База прилагательные множественное число ${language}`] = '';
              
                // Заполняем номер если есть база изображения
                if (row['База изображение'] && row['База изображение'].trim() !== '') {
                    const languageNumber = getLanguageNumber(language);
                    newRow[`База прилагательные номер ${language}`] = `${row['База изображение']}.${languageNumber}`;
                }
            });
          
            return newRow;
        });
        setActiveTableData(newTableData);
        await saveActiveTable(newTableData);
        alert('Базовые языки для прилагательных инициализированы!');
    } catch (error) {
        console.error('Error initializing adjectives languages:', error);
        alert('Ошибка инициализации языков: ' + error.message);
    }
};
const loadDataFromBackend = async () => {
    try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/db`);
     if (!res.ok) {
      const initialNounsTable = createInitialNounsTable();
      const initialAdjectivesTable = createInitialAdjectivesTable();
      const initialQuestionWordsTable = createInitialQuestionWordsTable(); // ← ДОБАВЬ
           const initialPrepositionsTable = createInitialPrepositionsTable()
      
      setTableData(initialNounsTable);
      setAdjectivesTableData(initialAdjectivesTable);
      setQuestionWordsData(initialQuestionWordsTable); // ← ДОБАВЬ
         setPrepositionsTableData(initialPrepositionsTable);
      await saveTableToDatabase(initialNounsTable, 'nouns');
      await saveTableToDatabase(initialAdjectivesTable, 'adjectives');
      await saveTableToDatabase(initialQuestionWordsTable, 'question-words'); // ← ДОБАВЬ
       await saveTableToDatabase(initialPrepositionsTable, 'prepositions');
      return;
    }
          const data = await res.json();
    
    let tableDataArray = Array.isArray(data.table) ? data.table : [];
    let adjectivesDataArray = Array.isArray(data.adjectivesTable) ? data.adjectivesTable : [];
    let questionWordsArray = Array.isArray(data.questionWords) ? data.questionWords : [];
     let prepositionsArray = Array.isArray(data.prepositionsTable) ? data.prepositionsTable : [];
        // Автоматически удаляем все колонки "База прилагательные слова" при загрузке
        if (adjectivesDataArray.length > 0) {
            const hasAdjectiveWordColumns = Object.keys(adjectivesDataArray[0]).some(col => 
                col.startsWith('База прилагательные слова ')
            );
            
            if (hasAdjectiveWordColumns) {
                console.log('Обнаружены дублирующие колонки прилагательных, выполняется очистка...');
                
                adjectivesDataArray = adjectivesDataArray.map(row => {
                    const newRow = { ...row };
                    Object.keys(newRow).forEach(col => {
                        if (col.startsWith('База прилагательные слова ')) {
                            delete newRow[col];
                        }
                    });
                    return newRow;
                });
                
                // Сохраняем изменения в базу
                await saveTableToDatabase(adjectivesDataArray, 'adjectives');
                console.log('Дублирующие колонки прилагательных удалены');
            }
        }
      
        setTableData(tableDataArray);
        setAdjectivesTableData(adjectivesDataArray);
         setQuestionWordsData(questionWordsArray); // ← ДОБАВЬ
         setPrepositionsTableData(prepositionsArray);
    } catch (error) {
        console.error('Error loading data:', error);
        const initialNounsTable = createInitialNounsTable();
        const initialAdjectivesTable = createInitialAdjectivesTable();
        const initialQuestionsWords=createInitialQuestionWordsTable()
        const initialPrepositionsTable = createInitialPrepositionsTable();
        setTableData(initialNounsTable);
        setAdjectivesTableData(initialAdjectivesTable);
         setQuestionWordsData(initialQuestionsWords);
          setPrepositionsTableData(initialPrepositionsTable);
        await saveTableToDatabase(initialNounsTable, 'nouns');
        await saveTableToDatabase(initialAdjectivesTable, 'adjectives');
         await saveTableToDatabase(initialPrepositionsTable, 'prepositions');
    } finally {
        setLoading(false);
    }
};
 const saveTableToDatabase = async (dataToSave, tableType = 'nouns') => {
  try {
    let endpoint = '/table';
    if (tableType === 'adjectives') endpoint = '/adjectives-table';
    if (tableType === 'question-words') endpoint = '/question-words';
    if (tableType === 'prepositions') endpoint = '/prepositions-table'; // ← ДОБАВЬ
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
const syncThemesToAdjectives = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/adjectives-table/sync-themes`, {
            method: 'POST'
        });
        const result = await response.json();
        if (response.ok) {
            // Обновляем состояние таблицы прилагательных новыми данными
            setAdjectivesTableData(result.data || []);
            alert(`Темы синхронизированы! Добавлено: ${result.addedCount} новых тем`);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error syncing themes:', error);
        alert('Ошибка синхронизации тем: ' + error.message);
    }
};
const getActiveTableData = () => {
  if (activeTable === 'nouns') return tableData;
  if (activeTable === 'adjectives') return adjectivesTableData;
  if (activeTable === 'question-words') return questionWordsData;
  if (activeTable === 'prepositions') return prepositionsTableData; // ← ДОБАВЬ
  return tableData;
};
const setActiveTableData = (data) => {
  if (activeTable === 'nouns') {
    setTableData(data);
  } else if (activeTable === 'adjectives') {
    setAdjectivesTableData(data);
  } else if (activeTable === 'question-words') {
    setQuestionWordsData(data);
  } else if (activeTable === 'prepositions') { // ← ДОБАВЬ
    setPrepositionsTableData(data);
  }
};
const saveActiveTable = async (data) => {
  if (activeTable === 'nouns') {
    await saveTableToDatabase(data, 'nouns');
  } else if (activeTable === 'adjectives') {
    await saveTableToDatabase(data, 'adjectives');
  } else if (activeTable === 'question-words') {
    await saveTableToDatabase(data, 'question-words');
  } else if (activeTable === 'prepositions') { // ← ДОБАВЬ
    await saveTableToDatabase(data, 'prepositions');
  }
};
    const handleCellEdit = async (rowIndex, colKey, value) => {
        const currentData = getActiveTableData();
        const newData = [...currentData];
        newData[rowIndex] = { ...newData[rowIndex], [colKey]: value };
        setActiveTableData(newData);
        await saveActiveTable(newData);
    };
  const deleteRow = async (rowIndex) => {
    if (!confirm('Вы уверены, что хотите удалить эту строку?')) return;
  
    const currentData = getActiveTableData();
    const newData = currentData.filter((_, index) => index !== rowIndex);
    setActiveTableData(newData);
    await saveActiveTable(newData);
    alert('Строка удалена успешно!');
};
    const deleteColumn = async (colKey) => {
        if (!confirm(`Вы уверены, что хотите удалить колонку "${colKey}"?`)) return;
      
        const currentData = getActiveTableData();
        const newData = currentData.map(row => {
            const newRow = { ...row };
            delete newRow[colKey];
            return newRow;
        });
        setActiveTableData(newData);
        await saveActiveTable(newData);
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
            testTranslationCheck.isValid
        );
    };


   const addNewPreposition = async () => {
  const currentData = getActiveTableData();
  const columns = currentData.length > 0 
    ? Object.keys(currentData[0]) 
    : ['Картинка', 'Русский', 'Английский', 'Турецкий'];
  
  const newRow = {};
  columns.forEach(col => {
    newRow[col] = ''; // Создаем пустую строку
  });
  
  const newTableData = [...currentData, newRow];
  setActiveTableData(newTableData);
  await saveActiveTable(newTableData);
};
const addNewLesson = async () => {
  const maxLessonNumber = getMaxLessonNumber();
  const newLessonNumber = (maxLessonNumber + 0.1).toFixed(1);
  const currentData = getActiveTableData();
  
  let columns = [];
  let newLessonRow = {};
  
  if (activeTable === 'nouns') {
    columns = currentData.length > 0 ? Object.keys(currentData[0]) : Object.keys(createInitialNounsTable()[0]);
    newLessonRow = createRow(columns, {
      'Уровень изучения номер': newLesson.level || 'A1',
      'Урок номер': newLessonNumber,
      'Урок название': `Новый урок ${newLessonNumber}`
    });
  } else if (activeTable === 'adjectives') {
    columns = currentData.length > 0 ? Object.keys(currentData[0]) : Object.keys(createInitialAdjectivesTable()[0]);
    newLessonRow = createRow(columns, {
      'Уровень изучения номер': newLesson.level || 'A1',
      'Урок номер': newLessonNumber,
      'Урок название': `Новый урок ${newLessonNumber}`
    });
  } else if (activeTable === 'question-words') {
    columns = currentData.length > 0 ? Object.keys(currentData[0]) : questionWordsBaseColumns;
    newLessonRow = createRow(columns, {
      'Уровень изучения номер': newLesson.level || 'A1',
      'Урок номер': newLessonNumber,
      'Урок название': `Новый урок ${newLessonNumber}`
    });
  }

  const newTableData = [...currentData, newLessonRow];
  setActiveTableData(newTableData);
  await saveActiveTable(newTableData);

  if (activeTable === 'nouns') {
    await autoSyncWithAdjectives(newLessonRow['Урок название']);
  }
};

    const addColumn = async () => {
        const newColName = prompt('Название новой колонки:');
        if (!newColName) return;
        const currentData = getActiveTableData();
        const updated = currentData.map(row => ({ ...row, [newColName]: '' }));
        setActiveTableData(updated);
        await saveActiveTable(updated);
    };
    const autoSyncWithAdjectives = async (newTheme) => {
    try {
        const response = await fetch(`${API_BASE_URL}/adjectives-table/sync-themes`, {
            method: 'POST'
        });
        const result = await response.json();
        if (response.ok) {
            // Обновляем таблицу прилагательных
            setAdjectivesTableData(result.data || []);
            console.log(`Автоматически синхронизирована тема: ${newTheme}`);
        }
    } catch (error) {
        console.error('Error auto-syncing themes:', error);
        // Не показываем ошибку пользователю при автоматической синхронизации
    }
};
const handleAddLanguage = async () => {
  if (!newLanguage) { 
    alert('Выберите язык'); 
    return; 
  }
  
  // Для таблиц вопросительных слов и предлогов - простая логика
  if (activeTable === 'question-words' || activeTable === 'prepositions') {
    const languageName = newLanguage;
    
    const currentData = getActiveTableData();
    const newTableData = currentData.map(row => {
      const newRow = { ...row };
      newRow[languageName] = ''; // Добавляем новую колонку с пустыми значениями
      return newRow;
    });

    setActiveTableData(newTableData);
    setShowAddLanguageModal(false);
    setNewLanguage('');
    await saveActiveTable(newTableData);

    alert(`Язык "${languageName}" добавлен успешно!`);
    return;
  }

  // Для существительных и прилагательных - находим конфигурацию
  const languagesConfig = activeTable === 'nouns' ? allLanguages : adjectivesAllLanguages;
  
  // Ищем конфигурацию по названию языка
  let languageConfig = null;
  for (const [key, config] of Object.entries(languagesConfig)) {
    const languageNameFromConfig = config.number.split(' ').pop();
    if (languageNameFromConfig === newLanguage) {
      languageConfig = config;
      break;
    }
  }
  
  if (!languageConfig) { 
    alert(`Язык "${newLanguage}" не найден в конфигурации для ${activeTable === 'nouns' ? 'существительных' : 'прилагательных'}`); 
    return; 
  }

  const languageName = newLanguage;
  const currentData = getActiveTableData();

if (activeTable === 'adjectives') {
  const langConfig = getAdjectiveLanguageConfig(languageName);
  
  const newColumns = [];
  
  // Всегда добавляем номер
  newColumns.push(languageConfig.number);
  
  // Добавляем колонки в зависимости от конфигурации языка
  // ТОЛЬКО те, которые нужны для этого языка!
  langConfig.columns.forEach(columnType => {
    switch(columnType) {
      case 'word':
        if (languageConfig.word) newColumns.push(languageConfig.word);
        break;
      case 'masculine':
        if (languageConfig.masculine) newColumns.push(languageConfig.masculine);
        break;
      case 'feminine':
        if (languageConfig.feminine) newColumns.push(languageConfig.feminine);
        break;
      case 'neuter':
        if (languageConfig.neuter) newColumns.push(languageConfig.neuter);
        break;
      case 'plural':
        if (languageConfig.plural) newColumns.push(languageConfig.plural);
        break;
    }
  });
  
  // Фильтруем существующие колонки, чтобы не дублировать
  const columnsToAdd = newColumns.filter(colName => {
    // Если таблица пустая, добавляем все колонки
    if (currentData.length === 0) return true;
    
    return !Object.keys(currentData[0] || {}).includes(colName);
  });

  // Если таблица пустая, создаем базовую структуру
  let newTableData;
  if (currentData.length === 0) {
    newTableData = [{
      'Уровень изучения номер': 'A1',
      'Урок номер': '1.1',
      'Урок название': 'Новая тема',
      'База изображение': '',
      'Картинка png': ''
    }];
  } else {
    newTableData = [...currentData];
  }

  newTableData = newTableData.map(row => {
    const newRow = { ...row };
    
    // Добавляем новые колонки
    columnsToAdd.forEach(colName => {
      newRow[colName] = '';
    });
    
    // Заполняем номер для существующих слов
    if (row['База изображение'] && row['База изображение'].trim() !== '') {
      const imageBase = row['База изображение'];
      const languageNumber = getLanguageNumber(languageName);
      newRow[languageConfig.number] = `${imageBase}.${languageNumber}`;
    }
    
    return newRow;
  });

  setActiveTableData(newTableData);
  setShowAddLanguageModal(false);
  setNewLanguage('');
  await saveActiveTable(newTableData);

  alert(`Язык "${languageName}" добавлен успешно! Создано колонок: ${columnsToAdd.length} (${langConfig.columns.join(', ')})`);
  return;
}
  
  // Логика для существительных
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

  // Колонки для существительных
  const newColumns = Object.values(languageConfig);

  const newTableData = currentData.map(row => {
    const newRow = { ...row };
 
    newColumns.forEach(colName => {
      newRow[colName] = '';
    });
 
    if (row['База изображение'] && row['База изображение'].trim() !== '') {
      const imageBase = row['База изображение'];
      newRow[languageConfig.number] = `${imageBase}.${languageNumber}`;
    }
 
    return newRow;
  });

  setActiveTableData(newTableData);
  setShowAddLanguageModal(false);
  setNewLanguage('');
  await saveActiveTable(newTableData);

  alert(`Язык "${languageName}" добавлен успешно!`);
};
   const deleteLanguage = async (language) => {
  if (!confirm(`Вы уверены, что хотите удалить язык "${language}"? Будут удалены все связанные колонки.`)) return;

  const currentData = getActiveTableData();
  
  // Для таблиц вопросительных слов и предлогов - просто удаляем колонку
  if (activeTable === 'question-words' || activeTable === 'prepositions') {
    const newData = currentData.map(row => {
      const newRow = { ...row };
      delete newRow[language];
      return newRow;
    });
    
    setActiveTableData(newData);
    await saveActiveTable(newData);
  } 
  // Для существительных и прилагательных - старая логика
  else {
    const prefix = activeTable === 'nouns' ? 'База существительные' : 'База прилагательные';
    const columnsToRemove = [
      `${prefix} номер ${language}`,
      `${prefix} слова ${language}`,
      `${prefix} множественное ${language}`,
      `${prefix} мужской род ${language}`,
      `${prefix} женский род ${language}`,
      `${prefix} средний род ${language}`,
      `${prefix} множественное число ${language}`
    ].filter(col => {
      return currentData.length > 0 && Object.keys(currentData[0]).includes(col);
    });
  
    const newData = currentData.map(row => {
      const newRow = { ...row };
      columnsToRemove.forEach(col => delete newRow[col]);
      return newRow;
    });
  
    setActiveTableData(newData);
    await saveActiveTable(newData);
  }
  
  alert(`Язык "${language}" удален успешно!`);
};
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
const checkTranslationsForTheme = (theme, studiedLang, hintLang, database = 'nouns') => {
  // Используем переданную базу данных без изменения состояния
  const currentData = database === 'adjectives' ? adjectivesTableData : tableData;
  
  const words = getWordsForThemeFromData(theme, currentData, database);
  if (words.length === 0) {
    return { isValid: false, missingWords: [], message: 'В теме нет слов в выбранной базе данных' };
  }

  const missingWords = [];
  let hasAllTranslations = true;

  words.forEach((word, index) => {
    const hasStudiedTranslation = word.translations[studiedLang?.toLowerCase()];
    const hasHintTranslation = word.translations[hintLang?.toLowerCase()];
 
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

// Новая функция для получения слов из конкретных данных
const getWordsForThemeFromData = (theme, data, database) => {
  const words = [];
  let currentTheme = null;
  let collectingWords = false;
  
  // Для прилагательных используем мужской род как основной источник
  const wordPrefix = database === 'nouns' 
    ? 'База существительные слова' 
    : 'База прилагательные мужской род';

  data.forEach((row, index) => {
    if (row['Урок название'] && row['Урок название'] === theme) {
      currentTheme = theme;
      collectingWords = true;
      return;
    }
 
    if (row['Урок название'] && row['Урок название'] !== theme) {
      currentTheme = null;
      collectingWords = false;
      return;
    }
 
    if (collectingWords && row['База изображение'] && row['База изображение'].trim() !== '') {
      const translations = {};
     
      Object.keys(row).forEach(col => {
        if (col.includes(wordPrefix)) {
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
     
      words.push(wordObj);
    }
  });

  return words;
};
    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };
  const handleImageUpload = async () => {
    if (!selectedFile || currentImageRow === null) return;
    try {
        setUploadingImage(true);
        const imageUrl = await uploadImageToImgbb(selectedFile);
        const currentData = getActiveTableData();
        const newTableData = [...currentData];
        
        // Для разных таблиц используем разные названия колонок для картинок
        if (activeTable === 'nouns' || activeTable === 'adjectives') {
            newTableData[currentImageRow]['Картинка png'] = imageUrl;
        } else if (activeTable === 'question-words' || activeTable === 'prepositions') {
            newTableData[currentImageRow]['Картинка'] = imageUrl;
        }
        
        setActiveTableData(newTableData);
        await saveActiveTable(newTableData);
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
    const getAvailableLevels = () => {
        const currentData = getActiveTableData();
        const levels = new Set();
        currentData.forEach(row => {
            const v = row['Уровень изучения номер'];
            if (v && String(v).trim()) levels.add(v);
        });
        return Array.from(levels).sort();
    };
 const getAvailableThemes = () => {
  const nounsThemes = new Set();
  tableData.forEach(row => {
    const v = row['Урок название'];
    if (v && v.trim()) nounsThemes.add(v);
  });

  const adjThemes = new Set();
  adjectivesTableData.forEach(row => {
    const v = row['Урок название'];
    if (v && v.trim()) adjThemes.add(v);
  });

  // НЕ добавляем темы из вопросительных слов
  // const questionThemes = new Set(); - удаляем эту часть

  const allThemes = new Set([...nounsThemes, ...adjThemes]);
  return Array.from(allThemes).sort();
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

  const check = checkTranslationsForTheme(
    newLesson.theme,
    newLesson.studiedLanguage.charAt(0).toUpperCase() + newLesson.studiedLanguage.slice(1),
    newLesson.hintLanguage.charAt(0).toUpperCase() + newLesson.hintLanguage.slice(1),
    newLesson.checkDatabase || activeTable
  );
  
  return check.isValid;
};
 const createLesson = async () => {
  if (!isLessonFormValid()) {
    const { missingWords, message } = checkTranslationsForTheme(
      newLesson.theme,
      newLesson.studiedLanguage?.charAt(0).toUpperCase() + newLesson.studiedLanguage?.slice(1),
      newLesson.hintLanguage?.charAt(0).toUpperCase() + newLesson.hintLanguage?.slice(1),
      newLesson.checkDatabase || activeTable
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
    const currentData = getActiveTableData();
    let lessonNumber = '';
    let themeExistsInTable = false;
    
    console.log('Creating lesson with data:', newLesson); // ИСПРАВЛЕНО: используем newLesson вместо lessonData

    // Для вопросительных слов используем другую логику
    if (activeTable === 'question-words') {
      // Генерируем номер для вопросительных слов
      lessonNumber = generateNewLessonNumber();
    } else {
      // Старая логика для существительных и прилагательных
      for (const row of currentData) {
        if (row['Урок название'] === newLesson.theme) {
          lessonNumber = row['Урок номер'];
          themeExistsInTable = true;
          break;
        }
      }

      if (!themeExistsInTable) {
        lessonNumber = generateNewLessonNumber();
        const columns = currentData.length > 0 ? Object.keys(currentData[0]) : [...baseColumns];
        const newRow = {};
        columns.forEach(col => { newRow[col] = ''; });
        newRow['Уровень изучения номер'] = newLesson.level;
        newRow['Урок номер'] = lessonNumber;
        newRow['Урок название'] = newLesson.theme;

        const newTableData = [...currentData, newRow];
        setActiveTableData(newTableData);
        await saveActiveTable(newTableData);
      }
    }

    // Собираем данные для урока - ИСПРАВЛЕНО: переименовали переменную
    const lessonPayload = {
      title: newLesson.theme,
      level: newLesson.level,
      theme: newLesson.theme,
      studiedLanguage: newLesson.studiedLanguage.toLowerCase(), // сохраняем в нижнем регистре
      hintLanguage: newLesson.hintLanguage.toLowerCase(), // сохраняем в нижнем регистре
      fontColor: newLesson.fontColor,
      bgColor: newLesson.bgColor,
      lessonNumber: lessonNumber,
      words: getWordsForTheme(newLesson.theme),
      lessonType: newLesson.lessonType || 1
    };

    // Добавляем конфигурацию для типа урока 3 (предложения)
    if (newLesson.lessonType === 3) {
      lessonPayload.config = {
        columnsCount: newLesson.columnsCount || 2,
        columnConfigs: newLesson.columnConfigs || [
          { database: 'nouns', filters: {} }, 
          { database: 'nouns', filters: {} }
        ]
      };
    }

    console.log('Creating lesson with payload:', lessonPayload);

    // Вызов API для сохранения урока
    const response = await fetch(`${API_BASE_URL}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lessonPayload)
    });

    if (response.ok) {
      const savedLesson = await response.json();
      
      // Закрываем модальное окно и сбрасываем форму
      setShowCreateLessonModal(false);
      setNewLesson({
        studiedLanguage: 'русский',
        hintLanguage: 'турецкий',
        level: 'A1',
        theme: '',
        lessonType: 1,
        lessonNumber: '',
        fontColor: '#000000',
        bgColor: '#ffffff',
        columnsCount: 2,
        columnConfigs: [{ database: 'nouns', filters: {} }, { database: 'nouns', filters: {} }],
        checkDatabase: 'nouns'
      });
      
      // Обновляем список уроков
      await loadLessons();
      
      alert(`Урок "${newLesson.theme}" создан успешно!`);
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to create lesson');
    }

  } catch (error) {
    console.error('Error creating lesson:', error);
    alert('Ошибка создания урока: ' + error.message);
  }
};
 const isLessonHeader = (row) => {
  // Для вопросительных слов и предлогов не выделяем заголовки
  if (activeTable === 'question-words' || activeTable === 'prepositions') return false;
  
  return row && row['Уровень изучения номер'] && row['Урок номер'] && row['Урок название'];
};

const getMaxLessonNumber = () => {
  const currentData = getActiveTableData();
  let maxLessonNumber = 0;
  currentData.forEach(row => {
    if (isLessonHeader(row) && row['Урок номер']) {
      // ожидаем формат типа "1.1" или "2.3" — берём первую пару как число
      const raw = String(row['Урок номер']).replace(',', '.').trim();
      // парсим только первую часть с одной точкой: например "1.1" -> 1.1, "1.1.2" -> 1.1
      const parts = raw.split('.');
      if (parts.length >= 2) {
        // возьмём первые две части: major.minor
        const major = parts[0];
        const minor = parts[1];
        const combined = parseFloat(`${major}.${minor}`);
        if (!isNaN(combined) && combined > maxLessonNumber) maxLessonNumber = combined;
      } else {
        const num = parseFloat(raw) || 0;
        if (num > maxLessonNumber) maxLessonNumber = num;
      }
    }
  });
  return maxLessonNumber;
};
const getNounCases = async (imageBase) => {
  try {
    const response = await fetch(`${API_BASE_URL}/noun-cases/${imageBase}`);
    return await response.json();
  } catch (error) {
    return { singular: {}, plural: {} };
  }
};
const generateNewLessonNumber = () => {
  const max = getMaxLessonNumber();
  // +0.1 и оставляем одну цифру после запятой (строка)
  return (max + 0.1).toFixed(1);
};
const getAddedLanguages = () => {
  const currentData = getActiveTableData();
  if (currentData.length === 0) return [];
  
  // Для таблиц вопросительных слов и предлогов - все колонки кроме "Картинка"
  if (activeTable === 'question-words' || activeTable === 'prepositions') {
    const languages = new Set();
    Object.keys(currentData[0]).forEach(col => {
      if (col !== 'Картинка') {
        languages.add(col);
      }
    });
    return Array.from(languages).sort();
  } 
  // Для существительных и прилагательных - поиск по префиксу
  else {
    const languages = new Set();
    const prefix = activeTable === 'nouns' ? 'База существительные номер' : 'База прилагательные номер';
    
    Object.keys(currentData[0] || {}).forEach(col => {
      if (col.includes(prefix)) {
        const lang = col.split(' ').pop();
        languages.add(lang);
      }
    });
    return Array.from(languages);
  }
};
const getAvailableLanguages = () => {
  const added = getAddedLanguages();
  
  // Для таблиц вопросительных слов и предлогов - простой список
  if (activeTable === 'question-words' || activeTable === 'prepositions') {
    const allSimpleLanguages = [
      'Русский', 'Английский', 'Турецкий', 'Испанский', 'Немецкий', 
      'Французский', 'Итальянский', 'Китайский', 'Японский', 'Корейский',
      'Арабский', 'Хинди', 'Португальский', 'Голландский', 'Шведский',
      'Польский', 'Греческий', 'Иврит', 'Вьетнамский', 'Индонезийский'
    ];
    
    return allSimpleLanguages
      .filter(lang => !added.includes(lang))
      .map(lang => [lang, { number: lang, word: lang }]);
  }
  
  // Для существительных и прилагательных
  if (activeTable === 'nouns' || activeTable === 'adjectives') {
    const languagesConfig = activeTable === 'nouns' ? allLanguages : adjectivesAllLanguages;
    const available = Object.entries(languagesConfig).filter(([key, config]) =>
      !added.includes(config.number.split(' ').pop())
    );
    
    // ПРЕОБРАЗУЕМ ДЛЯ ВЫПАДАЮЩЕГО СПИСКА
    return available.map(([key, config]) => {
      const languageName = config.number.split(' ').pop();
      return [languageName, config];
    });
  }
  
  return [];
};
const addQuestion = async () => {
  try {
    // Проверка заполненности вопроса
    const isQuestionValid = newQuestion.questionStructure.every((data, index) => 
      data?.word && data.word.trim() !== ''
    );
    
    const isAnswerValid = newQuestion.requiresPairAnswer 
      ? newQuestion.answerStructure.every((data, index) => data?.word && data.word.trim() !== '')
      : true;

    if (!isQuestionValid || !isAnswerValid) {
      alert('Заполните все обязательные поля' + (newQuestion.requiresPairAnswer ? ' в вопросе и ответе' : ' в вопросе'));
      return;
    }

    const hintLanguage = lessonData?.hintLanguage || 'english';

    // НОРМАЛИЗАЦИЯ ВОПРОСА
    const normalizedQuestionStructure = newQuestion.questionStructure.map((data, index) => {
      const columnConfig = currentLessonForModule.config?.questionColumnConfigs?.[index];
      
      // Нормализуем слово
      let normalizedWord = data.word;
      if (index === 0) {
        // Первое слово вопроса с заглавной буквы
        normalizedWord = data.word.charAt(0).toUpperCase() + data.word.slice(1);
      } else {
        // Остальные слова вопроса строчными
        normalizedWord = data.word.toLowerCase();
      }
      
      if (data.wordData?.isSpecialWord) {
        return {
          word: normalizedWord,
          wordData: {
            translations: data.wordData.translations || {},
            isSpecialWord: true,
            database: data.wordData.database
          },
          database: columnConfig?.database || '',
          lesson: data.lesson || '',
          number: data.number || '',
          gender: data.gender || '',
          case: data.case || ''
        };
      }
      
      return {
        word: normalizedWord,
        wordData: {
          imageBase: data.wordData?.imageBase || data.wordData?.id || '',
          imagePng: data.wordData?.imagePng || '',
          translations: data.wordData?.translations || {}
        },
        database: columnConfig?.database || '',
        lesson: data.lesson || '',
        number: data.number || '',
        gender: data.gender || '',
        case: data.case || ''
      };
    });

    // НОРМАЛИЗАЦИЯ ОТВЕТА
    const normalizedAnswerStructure = newQuestion.requiresPairAnswer 
      ? newQuestion.answerStructure.map((data, index) => {
          const columnConfig = currentLessonForModule.config?.answerColumnConfigs?.[index];
          
          // Нормализуем слово
          let normalizedWord = data.word;
          if (index === 0) {
            // Первое слово ответа с заглавной буквы
            normalizedWord = data.word.charAt(0).toUpperCase() + data.word.slice(1);
          }
          
          if (data.wordData?.isSpecialWord) {
            return {
              word: normalizedWord,
              wordData: {
                translations: data.wordData.translations || {},
                isSpecialWord: true,
                database: data.wordData.database
              },
              database: columnConfig?.database || '',
              lesson: data.lesson || '',
              number: data.number || '',
              gender: data.gender || '',
              case: data.case || ''
            };
          }
          
          return {
            word: normalizedWord,
            wordData: {
              imageBase: data.wordData?.imageBase || data.wordData?.id || '',
              imagePng: data.wordData?.imagePng || '',
              translations: data.wordData?.translations || {}
            },
            database: columnConfig?.database || '',
            lesson: data.lesson || '',
            number: data.number || '',
            gender: data.gender || '',
            case: data.case || ''
          };
        })
      : newQuestion.answerStructure.map((data, index) => {
          // Даже если не показываем ответ, всё равно нормализуем
          const columnConfig = currentLessonForModule.config?.answerColumnConfigs?.[index];
          
          let normalizedWord = data.word;
          if (index === 0) {
            normalizedWord = data.word.charAt(0).toUpperCase() + data.word.slice(1);
          }
          
          if (data.wordData?.isSpecialWord) {
            return {
              word: normalizedWord,
              wordData: {
                translations: data.wordData.translations || {},
                isSpecialWord: true,
                database: data.wordData.database
              },
              database: columnConfig?.database || '',
              lesson: data.lesson || '',
              number: data.number || '',
              gender: data.gender || '',
              case: data.case || ''
            };
          }
          
          return {
            word: normalizedWord,
           wordData: {
  id: data.wordData?.id || '',
  word: data.wordData?.word || data.wordData?.displayWord || data.word,
  displayWord: data.wordData?.displayWord || data.word,
  imageBase: data.wordData?.imageBase || '',
  imagePng: data.wordData?.imagePng || '',
  translations: data.wordData?.translations || {}
},
            database: columnConfig?.database || '',
            lesson: data.lesson || '',
            number: data.number || '',
            gender: data.gender || '',
            case: data.case || ''
          };
        });

    // Генерируем автоматические переводы из нормализованной структуры
    const autoQuestionTranslation = generateAutoTranslation(normalizedQuestionStructure, hintLanguage, true);
    const autoAnswerTranslation = newQuestion.requiresPairAnswer 
      ? generateAutoTranslation(normalizedAnswerStructure, hintLanguage, false)
      : '';

    const questionData = {
      moduleId: currentLessonForModule._id,
      questionStructure: normalizedQuestionStructure,
      answerStructure: normalizedAnswerStructure,
      questionImage: newQuestion.questionImage,
      answerImage: newQuestion.answerImage,
      hint: newQuestion.hint,
      requiresPairAnswer: newQuestion.requiresPairAnswer !== false,
      // Нормализуем переводы тоже
      englishQuestion: newQuestion.englishQuestion 
        ? (newQuestion.englishQuestion.endsWith('?') ? newQuestion.englishQuestion : newQuestion.englishQuestion + '?')
        : autoQuestionTranslation,
      autoEnglishQuestion: autoQuestionTranslation,
      englishAnswer: newQuestion.englishAnswer || autoAnswerTranslation,
      autoEnglishAnswer: autoAnswerTranslation,
      translationLanguage: hintLanguage
    };

    console.log('Saving normalized question:', questionData);

    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionData)
    });

    if (response.ok) {
      const savedQuestion = await response.json();
      console.log('Question saved successfully:', savedQuestion);
      
      await loadModuleQuestions(currentLessonForModule._id);
      alert('Вопрос добавлен успешно!');
      
      saveQuestionSettings();
      resetQuestionFormWithSettings();
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to save question');
    }
  } catch (error) {
    console.error('Error saving question:', error);
    alert('Ошибка сохранения вопроса: ' + error.message);
  }
};
    const addWordToLesson = async (lessonRowIndex) => {
        const currentData = getActiveTableData();
        const lessonRow = currentData[lessonRowIndex];
        const lessonNumber = lessonRow['Урок номер'] || '0.0';
     
        let wordCount = 0;
        for (let i = lessonRowIndex + 1; i < currentData.length; i++) {
            const r = currentData[i];
            if (r['Уровень изучения номер'] && r['Урок номер']) break;
            if (r['База изображение']) wordCount++;
        }
     
        const wordNumber = wordCount + 1;
        const imageBase = `${lessonNumber}.${wordNumber}`;
        const wordValues = { 'База изображение': imageBase };
     
        if (currentData.length > 0) {
            const prefix = activeTable === 'nouns' ? 'База существительные' : 'База прилагательные';
            Object.keys(currentData[0]).forEach(col => {
                if (col.includes(`${prefix} номер`)) {
                    const language = col.split(' ').pop();
                    const wordCol = col.replace('номер', 'слова');
                 
                    const languageNumber = getLanguageNumber(language);
                    wordValues[col] = `${imageBase}.${languageNumber}`;
                    wordValues[wordCol] = '';
                  
                    // Для прилагательных добавляем дополнительные колонки
                    if (activeTable === 'adjectives') {
                        wordValues[`${prefix} мужской род ${language}`] = '';
                        wordValues[`${prefix} женский род ${language}`] = '';
                        wordValues[`${prefix} средний род ${language}`] = '';
                        wordValues[`${prefix} множественное число ${language}`] = '';
                    }
                }
            });
        }
      
        const newWordRow = createRow(Object.keys(currentData[0]), wordValues);
        const newTableData = [...currentData];
     
        let insertIndex = lessonRowIndex + 1;
        while (insertIndex < newTableData.length && !newTableData[insertIndex]['Урок номер']) insertIndex++;
     
        newTableData.splice(insertIndex, 0, newWordRow);
        setActiveTableData(newTableData);
        setShowAddWordModal(false);
        setCurrentLesson(null);
        await saveActiveTable(newTableData);
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
    const currentData = getActiveTableData();
    
    // Для вопросительных слов используем другую логику
    if (activeTable === 'question-words') {
        const words = [];
        let currentTheme = null;
        let collectingWords = false;
        
        currentData.forEach((row, index) => {
            if (row['Урок название'] && row['Урок название'] === theme) {
                currentTheme = theme;
                collectingWords = true;
                return;
            }
         
            if (row['Урок название'] && row['Урок название'] !== theme) {
                currentTheme = null;
                collectingWords = false;
                return;
            }
         
            if (collectingWords && row['Картинка'] && row['Картинка'].trim() !== '') {
                const translations = {};
             
                Object.keys(row).forEach(col => {
                    if (col.includes('Вопросительное слово')) {
                        const language = col.split(' ').pop().toLowerCase();
                        const translation = row[col] || '';
                        if (translation.trim() !== '') {
                            translations[language] = translation;
                        }
                    }
                });
             
                const wordObj = {
                    imageBase: row['Картинка'], // используем Картинка как ID
                    imagePng: row['Картинка'] || '',
                    translations: translations
                };
             
                words.push(wordObj);
            }
        });
     
        return words;
    } else {
        // Старая логика для существительных и прилагательных
        const words = [];
        let currentTheme = null;
        let collectingWords = false;
        
        const wordPrefix = activeTable === 'nouns' 
            ? 'База существительные слова' 
            : 'База прилагательные мужской род';

        currentData.forEach((row, index) => {
            if (row['Урок название'] && row['Урок название'] === theme) {
                currentTheme = theme;
                collectingWords = true;
                return;
            }
         
            if (row['Урок название'] && row['Урок название'] !== theme) {
                currentTheme = null;
                collectingWords = false;
                return;
            }
         
            if (collectingWords && row['База изображение'] && row['База изображение'].trim() !== '') {
                const translations = {};
             
                Object.keys(row).forEach(col => {
                    if (col.includes(wordPrefix)) {
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
             
                words.push(wordObj);
            }
        });
 
        return words;
    }
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
    const refreshLessonModules = async (lessonId) => {
    console.log('Refreshing modules for lesson:', lessonId);
    await loadLessonModules(lessonId);
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
                    {/* Кнопка переключения таблиц */}
                    <div className="flex bg-white rounded-lg border mr-4">
                        <button
                            onClick={() => setActiveTable('nouns')}
                            className={`px-4 py-2 rounded-l-lg ${
                                activeTable === 'nouns'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            Существительные
                        </button>
                        <button
                            onClick={() => setActiveTable('adjectives')}
                            className={`px-4 py-2 rounded-r-lg ${
                                activeTable === 'adjectives'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            Прилагательные
                        </button>
                        <button
    onClick={() => setActiveTable('question-words')}
    className={`px-4 py-2 rounded-r-lg ${
      activeTable === 'question-words'
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700'
    }`}
  >
    Вопросительные слова
  </button>
   <button
    onClick={() => setActiveTable('prepositions')}
    className={`px-4 py-2 rounded-r-lg ${
      activeTable === 'prepositions'
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700'
    }`}
  >
    Предлоги
  </button>
                    </div>
                    {/* Кнопка синхронизации тем */}
                  {/* {activeTable === 'adjectives' && (
    <>
        <button
            onClick={syncThemesToAdjectives}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            title="Синхронизировать темы из таблицы существительных"
        >
            🔄 Синхронизировать темы
        </button>
  
    </>
)} */}
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
     {/* Показываем секцию языков для всех таблиц кроме тех, где не нужно */}
{(activeTable !== 'question-words' && activeTable !== 'prepositions') && (
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
)}

{/* Для таблиц вопросительных слов и предлогов показываем упрощенную секцию */}
{(activeTable === 'question-words' || activeTable === 'prepositions') && (
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
)}
            <section className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
               <div className="flex justify-between items-center mb-4">
    <h3 className="font-semibold">
        {activeTable === 'nouns' ? 'Таблица существительных' : 
         activeTable === 'adjectives' ? 'Таблица прилагательных' : 
         activeTable === 'question-words' ? 'Таблица вопросительных слов' :
         'Таблица предлогов'}
    </h3>
    <div className="flex gap-2 flex-wrap">
        {/* Показываем кнопку "Новый урок" только для существительных и прилагательных */}
        {activeTable !== 'question-words' && activeTable !== 'prepositions' && (
            <button onClick={addNewLesson} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Новый урок</button>
        )}
        
        {/* Кнопка добавления языка для всех таблиц */}
        {availableLanguages.length > 0 && (
            <button onClick={() => setShowAddLanguageModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ Добавить язык</button>
        )}
        
        {/* Для вопросительных слов - кнопка добавления строки */}
        {activeTable === 'question-words' && (
            <button onClick={addNewQuestionWord} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Добавить слово</button>
        )}
        
        {/* Для предлогов - кнопка добавления строки */}
        {activeTable === 'prepositions' && (
            <button onClick={addNewPreposition} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Добавить предлог</button>
        )}
    </div>
</div>
                <div className="overflow-auto border rounded-lg" style={{ maxHeight: '70vh' }}>
                    <div className="min-w-full inline-block">
                        <table className="min-w-full border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr>
                                    <th className="border p-2 bg-gray-100 sticky left-0 z-20 whitespace-nowrap">Действия</th>
                                    {getActiveTableData().length > 0 && Object.keys(getActiveTableData()[0]).map(key => (
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
                            
                                {getActiveTableData().map((row, rowIndex) => (
                                    <tr key={rowIndex} className={isLessonHeader(row) ? 'bg-blue-50' : ''}>
                                      <td className="border p-1 bg-white sticky left-0 z-10">
    <div className="flex flex-col gap-1 min-w-24">
        {/* Для вопросительных слов и предлогов */}
        {(activeTable === 'question-words' || activeTable === 'prepositions') ? (
            <>
                <button onClick={() => openImageUploadModal(rowIndex)} className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 w-full">
                    📷 Картинка
                </button>
                <button
                    onClick={() => deleteRow(rowIndex)}
                    className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 w-full"
                >
                    Удалить
                </button>
            </>
        ) : isLessonHeader(row) ? (
            /* Для заголовков уроков */
            <div className="space-y-1">
                <button onClick={() => { setCurrentLesson(rowIndex); setShowAddWordModal(true); }} className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 w-full">+ Слово</button>
                <button
                    onClick={() => deleteRow(rowIndex)}
                    className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 w-full"
                >
                    Удалить тему
                </button>
            </div>
        ) : row['База изображение'] ? (
            /* Для обычных слов (существительных и прилагательных) */
            <div className="space-y-1">
                <button onClick={() => openImageUploadModal(rowIndex)} className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 w-full">
                    📷 Картинка
                </button>
                <button
                    onClick={() => deleteRow(rowIndex)}
                    className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 w-full"
                >
                    Удалить
                </button>
                {activeTable === 'nouns' && (
                    <button
                        onClick={() => {
                            setSelectedWord({
                                imageBase: row['База изображение'],
                                translations: { russian: row['База существительные слова Русский'] },
                                word: row['База существительные слова Русский']
                            });
                            setShowCaseModal(true);
                        }}
                        className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 w-full"
                        title="Управление падежами"
                    >
                        📝 Падежи
                    </button>
                )}
            
{activeTable === 'adjectives' && (
  <button
    onClick={() => {
      const displayWord = row['База прилагательные мужской род Русский'] || 
                         row['База прилагательные слова Русский'] || 
                         row['База прилагательные слова Английский'] ||
                         'Прилагательное';
      
      setSelectedAdjective({
        imageBase: row['База изображение'],
        translations: { russian: displayWord },
        word: displayWord
      });
      setShowAdjectiveCaseModal(true);
    }}
    className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 w-full"
    title="Управление падежами (только для русского языка)"
  >
    📝 Падежи (русский)
  </button>
)}
            </div>
        ) : (
            /* Для пустых строк или других случаев */
            <div className="text-xs text-gray-400">—</div>
        )}
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
                {/* Для всех таблиц показываем картинку если есть */}
                {(colKey === 'Картинка png' || colKey === 'Картинка') && row[colKey] ? (
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
                {getActiveTableData().length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>Таблица пуста. Нажмите "Обновить" для загрузки данных.</p>
                    </div>
                )}
            </section>
            {/* Модальные окна остаются без изменений */}
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
                                Быстрый тест по уроку
                            </button>
                        </div>
                       
                        {/* Рендерим модули для этого урока */}
                        {renderLessonModules(lesson)}
                    </div>
                )).reverse()}
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
{showAdjectiveCaseModal && (
  <AdjectiveCaseManagementModal
    isOpen={showAdjectiveCaseModal}
    onClose={() => setShowAdjectiveCaseModal(false)}
    word={selectedAdjective}
    onSave={() => {
      console.log('Падежи прилагательного сохранены');
    }}
     language="русский" 
  />
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
    <div className="bg-white p-6 rounded-lg w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
      <h3 className="text-2xl font-bold mb-4 text-center">Создать урок</h3>
   
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {/* Изучаемый язык */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Изучаемый язык</label>
          <select
            value={newLesson.studiedLanguage}
            onChange={(e) => setNewLesson({...newLesson, studiedLanguage: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white text-sm"
          >
            <option value="">-- Выберите язык --</option>
            {addedLanguages.map(lang => (
              <option key={lang} value={lang.toLowerCase()}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        {/* Язык подсказки */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Язык подсказки</label>
          <select
            value={newLesson.hintLanguage}
            onChange={(e) => setNewLesson({...newLesson, hintLanguage: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white text-sm"
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
          <label className="text-sm font-medium text-right">Уровень</label>
          <select
            value={newLesson.level}
            onChange={(e) => setNewLesson({...newLesson, level: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white text-sm"
          >
            <option value="">-- Выберите уровень --</option>
            {['A0','A0+','A1','A2','A2+', 'B1', 'B1+','B2', 'C1', 'C2'].map(level => (
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
            value={newLesson.theme || ''}
            onChange={(e) => setNewLesson({...newLesson, theme: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white text-sm"
          >
            <option value="">-- Выберите тему --</option>
            {getAvailableThemes().map(theme => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </div>
        
        {/* БАЗА ДАННЫХ ДЛЯ ПРОВЕРКИ СЛОВ */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">База для проверки</label>
          <select
            value={newLesson.checkDatabase || activeTable}
            onChange={(e) => setNewLesson({...newLesson, checkDatabase: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white text-sm"
          >
            <option value="nouns">Существительные</option>
            <option value="adjectives">Прилагательные</option>
          </select>
        </div>

        {/* Тип урока */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Тип урока</label>
          <select
            value={newLesson.lessonType || ''}
            onChange={(e) => setNewLesson({...newLesson, lessonType: parseInt(e.target.value)})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white text-sm"
          >
            <option value="1">1 - Лексика</option>
            <option value="2">2 - Тест лексика</option>
            <option value="3">3 - Фразы</option>
            <option value="5">4 - Вопросы</option>
          </select>
        </div>
        {/* Номер урока */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Номер урока</label>
          <input
            type="text"
            value={newLesson.lessonNumber || ''}
            onChange={(e) => setNewLesson({...newLesson, lessonNumber: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white text-sm"
            placeholder="Автоматически генерируется"
            disabled
          />
        </div>
        {/* Для типа 3: Количество колонок и БД */}
        {newLesson.lessonType === 3 && (
          <>
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm font-medium text-right">Количество колонок</label>
              <input
                type="number"
                min="2"
                max="10"
                value={newLesson.columnsCount || ''}
                onChange={(e) => {
                  const count = parseInt(e.target.value) || 2;
                  const newConfigs = Array.from({ length: count }, (_, i) =>
                    newLesson.columnConfigs[i] || { database: 'nouns', filters: {} }
                  );
                  setNewLesson({
                    ...newLesson,
                    columnsCount: count,
                    columnConfigs: newConfigs
                  });
                }}
                className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white text-sm"
              />
            </div>
            {Array.from({ length: newLesson.columnsCount || 2 }).map((_, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm font-medium text-right">Колонка {index + 1} БД</label>
                <select
                  value={newLesson.columnConfigs[index]?.database || 'nouns'}
                  onChange={(e) => {
                    const updatedConfigs = [...newLesson.columnConfigs];
                    updatedConfigs[index] = {
                      ...updatedConfigs[index],
                      database: e.target.value,
                      filters: {}
                    };
                    setNewLesson({
                      ...newLesson,
                      columnConfigs: updatedConfigs
                    });
                  }}
                  className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white text-sm"
                >
                  <option value="nouns">Существительные</option>
                  <option value="adjectives">Прилагательные</option>
                  <option value="verbs">Глаголы</option>
                </select>
              </div>
            ))}
          </>
        )}
        {/* Проверка переводов */}
        {newLesson.theme && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <h4 className="font-semibold mb-2 text-sm">
              Проверка переводов для темы "{newLesson.theme}" 
              <span className="text-xs font-normal text-gray-600 ml-2">
                (из базы: {newLesson.checkDatabase === 'nouns' ? 'существительные' : 'прилагательные'})
              </span>
            </h4>
            {(() => {
              const check = checkTranslationsForTheme(
                newLesson.theme,
                newLesson.studiedLanguage?.charAt(0).toUpperCase() + newLesson.studiedLanguage?.slice(1),
                newLesson.hintLanguage?.charAt(0).toUpperCase() + newLesson.hintLanguage?.slice(1),
                newLesson.checkDatabase || activeTable // Передаем выбранную базу данных
              );
              return check.isValid ? (
                <p className="text-green-600 text-sm">✓ Все переводы присутствуют</p>
              ) : (
                <>
                  <p className="text-red-600 mb-2 text-sm">{check.message}</p>
                  {check.missingWords.length > 0 ? (
                    <ul className="list-disc pl-4 text-xs text-red-600 max-h-20 overflow-y-auto">
                      {check.missingWords.map((w, index) => (
                        <li key={index} className="mb-1">
                          Слово "{w.word}":
                          {w.missingStudied ? ` нет ${newLesson.studiedLanguage}` : ''}
                          {w.missingStudied && w.missingHint ? ', ' : ''}
                          {w.missingHint ? ` нет ${newLesson.hintLanguage}` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-red-600 text-sm">В выбранной теме нет слов в указанной базе данных</p>
                  )}
                  <p className="text-gray-600 mt-2 text-xs">Исправьте переводы в таблице или выберите другую базу данных</p>
                </>
              );
            })()}
          </div>
        )}
        {/* Цвет шрифта */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Цвет шрифта</label>
          <div className="col-span-2 flex items-center gap-2">
            <input
              type="color"
              value={newLesson.fontColor}
              onChange={(e) => setNewLesson({...newLesson, fontColor: e.target.value})}
              className="h-8 w-12 cursor-pointer"
            />
            <span className="text-xs text-gray-600">{newLesson.fontColor}</span>
          </div>
        </div>
        {/* Цвет фона */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Цвет фона</label>
          <div className="col-span-2 flex items-center gap-2">
            <input
              type="color"
              value={newLesson.bgColor}
              onChange={(e) => setNewLesson({...newLesson, bgColor: e.target.value})}
              className="h-8 w-12 cursor-pointer"
            />
            <span className="text-xs text-gray-600">{newLesson.bgColor}</span>
          </div>
        </div>
      </div>
      {/* Кнопки - фиксированные внизу */}
      <div className="flex justify-center pt-4 gap-4 border-t mt-4">
        <button
          onClick={() => setShowCreateLessonModal(false)}
          className="px-6 py-2 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600"
        >
          Отмена
        </button>
     
        <button
          onClick={createLesson}
          disabled={!isLessonFormValid()}
          className="px-6 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Создать урок
        </button>
      </div>
    </div>
  </div>
)}{showCaseModal && (
  <CaseManagementModal
    isOpen={showCaseModal}
    onClose={() => setShowCaseModal(false)}
    word={selectedWord}
    onSave={() => {
      // Можно добавить обновление данных если нужно
      console.log('Падежи сохранены');
    }}
  />
)}
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
          <select 
            value={newLanguage} 
            onChange={(e) => setNewLanguage(e.target.value)} 
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Выберите язык --</option>
            
            {/* Для таблиц вопросительных слов и предлогов - простой список */}
            {(activeTable === 'question-words' || activeTable === 'prepositions') && (
              <>
                <option value="Русский">Русский</option>
                <option value="Английский">Английский</option>
                <option value="Турецкий">Турецкий</option>
                <option value="Испанский">Испанский</option>
                <option value="Немецкий">Немецкий</option>
                <option value="Французский">Французский</option>
                <option value="Итальянский">Итальянский</option>
                <option value="Китайский">Китайский</option>
                <option value="Японский">Японский</option>
                <option value="Корейский">Корейский</option>
                <option value="Арабский">Арабский</option>
                <option value="Хинди">Хинди</option>
                <option value="Португальский">Португальский</option>
                <option value="Голландский">Голландский</option>
                <option value="Шведский">Шведский</option>
                <option value="Польский">Польский</option>
                <option value="Греческий">Греческий</option>
                <option value="Иврит">Иврит</option>
                <option value="Вьетнамский">Вьетнамский</option>
                <option value="Индонезийский">Индонезийский</option>
              </>
            )}
            
            {/* Для существительных и прилагательных - сложные конфигурации */}
            {(activeTable === 'nouns' || activeTable === 'adjectives') && 
              getAvailableLanguages().map(([languageName, config]) => 
                <option key={languageName} value={languageName}>
                  {languageName}
                </option>
              )
            }
          </select>
        </div>
        
      {newLanguage && activeTable === 'adjectives' && (
  <div className="p-3 bg-gray-50 rounded">
    <p className="text-sm font-medium">Будут созданы колонки:</p>
    
    {(() => {
      const languageName = newLanguage;
      const langConfig = getAdjectiveLanguageConfig(languageName);
      
      // Находим конфигурацию в adjectivesAllLanguages
      const languageConfig = Object.values(adjectivesAllLanguages).find(config => 
        config.number.includes(languageName)
      );
      
      if (!languageConfig) {
        return <p className="text-yellow-600">Конфигурация будет создана автоматически</p>;
      }
      
      return (
        <>
          <p className="text-blue-600 font-semibold text-sm">{languageConfig.number}</p>
          
          {/* Показываем только те колонки, которые нужны для языка */}
          {langConfig.columns.includes('word') && languageConfig.word && (
            <p className="text-green-600 font-semibold text-sm">{languageConfig.word}</p>
          )}
          
          {langConfig.columns.includes('masculine') && languageConfig.masculine && (
            <p className="text-green-600 font-semibold text-sm">{languageConfig.masculine}</p>
          )}
          
          {langConfig.columns.includes('feminine') && languageConfig.feminine && (
            <p className="text-green-600 font-semibold text-sm">{languageConfig.feminine}</p>
          )}
          
          {langConfig.columns.includes('neuter') && languageConfig.neuter && (
            <p className="text-green-600 font-semibold text-sm">{languageConfig.neuter}</p>
          )}
          
          {langConfig.columns.includes('plural') && languageConfig.plural && (
            <p className="text-green-600 font-semibold text-sm">{languageConfig.plural}</p>
          )}
          
          <p className="text-xs text-gray-500 mt-2">
            Конфигурация: {langConfig.columns.join(', ')}<br/>
            Род: {langConfig.hasGender ? 'да' : 'нет'}, 
            Число: {langConfig.hasNumber ? 'да' : 'нет'}, 
            Падежи: {langConfig.hasCases ? 'да' : 'нет'}
          </p>
        </>
      );
    })()}
  </div>
)}
      </div>
      
      <div className="mt-6 flex gap-2 justify-end">
        <button 
          onClick={() => setShowAddLanguageModal(false)} 
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Отмена
        </button>
        <button 
          onClick={handleAddLanguage}
          disabled={!newLanguage} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Добавить язык
        </button>
      </div>
    </div>
  </div>
)}
      {showAddWordModal && currentLesson !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Добавить слово к уроку: {tableData[currentLesson]?.['Урок название']}</h3>
            <p className="text-gray-600 mb-4">Будет создено новое слово с автоматической нумерацией для всех добавленных языков.</p>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => { setShowAddWordModal(false); setCurrentLesson(null); }} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Отмена</button>
              <button onClick={() => addWordToLesson(currentLesson)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Добавить слово</button>
            </div>
          </div>
        </div>
      )}
      {showPodcastModal && currentLessonForModule && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-2xl font-bold mb-6 text-center">Добавить подкаст</h3>
      
      <div className="space-y-6">
        {/* Название подкаста */}
        <div>
          <label className="block text-sm font-medium mb-2">Название подкаста</label>
          <input
            type="text"
            value={newPodcast.title}
            onChange={(e) => setNewPodcast({...newPodcast, title: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Введите название подкаста"
          />
        </div>

        {/* Загрузка аудио файла */}
        <div>
          <label className="block text-sm font-medium mb-2">Аудио файл</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setNewPodcast({
                    ...newPodcast,
                    audioFile: file,
                    audioPreview: URL.createObjectURL(file)
                  });
                  
                  // Можно добавить автоматическое определение длительности
                  const audio = new Audio(URL.createObjectURL(file));
                  audio.onloadedmetadata = () => {
                    setNewPodcast(prev => ({
                      ...prev,
                      duration: Math.round(audio.duration)
                    }));
                  };
                }
              }}
              className="hidden"
              id="audio-upload"
            />
            <label htmlFor="audio-upload" className="cursor-pointer block">
              {newPodcast.audioFile ? (
                <div className="space-y-2">
                  <div className="text-green-600">
                    <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="font-medium">{newPodcast.audioFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(newPodcast.audioFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  {newPodcast.duration > 0 && (
                    <p className="text-sm text-gray-500">
                      Длительность: {Math.floor(newPodcast.duration / 60)}:{(newPodcast.duration % 60).toString().padStart(2, '0')}
                    </p>
                  )}
                  {newPodcast.audioPreview && (
                    <div className="mt-4">
                      <audio controls className="w-full">
                        <source src={newPodcast.audioPreview} type={newPodcast.audioFile.type} />
                      </audio>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-gray-400">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="font-medium">Нажмите для загрузки аудио файла</p>
                  <p className="text-sm text-gray-500">
                    Поддерживаемые форматы: MP3, WAV, OGG, M4A
                  </p>
                  <p className="text-sm text-gray-500">Максимальный размер: 50MB</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Титры на оригинальном языке */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Титры на {lessonData?.studiedLanguage ? lessonData.studiedLanguage.toUpperCase() : 'ОРГИГИНАЛЬНОМ'} языке
          </label>
          <textarea
            value={newPodcast.originalTranscript}
            onChange={(e) => setNewPodcast({...newPodcast, originalTranscript: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2 h-40"
            placeholder="Введите текст титров..."
          />
        </div>

        {/* Титры на языке подсказки */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Титры на {lessonData?.hintLanguage ? lessonData.hintLanguage.toUpperCase() : 'АНГЛИЙСКОМ'} языке
            <span className="text-gray-500 text-sm font-normal ml-2">(необязательно)</span>
          </label>
          <textarea
            value={newPodcast.hintTranscript}
            onChange={(e) => setNewPodcast({...newPodcast, hintTranscript: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2 h-40"
            placeholder="Введите перевод титров..."
          />
        </div>

        {/* Подсказка */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Подсказка
            <span className="text-gray-500 text-sm font-normal ml-2">(необязательно)</span>
          </label>
          <textarea
            value={newPodcast.hint}
            onChange={(e) => setNewPodcast({...newPodcast, hint: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2 h-32"
            placeholder="Введите подсказку для студента..."
          />
        </div>

        {/* Кнопки управления */}
        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={() => {
              setShowPodcastModal(false);
              if (newPodcast.audioPreview) {
                URL.revokeObjectURL(newPodcast.audioPreview);
              }
            }}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            onClick={addPodcast}
            disabled={!newPodcast.title || !newPodcast.audioFile || !newPodcast.originalTranscript}
            className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Добавить подкаст
          </button>
        </div>

        {/* Список существующих подкастов */}
        <div className="mt-8">
          <h4 className="font-semibold mb-3">Существующие подкасты:</h4>
          {modulePodcasts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Нет добавленных подкастов
            </div>
          ) : (
            <div className="space-y-4">
              {modulePodcasts.map((podcast, index) => (
                <div key={podcast._id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium">{podcast.title}</h5>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <span>Длительность: {Math.floor(podcast.duration / 60)}:{(podcast.duration % 60).toString().padStart(2, '0')}</span>
                        <span>•</span>
                        <span>{(podcast.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePodcast(podcast._id)}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Удалить
                    </button>
                  </div>
                  
                  <div className="mt-3">
                    <audio controls className="w-full">
                      <source src={podcast.audioUrl} type={podcast.mimeType} />
                    </audio>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <h6 className="text-sm font-medium mb-1">Оригинальные титры:</h6>
                      <p className="text-sm text-gray-600 line-clamp-3">{podcast.originalTranscript}</p>
                    </div>
                    
                    {podcast.hintTranscript && (
                      <div>
                        <h6 className="text-sm font-medium mb-1">Перевод:</h6>
                        <p className="text-sm text-gray-600 line-clamp-3">{podcast.hintTranscript}</p>
                      </div>
                    )}
                  </div>
                  
                  {podcast.hint && (
                    <div className="mt-2 pt-2 border-t">
                      <h6 className="text-sm font-medium mb-1">Подсказка:</h6>
                      <p className="text-sm text-gray-600">{podcast.hint}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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
            {['A0','A0+','A1','A2','A2+', 'B1', 'B1+','B2', 'C1', 'C2'].map(level => (
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
        {newLesson.theme && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold mb-3">Выберите слова для теста (минимум 2):</h4>
            <div className="max-h-40 overflow-y-auto">
          <WordSelector
  studiedLanguage={newLesson.studiedLanguage || 'русский'}
  theme={newLesson.theme}
  database="nouns" 
  filters={{}}  
  onWordSelect={(selectedWord) => {
    setSelectedWords(prev => {
      const wordId = selectedWord.imageBase || selectedWord.id;
      
      // Проверяем, есть ли уже это слово
      const isAlreadySelected = prev.some(w => 
        (w.imageBase || w.id) === wordId
      );
      
      if (isAlreadySelected) {
        // Удаляем если уже есть
        return prev.filter(w => (w.imageBase || w.id) !== wordId);
      } else {
        // Добавляем если нет
        return [...prev, selectedWord];
      }
    });
  }}
  selectedWord={null}
  selectedWords={selectedWords} // ← ДОБАВЬТЕ ЭТОТ ПРОПС
/>
            </div>
            {/* Отображение выбранных слов */}
            <div className="mt-4 space-y-2">
              {selectedWords.map((word, idx) => (
                <div key={idx} className="p-2 bg-green-50 border border-green-200 rounded flex items-center justify-between">
                  <span className="font-medium text-green-800">
                    {word.displayWord || word.word}
                  </span>
                  <button
                    onClick={() => setSelectedWords(prev => prev.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Выбрано слов: {selectedWords.length}
              {selectedWords.length < 2 && (
                <span className="text-red-500 ml-2">* Необходимо выбрать минимум 2 слова</span>
              )}
            </div>
          </div>
        )}
        {/* Проверка переводов */}
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
  {showQuestionModal && currentLessonForModule && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-2xl font-bold mb-6 text-center">Добавить вопрос</h3>
      
      {/* ПЕРЕКЛЮЧАТЕЛЬ ТРЕБУЕТСЯ ЛИ ОТВЕТ */}
      <div className="mb-6 p-4 border rounded bg-blue-50">
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-semibold text-lg">Тип вопроса</h4>
      <p className="text-sm text-gray-600">
        {newQuestion.requiresPairAnswer 
          ? 'Вопрос требует парного ответа (вопрос-ответ)' 
          : 'Вопрос не требует ответа (одиночный вопрос)'}
      </p>
    </div>
    <div className="flex items-center">
      <span className="mr-3 text-sm font-medium">
        {newQuestion.requiresPairAnswer ? 'С ответом' : 'Без ответа'}
      </span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={newQuestion.requiresPairAnswer}
          onChange={(e) => setNewQuestion({
            ...newQuestion,
            requiresPairAnswer: e.target.checked
          })}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  </div>
</div>

      <div className="grid grid-cols-2 gap-6">
        {/* Левая колонка - Вопрос */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg border-b pb-2">Вопрос</h4>
          
          {currentLessonForModule.config?.questionColumnConfigs?.map((config, index) => (
            <div key={index} className="p-4 border rounded bg-gray-50">
              <h5 className="font-medium mb-3">
                Колонка {index + 1} - {getDatabaseDisplayName(config.database)}
              </h5>
              
              <QuestionColumn 
                config={config}
                columnIndex={index}
                structure={newQuestion.questionStructure}
                onStructureChange={(updatedStructure) => setNewQuestion({
                  ...newQuestion,
                  questionStructure: updatedStructure
                })}
                lessonData={lessonData}
                isAnswer={false}
                getAvailableThemes={getAvailableThemes}
              />
            </div>
          ))}
          
          {/* Картинка вопроса */}
          <div className="p-4 border rounded bg-gray-50">
  <h5 className="font-medium mb-2">Картинка вопроса</h5>
  <div className="space-y-3">
    {newQuestion.questionImage && (
      <div className="relative inline-block">
        <img
          src={newQuestion.questionImage}
          alt="Preview"
          className="h-32 w-32 object-cover rounded border"
        />
        <button
          onClick={() => setNewQuestion({...newQuestion, questionImage: ''})}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
        >
          ×
        </button>
      </div>
    )}
    
  {/* В модальном окне вопроса, в секции загрузки изображения */}
<div className="flex items-center gap-3">
  <div className="flex-1">
    <input
      type="text"
      value={newQuestion.questionImage}
      onChange={(e) => setNewQuestion({...newQuestion, questionImage: e.target.value})}
      placeholder="URL картинки или загрузите файл"
      className="w-full border border-gray-300 rounded px-3 py-2"
    />
  </div>
  <div className="relative">
    <input
      type="file"
      accept="image/*"
      onChange={async (e) => await handleOptimizedImageUpload(e, 'question')}
      className="hidden"
      id={`upload-question-image-${Date.now()}`}
    />
    <label 
      htmlFor={`upload-question-image-${Date.now()}`}
      className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap flex items-center gap-2"
    >
      {uploadingImage && uploadingImageType === 'question' ? (
        <>
          <span className="animate-spin">⏳</span> Загрузка...
        </>
      ) : (
        <>
          <span>📁</span> Загрузить
        </>
      )}
    </label>
  </div>
</div>
  </div>
</div>

        </div>

        {/* Правая колонка - Ответ (показывается только если requiresPairAnswer = true) */}
    <div className="space-y-4">
  <h4 className="font-semibold text-lg border-b pb-2">
    Ответ {!newQuestion.requiresPairAnswer && <span className="text-sm text-gray-500">(сохраняется, но не показывается)</span>}
  </h4>
  
  {!newQuestion.requiresPairAnswer && (
    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-3">
      <p className="text-sm text-yellow-700">
        ⓘ Ответ будет сохранён в базе данных, но не будет показан пользователю в приложении
      </p>
    </div>
  )}
  
  {currentLessonForModule.config?.answerColumnConfigs?.map((config, index) => (
    <div key={index} className="p-4 border rounded bg-gray-50">
      <h5 className="font-medium mb-3">
        Колонка {index + 1} - {getDatabaseDisplayName(config.database)}
      </h5>
      
      <QuestionColumn 
        config={config}
        columnIndex={index}
        structure={newQuestion.answerStructure}
        onStructureChange={(updatedStructure) => setNewQuestion({
          ...newQuestion,
          answerStructure: updatedStructure
        })}
        lessonData={lessonData}
        isAnswer={true}
        getAvailableThemes={getAvailableThemes}
      />
    </div>
  ))}
  
  {/* Картинка ответа */}
  <div className="p-4 border rounded bg-gray-50">
  <h5 className="font-medium mb-2">Картинка ответа</h5>
  <div className="space-y-3">
    {newQuestion.answerImage && (
      <div className="relative inline-block">
        <img
          src={newQuestion.answerImage}
          alt="Preview"
          className="h-32 w-32 object-cover rounded border"
        />
        <button
          onClick={() => setNewQuestion({...newQuestion, answerImage: ''})}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
        >
          ×
        </button>
      </div>
    )}
    
  <div className="flex items-center gap-3">
  <div className="flex-1">
    <input
      type="text"
      value={newQuestion.answerImage}
      onChange={(e) => setNewQuestion({...newQuestion, answerImage: e.target.value})}
      placeholder="URL картинки или загрузите файл"
      className="w-full border border-gray-300 rounded px-3 py-2"
    />
  </div>
  <div className="relative">
    <input
      type="file"
      accept="image/*"
      onChange={async (e) => await handleOptimizedImageUpload(e, 'answer')}
      className="hidden"
      id={`upload-answer-image-${Date.now()}`}
    />
    <label 
      htmlFor={`upload-answer-image-${Date.now()}`}
      className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap flex items-center gap-2"
    >
      {uploadingImage && uploadingImageType === 'answer' ? (
        <>
          <span className="animate-spin">⏳</span> Загрузка...
        </>
      ) : (
        <>
          <span>📁</span> Загрузить
        </>
      )}
    </label>
  </div>
</div>
  </div>
</div>
</div>
      </div>

      {/* Секции перевода (обновленные) */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Перевод вопроса */}
      <div className="p-4 border rounded bg-blue-50">
  <h5 className="font-medium mb-2">
    Перевод вопроса на {lessonData?.hintLanguage ? lessonData.hintLanguage.toUpperCase() : 'АНГЛИЙСКИЙ'}
  </h5>
  
  {/* Автоматический перевод */}
  <div className="mb-3 p-2 bg-white rounded border">
    <label className="text-sm text-gray-600 mb-1 block">Автоматический перевод:</label>
    <div className="text-gray-800 p-2 bg-gray-50 rounded">
      {autoTranslations.question || '—'}
    </div>
    <div className="text-xs text-green-600 mt-1">
      ✓ Вопросительный знак добавлен автоматически
    </div>
  </div>
  
  {/* Редактируемое поле */}
  <div>
    <label className="text-sm text-gray-600 mb-1 block">Исправленный перевод:</label>
    <textarea
        value={newQuestion.englishQuestion || autoTranslations.question || ''}
      onChange={(e) => setNewQuestion({
        ...newQuestion, 
        englishQuestion: e.target.value
      })}
      placeholder={`Введите исправленный перевод на ${lessonData?.hintLanguage || 'английский'}`}
      className="w-full border border-gray-300 rounded px-3 py-2 h-20"
    />
    <p className="text-xs text-gray-500 mt-1">
      Вопросительный знак будет добавлен автоматически при сохранении
    </p>
  </div>
</div>

        {/* Перевод ответа (только если есть ответ) */}
        {newQuestion.requiresPairAnswer && (
          <div className="p-4 border rounded bg-green-50">
            <h5 className="font-medium mb-2">
              Перевод ответа на {lessonData?.hintLanguage ? lessonData.hintLanguage.toUpperCase() : 'АНГЛИЙСКИЙ'}
            </h5>
            <textarea
             value={newQuestion.englishAnswer || autoTranslations.answer || ''} 
              onChange={(e) => setNewQuestion({
                ...newQuestion, 
                englishAnswer: e.target.value
              })}
              placeholder={`Введите перевод на ${lessonData?.hintLanguage || 'английский'}`}
              className="w-full border border-gray-300 rounded px-3 py-2 h-20"
            />
          </div>
        )}
      </div>

      {/* Подсказка */}
      <div className="mt-4 p-4 border rounded bg-gray-50">
        <h5 className="font-medium mb-2">Подсказка</h5>
        <textarea
          value={newQuestion.hint}
          onChange={(e) => setNewQuestion({...newQuestion, hint: e.target.value})}
          placeholder="Введите подсказку (необязательно)"
          className="w-full border border-gray-300 rounded px-3 py-2 h-20"
        />
      </div>

      {/* Кнопки управления */}
      <div className="mt-6 flex gap-2 justify-end">
        <button
          onClick={() => {
            setShowQuestionModal(false);
            resetQuestionForm();
           
          }}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Отмена
        </button>
        <button
          onClick={addQuestion}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Добавить вопрос
        </button>
      </div>

      {/* Таблица существующих вопросов */}
      <div className="mt-6">
        <h4 className="font-semibold mb-3">Существующие вопросы:</h4>
        {moduleQuestions.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Нет добавленных вопросов
          </div>
        ) : (
          <div className="space-y-4">
            {moduleQuestions.map((question, index) => (
              <div key={question._id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium">Вопрос {index + 1}</h5>
                    <span className={`text-xs px-2 py-1 rounded ${
                      question.requiresPairAnswer === false 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {question.requiresPairAnswer === false ? 'Без ответа' : 'С ответом'}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteQuestion(question._id)}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Удалить
                  </button>
                </div>
                
                <div className={`${question.requiresPairAnswer === false ? 'grid-cols-1' : 'grid-cols-2'} grid gap-4`}>
                  <div>
                    <h6 className="text-sm font-medium mb-1">Вопрос:</h6>
                  <div className="flex flex-wrap gap-1">
  {question.questionStructure && question.questionStructure.map((item, idx) => (
    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
      {item.word}
    </span>
  ))}
  {/* Автоматически добавляем вопросительный знак */}
  {!question.questionStructure?.some(item => item.word?.includes('?')) && (
    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">?</span>
  )}
</div>
                    {question.englishQuestion && (
                      <div className="mt-1 text-xs text-gray-600">
                        {lessonData?.hintLanguage?.toUpperCase() || 'EN'}: {question.englishQuestion}
                      </div>
                    )}
                  </div>
                  
                  {question.requiresPairAnswer !== false && (
                    <div>
                      <h6 className="text-sm font-medium mb-1">Ответ:</h6>
                      <div className="flex flex-wrap gap-1">
                        {question.answerStructure && question.answerStructure.map((item, idx) => (
                          <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            {item.word}
                          </span>
                        ))}
                      </div>
                      {question.englishAnswer && (
                        <div className="mt-1 text-xs text-gray-600">
                          {lessonData?.hintLanguage?.toUpperCase() || 'EN'}: {question.englishAnswer}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {question.hint && (
                  <div className="mt-2">
                    <h6 className="text-sm font-medium mb-1">Подсказка:</h6>
                    <p className="text-sm text-gray-600">{question.hint}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)}
   {showCreateModuleModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-2xl font-bold mb-6 text-center">Создать модуль урока</h3>
    
      <div className="space-y-6">
        {/* Тип урока */}
        <div className="grid grid-cols-2 gap-4 items-center">
          <label className="text-sm font-medium text-right">Тип урока</label>
          <select
            value={newModule.typeId}
            onChange={(e) => {
              const typeId = parseInt(e.target.value);
              setNewModule({
                ...newModule,
                typeId: typeId,
                // Сброс конфигурации при смене типа
                columnsCount: typeId === 3 ? 2 : 0,
                columnConfigs: typeId === 3 ? [{ database: 'nouns', filters: {} }, { database: 'adjectives', filters: {} }] : []
              });
            }}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="">-- Выберите тип --</option>
            {lessonTypes.map(type => (
              <option key={type.typeId} value={type.typeId}>
                {type.typeId} - {type.name}
              </option>
            ))}
              

          </select>
        </div>

        {/* Название модуля */}
        <div className="grid grid-cols-2 gap-4 items-center">
          <label className="text-sm font-medium text-right">Название модуля</label>
          <input
            type="text"
            value={newModule.title}
            onChange={(e) => setNewModule({...newModule, title: e.target.value})}
            className="border border-gray-300 rounded px-3 py-2"
            placeholder="Введите название модуля"
          />
        </div>

        {/* Конфигурация для типа "вопрос" */}
        {newModule.typeId === 4 && (
          <div className="space-y-6 border-t pt-4">
            <h4 className="font-semibold text-lg">Конфигурация модуля "Вопрос"</h4>
            
            {/* Требуется ответ в пару */}
         

            {/* Количество колонок в таблице Вопрос */}
            <div className="grid grid-cols-2 gap-4 items-center">
              <label className="text-sm font-medium text-right">Количество колонок в таблице Вопрос</label>
              <select
                value={newQuestionModule.questionColumnsCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value);
                  const newConfigs = Array.from({ length: count }, (_, i) =>
                    newQuestionModule.questionColumnConfigs[i] || { database: '', filters: {} }
                  );
                  setNewQuestionModule({
                    ...newQuestionModule,
                    questionColumnsCount: count,
                    questionColumnConfigs: newConfigs
                  });
                }}
                className="border border-gray-300 rounded px-3 py-2"
              >
                {[1,2,3,4,5].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {/* Конфигурации колонок вопроса */}
            <div className="space-y-4">
              <h5 className="font-medium">Конфигурация колонок вопроса:</h5>
              {newQuestionModule.questionColumnConfigs.map((config, index) => (
                <div key={index} className="p-4 border rounded bg-gray-50">
                  <h6 className="font-medium mb-2">Колонка вопроса {index + 1}</h6>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-sm font-medium">База данных</label>
                    <select
                      value={config.database}
                      onChange={(e) => {
                        const updatedConfigs = [...newQuestionModule.questionColumnConfigs];
                        updatedConfigs[index] = {
                          ...updatedConfigs[index],
                          database: e.target.value,
                          filters: {}
                        };
                        setNewQuestionModule({
                          ...newQuestionModule,
                          questionColumnConfigs: updatedConfigs
                        });
                      }}
                      className="border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">-- Выберите БД --</option>
                      <option value="nouns">Существительные</option>
                      <option value="adjectives">Прилагательные</option>
                      <option value="verbs">Глаголы</option>
                      <option value="pronouns">Местоимения</option>
                      <option value="numerals">Числительные</option>
                      <option value="adverbs">Наречия</option>
                      <option value="prepositions">Предлоги</option>
                      <option value="question-words">Вопросительные слова</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Количество колонок в таблице Ответ */}
            <div className="grid grid-cols-2 gap-4 items-center">
              <label className="text-sm font-medium text-right">Количество колонок в таблице Ответ</label>
              <select
                value={newQuestionModule.answerColumnsCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value);
                  const newConfigs = Array.from({ length: count }, (_, i) =>
                    newQuestionModule.answerColumnConfigs[i] || { database: '', filters: {} }
                  );
                  setNewQuestionModule({
                    ...newQuestionModule,
                    answerColumnsCount: count,
                    answerColumnConfigs: newConfigs
                  });
                }}
                className="border border-gray-300 rounded px-3 py-2"
              >
                {[1,2,3,4,5].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {/* Конфигурации колонок ответа */}
            <div className="space-y-4">
              <h5 className="font-medium">Конфигурация колонок ответа:</h5>
              {newQuestionModule.answerColumnConfigs.map((config, index) => (
                <div key={index} className="p-4 border rounded bg-gray-50">
                  <h6 className="font-medium mb-2">Колонка ответа {index + 1}</h6>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-sm font-medium">База данных</label>
                    <select
                      value={config.database}
                      onChange={(e) => {
                        const updatedConfigs = [...newQuestionModule.answerColumnConfigs];
                        updatedConfigs[index] = {
                          ...updatedConfigs[index],
                          database: e.target.value,
                          filters: {}
                        };
                        setNewQuestionModule({
                          ...newQuestionModule,
                          answerColumnConfigs: updatedConfigs
                        });
                      }}
                      className="border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">-- Выберите БД --</option>
                      <option value="nouns">Существительные</option>
                      <option value="adjectives">Прилагательные</option>
                      <option value="verbs">Глаголы</option>
                      <option value="pronouns">Местоимения</option>
                      <option value="numerals">Числительные</option>
                      <option value="adverbs">Наречия</option>
                      <option value="prepositions">Предлоги</option>
                      <option value="question-words">Вопросительные слова</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}{newModule.typeId === 2 && (
  <div className="space-y-6 border-t pt-4">
    <h4 className="font-semibold text-lg">Конфигурация модуля "Тест лексика"</h4>
    
    {/* Выбор базы данных */}
    <div className="grid grid-cols-2 gap-4 items-center">
      <label className="text-sm font-medium text-right">База данных</label>
      <select
        value={newTestModule.database}
        onChange={(e) => setNewTestModule({
          ...newTestModule,
          database: e.target.value
        })}
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="nouns">Существительные</option>
        <option value="adjectives">Прилагательные</option>
        <option value="verbs">Глаголы</option>
        <option value="question-words">Вопросительные слова</option>
        <option value="prepositions">Предлоги</option>
      </select>
    </div>

    {/* Количество слов в тесте */}
  <div className="grid grid-cols-2 gap-4 items-center">
  <label className="text-sm font-medium text-right">Количество слов</label>
  <div className="grid grid-cols-2 gap-4 items-center">
  <label className="text-sm font-medium text-right">Количество слов</label>
  <div className="flex flex-col gap-2">
    <div className="flex gap-2">
      <select
        value={newTestModule.wordCount}
        onChange={(e) => {
          const value = e.target.value;
          const count = value === 'custom' ? value : parseInt(value);
          setNewTestModule({
            ...newTestModule,
            wordCount: count,
            selectedWords: []
          });
        }}
        className="flex-1 border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Быстрый выбор</option>
        {[4, 6, 8, 10, 12, 16, 20].map(num => (
          <option key={num} value={num}>{num}</option>
        ))}
        <option value="custom">Ввести своё</option>
      </select>
    </div>
    
    {(newTestModule.wordCount === 'custom' || !newTestModule.wordCount) && (
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          max="100"
          value={newTestModule.customWordCount || ''}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0;
            setNewTestModule({
              ...newTestModule,
              customWordCount: value,
              wordCount: value > 0 ? value : 'custom'
            });
          }}
          className="flex-1 border border-gray-300 rounded px-3 py-2"
          placeholder="Введите количество слов"
        />
        <span className="text-sm text-gray-500 whitespace-nowrap">слов</span>
      </div>
    )}
  </div>
</div>
</div>

    {/* Выбор темы */}
    <div className="grid grid-cols-2 gap-4 items-center">
      <label className="text-sm font-medium text-right">Тема урока</label>
      <select
        value={newTestModule.theme}
        onChange={(e) => {
          setNewTestModule({
            ...newTestModule,
            theme: e.target.value,
            selectedWords: [] // Сбрасываем слова при смене темы
          });
        }}
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="">-- Выберите тему --</option>
        {getAvailableThemes().map(theme => (
          <option key={theme} value={theme}>{theme}</option>
        ))}
      </select>
    </div>

    {/* Выбор слов из темы */}
     {newTestModule.theme && newTestModule.database && (
      <div className="border rounded-lg p-4 bg-gray-50">
        <h5 className="font-medium mb-3">Выберите слова для теста ({newTestModule.selectedWords.length}/{newTestModule.wordCount}):</h5>
        
        <div className="max-h-60 overflow-y-auto mb-4">
      <WordSelector
  studiedLanguage={currentLessonForModule?.studiedLanguage || 'русский'}
  theme={newTestModule.theme}
  database={newTestModule.database}
  filters={{}}
  onWordSelect={(selectedWord) => {
    setNewTestModule(prev => {
      const wordId = selectedWord.imageBase || selectedWord.id;
      const isSelected = prev.selectedWords.some(w => 
        (w.imageBase || w.id) === wordId
      );
      
      if (isSelected) {
        // Удаляем
        return {
          ...prev,
          selectedWords: prev.selectedWords.filter(w => 
            (w.imageBase || w.id) !== wordId
          )
        };
      } else if (prev.selectedWords.length < prev.wordCount) {
        // Добавляем
        return {
          ...prev,
          selectedWords: [...prev.selectedWords, selectedWord]
        };
      }
      return prev;
    });
  }}
  selectedWord={null}
  selectedWords={newTestModule.selectedWords} // ← ДОБАВЬТЕ ЭТОТ ПРОПС
/>
        </div>

        {/* Отображение выбранных слов */}
        <div className="space-y-2">
          {newTestModule.selectedWords.map((word, idx) => (
            <div key={idx} className="p-2 bg-green-50 border border-green-200 rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-800">
                  {word.displayWord || word.word}
                </span>
                {word.imagePng && (
                  <img
                    src={word.imagePng}
                    alt="Preview"
                    className="h-6 w-6 object-cover rounded"
                  />
                )}
              </div>
              <button
                onClick={() => setNewTestModule(prev => ({
                  ...prev,
                  selectedWords: prev.selectedWords.filter((_, i) => i !== idx)
                }))}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {newTestModule.selectedWords.length > 0 && (
          <div className="text-sm text-gray-600 mt-2">
            Выбрано слов: {newTestModule.selectedWords.length} из {newTestModule.wordCount}
            {newTestModule.selectedWords.length < newTestModule.wordCount && (
              <span className="text-yellow-600 ml-2">* Выберите ещё {newTestModule.wordCount - newTestModule.selectedWords.length} слов</span>
            )}
          </div>
        )}
      </div>
    )}
  </div>
)}
                           
                            {/* Конфигурация для типа "лексика предложение" */}
                            {newModule.typeId === 3 && (
                                <>
                                    {/* Количество колонок */}
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <label className="text-sm font-medium text-right">Количество колонок</label>
                                      <select
  value={newModule.columnsCount}
  onChange={(e) => {
    const count = parseInt(e.target.value);
    const newConfigs = Array.from({ length: count }, (_, i) =>
      newModule.columnConfigs[i] || { database: '', filters: {} }
    );
    setNewModule({
      ...newModule,
      columnsCount: count,
      columnConfigs: newConfigs
    });
  }}
  className="border border-gray-300 rounded px-3 py-2"
>
  {[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(num => (  // <-- Измените здесь на 2-20
    <option key={num} value={num}>{num}</option>
  ))}
</select>
                                    </div>
                                    {/* Конфигурации колонок */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold">Конфигурация колонок:</h4>
                                        {newModule.columnConfigs.map((config, index) => (
                                            <div key={index} className="p-4 border rounded bg-gray-50">
                                                <h5 className="font-medium mb-2">Колонка {index + 1}</h5>
                                              
                                                {/* Выбор базы данных */}
                                                <div className="grid grid-cols-2 gap-4 items-center mb-2">
                                                    <label className="text-sm font-medium">База данных</label>
                                                    <select
                                                        value={config.database}
                                                        onChange={(e) => updateColumnConfig(index, 'database', e.target.value)}
                                                        className="border border-gray-300 rounded px-3 py-2"
                                                    >
                                                        <option value="">-- Выберите БД --</option>
                                                        <option value="nouns">Существительные</option>
                                                        <option value="adjectives">Прилагательные</option>
                                                        <option value="verbs">Глаголы</option>
                                                        <option value="pronouns">Местоимения</option>
                                                        <option value="numerals">Числительные</option>
                                                        <option value="adverbs">Наречия</option>
                                                        <option value="prepositions">Предлоги</option>
                                                    </select>
                                                </div>
                                                {/* Фильтры в зависимости от типа БД */}
                                              {config.database === 'nouns' && (
  <>
    <div className="grid grid-cols-2 gap-4 items-center mb-2">
      <label className="text-sm font-medium">Число</label>
      <select
        value={config.filters.number || ''}
        onChange={(e) => updateColumnConfig(index, 'filters', {
          ...config.filters,
          number: e.target.value
        })}
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любое</option>
        <option value="единственное">Единственное</option>
        <option value="множественное">Множественное</option>
      </select>
    </div>
    <div className="grid grid-cols-2 gap-4 items-center">
      <label className="text-sm font-medium">Падеж</label>
      <select
        value={config.filters.case || ''}
        onChange={(e) => updateColumnConfig(index, 'filters', {
          ...config.filters,
          case: e.target.value
        })}
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любой</option>
        <option value="именительный">Именительный</option>
        <option value="родительный">Родительный</option>
        <option value="дательный">Дательный</option>
        <option value="винительный">Винительный</option>
        <option value="творительный">Творительный</option>
        <option value="предложный">Предложный</option>
      </select>
    </div>
  </>
)}
                                               {config.database === 'adjectives' && (
  <>
    <div className="grid grid-cols-2 gap-4 items-center mb-2">
      <label className="text-sm font-medium">Число</label>
      <select
        value={config.filters.number || ''}
        onChange={(e) => updateColumnConfig(index, 'filters', {
          ...config.filters,
          number: e.target.value
        })}
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любое</option>
        <option value="единственное">Единственное</option>
        <option value="множественное">Множественное</option>
      </select>
    </div>
    <div className="grid grid-cols-2 gap-4 items-center mb-2">
      <label className="text-sm font-medium">Род</label>
      <select
        value={config.filters.gender || ''}
        onChange={(e) => updateColumnConfig(index, 'filters', {
          ...config.filters,
          gender: e.target.value
        })}
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любой</option>
        <option value="мужской">Мужской</option>
        <option value="женский">Женский</option>
        <option value="средний">Средний</option>
      </select>
    </div>
    <div className="grid grid-cols-2 gap-4 items-center">
      <label className="text-sm font-medium">Падеж</label>
      <select
        value={config.filters.case || ''}
        onChange={(e) => updateColumnConfig(index, 'filters', {
          ...config.filters,
          case: e.target.value
        })}
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любой</option>
        <option value="именительный">Именительный</option>
        <option value="родительный">Родительный</option>
        <option value="дательный">Дательный</option>
        <option value="винительный">Винительный</option>
        <option value="творительный">Творительный</option>
        <option value="предложный">Предложный</option>
      </select>
    </div>
  </>
)}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="mt-6 flex gap-2 justify-end">
        <button
          onClick={() => setShowCreateModuleModal(false)}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Отмена
        </button>
        <button
          onClick={createModule}
          disabled={!newModule.title || !newModule.typeId}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Создать модуль
        </button>
      </div>
                    </div>
                </div>
            )}
            {/* Модальное окно добавления предложения */}
{showSentenceModal && currentLessonForModule && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-2xl font-bold mb-6 text-center">
        {editingSentence ? 'Редактировать предложение' : 'Добавить предложение'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {currentLessonForModule.config?.columnConfigs?.map((config, index) => (
          <div key={index} className="p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold mb-3 text-lg">
              Колонка {index + 1} - {getDatabaseDisplayName(config.database)}
            </h4>
            
            <SentenceColumn
              config={config}
              columnIndex={index}
              columnData={newSentence.columnData[index] || {}}
              onColumnChange={(colIndex, field, value) => {
                const updatedData = [...newSentence.columnData];
                if (!updatedData[colIndex]) {
                  updatedData[colIndex] = {};
                }
                updatedData[colIndex] = { ...updatedData[colIndex], [field]: value };
                
                // Если очищаем слово, очищаем и wordData
                if (field === 'word' && !value) {
                  updatedData[colIndex].wordData = null;
                }
                
                setNewSentence({...newSentence, columnData: updatedData});
              }}
              lessonData={lessonData}
              getAvailableThemes={getAvailableThemes}
            />
            
            {/* Индикатор выбранного слова */}
            {newSentence.columnData[index]?.word && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-green-800">
                      Выбрано: {newSentence.columnData[index].word}
                    </span>
                    {(newSentence.columnData[index].number || 
                      newSentence.columnData[index].gender || 
                      newSentence.columnData[index].case) && (
                      <div className="text-xs text-gray-600 mt-1">
                        {newSentence.columnData[index].number && `Число: ${newSentence.columnData[index].number} `}
                        {newSentence.columnData[index].gender && `Род: ${newSentence.columnData[index].gender} `}
                        {newSentence.columnData[index].case && `Падеж: ${newSentence.columnData[index].case}`}
                      </div>
                    )}
                    {newSentence.columnData[index]?.wordData?.imagePng && (
                      <div className="mt-1">
                        <img
                          src={newSentence.columnData[index].wordData.imagePng}
                          alt="Preview"
                          className="h-10 w-10 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const updatedData = [...newSentence.columnData];
                      updatedData[index] = {
                        lesson: updatedData[index]?.lesson || '',
                        number: '',
                        gender: '',
                        case: '',
                        word: '',
                        wordData: null
                      };
                      setNewSentence({
                        ...newSentence,
                        columnData: updatedData
                      });
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Картинка предложения */}
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h4 className="font-semibold mb-2">Картинка предложения</h4>
        <div className="flex items-center gap-3">
          {newSentence.image && (
            <img
              src={newSentence.image}
              alt="Preview"
              className="h-20 w-20 object-cover rounded"
            />
          )}
          <div className="flex-1">
            <input
              type="text"
              value={newSentence.image}
              onChange={(e) => setNewSentence({...newSentence, image: e.target.value})}
              placeholder="URL картинки или оставьте пустым для автоматической подстановки"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {!newSentence.image ? 
                'Автоматически будет использована картинка первого слова' : 
                'Указана пользовательская картинка'}
            </p>
          </div>
        </div>
      </div>

      {/* Предварительный просмотр предложения */}
     

      {/* Таблица существующих предложений */}
      <SentenceTable
        sentences={moduleSentences}
        moduleConfig={currentLessonForModule}
       onEdit={(sentence) => {
  console.log('Editing sentence:', sentence);
  setEditingSentence(sentence);
  
  // Преобразуем структуру предложения в формат columnData
  const columnData = sentence.sentenceStructure.map(wordObj => ({
    lesson: wordObj.lesson || '',
    number: wordObj.number || '',
    gender: wordObj.gender || '',
    case: wordObj.case || '',
    word: wordObj.word || '',
    wordData: wordObj.wordData || null
  }));
  
  // Дополняем до нужного количества колонок
  const columnCount = currentLessonForModule.config?.columnConfigs?.length || 2;
  while (columnData.length < columnCount) {
    columnData.push({
      lesson: '',
      number: '',
      gender: '',
      case: '',
      word: '',
      wordData: null
    });
  }
  
  setNewSentence({
    columnData: columnData,
    image: sentence.image || '',
    _id: sentence._id
  });
}}
        onDelete={deleteSentence}
      />

      <div className="mt-6 flex gap-2 justify-end">
        <button
          onClick={() => {
            setShowSentenceModal(false);
            setEditingSentence(null);
            setModuleSentences([]);
            resetSentenceForm();
          }}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Отмена
        </button>
        <button
          onClick={addOrUpdateSentence}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {editingSentence ? 'Сохранить изменения' : 'Добавить предложение'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
