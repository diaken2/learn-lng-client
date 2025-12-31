'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_BASE_URL = 'https://learn-lng-server-zeta.vercel.app/api';

export default function ModuleTestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
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
      // Подготовим перемешанные варианты для всех вопросов заранее
      const allOptions = testData.words.map((word, questionIndex) => {
        return prepareQuestionOptions(word, questionIndex);
      });
      
      setShuffledOptions(allOptions.map(opt => opt.options));
      setCorrectAnswerIndex(allOptions.map(opt => opt.correctIndex));
    }
  }, [testData]);

  const loadTestData = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/module-test/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTestData(data);
        
        // Инициализируем массив ответов
        setUserAnswers(new Array(data.words.length).fill(null));
        
        console.log('Loaded test data:', data);
      } else {
        setError('Не удалось загрузить тест');
      }
    } catch (error) {
      console.error('Error loading test:', error);
      setError('Ошибка загрузки теста');
    } finally {
      setLoading(false);
    }
  };

  // Функция для подготовки вариантов ответа для одного вопроса
  const prepareQuestionOptions = (currentWord, questionIndex) => {
    if (!testData) return { options: [], correctIndex: -1 };
    
    const studiedLang = testData.studiedLanguage;
    const hintLang = testData.hintLanguage;
    
    // Правильный ответ на изучаемом языке
    const correctAnswer = currentWord.displayWord || 
                         currentWord.translations[studiedLang] ||
                         currentWord.word ||
                         'Неизвестно';
    
    // Собираем другие слова для неправильных вариантов
    const otherWords = [];
    testData.words.forEach((word, idx) => {
      if (idx !== questionIndex) {
        const otherWord = word.displayWord || 
                         word.translations[studiedLang] ||
                         word.word ||
                         'Неизвестно';
        if (otherWord && otherWord !== correctAnswer && otherWords.length < 3) {
          otherWords.push(otherWord);
        }
      }
    });
    
    // Если недостаточно слов, добавляем пустые варианты
    while (otherWords.length < 3) {
      otherWords.push(`Вариант ${otherWords.length + 1}`);
    }
    
    // Создаем все варианты
    const allOptions = [correctAnswer, ...otherWords];
    
    // Перемешиваем и запоминаем индекс правильного ответа
    const shuffled = [...allOptions];
    const correctOriginalIndex = 0;
    
    // Перемешиваем массив
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Находим новый индекс правильного ответа после перемешивания
    const newCorrectIndex = shuffled.indexOf(correctAnswer);
    
    return {
      options: shuffled,
      correctIndex: newCorrectIndex
    };
  };

  const handleAnswer = (selectedIndex) => {
    if (!testData || currentQuestion >= testData.words.length) return;
    if (userAnswers[currentQuestion] !== null) return; // Уже ответили

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = selectedIndex;
    setUserAnswers(newAnswers);

    // Проверяем правильность ответа
    const isCorrect = selectedIndex === correctAnswerIndex[currentQuestion];
    console.log('Answer check:', {
      selected: selectedIndex,
      correct: correctAnswerIndex[currentQuestion],
      options: shuffledOptions[currentQuestion],
      correctWord: shuffledOptions[currentQuestion][correctAnswerIndex[currentQuestion]],
      isCorrect
    });

    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Переход к следующему вопросу
    if (currentQuestion < testData.words.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
      }, 1000);
    } else {
      // Тест завершен
      setTimeout(() => {
        setIsFinished(true);
        saveResults();
      }, 1000);
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
          moduleId,
          userId: 'user123', // Замените на реальный ID пользователя
          score,
          totalQuestions: testData.words.length,
          incorrectWords
        })
      });
    } catch (error) {
      console.error('Error saving results:', error);
    }
  };

  const getCorrectAnswerForQuestion = (questionIndex) => {
    if (!shuffledOptions[questionIndex] || correctAnswerIndex[questionIndex] === undefined) {
      return 'Неизвестно';
    }
    return shuffledOptions[questionIndex][correctAnswerIndex[questionIndex]];
  };

  const getUserAnswerForQuestion = (questionIndex) => {
    const answerIndex = userAnswers[questionIndex];
    if (answerIndex === null || !shuffledOptions[questionIndex]) {
      return 'Не отвечено';
    }
    return shuffledOptions[questionIndex][answerIndex];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка теста...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Тест не найден</div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen p-8" style={{ 
        backgroundColor: testData.bgColor || '#f0f0f0',
        color: testData.fontColor || '#000000'
      }}>
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Тест завершен!
          </h1>
          
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-blue-600 mb-4">
              {score}/{testData.words.length}
            </div>
            <div className="text-2xl">
              {score === testData.words.length ? 'Отлично! 🎉' : 
               score >= testData.words.length * 0.7 ? 'Хорошо! 👍' : 
               'Попробуйте ещё раз! 💪'}
            </div>
            <div className="mt-4 text-lg">
              Процент правильных ответов: {Math.round((score / testData.words.length) * 100)}%
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Детальные результаты:</h2>
            {testData.words.map((word, index) => {
              const isCorrect = userAnswers[index] === correctAnswerIndex[index];
              const userAnswer = getUserAnswerForQuestion(index);
              const correctAnswer = getCorrectAnswerForQuestion(index);
              
              return (
                <div key={index} className={`p-4 mb-3 rounded-lg border ${
                  isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-lg mb-2">
                        <span className="text-gray-600">Вопрос {index + 1}: </span>
                        <span className="text-blue-600">
                          {word.translations[testData.hintLanguage] || 
                           word.translations.english || 
                           word.displayWord || 
                           '—'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Ваш ответ: </span>
                          <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700'}>
                            {userAnswer}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div>
                            <span className="text-gray-500">Правильный ответ: </span>
                            <span className="text-green-700 font-medium">{correctAnswer}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className={`ml-4 text-2xl ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {isCorrect ? '✓' : '✗'}
                    </div>
                  </div>
                  
                  {word.imagePng && (
                    <div className="mt-2 flex items-center">
                      <img
                        src={word.imagePng}
                        alt={correctAnswer}
                        className="h-12 w-12 object-cover rounded mr-2"
                      />
                      <span className="text-sm text-gray-500">Изображение слова</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              На главную
            </button>
            <button
              onClick={() => {
                // Полностью перезагружаем тест
                loadTestData(moduleId);
                setCurrentQuestion(0);
                setScore(0);
                setUserAnswers([]);
                setShuffledOptions([]);
                setCorrectAnswerIndex([]);
                setIsFinished(false);
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Пройти ещё раз
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Получаем текущий вопрос
  const currentWord = testData.words[currentQuestion];
  const currentOptions = shuffledOptions[currentQuestion] || [];
  const hasAnswered = userAnswers[currentQuestion] !== null;

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ 
      backgroundColor: testData.bgColor || '#f0f0f0',
      color: testData.fontColor || '#000000'
    }}>
      <div className="max-w-4xl mx-auto">
        {/* Хедер теста */}
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{testData.title}</h1>
              <div className="text-gray-600 mt-2">
                <div className="flex flex-wrap gap-4">
                  <span>Вопрос {currentQuestion + 1} из {testData.words.length}</span>
                  <span>• Счёт: {score}</span>
                  <span>• Осталось: {testData.words.length - currentQuestion - 1}</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {testData.studiedLanguage.toUpperCase()} → {testData.hintLanguage.toUpperCase()}
            </div>
          </div>
          
          {/* Прогресс бар */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / testData.words.length) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {Math.round(((currentQuestion + 1) / testData.words.length) * 100)}%
            </div>
          </div>
        </div>

        {/* Текущий вопрос */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <div className="text-center mb-8">
            <div className="text-3xl md:text-4xl font-bold mb-4">
              {currentWord.translations[testData.hintLanguage] || 
               currentWord.translations.english || 
               currentWord.displayWord || 
               '—'}
            </div>
            <div className="text-lg text-gray-600">
              Выберите правильный перевод на <span className="font-semibold">{testData.studiedLanguage}</span>
            </div>
            
            {/* Изображение слова (если есть) */}
            {currentWord.imagePng && (
              <div className="mt-6">
                <img
                  src={currentWord.imagePng}
                  alt="Изображение слова"
                  className="max-h-48 mx-auto rounded-lg shadow-md"
                />
                <div className="text-sm text-gray-500 mt-2">Подсказка: изображение слова</div>
              </div>
            )}
          </div>

          {/* Варианты ответов */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentOptions.map((option, index) => {
              const isSelected = userAnswers[currentQuestion] === index;
              const isCorrect = index === correctAnswerIndex[currentQuestion];
              const showResult = hasAnswered;
              
              let buttonClass = "p-4 md:p-6 text-lg font-medium rounded-xl transition-all ";
              
              if (showResult) {
                if (isCorrect) {
                  buttonClass += "bg-green-100 border-2 border-green-500 text-green-800 ";
                } else if (isSelected) {
                  buttonClass += "bg-red-100 border-2 border-red-500 text-red-800 ";
                } else {
                  buttonClass += "bg-gray-100 border-2 border-gray-300 text-gray-600 ";
                }
              } else {
                buttonClass += "bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-800 hover:border-blue-400 ";
              }
              
              if (hasAnswered) {
                buttonClass += "cursor-default ";
              } else {
                buttonClass += "hover:scale-[1.02] active:scale-[0.98] ";
              }
              
              return (
                <button
                  key={index}
                  onClick={() => !hasAnswered && handleAnswer(index)}
                  disabled={hasAnswered}
                  className={buttonClass}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-left">{option}</span>
                    {showResult && isCorrect && (
                      <span className="text-green-600 ml-2">✓</span>
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <span className="text-red-600 ml-2">✗</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Индикатор правильности ответа */}
          {hasAnswered && (
            <div className={`mt-6 p-4 rounded-lg text-center ${
              userAnswers[currentQuestion] === correctAnswerIndex[currentQuestion]
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              <div className="text-xl font-semibold">
                {userAnswers[currentQuestion] === correctAnswerIndex[currentQuestion]
                  ? 'Правильно! ✅'
                  : 'Неправильно! ❌'}
              </div>
              {userAnswers[currentQuestion] !== correctAnswerIndex[currentQuestion] && (
                <div className="mt-2">
                  Правильный ответ: <span className="font-bold">
                    {currentOptions[correctAnswerIndex[currentQuestion]]}
                  </span>
                </div>
              )}
              <div className="mt-4">
                {currentQuestion < testData.words.length - 1 ? (
                  <span className="text-sm">Следующий вопрос через 1 секунду...</span>
                ) : (
                  <span className="text-sm">Завершение теста...</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Навигация */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className={`px-4 py-2 rounded-lg ${
                currentQuestion === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              ← Назад
            </button>
            
            <div className="text-center">
              <div className="text-sm text-gray-500">Текущий прогресс</div>
              <div className="font-medium">
                {currentQuestion + 1} / {testData.words.length}
              </div>
            </div>
            
            <button
              onClick={() => {
                if (currentQuestion < testData.words.length - 1) {
                  setCurrentQuestion(prev => prev + 1);
                } else {
                  setIsFinished(true);
                  saveResults();
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {currentQuestion < testData.words.length - 1 ? 'Далее →' : 'Завершить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}