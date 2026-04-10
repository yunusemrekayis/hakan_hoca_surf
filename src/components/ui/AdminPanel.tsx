import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import { KullaniciUser, useAuth } from '../../context/AuthContext';
import KurslarPanel from './KurslarPanel';

function IbanAyarlari() {
  const [form, setForm] = useState({ iban: '', banka: '', hesap_sahibi: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase
      .from('ayarlar')
      .select('anahtar, deger')
      .in('anahtar', ['iban', 'banka', 'hesap_sahibi'])
      .then(({ data }) => {
        if (data) {
          const map: any = {};
          data.forEach((r: any) => { map[r.anahtar] = r.deger; });
          setForm({ iban: map.iban || '', banka: map.banka || '', hesap_sahibi: map.hesap_sahibi || '' });
        }
      });
  }, []);

  const kaydet = async () => {
    setSaving(true);
    const entries = [
      { anahtar: 'iban', deger: form.iban },
      { anahtar: 'banka', deger: form.banka },
      { anahtar: 'hesap_sahibi', deger: form.hesap_sahibi },
    ];
    for (const entry of entries) {
      await supabase.from('ayarlar').upsert(entry, { onConflict: 'anahtar' });
    }
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="iban-ayarlar-wrap">
      <div className="iban-ayarlar-card">
        <div className="iban-ayarlar-title">🏦 Banka / IBAN Bilgileri</div>
        <div className="iban-ayarlar-grid">
          <div className="iban-field">
            <label>Banka Adı</label>
            <input
              type="text"
              value={form.banka}
              onChange={e => setForm(f => ({ ...f, banka: e.target.value }))}
              placeholder="Örn: Vakıfbank"
            />
          </div>
          <div className="iban-field">
            <label>Hesap Sahibi</label>
            <input
              type="text"
              value={form.hesap_sahibi}
              onChange={e => setForm(f => ({ ...f, hesap_sahibi: e.target.value }))}
              placeholder="Ad Soyad"
            />
          </div>
          <div className="iban-field">
            <label>IBAN</label>
            <input
              type="text"
              value={form.iban}
              onChange={e => setForm(f => ({ ...f, iban: e.target.value }))}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
            />
          </div>
          {success && <div className="iban-success-msg">✅ Bilgiler başarıyla kaydedildi!</div>}
          <button className="iban-save-btn" onClick={kaydet} disabled={saving}>
            {saving ? 'Kaydediliyor...' : '💾 Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const { user } = useAuth();
  const [kullanicilar, setKullanicilar] = useState<KullaniciUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kullanicilar' | 'kurslar' | 'istatistikler' | 'odeme' | 'onaylar'>('kullanicilar');
  const [kayitlar, setKayitlar] = useState<any[]>([]);
  const [kayitlarLoading, setKayitlarLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchKullanicilar();
  }, []);

  const fetchKullanicilar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('kullanıcılar')
      .select('id, "isim soyisim", mail, created_at, rol')
      .order('created_at', { ascending: false });
    if (data) setKullanicilar(data as KullaniciUser[]);
    setLoading(false);
  };

  const rolDegistir = async (id: string, yeniRol: 'admin' | 'kullanici') => {
    // Kendi rolünü değiştirmeyi engelle
    if (id === user?.id) return;
    await supabase
      .from('kullanıcılar')
      .update({ rol: yeniRol })
      .eq('id', id);
    setKullanicilar(prev =>
      prev.map(k => k.id === id ? { ...k, rol: yeniRol } : k)
    );
  };

  const kullanicisil = async (id: string) => {
    if (id === user?.id) return;
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    await supabase.from('kullanıcılar').delete().eq('id', id);
    setKullanicilar(prev => prev.filter(k => k.id !== id));
  };

  const filtered = kullanicilar.filter(k =>
    k['isim soyisim'].toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.mail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adminSayisi = kullanicilar.filter(k => k.rol === 'admin').length;
  const kullaniciSayisi = kullanicilar.filter(k => k.rol === 'kullanici').length;

  const fetchKayitlar = async () => {
    setKayitlarLoading(true);
    const { data } = await supabase
      .from('kurs_kayitlari')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setKayitlar(data);
    setKayitlarLoading(false);
  };

  const kayitOnay = async (id: string, durum: 'onaylandi' | 'reddedildi') => {
    await supabase
      .from('kurs_kayitlari')
      .update({ durum, onay_tarihi: new Date().toISOString() })
      .eq('id', id);
    setKayitlar(prev => prev.map(k => k.id === id ? { ...k, durum } : k));
  };

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        {/* Header */}
        <div className="admin-header">
          <div>
            <div className="admin-header-title">🛡️ Admin Paneli</div>
            <div className="admin-header-sub">Hakan Abay Akademi Yönetim Sistemi</div>
          </div>
          <button className="admin-close" onClick={onClose}>✕ Kapat</button>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'kullanicilar' ? 'active' : ''}`}
            onClick={() => setActiveTab('kullanicilar')}
          >
            👥 Kullanıcılar ({kullanicilar.length})
          </button>
          <button
            className={`admin-tab ${activeTab === 'kurslar' ? 'active' : ''}`}
            onClick={() => setActiveTab('kurslar')}
          >
            🎓 Kurslar
          </button>
          <button
            className={`admin-tab ${activeTab === 'istatistikler' ? 'active' : ''}`}
            onClick={() => setActiveTab('istatistikler')}
          >
            📊 İstatistikler
          </button>
          <button
            className={`admin-tab ${activeTab === 'odeme' ? 'active' : ''}`}
            onClick={() => setActiveTab('odeme')}
          >
            💳 Ödeme
          </button>
          <button
            className={`admin-tab ${activeTab === 'onaylar' ? 'active' : ''}`}
            onClick={() => { setActiveTab('onaylar'); fetchKayitlar(); }}
          >
            ✅ Onaylar {kayitlar.filter(k => k.durum === 'beklemede').length > 0 && `(${kayitlar.filter(k => k.durum === 'beklemede').length})`}
          </button>
        </div>

        {/* Kullanıcılar Tab */}
        {activeTab === 'kullanicilar' && (
          <div className="admin-content">
            <div className="admin-search-bar">
              <span>🔍</span>
              <input
                type="text"
                placeholder="İsim veya e-posta ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button className="admin-refresh-btn" onClick={fetchKullanicilar}>↻ Yenile</button>
            </div>

            {loading ? (
              <div className="admin-loading">Yükleniyor...</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ad Soyad</th>
                      <th>E-posta</th>
                      <th>Kayıt Tarihi</th>
                      <th>Rol</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(k => (
                      <tr key={k.id} className={k.id === user?.id ? 'admin-table-self' : ''}>
                        <td>
                          <div className="admin-user-name">
                            <div className="admin-avatar">
                              {k['isim soyisim'].charAt(0).toUpperCase()}
                            </div>
                            {k['isim soyisim']}
                            {k.id === user?.id && <span className="admin-you-badge">Sen</span>}
                          </div>
                        </td>
                        <td className="admin-mail">{k.mail}</td>
                        <td className="admin-date">
                          {new Date(k.created_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td>
                          <span className={`admin-role-badge ${k.rol}`}>
                            {k.rol === 'admin' ? '🛡️ Admin' : '👤 Kullanıcı'}
                          </span>
                        </td>
                        <td>
                          {k.id !== user?.id ? (
                            <div className="admin-actions">
                              <button
                                className={`admin-action-btn ${k.rol === 'admin' ? 'demote' : 'promote'}`}
                                onClick={() => rolDegistir(k.id, k.rol === 'admin' ? 'kullanici' : 'admin')}
                              >
                                {k.rol === 'admin' ? 'Yetkiyi Al' : 'Admin Yap'}
                              </button>
                              <button
                                className="admin-action-btn delete"
                                onClick={() => kullanicisil(k.id)}
                              >
                                Sil
                              </button>
                            </div>
                          ) : (
                            <span className="admin-no-action">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="admin-empty">Kullanıcı bulunamadı.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Kurslar Tab */}
        {activeTab === 'kurslar' && (
          <div className="admin-content">
            <KurslarPanel />
          </div>
        )}

        {/* Onaylar Tab */}
        {activeTab === 'onaylar' && (
          <div className="admin-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Kurs Kayıt Başvuruları</h3>
              <button className="admin-refresh-btn" onClick={fetchKayitlar}>↻ Yenile</button>
            </div>
            {kayitlarLoading ? (
              <div className="admin-loading">Yükleniyor...</div>
            ) : kayitlar.length === 0 ? (
              <div className="admin-empty">Henüz başvuru yok.</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Kullanıcı</th>
                      <th>E-posta</th>
                      <th>Kurs</th>
                      <th>Tarih</th>
                      <th>Durum</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kayitlar.map(k => (
                      <tr key={k.id}>
                        <td>{k.kullanici_ad || '—'}</td>
                        <td className="admin-mail">{k.kullanici_mail || '—'}</td>
                        <td><strong>{k.kurs_baslik}</strong></td>
                        <td className="admin-date">{new Date(k.created_at).toLocaleDateString('tr-TR')}</td>
                        <td>
                          <span className={`admin-role-badge ${k.durum === 'onaylandi' ? 'admin' : k.durum === 'reddedildi' ? 'delete' : 'beklemede'}`}>
                            {k.durum === 'onaylandi' ? '✅ Onaylandı' : k.durum === 'reddedildi' ? '❌ Reddedildi' : '⏳ Beklemede'}
                          </span>
                        </td>
                        <td>
                          {k.durum === 'beklemede' && (
                            <div className="admin-actions">
                              <button className="admin-action-btn promote" onClick={() => kayitOnay(k.id, 'onaylandi')}>Onayla</button>
                              <button className="admin-action-btn delete" onClick={() => kayitOnay(k.id, 'reddedildi')}>Reddet</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Ödeme Ayarları Tab */}
        {activeTab === 'odeme' && (
          <div className="admin-content">
            <IbanAyarlari />
          </div>
        )}

        {/* İstatistikler Tab */}
        {activeTab === 'istatistikler' && (
          <div className="admin-content">
            <div className="admin-stats-grid">
              {[
                { icon: '👥', label: 'Toplam Kullanıcı', value: kullanicilar.length, color: '#0077b6' },
                { icon: '🛡️', label: 'Admin Sayısı', value: adminSayisi, color: '#7c3aed' },
                { icon: '👤', label: 'Normal Kullanıcı', value: kullaniciSayisi, color: '#059669' },
                {
                  icon: '📅',
                  label: 'Bu Ay Kayıt',
                  value: kullanicilar.filter(k => {
                    const d = new Date(k.created_at);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length,
                  color: '#d97706',
                },
              ].map(s => (
                <div className="admin-stat-card" key={s.label} style={{ borderColor: s.color }}>
                  <div className="admin-stat-icon">{s.icon}</div>
                  <div className="admin-stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="admin-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="admin-recent">
              <div className="admin-recent-title">🕐 Son Kayıt Olan Kullanıcılar</div>
              {kullanicilar.slice(0, 5).map(k => (
                <div className="admin-recent-item" key={k.id}>
                  <div className="admin-avatar sm">{k['isim soyisim'].charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="admin-recent-name">{k['isim soyisim']}</div>
                    <div className="admin-recent-mail">{k.mail}</div>
                  </div>
                  <div className="admin-recent-date">
                    {new Date(k.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
