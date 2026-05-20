'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchReportsByUser } from '@/lib/reports';
import { fetchProfile, getCurrentUser, saveProfile, signOut, uploadProfileImage, type ProfileFormInput } from '@/lib/profiles';
import type { MarkerReport, UserProfile } from '@/lib/supabase';
import { Camera, Database, Info, LogOut, Save, Upload, UserRound } from 'lucide-react';

const emptyProfile: ProfileFormInput = {
  full_name: '',
  role: '',
  bio: '',
  region: 'AM',
  image_url: '',
};

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('') || 'IP';
}

export default function Perfil() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileFormInput>(emptyProfile);
  const [reports, setReports] = useState<MarkerReport[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'guest' | 'error'>('loading');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayName = form.full_name.trim() || userEmail || 'Usuário Ipixuna';
  const avatarUrl = form.image_url.trim();

  const counts = useMemo(() => {
    return reports.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [reports]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadProfile() {
      const user = await getCurrentUser();

      if (!user) {
        setStatus('guest');
        return;
      }

      const [currentProfile, userReports] = await Promise.all([
        fetchProfile(user.id),
        fetchReportsByUser(user.id),
      ]);

      const nextForm = {
        full_name: currentProfile?.full_name || user.user_metadata?.full_name || '',
        role: currentProfile?.role || '',
        bio: currentProfile?.bio || '',
        region: currentProfile?.region || 'AM',
        image_url: currentProfile?.image_url || '',
      };

      setUserId(user.id);
      setUserEmail(user.email ?? null);
      setProfile(currentProfile);
      setForm(nextForm);
      setReports(userReports);
      setStatus('ready');
    }

    loadProfile().catch((error) => {
      console.error(error);
      setStatus('error');
    });
  }, []);

  const handleChange = (field: keyof ProfileFormInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!userId) {
      router.push('/entrar?redirect=/perfil');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveProfile(userId, form, userEmail);
      setProfile(saved);
      setForm({
        full_name: saved.full_name,
        role: saved.role || '',
        bio: saved.bio || '',
        region: saved.region || 'AM',
        image_url: saved.image_url || '',
      });
      showToast('Perfil salvo com sucesso.');
    } catch (error) {
      console.error(error);
      showToast('Não foi possível salvar o perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !userId) {
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadProfileImage(userId, file);
      const nextForm = { ...form, image_url: imageUrl };
      setForm(nextForm);
      const saved = await saveProfile(userId, nextForm, userEmail);
      setProfile(saved);
      showToast('Imagem de perfil atualizada.');
    } catch (error) {
      console.error(error);
      showToast('Não foi possível enviar a imagem.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/entrar');
  };

  if (status === 'loading') {
    return (
      <div className="page-wrapper">
        <div className="glass-card">Carregando perfil...</div>
      </div>
    );
  }

  if (status === 'guest') {
    return (
      <div className="page-wrapper auth-page">
        <div className="glass-card profile-card">
          <div className="profile-initials-avatar">
            <UserRound size={38} />
          </div>
          <h1 className="profile-name">Entre para ver seu perfil</h1>
          <p className="page-subtitle">Cada pessoa terá seus próprios dados, foto e marcações no mapa.</p>
          <div className="auth-actions">
            <Link href="/entrar" className="submit-btn">Entrar</Link>
            <Link href="/cadastrar" className="secondary-btn">Cadastrar</Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="page-wrapper">
        <div className="glass-card">Não foi possível carregar o perfil.</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="glass-card profile-card">
        <div className="profile-avatar-container">
          {avatarUrl ? (
            <img src={avatarUrl} alt={`Foto de ${displayName}`} className="profile-avatar" />
          ) : (
            <div className="profile-initials-avatar" aria-label={`Iniciais de ${displayName}`}>
              {getInitials(displayName)}
            </div>
          )}
          <label className="avatar-edit-badge" title="Enviar foto">
            {isUploading ? <Upload size={15} /> : <Camera size={15} />}
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} hidden />
          </label>
        </div>

        <h2 className="profile-name">{displayName}</h2>
        <p className="profile-role">{form.role || 'Agente territorial'}</p>
        <p className="profile-bio">{form.bio || 'Atualize seus dados para completar seu perfil.'}</p>

        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{reports.length}</span>
            <span className="stat-label">Ocorrências</span>
          </div>
          <div className="stat-item stat-bordered">
            <span className="stat-value">{form.region || 'AM'}</span>
            <span className="stat-label">Região</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profile ? 'OK' : 'Novo'}</span>
            <span className="stat-label">Perfil</span>
          </div>
        </div>
      </div>

      <form className="glass-card profile-form-card" onSubmit={handleSave}>
        <h3 className="section-title">Meus Dados</h3>

        <div className="form-group">
          <label className="form-label" htmlFor="full_name">Nome</label>
          <input
            id="full_name"
            className="form-input"
            value={form.full_name}
            onChange={(event) => handleChange('full_name', event.target.value)}
            placeholder="Seu nome"
            disabled={isSaving}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="role">Função</label>
            <input
              id="role"
              className="form-input"
              value={form.role}
              onChange={(event) => handleChange('role', event.target.value)}
              placeholder="Ex: Agente comunitário"
              disabled={isSaving}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="region">Região</label>
            <input
              id="region"
              className="form-input"
              value={form.region}
              onChange={(event) => handleChange('region', event.target.value)}
              placeholder="AM"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="image_url">Image URL</label>
          <input
            id="image_url"
            className="form-input"
            value={form.image_url}
            onChange={(event) => handleChange('image_url', event.target.value)}
            placeholder="URL pública da sua imagem"
            disabled={isSaving || isUploading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="bio">Descrição</label>
          <textarea
            id="bio"
            className="form-textarea"
            value={form.bio}
            onChange={(event) => handleChange('bio', event.target.value)}
            placeholder="Conte rapidamente sua atuação no território."
            disabled={isSaving}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={isSaving}>
          <Save size={18} />
          <span>{isSaving ? 'Salvando...' : 'Salvar Perfil'}</span>
        </button>
      </form>

      <h3 className="section-title">Minhas Estatísticas</h3>
      <div className="stats-grid">
        <div className="glass-card stat-category invasao"><span>Invasões</span><strong>{counts.invasao || 0}</strong></div>
        <div className="glass-card stat-category ameaca"><span>Ameaças</span><strong>{counts.ameaca || 0}</strong></div>
        <div className="glass-card stat-category desmatamento"><span>Desmatamentos</span><strong>{counts.desmatamento || 0}</strong></div>
        <div className="glass-card stat-category queimada"><span>Queimadas</span><strong>{counts.queimada || 0}</strong></div>
        <div className="glass-card stat-category recurso_natural"><span>Recursos Naturais</span><strong>{counts.recurso_natural || 0}</strong></div>
        <div className="glass-card stat-category vigilancia"><span>Vigilância</span><strong>{counts.vigilancia || 0}</strong></div>
      </div>

      <div className="glass-card integration-card">
        <div className="integration-row">
          <div className="integration-icon">
            <Database size={18} />
          </div>
          <div>
            <p>Supabase Profile</p>
            <span>{userEmail}</span>
          </div>
        </div>
        <button type="button" className="secondary-btn danger" onClick={handleSignOut}>
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>

      <div className="info-footer">
        <Info size={16} />
        <p>Seu perfil será usado como relator padrão nas próximas marcações adicionadas ao mapa.</p>
      </div>

      {toastMessage && (
        <div className="toast">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
