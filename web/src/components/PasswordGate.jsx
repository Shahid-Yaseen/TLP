import { useState, useCallback } from 'react';

const STORAGE_KEY = 'tlp_preview_unlocked';

/**
 * Constant-time string comparison to avoid timing attacks.
 */
function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Pre-launch password gate. When VITE_PASSWORD_PROTECT=true, the entire app
 * is hidden until the user enters the shared password (VITE_ACCESS_PASSWORD).
 * To disable: set VITE_PASSWORD_PROTECT=false or omit it, then rebuild.
 */
function PasswordGate({ children }) {
  const isProtected = import.meta.env.VITE_PASSWORD_PROTECT === 'true';
  const expectedPassword = import.meta.env.VITE_ACCESS_PASSWORD ?? '';

  const [unlocked, setUnlocked] = useState(() => {
    if (!isProtected) return true;
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setError('');
      if (secureCompare(password, expectedPassword)) {
        try {
          sessionStorage.setItem(STORAGE_KEY, '1');
        } catch {
          // sessionStorage may be unavailable
        }
        setUnlocked(true);
      } else {
        setError('Incorrect password. Please try again.');
      }
    },
    [password, expectedPassword]
  );

  if (!isProtected || unlocked) {
    return children;
  }

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-700 bg-gray-900/80 p-6 shadow-xl">
        <h1 className="text-xl font-semibold text-white mb-2">Preview access</h1>
        <p className="text-gray-400 text-sm mb-4">
          Enter the password to view this site.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 rounded border border-gray-600 bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent mb-3"
            autoFocus
            autoComplete="current-password"
          />
          {error && (
            <p className="text-red-400 text-sm mb-3" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full py-2 px-4 rounded bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}

export default PasswordGate;
