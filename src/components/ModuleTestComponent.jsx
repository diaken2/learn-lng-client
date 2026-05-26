// app/module-test/page.js - РЕДИЗАЙН
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'https://learn-lng-new-client-lrqy.onrender.com/api';

// 🎨 Функция отрисовки флага страны по коду языка
const renderFlag = (language, size = 'normal') => {
  const lang = (language || '').toLowerCase();
  const sizes = {
    small: { w: 'w-[40px]', h: 'h-[28px]' },
    normal: { w: 'w-[54px]', h: 'h-[36px]' },
    large: { w: 'w-[60px]', h: 'h-[40px]' },
  };
  const s = sizes[size] || sizes.normal;

  // Русский флаг
  if (['russian', 'русский', 'ru'].includes(lang)) {
    return (
      <div className={`${s.w} ${s.h} flex flex-col overflow-hidden border border-[hsl(var(--border))]/20`}>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-[hsl(var(--primary))]"></div>
        <div className="flex-1 bg-[hsl(var(--accent))]"></div>
      </div>
    );
  }
  // Английский флаг (упрощённый Union Jack)
  if (['english', 'английский', 'en'].includes(lang)) {
    return (
      <div className={`${s.w} ${s.h} bg-[hsl(var(--primary))] relative overflow-hidden border border-[hsl(var(--border))]/20 flex items-center justify-center`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-[6px] bg-white"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-full w-[6px] bg-white"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-[3px] bg-[hsl(var(--accent))]"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-full w-[3px] bg-[hsl(var(--accent))]"></div>
        </div>
      </div>
    );
  }
  // Турецкий флаг
  if (['turkish', 'турецкий', 'tr'].includes(lang)) {
    return (
      <div className={`${s.w} ${s.h} bg-[hsl(var(--accent))] relative overflow-hidden border border-[hsl(var(--border))]/20 flex items-center justify-center`}>
        <div className="w-4 h-4 bg-white rounded-full"></div>
      </div>
    );
  }
  // Немецкий флаг
  if (['german', 'немецкий', 'de'].includes(lang)) {
    return (
      <div className={`${s.w} ${s.h} flex flex-col overflow-hidden border border-[hsl(var(--border))]/20`}>
        <div className="flex-1 bg-black"></div>
        <div className="flex-1 bg-[hsl(var(--accent))]"></div>
        <div className="flex-1 bg-yellow-400"></div>
      </div>
    );
  }
  // Французский
  if (['french', 'французский', 'fr'].includes(lang)) {
    return (
      <div className={`${s.w} ${s.h} flex overflow-hidden border border-[hsl(var(--border))]/20`}>
        <div className="flex-1 bg-[hsl(var(--primary))]"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-[hsl(var(--accent))]"></div>
      </div>
    );
  }
  // Испанский
  if (['spanish', 'испанский', 'es'].includes(lang)) {
    return (
      <div className={`${s.w} ${s.h} flex flex-col overflow-hidden border border-[hsl(var(--border))]/20`}>
        <div className="flex-1 bg-[hsl(var(--accent))]"></div>
        <div className="flex-1 bg-yellow-400"></div>
        <div className="flex-1 bg-[hsl(var(--accent))]"></div>
      </div>
    );
  }
  // Default: просто эмодзи флага
  return (
    <div className={`${s.w} ${s.h} border border-[hsl(var(--border))]/20 bg-white flex items-center justify-center text-xl`}>
      🏳️
    </div>
  );
};

export default function ModuleTestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLastModule, setIsLastModule] = useState(false);

  const [moduleId, setModuleId] = useState('');
  const [testData, setTestData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState([]);
  const [showErrorSound, setShowErrorSound] = useState(false);

  // Параметры для последовательности
  const lessonId = searchParams?.get('lesson');
  const studiedLanguage = searchParams?.get('studied') || 'турецкий';
  const hintLanguage = searchParams?.get('hint') || 'английский';
  const nextModuleId = searchParams?.get('next');

  // 🆕 Прогресс урока
  const [lessonProgress, setLessonProgress] = useState({ current: 0, total: 0 });

  // Состояния для озвучки
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [audioSupported, setAudioSupported] = useState(true);

  // 🆕 Меню настроек урока
  const [showLessonMenu, setShowLessonMenu] = useState(false);

  const synthesisRef = useRef(null);
  const utteranceRef = useRef(null);

  // ========== Загрузка структуры урока для прогресса ==========
  useEffect(() => {
    const loadLessonProgress = async () => {
      if (!lessonId || !moduleId) return;
      try {
        const response = await fetch(
          `${API_BASE_URL}/learning/lesson-structure/${lessonId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`
        );
        if (!response.ok) return;
        const data = await response.json();
        const structure = data.structure || [];
        const currentIndex = structure.findIndex(item => item.moduleId === moduleId);
        setLessonProgress({
          current: currentIndex >= 0 ? currentIndex + 1 : 1,
          total: structure.length || 1,
        });
        setIsLastModule(currentIndex === structure.length - 1);
      } catch (err) {
        console.error('Error loading lesson progress:', err);
      }
    };
    loadLessonProgress();
  }, [lessonId, moduleId, studiedLanguage, hintLanguage]);

  // ========== Переход к следующему модулю ==========
  const goToNextModule = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/learning/lesson-structure/${lessonId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const structure = data.structure || [];
      const currentIndex = structure.findIndex(item => item.moduleId === moduleId);

      let actualNextModuleId = null;
      if (currentIndex >= 0 && currentIndex < structure.length - 1) {
        actualNextModuleId = structure[currentIndex + 1].moduleId;
      }

      if (actualNextModuleId) {
        router.push(`/module-flow?module=${actualNextModuleId}&lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`);
      } else {
        router.push('/');
      }
    } catch (error) {
      if (nextModuleId) {
        router.push(`/module-flow?module=${nextModuleId}&lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`);
      } else {
        router.push('/');
      }
    }
  }, [moduleId, lessonId, studiedLanguage, hintLanguage, nextModuleId, router]);

  // ========== Переход к предыдущему модулю ==========
  const goToPrevModule = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/learning/lesson-structure/${lessonId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const structure = data.structure || [];
      const currentIndex = structure.findIndex(item => item.moduleId === moduleId);
      if (currentIndex > 0) {
        const prevModuleId = structure[currentIndex - 1].moduleId;
        router.push(`/module-flow?module=${prevModuleId}&lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`);
      }
    } catch (error) {
      console.error('Error going to prev module:', error);
    }
  }, [moduleId, lessonId, studiedLanguage, hintLanguage, router]);

  const PREFERRED_VOICES = {
    'русский': ['Google русский', 'Milena', 'Russian', 'ru'],
    'english': ['Google UK English', 'Google US English', 'Microsoft David'],
    'турецкий': ['Google Türkçe', 'Turkish', 'tr'],
    'turkish': ['Google Türkçe', 'Turkish', 'tr'],
    'английский': ['Google UK English', 'Google US English'],
    'немецкий': ['Google Deutsch', 'German', 'de'],
    'german': ['Google Deutsch', 'German', 'de'],
    'французский': ['Google Français', 'French', 'fr'],
    'french': ['Google Français', 'French', 'fr'],
    'испанский': ['Google Español', 'Spanish', 'es'],
    'spanish': ['Google Español', 'Spanish', 'es']
  };

  const LANGUAGE_CODES = {
    'русский': 'ru', 'russian': 'ru', 'английский': 'en', 'english': 'en',
    'турецкий': 'tr', 'turkish': 'tr', 'немецкий': 'de', 'german': 'de',
    'французский': 'fr', 'french': 'fr', 'испанский': 'es', 'spanish': 'es',
    'итальянский': 'it', 'italian': 'it', 'китайский': 'zh', 'chinese': 'zh',
    'японский': 'ja', 'japanese': 'ja', 'корейский': 'ko', 'korean': 'ko',
    'арабский': 'ar', 'arabic': 'ar'
  };

  const currentWord = testData?.words?.[currentQuestion];

  const checkSpeechSupport = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }, []);

  const findBestVoice = useCallback((availableVoices, language) => {
    const langLowerCase = language.toLowerCase();
    const langCode = LANGUAGE_CODES[langLowerCase] || langLowerCase.substring(0, 2);

    const googleVoices = availableVoices.filter(voice =>
      voice?.lang?.startsWith(langCode) && voice.name?.toLowerCase().includes('google')
    );
    if (googleVoices.length > 0) return googleVoices[0];

    const preferredForLang = PREFERRED_VOICES[langLowerCase] || [];
    for (const preferredName of preferredForLang) {
      const voice = availableVoices.find(v =>
        v?.lang?.startsWith(langCode) && v.name?.toLowerCase().includes(preferredName.toLowerCase())
      );
      if (voice) return voice;
    }

    const anyVoice = availableVoices.find(v => v?.lang?.startsWith(langCode));
    if (anyVoice) return anyVoice;

    return availableVoices.find(v => v?.lang?.startsWith(langCode.substring(0, 2))) || null;
  }, []);

  useEffect(() => {
    const supported = checkSpeechSupport();
    setAudioSupported(supported);
    if (supported && window.speechSynthesis) {
      synthesisRef.current = window.speechSynthesis;
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        if (availableVoices.length > 0) {
          const studiedLang = testData?.studiedLanguage || studiedLanguage;
          const bestVoice = findBestVoice(availableVoices, studiedLang);
          if (bestVoice) setSelectedVoice(bestVoice);
        }
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      setIsInitialized(true);
    }
  }, [testData, studiedLanguage, checkSpeechSupport, findBestVoice]);

  const playErrorSound = useCallback(() => {
    if (!isAudioEnabled) return;
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
      setShowErrorSound(true);
      setTimeout(() => setShowErrorSound(false), 300);
    } catch (e) {
      console.warn('Error sound failed:', e);
    }
  }, [isAudioEnabled]);

  const speakCorrectAnswer = useCallback((text) => {
    if (!isAudioEnabled || !synthesisRef.current || !text || text === '—' || !audioSupported) return;
    if (synthesisRef.current.speaking) {
      try { synthesisRef.current.cancel(); } catch {}
    }
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      const studiedLang = testData?.studiedLanguage || studiedLanguage;
      const langCode = LANGUAGE_CODES[studiedLang.toLowerCase()] || studiedLang.substring(0, 2);
      const regionMap = {
        'ru': 'ru-RU', 'en': 'en-US', 'tr': 'tr-TR', 'de': 'de-DE',
        'fr': 'fr-FR', 'es': 'es-ES', 'it': 'it-IT', 'zh': 'zh-CN',
        'ja': 'ja-JP', 'ko': 'ko-KR', 'ar': 'ar-SA'
      };
      utterance.lang = regionMap[langCode] || `${langCode}-${langCode.toUpperCase()}`;
      const rateMap = { 'ru': 0.9, 'en': 0.85, 'tr': 0.9, 'de': 0.85, 'fr': 0.9, 'es': 0.9 };
      utterance.rate = rateMap[langCode] || 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setTimeout(() => {
        try { if (synthesisRef.current && !synthesisRef.current.speaking) synthesisRef.current.speak(utterance); } catch {}
      }, 50);
    } catch (e) {
      console.error('Speak error:', e);
    }
  }, [isAudioEnabled, selectedVoice, audioSupported, testData, studiedLanguage]);

