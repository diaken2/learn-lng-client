// app/page.js - РАБОЧАЯ ВЕРСИЯ С ТЕСТАМИ БЕЗ ФИЛЬТРАЦИИ
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../hooks/useTranslations';

const API_BASE_URL = 'https://learn-lng-new-client-lrqy.onrender.com/api'; 

export default function HomePage() {
  const router = useRouter();
  
  // === СОСТОЯНИЯ (без изменений) ===
  const [studiedLanguage, setStudiedLanguage] = useState('');
  const [hintLanguage, setHintLanguage] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [selectedLessonTitle, setSelectedLessonTitle] = useState('');
  const [lessons, setLessons] = useState([]);
  const [tests, setTests] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [debugInfo, setDebugInfo] = useState('Готов к работе');
  const [backendStatus, setBackendStatus] = useState('unknown');
  const [lessonModules, setLessonModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [userCountry, setUserCountry] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { t } = useTranslation(hintLanguage);

  // === АВТООПРЕДЕЛЕНИЕ СТРАНЫ (без изменений) ===
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        setUserCountry(data.country_name || data.country || 'Unknown');
        const countryToLanguage = {
          'Russia': 'Russian',
          'United States': 'English',
          'United Kingdom': 'English',
          'Germany': 'German',
          'France': 'French',
          'Spain': 'Spanish',
          'Italy': 'Italian',
          'China': 'Chinese',
          'Japan': 'Japanese',
          'South Korea': 'Korean',
        };
        if (data.country_name && countryToLanguage[data.country_name] && !hintLanguage) {
          setHintLanguage(countryToLanguage[data.country_name]);
        } else if (!hintLanguage) {
          setHintLanguage('English');
        }
      })
      .catch(() => {
        setUserCountry('Unknown');
        if (!hintLanguage) setHintLanguage('English');
      });
  }, []);

  // === ОТСЛЕЖИВАНИЕ УРОКА (без изменений) ===
  useEffect(() => {
    console.log('🔍 [useEffect] selectedLesson изменился:', selectedLesson);
    if (selectedLesson) {
      loadLessonModules(selectedLesson);
    } else {
      setLessonModules([]);
    }
  }, [selectedLesson]);

  const handleLessonSelect = (e) => {
    const lessonId = e.target.value;
    const selectedLessonObj = lessons.find(l => l._id === lessonId);
    setSelectedLesson(lessonId);
    if (selectedLessonObj) {
      setSelectedLessonTitle(selectedLessonObj.title);
    }
  };

  // === LOCALSTORAGE (без изменений) ===
  useEffect(() => {
    const savedState = localStorage.getItem('lessonSelectionState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (Date.now() - parsed.timestamp < 24 * 3600000) {
          if (parsed.studiedLanguage) setStudiedLanguage(parsed.studiedLanguage);
          if (parsed.hintLanguage) setHintLanguage(parsed.hintLanguage);
          if (parsed.selectedLevel) setSelectedLevel(parsed.selectedLevel);
          if (parsed.selectedLesson) {
            setSelectedLesson(parsed.selectedLesson);
            if (parsed.selectedLessonTitle) {
              setSelectedLessonTitle(parsed.selectedLessonTitle);
            }
          }
        }
      } catch (e) {
        console.error('Error restoring state:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (studiedLanguage || hintLanguage || selectedLevel || selectedLesson) {
      const selectedLessonObj = lessons.find(l => l._id === selectedLesson);
      const state = {
        studiedLanguage,
        hintLanguage,
        selectedLevel,
        selectedLesson,
        selectedLessonTitle: selectedLessonObj?.title || selectedLessonTitle,
        timestamp: Date.now()
      };
      localStorage.setItem('lessonSelectionState', JSON.stringify(state));
    }
  }, [studiedLanguage, hintLanguage, selectedLevel, selectedLesson, selectedLessonTitle, lessons]);
  
  // === ЗАГРУЗКА МЕТА-ДАННЫХ (без изменений) ===
  useEffect(() => {
    const loadMetaData = async () => {
      try {
        setLoadingMeta(true);
        
        const languagesResponse = await fetch(`${API_BASE_URL}/available-languages`);
        if (languagesResponse.ok) {
          const languages = await languagesResponse.json();
          setAvailableLanguages(languages);
        }
        
        const testsResponse = await fetch(`${API_BASE_URL}/tests`);
        if (testsResponse.ok) {
          const testsData = await testsResponse.json();
          setTests(testsData);
        }
        
        setBackendStatus('connected');
        setDebugInfo(`Бэкенд подключен! Языков: ${availableLanguages.length}`);
      } catch (error) {
        console.error('Error loading meta data:', error);
        setBackendStatus('error');
        setDebugInfo(`Ошибка загрузки: ${error.message}`);
      } finally {
        setLoadingMeta(false);
      }
    };

    loadMetaData();
  }, []);

  // === ЗАГРУЗКА УРОКОВ (без изменений) ===
  useEffect(() => {
    const loadLessons = async () => {
      if (!selectedLevel || !studiedLanguage || !hintLanguage) {
        setLessons([]);
        setLessonModules([]);
        return;
      }

      setLoading(true);
      
      try {
        const params = new URLSearchParams();
        params.append('level', selectedLevel);
        params.append('studiedLanguage', studiedLanguage);
        params.append('hintLanguage', hintLanguage);
        
        const url = `${API_BASE_URL}/all-lessons?${params.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const lessonsData = await response.json();
        
        // Фильтруем уроки с модулями
        const lessonsWithModules = [];
        
        for (const lesson of lessonsData) {
          if (lesson.source === 'mongodb') {
            try {
              const modulesResponse = await fetch(`${API_BASE_URL}/lessons/${lesson._id}/modules`);
              if (modulesResponse.ok) {
                const modules = await modulesResponse.json();
                if (modules.length > 0) {
                  lessonsWithModules.push(lesson);
                }
              }
            } catch (error) {
              console.error(`Ошибка проверки урока "${lesson.title}":`, error);
            }
          } else if (lesson.source === 'table') {
            const existsInMongo = lessonsData.some(l => l.source === 'mongodb' && l.title === lesson.title);
            if (!existsInMongo) {
              try {
                const modulesResponse = await fetch(`${API_BASE_URL}/lesson-modules/by-table-lesson/${lesson._id}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`);
                if (modulesResponse.ok) {
                  const modules = await modulesResponse.json();
                  if (modules.length > 0) {
                    lessonsWithModules.push(lesson);
                  }
                }
              } catch (error) {
                console.error(`Ошибка проверки табличного урока:`, error);
              }
            }
          }
        }
        
        setLessons(lessonsWithModules);
        
        if (selectedLesson && !lessonsWithModules.some(l => l._id === selectedLesson)) {
          setSelectedLesson('');
          setSelectedLessonTitle('');
          setLessonModules([]);
        }
        
      } catch (error) {
        console.error('Ошибка загрузки уроков:', error);
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    if (backendStatus === 'connected') {
      loadLessons();
    }
  }, [selectedLevel, studiedLanguage, hintLanguage, backendStatus]);

  // === ЗАГРУЗКА МОДУЛЕЙ (без изменений) ===
  const loadLessonModules = async (lessonId) => {
    if (!lessonId) return;
    
    setLoadingModules(true);
    try {
      let endpoint;
      
      if (lessonId.startsWith('table_')) {
        endpoint = `${API_BASE_URL}/lesson-modules/by-table-lesson/${lessonId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`;
      } else {
        endpoint = `${API_BASE_URL}/lessons/${lessonId}/modules`;
      }
      
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const modules = await response.json();
        setLessonModules(modules);
      } else {
        setLessonModules([]);
      }
    } catch (error) {
      console.error('Error loading lesson modules:', error);
      setLessonModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  // === ЗАПУСК МОДУЛЯ (без изменений) ===
  const startModule = (module) => {
    if (!selectedLesson) return;

    fetch(`${API_BASE_URL}/learning/lesson-structure/${selectedLesson}`)
      .then(res => res.json())
      .then(data => {
        const structure = data.structure || [];
        const currentIndex = structure.findIndex(item => item.moduleId === module._id);
        let nextModuleId = null;
        
        if (currentIndex < structure.length - 1) {
          nextModuleId = structure[currentIndex + 1].moduleId;
        }
        
        const baseParams = `module=${module._id}&lesson=${selectedLesson}&studied=${studiedLanguage}&hint=${hintLanguage}`;
        const nextParam = nextModuleId ? `&next=${nextModuleId}` : '';
        
        router.push(`/module-flow?${baseParams}${nextParam}`);
      })
      .catch(error => {
        console.error('Error loading lesson structure:', error);
        router.push(`/sentence-learning?module=${module._id}&lesson=${selectedLesson}&studied=${studiedLanguage}&hint=${hintLanguage}`);
      });
  };

  // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (без изменений) ===
  const getModuleTypeDisplayName = (typeId) => {
    const typeMap = {
      1: t('module.lexicon'),
      2: t('module.test'), 
      3: t('module.phrases'),
      4: t('module.questions'),
      5: t('module.podcast'),
      6: t('module.text'),
      7: t('module.video'),
      8: t('module.grammar'),
      9: t('module.universal_test')
    };
    return typeMap[typeId] || `Тип ${typeId}`;
  };

  const getModuleTypeDescription = (typeId) => {
    const descriptionMap = {
      1: t('module.lexicon_desc'),
      2: t('module.test_desc'),
      3: t('module.phrases_desc'), 
      4: t('module.questions_desc'),
      5: t('module.podcast_desc'),
      6: t('module.text_desc'),
      7: t('module.video_desc'),
      8: t('module.grammar_desc')
    };
    return descriptionMap[typeId] || '';
  };

  const getModuleTypeIcon = (typeId) => {
    const iconMap = {
      1: '📚', 2: '📝', 3: '💬', 4: '❓', 5: '🎧', 6: '📄', 7: '🎬', 8: '📊', 9: '📋'
    };
    return iconMap[typeId] || '📁';
  };

  // === ГРУППИРОВКА МОДУЛЕЙ (без изменений) ===
  const groupedModules = lessonModules.reduce((groups, module) => {
    const typeName = getModuleTypeDisplayName(module.typeId);
    if (!groups[typeName]) {
      groups[typeName] = [];
    }
    groups[typeName].push(module);
    return groups;
  }, {});

  // ⭐⭐⭐ УБРАЛИ ФИЛЬТРАЦИЮ ТЕСТОВ — показываем ВСЕ тесты с бэка ⭐⭐⭐
  // (раньше было: const filteredTests = tests.filter(...))

  return (
    <>
      {/* CSS переменные из HTML макета */}
      <style jsx global>{`
        :root {
          --background: 0 0% 96%;
          --foreground: 0 0% 7%;
          --primary: 176 46% 65%;
          --primary-foreground: 0 0% 7%;
          --accent: 307 61% 72%;
          --accent-foreground: 0 0% 7%;
          --muted: 0 0% 43%;
          --page: 0 0% 96%;
          --topbar: 0 0% 91%;
          --card: 0 0% 94%;
          --button: 176 46% 65%;
          --lexicon-panel: 203 45% 91%;
          --phrases-panel: 97 41% 90%;
          --text-panel: 350 58% 92%;
          --grammar-panel: 243 57% 93%;
          --audio-panel: 26 54% 90%;
          --video-panel: 311 46% 91%;
          --border: 0 0% 7%;
          --input: 0 0% 7%;
          --ring: 176 46% 65%;
          --radius: 0px;
          --font-body: 'Arial', system-ui, sans-serif;
        }
        body {
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
          font-family: var(--font-body);
        }
        .font-body { font-family: var(--font-body); }
      `}</style>

      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-body">
        <div className="max-w-7xl mx-auto">
          
          {/* === HEADER (как в HTML макете) === */}
          <section className="bg-[hsl(var(--topbar))] border-b border-[hsl(var(--foreground))]/20 w-full sticky top-0 z-50">
            <div className="flex items-center justify-between px-2 py-1 min-h-[42px]">
              
              {/* Left: Logo/Icon */}
              <div className="flex items-center flex-shrink-0">
                <div className="w-8 h-7 bg-[hsl(var(--primary))] flex items-center justify-center border border-[hsl(var(--foreground))]/30">
                  <span className="text-sm">📚</span>
                </div>
              </div>

              {/* Center: Nav filters (компактные селектры) */}
              <nav className="flex items-center gap-2 flex-1 justify-center overflow-x-auto px-2">
                <select
                  value={studiedLanguage}
                  onChange={(e) => setStudiedLanguage(e.target.value)}
                  className="text-xs text-[hsl(var(--primary))] bg-transparent border border-[hsl(var(--border))]/20 rounded px-2 py-1 cursor-pointer hover:bg-[hsl(var(--card))] focus:outline-none focus:border-[hsl(var(--primary))] max-w-[120px]"
                  disabled={loadingMeta || backendStatus !== 'connected'}
                >
                  <option value="">{t('filter.studied_language') || 'Изучаемый'}</option>
                  {availableLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>

                <select
                  value={hintLanguage}
                  onChange={(e) => setHintLanguage(e.target.value)}
                  className="text-xs text-[hsl(var(--primary))] bg-transparent border border-[hsl(var(--border))]/20 rounded px-2 py-1 cursor-pointer hover:bg-[hsl(var(--card))] focus:outline-none focus:border-[hsl(var(--primary))] max-w-[120px]"
                  disabled={loadingMeta || backendStatus !== 'connected'}
                >
                  <option value="">{t('filter.hint_language') || 'Подсказка'}</option>
                  {availableLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>

                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="text-xs text-[hsl(var(--primary))] bg-transparent border border-[hsl(var(--border))]/20 rounded px-2 py-1 cursor-pointer hover:bg-[hsl(var(--card))] focus:outline-none focus:border-[hsl(var(--primary))] max-w-[80px]"
                  disabled={loadingMeta || backendStatus !== 'connected'}
                >
                  <option value="">{t('filter.level') || 'Уровень'}</option>
                  {['A0','A0+','A1','A2','A2+','B1','B1+','B2','C1','C2'].map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>

                <select
                  value={selectedLesson}
                  onChange={handleLessonSelect}
                  className="text-xs text-[hsl(var(--primary))] bg-transparent border border-[hsl(var(--border))]/20 rounded px-2 py-1 cursor-pointer hover:bg-[hsl(var(--card))] focus:outline-none focus:border-[hsl(var(--primary))] max-w-[180px] truncate"
                  disabled={loading || !selectedLevel || !studiedLanguage || !hintLanguage || backendStatus !== 'connected'}
                >
                  <option value="">
                    {loading ? 'Загрузка...' : 
                     !selectedLevel ? 'Выберите уровень' :
                     !studiedLanguage || !hintLanguage ? 'Выберите языки' :
                     lessons.length === 0 ? 'Нет уроков' :
                     'Выберите урок'}
                  </option>
                  {lessons.map((lesson) => (
                    <option key={lesson._id} value={lesson._id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              </nav>

              {/* Right: Account + Country (как в HTML) */}
              <div className="flex flex-col items-end flex-shrink-0">
                <button 
                  onClick={() => router.push('/login')}
                  className="flex items-center gap-1 hover:opacity-80"
                >
                  <span className="text-xs whitespace-nowrap">Вход/Рег</span>
                  <div className="w-4 h-4 bg-[hsl(var(--primary))] flex items-center justify-center">
                    <span className="text-[10px]">👤</span>
                  </div>
                </button>
                <span className="text-[10px] text-[hsl(var(--primary))] whitespace-nowrap">
                  {userCountry || 'Определение...'}
                </span>
              </div>
            </div>

            {/* Мобильное меню */}
            {isMenuOpen && (
              <div className="md:hidden py-4 px-2 border-t border-[hsl(var(--border))]/10 space-y-3">
                <select
                  value={studiedLanguage}
                  onChange={(e) => setStudiedLanguage(e.target.value)}
                  className="w-full border border-[hsl(var(--border))]/20 rounded px-3 py-2 text-sm bg-[hsl(var(--background))]"
                >
                  <option value="">{t('filter.studied_language') || 'Изучаемый'}</option>
                  {availableLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </select>

                <select
                  value={hintLanguage}
                  onChange={(e) => setHintLanguage(e.target.value)}
                  className="w-full border border-[hsl(var(--border))]/20 rounded px-3 py-2 text-sm bg-[hsl(var(--background))]"
                >
                  <option value="">{t('filter.hint_language') || 'Подсказка'}</option>
                  {availableLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </select>

                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full border border-[hsl(var(--border))]/20 rounded px-3 py-2 text-sm bg-[hsl(var(--background))]"
                >
                  <option value="">{t('filter.level') || 'Уровень'}</option>
                  {['A0','A0+','A1','A2','A2+','B1','B1+','B2','C1','C2'].map(level => <option key={level} value={level}>{level}</option>)}
                </select>

                <select
                  value={selectedLesson}
                  onChange={handleLessonSelect}
                  className="w-full border border-[hsl(var(--border))]/20 rounded px-3 py-2 text-sm bg-[hsl(var(--background))]"
                  disabled={loading || !selectedLevel || !studiedLanguage || !hintLanguage}
                >
                  <option value="">{t('filter.lesson') || 'Урок'}</option>
                  {lessons.map((lesson) => (
                    <option key={lesson._id} value={lesson._id}>{lesson.title}</option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* === LESSON META (как в HTML) === */}
          <section className="bg-[hsl(var(--background))] px-4 py-3 border-b border-[hsl(var(--foreground))]/10">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-[2px]">
                <span className="text-[10px] text-[hsl(var(--muted))]">Название урока:</span>
                <span className="text-sm font-bold">
                  {selectedLessonTitle || lessons.find(l => l._id === selectedLesson)?.title || 'НЕ ВЫБРАН'}
                </span>
              </div>
              <div className="flex flex-col gap-[2px] text-right">
                <span className="text-xs">
                  {studiedLanguage || 'Русский'} 
                  <span className="text-[hsl(var(--muted))]"> ({hintLanguage || 'Английский'})</span>
                </span>
                <span className="text-xs">
                  Уровень - {selectedLevel || '—'}
                </span>
              </div>
            </div>
          </section>

          <main>
            {/* === СЕТКА МОДУЛЕЙ (3 колонки как в HTML) === */}
            <section className="px-2 py-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[8px]">
              {loadingModules ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : !selectedLesson ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-6xl mb-4">📚</div>
                  <p className="text-[hsl(var(--muted))] text-sm">
                    Выберите языки, уровень и урок в шапке
                  </p>
                </div>
              ) : lessonModules.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-[hsl(var(--muted))] text-sm mb-3">
                    {t('status.no_modules') || 'Модули не найдены'}
                  </p>
                  <button 
                    onClick={() => loadLessonModules(selectedLesson)}
                    className="text-xs text-[hsl(var(--primary))] hover:underline"
                  >
                    {t('button.try_again') || 'Повторить'}
                  </button>
                </div>
              ) : (
                Object.entries(groupedModules).map(([typeName, modules]) => {
                  const typeId = modules[0]?.typeId;
                  const panelColors = {
                    1: 'bg-[hsl(var(--lexicon-panel))]',
                    2: 'bg-[hsl(var(--accent))]',
                    3: 'bg-[hsl(var(--phrases-panel))]',
                    4: 'bg-[hsl(var(--phrases-panel))]',
                    5: 'bg-[hsl(var(--audio-panel))]',
                    6: 'bg-[hsl(var(--text-panel))]',
                    7: 'bg-[hsl(var(--video-panel))]',
                    8: 'bg-[hsl(var(--grammar-panel))]',
                    9: 'bg-[hsl(var(--accent))]'
                  };
                  const panelBg = panelColors[typeId] || 'bg-[hsl(var(--card))]';
                  
                  return (
                    <div key={typeName} className="border border-[#9E9E9E]">
                      <div className={`${panelBg} px-2 py-1 flex items-center gap-2`}>
                        <span>{getModuleTypeIcon(typeId)}</span>
                        <span className="font-bold text-xs uppercase">{typeName}</span>
                      </div>
                      <div className="bg-[hsl(var(--background))] px-2 py-1 flex flex-col gap-[2px]">
                        {modules.map(module => (
                          <button
                            key={module._id}
                            onClick={() => startModule(module)}
                            className="text-xs text-left hover:underline hover:text-[hsl(var(--primary))] truncate py-0.5"
                          >
                            {module.title || typeName}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </section>

            {/* ⭐⭐⭐ СЕКЦИЯ ТЕСТОВ — ВСЕ ТЕСТЫ С БЭКА, БЕЗ ФИЛЬТРАЦИИ ⭐⭐⭐ */}
            <section className="px-2 py-2 bg-[hsl(var(--background))]">
              <h2 className="text-sm font-normal mb-2 px-1">
                {t('tests.title') || 'ТЕСТЫ'}
              </h2>
              
              {tests.length > 0 ? (
                <div className="flex flex-row gap-2 px-1 overflow-x-auto pb-2">
                  {tests.map(test => (
                    <button
                      key={test._id}
                      onClick={() => router.push(`/test?test=${test._id}&studied=${test.studiedLanguage}&hint=${test.hintLanguage}`)}
                      className="flex-1 min-w-[160px] border border-[#9E9E9E] bg-[hsl(var(--card))] flex flex-col hover:opacity-90 text-left"
                    >
                      <div className="bg-[hsl(var(--card))] px-2 py-1 border-b border-[#9E9E9E]">
                        <div className="text-xs font-bold truncate">{test.theme}</div>
                      </div>
                      <div className="px-2 py-1 flex flex-col gap-0 flex-1">
                        <div className="text-[10px] text-[hsl(var(--muted))]">
                          {test.studiedLanguage} ({test.hintLanguage})
                        </div>
                        <div className="text-[10px]">
                          Уровень - {test.level}
                        </div>
                      </div>
                      <div className="bg-[hsl(var(--button))] border-t border-[#7AA7A3] px-2 py-1 text-center">
                        <span className="text-[10px]">
                          {t('tests.start') || 'Начать'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-[hsl(var(--card))] border border-[#9E9E9E] p-4 text-center">
                  <p className="text-xs text-[hsl(var(--muted))]">
                    {t('tests.not_found') || 'Тесты не найдены'}
                  </p>
                </div>
              )}
            </section>

            {/* === ОТЛАДКА (dev mode) === */}
            {/* {process.env.NODE_ENV === 'development' && (
              <section className="px-2 py-2 border-t border-[hsl(var(--border))]/10">
                <details>
                  <summary className="text-[10px] text-[hsl(var(--muted))] cursor-pointer">🔧 Отладка</summary>
                  <div className="mt-2 text-[10px] font-mono text-[hsl(var(--muted))] space-y-1 bg-[hsl(var(--card))] p-2">
                    <div>Backend: {backendStatus === 'connected' ? '✅' : '❌'}</div>
                    <div>Изучаемый: {studiedLanguage || '—'}</div>
                    <div>Подсказка: {hintLanguage || '—'}</div>
                    <div>Уровень: {selectedLevel || '—'}</div>
                    <div>Уроков: {lessons.length}</div>
                    <div>Модулей: {lessonModules.length}</div>
                    <div>Тестов всего: {tests.length}</div>
                    <div>Страна: {userCountry}</div>
                    {debugInfo && <div>{debugInfo}</div>}
                  </div>
                </details>
              </section>
            )} */}
          </main>
        </div>
      </div>
    </>
  );
}