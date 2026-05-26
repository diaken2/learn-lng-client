// app/sentence-learning/page.js - РЕДИЗАЙН В ЕДИНОМ СТИЛЕ
'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'https://learn-lng-new-client-lrqy.onrender.com/api';

// 🎨 Функция отрисовки флага страны
const renderFlag = (language, size = 'normal') => {
  const lang = (language || '').toLowerCase();
  const sizes = {
    small: { w: 'w-[40px]', h: 'h-[28px]' },
    normal: { w: 'w-[54px]', h: 'h-[36px]' },
    large: { w: 'w-[60px]', h: 'h-[40px]' },
  };
  const s = sizes[size] || sizes.normal;

  if (['russian', 'русский', 'ru'].includes(lang)) {
    return (
      <div className={`${s.w} ${s.h} flex flex-col overflow-hidden border border-[hsl(var(--border))]/20`}>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-[hsl(var(--primary))]"></div>
        <div className="flex-1 bg-[hsl(var(--accent))]"></div>
      </div>
    );
  }
  if (['english', 'английский', 'en'].includes(lang)) {
    return (
      <div className={`${s.w} ${s.h} bg-[hsl(var(--primary))] relative overflow-hidden border border-[hsl(var(--border))]/20 flex items-center justify-center`}>
        <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-[6px] bg-white"></div></div>
        <div className="absolute inset-0 flex items-center justify-center"><div className="h-full w-[6px] bg-white"></div></div>
        <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-[3px] bg-[hsl(var(--accent))]"></div></div>
        <div className="absolute inset-0 flex items-center justify-center"><div className="h-full w-[3px] bg-[hsl(var(--accent))]"></div></div>
      </div>
    );
  }
  if (['turkish', 'турецкий', 'tr'].includes(lang)) {
    return (
      <div className={`${s.w} ${s.h} bg-[hsl(var(--accent))] relative overflow-hidden border border-[hsl(var(--border))]/20 flex items-center justify-center`}>
        <div className="w-4 h-4 bg-white rounded-full"></div>
      </div>
    );
  }
  if (['german', 'немецкий', 'de'].includes(lang)) {
    return (
      <div className={`${s.w} ${s.h} flex flex-col overflow-hidden border border-[hsl(var(--border))]/20`}>
        <div className="flex-1 bg-black"></div>
        <div className="flex-1 bg-[hsl(var(--accent))]"></div>
        <div className="flex-1 bg-yellow-400"></div>
      </div>
    );
  }
  if (['french', 'французский', 'fr'].includes(lang)) {
    return (
      <div className={`${s.w} ${s.h} flex overflow-hidden border border-[hsl(var(--border))]/20`}>
        <div className="flex-1 bg-[hsl(var(--primary))]"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-[hsl(var(--accent))]"></div>
      </div>
    );
  }
  if (['spanish', 'испанский', 'es'].includes(lang)) {
    return (
      <div className={`${s.w} ${s.h} flex flex-col overflow-hidden border border-[hsl(var(--border))]/20`}>
        <div className="flex-1 bg-[hsl(var(--accent))]"></div>
        <div className="flex-1 bg-yellow-400"></div>
        <div className="flex-1 bg-[hsl(var(--accent))]"></div>
      </div>
    );
  }
  return (
    <div className={`${s.w} ${s.h} border border-[hsl(var(--border))]/20 bg-white flex items-center justify-center text-xl`}>
      🏳️
    </div>
  );
};

