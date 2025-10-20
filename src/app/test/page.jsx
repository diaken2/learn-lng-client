import { Suspense } from 'react';
import TestContent from '@/components/TestComponent';

export default function TestPage() {
  return (
    <Suspense fallback={<div>Загрузка теста...</div>}>
      <TestContent />
    </Suspense>
  );
}