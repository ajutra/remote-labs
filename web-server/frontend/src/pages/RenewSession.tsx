import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getEnv } from '@/utils/Env';

export default function RenewSession() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No token provided');
    }
  }, [token]);

  const handleRenew = async () => {
    if (!token) return;

    setStatus('loading');
    try {
      const response = await fetch(getEnv().API_RENEW_SESSION.replace('{token}', token), {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to renew session');
      }

      setStatus('success');
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setStatus('error');
      setErrorMessage('Failed to renew session. Please try again.');
    }
  };

  if (!token) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Session Renewal</CardTitle>
            <CardDescription>Invalid or missing token</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 text-red-500 bg-red-50 rounded-md">
              No valid token provided. Please use the link from your email.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Session Renewal</CardTitle>
          <CardDescription>Your VM session is about to expire</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="p-4 text-green-500 bg-green-50 rounded-md">
              Session renewed successfully! Redirecting to dashboard...
            </div>
          )}
          
          {status === 'error' && (
            <div className="p-4 text-red-500 bg-red-50 rounded-md">
              {errorMessage}
            </div>
          )}

          <Button 
            onClick={handleRenew} 
            disabled={status === 'loading' || status === 'success'}
            className="w-full"
          >
            {status === 'loading' ? 'Renewing...' : 'Renew Session'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 