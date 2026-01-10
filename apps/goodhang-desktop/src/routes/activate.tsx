import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { validateActivationKey, type ValidationResult } from '@/lib/tauri';

export default function ActivatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Preview data stored for potential future use in signup page
  const [_preview, setPreview] = useState<ValidationResult['preview'] | null>(null);

  // Check for code in URL (from deep link)
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setCode(urlCode);
      handleValidate(urlCode);
    }
  }, [searchParams]);

  const handleValidate = async (activationCode?: string) => {
    const codeToValidate = activationCode || code;
    if (!codeToValidate.trim()) {
      setError('Please enter an activation code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await validateActivationKey(codeToValidate.trim());

      if (result.valid) {
        setPreview(result.preview || null);
        // Store activation data
        sessionStorage.setItem('activationCode', codeToValidate.trim());
        if (result.sessionId) {
          sessionStorage.setItem('sessionId', result.sessionId);
        }
        if (result.product) {
          sessionStorage.setItem('product', result.product);
        }
        if (result.preview) {
          sessionStorage.setItem('preview', JSON.stringify(result.preview));
        }
        if (result.hasExistingUser && result.userId) {
          sessionStorage.setItem('existingUserId', result.userId);
        }

        // Navigate to signin for existing users, signup for new users
        if (result.hasExistingUser) {
          navigate('/signin');
        } else {
          navigate('/signup');
        }
      } else {
        setError(result.error || 'Invalid activation code');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError('Failed to validate code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCode = (value: string) => {
    // Format as XXXX-XXXX-XXXX (matches website activation key format)
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Good Hang</h1>
          <p className="text-gray-400">Enter your activation code to continue</p>
        </div>

        <div className="bg-gh-dark-800 rounded-2xl p-8 shadow-xl">
          <div className="mb-6">
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Activation Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(formatCode(e.target.value))}
              placeholder="XXXX-XXXX-XXXX"
              className="w-full px-4 py-3 bg-gh-dark-900 border border-gray-700 rounded-lg text-white text-center text-xl font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-gh-purple-500 focus:border-transparent"
              maxLength={14}
              disabled={loading}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          <button
            onClick={() => handleValidate()}
            disabled={loading || !code.trim()}
            className="w-full py-3 px-4 bg-gh-purple-600 hover:bg-gh-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Validating...
              </span>
            ) : (
              'Activate'
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Don't have a code?{' '}
              <a
                href="https://goodhang.com/apply"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gh-purple-500 hover:text-gh-purple-400"
              >
                Take the assessment
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
