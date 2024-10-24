import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react'; // 使用向上箭頭圖標

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-3 rounded-full shadow-lg hover:from-purple-600 hover:to-indigo-600 transition duration-300 ease-in-out z-10"
        >
          <ArrowUp className="h-6 w-6 text-white" />
        </button>
      )}
    </>
  );
}
