'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeDisplayText } from '@/utils/normalize';

const API_BASE_URL = 'https://learn-lng-server.onrender.com/api';

export default function QuestionLearningComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const moduleId = searchParams?.get('module');
  const studiedLanguage = searchParams?.get('studied') || 'русский';
  const hintLanguage = searchParams?.get('hint') || 'английский';
  const lessonId = searchParams?.get('lesson');

  const [module, setModule] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentView, setCurrentView] = useState('question'); // 'question' или 'answer'
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

  // Загружаем модуль и вопросы
  useEffect(() => {
    const loadModuleAndQuestions = async () => {
      if (!moduleId) {
        setError('ID модуля не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setCurrentView('question'); // Сбрасываем на вид вопроса
        
        console.log('Loading question module:', moduleId);
        
        // Загружаем данные модуля
        const moduleResponse = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}`);
        if (!moduleResponse.ok) {
          throw new Error('Модуль вопросов не найден');
        }
        
        const moduleData = await moduleResponse.json();
        console.log('Loaded question module:', moduleData);
        setModule(moduleData);

        // Загружаем вопросы модуля
        const questionsResponse = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/questions`);
        if (!questionsResponse.ok) {
          throw new Error('Не удалось загрузить вопросы');
        }
        
        const questionsData = await questionsResponse.json();
        console.log('Loaded questions:', questionsData);
        
        if (!questionsData || questionsData.length === 0) {
          setError('В этом модуле пока нет вопросов');
          return;
        }

        setQuestions(questionsData);
        setCurrentIndex(0);
        
      } catch (err) {
        console.error('Error loading question module:', err);
        setError('Ошибка загрузки модуля вопросов: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadModuleAndQuestions();
  }, [moduleId]);

  // Получаем текущий вопрос
  const currentQuestion = questions[currentIndex];
  const requiresPairAnswer = currentQuestion?.requiresPairAnswer !== false;

  // Функции для получения текста вопроса и ответа
const getQuestionText = () => {
  if (!currentQuestion || !currentQuestion.questionStructure) return '—';
  
  const questionText = currentQuestion.questionStructure
    .map(item => item.word || '')
    .filter(word => word.trim() !== '')
    .join(' ');
  
  return normalizeDisplayText(questionText, true);
};

  const getQuestionTranslation = () => {
    // Если есть исправленный перевод вопроса - используем его
    if (currentQuestion?.englishQuestion) {
      return currentQuestion.englishQuestion;
    }
    
    // Если есть автоматический перевод вопроса - используем его
    if (currentQuestion?.autoEnglishQuestion) {
      return currentQuestion.autoEnglishQuestion;
    }
    
    // Иначе генерируем на лету
    if (currentQuestion?.questionStructure) {
      const translatedQuestion = currentQuestion.questionStructure
        .map(item => {
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
      
      return translatedQuestion || '—';
    }
    
    return '—';
  };

  const getAnswerText = () => {
  if (!currentQuestion || !currentQuestion.answerStructure) return '—';
  
  const answerText = currentQuestion.answerStructure
    .map(item => item.word || '')
    .filter(word => word.trim() !== '')
    .join(' ');
  
  return normalizeDisplayText(answerText, false);
};
  const getAnswerTranslation = () => {
    // Если есть исправленный перевод ответа - используем его
    if (currentQuestion?.englishAnswer) {
      return currentQuestion.englishAnswer;
    }
    
    // Если есть автоматический перевод ответа - используем его
    if (currentQuestion?.autoEnglishAnswer) {
      return currentQuestion.autoEnglishAnswer;
    }
    
    // Иначе генерируем на лету
    if (currentQuestion?.answerStructure) {
      const translatedAnswer = currentQuestion.answerStructure
        .map(item => {
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
      
      return translatedAnswer || '—';
    }
    
    return '—';
  };

  const questionText = getQuestionText();
  const questionTranslation = getQuestionTranslation();
  const answerText = getAnswerText();
  const answerTranslation = getAnswerTranslation();

  // Получаем картинку для текущего вида
  const getCurrentImage = () => {
    if (currentView === 'question') {
      return currentQuestion?.questionImage;
    } else {
      return currentQuestion?.answerImage || currentQuestion?.questionImage;
    }
  };

  const currentImage = getCurrentImage();

  const goNext = () => {
    if (isAnimating || !questions.length) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      if (currentView === 'question' && requiresPairAnswer) {
        // Переходим к ответу
        setCurrentView('answer');
      } else {
        // Переходим к следующему вопросу
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setCurrentView('question');
        } else {
          // Завершаем модуль
          router.push('/');
        }
      }
      setIsAnimating(false);
    }, 300);
  };

  const goPrev = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      if (currentView === 'answer' && requiresPairAnswer) {
        // Возвращаемся к вопросу
        setCurrentView('question');
      } else if (currentIndex > 0) {
        // Возвращаемся к предыдущему вопросу
        setCurrentIndex(prev => prev - 1);
        setCurrentView('question');
      }
      setIsAnimating(false);
    }, 300);
  };

  // Анимации
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Загрузка вопросов...</div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500 text-lg text-center">
          {error || 'Модуль вопросов не найден'}
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

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg text-center">
          В этом модуле пока нет вопросов
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
        backgroundColor: '#f0f0f0',
        color: '#000000' 
      }}
    >
      {/* Верхняя зона с изучаемым языком */}
      <div className="h-[40vh] bg-gradient-to-b from-purple-300 to-purple-200 flex items-start justify-center relative overflow-visible">
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
              <span className="flex items-center justify-center w-full h-full bg-purple-600 text-white text-xs font-bold">
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
          {currentIndex + 1} / {questions.length}
        </div>

        {/* Текст на изучаемом языке */}
        <div className="mt-12 flex flex-col items-center px-4">
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${currentView}-${currentIndex}-studied`}
              initial="hidden"
              animate="visible" 
              exit="hidden" 
              variants={slideVariants} 
              className="text-center"
            >
              <div className="text-lg text-purple-700 mb-2 font-medium">
                {currentView === 'question' ? 'Вопрос' : 'Ответ'}
              </div>
              <motion.div 
                initial={{ scale: 0.98 }} 
                animate={{ scale: 1 }} 
                transition={{ duration: 0.35 }}
                className="text-2xl font-bold tracking-wide px-6 py-4 rounded-lg bg-white/20 backdrop-blur-sm max-w-2xl leading-relaxed"
                style={{ color: '#000000' }}
              >
                {currentView === 'question' ? questionText : answerText}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Картинка */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-[28vh]">
          <div style={{ width: 160, height: 160 }} className="pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div 
                key={`image-${currentView}-${currentIndex}`}
                initial="initial"
                animate="enter"
                exit="exit"
                variants={imageVariants}
                className="w-full h-full flex items-center justify-center bg-white/90 rounded-2xl shadow-lg p-4"
              >
                {currentImage ? (
                  <img 
                    src={currentImage} 
                    alt={currentView === 'question' ? questionText : answerText}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('Image load error:', currentImage);
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : (
                  <div className="text-4xl flex items-center justify-center w-full h-full text-gray-400">
                    {currentView === 'question' ? '❓' : '💡'}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Нижняя зона с языком подсказки */}
      <div 
        className="pt-24 pb-12 min-h-[60vh] flex flex-col items-center justify-start"
        style={{ backgroundColor: '#e5e7eb' }}
      >
        {/* Текст на языке подсказки */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentView}-${currentIndex}-hint`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center mb-8 px-4"
          >
            <div className="text-lg text-gray-600 mb-2">
              {currentView === 'question' ? 'Перевод вопроса' : 'Перевод ответа'}
            </div>
            <div className="text-xl font-semibold text-gray-800 bg-white/60 px-6 py-4 rounded-lg max-w-2xl leading-relaxed">
              {currentView === 'question' ? questionTranslation : answerTranslation}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Кнопки управления */}
        <div className="flex flex-col items-center space-y-4">
          {/* Основная кнопка перехода */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goNext}
            disabled={isAnimating}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-4 rounded-xl font-medium text-lg shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            {currentView === 'question' && requiresPairAnswer ? (
              'Посмотреть ответ →'
            ) : currentIndex < questions.length - 1 ? (
              'Следующий вопрос →'
            ) : (
              'Завершить модуль'
            )}
          </motion.button>
        </div>

        {/* Навигация */}
        <div className="flex space-x-4 mt-6">
          <button
            onClick={goPrev}
            disabled={(currentView === 'question' && currentIndex === 0) || isAnimating}
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