// app/video-learning/page.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'https://learn-lng-new-client-lrqy.onrender.com/api';

export default function VideoLearningComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const moduleId = searchParams?.get('module');
  const lessonId = searchParams?.get('lesson');
  const studiedLanguage = searchParams?.get('studied') || 'русский';
  const hintLanguage = searchParams?.get('hint') || 'английский';
  const nextModuleId = searchParams?.get('next'); // ID следующего модуля (как запасной вариант)
  
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lessonInfo, setLessonInfo] = useState(null);
  
  // ===== СОСТОЯНИЯ ДЛЯ УПРАВЛЕНИЯ ПОСЛЕДОВАТЕЛЬНОСТЬЮ =====
  const [showTranscripts, setShowTranscripts] = useState(false);
  const [hasCompletedFirstWatch, setHasCompletedFirstWatch] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  // ===== СОСТОЯНИЯ ДЛЯ ОЗВУЧКИ =====
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [selectedHintVoice, setSelectedHintVoice] = useState(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [audioSupported, setAudioSupported] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null); // 'original', 'hint', 'hint-sentence'

  const synthesisRef = useRef(null);
  const videoRef = useRef(null);
  const utteranceRef = useRef(null);

  // Приоритетные голоса для разных языков
  const PREFERRED_VOICES = {
    'русский': ['Google русский', 'Milena', 'Russian', 'ru'],
    'english': ['Google UK English', 'Google US English', 'Microsoft David', 'Microsoft Zira', 'Samantha', 'Karen', 'Daniel'],
    'турецкий': ['Google Türkçe', 'Turkish', 'tr'],
    'turkish': ['Google Türkçe', 'Turkish', 'tr'],
    'английский': ['Google UK English', 'Google US English', 'Microsoft David', 'Microsoft Zira', 'Samantha', 'Karen', 'Daniel']
  };

  // Маппинг языков на коды
  const LANGUAGE_CODES = {
    'русский': 'ru',
    'russian': 'ru',
    'английский': 'en',
    'english': 'en',
    'турецкий': 'tr',
    'turkish': 'tr',
    'немецкий': 'de',
    'german': 'de',
    'французский': 'fr',
    'french': 'fr',
    'испанский': 'es',
    'spanish': 'es',
    'итальянский': 'it',
    'italian': 'it',
    'китайский': 'zh',
    'chinese': 'zh',
    'японский': 'ja',
    'japanese': 'ja',
    'корейский': 'ko',
    'korean': 'ko',
    'арабский': 'ar',
    'arabic': 'ar'
  };

  // ===== НОВАЯ ФУНКЦИЯ: переход к следующему модулю =====
  const goToNextModule = useCallback(async () => {
    try {
      console.log('🔍 Video: Looking for next module after', moduleId);
      console.log('🔍 Video: Lesson ID', lessonId);
      console.log('🔍 Video: Languages', studiedLanguage, hintLanguage);
      
      // Загружаем актуальную структуру урока с языками
      const response = await fetch(
        `${API_BASE_URL}/learning/lesson-structure/${lessonId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const structure = data.structure || [];
      
      console.log('🔍 Video: Lesson structure loaded, length:', structure.length);
      console.log('🔍 Video: Structure items:', structure.map((s, i) => `${i+1}. ${s.title} (${s.type}) - ${s.moduleId}`));
      
      // Находим текущий модуль в структуре
      const currentIndex = structure.findIndex(item => item.moduleId === moduleId);
      console.log('🔍 Video: Current index in structure:', currentIndex);
      
      // Определяем следующий модуль
      let actualNextModuleId = null;
      if (currentIndex >= 0 && currentIndex < structure.length - 1) {
        actualNextModuleId = structure[currentIndex + 1].moduleId;
        console.log('🔍 Video: Actual next module is', actualNextModuleId);
        console.log('🔍 Video: Next module title:', structure[currentIndex + 1]?.title);
        console.log('🔍 Video: Next module type:', structure[currentIndex + 1]?.type);
      } else {
        console.log('🔍 Video: This is the last module in the lesson');
        if (currentIndex === -1) {
          console.log('🔍 Video: WARNING - Current module not found in structure!');
        }
      }
      
      if (actualNextModuleId) {
        // Есть следующий модуль - переходим через ModuleFlow с актуальным ID
        const nextUrl = `/module-flow?module=${actualNextModuleId}&lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`;
        console.log('🔍 Video: Redirecting to:', nextUrl);
        router.push(nextUrl);
      } else {
        // Нет следующего модуля - на главную
        console.log('🔍 Video: No next module, going to home');
        router.push('/');
      }
      
    } catch (error) {
      console.error('🔍 Video: Error loading lesson structure:', error);
      
      // Если не удалось загрузить структуру, пробуем использовать next из URL как запасной вариант
      if (nextModuleId) {
        console.log('🔍 Video: Falling back to next from URL:', nextModuleId);
        router.push(`/module-flow?module=${nextModuleId}&lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`);
      } else {
        router.push('/');
      }
    }
  }, [moduleId, lessonId, studiedLanguage, hintLanguage, nextModuleId, router]);

  // Проверка поддержки синтеза речи
  const checkSpeechSupport = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const hasSpeechSynthesis = 'speechSynthesis' in window;
    const hasSpeechUtterance = 'SpeechSynthesisUtterance' in window;
    
    if (!hasSpeechSynthesis || !hasSpeechUtterance) {
      console.warn('Ваш браузер не поддерживает синтез речи');
      return false;
    }
    
    return true;
  }, []);

  // Функция для поиска лучшего голоса для конкретного языка
  const findBestVoice = useCallback((availableVoices, language) => {
    const langLowerCase = language.toLowerCase();
    const langCode = LANGUAGE_CODES[langLowerCase] || langLowerCase.substring(0, 2);
    
    console.log(`Поиск голоса для языка: ${language} (код: ${langCode})`);
    
    // Сначала ищем Google голоса (они обычно лучшего качества)
    const googleVoices = availableVoices.filter(voice => 
      voice && voice.lang && voice.lang.startsWith(langCode) && 
      voice.name && voice.name.toLowerCase().includes('google')
    );
    
    if (googleVoices.length > 0) {
      console.log(`Найдены Google голоса для ${language}:`, googleVoices.map(v => v.name));
      return googleVoices[0];
    }
    
    // Затем ищем по списку предпочтительных голосов для этого языка
    const preferredForLang = PREFERRED_VOICES[langLowerCase] || [];
    for (const preferredName of preferredForLang) {
      const voice = availableVoices.find(v => 
        v && v.lang && v.lang.startsWith(langCode) && 
        v.name && v.name.toLowerCase().includes(preferredName.toLowerCase())
      );
      if (voice) {
        console.log(`Найден предпочтительный голос для ${language}:`, voice.name);
        return voice;
      }
    }
    
    // Если ничего не нашли, берем любой голос с правильным языком
    const anyVoice = availableVoices.find(v => v && v.lang && v.lang.startsWith(langCode));
    if (anyVoice) {
      console.log(`Найден любой голос для ${language}:`, anyVoice.name);
      return anyVoice;
    }
    
    // Если голос для этого языка не найден, ищем похожий
    console.log(`Голос для ${language} не найден, ищем похожий...`);
    const similarVoice = availableVoices.find(v => 
      v && v.lang && v.lang.startsWith(langCode.substring(0, 2))
    );
    
    if (similarVoice) {
      console.log(`Найден похожий голос:`, similarVoice.name);
      return similarVoice;
    }
    
    return null;
  }, []);

  // Инициализация синтеза речи
  useEffect(() => {
    const supported = checkSpeechSupport();
    setAudioSupported(supported);
    
    if (supported && typeof window !== 'undefined' && window.speechSynthesis) {
      synthesisRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        try {
          const availableVoices = window.speechSynthesis.getVoices();
          console.log('Доступные голоса:', availableVoices.map(v => ({ name: v.name, lang: v.lang })));
          setVoices(availableVoices);
          
          if (availableVoices.length > 0) {
            // Выбираем голос для изучаемого языка
            const bestStudiedVoice = findBestVoice(availableVoices, studiedLanguage);
            if (bestStudiedVoice) {
              console.log(`Выбран голос для изучаемого языка (${studiedLanguage}):`, bestStudiedVoice.name);
              setSelectedVoice(bestStudiedVoice);
            }

            // Выбираем голос для языка подсказки
            const bestHintVoice = findBestVoice(availableVoices, hintLanguage);
            if (bestHintVoice) {
              console.log(`Выбран голос для подсказки (${hintLanguage}):`, bestHintVoice.name);
              setSelectedHintVoice(bestHintVoice);
            }
          }
        } catch (e) {
          console.warn('Ошибка при загрузке голосов:', e);
        }
      };

      loadVoices();
      
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }

      setIsInitialized(true);
    }
  }, [studiedLanguage, hintLanguage, checkSpeechSupport, findBestVoice]);

  // Функция озвучки текста
  const speak = useCallback((text, language, type) => {
    if (!isAudioEnabled || !synthesisRef.current || !text || text === '—' || !audioSupported) {
      return;
    }

    if (!window.speechSynthesis) {
      console.warn('Ваш браузер не поддерживает синтез речи');
      return;
    }

    // Останавливаем текущую озвучку
    if (synthesisRef.current.speaking) {
      try {
        synthesisRef.current.cancel();
      } catch (e) {
        console.warn('Ошибка при остановке озвучки:', e);
      }
    }

    let utterance;
    try {
      utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
    } catch (e) {
      console.error('Ошибка создания SpeechSynthesisUtterance:', e);
      return;
    }
    
    // Определяем код языка
    const langLowerCase = language.toLowerCase();
    const langCode = LANGUAGE_CODES[langLowerCase] || langLowerCase.substring(0, 2);
    
    // Формируем полный код языка с регионом
    const regionMap = {
      'ru': 'ru-RU',
      'en': 'en-US',
      'tr': 'tr-TR',
      'de': 'de-DE',
      'fr': 'fr-FR',
      'es': 'es-ES',
      'it': 'it-IT',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'ar': 'ar-SA'
    };
    
    utterance.lang = regionMap[langCode] || `${langCode}-${langCode.toUpperCase()}`;
    
    // Настройка скорости в зависимости от языка
    const rateMap = {
      'ru': 0.9,
      'en': 0.85,
      'tr': 0.9,
      'de': 0.85,
      'fr': 0.9,
      'es': 0.9,
      'it': 0.9,
      'zh': 0.8,
      'ja': 0.85,
      'ko': 0.85
    };
    
    utterance.rate = rateMap[langCode] || 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Выбираем голос в зависимости от типа
    try {
      if (type === 'original' && selectedVoice) {
        utterance.voice = selectedVoice;
      } else if (type === 'hint' && selectedHintVoice) {
        utterance.voice = selectedHintVoice;
      } else {
        const availableVoices = window.speechSynthesis.getVoices();
        const bestVoice = findBestVoice(availableVoices, language);
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      }
    } catch (e) {
      console.warn('Ошибка при выборе голоса:', e);
    }
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentlyPlaying(type);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentlyPlaying(null);
      utteranceRef.current = null;
    };
    
    utterance.onerror = (event) => {
      if (event.error === 'interrupted' || event.error === 'canceled') {
        return;
      }
      
      console.warn('Ошибка озвучки:', event.error);
      setIsSpeaking(false);
      setCurrentlyPlaying(null);
      utteranceRef.current = null;
    };
    
    setTimeout(() => {
      try {
        if (synthesisRef.current && !synthesisRef.current.speaking) {
          synthesisRef.current.speak(utterance);
        }
      } catch (e) {
        console.warn('Ошибка при запуске озвучки:', e);
      }
    }, 50);
  }, [isAudioEnabled, selectedVoice, selectedHintVoice, audioSupported, findBestVoice]);

  // Остановка озвучки при размонтировании
  useEffect(() => {
    return () => {
      if (synthesisRef.current) {
        try {
          synthesisRef.current.cancel();
        } catch (e) {}
      }
    };
  }, []);

  // ===== СБРОС СОСТОЯНИЯ ПРИ СМЕНЕ ВИДЕО =====
  useEffect(() => {
    if (videos[currentIndex]) {
      setShowTranscripts(false);
      setHasCompletedFirstWatch(false);
      setVideoEnded(false);
      
      // Останавливаем озвучку при смене видео
      if (synthesisRef.current) {
        try {
          synthesisRef.current.cancel();
        } catch (e) {}
      }
      setIsSpeaking(false);
      setCurrentlyPlaying(null);
    }
  }, [currentIndex, videos]);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        console.log('Loading videos for module:', moduleId);
        
        if (!moduleId) {
          throw new Error('Module ID not provided');
        }
        
        // Загружаем информацию об уроке
        if (lessonId) {
          let lessonResponse;
          if (lessonId.startsWith('table_')) {
            lessonResponse = await fetch(`${API_BASE_URL}/table-lessons/${lessonId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`);
          } else {
            lessonResponse = await fetch(`${API_BASE_URL}/lessons/${lessonId}`);
          }
          
          if (lessonResponse.ok) {
            const lesson = await lessonResponse.json();
            setLessonInfo(lesson);
          }
        }
        
        // Загружаем видео модуля
        const videosResponse = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/videos`);
        
        if (!videosResponse.ok) {
          throw new Error('Failed to load videos');
        }
        
        const videosData = await videosResponse.json();
        console.log('Videos loaded:', videosData);
        
        const validVideos = videosData.filter(v => v.videoUrl && v.videoUrl !== 'pending');
        
        if (validVideos.length === 0) {
          setError('В этом модуле нет видео для просмотра');
        } else {
          setVideos(validVideos);
        }
        
      } catch (err) {
        console.error('Error loading videos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [moduleId, lessonId, studiedLanguage, hintLanguage]);

  // ===== ОСНОВНАЯ ЛОГИКА НАВИГАЦИИ =====
  const handleNext = () => {
    if (!hasCompletedFirstWatch) {
      // Первый раз нажали "Далее" - включаем титры
      setShowTranscripts(true);
      setHasCompletedFirstWatch(true);
      
      // Перематываем на начало и запускаем
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(e => console.error('Play error:', e));
      }
    } else {
      // Второй раз нажали "Далее" - переходим к следующему видео
      if (currentIndex < videos.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Все видео закончились - переходим к следующему модулю
        goToNextModule();
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleBackToMain = () => {
    router.push('/');
  };

  // Обработчик окончания видео
  const handleVideoEnded = () => {
    setVideoEnded(true);
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (isAudioEnabled && synthesisRef.current) {
      try {
        synthesisRef.current.cancel();
      } catch (e) {}
      setIsSpeaking(false);
      setCurrentlyPlaying(null);
    }
  };

  const speakOriginalTranscript = () => {
    if (currentVideo?.originalTranscript) {
      speak(currentVideo.originalTranscript, studiedLanguage, 'original');
    }
  };

  const speakHintTranscript = () => {
    if (currentVideo?.hintTranscript) {
      speak(currentVideo.hintTranscript, hintLanguage, 'hint');
    }
  };

  const speakHint = () => {
    if (currentVideo?.hint) {
      speak(currentVideo.hint, studiedLanguage, 'hint-sentence');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка видео...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={goToNextModule}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Перейти к следующему модулю →
          </button>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-yellow-500 text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Нет видео</h2>
          <p className="text-gray-600 mb-6">В этом модуле пока нет видео для просмотра</p>
          <button
            onClick={goToNextModule}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Перейти к следующему модулю →
          </button>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Верхняя панель */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {lessonInfo?.title || 'Модуль "Видео"'}
            </h1>
            <p className="text-sm text-gray-600">
              Видео {currentIndex + 1} из {videos.length}
            </p>
            {nextModuleId && (
              <p className="text-xs text-green-600 mt-1">
                После завершения: переход к следующему модулю
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {/* Кнопка включения/выключения звука */}
            {audioSupported && (
              <button
                onClick={toggleAudio}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isAudioEnabled 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
                title={isAudioEnabled ? 'Выключить звук' : 'Включить звук'}
              >
                {isAudioEnabled ? '🔊' : '🔇'}
              </button>
            )}
            
            {/* Кнопка настроек голоса */}
            {audioSupported && (
              <button
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                title="Настройки голоса"
              >
                🎤
              </button>
            )}
            
            <button
              onClick={handleBackToMain}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              На главную
            </button>
          </div>
        </div>

        {/* Настройки голоса */}
        <AnimatePresence>
          {showVoiceSettings && audioSupported && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg shadow-xl p-4 mb-6 z-10"
            >
              <h3 className="font-semibold mb-3">Настройки голоса</h3>
              
              {/* Информация о текущих голосах */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">Текущие голоса:</p>
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Для транскрипта ({studiedLanguage}):</span>{' '}
                  {selectedVoice?.name || 'Автоматически'}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  <span className="font-semibold">Для перевода ({hintLanguage}):</span>{' '}
                  {selectedHintVoice?.name || 'Автоматически'}
                </p>
              </div>
              
              {voices.length > 0 && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Голос для транскрипта ({studiedLanguage}):
                    </label>
                    <select
                      value={selectedVoice?.name || ''}
                      onChange={(e) => {
                        const voice = voices.find(v => v.name === e.target.value);
                        setSelectedVoice(voice);
                      }}
                      className="w-full p-2 border rounded text-sm"
                      disabled={!isAudioEnabled}
                    >
                      <option value="">Автоматически</option>
                      {voices
                        .filter(voice => voice.lang && voice.lang.startsWith(LANGUAGE_CODES[studiedLanguage.toLowerCase()] || studiedLanguage.substring(0, 2)))
                        .map(voice => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang}) {voice.name.includes('Google') ? '⭐' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Голос для перевода ({hintLanguage}):
                    </label>
                    <select
                      value={selectedHintVoice?.name || ''}
                      onChange={(e) => {
                        const voice = voices.find(v => v.name === e.target.value);
                        setSelectedHintVoice(voice);
                      }}
                      className="w-full p-2 border rounded text-sm"
                      disabled={!isAudioEnabled}
                    >
                      <option value="">Автоматически</option>
                      {voices
                        .filter(voice => voice.lang && voice.lang.startsWith(LANGUAGE_CODES[hintLanguage.toLowerCase()] || hintLanguage.substring(0, 2)))
                        .map(voice => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang}) {voice.name.includes('Google') ? '⭐' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}
              
              <button
                onClick={() => setShowVoiceSettings(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 py-2 rounded text-sm font-medium"
              >
                Закрыть
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Видеоплеер */}
        <div className="bg-black rounded-2xl overflow-hidden shadow-lg mb-4 relative">
          <video
            ref={videoRef}
            key={currentVideo._id}
            controls
            className="w-full aspect-video"
            controlsList="nodownload"
            autoPlay
            onEnded={handleVideoEnded}
          >
            <source src={currentVideo.videoUrl} type={currentVideo.mimeType || 'video/mp4'} />
            Ваш браузер не поддерживает видео тег.
          </video>
          
          {/* Индикатор режима */}
          <div className="absolute top-4 right-4">
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg ${
              showTranscripts 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-800/80 text-white'
            }`}>
              {showTranscripts ? '📝 С титрами' : '🎧 Без титров'}
            </div>
          </div>
        </div>

        {/* Панель прогресса изучения */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${!hasCompletedFirstWatch ? 'bg-blue-500' : 'bg-green-500'}`} />
              <span className="text-sm font-medium text-gray-700">
                {!hasCompletedFirstWatch ? 'Шаг 1 из 2: Просмотр без титров' : 'Шаг 2 из 2: Просмотр с титрами'}
              </span>
            </div>
            
            {/* Индикатор окончания видео */}
            {videoEnded && (
              <div className="text-xs text-green-600 animate-pulse">
                ✓ Видео завершено
              </div>
            )}
          </div>

          {/* Титры (показываются только после первого нажатия "Далее") */}
          <AnimatePresence>
            {showTranscripts && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="p-4 bg-gray-50 rounded-lg relative group">
                  <h3 className="font-medium mb-2 flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Оригинальные титры ({studiedLanguage}):
                    </span>
                    {/* Кнопка озвучки оригинальных титров */}
                    {audioSupported && (
                      <button
                        onClick={speakOriginalTranscript}
                        disabled={!isAudioEnabled}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          currentlyPlaying === 'original' 
                            ? 'bg-purple-500 text-white animate-pulse' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        title="Озвучить оригинальные титры"
                      >
                        {currentlyPlaying === 'original' ? '🔊' : '🔈'}
                      </button>
                    )}
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{currentVideo.originalTranscript}</p>
                </div>
                
                {currentVideo.hintTranscript && (
                  <div className="p-4 bg-blue-50 rounded-lg relative group">
                    <h3 className="font-medium mb-2 flex items-center justify-between">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Перевод ({hintLanguage}):
                      </span>
                      {/* Кнопка озвучки перевода */}
                      {audioSupported && (
                        <button
                          onClick={speakHintTranscript}
                          disabled={!isAudioEnabled}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            currentlyPlaying === 'hint' 
                              ? 'bg-purple-500 text-white animate-pulse' 
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                          title={`Озвучить перевод на ${hintLanguage}`}
                        >
                          {currentlyPlaying === 'hint' ? '🔊' : '🔈'}
                        </button>
                      )}
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{currentVideo.hintTranscript}</p>
                  </div>
                )}

                {/* Подсказка */}
                {currentVideo.hint && (
                  <div className="p-4 bg-yellow-50 rounded-lg relative group">
                    <h3 className="font-medium mb-2 flex items-center justify-between">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2">💡</span>
                        Подсказка:
                      </span>
                      {/* Кнопка озвучки подсказки */}
                      {audioSupported && (
                        <button
                          onClick={speakHint}
                          disabled={!isAudioEnabled}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            currentlyPlaying === 'hint-sentence' 
                              ? 'bg-purple-500 text-white animate-pulse' 
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                          title="Озвучить подсказку"
                        >
                          {currentlyPlaying === 'hint-sentence' ? '🔊' : '🔈'}
                        </button>
                      )}
                    </h3>
                    <p className="text-gray-700">{currentVideo.hint}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Основная кнопка навигации "Далее" */}
        <div className="mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium text-lg shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            {!hasCompletedFirstWatch ? (
              <>
                Просмотрел без титров →
                <span className="block text-sm text-white/80 mt-1">Включить титры и посмотреть ещё раз</span>
              </>
            ) : currentIndex < videos.length - 1 ? (
              <>
                Следующее видео →
                <span className="block text-sm text-white/80 mt-1">Перейти к следующему видео</span>
              </>
            ) : (
              <>
                Завершить и продолжить →
                <span className="block text-sm text-white/80 mt-1">Перейти к следующему модулю</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Навигация */}
        <div className="bg-white rounded-2xl shadow-lg p-4 flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              currentIndex === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            ← Предыдущее
          </button>
          
          <div className="flex gap-2">
            {videos.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                }}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-blue-500 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Перейти к видео ${index + 1}`}
              />
            ))}
          </div>
          
          <button
            onClick={handleNext}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              currentIndex === videos.length - 1 && hasCompletedFirstWatch
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {currentIndex === videos.length - 1 && hasCompletedFirstWatch
              ? 'Завершить и перейти →'
              : 'Следующее →'
            }
          </button>
        </div>

        {/* Индикатор прогресса */}
        <div className="mt-4 bg-white rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + (hasCompletedFirstWatch ? 0.5 : 0)) / videos.length) * 100}%` }}
          />
          <div className="flex justify-between mt-1 px-1">
            <span className="text-xs text-gray-500">Прогресс: {Math.round(((currentIndex + (hasCompletedFirstWatch ? 0.5 : 0)) / videos.length) * 100)}%</span>
            <span className="text-xs text-gray-500">
              {!hasCompletedFirstWatch ? 'Первый просмотр' : 'Второй просмотр'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}