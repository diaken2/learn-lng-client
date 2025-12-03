// app/page.js - ОБНОВЛЕННАЯ ВЕРСИЯ С ВЫВОДОМ МОДУЛЕЙ
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = 'https://learn-lng-server.onrender.com/api'; 

export default function HomePage() {
  const router = useRouter();
  
  // Объявляем ВСЕ состояния
  const [studiedLanguage, setStudiedLanguage] = useState('');
  const [hintLanguage, setHintLanguage] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [lessons, setLessons] = useState([]);
  const [tests, setTests] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [availableLevels, setAvailableLevels] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [debugInfo, setDebugInfo] = useState('Готов к работе');
  const [backendStatus, setBackendStatus] = useState('unknown');
  const [lessonModules, setLessonModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);

  // Загружаем мета-данные (языки, уровни и тесты)
  useEffect(() => {
    const loadMetaData = async () => {
      try {
        setLoadingMeta(true);
        
        // Загружаем доступные языки из таблицы
        const languagesResponse = await fetch(`${API_BASE_URL}/available-languages`);
        if (languagesResponse.ok) {
          const languages = await languagesResponse.json();
          setAvailableLanguages(languages);
          console.log('Available languages from table:', languages);
        }
        
        // Загружаем доступные уровни из таблицы
        const levelsResponse = await fetch(`${API_BASE_URL}/available-levels`);
        if (levelsResponse.ok) {
          const levels = await levelsResponse.json();
          setAvailableLevels(levels);
          console.log('Available levels from table:', levels);
        }

        // Загружаем доступные тесты
        const testsResponse = await fetch(`${API_BASE_URL}/tests`);
        if (testsResponse.ok) {
          const testsData = await testsResponse.json();
          setTests(testsData);
        }
        
        setBackendStatus('connected');
        setDebugInfo(`Бэкенд подключен! Языков: ${availableLanguages.length}, Уровней: ${availableLevels.length}`);
      } catch (error) {
        console.error('Error loading meta data:', error);
        setBackendStatus('error');
        setDebugInfo(`Ошибка загрузки: ${error.message}`);
      } finally {
        setLoadingMeta(false);
      }
    };

    loadMetaData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Дополнительный useEffect для загрузки таблицы
  useEffect(() => {
    const loadTableData = async () => {
      if (backendStatus === 'connected' && tableData.length === 0) {
        try {
          const tableResponse = await fetch(`${API_BASE_URL}/table`);
          if (tableResponse.ok) {
            const table = await tableResponse.json();
            setTableData(table);
            console.log('Table data loaded for translation check');
          }
        } catch (error) {
          console.error('Error loading table:', error);
        }
      }
    };

    loadTableData();
  }, [backendStatus, tableData.length]);

  // Функция для загрузки модулей урока
const loadLessonModules = async (lessonId) => {
  if (!lessonId) return;
  
  setLoadingModules(true);
  try {
    let endpoint;
    
    // Определяем тип ID урока
    if (lessonId.startsWith('table_')) {
      // Это табличный урок - передаем языки как параметры
      endpoint = `${API_BASE_URL}/lesson-modules/by-table-lesson/${lessonId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`;
      console.log('Loading modules for TABLE lesson with languages:', studiedLanguage, '→', hintLanguage);
    } else {
      endpoint = `${API_BASE_URL}/lesson-modules/by-lesson/${lessonId}`;
      console.log('Loading modules for MONGODB lesson:', lessonId);
    }
    
    const response = await fetch(endpoint);
    if (response.ok) {
      const modules = await response.json();
      console.log('Loaded modules for current language pair:', modules);
      setLessonModules(modules);
    } else {
      setLessonModules([]);
      console.log('No modules found for lesson with current languages');
    }
  } catch (error) {
    console.error('Error loading lesson modules:', error);
    setLessonModules([]);
  } finally {
    setLoadingModules(false);
  }
};
useEffect(() => {
  if (selectedLesson) {
    const currentLesson = lessons.find(l => l._id === selectedLesson);
    if (currentLesson) {
      const matchesStudied = currentLesson.studiedLanguage?.toLowerCase() === studiedLanguage.toLowerCase();
      const matchesHint = currentLesson.hintLanguage?.toLowerCase() === hintLanguage.toLowerCase();
      
      if (!matchesStudied || !matchesHint) {
        setSelectedLesson('');
        setLessonModules([]);
      }
    }
  }
}, [studiedLanguage, hintLanguage, lessons, selectedLesson]);

  // Функция для проверки наличия переводов в уроках
  const checkTranslationsForLanguages = (lessonsToCheck, studiedLang, hintLang) => {
    if (!tableData.length || !lessonsToCheck.length) return [];

    const validLessons = [];
    
    lessonsToCheck.forEach(lesson => {
      // Находим тему в таблице
      const themeRows = tableData.filter(row => 
        row['Урок название'] === lesson.theme || row['Урок название'] === lesson.title
      );
      
      if (themeRows.length === 0) {
        console.log(`Theme "${lesson.theme}" not found in table`);
        return;
      }

      // Находим заголовок урока
      const lessonHeader = themeRows.find(row => 
        row['Уровень изучения номер'] && row['Урок номер'] && row['Урок название']
      );
      
      if (!lessonHeader) {
        console.log(`Lesson header not found for theme "${lesson.theme}"`);
        return;
      }

      // Собираем все слова этого урока
      const words = [];
      let currentTheme = null;
      let collectingWords = false;
      
      for (const row of tableData) {
        // Если это заголовок нашего урока
        if (row['Урок номер'] === lessonHeader['Урок номер'] && 
            row['Урок название'] === lessonHeader['Урок название']) {
          currentTheme = lessonHeader['Урок название'];
          collectingWords = true;
          continue;
        }
        
        // Если это заголовок другого урока - прекращаем сбор
        if (row['Урок номер'] && row['Урок номер'] !== lessonHeader['Урок номер']) {
          if (collectingWords) break;
          continue;
        }
        
        // Если собираем слова и это строка со словом
        if (collectingWords && row['База изображение'] && row['База изображение'].trim() !== '') {
          words.push(row);
        }
      }

      // Если в уроке нет слов, пропускаем
      if (words.length === 0) {
        console.log(`No words found in lesson "${lesson.title}"`);
        return;
      }

      // Проверяем наличие переводов для каждого слова
      let hasAllTranslations = true;

      words.forEach((word, index) => {
        const studiedCol = `База существительные слова ${studiedLang}`;
        const hintCol = `База существительные слова ${hintLang}`;
        
        const hasStudiedTranslation = word[studiedCol] && word[studiedCol].trim() !== '';
        const hasHintTranslation = word[hintCol] && word[hintCol].trim() !== '';
        
        if (!hasStudiedTranslation || !hasHintTranslation) {
          hasAllTranslations = false;
          console.log(`Missing translations in word ${index + 1}:`, {
            word: word['База изображение'],
            studied: hasStudiedTranslation ? word[studiedCol] : 'MISSING',
            hint: hasHintTranslation ? word[hintCol] : 'MISSING'
          });
        }
      });

      if (hasAllTranslations) {
        validLessons.push(lesson);
        console.log(`Lesson "${lesson.title}" has all translations`);
      } else {
        console.log(`Lesson "${lesson.title}" has missing translations`);
      }
    });

    return validLessons;
  };

  // Загружаем уроки из таблицы при изменении фильтров
 // Загружаем уроки из таблицы при изменении фильтров
useEffect(() => {
  const loadLessons = async () => {
    if (!selectedLevel || !studiedLanguage || !hintLanguage) {
      setLessons([]);
      setSelectedLesson('');
      setLessonModules([]);
      return;
    }

    setLoading(true);
    setDebugInfo(`Загрузка уроков из таблицы... level=${selectedLevel}, studied=${studiedLanguage}, hint=${hintLanguage}`);
    
    try {
      const params = new URLSearchParams();
      params.append('level', selectedLevel);
      // ДОБАВЛЯЕМ ФИЛЬТРАЦИЮ ПО ЯЗЫКАМ
      params.append('studiedLanguage', studiedLanguage);
      params.append('hintLanguage', hintLanguage);
      
      const url = `${API_BASE_URL}/table-lessons?${params.toString()}`;
      console.log('Fetching table lessons from:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const lessonsData = await response.json();
      console.log('Loaded lessons from table:', lessonsData);
      
      // ПРОВЕРЯЕМ, ЧТО УРОКИ СООТВЕТСТВУЮТ ВЫБРАННЫМ ЯЗЫКАМ
      const filteredLessons = lessonsData.filter(lesson => {
        const matchesStudied = !studiedLanguage || 
          lesson.studiedLanguage?.toLowerCase() === studiedLanguage.toLowerCase();
        const matchesHint = !hintLanguage || 
          lesson.hintLanguage?.toLowerCase() === hintLanguage.toLowerCase();
        
        return matchesStudied && matchesHint;
      });
      
      console.log(`Filtered lessons: ${filteredLessons.length} out of ${lessonsData.length}`);
      console.log('Filtered lessons details:', filteredLessons);
      
      setLessons(filteredLessons);
      setDebugInfo(`Успешно! Найдено уроков: ${filteredLessons.length}`);
      
      // Сбрасываем выбранный урок, если его нет в отфильтрованном списке
      if (selectedLesson && !filteredLessons.find(l => l._id === selectedLesson)) {
        setSelectedLesson('');
        setLessonModules([]);
      }
    } catch (error) {
      console.error('Error loading table lessons:', error);
      setDebugInfo(`Ошибка: ${error.message}`);
      setLessons([]);
      setSelectedLesson('');
      setLessonModules([]);
    } finally {
      setLoading(false);
    }
  };

  if (backendStatus === 'connected') {
    loadLessons();
  }
}, [selectedLevel, studiedLanguage, hintLanguage, backendStatus]);

  // Загружаем модули при выборе урока
  useEffect(() => {
    if (selectedLesson) {
      loadLessonModules(selectedLesson);
    } else {
      setLessonModules([]);
    }
  }, [selectedLesson]);

  // Функции для запуска разных типов модулей
 const startModule = (module, moduleType) => {
  if (!selectedLesson) return;

  const lesson = lessons.find(l => l._id === selectedLesson);
  if (!lesson) return;

  let route = '';
  const baseParams = `lesson=${encodeURIComponent(selectedLesson)}&studied=${encodeURIComponent(studiedLanguage)}&hint=${encodeURIComponent(hintLanguage)}`;

  switch (moduleType) {
    case 'Лексика':
      route = `/learning?${baseParams}&source=lesson`;
      break;
    case 'Тест лексика':
      route = `/test?test=${encodeURIComponent(module._id)}&studied=${encodeURIComponent(studiedLanguage)}&hint=${encodeURIComponent(hintLanguage)}`;
      break;
    case 'Фразы':
      route = `/sentence-learning?module=${encodeURIComponent(module._id)}&${baseParams}`;
      break;
    case 'Вопрос':
      route = `/question-learning?module=${encodeURIComponent(module._id)}&${baseParams}`;
      break;
    default:
      console.warn('Unknown module type:', moduleType);
      return;
  }

  console.log('Navigating to:', route);
  router.push(route);
};

  // Функция для получения отображаемого названия типа модуля
  const getModuleTypeDisplayName = (typeId) => {
    const typeMap = {
      1: 'Лексика',
      2: 'Тест лексика', 
      3: 'Фразы',
      4: 'Вопрос'
    };
    return typeMap[typeId] || `Тип ${typeId}`;
  };

  // Функция для получения описания типа модуля
  const getModuleTypeDescription = (typeId) => {
    const descriptionMap = {
      1: 'Изучение отдельных слов с картинками',
      2: 'Проверка знаний слов',
      3: 'Составление и изучение предложений', 
      4: 'Вопросы и ответы'
    };
    return descriptionMap[typeId] || '';
  };

  // Функция для получения иконки типа модуля
  const getModuleTypeIcon = (typeId) => {
    const iconMap = {
      1: '📚', // Лексика
      2: '📝', // Тест
      3: '💬', // Фразы
      4: '❓'  // Вопросы
    };
    return iconMap[typeId] || '📁';
  };

  // Группируем модули по типам
  const groupedModules = lessonModules.reduce((groups, module) => {
    const typeName = getModuleTypeDisplayName(module.typeId);
    if (!groups[typeName]) {
      groups[typeName] = [];
    }
    groups[typeName].push(module);
    return groups;
  }, {});

  const testBackendConnection = async () => {
    setLoadingMeta(true);
    try {
      const languagesResponse = await fetch(`${API_BASE_URL}/available-languages`);
      const levelsResponse = await fetch(`${API_BASE_URL}/available-levels`);
      const tableResponse = await fetch(`${API_BASE_URL}/table`);
      const testsResponse = await fetch(`${API_BASE_URL}/tests`);
      
      if (languagesResponse.ok && levelsResponse.ok) {
        const languages = await languagesResponse.json();
        const levels = await levelsResponse.json();
        const table = await tableResponse.json();
        const testsData = await testsResponse.json();
        
        setAvailableLanguages(languages);
        setAvailableLevels(levels);
        setTableData(table);
        setTests(testsData);
        setBackendStatus('connected');
        setDebugInfo(`Бэкенд подключен! Языков: ${languages.length}, Уровней: ${levels.length}`);
      }
    } catch (error) {
      setBackendStatus('error');
      setDebugInfo(`Ошибка: ${error.message}`);
    } finally {
      setLoadingMeta(false);
    }
  };

  // Фильтруем тесты по выбранным языкам и уровню
  const filteredTests = tests.filter(test => {
    if (studiedLanguage && test.studiedLanguage !== studiedLanguage.toLowerCase()) return false;
    if (hintLanguage && test.hintLanguage !== hintLanguage.toLowerCase()) return false;
    if (selectedLevel && test.level !== selectedLevel) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 font-medium">Language Learning</div>
            <nav className="flex space-x-4">
              <a href="/admin-page" className="text-gray-600 hover:text-blue-600 font-medium">Админка</a>
              <button 
                onClick={testBackendConnection}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Обновить
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Изучайте языки</h1>
          <p className="text-gray-600">Выберите урок и начните обучение</p>
        </div>

        {/* Основные фильтры */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Изучаемый язык */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Изучаемый язык
              </label>
              <select
                value={studiedLanguage}
                onChange={(e) => setStudiedLanguage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loadingMeta || backendStatus !== 'connected'}
              >
                <option value="">Выберите язык</option>
                {availableLanguages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Язык подсказки */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Язык подсказки
              </label>
              <select
                value={hintLanguage}
                onChange={(e) => setHintLanguage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loadingMeta || backendStatus !== 'connected'}
              >
                <option value="">Выберите язык</option>
                {availableLanguages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Уровень */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Уровень
              </label>
              <select 
                value={selectedLevel} 
                onChange={(e) => setSelectedLevel(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loadingMeta || backendStatus !== 'connected'}
              >
                <option value="">Выберите уровень</option>
                {availableLevels.map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Урок */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Урок
              </label>
              <select 
                value={selectedLesson} 
                onChange={(e) => setSelectedLesson(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading || !selectedLevel || !studiedLanguage || !hintLanguage || backendStatus !== 'connected'}
              >
                <option value="">
                  {!studiedLanguage || !hintLanguage ? 'Сначала выберите языки' :
                   !selectedLevel ? 'Сначала выберите уровень' :
                   loading ? 'Загрузка...' : 
                   lessons.length === 0 ? 'Нет уроков с переводами' :
                   'Выберите урок'}
                </option>
                
                {lessons.map((lesson) => (
                  <option key={lesson._id} value={lesson._id}>
                    {lesson.title} {lesson.theme ? `(${lesson.theme})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Информация о статусе */}
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">
              {!studiedLanguage || !hintLanguage ? 'Выберите изучаемый язык и язык подсказки' :
               !selectedLevel ? 'Выберите уровень' :
               loading ? 'Загрузка уроков...' : 
               lessons.length === 0 ? 'Нет уроков с полными переводами для выбранных языков' :
               `Найдено уроков: ${lessons.length}`}
            </div>
          </div>
        </div>

        {/* Секция модулей урока */}
        {selectedLesson && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {lessons.find(l => l._id === selectedLesson)?.title || 'Урок'}
              </h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Уровень: {selectedLevel}
              </span>
            </div>

            {loadingModules ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Загрузка модулей...</p>
              </div>
            ) : lessonModules.length === 0 ? (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-2">Для этого урока нет доступных модулей</p>
        <p className="text-sm text-gray-500 mb-4">
          ID урока: {selectedLesson}
        </p>
        <button 
          onClick={() => loadLessonModules(selectedLesson)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Попробовать снова
        </button>
      </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Группа: Лексика слова */}
                {groupedModules['Лексика'] && (
                  <div className="border border-blue-200 rounded-xl bg-blue-50 p-6">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-3">📚</span>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">Лексика</h3>
                        <p className="text-sm text-blue-700">Изучение отдельных слов с картинками</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {groupedModules['Лексика'].map(module => (
                        <button
                          key={module._id}
                          onClick={() => startModule(module, 'Лексика')}
                          className="w-full bg-white text-blue-800 border border-blue-300 rounded-lg px-4 py-3 text-left hover:bg-blue-100 transition-colors flex justify-between items-center"
                        >
                          <span className="font-medium">{module.title || 'Лексика'}</span>
                          <span className="text-blue-600">→</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Группа: Тест лексика */}
                {groupedModules['Тест лексика'] && (
                  <div className="border border-purple-200 rounded-xl bg-purple-50 p-6">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-3">📝</span>
                      <div>
                        <h3 className="text-lg font-semibold text-purple-900">Тест лексика</h3>
                        <p className="text-sm text-purple-700">Проверка знаний слов</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {groupedModules['Тест лексика'].map(module => (
                        <button
                          key={module._id}
                          onClick={() => startModule(module, 'Тест лексика')}
                          className="w-full bg-white text-purple-800 border border-purple-300 rounded-lg px-4 py-3 text-left hover:bg-purple-100 transition-colors flex justify-between items-center"
                        >
                          <span className="font-medium">{module.title || 'Тест'}</span>
                          <span className="text-purple-600">→</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Группа: Фразы */}
                {groupedModules['Фразы'] && (
                  <div className="border border-green-200 rounded-xl bg-green-50 p-6">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-3">💬</span>
                      <div>
                        <h3 className="text-lg font-semibold text-green-900">Фразы</h3>
                        <p className="text-sm text-green-700">Составление и изучение предложений</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {groupedModules['Фразы'].map(module => (
                        <button
                          key={module._id}
                          onClick={() => startModule(module, 'Фразы')}
                          className="w-full bg-white text-green-800 border border-green-300 rounded-lg px-4 py-3 text-left hover:bg-green-100 transition-colors flex justify-between items-center"
                        >
                          <span className="font-medium">{module.title || 'Фразы'}</span>
                          <span className="text-green-600">→</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Группа: Вопросы */}
                {groupedModules['Вопрос'] && (
                  <div className="border border-orange-200 rounded-xl bg-orange-50 p-6">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-3">❓</span>
                      <div>
                        <h3 className="text-lg font-semibold text-orange-900">Вопросы</h3>
                        <p className="text-sm text-orange-700">Вопросы и ответы</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {groupedModules['Вопрос'].map(module => (
                        <button
                          key={module._id}
                          onClick={() => startModule(module, 'Вопрос')}
                          className="w-full bg-white text-orange-800 border border-orange-300 rounded-lg px-4 py-3 text-left hover:bg-orange-100 transition-colors flex justify-between items-center"
                        >
                          <span className="font-medium">{module.title || 'Вопросы'}</span>
                          <span className="text-orange-600">→</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Секция тестов */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Доступные тесты</h2>
          {filteredTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTests.map(test => (
                <div key={test._id} className="bg-white rounded-lg shadow-md p-4 border border-purple-200">
                  <h3 className="text-lg font-semibold mb-2">{test.theme}</h3>
                  <p className="text-gray-600 mb-2">Уровень: {test.level}</p>
                  <p className="text-gray-600 mb-4">
                    {test.studiedLanguage} → {test.hintLanguage}
                  </p>
                  <button
                    onClick={() => router.push(`/test?test=${test._id}&studied=${test.studiedLanguage}&hint=${test.hintLanguage}`)}
                    className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600 transition-colors"
                  >
                    Начать тест
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-700">
                {tests.length === 0 
                  ? 'Тесты не найдены. Создайте тесты в админке.' 
                  : 'Нет тестов для выбранных фильтров. Попробуйте изменить язык или уровень.'}
              </p>
            </div>
          )}
        </section>

        {/* Отладочная информация */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
  <div className="text-sm text-gray-600">
    <div>ID урока: {selectedLesson}</div>
    <div>Тип урока: {selectedLesson.startsWith('table_') ? 'Табличный' : 'База данных'}</div>
    <div>Загружено модулей: {lessonModules.length}</div>
    <div>Типы модулей: {Object.keys(groupedModules).join(', ') || 'нет'}</div>
    <div>Статус загрузки: {loadingModules ? 'Загрузка...' : 'Завершено'}</div>
  </div>
</div>
        <div className="bg-gray-100 rounded-lg p-4 mt-8">
          <div className="text-sm font-mono">
            <div className="text-gray-600">Статус: {backendStatus === 'connected' ? '✅ Подключено' : '❌ Ошибка'}</div>
            <div className="text-gray-600">Инфо: {debugInfo}</div>
            <div className="text-gray-600">Модулей загружено: {lessonModules.length}</div>
          </div>
        </div>
      </main>
    </div>
  );
}