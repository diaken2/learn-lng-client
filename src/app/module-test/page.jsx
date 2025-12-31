import ModuleTestComponent from '@/components/ModuleTestComponent';
import { Suspense } from 'react';


export default function ModuleTestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Загрузка модуля...</div>
      </div>
    }>
      <ModuleTestComponent />
    </Suspense>
  );
}