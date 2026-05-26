// app/test/page.js - АДАПТИВНАЯ ВЕРСИЯ (2 или 4 карточки)
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'https://learn-lng-new-client-lrqy.onrender.com/api';

export default function TestComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const testId = searchParams?.get('test');
  const studiedLanguage = (searchParams?.get('studied') || 'russian').toLowerCase();
  const hintLanguage = (searchParams?.get('hint') || 'english').toLowerCase();

  const [test, setTest] = useState(null);
  const [allWords, setAllWords] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [incorrectWords, setIncorrectWords] = useState([]);
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flags, setFlags] = useState([]);

  // Модалка для изучения слова после ошибки
  const [showStudyModal, setShowStudyModal] = useState(false);

  // Загрузка флагов
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/flags`);
        if (res.ok) {
          const data = await res.json();
          setFlags(data);
        }
      } catch (e) {
        console.warn('Ошибка загрузки флагов:', e);
      }
    })();
  }, []);

  // Загрузка теста и слов
  useEffect(() => {
    const loadTest = async () => {
      if (!testId) {
        setError('ID теста не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Загрузка теста с ID:', testId);
        
        const testRes = await fetch(`${API_BASE_URL}/tests/${testId}`);
        if (!testRes.ok) throw new Error('Тест не найден');
        
        const testData = await testRes.json();
        console.log('Данные теста:', testData);
        setTest(testData);

        // Используем слова из теста
        const words = testData.words || [];
        console.log('Слова в тесте:', words);

        if (words.length < 2) {
          throw new Error('В тесте должно быть минимум 2 слова');
        }

        // Нормализуем слова
        const normalizedWords = words.map((word, index) => ({
          id: word._id || word.id || word.imageBase || `word_${index}`,
          translations: word.translations || {},
          imagePng: word.imagePng || '',
          imageBase: word.imageBase || '',
        }));

        setAllWords(normalizedWords);

        // Создаем вопросы - каждый вопрос это одно слово из теста
        const testQuestions = normalizedWords.map((word, index) => ({
          id: `question_${index}`,
          correctWord: word,
          questionNumber: index + 1,
        }));

        console.log('Созданные вопросы:', testQuestions);
        setQuestions(testQuestions);
        setCurrentQuestionIndex(0);
        setScore(0);
        setIncorrectWords([]);

      } catch (err) {
        console.error('Ошибка загрузки теста:', err);
        setError(err.message || 'Ошибка загрузки теста');
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId]);

  // Текущий вопрос
  const currentQuestion = questions[currentQuestionIndex];
  const currentWord = currentQuestion?.correctWord;

  // Определяем количество карточек в зависимости от количества слов
  const getCardsPerQuestion = () => {
    if (allWords.length <= 3) return 2; // 2 карточки для 2-3 слов
    return 4; // 4 карточки для 4+ слов
  };

  const cardsPerQuestion = getCardsPerQuestion();

  // Создаем варианты ответов для текущего вопроса
  const answerOptions = useMemo(() => {
    if (!currentWord || allWords.length < 2) return [];

    const correctWord = currentWord;
    
    // Получаем другие слова, исключая правильное
    const otherWords = allWords.filter(word => word.id !== correctWord.id);
    
    let selectedOthers = [];
    
    if (cardsPerQuestion === 2) {
      // Для 2 карточек: правильный ответ + 1 случайный неправильный
      if (otherWords.length > 0) {
        const randomOther = otherWords[Math.floor(Math.random() * otherWords.length)];
        selectedOthers = [randomOther];
      } else {
        // Если нет других слов, создаем фиктивный вариант
        selectedOthers = [{
          id: 'dummy_option',
          translations: { [hintLanguage]: '?' },
          imagePng: '',
          imageBase: 'dummy'
        }];
      }
    } else {
      // Для 4 карточек: правильный ответ + 3 случайных неправильных
      if (otherWords.length >= 3) {
        // Достаточно слов - берем 3 случайных
        selectedOthers = [...otherWords]
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
      } else {
        // Недостаточно слов - дублируем существующие
        selectedOthers = [...otherWords];
        while (selectedOthers.length < 3) {
          const randomIndex = Math.floor(Math.random() * otherWords.length);
          const duplicatedWord = {
            ...otherWords[randomIndex],
            id: `${otherWords[randomIndex].id}_dup_${selectedOthers.length}`
          };
          selectedOthers.push(duplicatedWord);
        }
      }
    }
    
    // Собираем все варианты и перемешиваем
    const allOptions = [correctWord, ...selectedOthers];
    return allOptions.sort(() => Math.random() - 0.5);
  }, [currentWord, allWords, hintLanguage, cardsPerQuestion]);

  // Определяем классы для сетки в зависимости от количества карточек
  const getGridClasses = () => {
    if (cardsPerQuestion === 2) {
      return "grid-cols-2 gap-6 max-w-2xl"; // 2 карточки в ряд
    } else {
      return "grid-cols-2 gap-4 max-w-4xl"; // 4 карточки (2x2)
    }
  };

  // Определяем размеры карточек в зависимости от количества
  const getCardSizeClasses = () => {
    if (cardsPerQuestion === 2) {
      return "min-h-[160px] p-6"; // Большие карточки для 2
    } else {
      return "min-h-[140px] p-4"; // Меньшие карточки для 4
    }
  };

  // Функции для получения текста
  const getStudiedText = (word) => {
    if (!word || !word.translations) return '—';
    const t = word.translations;
    
    // Пробуем разные варианты ключей
    const studiedKey = studiedLanguage.toLowerCase();
    const studiedKeyAlt = studiedLanguage.charAt(0).toUpperCase() + studiedLanguage.slice(1);
    
    return t[studiedKey] || 
           t[studiedKeyAlt] || 
           Object.values(t)[0] || 
           '—';
  };

  const getHintText = (word) => {
    if (!word || !word.translations) return '—';
    const t = word.translations;
    
    // Пробуем разные варианты ключей
    const hintKey = hintLanguage.toLowerCase();
    const hintKeyAlt = hintLanguage.charAt(0).toUpperCase() + hintLanguage.slice(1);
    
    return t[hintKey] || 
           t[hintKeyAlt] || 
           Object.values(t)[1] || 
           Object.values(t)[0] || 
           '—';
  };

  // Обработка выбора ответа
  const handleAnswerSelect = (selectedWord) => {
    if (showResult) return;

    setSelectedAnswer(selectedWord);
    const correct = selectedWord.id === currentWord.id;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore(prev => prev + 1);
    } else {
      // Добавляем слово в список для повторения
      setIncorrectWords(prev => [...prev, currentWord]);
    }
  };

  // Переход к следующему вопросу
  const goToNextQuestion = () => {
    setShowResult(false);
    setSelectedAnswer(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Тест завершен
      setShowFinalResults(true);
    }
  };

  // Повторение неправильных ответов
  const retryIncorrectWords = () => {
    if (incorrectWords.length === 0) return;
    
    const retryQuestions = incorrectWords.map((word, index) => ({
      id: `retry_${index}`,
      correctWord: word,
      questionNumber: index + 1,
    }));

    setQuestions(retryQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIncorrectWords([]);
    setShowFinalResults(false);
  };

  // Завершение теста
  const finishTest = () => {
    router.push('/');
  };

  // Сохранение результатов
  useEffect(() => {
    if (showFinalResults) {
      (async () => {
        try {
          await fetch(`${API_BASE_URL}/test-results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              testId,
              score,
              totalQuestions: questions.length,
              incorrectWords: incorrectWords.map(w => w.imageBase || w.id)
            })
          });
        } catch (e) {
          console.warn('Ошибка сохранения результатов:', e);
        }
      })();
    }
  }, [showFinalResults, testId, score, questions.length, incorrectWords]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Загрузка теста...</div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500 text-lg text-center">
          {error || 'Тест не найден'}
          <div className="mt-4">
            <button 
              onClick={() => router.push('/')} 
              className="text-blue-500 hover:underline"
            >
              ← Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showFinalResults) {
    const totalQuestions = questions.length;
    const correctAnswers = score;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const hasIncorrectWords = incorrectWords.length > 0;

    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6" 
        style={{ 
          backgroundColor: test.bgColor || '#f0f0f0', 
          color: test.fontColor || '#000' 
        }}
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-3xl font-bold mb-6">Результаты теста</h2>
          
          <div 
            className="text-6xl font-bold mb-4" 
            style={{ color: percentage >= 70 ? '#10B981' : '#EF4444' }}
          >
            {percentage}%
          </div>
          
          <div className="text-gray-600 mb-6 text-lg">
            {correctAnswers} из {totalQuestions} правильных ответов
          </div>

          {percentage === 100 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-green-800 font-semibold">🎉 Отлично! Все ответы правильные!</div>
            </div>
          ) : hasIncorrectWords ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="text-yellow-800 font-semibold">
                Нужно повторить: {incorrectWords.length} слов
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            {hasIncorrectWords && (
              <button 
                onClick={retryIncorrectWords}
                className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
              >
                Повторить ошибки ({incorrectWords.length})
              </button>
            )}
            
            <button 
              onClick={finishTest}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Завершить тест
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion || !currentWord) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Ошибка: вопрос не найден</div>
      </div>
    );
  }

  const studiedText = getStudiedText(currentWord);
  const hintText = getHintText(currentWord);

  return (
    <div 
      className="min-h-screen relative select-none" 
      style={{ 
        backgroundColor: test.bgColor || '#f0f0f0', 
        color: test.fontColor || '#000' 
      }}
    >
      {/* Верхняя часть - изучаемое слово */}
      <div className="h-[40vh] bg-gradient-to-b from-purple-300 to-purple-200 flex flex-col items-center justify-center relative">
        {/* Флаг изучаемого языка */}
        <div className="absolute top-4 left-4">
          <div className="w-8 h-6 rounded shadow-lg flex items-center justify-center overflow-hidden border bg-white">
            {flags.find(f => f.language.toLowerCase() === studiedLanguage)?.image ? (
              flags.find(f => f.language.toLowerCase() === studiedLanguage).image.startsWith('http') ? (
                <img 
                  src={flags.find(f => f.language.toLowerCase() === studiedLanguage).image} 
                  alt={studiedLanguage}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg">
                  {flags.find(f => f.language.toLowerCase() === studiedLanguage).image}
                </span>
              )
            ) : (
              <span className="text-xs font-bold">
                {studiedLanguage === 'russian' ? 'RU' : studiedLanguage === 'english' ? 'EN' : 'TR'}
              </span>
            )}
          </div>
        </div>

        {/* Кнопка закрытия */}
        <button 
          onClick={() => router.push('/')}
          className="absolute top-4 right-4 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
        >
          ×
        </button>

        {/* Прогресс */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-sm text-gray-700 font-medium">
          {currentQuestionIndex + 1} / {questions.length}
        </div>

        {/* Информация о количестве карточек (для отладки) */}
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
          {cardsPerQuestion} карточки
        </div>

        {/* Изучаемое слово */}
        <div className="text-center mt-8">
          <div className="text-lg text-gray-600 mb-2">Выберите правильный перевод для:</div>
          <motion.div
            key={currentWord.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-bold bg-white/60 px-8 py-6 rounded-2xl shadow-md"
          >
            {studiedText}
          </motion.div>
        </div>
      </div>

      {/* Нижняя часть - варианты ответов */}
      <div className="h-[60vh] flex flex-col items-center justify-start pt-8 px-4">
        {/* Адаптивная сетка карточек */}
        <div className={`grid w-full ${getGridClasses()} mb-8`}>
          {answerOptions.map((word, index) => {
            const isSelected = selectedAnswer?.id === word.id;
            const isCorrectAnswer = word.id === currentWord.id;
            const showAsCorrect = showResult && isCorrectAnswer;
            const showAsIncorrect = showResult && isSelected && !isCorrectAnswer;

            return (
              <motion.button
                key={`${word.id}_${currentQuestionIndex}_${index}`}
                onClick={() => handleAnswerSelect(word)}
                disabled={showResult}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={!showResult ? { scale: 1.02 } : {}}
                whileTap={!showResult ? { scale: 0.98 } : {}}
                className={`
                  relative rounded-2xl shadow-lg flex flex-col items-center justify-center
                  border-2 transition-all duration-200
                  ${getCardSizeClasses()}
                  ${showAsCorrect ? 'bg-green-100 border-green-500' : 
                    showAsIncorrect ? 'bg-red-100 border-red-500' :
                    isSelected ? 'bg-blue-100 border-blue-500' :
                    'bg-white border-gray-200 hover:border-purple-300'}
                `}
              >
                {/* Изображение */}
                {word.imagePng ? (
                  <img 
                    src={word.imagePng} 
                    alt={getStudiedText(word)}
                    className={`object-contain mb-3 ${
                      cardsPerQuestion === 2 ? 'w-20 h-20' : 'w-16 h-16'
                    }`}
                  />
                ) : (
                  <div className={`
                    flex items-center justify-center bg-gray-100 rounded-lg mb-3
                    ${cardsPerQuestion === 2 ? 'w-20 h-20 text-3xl' : 'w-16 h-16 text-2xl'}
                  `}>
                    🖼️
                  </div>
                )}

                {/* Текст перевода */}
                <div className={`font-semibold text-center ${
                  cardsPerQuestion === 2 ? 'text-xl' : 'text-lg'
                }`}>
                  {getHintText(word)}
                </div>

                {/* Индикаторы правильности */}
                {showAsCorrect && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                )}
                {showAsIncorrect && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    ✕
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Результат и кнопка продолжения */}
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center w-full max-w-2xl"
          >
            <div className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? '✅ Правильно!' : '❌ Неправильно'}
            </div>

            {!isCorrect && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="text-yellow-800 font-semibold mb-2">
                  Правильный ответ: {getHintText(currentWord)}
                </div>
                <button
                  onClick={() => setShowStudyModal(true)}
                  className="text-yellow-700 hover:text-yellow-900 underline text-sm"
                >
                  Повторить это слово
                </button>
              </div>
            )}

            <button
              onClick={goToNextQuestion}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Следующий вопрос →' : 'Завершить тест'}
            </button>
          </motion.div>
        )}
      </div>

      {/* Модалка для изучения слова после ошибки */}
      <AnimatePresence>
        {showStudyModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-96 mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-center">Повторите слово</h3>
              
              <div className="flex flex-col items-center gap-4 mb-6">
                {currentWord.imagePng ? (
                  <img 
                    src={currentWord.imagePng} 
                    alt={getStudiedText(currentWord)}
                    className="w-32 h-32 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-lg text-4xl">
                    🖼️
                  </div>
                )}
                
                <div className="text-3xl font-bold text-center">
                  {getStudiedText(currentWord)}
                </div>
                
                <div className="text-gray-600 text-lg text-center">
                  {getHintText(currentWord)}
                </div>
              </div>

              <button
                onClick={() => {
                  setShowStudyModal(false);
                  goToNextQuestion();
                }}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Понял — продолжить
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Флаг языка подсказки */}
      <div className="absolute bottom-4 right-4">
        <div className="w-8 h-6 rounded shadow-lg flex items-center justify-center overflow-hidden border bg-white">
          {flags.find(f => f.language.toLowerCase() === hintLanguage)?.image ? (
            flags.find(f => f.language.toLowerCase() === hintLanguage).image.startsWith('http') ? (
              <img 
                src={flags.find(f => f.language.toLowerCase() === hintLanguage).image} 
                alt={hintLanguage}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg">
                {flags.find(f => f.language.toLowerCase() === hintLanguage).image}
              </span>
            )
          ) : (
            <span className="text-xs font-bold">
              {hintLanguage === 'russian' ? 'RU' : hintLanguage === 'english' ? 'EN' : 'TR'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}