export default function SentenceLearningComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const moduleId = searchParams?.get('module');
  const studiedLanguage = searchParams?.get('studied') || 'русский';
  const hintLanguage = searchParams?.get('hint') || 'английский';
  const lessonId = searchParams?.get('lesson');
  const nextModuleId = searchParams?.get('next');

  const [module, setModule] = useState(null);
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [selectedHintVoice, setSelectedHintVoice] = useState(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [speakingType, setSpeakingType] = useState(null);

  // 🆕 Прогресс урока
  const [lessonProgress, setLessonProgress] = useState({ current: 0, total: 0 });
  const [isLastModule, setIsLastModule] = useState(false);
  const [showLessonMenu, setShowLessonMenu] = useState(false);

  const synthesisRef = useRef(null);
  const initialSpeakDone = useRef(false);

  const PREFERRED_VOICES = {
    'русский': ['Google русский', 'Milena', 'Russian', 'ru'],
    'english': ['Google UK English', 'Google US English', 'Microsoft David', 'Microsoft Zira'],
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

  // 🆕 Загрузка прогресса урока
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
        const idx = structure.findIndex(item => item.moduleId === moduleId);
        setLessonProgress({
          current: idx >= 0 ? idx + 1 : 1,
          total: structure.length || 1,
        });
        setIsLastModule(idx === structure.length - 1);
      } catch (err) {
        console.error('Error loading lesson progress:', err);
      }
    };
    loadLessonProgress();
  }, [lessonId, moduleId, studiedLanguage, hintLanguage]);

  // 🆕 Переход к следующему модулю
  const goToNextModule = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/learning/lesson-structure/${lessonId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const structure = data.structure || [];
      const idx = structure.findIndex(item => item.moduleId === moduleId);

      let nextId = null;
      if (idx >= 0 && idx < structure.length - 1) {
        nextId = structure[idx + 1].moduleId;
      }

      if (nextId) {
        router.push(`/module-flow?module=${nextId}&lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`);
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

  // 🆕 Переход к предыдущему модулю
  const goToPrevModule = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/learning/lesson-structure/${lessonId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const structure = data.structure || [];
      const idx = structure.findIndex(item => item.moduleId === moduleId);
      if (idx > 0) {
        const prevId = structure[idx - 1].moduleId;
        router.push(`/module-flow?module=${prevId}&lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`);
      }
    } catch (error) {
      console.error('Error going to prev module:', error);
    }
  }, [moduleId, lessonId, studiedLanguage, hintLanguage, router]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthesisRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);

        if (availableVoices.length > 0) {
          const bestStudiedVoice = findBestVoice(availableVoices, studiedLanguage);
          if (bestStudiedVoice) setSelectedVoice(bestStudiedVoice);

          const bestHintVoice = findBestVoice(availableVoices, hintLanguage);
          if (bestHintVoice) setSelectedHintVoice(bestHintVoice);
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      setIsInitialized(true);
    }
  }, [studiedLanguage, hintLanguage]);

  const findBestVoice = (availableVoices, language) => {
    const langLowerCase = language.toLowerCase();
    const langCode = LANGUAGE_CODES[langLowerCase] || langLowerCase.substring(0, 2);

    const googleVoices = availableVoices.filter(v =>
      v?.lang?.startsWith(langCode) && v.name?.toLowerCase().includes('google')
    );
    if (googleVoices.length > 0) return googleVoices[0];

    const preferred = PREFERRED_VOICES[langLowerCase] || [];
    for (const prefName of preferred) {
      const v = availableVoices.find(v =>
        v?.lang?.startsWith(langCode) && v.name?.toLowerCase().includes(prefName.toLowerCase())
      );
      if (v) return v;
    }

    const any = availableVoices.find(v => v?.lang?.startsWith(langCode));
    if (any) return any;

    return availableVoices.find(v => v?.lang?.startsWith(langCode.substring(0, 2))) || null;
  };

  const speak = useCallback((text, language, type = 'studied') => {
    if (!isAudioEnabled || !synthesisRef.current || !text || text === '—') return;
    if (synthesisRef.current.speaking) {
      try { synthesisRef.current.cancel(); } catch {}
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = LANGUAGE_CODES[language.toLowerCase()] || language.substring(0, 2);
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

      if (type === 'studied' && selectedVoice) utterance.voice = selectedVoice;
      else if (type === 'hint' && selectedHintVoice) utterance.voice = selectedHintVoice;
      else {
        const best = findBestVoice(window.speechSynthesis.getVoices(), language);
        if (best) utterance.voice = best;
      }

      utterance.onstart = () => { setIsSpeaking(true); setSpeakingType(type); };
      utterance.onend = () => { setIsSpeaking(false); setSpeakingType(null); };
      utterance.onerror = () => { setIsSpeaking(false); setSpeakingType(null); };

      setTimeout(() => {
        try { if (synthesisRef.current) synthesisRef.current.speak(utterance); } catch {}
      }, 50);
    } catch (e) {
      console.error('Speak error:', e);
    }
  }, [isAudioEnabled, selectedVoice, selectedHintVoice]);

  useEffect(() => {
    return () => {
      if (synthesisRef.current) {
        try { synthesisRef.current.cancel(); } catch {}
      }
    };
  }, []);

  useEffect(() => {
    initialSpeakDone.current = false;
  }, [moduleId]);

  const safeString = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'object') {
      if (value.word) return value.word;
      if (value.displayWord) return value.displayWord;
      if (value.text) return value.text;
      return '';
    }
    return String(value);
  };

  const getStudiedSentence = () => {
    if (!currentSentence || !currentSentence.sentenceStructure) return '—';
    const text = currentSentence.sentenceStructure
      .map(item => safeString(item.word || ''))
      .filter(w => w.trim() !== '')
      .join(' ');
    return text || '—';
  };

  const getHintSentence = () => {
    if (!currentSentence) return '—';

    if (currentSentence.customTranslation && currentSentence.customTranslation.trim() !== '') {
      return currentSentence.customTranslation;
    }
    if (currentSentence.translation && currentSentence.translation.trim() !== '') {
      return currentSentence.translation;
    }
    if (currentSentence.autoTranslation && currentSentence.autoTranslation.trim() !== '') {
      return currentSentence.autoTranslation;
    }

    if (currentSentence.sentenceStructure && currentSentence.sentenceStructure.length > 0) {
      const hintWords = currentSentence.sentenceStructure
        .map(item => getWordTranslation(item, hintLanguage))
        .filter(w => w && typeof w === 'string' && w.trim() !== '');
      const hintText = hintWords.join(' ');
      if (hintText && hintText.length > 0) {
        return hintText.charAt(0).toUpperCase() + hintText.slice(1);
      }
    }
    return '—';
  };

  const getWordTranslation = (wordObj, targetLanguage) => {
    if (!wordObj) return '';
    const targetLang = targetLanguage.toLowerCase();
    const possibleKeys = [];
    const variations = {
      'турецкий': ['турецкий', 'Турецкий', 'turkish', 'Turkish', 'tr'],
      'turkish': ['турецкий', 'Турецкий', 'turkish', 'Turkish', 'tr'],
      'русский': ['русский', 'Русский', 'russian', 'Russian', 'ru'],
      'russian': ['русский', 'Русский', 'russian', 'Russian', 'ru'],
      'английский': ['английский', 'Английский', 'english', 'English', 'en'],
      'english': ['английский', 'Английский', 'english', 'English', 'en'],
      'немецкий': ['немецкий', 'Немецкий', 'german', 'German', 'de'],
      'german': ['немецкий', 'Немецкий', 'german', 'German', 'de'],
      'французский': ['французский', 'Французский', 'french', 'French', 'fr'],
      'french': ['французский', 'Французский', 'french', 'French', 'fr'],
      'испанский': ['испанский', 'Испанский', 'spanish', 'Spanish', 'es'],
      'spanish': ['испанский', 'Испанский', 'spanish', 'Spanish', 'es']
    };
    const vars = variations[targetLang] || [targetLang];
    possibleKeys.push(...vars);

    if (wordObj.wordData?.translations) {
      const translations = wordObj.wordData.translations;
      for (const key of possibleKeys) {
        if (translations[key]) {
          const value = translations[key];
          if (typeof value === 'object') {
            if (value.masculine) return value.masculine;
            if (value.feminine) return value.feminine;
            if (value.neuter) return value.neuter;
            if (value.word) return value.word;
          }
          return value;
        }
      }
    }
    return wordObj.word || '';
  };

  useEffect(() => {
    const loadModuleAndSentences = async () => {
      if (!moduleId) {
        setError('ID модуля не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const moduleResponse = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}`);
        if (!moduleResponse.ok) throw new Error('Модуль не найден');
        const moduleData = await moduleResponse.json();
        setModule(moduleData);

        const sentencesResponse = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/sentences`);
        if (!sentencesResponse.ok) throw new Error('Не удалось загрузить предложения');
        const sentencesData = await sentencesResponse.json();

        if (!sentencesData || sentencesData.length === 0) {
          setError('В этом модуле пока нет предложений');
          return;
        }

        setSentences(sentencesData);
        setCurrentIndex(0);
      } catch (err) {
        console.error('Error loading module:', err);
        setError('Ошибка загрузки модуля: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadModuleAndSentences();
  }, [moduleId]);

  const currentSentence = sentences[currentIndex];

  useEffect(() => {
    if (currentSentence && isAudioEnabled && isInitialized) {
      const text = getStudiedSentence();
      const timer = setTimeout(() => speak(text, studiedLanguage, 'studied'), 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isAudioEnabled, studiedLanguage, isInitialized]);

  useEffect(() => {
    if (!loading && currentSentence && isAudioEnabled && isInitialized && !initialSpeakDone.current) {
      const text = getStudiedSentence();
      const timer = setTimeout(() => {
        speak(text, studiedLanguage, 'studied');
        initialSpeakDone.current = true;
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, currentSentence, isAudioEnabled, isInitialized]);

  const sentenceText = getStudiedSentence();
  const hintText = getHintSentence();
  const imageUrl = currentSentence?.image;

  // 🆕 Закрытие
  const handleClose = () => {
    if (lessonId) {
      router.push(`/?lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`);
    } else {
      router.push('/');
    }
  };

  const goNext = () => {
    if (isAnimating || !sentences.length) return;
    setIsAnimating(true);
    setTimeout(() => {
      if (currentIndex < sentences.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsAnimating(false);
      } else {
        goToNextModule();
      }
    }, 300);
  };

  const goPrev = () => {
    if (isAnimating || currentIndex === 0) return;
    if (synthesisRef.current) {
      try { synthesisRef.current.cancel(); } catch {}
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
      try { synthesisRef.current.cancel(); } catch {}
      setIsSpeaking(false);
      setSpeakingType(null);
    }
  };

  const replayStudiedAudio = () => speak(sentenceText, studiedLanguage, 'studied');
  const replayHintAudio = () => speak(hintText, hintLanguage, 'hint');

  // 🆕 Клик по картинке = следующее предложение
  const handleImageClick = () => {
    if (currentIndex < sentences.length - 1) {
      goNext();
    } else {
      goToNextModule();
    }
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

  // ============ LOADING ============
  if (loading) {
    return (
      <>
        <style jsx global>{`
          :root { --background: 0 0% 91%; --foreground: 0 0% 7%; --primary: 220 63% 50%; --muted: 0 0% 44%; }
          body { background-color: hsl(var(--background)); font-family: 'Arial', system-ui, sans-serif; }
        `}</style>
        <div className="min-h-screen flex items-center justify-center text-lg">Загрузка фраз...</div>
      </>
    );
  }

  // ============ ERROR ============
  if (error || !module) {
    return (
      <>
        <style jsx global>{`
          :root { --background: 0 0% 91%; --foreground: 0 0% 7%; --accent: 0 65% 54%; }
          body { background-color: hsl(var(--background)); }
        `}</style>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-[hsl(var(--accent))] mb-2">{error || 'Модуль не найден'}</div>
            <div className="text-sm text-[hsl(var(--muted))] mb-4">ID модуля: {moduleId}</div>
            <button onClick={handleClose}
              className="px-6 py-2 bg-[hsl(var(--primary))] text-white font-bold hover:opacity-90">
              ✕ Закрыть
            </button>
          </div>
        </div>
      </>
    );
  }

  // ============ EMPTY ============
  if (sentences.length === 0) {
    return (
      <>
        <style jsx global>{`
          :root { --background: 0 0% 91%; --foreground: 0 0% 7%; --muted: 0 0% 44%; }
          body { background-color: hsl(var(--background)); }
        `}</style>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-[hsl(var(--muted))] mb-4">В этом модуле пока нет фраз</div>
            <button onClick={handleClose}
              className="px-6 py-2 bg-[hsl(var(--primary))] text-white font-bold hover:opacity-90">
              ✕ Закрыть
            </button>
          </div>
        </div>
      </>
    );
  }

  // ============ MAIN ============
  const sentencePercent = Math.round(((currentIndex + 1) / sentences.length) * 100);
  const lessonPercent = lessonProgress.total > 0
    ? Math.round((lessonProgress.current / lessonProgress.total) * 100)
    : 0;

  // Фраза БОЛЬШИМИ БУКВАМИ
  const displaySentence = sentenceText.toUpperCase();

  return (
    <>
      <style jsx global>{`
        :root {
          --background: 0 0% 91%;
          --foreground: 0 0% 7%;
          --primary: 220 63% 50%;
          --primary-foreground: 0 0% 7%;
          --accent: 0 65% 54%;
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
      `}</style>

      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] select-none">
        <div className="max-w-screen-2xl mx-auto">

          {/* ===== HEADER ===== */}
          <section className="bg-[hsl(var(--background))] border-b border-[hsl(var(--foreground))]/20 sticky top-0 z-40">
            <nav className="flex items-center justify-between px-2 py-1 min-h-[42px]">
              <div className="flex items-center flex-shrink-0">
                <button onClick={() => setShowLessonMenu(!showLessonMenu)} className="p-1 text-lg" aria-label="Menu">
                  ☰
                </button>
              </div>
              <div className="flex items-center gap-4 flex-1 justify-center overflow-x-auto">
                <span className="text-xs text-[hsl(var(--primary))] whitespace-nowrap">{hintLanguage}</span>
                <span className="text-xs text-[hsl(var(--primary))] font-bold whitespace-nowrap">{studiedLanguage}</span>
                <span className="text-xs whitespace-nowrap">Уровень 1</span>
                <span className="text-xs whitespace-nowrap truncate max-w-[180px]">
                  Урок {lessonProgress.current} - Фразы
                </span>
              </div>
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
            {/* Close button (X) */}
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
                  {module?.title?.toUpperCase() || 'ФРАЗЫ'}
                </span>
                <span className="text-sm text-[hsl(var(--muted))]">Модуль - Фразы</span>
              </div>

              {/* Progress bars - CENTER */}
              <div className="flex flex-col gap-2 flex-1 mx-2 min-w-[200px] max-w-xl">
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
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[22px] bg-[hsl(var(--white-surface))] border border-[hsl(var(--foreground))]/20 relative">
                    <div className="absolute left-0 top-0 h-full bg-[hsl(var(--progress-fill))]"
                         style={{ width: `${sentencePercent}%` }}></div>
                    <span className="absolute inset-0 flex items-center justify-start pl-2 text-xs">
                      Фраза {currentIndex + 1} из {sentences.length}
                    </span>
                    <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs">
                      • {sentencePercent}%
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

            {/* Voice settings dropdown */}
            <AnimatePresence>
              {showVoiceSettings && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-32 right-4 bg-[hsl(var(--white-surface))] border border-[hsl(var(--border))]/20 p-4 shadow-xl z-30 w-80"
                >
                  <h3 className="font-semibold mb-3">Настройки голоса</h3>

                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-[hsl(var(--border))]/10">
                    <span className="text-sm">Озвучка</span>
                    <button onClick={toggleAudio}
                      className={`px-3 py-1 text-sm font-medium ${
                        isAudioEnabled
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                      {isAudioEnabled ? '🔊 Вкл' : '🔇 Выкл'}
                    </button>
                  </div>

                  <div className="mb-3 p-2 bg-[hsl(var(--panel-light))] text-xs">
                    <div><strong>Изучаемый:</strong> {selectedVoice?.name || 'Авто'}</div>
                    <div><strong>Подсказка:</strong> {selectedHintVoice?.name || 'Авто'}</div>
                  </div>

                  {voices.length > 0 && (
                    <>
                      <div className="mb-3">
                        <label className="block text-xs font-medium mb-1">
                          Голос ({studiedLanguage}):
                        </label>
                        <select
                          value={selectedVoice?.name || ''}
                          onChange={(e) => {
                            const v = voices.find(v => v.name === e.target.value);
                            setSelectedVoice(v);
                          }}
                          className="w-full p-2 border text-sm"
                          disabled={!isAudioEnabled}
                        >
                          <option value="">Автоматически</option>
                          {voices
                            .filter(v => v.lang?.startsWith(LANGUAGE_CODES[studiedLanguage.toLowerCase()] || 'ru'))
                            .map(v => (
                              <option key={v.name} value={v.name}>
                                {v.name} ({v.lang}) {v.name.includes('Google') ? '⭐' : ''}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="block text-xs font-medium mb-1">
                          Голос ({hintLanguage}):
                        </label>
                        <select
                          value={selectedHintVoice?.name || ''}
                          onChange={(e) => {
                            const v = voices.find(v => v.name === e.target.value);
                            setSelectedHintVoice(v);
                          }}
                          className="w-full p-2 border text-sm"
                          disabled={!isAudioEnabled}
                        >
                          <option value="">Автоматически</option>
                          {voices
                            .filter(v => v.lang?.startsWith(LANGUAGE_CODES[hintLanguage.toLowerCase()] || 'en'))
                            .map(v => (
                              <option key={v.name} value={v.name}>
                                {v.name} ({v.lang}) {v.name.includes('Google') ? '⭐' : ''}
                              </option>
                            ))}
                        </select>
                      </div>
                    </>
                  )}

                  <button onClick={() => setShowVoiceSettings(false)}
                    className="w-full bg-[hsl(var(--panel-light))] hover:bg-[hsl(var(--progress-track))] py-2 text-sm">
                    Закрыть
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ===== MAIN CONTENT AREA ===== */}
            <div className="relative flex flex-col items-center bg-[hsl(var(--background))] min-h-[500px] pb-20">

              {/* Flag left - studied language */}
              <div className="absolute left-4 top-4">
                {renderFlag(studiedLanguage, 'normal')}
              </div>

              {/* Audio controls top-right */}
              <div className="absolute right-14 top-4 flex items-center gap-2">
                <button onClick={toggleAudio}
                  className={`w-9 h-9 flex items-center justify-center border border-[hsl(var(--border))]/20 ${
                    isAudioEnabled ? 'bg-green-100' : 'bg-red-100'
                  }`}
                  title={isAudioEnabled ? 'Выключить звук' : 'Включить звук'}>
                  {isAudioEnabled ? '🔊' : '🔇'}
                </button>
                <button onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                  className="w-9 h-9 bg-[hsl(var(--panel-light))] border border-[hsl(var(--border))]/20 flex items-center justify-center"
                  title="Настройки голоса">
                  🎤
                </button>
              </div>

              {/* ===== SENTENCE (studied language) - UPPERCASE ===== */}
              <div className="mt-16 mb-6 px-4 w-full max-w-3xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`sentence-${currentIndex}`}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={topVariants}
                    className="text-center"
                  >
                    <div className="relative inline-block">
                      <motion.div
                        initial={{ scale: 0.98 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.35 }}
                        className="text-2xl md:text-3xl font-bold tracking-wide px-6 py-4 bg-[hsl(var(--white-surface))] border border-[hsl(var(--border))]/20 max-w-2xl leading-relaxed"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        {displaySentence}
                      </motion.div>

                      {/* Replay studied button */}
                      <button
                        onClick={replayStudiedAudio}
                        disabled={!isAudioEnabled}
                        className="absolute -right-14 top-1/2 transform -translate-y-1/2 w-11 h-11 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:opacity-90 transition"
                        title={`Повторить на ${studiedLanguage}`}
                      >
                        {isSpeaking && speakingType === 'studied' ? '🔊' : '🔈'}
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ===== IMAGE ===== */}
              <div className="mb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`image-${currentIndex}`}
                    initial="initial"
                    animate="enter"
                    exit="exit"
                    variants={imageVariants}
                    onClick={handleImageClick}
                    className="w-[220px] h-[180px] bg-[hsl(var(--white-surface))] border border-[hsl(var(--border))]/20 p-2 flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow"
                    title={currentIndex < sentences.length - 1 ? 'Кликните для следующей фразы' : 'Кликните для завершения'}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={sentenceText}
                        className="w-full h-full object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="text-5xl text-[hsl(var(--muted))]">💬</div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ===== HINT TRANSLATION (серым цветом) ===== */}
              <div className="px-4 w-full max-w-2xl mb-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`hint-${currentIndex}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center"
                  >
                    <div className="text-sm text-[hsl(var(--muted))] mb-2 flex items-center justify-center gap-2">
                      <span>Подсказка на {hintLanguage}</span>
                      <button
                        onClick={replayHintAudio}
                        disabled={!isAudioEnabled}
                        className="w-8 h-8 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center text-white hover:opacity-90 transition disabled:opacity-30"
                        title={`Озвучить на ${hintLanguage}`}
                      >
                        {isSpeaking && speakingType === 'hint' ? '🔊' : '🔈'}
                      </button>
                    </div>
                    <div className="text-xl font-semibold text-[hsl(var(--muted))] bg-[hsl(var(--white-surface))] border border-[hsl(var(--border))]/20 px-6 py-4 max-w-2xl leading-relaxed">
                      {hintText}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ===== NAVIGATION ARROWS (между фразами) ===== */}
              <div className="flex items-center gap-8 mt-6">
                <button
                  onClick={goPrev}
                  disabled={currentIndex === 0 || isAnimating}
                  className={`text-3xl font-bold transition ${
                    currentIndex === 0 || isAnimating
                      ? 'text-[hsl(var(--muted))] cursor-not-allowed'
                      : 'text-[hsl(var(--primary))] hover:scale-110'
                  }`}
                >
                  ◄
                </button>
                <span className="text-sm font-medium">
                  {currentIndex + 1} / {sentences.length}
                </span>
                <button
                  onClick={goNext}
                  disabled={isAnimating}
                  className="text-3xl font-bold text-[hsl(var(--primary))] hover:scale-110 transition"
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
                  <div><strong>Фраз:</strong> {sentences.length}</div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={handleClose}
                    className="flex-1 bg-[hsl(var(--accent))] text-white py-2 font-bold">
                    ✕ Закрыть
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