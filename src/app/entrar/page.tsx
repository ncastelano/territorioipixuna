'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser, resendConfirmation, signIn } from '@/lib/profiles';
import { LogIn, MailCheck } from 'lucide-react';

export default function EntrarPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [canResendConfirmation, setCanResendConfirmation] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    getCurrentUser().then((user) => {
      if (user) {
        router.replace(params.get('redirect') || '/perfil');
      }
    });
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setCanResendConfirmation(false);

    try {
      await signIn(email.trim(), password);
      const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/perfil';
      router.push(redirectTo);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível entrar.';
      setMessage(errorMessage);
      setCanResendConfirmation(errorMessage.toLowerCase().includes('confirme seu email'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setMessage('Informe seu email para reenviar a confirmação.');
      return;
    }

    setIsResending(true);
    try {
      await resendConfirmation(email.trim());
      setCanResendConfirmation(false);
      setMessage('Email de confirmação reenviado. Verifique sua caixa de entrada.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível reenviar a confirmação.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="page-wrapper auth-page">
      <h1 className="page-title">Entrar</h1>
      <p className="page-subtitle">Acesse sua conta para adicionar marcações e atualizar seu perfil.</p>

      <form className="glass-card auth-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="form-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@email.com"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Senha</label>
          <input
            id="password"
            className="form-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sua senha"
            required
            disabled={isSubmitting}
          />
        </div>

        {message && <p className="form-message error">{message}</p>}
        {canResendConfirmation && (
          <button
            type="button"
            className="secondary-btn"
            onClick={handleResendConfirmation}
            disabled={isSubmitting || isResending}
          >
            <MailCheck size={16} />
            <span>{isResending ? 'Reenviando...' : 'Reenviar confirmação'}</span>
          </button>
        )}

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          <LogIn size={18} />
          <span>{isSubmitting ? 'Entrando...' : 'Entrar'}</span>
        </button>

        <p className="auth-switch">
          Ainda não tem conta? <Link href="/cadastrar">Cadastrar</Link>
        </p>
      </form>
    </div>
  );
}
