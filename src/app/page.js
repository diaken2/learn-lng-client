// app/page.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
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
  const [tableData, setTableData] = useState([]); // ← ВОТ ОНО!
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [debugInfo, setDebugInfo] = useState('Готов к работе');
  const [backendStatus, setBackendStatus] = useState('unknown');

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
  useEffect(() => {
    const loadLessons = async () => {
      if (!selectedLevel || !studiedLanguage || !hintLanguage) {
        setLessons([]);
        setSelectedLesson('');
        return;
      }

      setLoading(true);
      setDebugInfo(`Загрузка уроков из таблицы... level=${selectedLevel}, studied=${studiedLanguage}, hint=${hintLanguage}`);
      
      try {
        const params = new URLSearchParams();
        params.append('level', selectedLevel);
        // Убираем фильтрацию по языкам на бэкенде, так как будем проверять сами
        const url = `${API_BASE_URL}/table-lessons?${params.toString()}`;
        console.log('Fetching table lessons from:', url);

        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const lessonsData = await response.json();
        console.log('Loaded lessons from table:', lessonsData);
        
        // Проверяем наличие переводов для выбранных языков
        const lessonsWithTranslations = checkTranslationsForLanguages(
          lessonsData, 
          studiedLanguage, 
          hintLanguage
        );
        
        console.log(`Lessons with complete translations: ${lessonsWithTranslations.length} out of ${lessonsData.length}`);
        
        setLessons(lessonsWithTranslations);
        setDebugInfo(`Успешно! Найдено уроков: ${lessonsWithTranslations.length} (из ${lessonsData.length} с полными переводами)`);
        
        // Сбрасываем выбранный урок, если его нет в отфильтрованном списке
        if (selectedLesson && !lessonsWithTranslations.find(l => l._id === selectedLesson)) {
          setSelectedLesson('');
        }
      } catch (error) {
        console.error('Error loading table lessons:', error);
        setDebugInfo(`Ошибка: ${error.message}`);
        setLessons([]);
        setSelectedLesson('');
      } finally {
        setLoading(false);
      }
    };

    if (backendStatus === 'connected' && tableData.length > 0) {
      loadLessons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel, studiedLanguage, hintLanguage, backendStatus, tableData]);

  const handleStartLearning = () => {
    if (selectedLesson) {
      const lesson = lessons.find(l => l._id === selectedLesson);
      if (lesson) {
        // Определяем источник урока
        const source = lesson._id.startsWith('table_') ? 'table' : 'lesson';
        router.push(`/learning?lesson=${encodeURIComponent(lesson._id)}&studied=${encodeURIComponent(studiedLanguage)}&hint=${encodeURIComponent(hintLanguage)}&source=${source}`);
      }
    }
  };

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
              <a href="/admin" className="text-gray-600 hover:text-blue-600 font-medium">Админка</a>
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

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Изучайте языки</h1>
          <p className="text-gray-600">Уроки из таблицы базы данных</p>
        </div>

        {/* Статус бэкенда */}
       

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Изучаемый язык</label>
                <select
                  value={studiedLanguage}
                  onChange={(e) => setStudiedLanguage(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  disabled={loadingMeta || backendStatus !== 'connected'}
                >
                  <option value="">Выберите язык</option>
                  {availableLanguages.map(lang => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  {loadingMeta ? 'Загрузка...' : `Доступно: ${availableLanguages.length} языков`}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Язык подсказки</label>
                <select
                  value={hintLanguage}
                  onChange={(e) => setHintLanguage(e.target.value)}
                  className="w-full border rounded px-3 py-2"
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
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Уровень</label>
                <select 
                  value={selectedLevel} 
                  onChange={(e) => setSelectedLevel(e.target.value)} 
                  className="w-full border rounded px-3 py-2"
                  disabled={loadingMeta || backendStatus !== 'connected'}
                >
                  <option value="">Выберите уровень</option>
                  {availableLevels.map(level => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  {loadingMeta ? 'Загрузка...' : `Доступно: ${availableLevels.length} уровней`}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Урок</label>
                <select 
                  value={selectedLesson} 
                  onChange={(e) => setSelectedLesson(e.target.value)} 
                  className="w-full border rounded px-3 py-2"
                  disabled={loading || !selectedLevel || !studiedLanguage || !hintLanguage || backendStatus !== 'connected'}
                >
                  <option value="">
                    {!studiedLanguage || !hintLanguage ? 'Сначала выберите языки' :
                     !selectedLevel ? 'Сначала выберите уровень' :
                     loading ? 'Загрузка...' : 
                     lessons.length === 0 ? 'Нет уроков с полными переводами' :
                     'Выберите урок'}
                  </option>
                  
                  {lessons.map((lesson) => (
                    <option key={lesson._id} value={lesson._id}>
                      {lesson.title} {lesson.theme ? `(${lesson.theme})` : ''}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  {!studiedLanguage || !hintLanguage ? 'Выберите изучаемый язык и язык подсказки' :
                   !selectedLevel ? 'Выберите уровень' :
                   loading ? 'Загрузка...' : 
                   lessons.length === 0 ? 'Нет уроков с полными переводами для выбранных языков' :
                   `Найдено уроков с полными переводами: ${lessons.length}`}
                </div>
              </div>
            </div>
          </div>

          {lessons.length === 0 && selectedLevel && studiedLanguage && hintLanguage && !loading && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="text-yellow-800">
                <strong>Внимание:</strong> Нет уроков с полными переводами для выбранной комбинации языков.
                <br />
                <span className="text-sm">
                  Возможно, в админке не заполнены переводы для языка {studiedLanguage} или {hintLanguage}.
                </span>
              </div>
            </div>
          )}

          <div className="text-center">
            <button 
              onClick={handleStartLearning} 
              disabled={!selectedLesson || loading || backendStatus !== 'connected'}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Начать обучение
            </button>
          </div>
        </div>

        {/* Секция тестов */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Доступные тесты</h2>
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
      
      </main>
    </div>
  );
}