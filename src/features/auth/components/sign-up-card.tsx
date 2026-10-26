import { useAuthActions } from '@convex-dev/auth/react';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import type { SignInFlow } from '../types';

interface SignUpCardProps {
  setState: (state: SignInFlow) => void;
}

export const SignUpCard = ({ setState }: SignUpCardProps) => {
  const { signIn } = useAuthActions();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const handleOAuthSignUp = (value: 'github' | 'google') => {
    setPending(true);
    signIn(value).finally(() => setPending(false));
  };

  return (
    <Card className="size-full p-8">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Sign up to continue</CardTitle>
        <CardDescription>Choose a provider to sign up.</CardDescription>
      </CardHeader>

      {!!error && (
        <div className="mb-6 flex items-center gap-x-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <TriangleAlert className="size-4" />
          <p>{error}</p>
        </div>
      )}

      <CardContent className="space-y-5 px-0 pb-0">

        <Separator />

        <div className="flex flex-col gap-y-2.5">
          <Button disabled={pending} onClick={() => handleOAuthSignUp('google')} variant="outline" size="lg" className="relative w-full">
            <FcGoogle className="absolute left-2.5 top-3 size-5" />
            Continue with Google
          </Button>

          <Button disabled={pending} onClick={() => handleOAuthSignUp('github')} variant="outline" size="lg" className="relative w-full">
            <FaGithub className="absolute left-2.5 top-3 size-5" />
            Continue with GitHub
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <button
            disabled={pending}
            onClick={() => setState('signIn')}
            className="cursor-pointer font-medium text-sky-700 hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            Sign in
          </button>
        </p>
      </CardContent>
    </Card>
  );
};
