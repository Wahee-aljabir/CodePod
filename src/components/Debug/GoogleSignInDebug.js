import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const GoogleSignInDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [testResults, setTestResults] = useState([]);
  const { loginWithGoogle, loginWithGoogleRedirect, isGoogleSignInInProgress } = useAuth();

  useEffect(() => {
    // Collect debug information
    const info = {
      userAgent: navigator.userAgent,
      currentDomain: window.location.hostname,
      currentOrigin: window.location.origin,
      firebaseAuthDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      popupBlockerTest: testPopupBlocker(),
      cookiesEnabled: navigator.cookieEnabled,
      thirdPartyCookies: testThirdPartyCookies(),
      localStorageEnabled: testLocalStorage(),
      sessionStorageEnabled: testSessionStorage(),
      cspHeaders: getCspInfo(),
      timestamp: new Date().toISOString()
    };
    setDebugInfo(info);
  }, []);

  const testPopupBlocker = () => {
    try {
      const popup = window.open('', '_blank', 'width=1,height=1');
      if (popup) {
        popup.close();
        return 'Allowed';
      } else {
        return 'Blocked';
      }
    } catch (error) {
      return 'Error: ' + error.message;
    }
  };

  const testThirdPartyCookies = () => {
    try {
      // Test if we can set cookies
      document.cookie = 'test=1; SameSite=None; Secure';
      const canSet = document.cookie.includes('test=1');
      // Clean up
      document.cookie = 'test=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      return canSet ? 'Enabled' : 'Disabled';
    } catch (error) {
      return 'Error: ' + error.message;
    }
  };

  const testLocalStorage = () => {
    try {
      localStorage.setItem('test', '1');
      localStorage.removeItem('test');
      return 'Enabled';
    } catch (error) {
      return 'Disabled';
    }
  };

  const testSessionStorage = () => {
    try {
      sessionStorage.setItem('test', '1');
      sessionStorage.removeItem('test');
      return 'Enabled';
    } catch (error) {
      return 'Disabled';
    }
  };

  const getCspInfo = () => {
    // Try to detect CSP violations
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    return meta ? meta.content : 'No CSP meta tag found';
  };

  const runPopupTest = async () => {
    const result = {
      timestamp: new Date().toISOString(),
      test: 'Popup Test',
      status: 'Running...',
      details: ''
    };
    
    setTestResults(prev => [...prev, result]);
    
    try {
      await loginWithGoogle();
      result.status = 'Success';
      result.details = 'Google sign-in popup completed successfully';
    } catch (error) {
      result.status = 'Failed';
      result.details = `Error: ${error.code} - ${error.message}`;
      
      // Additional error analysis
      if (error.code === 'auth/popup-closed-by-user') {
        result.details += '\n\nPossible causes:\n- User closed popup manually\n- Popup was blocked\n- CSP restrictions\n- Domain not authorized in Firebase';
      } else if (error.code === 'auth/popup-blocked') {
        result.details += '\n\nPopup was blocked by browser. Try the redirect method instead.';
      }
    }
    
    setTestResults(prev => prev.map(r => r.timestamp === result.timestamp ? result : r));
  };

  const runRedirectTest = async () => {
    const result = {
      timestamp: new Date().toISOString(),
      test: 'Redirect Test',
      status: 'Redirecting...',
      details: 'Initiating redirect to Google sign-in'
    };
    
    setTestResults(prev => [...prev, result]);
    
    try {
      await loginWithGoogleRedirect();
      // This won't execute as the page will redirect
    } catch (error) {
      result.status = 'Failed';
      result.details = `Error: ${error.code} - ${error.message}`;
      setTestResults(prev => prev.map(r => r.timestamp === result.timestamp ? result : r));
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-6">Google Sign-In Debug Tool</h1>
      
      {/* Debug Information */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">System Information</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong>Current Domain:</strong> {debugInfo.currentDomain}</div>
            <div><strong>Current Origin:</strong> {debugInfo.currentOrigin}</div>
            <div><strong>Firebase Auth Domain:</strong> {debugInfo.firebaseAuthDomain}</div>
            <div><strong>Popup Blocker:</strong> <span className={debugInfo.popupBlockerTest === 'Allowed' ? 'text-green-400' : 'text-red-400'}>{debugInfo.popupBlockerTest}</span></div>
            <div><strong>Cookies Enabled:</strong> <span className={debugInfo.cookiesEnabled ? 'text-green-400' : 'text-red-400'}>{debugInfo.cookiesEnabled ? 'Yes' : 'No'}</span></div>
            <div><strong>Third-Party Cookies:</strong> <span className={debugInfo.thirdPartyCookies === 'Enabled' ? 'text-green-400' : 'text-red-400'}>{debugInfo.thirdPartyCookies}</span></div>
            <div><strong>Local Storage:</strong> <span className={debugInfo.localStorageEnabled === 'Enabled' ? 'text-green-400' : 'text-red-400'}>{debugInfo.localStorageEnabled}</span></div>
            <div><strong>Session Storage:</strong> <span className={debugInfo.sessionStorageEnabled === 'Enabled' ? 'text-green-400' : 'text-red-400'}>{debugInfo.sessionStorageEnabled}</span></div>
          </div>
          <div className="mt-4">
            <div><strong>User Agent:</strong></div>
            <div className="text-xs text-gray-400 break-all">{debugInfo.userAgent}</div>
          </div>
          <div className="mt-4">
            <div><strong>CSP Info:</strong></div>
            <div className="text-xs text-gray-400 break-all">{debugInfo.cspHeaders}</div>
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={runPopupTest}
            disabled={isGoogleSignInInProgress}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg"
          >
            Test Popup Sign-In
          </button>
          <button
            onClick={runRedirectTest}
            disabled={isGoogleSignInInProgress}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg"
          >
            Test Redirect Sign-In
          </button>
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{result.test}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.status === 'Success' ? 'bg-green-600' :
                    result.status === 'Failed' ? 'bg-red-600' :
                    'bg-yellow-600'
                  }`}>
                    {result.status}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  <div>Time: {new Date(result.timestamp).toLocaleString()}</div>
                  <div className="mt-2 whitespace-pre-wrap">{result.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Recommendations</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          <ul className="space-y-2 text-sm">
            <li>• Ensure {debugInfo.currentDomain} is added to Firebase authorized domains</li>
            <li>• Check if popup blockers are disabled for this site</li>
            <li>• Verify third-party cookies are enabled</li>
            <li>• Try using an incognito/private browsing window</li>
            <li>• Test with different browsers (Chrome, Firefox, Safari)</li>
            <li>• Check browser console for additional error messages</li>
            <li>• If popups fail consistently, use the redirect method instead</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GoogleSignInDebug;