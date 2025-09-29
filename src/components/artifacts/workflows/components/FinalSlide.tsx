import React from 'react';

interface FinalSlideProps {
  onClose: () => void;
  message?: string;
}

const FinalSlide: React.FC<FinalSlideProps> = ({ 
  onClose, 
  message = "That's all for today!" 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg 
            className="w-8 h-8 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>

        {/* Main Message */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {message}
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 mb-8">
          Great work today! You've completed all your tasks.
        </p>

        {/* OK Button */}
        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default FinalSlide;
