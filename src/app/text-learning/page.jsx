import TextLearningComponent from "@/components/TextLearningComponent";
import { Suspense } from "react";

export default function TextLearningPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Загрузка модуля...</div>
      </div>
    }>
      <TextLearningComponent />
    </Suspense>
  );
}