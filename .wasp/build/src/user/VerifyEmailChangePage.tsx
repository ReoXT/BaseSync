import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { confirmEmailChange } from 'wasp/client/operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../client/components/ui/card';
import { Button } from '../client/components/ui/button';
import { Alert, AlertDescription } from '../client/components/ui/alert';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function VerifyEmailChangePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const result = await confirmEmailChange({ token });
        setStatus('success');
        setNewEmail(result.email || '');
        setMessage('Your email address has been successfully updated!');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Failed to verify email change. The link may have expired.');
      }
    };

    verifyToken();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Verifying your new email address...'}
            {status === 'success' && 'Email address verified'}
            {status === 'error' && 'Verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Please wait...</p>
            </div>
          )}

          {status === 'success' && (
            <>
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">
                  {message}
                  {newEmail && (
                    <p className="mt-2">
                      Your new email address: <strong>{newEmail}</strong>
                    </p>
                  )}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate('/account/settings')} className="w-full">
                  Go to Account Settings
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Common reasons for failure:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>The verification link has expired (valid for 1 hour)</li>
                  <li>The email address is already in use by another account</li>
                  <li>The verification link has already been used</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate('/account/settings')} className="w-full">
                  Go to Account Settings
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
