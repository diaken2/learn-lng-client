// app/learning/page.js - С ДОБАВЛЕННОЙ ПОДДЕРЖКОЙ ПОСЛЕДОВАТЕЛЬНОСТИ
'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'https://learn-lng-new-client-lrqy.onrender.com/api';

export default function LearningComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const lessonId = searchParams?.get('lesson');
  const moduleId = searchParams?.get('module'); // ID модуля (для лексики)
  const studiedLanguage = searchParams?.get('studied') || 'русский';
  const hintLanguage = searchParams?.get('hint') || 'английский';
  const source = searchParams?.get('source') || 'lesson';
  const nextModuleId = searchParams?.get('next'); // ID следующего модуля

  const [lesson, setLesson] = useState(null);
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flags, setFlags] = useState([]);
  
  // Состояния для озвучки
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [selectedHintVoice, setSelectedHintVoice] = useState(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [speakingType, setSpeakingType] = useState(null);
  const [audioSupported, setAudioSupported] = useState(true);

  const synthesisRef = useRef(null);
  const initialSpeakDone = useRef(false);
  const utteranceRef = useRef(null);

  console.log('=== Learning Component Loaded ===');
  console.log('URL params:', {
    lessonId,
    moduleId,
    studied: studiedLanguage,
    hint: hintLanguage,
    source,
    nextModuleId
  });

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

  // Функция перехода к следующему модулю в уроке
  // app/learning/page.js - С ДОБАВЛЕННОЙ ПОДДЕРЖКОЙ ПОСЛЕДОВАТЕЛЬНОСТИ

// Добавьте эту функцию после объявления компонента, перед useEffect'ами

const goToNextModule = useCallback(async () => {
  try {
    console.log('🔍 Learning: Looking for next module after', moduleId);
    console.log('🔍 Learning: Lesson ID', lessonId);
    console.log('🔍 Learning: Languages', studiedLanguage, hintLanguage);
    
    // Загружаем актуальную структуру урока с языками
    const response = await fetch(
      `${API_BASE_URL}/learning/lesson-structure/${lessonId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const structure = data.structure || [];
    
    console.log('🔍 Learning: Lesson structure loaded, length:', structure.length);
    console.log('🔍 Learning: Structure items:', structure.map((s, i) => `${i+1}. ${s.title} (${s.type}) - ${s.moduleId}`));
    
    // Находим текущий модуль в структуре
    const currentIndex = structure.findIndex(item => item.moduleId === moduleId);
    console.log('🔍 Learning: Current index in structure:', currentIndex);
    
    // Определяем следующий модуль
    let actualNextModuleId = null;
    if (currentIndex >= 0 && currentIndex < structure.length - 1) {
      actualNextModuleId = structure[currentIndex + 1].moduleId;
      console.log('🔍 Learning: Actual next module is', actualNextModuleId);
      console.log('🔍 Learning: Next module title:', structure[currentIndex + 1]?.title);
      console.log('🔍 Learning: Next module type:', structure[currentIndex + 1]?.type);
    } else {
      console.log('🔍 Learning: This is the last module in the lesson');
      if (currentIndex === -1) {
        console.log('🔍 Learning: WARNING - Current module not found in structure!');
      }
    }
    
    if (actualNextModuleId) {
      // Есть следующий модуль - переходим через ModuleFlow с актуальным ID
      const nextUrl = `/module-flow?module=${actualNextModuleId}&lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`;
      console.log('🔍 Learning: Redirecting to:', nextUrl);
      router.push(nextUrl);
    } else {
      // Нет следующего модуля - на главную
      console.log('🔍 Learning: No next module, going to home');
      router.push('/');
    }
    
  } catch (error) {
    console.error('🔍 Learning: Error loading lesson structure:', error);
    
    // Если не удалось загрузить структуру, пробуем использовать next из URL как запасной вариант
    if (nextModuleId) {
      console.log('🔍 Learning: Falling back to next from URL:', nextModuleId);
      router.push(`/module-flow?module=${nextModuleId}&lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`);
    } else {
      router.push('/');
    }
  }
}, [moduleId, lessonId, studiedLanguage, hintLanguage, nextModuleId, router]);

// Затем замените функцию goNext на эту версию:

const goNext = () => {
  if (isAnimating || !words.length) return;
  
  if (synthesisRef.current) {
    try {
      synthesisRef.current.cancel();
    } catch (e) {}
  }
  setIsSpeaking(false);
  setSpeakingType(null);
  
  setIsAnimating(true);
  setTimeout(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false);
    } else {
      // Все слова закончились - переходим к следующему модулю
      goToNextModule();
    }
  }, 300);
};

// Также замените кнопку в блоке "Нет слов":

{words.length === 0 && (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-gray-500 text-lg text-center">
      В этом уроке пока нет слов
      <button 
        onClick={goToNextModule}
        className="block mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        {nextModuleId ? 'Перейти к следующему модулю →' : 'Вернуться на главную'}
      </button>
    </div>
  </div>
)}

// И добавьте goToNextModule в массив зависимостей в конце файла
// (в конце компонента, перед закрывающей скобкой)

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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && synthesisRef.current) {
        try {
          if (synthesisRef.current.paused) {
            synthesisRef.current.resume();
          }
        } catch (e) {}
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (synthesisRef.current) {
        try {
          synthesisRef.current.cancel();
        } catch (e) {}
      }
    };
  }, []);

  const speak = useCallback((text, language, type) => {
    if (!isAudioEnabled || !synthesisRef.current || !text || text === '—' || !audioSupported) {
      return;
    }

    if (!window.speechSynthesis) {
      console.warn('Ваш браузер не поддерживает синтез речи');
      return;
    }

    if (synthesisRef.current.speaking) {
      try {
        synthesisRef.current.cancel();
      } catch (e) {}
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
      'en': 0.85, // Английский чуть медленнее для лучшего понимания
      'tr': 0.9,
      'de': 0.85, // Немецкий тоже лучше чуть медленнее
      'fr': 0.9,
      'es': 0.9,
      'it': 0.9,
      'zh': 0.8, // Китайский еще медленнее из-за тонов
      'ja': 0.85,
      'ko': 0.85
    };
    
    utterance.rate = rateMap[langCode] || 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Выбираем голос
    try {
      if (type === 'studied' && selectedVoice) {
        utterance.voice = selectedVoice;
      } else if (type === 'hint' && selectedHintVoice) {
        utterance.voice = selectedHintVoice;
      } else {
        // Если голос не выбран, пытаемся найти подходящий
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
      setSpeakingType(type);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingType(null);
      utteranceRef.current = null;
    };
    
    utterance.onerror = (event) => {
      if (event.error === 'interrupted' || event.error === 'canceled') {
        return;
      }
      
      console.warn('Ошибка озвучки:', {
        error: event.error,
        message: event.message
      });
      
      setIsSpeaking(false);
      setSpeakingType(null);
      utteranceRef.current = null;
      
      try {
        if (synthesisRef.current) {
          synthesisRef.current.cancel();
        }
      } catch (e) {}
    };
    
    utterance.onpause = () => {
      setIsSpeaking(false);
    };
    
    utterance.onresume = () => {
      setIsSpeaking(true);
    };
    
    setTimeout(() => {
      try {
        if (synthesisRef.current && !synthesisRef.current.speaking) {
          synthesisRef.current.speak(utterance);
        } else if (synthesisRef.current) {
          setTimeout(() => {
            try {
              if (synthesisRef.current && !synthesisRef.current.speaking) {
                synthesisRef.current.speak(utterance);
              }
            } catch (e) {}
          }, 100);
        }
      } catch (e) {}
    }, 50);
  }, [isAudioEnabled, selectedVoice, selectedHintVoice, audioSupported, findBestVoice]);

  useEffect(() => {
    return () => {
      if (synthesisRef.current) {
        try {
          synthesisRef.current.cancel();
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    initialSpeakDone.current = false;
  }, [lessonId]);

  // Загружаем флаги
  useEffect(() => {
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
    
    loadFlags();
  }, []);

  // Загружаем урок
  useEffect(() => {
    const loadLesson = async () => {
      if (!lessonId) {
        setError('ID урока не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        let url;
        
        // Если есть moduleId, проверяем, что это модуль "Лексика"
        if (moduleId) {
          url = `${API_BASE_URL}/learning/lexicon-module/${moduleId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`;
          console.log('Loading lexicon module from:', url);
        } else if (source === 'table') {
          url = `${API_BASE_URL}/table-lessons/${lessonId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`;
        } else {
          url = `${API_BASE_URL}/lessons/${lessonId}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ошибка загрузки: ${response.status} - ${errorText}`);
        }
        
        const lessonData = await response.json();
        console.log('Loaded lesson data:', lessonData);
        console.log('Words in lesson:', lessonData.words?.length || 0);
        
        if (!lessonData) {
          setError('Урок не найден');
          return;
        }

        if (lessonData.isLexiconModule) {
          console.log('This is a lexicon module with selected words');
          setLesson(lessonData);
          setWords(lessonData.words || []);
        } else {
          setLesson(lessonData);
          setWords(lessonData.words || []);
        }
        
        setCurrentIndex(0);
        
        if (lessonData.words && lessonData.words.length > 0) {
          console.log('First word details:', lessonData.words[0]);
        }
      } catch (err) {
        console.error('Error loading lesson:', err);
        setError('Ошибка загрузки урока: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [lessonId, moduleId, source, studiedLanguage, hintLanguage]);

  const currentWord = words[currentIndex];

  useEffect(() => {
    if (currentWord && isAudioEnabled && isInitialized && audioSupported) {
      const text = getStudiedText();
      
      const timer = setTimeout(() => {
        speak(text, studiedLanguage, 'studied');
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isAudioEnabled, studiedLanguage, isInitialized, audioSupported]);

  useEffect(() => {
    if (!loading && currentWord && isAudioEnabled && isInitialized && !initialSpeakDone.current && audioSupported) {
      const text = getStudiedText();
      
      const timer = setTimeout(() => {
        speak(text, studiedLanguage, 'studied');
        initialSpeakDone.current = true;
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [loading, currentWord, isAudioEnabled, isInitialized, audioSupported]);

  useEffect(() => {
    if (currentWord) {
      console.log('Current word:', currentWord);
      console.log('Studied language:', studiedLanguage);
      console.log('Hint language:', hintLanguage);
      console.log('Available translations:', currentWord.translations ? Object.keys(currentWord.translations) : 'none');
    }
  }, [currentWord, studiedLanguage, hintLanguage]);

  const getStudiedText = () => {
    if (!currentWord || !currentWord.translations) return '—';
    
    const studiedKey = studiedLanguage.toLowerCase();
    const studiedKeyAlt = studiedLanguage;
    
    return currentWord.translations[studiedKey] || 
           currentWord.translations[studiedKeyAlt] || 
           Object.values(currentWord.translations)[0] || 
           '—';
  };

  const getHintText = () => {
    if (!currentWord || !currentWord.translations) return '—';
    
    const hintKey = hintLanguage.toLowerCase();
    const hintKeyAlt = hintLanguage;
    
    return currentWord.translations[hintKey] || 
           currentWord.translations[hintKeyAlt] || 
           Object.values(currentWord.translations)[1] || 
           Object.values(currentWord.translations)[0] || 
           '—';
  };

  const wordText = getStudiedText();
  const hintText = getHintText();
  const imageUrl = currentWord?.imagePng;

 

  const goPrev = () => {
    if (isAnimating || currentIndex === 0) return;
    
    if (synthesisRef.current) {
      try {
        synthesisRef.current.cancel();
      } catch (e) {}
    }
    setIsSpeaking(false);
    setSpeakingType(null);
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(prev => prev - 1);
      setIsAnimating(false);
    }, 300);
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (isAudioEnabled && synthesisRef.current) {
      try {
        synthesisRef.current.cancel();
      } catch (e) {}
      setIsSpeaking(false);
      setSpeakingType(null);
    }
  };

  const replayStudiedAudio = () => {
    speak(wordText, studiedLanguage, 'studied');
  };

  const replayHintAudio = () => {
    speak(hintText, hintLanguage, 'hint');
  };

  const topVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const imageVariants = {
    initial: { scale: 0.8, opacity: 0 },
    enter: { scale: 1, opacity: 1, transition: { duration: 0.5 } },
    exit: { scale: 1.2, opacity: 0, transition: { duration: 0.4 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Загрузка урока...</div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500 text-lg text-center">
          {error || 'Урок не найден'}
          <div className="text-sm text-gray-600 mt-2">
            ID: {lessonId}<br/>
            Источник: {source}
          </div>
          <button 
            onClick={() => router.push('/')}
            className="block mt-4 text-blue-500 hover:text-blue-700"
          >
            ← Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg text-center">
          В этом уроке пока нет слов
          <button 
            onClick={nextModuleId ? goToNextModule : () => router.push('/')}
            className="block mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {nextModuleId ? 'Перейти к следующему модулю →' : 'Вернуться на главную'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative bg-transparent select-none" 
      style={{ 
        backgroundColor: lesson.bgColor || '#f0f0f0', 
        color: lesson.fontColor || '#000000' 
      }}
    >
      {/* Верхняя зона с изучаемым словом */}
      <div className="h-[48vh] bg-gradient-to-b from-blue-300 to-blue-200 flex items-start justify-center relative overflow-visible">
        {/* Флаги и кнопка закрытия */}
        <div className="absolute top-4 left-4 flex items-center space-x-2">
          <div className="w-8 h-6 rounded shadow-lg flex items-center justify-center overflow-hidden border">
            {flags.find(f => f.language.toLowerCase() === studiedLanguage.toLowerCase())?.image ? (
              flags.find(f => f.language.toLowerCase() === studiedLanguage.toLowerCase())?.image.startsWith('http') ? (
                <img 
                  src={flags.find(f => f.language.toLowerCase() === studiedLanguage.toLowerCase())?.image} 
                  alt={studiedLanguage}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-lg">
                  {flags.find(f => f.language.toLowerCase() === studiedLanguage.toLowerCase())?.image}
                </span>
              )
            ) : (
              <span className="flex items-center justify-center w-full h-full bg-red-600 text-white text-xs font-bold">
                {studiedLanguage === 'русский' ? 'RU' : studiedLanguage === 'английский' ? 'EN' : studiedLanguage === 'турецкий' ? 'TR' : studiedLanguage.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Кнопка настроек голоса */}
          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-gray-600 hover:bg-white transition-colors"
            title="Настройки голоса"
          >
            🎤
          </button>
          
          {/* Индикатор поддержки аудио */}
          {!audioSupported && (
            <div className="text-xs text-red-600 bg-white/80 px-2 py-1 rounded">
              Аудио не поддерживается
            </div>
          )}

          {/* Индикатор следующего модуля */}
          {nextModuleId && (
            <div className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
              + следующий модуль
            </div>
          )}
        </div>

        <button 
          onClick={() => router.push('/')}
          className="absolute top-4 right-4 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-gray-600 hover:bg-white transition-colors"
        >
          ×
        </button>

        {/* Прогресс */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-sm text-gray-700 font-medium">
          {currentIndex + 1} / {words.length}
        </div>

        {/* Изучаемое слово */}
        <div className="mt-16 flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.div 
              key={`word-${currentIndex}`}
              initial="hidden"
              animate="visible" 
              exit="hidden" 
              variants={topVariants} 
              className="text-center"
            >
              <motion.div 
                initial={{ scale: 0.98 }} 
                animate={{ scale: 1 }} 
                transition={{ duration: 0.35 }}
                className="text-3xl font-bold tracking-wide px-6 py-3 rounded-lg bg-white/20 backdrop-blur-sm relative group"
                style={{ color: lesson.fontColor }}
              >
                {wordText}
                
                {/* Кнопка воспроизведения изучаемого слова */}
                {audioSupported && (
                  <button
                    onClick={replayStudiedAudio}
                    disabled={!isAudioEnabled}
                    className="absolute -right-12 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                    title={`Повторить на ${studiedLanguage}`}
                  >
                    {isSpeaking && speakingType === 'studied' ? '🔊' : '🔈'}
                  </button>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Картинка */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-[36.5vh]">
          <div style={{ width: 160, height: 160 }} className="pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div 
                key={`image-${currentIndex}`}
                initial="initial"
                animate="enter"
                exit="exit"
                variants={imageVariants}
                className="w-full h-full flex items-center justify-center bg-white/90 rounded-2xl shadow-lg p-4"
              >
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={wordText}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('Image load error:', imageUrl);
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-4xl">🖼️</div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Настройки голоса */}
      <AnimatePresence>
        {showVoiceSettings && audioSupported && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-4 bg-white rounded-lg shadow-xl p-4 z-10 w-96"
          >
            <h3 className="font-semibold mb-3">Настройки голоса</h3>
            
            <div className="flex items-center justify-between mb-4">
              <span>Озвучка</span>
              <button
                onClick={toggleAudio}
                className={`px-3 py-1 rounded-full text-sm ${
                  isAudioEnabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}
              >
                {isAudioEnabled ? 'Вкл' : 'Выкл'}
              </button>
            </div>

            {/* Информация о текущих голосах */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">Текущие голоса:</p>
              <p className="text-xs text-blue-700">
                <span className="font-semibold">Изучаемый ({studiedLanguage}):</span>{' '}
                {selectedVoice?.name || 'Автоматически'}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                <span className="font-semibold">Подсказка ({hintLanguage}):</span>{' '}
                {selectedHintVoice?.name || 'Автоматически'}
              </p>
            </div>
            
            {voices.length > 0 && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Голос для изучаемого языка ({studiedLanguage}):
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
                    Голос для подсказки ({hintLanguage}):
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

      {/* Нижняя зона с подсказкой */}
      <div 
        className="pt-28 pb-12 min-h-[52vh] flex flex-col items-center justify-start"
        style={{ backgroundColor: lesson.fontColor ? `${lesson.fontColor}20` : '#e5e7eb' }}
      >
        {/* Подсказка */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`hint-${currentIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center mb-12"
          >
            <div className="text-lg text-gray-600 mb-2 flex items-center justify-center space-x-2">
              <span>Подсказка на {hintLanguage}</span>
              {audioSupported && (
                <button
                  onClick={replayHintAudio}
                  disabled={!isAudioEnabled}
                  className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors disabled:opacity-30"
                  title={`Озвучить на ${hintLanguage}`}
                >
                  {isSpeaking && speakingType === 'hint' ? '🔊' : '🔈'}
                </button>
              )}
            </div>
            <div className="text-2xl font-semibold text-gray-800 bg-white/60 px-6 py-3 rounded-lg">
              {hintText}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Кнопка следующего слова */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goNext}
          disabled={isAnimating}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-12 py-4 rounded-xl font-medium text-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
        >
          {currentIndex < words.length - 1 
            ? 'Следующее слово →' 
            : (nextModuleId ? 'Завершить и перейти к следующему →' : 'Завершить урок')
          }
        </motion.button>

        {/* Навигация */}
        <div className="flex space-x-4 mt-6">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0 || isAnimating}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Назад
          </button>
          
          <button
            onClick={goNext}
            disabled={isAnimating}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Вперед →
          </button>
        </div>
      </div>

      {/* Флаг языка подсказки */}
      <div className="absolute bottom-4 right-4">
        <div className="w-8 h-6 rounded shadow-lg flex items-center justify-center overflow-hidden border">
          {flags.find(f => f.language.toLowerCase() === hintLanguage.toLowerCase())?.image ? (
            flags.find(f => f.language.toLowerCase() === hintLanguage.toLowerCase())?.image.startsWith('http') ? (
              <img 
                src={flags.find(f => f.language.toLowerCase() === hintLanguage.toLowerCase())?.image} 
                alt={hintLanguage}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-lg">
                {flags.find(f => f.language.toLowerCase() === hintLanguage.toLowerCase())?.image}
              </span>
            )
          ) : (
            <span className="flex items-center justify-center w-full h-full bg-blue-600 text-white text-xs font-bold">
              {hintLanguage === 'русский' ? 'RU' : hintLanguage === 'английский' ? 'EN' : hintLanguage === 'турецкий' ? 'TR' : hintLanguage.substring(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}