const getTranslation = useCallback((word, targetLanguage) => {
  if (!word) return null;
  const targetLang = targetLanguage.toLowerCase();
  
  const langMap = {
    'русский': ['russian', 'русский', 'Русский', 'ru'],
    'russian': ['russian', 'русский', 'Русский', 'ru'],
    'английский': ['english', 'английский', 'Английский', 'en', 'English'],
    'english': ['english', 'английский', 'Английский', 'en', 'English'],
    'турецкий': ['turkish', 'турецкий', 'Турецкий', 'tr', 'Turkish'],
    'turkish': ['turkish', 'турецкий', 'Турецкий', 'tr', 'Turkish'],
    'немецкий': ['german', 'немецкий', 'Немецкий', 'de', 'German'],
    'german': ['german', 'немецкий', 'Немецкий', 'de', 'German'],
    'французский': ['french', 'французский', 'Французский', 'fr', 'French'],
    'french': ['french', 'французский', 'Французский', 'fr', 'French'],
    'испанский': ['spanish', 'испанский', 'Испанский', 'es', 'Spanish'],
    'spanish': ['spanish', 'испанский', 'Испанский', 'es', 'Spanish'],
    'итальянский': ['italian', 'итальянский', 'Итальянский', 'it', 'Italian'],
    'italian': ['italian', 'итальянский', 'Итальянский', 'it', 'Italian'],
    'китайский': ['chinese', 'китайский', 'Китайский', 'zh', 'Chinese'],
    'chinese': ['chinese', 'китайский', 'Китайский', 'zh', 'Chinese'],
    'японский': ['japanese', 'японский', 'Японский', 'ja', 'Japanese'],
    'japanese': ['japanese', 'японский', 'Японский', 'ja', 'Japanese']
  };
  
  const possibleKeys = langMap[targetLang] || [targetLang];

  // Вспомогательная функция для объектов (прилагательные, род/число)
  const extractFromObject = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    for (const key of ['masculine', 'feminine', 'neuter', 'plural', 'word', 'base']) {
      if (obj[key] && typeof obj[key] === 'string' && obj[key].trim() !== '') return obj[key];
    }
    for (const key of Object.keys(obj)) {
      if (obj[key] && typeof obj[key] === 'string' && obj[key].trim() !== '') return obj[key];
    }
    return null;
  };

  // 1. word.translations (прямой поиск)
  if (word.translations) {
    for (const key of possibleKeys) {
      const value = word.translations[key];
      if (!value) continue;
      if (typeof value === 'object') {
        const extracted = extractFromObject(value);
        if (extracted) return extracted;
      } else if (typeof value === 'string' && value.trim() !== '') {
        return value;
      }
    }
    // 1b. Поиск по частичному совпадению
    for (const transKey of Object.keys(word.translations)) {
      const lower = transKey.toLowerCase();
      if (possibleKeys.some(pk => lower.includes(pk.toLowerCase()) || pk.toLowerCase().includes(lower))) {
        const value = word.translations[transKey];
        if (!value) continue;
        if (typeof value === 'object') {
          const extracted = extractFromObject(value);
          if (extracted) return extracted;
        } else if (typeof value === 'string' && value.trim() !== '') {
          return value;
        }
      }
    }
  }

  // 2. word.wordData?.translations
  if (word.wordData?.translations) {
    for (const key of possibleKeys) {
      const value = word.wordData.translations[key];
      if (!value) continue;
      if (typeof value === 'object') {
        const extracted = extractFromObject(value);
        if (extracted) return extracted;
      } else if (typeof value === 'string' && value.trim() !== '') {
        return value;
      }
    }
  }

  // 3. word.forms (для прилагательных)
  if (word.forms) {
    for (const key of possibleKeys) {
      // Ищем по ключам типа "english_base", "english_masculine"
      for (const formKey of Object.keys(word.forms)) {
        if (formKey.toLowerCase().startsWith(key.toLowerCase())) {
          const value = word.forms[formKey];
          if (value && typeof value === 'string' && value.trim() !== '') return value;
        }
      }
    }
  }

  // 4. Прямые поля word.Английский, word.English и т.д.
  for (const key of possibleKeys) {
    const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
    if (word[capitalized] && typeof word[capitalized] === 'string' && word[capitalized].trim() !== '') {
      return word[capitalized];
    }
    if (word[key] && typeof word[key] === 'string' && word[key].trim() !== '') {
      return word[key];
    }
  }

  return word.displayWord || word.word || null;
}, []);

  useEffect(() => {
    const module = searchParams.get('module');
    if (module) {
      setModuleId(module);
      loadTestData(module);
    } else {
      setError('Не указан ID модуля');
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (testData && testData.words) {
      const allOptions = testData.words.map((word, i) => prepareQuestionOptions(word, i));
      setShuffledOptions(allOptions.map(o => o.options));
      setCorrectAnswerIndex(allOptions.map(o => o.correctIndex));
    }
  }, [testData]);

  const loadTestData = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/module-test/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTestData(data);
        setUserAnswers(new Array(data.words.length).fill(null));
      } else {
        setError('Не удалось загрузить тест');
      }
    } catch (error) {
      setError('Ошибка загрузки теста');
    } finally {
      setLoading(false);
    }
  };

 const prepareQuestionOptions = (currentWord, questionIndex) => {
  if (!testData) return { options: [], correctIndex: -1 };
  
  const studiedLang = testData.studiedLanguage;
  let correctAnswer = getTranslation(currentWord, studiedLang);
  
  // 🔍 Если это прилагательное и перевод не нашёлся - пробуем другие ключи
  if (!correctAnswer && (currentWord.database === 'adjectives' || currentWord.sourceDatabase === 'adjectives')) {
    const triedKeys = ['english', 'English', 'английский', 'Английский'];
    for (const k of triedKeys) {
      if (currentWord.translations?.[k]) {
        correctAnswer = currentWord.translations[k];
        break;
      }
      if (currentWord.forms?.[`${k}_base`]) {
        correctAnswer = currentWord.forms[`${k}_base`];
        break;
      }
    }
  }
  
  correctAnswer = correctAnswer || currentWord.displayWord || 'Неизвестно';

  const otherWords = [];
  testData.words.forEach((word, idx) => {
    if (idx !== questionIndex) {
      let otherWord = getTranslation(word, studiedLang);
      
      // Fallback для прилагательных
      if (!otherWord && (word.database === 'adjectives' || word.sourceDatabase === 'adjectives')) {
        const triedKeys = ['english', 'English', 'английский', 'Английский'];
        for (const k of triedKeys) {
          if (word.translations?.[k]) { otherWord = word.translations[k]; break; }
          if (word.forms?.[`${k}_base`]) { otherWord = word.forms[`${k}_base`]; break; }
        }
      }
      
      otherWord = otherWord || word.displayWord || 'Неизвестно';
      if (otherWord && otherWord !== correctAnswer && otherWords.length < 3) {
        otherWords.push(otherWord);
      }
    }
  });
  
  while (otherWords.length < 3) {
    otherWords.push(`Вариант ${otherWords.length + 1}`);
  }

  const allOptions = [correctAnswer, ...otherWords];
  const shuffled = [...allOptions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return { options: shuffled, correctIndex: shuffled.indexOf(correctAnswer) };
};

  const handleAnswer = (selectedIndex) => {
    if (!testData || currentQuestion >= testData.words.length) return;
    if (userAnswers[currentQuestion] !== null) return;

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = selectedIndex;
    setUserAnswers(newAnswers);

    const isCorrect = selectedIndex === correctAnswerIndex[currentQuestion];
    const correctAnswer = shuffledOptions[currentQuestion]?.[correctAnswerIndex[currentQuestion]];

    if (isCorrect) {
      setScore(prev => prev + 1);
      speakCorrectAnswer(correctAnswer);
    } else {
      playErrorSound();
    }

    if (currentQuestion < testData.words.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 1500);
    } else {
      setTimeout(() => {
        setIsFinished(true);
        saveResults();
      }, 1500);
    }
  };

  const saveResults = async () => {
    try {
      const incorrectWords = testData.words
        .filter((_, index) => userAnswers[index] !== correctAnswerIndex[index])
        .map(word => word.imageBase || word.id);
      await fetch(`${API_BASE_URL}/module-test/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId, userId: 'user123', score,
          totalQuestions: testData.words.length, incorrectWords
        })
      });
    } catch (error) {
      console.error('Error saving results:', error);
    }
  };

  const getCorrectAnswerForQuestion = (i) =>
    shuffledOptions[i]?.[correctAnswerIndex[i]] ?? 'Неизвестно';
  const getUserAnswerForQuestion = (i) => {
    const idx = userAnswers[i];
    return idx === null ? 'Не отвечено' : shuffledOptions[i]?.[idx] ?? 'Неизвестно';
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (isAudioEnabled && synthesisRef.current) {
      try { synthesisRef.current.cancel(); } catch {}
      setIsSpeaking(false);
    }
  };

  // 🆕 Закрытие в меню урока
  const handleClose = () => {
    if (lessonId) {
      router.push(`/?lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`);
    } else {
      router.push('/');
    }
  };

  const handleFinish = useCallback(() => {
    if (nextModuleId) goToNextModule();
    else router.push('/');
  }, [nextModuleId, goToNextModule, router]);

  // 🆕 Клик по картинке = следующий вопрос
  const handleImageClick = () => {
    if (!hasAnswered) return; // только после ответа
    if (currentQuestion < testData.words.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  if (loading) {
    return (
      <>
        <style jsx global>{`
          :root {
            --background: 0 0% 91%; --foreground: 0 0% 7%;
            --primary: 220 63% 50%; --accent: 0 65% 54%;
            --muted: 0 0% 44%; --progress-track: 0 0% 89%;
            --progress-fill: 220 63% 50%; --panel-light: 0 0% 96%;
            --white-surface: 0 0% 100%; --border: 0 0% 7%;
          }
          body { background-color: hsl(var(--background)); font-family: 'Arial', system-ui, sans-serif; }
        `}</style>
        <div className="min-h-screen flex items-center justify-center text-lg">Загрузка теста...</div>
      </>
    );
  }

  if (error || !testData) {
    return (
      <>
        <style jsx global>{`
          :root { --background: 0 0% 91%; --foreground: 0 0% 7%; --accent: 0 65% 54%; }
          body { background-color: hsl(var(--background)); }
        `}</style>
        <div className="min-h-screen flex items-center justify-center text-lg text-[hsl(var(--accent))]">
          {error || 'Тест не найден'}
        </div>
      </>
    );
  }

  // ============ ЭКРАН РЕЗУЛЬТАТОВ ============
  if (isFinished) {
    const modulePercent = Math.round((score / testData.words.length) * 100);
    const lessonPercent = lessonProgress.total > 0
      ? Math.round((lessonProgress.current / lessonProgress.total) * 100)
      : 0;

    return (
      <>
        <style jsx global>{`
          :root {
            --background: 0 0% 91%; --foreground: 0 0% 7%;
            --primary: 220 63% 50%; --primary-foreground: 0 0% 7%;
            --accent: 0 65% 54%; --muted: 0 0% 44%;
            --progress-track: 0 0% 89%; --progress-fill: 220 63% 50%;
            --panel-light: 0 0% 96%; --white-surface: 0 0% 100%;
            --border: 0 0% 7%;
          }
          body { background-color: hsl(var(--background)); color: hsl(var(--foreground)); font-family: 'Arial', system-ui, sans-serif; }
        `}</style>

        <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
          <div className="max-w-screen-2xl mx-auto">
            {/* Header */}
            <section className="bg-[hsl(var(--background))] border-b border-[hsl(var(--foreground))]/20">
              <nav className="flex items-center justify-between px-2 py-1 min-h-[42px]">
                <div className="flex items-center flex-shrink-0">
                  <button onClick={() => setShowLessonMenu(!showLessonMenu)} className="p-1 text-lg">☰</button>
                </div>
                <div className="flex items-center gap-4 flex-1 justify-center">
                  <span className="text-xs text-[hsl(var(--primary))]">{hintLanguage}</span>
                  <span className="text-xs text-[hsl(var(--primary))] font-bold">{studiedLanguage}</span>
                  <span className="text-xs">Уровень 1</span>
                  <span className="text-xs truncate max-w-[200px]">Урок - {lessonId || ''}</span>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <button onClick={handleClose} className="flex items-center gap-1 text-xs">Вход/Рег 🏠</button>
                  <span className="text-[10px]">Россия</span>
                </div>
              </nav>
            </section>

            {/* Results content */}
            <div className="p-6 max-w-4xl mx-auto">
              <div className="flex items-start justify-between mb-4">
                <button onClick={handleClose} className="text-[hsl(var(--foreground))] font-bold text-sm px-2">✕</button>
              </div>

              <div className="bg-[hsl(var(--white-surface))] border border-[hsl(var(--border))]/20 p-6">
                <h1 className="text-3xl font-bold text-center mb-4">ТЕСТ ЗАВЕРШЁН!</h1>

                <div className="text-center mb-6">
                  <div className="text-6xl font-bold text-[hsl(var(--primary))] mb-2">
                    {score}/{testData.words.length}
                  </div>
                  <div className="text-2xl">
                    {score === testData.words.length ? 'Отлично! 🎉' :
                     score >= testData.words.length * 0.7 ? 'Хорошо! 👍' :
                     'Попробуйте ещё раз! 💪'}
                  </div>
                </div>

                {/* Progress bars */}
                <div className="mb-6 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="min-w-[120px]">Прогресс урока:</span>
                    <div className="flex-1 h-5 bg-[hsl(var(--progress-track))] border border-[hsl(var(--border))]/20 relative">
                      <div className="absolute left-0 top-0 h-full bg-[hsl(var(--progress-fill))]"
                           style={{ width: `${lessonPercent}%` }}></div>
                      <span className="absolute inset-0 flex items-center justify-center text-xs">
                        {lessonProgress.current} / {lessonProgress.total} модулей ({lessonPercent}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="min-w-[120px]">Прогресс модуля:</span>
                    <div className="flex-1 h-5 bg-[hsl(var(--progress-track))] border border-[hsl(var(--border))]/20 relative">
                      <div className="absolute left-0 top-0 h-full bg-[hsl(var(--progress-fill))]"
                           style={{ width: `${modulePercent}%` }}></div>
                      <span className="absolute inset-0 flex items-center justify-center text-xs">
                        {score} / {testData.words.length} ({modulePercent}%)
                      </span>
                    </div>
                  </div>
                </div>

                <h2 className="text-lg font-bold mb-3">Детальные результаты:</h2>
                <div className="space-y-2 mb-6">
                  {testData.words.map((word, index) => {
                    const isCorrect = userAnswers[index] === correctAnswerIndex[index];
                    const userAnswer = getUserAnswerForQuestion(index);
                    const correctAnswer = getCorrectAnswerForQuestion(index);
                    const hintTranslation = getTranslation(word, testData.hintLanguage);
                    return (
                      <div key={index} className={`p-3 border ${isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <div className="font-medium mb-1">
                              <span className="text-[hsl(var(--muted))]">Вопрос {index + 1}: </span>
                              <span className="text-[hsl(var(--primary))]">{hintTranslation || word.displayWord}</span>
                            </div>
                            <div className="text-sm grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[hsl(var(--muted))]">Ваш: </span>
                                <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700'}>{userAnswer}</span>
                              </div>
                              {!isCorrect && (
                                <div>
                                  <span className="text-[hsl(var(--muted))]">Правильный: </span>
                                  <span className="text-green-700 font-medium">{correctAnswer}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={`text-xl ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? '✓' : '✗'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-3 justify-center">
                  <button onClick={handleClose}
                    className="px-6 py-2 bg-[hsl(var(--primary))] text-white font-bold hover:opacity-90 transition">
                    ✕ Закрыть
                  </button>
                  <button onClick={goToNextModule}
                    className="px-6 py-2 bg-green-600 text-white font-bold hover:opacity-90 transition">
                    {isLastModule ? 'Завершить →' : 'Следующий модуль →'}
                  </button>
                  <button onClick={() => {
                    loadTestData(moduleId);
                    setCurrentQuestion(0); setScore(0); setUserAnswers([]);
                    setShuffledOptions([]); setCorrectAnswerIndex([]); setIsFinished(false);
                  }}
                    className="px-6 py-2 bg-[hsl(var(--accent))] text-white font-bold hover:opacity-90 transition">
                    Пройти ещё раз
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ============ ЭКРАН ТЕСТА ============
  const currentOptions = shuffledOptions[currentQuestion] || [];
  const hasAnswered = userAnswers[currentQuestion] !== null;
  const hintTranslation = getTranslation(currentWord, testData.hintLanguage);
  const correctStudiedTranslation = getTranslation(currentWord, testData.studiedLanguage);

  // Проценты
  const modulePercent = Math.round(((currentQuestion + 1) / testData.words.length) * 100);
  const lessonPercent = lessonProgress.total > 0
    ? Math.round((lessonProgress.current / lessonProgress.total) * 100)
    : 0;

  // Слово БОЛЬШИМИ БУКВАМИ
  const displayWord = (hintTranslation || currentWord?.displayWord || '—').toUpperCase();

  return (
    <>
      <style jsx global>{`
        :root {
          --background: 0 0% 91%;
          --foreground: 0 0% 7%;
          --primary: 220 63% 50%;
          --primary-foreground: 0 0% 7%;
          --accent: 0 65% 54%;
          --accent-foreground: 0 0% 7%;
          --muted: 0 0% 44%;
          --progress-track: 0 0% 89%;
          --progress-fill: 220 63% 50%;
          --panel-light: 0 0% 96%;
          --white-surface: 0 0% 100%;
          --border: 0 0% 7%;
        }
        body {
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
          font-family: 'Arial', system-ui, sans-serif;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>

      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <div className="max-w-screen-2xl mx-auto">

          {/* ===== HEADER ===== */}
          <section className="bg-[hsl(var(--background))] border-b border-[hsl(var(--foreground))]/20 sticky top-0 z-40">
            <nav className="flex items-center justify-between px-2 py-1 min-h-[42px]">
              {/* Left: Menu */}
              <div className="flex items-center flex-shrink-0">
                <button onClick={() => setShowLessonMenu(!showLessonMenu)} className="p-1 text-lg" aria-label="Menu">
                  ☰
                </button>
              </div>

              {/* Center: Nav links */}
              <div className="flex items-center gap-4 flex-1 justify-center overflow-x-auto">
                <span className="text-xs text-[hsl(var(--primary))] whitespace-nowrap">{hintLanguage}</span>
                <span className="text-xs text-[hsl(var(--primary))] font-bold whitespace-nowrap">{studiedLanguage}</span>
                <span className="text-xs whitespace-nowrap">Уровень 1</span>
                <span className="text-xs whitespace-nowrap truncate max-w-[180px]">
                  Урок {lessonProgress.current} - {testData?.title || 'Тест'}
                </span>
              </div>

              {/* Right: Login + country */}
              <div className="flex flex-col items-end flex-shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs whitespace-nowrap">Вход/Рег</span>
                  <span className="text-xs">🏠</span>
                </div>
                <span className="text-[10px] whitespace-nowrap">Россия</span>
              </div>
            </nav>
          </section>

          {/* ===== MAIN CONTENT ===== */}
          <section className="w-full relative">
            {/* Close button (X) - top right */}
            <div className="absolute top-0 right-0 p-1 z-20">
              <button onClick={handleClose} className="text-[hsl(var(--foreground))] font-bold text-lg px-2" title="Закрыть">
                ✕
              </button>
            </div>

            {/* Top meta row */}
            <div className="flex flex-wrap items-start justify-between px-4 sm:px-6 pt-5 pb-5 bg-[hsl(var(--panel-light))] border-b border-[hsl(var(--foreground))]/20 gap-4">
              {/* Lesson info - LEFT */}
              <div className="flex flex-col leading-snug min-w-[140px]">
                <span className="text-sm text-[hsl(var(--muted))]">Название урока:</span>
                <span className="font-bold text-base">
                  {testData?.title?.toUpperCase() || 'ТЕСТ'}
                </span>
                <span className="text-sm text-[hsl(var(--muted))]">Модуль - Тест-Лексика</span>
              </div>

              {/* Progress bars - CENTER */}
              <div className="flex flex-col gap-2 flex-1 mx-2 min-w-[200px] max-w-xl">
                {/* Progress 1: lesson progress */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[22px] bg-[hsl(var(--white-surface))] border border-[hsl(var(--foreground))]/20 relative">
                    <div className="absolute left-0 top-0 h-full bg-[hsl(var(--progress-fill))]"
                         style={{ width: `${lessonPercent}%` }}></div>
                    <span className="absolute inset-0 flex items-center justify-start pl-2 text-xs">
                      Модуль {lessonProgress.current} из {lessonProgress.total}
                    </span>
                    <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs">
                      • {lessonPercent}%
                    </span>
                  </div>
                </div>
                {/* Progress 2: current module */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[22px] bg-[hsl(var(--white-surface))] border border-[hsl(var(--foreground))]/20 relative">
                    <div className="absolute left-0 top-0 h-full bg-[hsl(var(--progress-fill))]"
                         style={{ width: `${modulePercent}%` }}></div>
                    <span className="absolute inset-0 flex items-center justify-start pl-2 text-xs">
                      Вопрос {currentQuestion + 1} из {testData.words.length}
                    </span>
                    <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs">
                      • Счёт: {score}
                    </span>
                  </div>
                </div>
              </div>

              {/* Module switcher - RIGHT */}
              <div className="flex flex-col items-center min-w-[120px]">
                <div className="flex items-center gap-2">
                  <button onClick={goToPrevModule} className="text-[hsl(var(--primary))] font-bold text-xl leading-none">◄</button>
                  <span className="font-bold text-sm">Модуль</span>
                  <button onClick={goToNextModule} className="text-[hsl(var(--primary))] font-bold text-xl leading-none">►</button>
                </div>
                <span className="text-sm font-bold mt-1">Уровень - 1</span>
                <span className="text-xs text-[hsl(var(--muted))]">
                  {studiedLanguage} <span className="text-[hsl(var(--primary))]">({hintLanguage})</span>
                </span>
              </div>
            </div>

            {/* Voice settings (dropdown) */}
            <AnimatePresence>
              {showVoiceSettings && audioSupported && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-24 right-4 bg-[hsl(var(--white-surface))] border border-[hsl(var(--border))]/20 p-4 shadow-xl z-30 w-80"
                >
                  <h3 className="font-semibold mb-3">Настройки голоса</h3>
                  <div className="mb-3 p-2 bg-[hsl(var(--panel-light))] text-xs">
                    <div><strong>Голос:</strong> {selectedVoice?.name || 'Авто'}</div>
                    <div><strong>Язык:</strong> {selectedVoice?.lang || '—'}</div>
                  </div>
                  {voices.length > 0 && (
                    <select
                      value={selectedVoice?.name || ''}
                      onChange={(e) => {
                        const v = voices.find(v => v.name === e.target.value);
                        setSelectedVoice(v);
                      }}
                      className="w-full p-2 border text-sm mb-3"
                    >
                      <option value="">Автоматически</option>
                      {voices
                        .filter(v => v.lang?.startsWith(LANGUAGE_CODES[testData.studiedLanguage.toLowerCase()] || 'ru'))
                        .map(v => (
                          <option key={v.name} value={v.name}>
                            {v.name} ({v.lang}) {v.name.includes('Google') ? '⭐' : ''}
                          </option>
                        ))}
                    </select>
                  )}
                  <button onClick={() => setShowVoiceSettings(false)}
                    className="w-full bg-[hsl(var(--panel-light))] hover:bg-[hsl(var(--progress-track))] py-2 text-sm">
                    Закрыть
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main content area */}
            <div className={`relative flex flex-col items-center bg-[hsl(var(--background))] min-h-[400px] pb-20 ${showErrorSound ? 'animate-shake' : ''}`}>

              {/* Flag left - studied language */}
              <div className="absolute left-4 top-4">
                {renderFlag(studiedLanguage, 'normal')}
              </div>

              {/* Audio controls top-right area */}
              <div className="absolute right-14 top-4 flex items-center gap-2">
                {audioSupported && (
                  <button onClick={toggleAudio}
                    className={`w-9 h-9 flex items-center justify-center border border-[hsl(var(--border))]/20 ${
                      isAudioEnabled ? 'bg-green-100' : 'bg-red-100'
                    }`}
                    title={isAudioEnabled ? 'Выключить звук' : 'Включить звук'}>
                    {isAudioEnabled ? '🔊' : '🔇'}
                  </button>
                )}
                {audioSupported && (
                  <button onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                    className="w-9 h-9 bg-[hsl(var(--panel-light))] border border-[hsl(var(--border))]/20 flex items-center justify-center"
                    title="Настройки голоса">
                    🎤
                  </button>
                )}
              </div>

              {/* Speaker icon */}
              <div className="mt-10 mb-2 text-4xl">
                {isSpeaking ? '🔊' : '🔈'}
              </div>

              {/* WORD - UPPERCASE (как в макете) */}
              <div className="font-bold text-3xl text-[hsl(var(--foreground))] mb-4 tracking-wide">
                {displayWord}
              </div>

              {/* Image + translation (clickable to next slide) */}
              <div
                onClick={handleImageClick}
                className="bg-[hsl(var(--white-surface))] border border-[hsl(var(--border))]/20 p-2 flex flex-col items-center cursor-pointer hover:shadow-lg transition-shadow"
                style={{ width: '220px' }}
                title={hasAnswered ? 'Кликните для следующего вопроса' : ''}
              >
                {currentWord?.imagePng ? (
                  <img src={currentWord.imagePng} alt="word" className="w-[200px] h-[150px] object-cover" />
                ) : (
                  <div className="w-[200px] h-[150px] bg-[hsl(var(--panel-light))] flex items-center justify-center text-5xl">
                    📝
                  </div>
                )}
                <span className="text-[hsl(var(--muted))] text-sm mt-1">
                  {correctStudiedTranslation || '—'}
                </span>
              </div>

              {/* ===== ANSWER OPTIONS (сохраняем функционал) ===== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 px-4 w-full max-w-2xl">
                {currentOptions.map((option, index) => {
                  const isSelected = userAnswers[currentQuestion] === index;
                  const isCorrect = index === correctAnswerIndex[currentQuestion];
                  const showResult = hasAnswered;

                  let buttonClass = "p-4 text-base font-medium border-2 transition-all text-left ";

                  if (showResult) {
                    if (isCorrect) buttonClass += "bg-green-100 border-green-500 text-green-800 ";
                    else if (isSelected) buttonClass += "bg-red-100 border-red-500 text-red-800 ";
                    else buttonClass += "bg-[hsl(var(--panel-light))] border-[hsl(var(--border))]/20 text-[hsl(var(--muted))] ";
                  } else {
                    buttonClass += "bg-[hsl(var(--white-surface))] border-[hsl(var(--border))]/20 text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--panel-light))] cursor-pointer ";
                  }
                  if (hasAnswered) buttonClass += "cursor-default ";

                  return (
                    <button
                      key={index}
                      onClick={() => !hasAnswered && handleAnswer(index)}
                      disabled={hasAnswered}
                      className={buttonClass}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {showResult && isCorrect && <span className="text-green-600">✓</span>}
                        {showResult && isSelected && !isCorrect && <span className="text-red-600">✗</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback после ответа */}
              {hasAnswered && (
                <div className={`mt-4 p-3 border text-center max-w-md w-full mx-4 ${
                  userAnswers[currentQuestion] === correctAnswerIndex[currentQuestion]
                    ? 'bg-green-50 border-green-300 text-green-800'
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}>
                  <div className="font-semibold">
                    {userAnswers[currentQuestion] === correctAnswerIndex[currentQuestion]
                      ? 'Правильно! ✅' : 'Неправильно! ❌'}
                  </div>
                  {userAnswers[currentQuestion] !== correctAnswerIndex[currentQuestion] && (
                    <div className="mt-1 text-sm">
                      Правильный ответ: <span className="font-bold">{correctStudiedTranslation || currentOptions[correctAnswerIndex[currentQuestion]]}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation arrows - внизу для перемещения между вопросами */}
              <div className="flex items-center gap-8 mt-6">
                <button
                  onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  className={`text-3xl font-bold ${currentQuestion === 0 ? 'text-[hsl(var(--muted))] cursor-not-allowed' : 'text-[hsl(var(--primary))] hover:scale-110 transition-transform'}`}
                >
                  ◄
                </button>
                <span className="text-sm font-medium">
                  {currentQuestion + 1} / {testData.words.length}
                </span>
                <button
                  onClick={() => {
                    if (currentQuestion < testData.words.length - 1) {
                      setCurrentQuestion(prev => prev + 1);
                    } else {
                      setIsFinished(true);
                      saveResults();
                    }
                  }}
                  className="text-3xl font-bold text-[hsl(var(--primary))] hover:scale-110 transition-transform"
                >
                  ►
                </button>
              </div>

              {/* Flag right bottom - hint language */}
              <div className="absolute right-4 bottom-4">
                {renderFlag(hintLanguage, 'large')}
              </div>
            </div>
          </section>

          {/* Lesson menu modal */}
          {showLessonMenu && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
                 onClick={() => setShowLessonMenu(false)}>
              <div className="bg-[hsl(var(--white-surface))] border border-[hsl(var(--border))] p-4 max-w-sm w-full"
                   onClick={e => e.stopPropagation()}>
                <h3 className="font-bold mb-3">Меню урока</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Урок:</strong> {lessonId || '—'}</div>
                  <div><strong>Языки:</strong> {studiedLanguage} → {hintLanguage}</div>
                  <div><strong>Модуль:</strong> {lessonProgress.current} из {lessonProgress.total}</div>
                  <div><strong>Тест:</strong> {testData?.title}</div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={handleClose}
                    className="flex-1 bg-[hsl(var(--accent))] text-white py-2 font-bold">
                    ✕ Закрыть тест
                  </button>
                  <button onClick={() => setShowLessonMenu(false)}
                    className="flex-1 bg-[hsl(var(--panel-light))] py-2 font-bold">
                    Продолжить
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}