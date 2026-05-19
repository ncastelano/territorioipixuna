'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { saveReport } from '@/lib/reports';
import { ShieldAlert, Skull, Axe, Flame, Leaf, Eye, ArrowRight, Save, MapPin } from 'lucide-react';

// Dynamically load the MiniMapPicker with SSR disabled
const MiniMapPicker = dynamic(() => import('@/components/MiniMapPicker'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(15, 23, 42, 0.4)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 'var(--border-radius-sm)',
      color: 'var(--fg-secondary)',
      fontSize: '0.8rem'
    }}>
      Carregando mapa interativo...
    </div>
  )
});

const CATEGORIES = [
  { id: 'invasao', label: 'Invasão', icon: ShieldAlert },
  { id: 'ameaca', label: 'Ameaça', icon: Skull },
  { id: 'desmatamento', label: 'Desmatamento', icon: Axe },
  { id: 'queimada', label: 'Queimada', icon: Flame },
  { id: 'recurso_natural', label: 'Recurso Natural', icon: Leaf },
  { id: 'vigilancia', label: 'Vigilância', icon: Eye },
] as const;

export default function AdicionarReport() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'invasao' | 'ameaca' | 'desmatamento' | 'queimada' | 'recurso_natural' | 'vigilancia'>('invasao');
  
  // Default centered in Tefé/Mamirauá, Amazonas
  const [latitude, setLatitude] = useState(-3.354);
  const [longitude, setLongitude] = useState(-64.711);
  
  const [reporterName, setReporterName] = useState('Agente Ipixuna');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCoordinateChange = (lat: number, lng: number) => {
    setLatitude(parseFloat(lat.toFixed(6)));
    setLongitude(parseFloat(lng.toFixed(6)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveReport({
        title,
        description,
        category,
        latitude,
        longitude,
        reporter_name: reporterName || 'Anônimo',
      });
      
      showToast('Marcação adicionada com sucesso!');
      
      // Redirect after toast hides
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      console.error(err);
      showToast('Ocorreu um erro ao salvar a marcação.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Nova Marcação</h1>
      <p className="page-subtitle">Adicione um novo registro ou ocorrência de monitoramento no território do Amazonas.</p>

      <form onSubmit={handleSubmit}>
        {/* Category selector */}
        <div className="form-group">
          <label className="form-label">Categoria de Ocorrência</label>
          <div className="category-selector">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`category-option ${cat.id} ${category === cat.id ? 'selected' : ''}`}
                >
                  <span className="category-option-icon">
                    <Icon size={20} />
                  </span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="title">Título da Marcação *</label>
          <input
            id="title"
            type="text"
            className="form-input"
            placeholder="Ex: Foco de Incêndio Próximo a Comunidade"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label" htmlFor="description">Descrição / Detalhes *</label>
          <textarea
            id="description"
            className="form-textarea"
            placeholder="Descreva o que foi observado, a gravidade e outras informações relevantes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Coordinate Selection */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} />
            <span>Localização no Mapa (Amazonas)</span>
          </label>
          
          <MiniMapPicker
            latitude={latitude}
            longitude={longitude}
            category={category}
            onChange={handleCoordinateChange}
          />

          <div className="form-row">
            <div>
              <label className="form-label" htmlFor="latitude" style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)' }}>Latitude</label>
              <input
                id="latitude"
                type="number"
                step="0.000001"
                className="form-input"
                style={{ width: '100%' }}
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="longitude" style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)' }}>Longitude</label>
              <input
                id="longitude"
                type="number"
                step="0.000001"
                className="form-input"
                style={{ width: '100%' }}
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Reporter Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="reporter">Nome do Relator</label>
          <input
            id="reporter"
            type="text"
            className="form-input"
            placeholder="Seu nome ou organização (deixe 'Agente Ipixuna' se preferir)"
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? (
            <>Salvando registro...</>
          ) : (
            <>
              <Save size={18} />
              <span>Salvar Registro</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Toast popup */}
      {toastMessage && (
        <div className="toast">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
