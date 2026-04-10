import React, { useState } from 'react';
import { useAuth, kayitOl, girisYap } from '../../context/AuthContext';

interface AuthPageProps {
  onSuccess: () => void;
}

type Mode = 'login' | 'register';

export default function AuthPage({ onSuccess }: AuthPageProps) {
  const { _setUser } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEmail(''); setPassword(''); setName('');
    setError(''); setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'register') {
      const sonuc = await kayitOl(name.trim(), email.toLowerCase().trim(), password);
      if (!sonuc.basarili) {
        setError(sonuc.hata || 'Bir hata oluştu.');
      } else {
        _setUser(sonuc.kullanici!);
        setSuccess(`Hoş geldiniz, ${sonuc.kullanici!['isim soyisim']}! 🎉`);
        setTimeout(onSuccess, 1000);
      }
    } else {
      const sonuc = await girisYap(email.toLowerCase().trim(), password);
      if (!sonuc.basarili) {
        setError(sonuc.hata || 'Giriş başarısız.');
      } else {
        _setUser(sonuc.kullanici!);
        setSuccess(`Hoş geldiniz, ${sonuc.kullanici!['isim soyisim']}! 🏄‍♂️`);
        setTimeout(onSuccess, 1000);
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🌊</div>
          <div className="auth-logo-name">Hakan Abay</div>
          <div className="auth-logo-sub">Surf & Snowboard Akademi</div>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); resetForm(); }}
          >
            Giriş Yap
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); resetForm(); }}
          >
            Kayıt Ol
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="auth-field">
              <label>Ad Soyad</label>
              <input
                type="text"
                placeholder="Adınız Soyadınız"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label>E-posta</label>
            <input
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>Şifre</label>
            <input
              type="password"
              placeholder={mode === 'register' ? 'En az 6 karakter' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <div className="auth-error">⚠️ {error}</div>}
          {success && <div className="auth-success">✅ {success}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? (mode === 'register' ? '⏳ Kaydediliyor...' : '⏳ Giriş yapılıyor...')
              : mode === 'login' ? '🏄‍♂️ Giriş Yap' : '🎯 Hesap Oluştur'}
          </button>
        </form>

        <p className="auth-footer-text">
          {mode === 'login' ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
          <button
            className="auth-switch-btn"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); resetForm(); }}
          >
            {mode === 'login' ? 'Kayıt ol' : 'Giriş yap'}
          </button>
        </p>

        <button className="auth-skip" onClick={onSuccess}>
          Şimdilik geç, siteye göz at →
        </button>
      </div>
    </div>
  );
}
