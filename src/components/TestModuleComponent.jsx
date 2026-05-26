// app/test-module/page.jsx - ОБНОВЛЕННАЯ ВЕРСИЯ С ПЕРЕВОДОМ
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_BASE_URL = 'https://learn-lng-new-client-lrqy.onrender.com/api';

export default function TestModulePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const moduleId = searchParams?.get('module');
  const lessonId = searchParams?.get('lesson');
  const nextModuleId = searchParams?.get('next');
  const studiedLanguage = searchParams?.get('studied') || 'русский';
  const hintLanguage = searchParams?.get('hint') || 'английский';
  
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false); // Показывать ли перевод

  useEffect(() => {
    if (!moduleId) {
      router.push('/');
      return;
    }

    const loadQuestions = async () => {
      try {
        console.log('Loading test questions for module:', moduleId);
        const response = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/test-questions`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Loaded questions:', data.length);
        setQuestions(data);
        
        if (data.length === 0) {
          setError('В этом тесте пока нет вопросов');
        }
      } catch (error) {
        console.error('Error loading test questions:', error);
        setError('Ошибка загрузки вопросов теста');
      } finally {
        setLoading(false);
      }
    };
    
    loadQuestions();
  }, [moduleId, router]);

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
    setShowTranslation(false); // Скрываем перевод при выборе нового ответа
  };

  const handleNextQuestion = () => {
    setShowTranslation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSubmit = () => {
    // Подсчитываем правильные ответы
    let correct = 0;
    const incorrectWords = [];
    
    questions.forEach((q, idx) => {
      const selectedOptionIdx = selectedAnswers[idx];
      const isCorrect = selectedOptionIdx !== undefined && q.options[selectedOptionIdx]?.isCorrect;
      if (isCorrect) {
        correct++;
      } else {
        const questionText = q.questionText || q.questionStructure[0]?.word || 'Вопрос';
        incorrectWords.push(questionText);
      }
    });
    
    setScore(correct);
    setShowResult(true);
    
    // Сохраняем результат (опционально)
    try {
      fetch(`${API_BASE_URL}/module-test/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          score: correct,
          totalQuestions: questions.length,
          incorrectWords
        })
      });
    } catch (error) {
      console.error('Error saving results:', error);
    }
  };

  const handleComplete = () => {
    if (nextModuleId) {
      router.push(`/module-flow?module=${nextModuleId}&lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`);
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Загрузка вопросов теста...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p>{error}</p>
          <button
            onClick={handleComplete}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Вернуться
          </button>
        </div>
      </div>
    );
  }

  if (showResult && score !== null) {
    const percentage = Math.round(score / questions.length * 100);
    let message = '';
    if (percentage === 100) message = 'Отлично! 🎉';
    else if (percentage >= 80) message = 'Хорошо! 👍';
    else if (percentage >= 60) message = 'Неплохо! 📚';
    else message = 'Попробуйте ещё раз! 💪';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Результат теста</h2>
            <div className="text-6xl font-bold text-blue-600 mb-4">
              {score} / {questions.length}
            </div>
            <div className="text-xl mb-2">{percentage}%</div>
            <div className="text-lg text-gray-600 mb-6">{message}</div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-8">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            <button
              onClick={handleComplete}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {nextModuleId ? 'Следующий модуль →' : 'Завершить'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <p>Нет вопросов в этом тесте</p>
          <button
            onClick={handleComplete}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Продолжить
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalOptions = currentQuestion.gridRows * currentQuestion.gridCols;
  const displayOptions = [...currentQuestion.options];
  
  while (displayOptions.length < totalOptions) {
    displayOptions.push({ text: '', isCorrect: false });
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const selectedAnswer = selectedAnswers[currentIndex];
  const isAnswerCorrect = selectedAnswer !== undefined && currentQuestion.options[selectedAnswer]?.isCorrect;
  const hasAnswered = selectedAnswer !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Прогресс */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Вопрос {currentIndex + 1} из {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Вопрос */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {currentQuestion.questionImage && (
            <div className="flex justify-center mb-6">
              <img 
                src={currentQuestion.questionImage} 
                alt="Вопрос" 
                className="max-h-64 rounded-lg object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
          <h2 className="text-2xl font-semibold text-center mb-3">
            {currentQuestion.questionText || 
             (currentQuestion.questionStructure[0]?.word ? 
               currentQuestion.questionStructure.map(s => s.word).join(' ') : 
               'Вопрос')}
          </h2>
          
          {/* ПОКАЗЫВАЕМ ПЕРЕВОД ПОСЛЕ ОТВЕТА */}
          {hasAnswered && currentQuestion.translation && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
              <p className="text-sm text-gray-500 mb-1">
                Перевод на {hintLanguage.toUpperCase()}:
              </p>
              <p className="text-blue-800 font-medium">
                {currentQuestion.translation}
              </p>
            </div>
          )}
          
          {currentQuestion.hint && (
            <details className="mt-4 text-center">
              <summary className="text-sm text-gray-400 cursor-pointer">Подсказка</summary>
              <p className="text-sm text-gray-500 mt-2">{currentQuestion.hint}</p>
            </details>
          )}
        </div>

        {/* Сетка ответов */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-lg font-medium mb-4">Выберите ответ:</h3>
          
          <div 
            className="grid gap-4"
            style={{ 
              gridTemplateColumns: `repeat(${Math.min(currentQuestion.gridCols, 3)}, minmax(0, 1fr))`
            }}
          >
            {displayOptions.map((option, idx) => {
              const isDisabled = !option.text && (!option.structure || option.structure.length === 0);
              const isSelected = selectedAnswer === idx;
              
              let answerText = option.text;
              if (!answerText && option.structure && option.structure.length > 0) {
                answerText = option.structure.map(s => s.word).join(' ');
              }
              if (!answerText) {
                answerText = `Вариант ${idx + 1}`;
              }
              
              // Определяем стиль в зависимости от того, правильный ли ответ (после ответа)
              let buttonStyle = '';
              if (hasAnswered) {
                if (option.isCorrect) {
                  buttonStyle = 'bg-green-500 text-white border-green-600 shadow-md';
                } else if (isSelected && !option.isCorrect) {
                  buttonStyle = 'bg-red-500 text-white border-red-600 shadow-md';
                } else {
                  buttonStyle = 'bg-gray-100 border-gray-200 opacity-60';
                }
              } else {
                buttonStyle = isSelected
                  ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                  : 'bg-gray-50 border-gray-200 hover:border-blue-400 hover:shadow-sm';
              }
              
              return (
                <button
                  key={idx}
                  onClick={() => !hasAnswered && !isDisabled && handleAnswerSelect(currentIndex, idx)}
                  disabled={hasAnswered || isDisabled}
                  className={`
                    p-4 rounded-xl border-2 transition-all text-center
                    ${buttonStyle}
                    ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className="font-medium">{answerText}</span>
                  {/* Показываем индикатор правильности после ответа */}
                  {hasAnswered && option.isCorrect && (
                    <span className="ml-2">✓</span>
                  )}
                  {hasAnswered && isSelected && !option.isCorrect && (
                    <span className="ml-2">✗</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Навигация */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => {
                setCurrentIndex(prev => prev - 1);
                setShowTranslation(false);
              }}
              disabled={currentIndex === 0}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            >
              ← Назад
            </button>
            
            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(selectedAnswers).length !== questions.length}
                className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
              >
                Завершить тест ✓
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                disabled={selectedAnswer === undefined}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Далее →
              </button>
            )}
          </div>
          
          {/* Индикатор отвеченных вопросов */}
          <div className="mt-6 pt-4 border-t flex justify-center gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setShowTranslation(false);
                }}
                className={`
                  w-8 h-8 rounded-full text-sm font-medium transition-all
                  ${selectedAnswers[idx] !== undefined 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                  ${currentIndex === idx ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
                `}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}