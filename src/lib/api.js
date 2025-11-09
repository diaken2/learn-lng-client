// lib/api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://learn-lng-server.onrender.com/api';

export async function fetchLessons(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.level) params.append('level', filters.level);
    if (filters.studiedLanguage) params.append('studiedLanguage', filters.studiedLanguage);
    if (filters.hintLanguage) params.append('hintLanguage', filters.hintLanguage);

    const response = await fetch(`${API_BASE_URL}/learning/lessons?${params}`);
    if (!response.ok) throw new Error('Failed to fetch lessons');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
}

export async function fetchLessonById(lessonId) {
  try {
    const response = await fetch(`${API_BASE_URL}/learning/lesson/${lessonId}`);
    if (!response.ok) throw new Error('Failed to fetch lesson');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return null;
  }
}

export async function fetchAllLessons() {
  try {
    const response = await fetch(`${API_BASE_URL}/lessons/all`);
    if (!response.ok) throw new Error('Failed to fetch lessons');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
}