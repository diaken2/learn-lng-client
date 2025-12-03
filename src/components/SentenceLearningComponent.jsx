'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'https://learn-lng-server.onrender.com/api';

export default function SentenceLearningComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const moduleId = searchParams?.get('module');
  const studiedLanguage = searchParams?.get('studied') || 'русский';
  const hintLanguage = searchParams?.get('hint') || 'английский';
  const lessonId = searchParams?.get('lesson');

  const [module, setModule] = useState(null);
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flags, setFlags] = useState([]);

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

  // Загружаем модуль и предложения
  useEffect(() => {
    const loadModuleAndSentences = async () => {
      if (!moduleId) {
        setError('ID модуля не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        console.log('Loading module:', moduleId);
        
        // Загружаем данные модуля
        const moduleResponse = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}`);
        if (!moduleResponse.ok) {
          throw new Error('Модуль не найден');
        }
        
        const moduleData = await moduleResponse.json();
        console.log('Loaded module:', moduleData);
        setModule(moduleData);

        // Загружаем предложения модуля
        const sentencesResponse = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/sentences`);
        if (!sentencesResponse.ok) {
          throw new Error('Не удалось загрузить предложения');
        }
        
        const sentencesData = await sentencesResponse.json();
        console.log('Loaded sentences:', sentencesData);
        
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

  // Получаем текущее предложение
  const currentSentence = sentences[currentIndex];

  // Функции для получения текста фразы
  const getStudiedSentence = () => {
    if (!currentSentence || !currentSentence.sentenceStructure) return '—';
    
    // Собираем фразу из структуры предложения
    const sentenceText = currentSentence.sentenceStructure
      .map(item => item.word || '')
      .filter(word => word.trim() !== '')
      .join(' ');
    
    return sentenceText || '—';
  };

  const getHintSentence = () => {
    if (!currentSentence || !currentSentence.sentenceStructure) return '—';
    
    // Для подсказки можно использовать перевод или собрать из переводов слов
    // Пока просто возвращаем ту же фразу, можно доработать логику переводов
    const sentenceText = currentSentence.sentenceStructure
      .map(item => {
        // Пытаемся найти перевод для языка подсказки
        if (item.wordData && item.wordData.translations) {
          const hintKey = hintLanguage.toLowerCase();
          const translation = item.wordData.translations[hintKey] || 
                             Object.values(item.wordData.translations)[0];
          return translation || item.word;
        }
        return item.word || '';
      })
      .filter(word => word.trim() !== '')
      .join(' ');
    
    return sentenceText || '—';
  };

  const sentenceText = getStudiedSentence();
  const hintText = getHintSentence();
  const imageUrl = currentSentence?.image;

  const goNext = () => {
    if (isAnimating || !sentences.length) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      if (currentIndex < sentences.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Завершаем модуль
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
        <div className="text-gray-500 text-lg">Загрузка фраз...</div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500 text-lg text-center">
          {error || 'Модуль не найден'}
          <div className="text-sm text-gray-600 mt-2">
            ID модуля: {moduleId}
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

  if (sentences.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg text-center">
          В этом модуле пока нет фраз
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
        backgroundColor: '#f0f0f0', // Можно настроить из модуля
        color: '#000000' 
      }}
    >
      {/* Верхняя зона с изучаемой фразой */}
      <div className="h-[48vh] bg-gradient-to-b from-blue-300 to-blue-200 flex items-start justify-center relative overflow-visible">
        {/* Флаг изучаемого языка */}
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

        {/* Кнопка закрытия */}
        <button 
          onClick={() => router.push('/')}
          className="absolute top-4 right-4 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-gray-600 hover:bg-white transition-colors"
        >
          ×
        </button>

        {/* Прогресс */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-sm text-gray-700 font-medium">
          {currentIndex + 1} / {sentences.length}
        </div>

        {/* Изучаемая фраза */}
        <div className="mt-16 flex flex-col items-center px-4">
          <AnimatePresence mode="wait">
            <motion.div 
              key={`sentence-${currentIndex}`}
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
                className="text-2xl font-bold tracking-wide px-6 py-4 rounded-lg bg-white/20 backdrop-blur-sm max-w-2xl leading-relaxed"
                style={{ color: '#000000' }}
              >
                {sentenceText}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Картинка фразы */}
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
    alt={sentenceText}
    className="w-full h-full object-contain"
    onError={(e) => {
      console.error('Image load error:', imageUrl);
      e.target.style.display = 'none';
      // Показываем fallback иконку - ИСПРАВЛЕННАЯ СТРОКА
      if (e.target.nextSibling) {
        e.target.nextSibling.style.display = 'flex';
      }
    }}
  />
) : (
  <div className="text-4xl flex items-center justify-center w-full h-full">🖼️</div>
)}
                {/* Fallback иконка */}
                {!imageUrl && (
                  <div className="text-4xl flex items-center justify-center w-full h-full text-gray-400">
                    💬
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Нижняя зона с подсказкой */}
      <div 
        className="pt-28 pb-12 min-h-[52vh] flex flex-col items-center justify-start"
        style={{ backgroundColor: '#e5e7eb' }}
      >
        {/* Подсказка */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`hint-${currentIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center mb-12 px-4"
          >
            <div className="text-lg text-gray-600 mb-2">Подсказка</div>
            <div className="text-xl font-semibold text-gray-800 bg-white/60 px-6 py-4 rounded-lg max-w-2xl leading-relaxed">
              {hintText}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Кнопка следующей фразы */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goNext}
          disabled={isAnimating}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-12 py-4 rounded-xl font-medium text-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
        >
          {currentIndex < sentences.length - 1 ? 'Следующая фраза →' : 'Завершить модуль'}
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
              {hintLanguage === 'русский' ? 'RU' : hintLanguage === 'english' ? 'EN' : 'TR'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}