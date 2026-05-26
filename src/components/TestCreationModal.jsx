// components/TestCreationModal.jsx
import React, { useState } from 'react';
import {WordSelector} from '@/app/admin-page/page';

const TestCreationModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  moduleId, 
  lessonData,
  getThemesByDatabase 
}) => {
  const [testConfig, setTestConfig] = useState({
    rows: 3,
    columns: 2,
    answerOptions: [],
    questionText: '',
    questionImage: '',
    questionAudio: '',
    questionVideo: '',
    hint: ''
  });
  
  const [answerForm, setAnswerForm] = useState({
    database: 'nouns',
    theme: '',
    selectedWord: null,
    isCorrect: false
  });
  
  const [loading, setLoading] = useState(false);
  
  if (!isOpen) return null;
  
  const totalOptions = testConfig.rows * testConfig.columns;
  const filledCount = testConfig.answerOptions.filter(opt => opt.wordText).length;
  
  const addAnswerOption = () => {
    if (!answerForm.selectedWord) {
      alert('Сначала выберите слово');
      return;
    }
    
    if (filledCount >= totalOptions) {
      alert(`Максимум ${totalOptions} вариантов ответов (${testConfig.rows}×${testConfig.columns})`);
      return;
    }
    
    const newOption = {
      database: answerForm.database,
      theme: answerForm.theme,
      wordId: answerForm.selectedWord.imageBase || answerForm.selectedWord.id,
      wordText: answerForm.selectedWord.displayWord || answerForm.selectedWord.word || '',
      isCorrect: answerForm.isCorrect,
      translations: answerForm.selectedWord.translations || {},
      imagePng: answerForm.selectedWord.imagePng || '',
      order: testConfig.answerOptions.length
    };
    
    setTestConfig(prev => ({
      ...prev,
      answerOptions: [...prev.answerOptions, newOption]
    }));
    
    // Сброс формы
    setAnswerForm({
      database: 'nouns',
      theme: '',
      selectedWord: null,
      isCorrect: false
    });
  };
  
  const removeAnswerOption = (index) => {
    setTestConfig(prev => ({
      ...prev,
      answerOptions: prev.answerOptions.filter((_, i) => i !== index)
    }));
  };
  
  const toggleCorrect = (index) => {
    setTestConfig(prev => ({
      ...prev,
      answerOptions: prev.answerOptions.map((opt, i) => 
        i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt
      )
    }));
  };
  
  const handleSave = async () => {
    if (filledCount !== totalOptions) {
      alert(`Заполните все ${totalOptions} вариантов ответов (сейчас ${filledCount})`);
      return;
    }
    
    const hasCorrect = testConfig.answerOptions.some(opt => opt.isCorrect);
    if (!hasCorrect) {
      alert('Отметьте хотя бы один вариант ответа как правильный');
      return;
    }
    
    if (!testConfig.questionText.trim()) {
      alert('Введите текст вопроса');
      return;
    }
    
    setLoading(true);
    
    try {
      const testData = {
        moduleId: moduleId,
        config: {
          rows: testConfig.rows,
          columns: testConfig.columns,
          answerOptions: testConfig.answerOptions,
          questionText: testConfig.questionText,
          questionImage: testConfig.questionImage,
          questionAudio: testConfig.questionAudio,
          questionVideo: testConfig.questionVideo,
          hint: testConfig.hint
        },
        order: 0
      };
      
      await onSave(testData);
      
      // Сброс формы
      setTestConfig({
        rows: 3,
        columns: 2,
        answerOptions: [],
        questionText: '',
        questionImage: '',
        questionAudio: '',
        questionVideo: '',
        hint: ''
      });
      setAnswerForm({
        database: 'nouns',
        theme: '',
        selectedWord: null,
        isCorrect: false
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Ошибка сохранения теста: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-6 text-center">Создать тест</h3>
        
        <div className="grid grid-cols-2 gap-8">
          {/* Левая колонка - Настройки сетки */}
          <div className="space-y-6">
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-4">Настройки сетки ответов</h4>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Количество строк</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={testConfig.rows}
                    onChange={(e) => {
                      const newRows = parseInt(e.target.value) || 1;
                      const newTotal = newRows * testConfig.columns;
                      if (newTotal < testConfig.answerOptions.length) {
                        alert(`Новая сетка вмещает только ${newTotal} вариантов. Удалите лишние варианты.`);
                        return;
                      }
                      setTestConfig(prev => ({ ...prev, rows: newRows }));
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Количество столбцов</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={testConfig.columns}
                    onChange={(e) => {
                      const newCols = parseInt(e.target.value) || 1;
                      const newTotal = testConfig.rows * newCols;
                      if (newTotal < testConfig.answerOptions.length) {
                        alert(`Новая сетка вмещает только ${newTotal} вариантов. Удалите лишние варианты.`);
                        return;
                      }
                      setTestConfig(prev => ({ ...prev, columns: newCols }));
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                Всего вариантов ответов: <strong>{totalOptions}</strong>
                (заполнено: {filledCount})
              </div>
            </div>
            
            {/* Вопрос */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-4">Вопрос</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Текст вопроса</label>
                  <textarea
                    value={testConfig.questionText}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, questionText: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 h-24"
                    placeholder="Введите текст вопроса..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Картинка вопроса (URL)</label>
                  <input
                    type="text"
                    value={testConfig.questionImage}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, questionImage: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="https://..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Аудио вопроса (URL)</label>
                  <input
                    type="text"
                    value={testConfig.questionAudio}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, questionAudio: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="https://..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Подсказка</label>
                  <textarea
                    value={testConfig.hint}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, hint: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 h-20"
                    placeholder="Введите подсказку..."
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Правая колонка - Добавление вариантов ответов */}
          <div className="space-y-6">
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-4">Добавить вариант ответа</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">База данных</label>
                  <select
                    value={answerForm.database}
                    onChange={(e) => setAnswerForm(prev => ({ ...prev, database: e.target.value, theme: '' }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="nouns">Существительные</option>
                    <option value="adjectives">Прилагательные</option>
                    <option value="verbs">Глаголы</option>
                    <option value="pronouns">Местоимения</option>
                    <option value="numerals">Числительные</option>
                    <option value="adverbs">Наречия</option>
                    <option value="prepositions">Предлоги, частицы</option>
                    <option value="question-words">Вопросительные слова</option>
                    <option value="gerunds">Деепричастия</option>
                    <option value="participles">Причастия</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Тема (урок)</label>
                  <select
                    value={answerForm.theme}
                    onChange={(e) => setAnswerForm(prev => ({ ...prev, theme: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    disabled={!answerForm.database || ['prepositions', 'question-words', 'pronouns', 'numerals'].includes(answerForm.database)}
                  >
                    <option value="">-- Выберите тему --</option>
                    {answerForm.database && getThemesByDatabase(answerForm.database).map(theme => (
                      <option key={theme} value={theme}>{theme}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <WordSelector
                    studiedLanguage={lessonData?.studiedLanguage || 'русский'}
                    theme={answerForm.theme}
                    database={answerForm.database}
                    filters={{}}
                    onWordSelect={(selectedWord) => {
                      setAnswerForm(prev => ({ ...prev, selectedWord }));
                    }}
                    selectedWord={answerForm.selectedWord}
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={answerForm.isCorrect}
                      onChange={(e) => setAnswerForm(prev => ({ ...prev, isCorrect: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Правильный ответ</span>
                  </label>
                </div>
                
                <button
                  onClick={addAnswerOption}
                  disabled={!answerForm.selectedWord}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  + Добавить вариант ответа
                </button>
              </div>
            </div>
            
            {/* Список вариантов ответов */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-4">
                Варианты ответов ({filledCount}/{totalOptions})
              </h4>
              
              {testConfig.answerOptions.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Нет добавленных вариантов ответов
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {testConfig.answerOptions.map((option, index) => (
                    <div key={index} className={`p-2 rounded flex items-center justify-between ${
                      option.isCorrect ? 'bg-green-100 border border-green-300' : 'bg-white border border-gray-200'
                    }`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.wordText}</span>
                          {option.imagePng && (
                            <img src={option.imagePng} alt="" className="h-6 w-6 object-cover rounded" />
                          )}
                          {option.isCorrect && (
                            <span className="text-xs bg-green-500 text-white px-1 py-0.5 rounded">Правильный</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getDatabaseDisplayName(option.database)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleCorrect(index)}
                          className={`px-2 py-1 text-xs rounded ${
                            option.isCorrect ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                          }`}
                        >
                          {option.isCorrect ? 'Отменить' : 'Сделать правильным'}
                        </button>
                        <button
                          onClick={() => removeAnswerOption(index)}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Кнопки */}
        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={loading || filledCount !== totalOptions}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Сохранение...' : 'Создать тест'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Вспомогательная функция
const getDatabaseDisplayName = (database) => {
  const databaseNames = {
    'nouns': 'Существительное',
    'adjectives': 'Прилагательное',
    'verbs': 'Глагол',
    'pronouns': 'Местоимение', 
    'numerals': 'Числительное',
    'adverbs': 'Наречие',
    'prepositions': 'Предлог, частица',
    'question-words': 'Вопросительное слово',
    'gerunds': 'Деепричастие',
    'participles': 'Причастие'
  };
  return databaseNames[database] || database;
};

export default TestCreationModal;