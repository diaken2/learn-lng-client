// Функция для нормализации регистра предложения
export const normalizeSentence = (words, isQuestion = false) => {
  if (!words || words.length === 0) return '';
  
  // Собираем предложение из слов
  let sentence = words.map(item => item.word || '').join(' ');
  
  // Убираем лишние пробелы
  sentence = sentence.trim().replace(/\s+/g, ' ');
  
  // Если предложение пустое
  if (!sentence) return '';
  
  // Для вопросов - первая буква заглавная, в конце вопросительный знак
  if (isQuestion) {
    // Первая буква заглавная
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    // Добавляем вопросительный знак если его нет
    if (!/[?!.]$/.test(sentence)) {
      sentence += '?';
    }
  } else {
    // Для ответов - первая буква заглавная, в конце точка если нет знака препинания
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    if (!/[?!.]$/.test(sentence)) {
      sentence += '.';
    }
  }
  
  return sentence;
};

// Функция для нормализации отдельных слов (все строчные кроме первого слова вопроса)
export const normalizeWord = (word, isFirstWord = false, isQuestion = false) => {
  if (!word) return '';
  
  // Для вопросов: первое слово с заглавной, остальные со строчной
  if (isQuestion) {
    if (isFirstWord) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    } else {
      return word.toLowerCase();
    }
  }
  
  // Для ответов: первое слово с заглавной, остальные как есть (для имен собственных)
  if (isFirstWord) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  
  return word;
};

export const normalizeDisplayText = (text, isQuestion = false) => {
  if (!text) return '—';
  
  // Убираем лишние пробелы
  text = text.trim().replace(/\s+/g, ' ');
  
  if (isQuestion) {
    // Для вопросов: первая буква заглавная, в конце ?
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (!text.endsWith('?')) {
      text += '?';
    }
  } else {
    // Для ответов: первая буква заглавная, в конце .
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (!/[.!?]$/.test(text)) {
      text += '.';
    }
  }
  
  return text;
};