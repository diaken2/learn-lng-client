export const DEFAULT_DB = {
  images: [
    { _id: 'img1', src: '/images/apple.png', label: 'яблоко' },
    { _id: 'img2', src: '/images/banana.png', label: 'банан' }
  ],
  numbers: [
    { _id: 'n1', value: '1' },
    { _id: 'n2', value: '2' }
  ],
  words: [
    { _id: 'w1', translations: { russian: 'ЯБЛОКО', english: 'An apple', turkish: 'Elma' }, imageId: 'img1' },
    { _id: 'w2', translations: { russian: 'БАНАН', english: 'A banana', turkish: 'Muz' }, imageId: 'img2' },
    { _id: 'w3', translations: { russian: 'СТОЛ', english: 'A table', turkish: 'Masa' } },
    { _id: 'w4', translations: { russian: 'СТУЛ', english: 'A chair', turkish: 'Sandalye' } }
  ],
  lessons: [
    { id: 'lesson-1-1', title: 'Урок 1.1 • Еда', level: 'A1', wordIds: ['w1', 'w2'], fontColor: '#000000', bgColor: '#f0f0f0' },
    { id: 'lesson-1-2', title: 'Урок 1.2 • Мебель', level: 'A1', wordIds: ['w3', 'w4'], fontColor: '#000000', bgColor: '#f0f0f0' }
  ],
  tests: [
    { id: 'test-1-1', lessonId: 'lesson-1-1', studiedLanguage: 'russian', hintLanguage: 'english', level: 'A1', theme: 'Еда', fontColor: '#000000', bgColor: '#f0f0f0' }
  ],
  flags: [
    { language: 'Русский', image: '/flags/ru.png' },
    { language: 'Английский', image: '/flags/en.png' },
    { language: 'Турецкий', image: '/flags/tr.png' }
  ],
  settings: {
    fontColor: '#000000',
    bgColor: '#f0f0f0',
    fontBgColor: '#808080'
  }
};

const LS_KEYS = {
  db: 'll_mvp_db_v1'
};

export function loadDB() {
  try {
    const raw = localStorage.getItem(LS_KEYS.db);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        images: Array.isArray(parsed.images) && parsed.images.length ? parsed.images : DEFAULT_DB.images,
        numbers: Array.isArray(parsed.numbers) && parsed.numbers.length ? parsed.numbers : DEFAULT_DB.numbers,
        words: Array.isArray(parsed.words) && parsed.words.length ? parsed.words : DEFAULT_DB.words,
        lessons: Array.isArray(parsed.lessons) && parsed.lessons.length ? parsed.lessons : DEFAULT_DB.lessons,
        tests: Array.isArray(parsed.tests) ? parsed.tests : DEFAULT_DB.tests,
        flags: Array.isArray(parsed.flags) ? parsed.flags : DEFAULT_DB.flags,
        settings: parsed.settings || DEFAULT_DB.settings
      };
    }
  } catch (e) {
    console.error('loadDB error', e);
  }
  return DEFAULT_DB;
}

export function saveDB(db) {
  try {
    localStorage.setItem(LS_KEYS.db, JSON.stringify(db));
  } catch (e) {
    console.error('saveDB error', e);
  }
}