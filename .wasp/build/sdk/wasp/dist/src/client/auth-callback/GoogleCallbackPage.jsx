import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { completeGoogleAuth } from 'wasp/client/operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { AuthPageLayout } from '../../auth/AuthPageLayout';
export default function GoogleCallbackPage() {
    const [status, setStatus] = useState('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        const handleCallback = async () => {
            // Extract code and state from URL params
            const params = new URLSearchParams(location.search);
            const code = params.get('code');
            const state = params.get('state');
            const error = params.get('error');
            // Check if user denied access
            if (error) {
                setStatus('error');
                if (error === 'access_denied') {
                    setErrorMessage('You denied access to your Google account. Please authorize access to continue.');
                }
                else {
                    setErrorMessage(`Google authorization failed: ${error}`);
                }
                return;
            }
            if (!code) {
                setStatus('error');
                setErrorMessage('No authorization code received from Google. Please try connecting again.');
                return;
            }
            try {
                // Call the complete auth action
                const result = await completeGoogleAuth({ code, state: state || undefined });
                if (result.success) {
                    setStatus('success');
                    // Redirect to dashboard after a brief delay
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 1500);
                }
                else {
                    setStatus('error');
                    setErrorMessage(result.error || 'Failed to connect Google account.');
                }
            }
            catch (error) {
                console.error('Error completing Google OAuth:', error);
                setStatus('error');
                setErrorMessage(error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred. Please try again.');
            }
        };
        handleCallback();
    }, [location.search, navigate]);
    return (<AuthPageLayout>
      <div className="space-y-6">
        {status === 'loading' && (<Card>
            <CardHeader>
              <CardTitle>Connecting Google Sheets</CardTitle>
              <CardDescription>Please wait while we complete the connection...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-4 border-gray-200"></div>
                  <div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Authenticating with Google...
              </p>
            </CardContent>
          </Card>)}

        {status === 'success' && (<Card>
            <CardHeader>
              <CardTitle>Successfully Connected!</CardTitle>
              <CardDescription>Your Google account has been connected.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-4 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Redirecting to dashboard...
                </p>
              </div>
            </CardContent>
          </Card>)}

        {status === 'error' && (<Card>
            <CardHeader>
              <CardTitle>Connection Failed</CardTitle>
              <CardDescription>We couldn't connect your Google account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
              <div className="flex justify-center space-x-3">
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </div>
            </CardContent>
          </Card>)}
      </div>
    </AuthPageLayout>);
}
//# sourceMappingURL=GoogleCallbackPage.jsx.map