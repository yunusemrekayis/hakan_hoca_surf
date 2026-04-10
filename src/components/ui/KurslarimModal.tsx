import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase/client';

interface Props {
  userId: string;
  onClose: () => void;
  onKursAc: (kurs: any) => void;
}

export default function KurslarimModal({ userId, onClose, onKursAc }: Props) {
  const [kurslar, setKurslar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKurslarim = async () => {
      const { data: kayitlar } = await supabase
        .from('kurs_kayitlari')
        .select('kurs_id, kurs_baslik, durum, created_at')
        .eq('kullanici_id', userId)
        .order('created_at', { ascending: false });

      if (!kayitlar || kayitlar.length === 0) { setLoading(false); return; }

      const kursIds = kayitlar.filter(k => k.durum === 'onaylandi').map(k => k.kurs_id);
      const tumKayitlar = kayitlar;

      if (kursIds.length > 0) {
        const { data: kursData } = await supabase
          .from('kurslar')
          .select('*')
          .in('id', kursIds);

        const merged = tumKayitlar.map(kayit => ({
          ...kayit,
          kurs: kursData?.find(k => k.id === kayit.kurs_id) || null,
        }));
        setKurslar(merged);
      } else {
        setKurslar(tumKayitlar.map(k => ({ ...k, kurs: null })));
      }
      setLoading(false);
    };
    fetchKurslarim();
  }, [userId]);

  return (
    <div className="kurslarim-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="kurslarim-modal">
        <div className="kurslarim-header">
          <div>
            <h2 className="kurslarim-title">🎓 Kurslarım</h2>
            <p className="kurslarim-sub">Kayıt olduğunuz ve erişim hakkı kazandığınız kurslar</p>
          </div>
          <button className="kurslarim-close" onClick={onClose}>✕</button>
        </div>

        <div className="kurslarim-body">
          {loading ? (
            <div className="kurslarim-loading">Yükleniyor...</div>
          ) : kurslar.length === 0 ? (
            <div className="kurslarim-empty">
              <span>📚</span>
              <p>Henüz kayıt olduğunuz bir kurs yok.</p>
            </div>
          ) : (
            kurslar.map(kayit => (
              <div key={kayit.kurs_id} className={`kurslarim-item ${kayit.durum}`}>
                <div className="kurslarim-item-icon">
                  {kayit.kurs?.thumbnail_url
                    ? <img src={kayit.kurs.thumbnail_url} alt={kayit.kurs_baslik} />
                    : <span>{kayit.kurs?.kategori === 'Sörf' ? '🌊' : '🏂'}</span>
                  }
                </div>
                <div className="kurslarim-item-info">
                  <div className="kurslarim-item-baslik">{kayit.kurs_baslik}</div>
                  <div className="kurslarim-item-tarih">
                    {new Date(kayit.created_at).toLocaleDateString('tr-TR')} tarihinde başvuruldu
                  </div>
                </div>
                <div className="kurslarim-item-right">
                  {kayit.durum === 'onaylandi' ? (
                    <button
                      className="kurslarim-ac-btn"
                      onClick={() => kayit.kurs && onKursAc(kayit.kurs)}
                    >
                      ▶ Kursa Gir
                    </button>
                  ) : kayit.durum === 'reddedildi' ? (
                    <span className="kurslarim-durum red">❌ Reddedildi</span>
                  ) : (
                    <span className="kurslarim-durum beklemede">⏳ Onay Bekleniyor</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
