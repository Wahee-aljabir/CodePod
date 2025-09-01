# Google Sign-In Debug Guide

## Problem Summary
Users experiencing persistent `auth/popup-closed-by-user` errors when attempting to sign in with Google, occurring on both localhost and production (Render) environments.

## Root Cause Analysis
The `auth/popup-closed-by-user` error typically occurs due to:
1. **Domain Authorization Issues**: The current domain is not authorized in Firebase Console
2. **Popup Blockers**: Browser blocking the authentication popup
3. **CSP (Content Security Policy) Restrictions**: Headers preventing iframe/popup loading
4. **Third-party Cookie Restrictions**: Browser blocking cookies needed for authentication
5. **Network Issues**: Connectivity problems during authentication

## Solutions Implemented

### 1. Enhanced Authentication Context (`AuthContext.js`)
- Added comprehensive error handling for all Google sign-in error codes
- Implemented automatic fallback from popup to redirect method
- Added detailed logging for debugging domain mismatches
- Created separate `loginWithGoogleRedirect` function as alternative
- Added `useRedirect` state to track when redirect method should be used

### 2. Updated Login Component (`Login.js`)
- Enhanced error handling with detailed console logging
- Added redirect method button as alternative to popup
- Improved UI to show both popup and redirect options when needed
- Better loading states and error messages

### 3. CSP Configuration (`server.js`)
Ensured proper Content Security Policy headers:
```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://apis.google.com", "https://accounts.google.com", "https://www.gstatic.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    connectSrc: ["'self'", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com"],
    frameSrc: ["'self'", "https://accounts.google.com", "https://codepod-3031b.firebaseapp.com"],
    imgSrc: ["'self'", "data:", "https:"],
  },
}
```

### 4. Debug Tool (`GoogleSignInDebug.js`)
Created comprehensive debugging component that:
- Tests popup blocker status
- Checks third-party cookie support
- Validates local/session storage availability
- Displays current domain vs Firebase auth domain
- Provides test buttons for both popup and redirect methods
- Shows detailed error analysis and recommendations

## Firebase Configuration Requirements

### Authorized Domains
Ensure these domains are added in Firebase Console → Authentication → Settings → Authorized domains:
- `localhost` (for development)
- `codepod.onrender.com` (for production)
- `codepod-3031b.firebaseapp.com` (Firebase hosting domain)

### Environment Variables
Verify these are correctly set in `.env`:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=codepod-3031b.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

## Debugging Steps

### 1. Access Debug Tool
- Navigate to `/debug` in your application
- Or use the "Debug Google Sign-In" option in the user menu

### 2. Check System Information
The debug tool will show:
- Current domain and origin
- Firebase auth domain configuration
- Popup blocker status
- Cookie and storage availability
- CSP configuration

### 3. Run Tests
- Use "Test Popup Sign-In" to reproduce the issue
- Use "Test Redirect Sign-In" as alternative method
- Check browser console for additional error details

### 4. Common Solutions

#### If Popup is Blocked:
- Disable popup blockers for your domain
- Use the redirect method instead
- Try incognito/private browsing mode

#### If Domain Not Authorized:
- Add current domain to Firebase authorized domains
- Wait a few minutes for changes to propagate
- Clear browser cache and cookies

#### If CSP Issues:
- Check browser console for CSP violation errors
- Verify `frameSrc` includes Google domains
- Ensure no conflicting CSP meta tags in HTML

#### If Third-party Cookies Disabled:
- Enable third-party cookies in browser settings
- Use redirect method which doesn't require third-party cookies
- Consider using Firebase hosting to avoid cross-domain issues

## Browser-Specific Issues

### Chrome
- Check if "Block third-party cookies" is enabled
- Disable popup blockers for your site
- Try with "--disable-web-security" flag for testing (development only)

### Firefox
- Check Enhanced Tracking Protection settings
- Ensure "Block pop-up windows" is disabled for your site
- Verify third-party cookies are allowed

### Safari
- Disable "Prevent cross-site tracking"
- Allow pop-ups for your domain
- Check "Block all cookies" setting

## Alternative Solutions

### 1. Use Redirect Method
If popups consistently fail, switch to redirect-based authentication:
```javascript
// In your component
const { loginWithGoogleRedirect } = useAuth();

// Use redirect instead of popup
await loginWithGoogleRedirect();
```

### 2. Deploy to Firebase Hosting
Eliminate domain mismatch issues by deploying to Firebase Hosting:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### 3. Custom Domain Setup
Configure a custom domain in Firebase Hosting that matches your production domain.

## Monitoring and Logging

The enhanced authentication context now logs:
- Current domain vs Firebase auth domain
- Detailed error information
- Fallback method usage
- Authentication success/failure events

Check browser console for these logs when debugging authentication issues.

## Testing Checklist

- [ ] Firebase authorized domains include current domain
- [ ] Popup blockers disabled for your site
- [ ] Third-party cookies enabled
- [ ] CSP headers allow Google domains
- [ ] Environment variables correctly configured
- [ ] Debug tool shows green status for all checks
- [ ] Both popup and redirect methods tested
- [ ] Different browsers tested
- [ ] Incognito mode tested

## Support

If issues persist after following this guide:
1. Use the debug tool to gather system information
2. Check browser console for additional errors
3. Test with different browsers and devices
4. Consider using redirect method as permanent solution
5. Review Firebase Console for any configuration issues