// AudioQuestionWordModal.jsx - исправленная версия

import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = 'https://learn-lng-new-client-lrqy.onrender.com/api';

export default function AudioQuestionWordModal({ isOpen, onClose, word, language, onAudioSaved }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [existingAudio, setExistingAudio] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // Генерируем уникальный ID для слова на основе русского перевода
  const getWordId = () => {
    if (word?.imageBase) return word.imageBase;
    if (word?.russianWord) return `question_word_${word.russianWord.toLowerCase().replace(/[^a-zа-яё]/g, '_')}`;
    if (word?.displayWord) return `question_word_${word.displayWord.toLowerCase().replace(/[^a-zа-яё]/g, '_')}`;
    return `question_word_${Date.now()}`;
  };

  const wordId = getWordId();

  useEffect(() => {
    if (isOpen && wordId && language) {
      loadExistingAudio();
    }
    
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [isOpen, wordId, language]);

  const loadExistingAudio = async () => {
    setLoadingExisting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/question-word-audio/${wordId}/${language}`);
      const data = await response.json();
      setExistingAudio(data.audioUrl);
    } catch (error) {
      console.error('Error loading existing audio:', error);
      setExistingAudio(null);
    } finally {
      setLoadingExisting(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Не удалось получить доступ к микрофону.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const url = URL.createObjectURL(file);
      setAudioBlob(file);
      setAudioUrl(url);
      setIsRecording(false);
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;
    
    setUploading(true);
    setProgress(0);
    
    try {
      const fileName = `${wordId}_${language}_${Date.now()}.${audioBlob.type.split('/')[1] || 'webm'}`;
      
      const urlResponse = await fetch(`${API_BASE_URL}/question-word-audio/generate-upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          fileType: audioBlob.type,
          wordId: wordId,
          language: language
        })
      });
      
      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { success, uploadUrl, key } = await urlResponse.json();
      
      if (!success || !uploadUrl) {
        throw new Error('Failed to get upload URL');
      }
      
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
        }
      });
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', audioBlob.type);
        xhr.setRequestHeader('x-amz-acl', 'public-read');
        xhr.send(audioBlob);
      });
      
      await uploadPromise;
      
      const bucketName = process.env.NEXT_PUBLIC_YANDEX_BUCKET || 'id-langlearn';
      const finalAudioUrl = `https://${bucketName}.storage.yandexcloud.net/${key}`;
      
      const saveResponse = await fetch(`${API_BASE_URL}/question-word-audio/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId: wordId,
          language: language,
          audioUrl: finalAudioUrl
        })
      });
      
      if (!saveResponse.ok) {
        throw new Error('Failed to save audio reference');
      }
      
      alert(`✅ Озвучка для "${word.displayWord}" (${language}) сохранена!`);
      if (onAudioSaved) onAudioSaved(finalAudioUrl);
      onClose();
      
    } catch (error) {
      console.error('Error uploading audio:', error);
      alert('Ошибка загрузки аудио: ' + error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteAudio = async () => {
    if (!existingAudio) return;
    
    if (!confirm(`Удалить озвучку для "${word.displayWord}" (${language})?`)) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/question-word-audio/${wordId}/${language}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('✅ Озвучка удалена');
        setExistingAudio(null);
        if (onAudioSaved) onAudioSaved(null);
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting audio:', error);
      alert('Ошибка удаления озвучки: ' + error.message);
    }
  };

  const handleClose = () => {
    if (audioUrl && !uploading) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsRecording(false);
    setUploading(false);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 className="text-xl font-semibold mb-2 text-center">
          Озвучка вопросительного слова
        </h3>
        <p className="text-center text-gray-600 mb-4">
          <span className="font-medium">{word?.displayWord || 'Слово'}</span>
          <span className="mx-2">•</span>
          <span className="text-blue-600">{language}</span>
        </p>
        
        {loadingExisting ? (
          <div className="text-center py-4 text-gray-500">Загрузка...</div>
        ) : existingAudio ? (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm font-medium text-green-800 mb-2">✓ Существующая озвучка:</p>
            <audio controls className="w-full mb-2" src={existingAudio} />
            <button
              onClick={deleteAudio}
              disabled={uploading}
              className="w-full px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:bg-gray-400"
            >
              Удалить озвучку
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-500 mb-4">Нет озвучки для этого слова</p>
        )}
        
        {!existingAudio && (
          <div className="space-y-4">
            <div className="border rounded p-4">
              <h4 className="font-medium mb-2 text-center">Записать голосом</h4>
              {!isRecording && !audioUrl && (
                <button
                  onClick={startRecording}
                  className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center gap-2"
                >
                  <span>🎙️</span> Начать запись
                </button>
              )}
              {isRecording && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="animate-pulse text-red-500">🔴</span>
                    <span>Идёт запись...</span>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="w-full py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Остановить запись
                  </button>
                </div>
              )}
              {audioUrl && !isRecording && (
                <div>
                  <audio controls src={audioUrl} className="w-full mb-3" />
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(audioUrl);
                      setAudioBlob(null);
                      setAudioUrl(null);
                    }}
                    className="w-full py-1 text-sm text-red-500 hover:text-red-700"
                  >
                    Отменить
                  </button>
                </div>
              )}
            </div>
            
            <div className="border rounded p-4">
              <h4 className="font-medium mb-2 text-center">Или загрузить файл</h4>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="w-full text-sm"
              />
              {audioUrl && !isRecording && (
                <div className="mt-2">
                  <audio controls src={audioUrl} className="w-full" />
                </div>
              )}
            </div>
            
            {uploading && (
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Загрузка...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
            
            {audioUrl && !uploading && (
              <button
                onClick={uploadAudio}
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Сохранить озвучку
              </button>
            )}
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            disabled={uploading}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}