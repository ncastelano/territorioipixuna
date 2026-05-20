'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signUp } from '@/lib/profiles';
import { UserPlus } from 'lucide-react';

function getCadastroMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Não foi possível criar sua conta.';
  const normalized = message.toLowerCase();

  if (normalized.includes('already') || normalized.includes('cadastrado') || normalized.includes('registered')) {
    return 'Este email já está cadastrado.';
  }

  if (normalized.includes('rate limit') || normalized.includes('limite') || normalized.includes('security purposes')) {
    return 'O cadastro não foi concluído agora. Tente novamente em alguns minutos.';
  }

  if (normalized.includes('invalid') || normalized.includes('email')) {
    return 'Informe um email válido.';
  }

  if (normalized.includes('password') || normalized.includes('senha')) {
    return 'A senha precisa ter pelo menos 6 caracteres.';
  }

  return message;
}

export default function CadastrarPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage('As senhas não conferem.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(email.trim(), password, fullName.trim());
      router.push('/');
    } catch (error) {
      setMessage(getCadastroMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper auth-page">
      <h1 className="page-title">Cadastrar</h1>
      <p className="page-subtitle">Crie sua conta para registrar ocorrências no mapa com seu próprio perfil.</p>

      <form className="glass-card auth-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="fullName">Nome</label>
          <input
            id="fullName"
            className="form-input"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Seu nome"
            required
            disabled={isSubmitting}
          />
        </div>

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
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo de 6 caracteres"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="confirmPassword">Confirmar Senha</label>
          <input
            id="confirmPassword"
            className="form-input"
            type="password"
            minLength={6}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Digite a senha novamente"
            required
            disabled={isSubmitting}
          />
        </div>

        {message && <p className="form-message error">{message}</p>}

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          <UserPlus size={18} />
          <span>{isSubmitting ? 'Cadastrando...' : 'Cadastrar'}</span>
        </button>

        <p className="auth-switch">
          Já tem conta? <Link href="/entrar">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
