// src/utils/columnMapping.js

// Маппинг ключей БД → ключи для отображения на фронте
export const DB_TO_FRONT_KEY_MAP = {
  'Урок название': 'Тема название',
  'Урок номер': 'Тема номер',
  'Уровень изучения номер': 'Уровень номер',
};

// Обратный маппинг: фронт → БД (для сохранения данных)
export const FRONT_TO_DB_KEY_MAP = Object.fromEntries(
  Object.entries(DB_TO_FRONT_KEY_MAP).map(([dbKey, frontKey]) => [frontKey, dbKey])
);

// Функция для конвертации ключа при чтении из БД
export const toFrontKey = (dbKey) => DB_TO_FRONT_KEY_MAP[dbKey] || dbKey;

// Функция для конвертации ключа перед сохранением в БД
export const toDbKey = (frontKey) => FRONT_TO_DB_KEY_MAP[frontKey] || frontKey;

// Конвертирует объект/строку ключей для отображения
export const convertKeysToFront = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toFrontKey(key)] = value;
  }
  return result;
};

// Конвертирует объект/строку ключей для сохранения в БД
export const convertKeysToDb = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toDbKey(key)] = value;
  }
  return result;
};

// Маппинг текстовых меток для форм
export const LABEL_MAP = {
  'Тема урока': 'Тема',
  'Выбрать урок': 'Выбрать тему',
  'УРОК название': 'ТЕМА название',
  'УРОК номер': 'ТЕМА номер',
};

// Функция для замены текста в лейблах
export const translateLabel = (text) => LABEL_MAP[text] || text;