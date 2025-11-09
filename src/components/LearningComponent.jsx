// app/learning/page.js - ОБНОВЛЕННАЯ
'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://localhost:8888/api';

export default function LearningComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const lessonId = searchParams?.get('lesson');
  const studiedLanguage = searchParams?.get('studied') || 'русский';
  const hintLanguage = searchParams?.get('hint') || 'английский';
  const source = searchParams?.get('source') || 'lesson';

  const [lesson, setLesson] = useState(null);
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flags, setFlags] = useState([]);

// Загрузите флаги при монтировании
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
// В LearningPage добавим отладку
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
      if (source === 'table') {
        // Загружаем урок из таблицы
        url = `${API_BASE_URL}/table-lessons/${lessonId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`;
      } else {
        // Загружаем урок из коллекции Lesson
        url = `${API_BASE_URL}/lessons/${lessonId}`;
      }
      
      console.log('Loading lesson from:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка загрузки: ${response.status} - ${errorText}`);
      }
      
      const lessonData = await response.json();
      console.log('Loaded lesson data:', lessonData);
      console.log('Words in lesson:', lessonData.words);
      
      if (!lessonData) {
        setError('Урок не найден');
        return;
      }

      setLesson(lessonData);
      setWords(lessonData.words || []);
      setCurrentIndex(0);
      
      // Отладочная информация о словах
      if (lessonData.words && lessonData.words.length > 0) {
        console.log('First word details:', lessonData.words[0]);
        console.log('Available translations:', Object.keys(lessonData.words[0].translations || {}));
      }
    } catch (err) {
      console.error('Error loading lesson:', err);
      setError('Ошибка загрузки урока: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  loadLesson();
}, [lessonId, source, studiedLanguage, hintLanguage]);
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
        if (source === 'table') {
          // Загружаем урок из таблицы
          url = `${API_BASE_URL}/table-lessons/${lessonId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`;
        } else {
          // Загружаем урок из коллекции Lesson
          url = `${API_BASE_URL}/lessons/${lessonId}`;
        }
        
        console.log('Loading lesson from:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ошибка загрузки: ${response.status} - ${errorText}`);
        }
        
        const lessonData = await response.json();
        console.log('Loaded lesson:', lessonData);
        
        if (!lessonData) {
          setError('Урок не найден');
          return;
        }

        setLesson(lessonData);
        setWords(lessonData.words || []);
        setCurrentIndex(0);
      } catch (err) {
        console.error('Error loading lesson:', err);
        setError('Ошибка загрузки урока: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [lessonId, source, studiedLanguage, hintLanguage]);

 const currentWord = words[currentIndex];

 useEffect(() => {
  if (currentWord) {
    console.log('Current word:', currentWord);
    console.log('Studied language:', studiedLanguage);
    console.log('Hint language:', hintLanguage);
    console.log('Available translations:', currentWord.translations ? Object.keys(currentWord.translations) : 'none');
    console.log('Studied translation:', currentWord.translations?.[studiedLanguage]);
    console.log('Hint translation:', currentWord.translations?.[hintLanguage]);
  }
}, [currentWord, studiedLanguage, hintLanguage]);

// Функции для получения текста с fallback
const getStudiedText = () => {
  if (!currentWord || !currentWord.translations) return '—';
  
  // Пробуем разные варианты ключей
  const studiedKey = studiedLanguage.toLowerCase();
  const studiedKeyAlt = studiedLanguage; // оригинальный регистр
  
  return currentWord.translations[studiedKey] || 
         currentWord.translations[studiedKeyAlt] || 
         Object.values(currentWord.translations)[0] || 
         '—';
};

const getHintText = () => {
  if (!currentWord || !currentWord.translations) return '—';
  
  // Пробуем разные варианты ключей
  const hintKey = hintLanguage.toLowerCase();
  const hintKeyAlt = hintLanguage; // оригинальный регистр
  
  return currentWord.translations[hintKey] || 
         currentWord.translations[hintKeyAlt] || 
         Object.values(currentWord.translations)[1] || 
         Object.values(currentWord.translations)[0] || 
         '—';
};

const wordText = getStudiedText();
const hintText = getHintText();
const imageUrl = currentWord?.imagePng;

  const goNext = () => {
    if (isAnimating || !words.length) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        router.push('/');
      }
      setIsAnimating(false);
    }, 300);
  };

  const goPrev = () => {
    if (isAnimating || currentIndex === 0) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(prev => prev - 1);
      setIsAnimating(false);
    }, 300);
  };

  // Анимации
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
            onClick={() => router.push('/')}
            className="block mt-4 text-blue-500 hover:text-blue-700"
          >
            ← Вернуться на главную
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
        {studiedLanguage === 'русский' ? 'RU' : studiedLanguage === 'english' ? 'EN' : 'TR'}
      </span>
    )}
  </div>
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
                className="text-3xl font-bold tracking-wide px-6 py-3 rounded-lg bg-white/20 backdrop-blur-sm"
                style={{ color: lesson.fontColor }}
              >
                {wordText}
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
            <div className="text-lg text-gray-600 mb-2">Подсказка</div>
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
          {currentIndex < words.length - 1 ? 'Следующее слово →' : 'Завершить урок'}
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
        {hintLanguage === 'русский' ? 'RU' : hintLanguage === 'english' ? 'EN' : 'TR'}
      </span>
    )}
  </div>
</div>
   
    </div>
  );
}