// app/question-learning/page.js - РЕДИЗАЙН В ЕДИНОМ СТИЛЕ
'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeDisplayText } from '@/utils/normalize';

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

export default function QuestionLearningComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const moduleId = searchParams?.get('module');
  const studiedLanguage = searchParams?.get('studied') || 'русский';
  const hintLanguage = searchParams?.get('hint') || 'английский';
  const lessonId = searchParams?.get('lesson');
  const nextModuleId = searchParams?.get('next');

  const [module, setModule] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentView, setCurrentView] = useState('question');
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
  const [audioSupported, setAudioSupported] = useState(true);

  // 🆕 Прогресс урока
  const [lessonProgress, setLessonProgress] = useState({ current: 0, total: 0 });
  const [isLastModule, setIsLastModule] = useState(false);
  const [showLessonMenu, setShowLessonMenu] = useState(false);

  const synthesisRef = useRef(null);
  const initialSpeakDone = useRef(false);
  const utteranceRef = useRef(null);

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

  const checkSpeechSupport = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }, []);

  const findBestVoice = useCallback((availableVoices, language) => {
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
  }, []);

  useEffect(() => {
    const supported = checkSpeechSupport();
    setAudioSupported(supported);

    if (supported && window.speechSynthesis) {
      synthesisRef.current = window.speechSynthesis;

      const loadVoices = () => {
        try {
          const availableVoices = window.speechSynthesis.getVoices();
          setVoices(availableVoices);
          if (availableVoices.length > 0) {
            const bestStudied = findBestVoice(availableVoices, studiedLanguage);
            if (bestStudied) setSelectedVoice(bestStudied);
            const bestHint = findBestVoice(availableVoices, hintLanguage);
            if (bestHint) setSelectedHintVoice(bestHint);
          }
        } catch (e) {
          console.warn('Voice load error:', e);
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
        try { if (synthesisRef.current.paused) synthesisRef.current.resume(); } catch {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (synthesisRef.current) {
        try { synthesisRef.current.cancel(); } catch {}
      }
    };
  }, []);

  const speak = useCallback((text, language, type) => {
    if (!isAudioEnabled || !synthesisRef.current || !text || text === '—' || !audioSupported) return;
    if (!window.speechSynthesis) return;

    if (synthesisRef.current.speaking) {
      try { synthesisRef.current.cancel(); } catch {}
    }

    let utterance;
    try {
      utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
    } catch (e) {
      console.error('SpeechSynthesis error:', e);
      return;
    }

    const langCode = LANGUAGE_CODES[language.toLowerCase()] || language.substring(0, 2);
    const regionMap = {
      'ru': 'ru-RU', 'en': 'en-US', 'tr': 'tr-TR', 'de': 'de-DE',
      'fr': 'fr-FR', 'es': 'es-ES', 'it': 'it-IT', 'zh': 'zh-CN',
      'ja': 'ja-JP', 'ko': 'ko-KR', 'ar': 'ar-SA'
    };
    utterance.lang = regionMap[langCode] || `${langCode}-${langCode.toUpperCase()}`;

    const rateMap = { 'ru': 0.9, 'en': 0.85, 'tr': 0.9, 'de': 0.85, 'fr': 0.9, 'es': 0.9, 'zh': 0.8 };
    utterance.rate = rateMap[langCode] || 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    try {
      if (type.startsWith('studied') && selectedVoice) utterance.voice = selectedVoice;
      else if (type.startsWith('hint') && selectedHintVoice) utterance.voice = selectedHintVoice;
      else {
        const best = findBestVoice(window.speechSynthesis.getVoices(), language);
        if (best) utterance.voice = best;
      }
    } catch (e) {
      console.warn('Voice selection error:', e);
    }

    utterance.onstart = () => { setIsSpeaking(true); setSpeakingType(type); };
    utterance.onend = () => { setIsSpeaking(false); setSpeakingType(null); utteranceRef.current = null; };
    utterance.onerror = (event) => {
      if (event.error === 'interrupted' || event.error === 'canceled') return;
      setIsSpeaking(false);
      setSpeakingType(null);
      utteranceRef.current = null;
    };
    utterance.onpause = () => setIsSpeaking(false);
    utterance.onresume = () => setIsSpeaking(true);

    setTimeout(() => {
      try { if (synthesisRef.current && !synthesisRef.current.speaking) synthesisRef.current.speak(utterance); } catch {}
    }, 50);
  }, [isAudioEnabled, selectedVoice, selectedHintVoice, audioSupported, findBestVoice]);

  useEffect(() => {
    return () => {
      if (synthesisRef.current) {
        try { synthesisRef.current.cancel(); } catch {}
      }
    };
  }, []);

  useEffect(() => { initialSpeakDone.current = false; }, [moduleId]);

  useEffect(() => {
    const loadModuleAndQuestions = async () => {
      if (!moduleId) {
        setError('ID модуля не указан');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setCurrentView('question');

        const moduleResponse = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}`);
        if (!moduleResponse.ok) throw new Error('Модуль не найден');
        const moduleData = await moduleResponse.json();
        setModule(moduleData);

        const questionsResponse = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/questions`);
        if (!questionsResponse.ok) throw new Error('Не удалось загрузить вопросы');
        const questionsData = await questionsResponse.json();

        if (!questionsData || questionsData.length === 0) {
          setError('В этом модуле пока нет вопросов');
          return;
        }
        setQuestions(questionsData);
        setCurrentIndex(0);
      } catch (err) {
        setError('Ошибка загрузки: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadModuleAndQuestions();
  }, [moduleId]);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (currentQuestion && isAudioEnabled && isInitialized && audioSupported) {
      const text = currentView === 'question' ? getQuestionText() : getAnswerText();
      const type = currentView === 'question' ? 'studied-question' : 'studied-answer';
      const timer = setTimeout(() => speak(text, studiedLanguage, type), 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentView, isAudioEnabled, studiedLanguage, isInitialized, audioSupported]);

  useEffect(() => {
    if (!loading && currentQuestion && isAudioEnabled && isInitialized && !initialSpeakDone.current && audioSupported) {
      const text = getQuestionText();
      const timer = setTimeout(() => {
        speak(text, studiedLanguage, 'studied-question');
        initialSpeakDone.current = true;
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, currentQuestion, isAudioEnabled, isInitialized, audioSupported]);

  const requiresPairAnswer = currentQuestion?.requiresPairAnswer !== false;

  const getQuestionText = () => {
    if (!currentQuestion?.questionStructure) return '—';
    const text = currentQuestion.questionStructure
      .map(item => item.word || '')
      .filter(w => w.trim() !== '')
      .join(' ');
    return normalizeDisplayText(text, true);
  };

  const getQuestionTranslation = () => {
    if (currentQuestion?.englishQuestion) return currentQuestion.englishQuestion;
    if (currentQuestion?.autoEnglishQuestion) return currentQuestion.autoEnglishQuestion;
    if (currentQuestion?.questionStructure) {
      const translated = currentQuestion.questionStructure
        .map(item => {
          if (item.wordData?.translations) {
            const hintKey = hintLanguage.toLowerCase();
            return item.wordData.translations[hintKey] || Object.values(item.wordData.translations)[0] || item.word;
          }
          return item.word || '';
        })
        .filter(w => w.trim() !== '')
        .join(' ');
      return translated || '—';
    }
    return '—';
  };

  const getAnswerText = () => {
    if (!currentQuestion?.answerStructure) return '—';
    const text = currentQuestion.answerStructure
      .map(item => item.word || '')
      .filter(w => w.trim() !== '')
      .join(' ');
    return normalizeDisplayText(text, false);
  };

  const getAnswerTranslation = () => {
    if (currentQuestion?.englishAnswer) return currentQuestion.englishAnswer;
    if (currentQuestion?.autoEnglishAnswer) return currentQuestion.autoEnglishAnswer;
    if (currentQuestion?.answerStructure) {
      const translated = currentQuestion.answerStructure
        .map(item => {
          if (item.wordData?.translations) {
            const hintKey = hintLanguage.toLowerCase();
            return item.wordData.translations[hintKey] || Object.values(item.wordData.translations)[0] || item.word;
          }
          return item.word || '';
        })
        .filter(w => w.trim() !== '')
        .join(' ');
      return translated || '—';
    }
    return '—';
  };

  const getHint = () => currentQuestion?.hint || null;

  const questionText = getQuestionText();
  const questionTranslation = getQuestionTranslation();
  const answerText = getAnswerText();
  const answerTranslation = getAnswerTranslation();
  const hint = getHint();

  const getCurrentImage = () => {
    if (currentView === 'question') return currentQuestion?.questionImage;
    return currentQuestion?.answerImage || currentQuestion?.questionImage;
  };
  const currentImage = getCurrentImage();

  // 🆕 Закрытие
  const handleClose = () => {
    if (lessonId) router.push(`/?lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`);
    else router.push('/');
  };

  const goNext = () => {
    if (isAnimating || !questions.length) return;
    setIsAnimating(true);
    setTimeout(() => {
      if (currentView === 'question' && requiresPairAnswer) {
        setCurrentView('answer');
        setIsAnimating(false);
      } else {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setCurrentView('question');
          setIsAnimating(false);
        } else {
          goToNextModule();
        }
      }
    }, 300);
  };

  const goPrev = () => {
    if (isAnimating) return;
    if (synthesisRef.current) {
      try { synthesisRef.current.cancel(); } catch {}
    }
    setIsSpeaking(false);
    setSpeakingType(null);
    setIsAnimating(true);
    setTimeout(() => {
      if (currentView === 'answer' && requiresPairAnswer) {
        setCurrentView('question');
      } else if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setCurrentView('question');
      }
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

  const replayStudiedAudio = () => {
    const text = currentView === 'question' ? questionText : answerText;
    const type = currentView === 'question' ? 'studied-question' : 'studied-answer';
    speak(text, studiedLanguage, type);
  };

  const replayHintAudio = () => {
    const text = currentView === 'question' ? questionTranslation : answerTranslation;
    const type = currentView === 'question' ? 'hint-question' : 'hint-answer';
    speak(text, hintLanguage, type);
  };

  const speakHint = () => {
    if (hint) speak(hint, studiedLanguage, 'hint');
  };

  // 🆕 Клик по картинке = следующий слайд
  const handleImageClick = () => {
    if (isAnimating) return;
    if (currentView === 'question' && requiresPairAnswer) {
      setCurrentView('answer');
    } else if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentView('question');
    } else {
      goToNextModule();
    }
  };

  const slideVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } }
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
        <div className="min-h-screen flex items-center justify-center text-lg">Загрузка вопросов...</div>
      </>
    );
  }

  // ============ ERROR ============
  if (error || !module) {
    return (
      <>
        <style jsx global>{`
          :root { --background: 0 0% 91%; --foreground: 0 0% 7%; --accent: 0 65% 54%; --muted: 0 0% 44%; }
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
  if (questions.length === 0) {
    return (
      <>
        <style jsx global>{`
          :root { --background: 0 0% 91%; --foreground: 0 0% 7%; --muted: 0 0% 44%; }
          body { background-color: hsl(var(--background)); }
        `}</style>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-[hsl(var(--muted))] mb-4">В этом модуле пока нет вопросов</div>
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
  // Прогресс считается по "полным вопросам" (question+answer = 1 шаг)
  const totalSteps = questions.length * (requiresPairAnswer ? 2 : 1);
  const currentStep = currentIndex * (requiresPairAnswer ? 2 : 1) + (currentView === 'answer' ? 1 : 0) + 1;
  const questionPercent = Math.round((currentStep / totalSteps) * 100);
  const lessonPercent = lessonProgress.total > 0
    ? Math.round((lessonProgress.current / lessonProgress.total) * 100)
    : 0;

  // Текст БОЛЬШИМИ БУКВАМИ
  const displayStudiedText = (currentView === 'question' ? questionText : answerText).toUpperCase();
  const displayHintText = currentView === 'question' ? questionTranslation : answerTranslation;
  const studiedLabel = currentView === 'question' ? 'ВОПРОС' : 'ОТВЕТ';

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
                  Урок {lessonProgress.current} - Вопросы
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
              <div className="flex flex-col leading-snug min-w-[140px]">
                <span className="text-sm text-[hsl(var(--muted))]">Название урока:</span>
                <span className="font-bold text-base">
                  {module?.title?.toUpperCase() || 'ВОПРОСЫ'}
                </span>
                <span className="text-sm text-[hsl(var(--muted))]">Модуль - Вопросы</span>
              </div>

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
                         style={{ width: `${questionPercent}%` }}></div>
                    <span className="absolute inset-0 flex items-center justify-start pl-2 text-xs">
                      {studiedLabel} {currentIndex + 1} из {questions.length}
                    </span>
                    <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs">
                      • {questionPercent}%
                    </span>
                  </div>
                </div>
              </div>

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

                  {!audioSupported && (
                    <div className="mb-3 p-2 bg-red-50 text-xs text-red-700">
                      Аудио не поддерживается
                    </div>
                  )}

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
                          onChange={(e) => setSelectedVoice(voices.find(v => v.name === e.target.value))}
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
                          onChange={(e) => setSelectedHintVoice(voices.find(v => v.name === e.target.value))}
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

              {/* ===== Метка: ВОПРОС / ОТВЕТ ===== */}
              <div className="mt-16 mb-2">
                <span className="text-sm font-medium text-[hsl(var(--primary))] tracking-wider">
                  {studiedLabel}
                </span>
              </div>

              {/* ===== STUDIED TEXT - UPPERCASE ===== */}
              <div className="mb-6 px-4 w-full max-w-3xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentView}-${currentIndex}-studied`}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={slideVariants}
                    className="text-center"
                  >
                    <div className="relative inline-block">
                      <motion.div
                        initial={{ scale: 0.98 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.35 }}
                        className="text-2xl md:text-3xl font-bold tracking-wide px-6 py-4 bg-[hsl(var(--white-surface))] border border-[hsl(var(--border))]/20 max-w-2xl leading-relaxed"
                      >
                        {displayStudiedText}
                      </motion.div>

                      {audioSupported && (
                        <button
                          onClick={replayStudiedAudio}
                          disabled={!isAudioEnabled}
                          className="absolute -right-14 top-1/2 transform -translate-y-1/2 w-11 h-11 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:opacity-90 transition"
                          title={`Повторить на ${studiedLanguage}`}
                        >
                          {isSpeaking && (speakingType === 'studied-question' || speakingType === 'studied-answer') ? '🔊' : '🔈'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ===== IMAGE (кликабельная) ===== */}
              <div className="mb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`image-${currentView}-${currentIndex}`}
                    initial="initial"
                    animate="enter"
                    exit="exit"
                    variants={imageVariants}
                    onClick={handleImageClick}
                    className="w-[220px] h-[180px] bg-[hsl(var(--white-surface))] border border-[hsl(var(--border))]/20 p-2 flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow"
                    title="Кликните для перехода дальше"
                  >
                    {currentImage ? (
                      <img
                        src={currentImage}
                        alt={currentView === 'question' ? questionText : answerText}
                        className="w-full h-full object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="text-5xl text-[hsl(var(--muted))]">
                        {currentView === 'question' ? '❓' : '💡'}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ===== HINT TRANSLATION (серым) ===== */}
              <div className="px-4 w-full max-w-2xl mb-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentView}-${currentIndex}-hint`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center"
                  >
                    <div className="text-sm text-[hsl(var(--muted))] mb-2 flex items-center justify-center gap-2">
                      <span>
                        {currentView === 'question' ? 'Перевод вопроса' : 'Перевод ответа'} ({hintLanguage})
                      </span>
                      {audioSupported && (
                        <button
                          onClick={replayHintAudio}
                          disabled={!isAudioEnabled}
                          className="w-8 h-8 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center text-white hover:opacity-90 transition disabled:opacity-30"
                          title={`Озвучить на ${hintLanguage}`}
                        >
                          {isSpeaking && (speakingType === 'hint-question' || speakingType === 'hint-answer') ? '🔊' : '🔈'}
                        </button>
                      )}
                    </div>
                    <div className="text-xl font-semibold text-[hsl(var(--muted))] bg-[hsl(var(--white-surface))] border border-[hsl(var(--border))]/20 px-6 py-4 max-w-2xl leading-relaxed">
                      {displayHintText}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ===== HINT БЛОК (доп. подсказка) ===== */}
              {/* {hint && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center mb-6 px-4 max-w-2xl"
                  >
                    <div className="inline-block bg-yellow-50 border border-yellow-300 px-6 py-4">
                      <div className="text-sm text-yellow-700 font-medium mb-1 flex items-center justify-center gap-2">
                        <span>💡 Подсказка</span>
                        {audioSupported && (
                          <button
                            onClick={speakHint}
                            disabled={!isAudioEnabled}
                            className="w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center text-white hover:opacity-90 disabled:opacity-30 text-xs"
                            title="Озвучить подсказку"
                          >
                            🔊
                          </button>
                        )}
                      </div>
                      <div className="text-base text-[hsl(var(--foreground))] italic">
                        "{hint}"
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )} */}

              {/* ===== ОСНОВНАЯ КНОПКА (Посмотреть ответ / Далее / Завершить) ===== */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={goNext}
                disabled={isAnimating}
                className="bg-[hsl(var(--primary))] text-white px-10 py-3 font-bold text-base hover:opacity-90 transition disabled:opacity-50 mb-6"
              >
                {currentView === 'question' && requiresPairAnswer ? (
                  'Посмотреть ответ →'
                ) : currentIndex < questions.length - 1 ? (
                  'Следующий вопрос →'
                ) : (
                  isLastModule ? 'Завершить урок →' : 'Завершить модуль →'
                )}
              </motion.button>

              {/* ===== NAVIGATION ARROWS ===== */}
              <div className="flex items-center gap-8 mt-2">
                <button
                  onClick={goPrev}
                  disabled={(currentView === 'question' && currentIndex === 0) || isAnimating}
                  className={`text-3xl font-bold transition ${
                    (currentView === 'question' && currentIndex === 0) || isAnimating
                      ? 'text-[hsl(var(--muted))] cursor-not-allowed'
                      : 'text-[hsl(var(--primary))] hover:scale-110'
                  }`}
                >
                  ◄
                </button>
                <span className="text-sm font-medium">
                  {currentIndex + 1} / {questions.length}
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
                  <div><strong>Вопросов:</strong> {questions.length}</div>
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