import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase/client';

interface Ders {
  id: string;
  baslik: string;
  sure: string;
  video_url: string;
  ozet: string;
  siralama: number;
  bolum_id: string;
}

interface Bolum {
  id: string;
  baslik: string;
  aciklama: string;
  siralama: number;
  dersler: Ders[];
}

interface Kurs {
  id: string;
  baslik: string;
  aciklama: string;
  kisa_aciklama: string;
  kategori: string;
  seviye: string;
  dil: string;
  fiyat_turu: string;
  fiyat: number;
  indirim_fiyat: number | null;
  thumbnail_url: string;
}

interface Props {
  kurs: Kurs;
  onClose: () => void;
  onKayitOl: (kurs: Kurs) => void;
}

const KursDetay: React.FC<Props> = ({ kurs, onClose }) => {
  const [bolumler, setBolumler] = useState<Bolum[]>([]);
  const [loading, setLoading] = useState(true);
  const [aktifDers, setAktifDers] = useState<Ders | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);
  const [acikBolumler, setAcikBolumler] = useState<Set<string>>(new Set());
  const [tamamlananlar, setTamamlananlar] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      const { data: bolumData } = await supabase
        .from('kurs_bolumler')
        .select('*')
        .eq('kurs_id', kurs.id)
        .order('siralama', { ascending: true });

      const { data: dersData } = await supabase
        .from('kurs_dersler')
        .select('*')
        .eq('kurs_id', kurs.id)
        .order('siralama', { ascending: true });

      if (!bolumData) { setLoading(false); return; }

      const bolumlerWithDers = bolumData.map((b: any) => ({
        ...b,
        dersler: (dersData || []).filter((d: any) => d.bolum_id === b.id),
      }));

      setBolumler(bolumlerWithDers);

      const hepsi = new Set(bolumlerWithDers.map((b: Bolum) => b.id));
      setAcikBolumler(hepsi);

      const ilkDers = bolumlerWithDers[0]?.dersler[0];
      if (ilkDers) dersAc(ilkDers);

      setLoading(false);
    };
    fetchData();
  }, [kurs.id]);

  const getSignedUrl = async (url: string): Promise<string> => {
    try {
      if (!url.includes('backblazeb2.com')) return url;
      const afterDomain = url.split('.backblazeb2.com/')[1];
      if (!afterDomain) return url;
      const key = afterDomain.split('/').slice(1).join('/');
      if (!key) return url;
      const { data, error } = await supabase.functions.invoke('super-task', {
        body: { action: 'get-url', key },
      });
      if (error || !data?.signedUrl) return url;
      return data.signedUrl;
    } catch {
      return url;
    }
  };

  const dersAc = async (ders: Ders) => {
    setAktifDers(ders);
    setVideoUrl('');
    if (ders.video_url) {
      setVideoLoading(true);
      const signed = await getSignedUrl(ders.video_url);
      setVideoUrl(signed);
      setVideoLoading(false);
    }
  };

  const toggleBolum = (bolumId: string) => {
    setAcikBolumler(prev => {
      const next = new Set(prev);
      next.has(bolumId) ? next.delete(bolumId) : next.add(bolumId);
      return next;
    });
  };

  const dersTamamla = (dersId: string) => {
    setTamamlananlar(prev => {
      const next = new Set(prev);
      next.has(dersId) ? next.delete(dersId) : next.add(dersId);
      return next;
    });
  };

  const toplamDers = bolumler.reduce((acc, b) => acc + b.dersler.length, 0);
  const ilerleme = toplamDers > 0 ? Math.round((tamamlananlar.size / toplamDers) * 100) : 0;

  const sonrakiDers = () => {
    if (!aktifDers) return;
    const tumDersler = bolumler.flatMap(b => b.dersler);
    const idx = tumDersler.findIndex(d => d.id === aktifDers.id);
    if (idx < tumDersler.length - 1) dersAc(tumDersler[idx + 1]);
  };

  const oncekiDers = () => {
    if (!aktifDers) return;
    const tumDersler = bolumler.flatMap(b => b.dersler);
    const idx = tumDersler.findIndex(d => d.id === aktifDers.id);
    if (idx > 0) dersAc(tumDersler[idx - 1]);
  };

  return (
    <div className="ogr-overlay">
      {/* Üst Bar */}
      <div className="ogr-topbar">
        <button className="ogr-back" onClick={onClose}>
          ← Geri
        </button>
        <div className="ogr-topbar-kurs">
          <span className="ogr-topbar-kategori">
            {kurs.kategori === 'Sörf' ? '🌊' : '🏂'} {kurs.kategori}
          </span>
          <span className="ogr-topbar-baslik">{kurs.baslik}</span>
        </div>
        <div className="ogr-topbar-ilerleme">
          <span className="ogr-ilerleme-text">{ilerleme}% tamamlandı</span>
          <div className="ogr-ilerleme-bar">
            <div className="ogr-ilerleme-fill" style={{ width: `${ilerleme}%` }} />
          </div>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="ogr-body">
        {/* Sol: Video Alanı */}
        <div className="ogr-main">
          {/* Video */}
          <div className="ogr-video-wrap">
            {videoLoading ? (
              <div className="ogr-video-loading">
                <div className="ogr-spinner" />
                <span>Video yükleniyor...</span>
              </div>
            ) : videoUrl ? (
              <video
                key={videoUrl}
                className="ogr-video"
                src={videoUrl}
                controls
                autoPlay
                preload="metadata"
              />
            ) : (
              <div className="ogr-video-bos">
                <span>{kurs.kategori === 'Sörf' ? '🌊' : '🏂'}</span>
                <p>{loading ? 'Yükleniyor...' : 'Sağdan bir ders seçin'}</p>
              </div>
            )}
          </div>

          {/* Video Navigasyon */}
          {aktifDers && (
            <div className="ogr-nav-bar">
              <button className="ogr-nav-btn" onClick={oncekiDers}>← Önceki Ders</button>
              <button
                className={`ogr-tamamla-btn ${tamamlananlar.has(aktifDers.id) ? 'tamamlandi' : ''}`}
                onClick={() => dersTamamla(aktifDers.id)}
              >
                {tamamlananlar.has(aktifDers.id) ? '✅ Tamamlandı' : '○ Tamamlandı İşaretle'}
              </button>
              <button className="ogr-nav-btn" onClick={sonrakiDers}>Sonraki Ders →</button>
            </div>
          )}

          {/* Ders Bilgisi */}
          {aktifDers && (
            <div className="ogr-ders-bilgi">
              <div className="ogr-ders-bilgi-header">
                <div>
                  <h2 className="ogr-ders-baslik">{aktifDers.baslik}</h2>
                  {aktifDers.sure && (
                    <span className="ogr-ders-sure">⏱ {aktifDers.sure}</span>
                  )}
                </div>
              </div>
              {aktifDers.ozet && (
                <div className="ogr-ders-ozet">
                  <h4>Ders Özeti</h4>
                  <p>{aktifDers.ozet}</p>
                </div>
              )}
              {kurs.aciklama && (
                <div className="ogr-ders-ozet" style={{ marginTop: '1rem' }}>
                  <h4>Kurs Hakkında</h4>
                  <p>{kurs.aciklama}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sağ: Müfredat */}
        <div className="ogr-sidebar">
          <div className="ogr-sidebar-header">
            <h3>📋 Müfredat</h3>
            <span className="ogr-sidebar-count">{toplamDers} ders</span>
          </div>

          {loading ? (
            <div className="ogr-sidebar-loading">Yükleniyor...</div>
          ) : bolumler.length === 0 ? (
            <div className="ogr-sidebar-bos">Henüz ders eklenmemiş.</div>
          ) : (
            <div className="ogr-mufredat">
              {bolumler.map((bolum, bi) => (
                <div key={bolum.id} className="ogr-bolum">
                  <button
                    className="ogr-bolum-header"
                    onClick={() => toggleBolum(bolum.id)}
                  >
                    <div className="ogr-bolum-sol">
                      <span className="ogr-bolum-no">{bi + 1}</span>
                      <span className="ogr-bolum-baslik">{bolum.baslik}</span>
                    </div>
                    <div className="ogr-bolum-sag">
                      <span className="ogr-bolum-count">{bolum.dersler.length} ders</span>
                      <span className="ogr-bolum-toggle">{acikBolumler.has(bolum.id) ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {acikBolumler.has(bolum.id) && (
                    <div className="ogr-dersler">
                      {bolum.dersler.map((ders) => (
                        <button
                          key={ders.id}
                          className={`ogr-ders-item ${aktifDers?.id === ders.id ? 'aktif' : ''} ${tamamlananlar.has(ders.id) ? 'tamamlandi' : ''}`}
                          onClick={() => dersAc(ders)}
                        >
                          <div className="ogr-ders-item-sol">
                            <span className="ogr-ders-check">
                              {tamamlananlar.has(ders.id) ? '✅' : aktifDers?.id === ders.id ? '▶️' : '○'}
                            </span>
                            <span className="ogr-ders-item-baslik">{ders.baslik}</span>
                          </div>
                          {ders.sure && (
                            <span className="ogr-ders-item-sure">{ders.sure}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KursDetay;
