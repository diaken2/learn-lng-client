export const metadata = {
  title: 'Language Learning App',
  description: 'Интерактивная платформа для изучения языков',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    primary: '#3B82F6',
                    secondary: '#8B5CF6',
                  }
                }
              }
            }
          `
        }} />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body { 
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
          }
          
          .flip-card {
            perspective: 1000px;
          }
          .flip-card-inner {
            transition: transform 0.6s;
            transform-style: preserve-3d;
            position: relative;
            width: 100%;
            height: 100%;
          }
          .flip-card.flipped .flip-card-inner {
            transform: rotateY(180deg);
          }
          .flip-card-front, .flip-card-back {
            backface-visibility: hidden;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 1rem;
          }
          .flip-card-back {
            transform: rotateY(180deg);
          }
        `}</style>
      </head>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}