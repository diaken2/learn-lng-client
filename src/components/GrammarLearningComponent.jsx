// app/grammar-learning/page.jsx - РЕДИЗАЙН
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

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

export default function GrammarLearningComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const moduleId = searchParams?.get('module');
  const lessonId = searchParams?.get('lesson');
  const studiedLanguage = searchParams?.get('studied') || 'русский';
  const hintLanguage = searchParams?.get('hint') || 'английский';
  const nextModuleId = searchParams?.get('next');

  const [grammarModules, setGrammarModules] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lessonInfo, setLessonInfo] = useState(null);

  // 🆕 Прогресс урока
  const [lessonProgress, setLessonProgress] = useState({ current: 0, total: 0 });
  const [isLastModule, setIsLastModule] = useState(false);
  const [showLessonMenu, setShowLessonMenu] = useState(false);

  // Функция для нормализации и получения свойств слова из любого типа таблицы
  const getWordProperties = (cell) => {
    if (!cell) return [];
    const properties = [];

    if (cell.number) {
      const numberMap = {
        'единственное': 'ед.ч', 'единственное число': 'ед.ч', 'singular': 'ед.ч',
        'множественное': 'мн.ч', 'множественное число': 'мн.ч', 'plural': 'мн.ч'
      };
      properties.push(numberMap[cell.number.toLowerCase()] || cell.number);
    }
    if (cell.gender) {
      const genderMap = {
        'мужской': 'м.р', 'мужской род': 'м.р', 'masculine': 'м.р',
        'женский': 'ж.р', 'женский род': 'ж.р', 'feminine': 'ж.р',
        'средний': 'ср.р', 'средний род': 'ср.р', 'neuter': 'ср.р'
      };
      properties.push(genderMap[cell.gender.toLowerCase()] || cell.gender);
    }
    if (cell.adjective_form) {
      const formMap = { 'полная': 'полн.ф', 'краткая': 'кратк.ф' };
      properties.push(formMap[cell.adjective_form.toLowerCase()] || cell.adjective_form);
    }
    if (cell.degree) {
      const degreeMap = {
        'положительная': 'полож.ст', 'сравнительная': 'сравн.ст', 'превосходная': 'превосх.ст'
      };
      properties.push(degreeMap[cell.degree.toLowerCase()] || cell.degree);
    }
    if (cell.tense) {
      const tenseMap = {
        'present': 'наст.вр', 'present tense': 'наст.вр', 'настоящее': 'наст.вр',
        'past': 'прош.вр', 'past tense': 'прош.вр', 'прошедшее': 'прош.вр',
        'future': 'буд.вр', 'future tense': 'буд.вр', 'будущее': 'буд.вр',
        'imperative': 'повел.накл', 'imperative mood': 'повел.накл'
      };
      properties.push(tenseMap[cell.tense.toLowerCase()] || cell.tense);
    }
    if (cell.aspect) {
      const aspectMap = {
        'imperfective': 'несов.в', 'несовершенный': 'несов.в',
        'perfective': 'сов.в', 'совершенный': 'сов.в'
      };
      properties.push(aspectMap[cell.aspect.toLowerCase()] || cell.aspect);
    }
    if (cell.mood) {
      const moodMap = {
        'indicative': 'изъяв.накл', 'conditional': 'услов.накл', 'imperative': 'повел.накл'
      };
      properties.push(moodMap[cell.mood.toLowerCase()] || cell.mood);
    }
    if (cell.voice) {
      const voiceMap = { 'active': 'действ.залог', 'passive': 'страд.залог' };
      properties.push(voiceMap[cell.voice.toLowerCase()] || cell.voice);
    }
    if (cell.person) properties.push(`${cell.person}-е лицо`);
    if (cell.pronoun_type) {
      const typeMap = {
        'personal': 'личное', 'possessive': 'притяжательное', 'demonstrative': 'указательное',
        'interrogative': 'вопросительное', 'relative': 'относительное', 'reflexive': 'возвратное',
        'indefinite': 'неопределенное', 'negative': 'отрицательное'
      };
      properties.push(typeMap[cell.pronoun_type.toLowerCase()] || cell.pronoun_type);
    }
    if (cell.numeral_type) {
      const typeMap = {
        'cardinal': 'количественное', 'ordinal': 'порядковое',
        'collective': 'собирательное', 'fractional': 'дробное'
      };
      properties.push(typeMap[cell.numeral_type.toLowerCase()] || cell.numeral_type);
    }
    if (cell.adverb_type) {
      const typeMap = {
        'manner': 'образа действия', 'time': 'времени', 'place': 'места',
        'degree': 'меры и степени', 'frequency': 'частоты'
      };
      properties.push(typeMap[cell.adverb_type.toLowerCase()] || cell.adverb_type);
    }
    if (cell.preposition_case) properties.push(`${cell.preposition_case} падеж`);
    if (cell.participle_type) {
      const typeMap = {
        'present_active': 'действ.наст', 'past_active': 'действ.прош',
        'present_passive': 'страд.наст', 'past_passive': 'страд.прош'
      };
      properties.push(typeMap[cell.participle_type.toLowerCase()] || cell.participle_type);
    }
    if (cell.gerund_type) {
      const typeMap = { 'imperfective': 'несов.в', 'perfective': 'сов.в' };
      properties.push(typeMap[cell.gerund_type.toLowerCase()] || cell.gerund_type);
    }
    if (cell.case) {
      const caseMap = {
        'nominative': 'Им.п', 'именительный': 'Им.п',
        'genitive': 'Род.п', 'родительный': 'Род.п',
        'dative': 'Дат.п', 'дательный': 'Дат.п',
        'accusative': 'Вин.п', 'винительный': 'Вин.п',
        'instrumental': 'Тв.п', 'творительный': 'Тв.п',
        'prepositional': 'Пр.п', 'предложный': 'Пр.п'
      };
      properties.push(caseMap[cell.case.toLowerCase()] || cell.case);
    }
    return [...new Set(properties)];
  };

  const formatFilters = (cell) => {
    if (!cell) return '';
    const properties = getWordProperties(cell);
    return properties.length > 0 ? `(${properties.join(', ')})` : '';
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
    const loadGrammarModules = async () => {
      try {
        if (!moduleId) throw new Error('Module ID not provided');

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

        const grammarResponse = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/grammar`);
        if (!grammarResponse.ok) throw new Error('Failed to load grammar modules');

        const grammarData = await grammarResponse.json();
        if (grammarData.length === 0) {
          setError('В этом модуле нет грамматических материалов');
        } else {
          setGrammarModules(grammarData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadGrammarModules();
  }, [moduleId, lessonId, studiedLanguage, hintLanguage]);

  const handleNext = () => {
    if (currentIndex < grammarModules.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      goToNextModule();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // 🆕 Закрытие
  const handleClose = () => {
    if (lessonId) router.push(`/?lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`);
    else router.push('/');
  };

  // Функция для форматирования текста с большими буквами
  const formatTextWithCapitalLetters = (text) => {
    if (!text) return text;
    const regex = /[А-ЯA-Z][а-яa-z]*|[а-яa-z]+|[^а-яa-zА-ЯA-Z]+/g;
    const matches = text.match(regex) || [];
    return matches.map((part, index) => {
      const hasCapitalLetter = /^[А-ЯA-Z]/.test(part) && /[а-яa-z]/i.test(part);
      if (hasCapitalLetter) {
        return (
          <span key={index} className="font-bold text-[hsl(var(--accent))]">
            {part}
          </span>
        );
      }
      return <span key={index} className="font-bold">{part}</span>;
    });
  };

  // ============ LOADING ============
  if (loading) {
    return (
      <>
        <style jsx global>{`
          :root { --background: 0 0% 91%; --foreground: 0 0% 7%; --primary: 220 63% 50%; --muted: 0 0% 44%; }
          body { background-color: hsl(var(--background)); font-family: 'Arial', system-ui, sans-serif; }
        `}</style>
        <div className="min-h-screen flex items-center justify-center text-lg">
          Загрузка грамматических материалов...
        </div>
      </>
    );
  }

  // ============ ERROR ============
  if (error) {
    return (
      <>
        <style jsx global>{`
          :root { --background: 0 0% 91%; --foreground: 0 0% 7%; --accent: 0 65% 54%; --muted: 0 0% 44%; }
          body { background-color: hsl(var(--background)); }
        `}</style>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-[hsl(var(--accent))] mb-2">Ошибка</div>
            <div className="text-sm text-[hsl(var(--muted))] mb-4">{error}</div>
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
  if (grammarModules.length === 0) {
    return (
      <>
        <style jsx global>{`
          :root { --background: 0 0% 91%; --foreground: 0 0% 7%; --muted: 0 0% 44%; }
          body { background-color: hsl(var(--background)); }
        `}</style>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-3">📊</div>
            <div className="text-lg text-[hsl(var(--muted))] mb-4">В этом модуле пока нет грамматических материалов</div>
            <button onClick={goToNextModule}
              className="px-6 py-2 bg-[hsl(var(--primary))] text-white font-bold hover:opacity-90">
              {nextModuleId ? 'Следующий модуль →' : '✕ Закрыть'}
            </button>
          </div>
        </div>
      </>
    );
  }

  const currentGrammar = grammarModules[currentIndex];
  const grammarPercent = Math.round(((currentIndex + 1) / grammarModules.length) * 100);
  const lessonPercent = lessonProgress.total > 0
    ? Math.round((lessonProgress.current / lessonProgress.total) * 100)
    : 0;

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
                  Урок {lessonProgress.current} - {lessonInfo?.title || 'Грамматика'}
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
                  {(lessonInfo?.title || 'ГРАММАТИКА').toUpperCase()}
                </span>
                <span className="text-sm text-[hsl(var(--muted))]">Модуль - Грамматика</span>
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
                         style={{ width: `${grammarPercent}%` }}></div>
                    <span className="absolute inset-0 flex items-center justify-start pl-2 text-xs">
                      Материал {currentIndex + 1} из {grammarModules.length}
                    </span>
                    <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs">
                      • {grammarPercent}%
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

            {/* ===== MAIN CONTENT AREA ===== */}
            <div className="relative bg-[hsl(var(--background))] min-h-[500px] pb-20">

              {/* Flag left - studied language */}
              <div className="absolute left-4 top-4 z-10">
                {renderFlag(studiedLanguage, 'normal')}
              </div>

              <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">

                {/* 🖼️ КАРТИНКА НА ПОЛНУЮ ШИРИНУ */}
                {currentGrammar.mediaType === 'image' && currentGrammar.image && (
                  <div className="mb-6">
                    <div className="w-full max-h-[400px] bg-[hsl(var(--white-surface))] border border-[hsl(var(--border))]/20 overflow-hidden flex items-center justify-center">
                      <img
                        src={currentGrammar.image}
                        alt="Иллюстрация к грамматике"
                        className="w-full h-auto max-h-[400px] object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* 🎥 ВИДЕО НА ПОЛНУЮ ШИРИНУ */}
                {currentGrammar.mediaType === 'video' && currentGrammar.video && (
                  <div className="mb-6">
                    <div className="w-full bg-[hsl(var(--white-surface))] border border-[hsl(var(--border))]/20 overflow-hidden">
                      <video
                        controls
                        className="w-full max-h-[400px]"
                      >
                        <source src={currentGrammar.video} type="video/mp4" />
                        Ваш браузер не поддерживает видео тег.
                      </video>
                    </div>
                  </div>
                )}

                {/* 📝 ТЕКСТОВОЕ ОБЪЯСНЕНИЕ */}
                {currentGrammar.explanation && (
                  <div className="mb-6">
                    <div className="bg-[hsl(var(--white-surface))] border border-[hsl(var(--border))]/20 p-5">
                      <p className="text-[hsl(var(--foreground))] whitespace-pre-wrap font-bold leading-relaxed">
                        {formatTextWithCapitalLetters(currentGrammar.explanation)}
                      </p>
                    </div>
                  </div>
                )}

                {/* 📊 ТАБЛИЦА ПРИМЕРОВ - ФИКСИРОВАННЫЙ РАЗМЕР, ПО ЦЕНТРУ */}
                {currentGrammar.tableConfig && (
                  <div className="mt-8">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--muted))] mb-3">
                      Примеры:
                    </h2>
                    <div className="w-full bg-[hsl(var(--white-surface))] border border-[hsl(var(--border))]/20 overflow-x-auto">
                      <table className="w-full table-fixed border-collapse">
                        <thead>
                          <tr className="bg-[hsl(var(--panel-light))]">
                            <th className="w-[60px] border border-[hsl(var(--border))]/20 p-3 text-center text-xs font-bold text-[hsl(var(--foreground))] align-middle">
                              №
                            </th>
                            {Array.from({ length: currentGrammar.tableConfig.columns }).map((_, colIndex) => (
                              <th key={colIndex} className="border border-[hsl(var(--border))]/20 p-3 text-center text-xs font-bold text-[hsl(var(--foreground))] align-middle">
                                {currentGrammar.tableConfig.columns > 1 ? `Вариант ${colIndex + 1}` : 'Пример'}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: currentGrammar.tableConfig.rows }).map((_, rowIndex) => {
                            const cells = currentGrammar.tableConfig.data[rowIndex] || [];

                            return (
                              <tr key={rowIndex} className="hover:bg-[hsl(var(--panel-light))]/50 transition-colors">
                                <td className="w-[60px] border border-[hsl(var(--border))]/20 p-3 text-center align-middle font-bold bg-[hsl(var(--panel-light))]/30">
                                  {rowIndex + 1}
                                </td>
                                {Array.from({ length: currentGrammar.tableConfig.columns }).map((_, colIndex) => {
                                  const cell = cells[colIndex];
                                  const word = cell?.word || '';
                                  const filters = formatFilters(cell);

                                  return (
                                    <td key={colIndex} className="border border-[hsl(var(--border))]/20 p-3 text-center align-middle">
                                      {word ? (
                                        <div className="flex flex-col items-center gap-1">
                                          <span className="font-bold text-[hsl(var(--foreground))]">
                                            {formatTextWithCapitalLetters(word)}
                                          </span>
                                          {filters && filters !== '()' && (
                                            <span className="text-[10px] text-[hsl(var(--muted))] font-medium">
                                              {filters}
                                            </span>
                                          )}
                                          {cell.lesson && (
                                            <div className="text-[10px] text-[hsl(var(--primary))] font-medium">
                                              {cell.lesson}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-[hsl(var(--muted))]">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ===== NAVIGATION ARROWS + DOTS ===== */}
                <div className="flex flex-col items-center mt-10 gap-4">
                  <div className="flex items-center gap-8">
                    <button
                      onClick={handlePrevious}
                      disabled={currentIndex === 0}
                      className={`text-3xl font-bold transition ${
                        currentIndex === 0
                          ? 'text-[hsl(var(--muted))] cursor-not-allowed'
                          : 'text-[hsl(var(--primary))] hover:scale-110'
                      }`}
                    >
                      ◄
                    </button>
                    <span className="text-sm font-medium">
                      {currentIndex + 1} / {grammarModules.length}
                    </span>
                    <button
                      onClick={handleNext}
                      className="text-3xl font-bold text-[hsl(var(--primary))] hover:scale-110 transition"
                    >
                      ►
                    </button>
                  </div>

                  {/* Dots navigation */}
                  {grammarModules.length > 1 && (
                    <div className="flex gap-2">
                      {grammarModules.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentIndex(index)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            index === currentIndex
                              ? 'bg-[hsl(var(--primary))] scale-125'
                              : 'bg-[hsl(var(--muted))]/40 hover:bg-[hsl(var(--muted))]'
                          }`}
                          aria-label={`Материал ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
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
                  <div><strong>Урок:</strong> {lessonInfo?.title || lessonId || '—'}</div>
                  <div><strong>Языки:</strong> {studiedLanguage} → {hintLanguage}</div>
                  <div><strong>Модуль:</strong> {lessonProgress.current} из {lessonProgress.total}</div>
                  <div><strong>Материалов:</strong> {grammarModules.length}</div>
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

function getDatabaseDisplayName(database) {
  const databaseNames = {
    'nouns': 'Существительное',
    'adjectives': 'Прилагательное',
    'verbs': 'Глагол',
    'pronouns': 'Местоимение',
    'numerals': 'Числительное',
    'adverbs': 'Наречие',
    'prepositions': 'Предлог',
    'question-words': 'Вопросительное слово',
    'gerunds': 'Деепричастие',
    'participles': 'Причастие'
  };
  return databaseNames[database] || database;
}