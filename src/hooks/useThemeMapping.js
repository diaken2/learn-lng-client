// src/hooks/useThemeMapping.js
import { useMemo } from 'react';
import { 
  toFrontKey, 
  toDbKey, 
  convertKeysToFront, 
  convertKeysToDb,
  translateLabel 
} from '@/utils/columnMapping';

export const useThemeMapping = () => {
  // Для отображения заголовков колонок в таблице
  const getDisplayColumnName = (dbColumnName) => {
    return toFrontKey(dbColumnName);
  };

  // Для получения значения из строки данных (прозрачно)
  const getCellValue = (row, dbColumnName) => {
    // Сначала пробуем по ключу из БД (на случай, если данные ещё не конвертированы)
    if (row[dbColumnName] !== undefined) return row[dbColumnName];
    // Потом пробуем по ключу для фронта
    const frontKey = toFrontKey(dbColumnName);
    return row[frontKey];
  };

  // Для подготовки данных перед сохранением в БД
  const prepareRowForSave = (frontRow) => {
    return convertKeysToDb(frontRow);
  };

  // Для подготовки данных для отображения после загрузки из БД
  const prepareRowForDisplay = (dbRow) => {
    return convertKeysToFront(dbRow);
  };

  // Для перевода текстов в интерфейсе
  const t = (text) => translateLabel(text);

  return useMemo(() => ({
    getDisplayColumnName,
    getCellValue,
    prepareRowForSave,
    prepareRowForDisplay,
    t
  }), []);
};