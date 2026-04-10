import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import { useAuth } from '../../context/AuthContext';

interface OdemeModalProps {
  kurs: {
    id: string;
    baslik: string;
    fiyat: number;
    fiyat_turu: string;
    indirim_fiyat?: number | null;
    kategori: string;
    seviye: string;
  };
  onClose: () => void;
}

interface BankaAyarlari {
  iban: string;
  banka: string;
  hesap_sahibi: string;
}

export default function OdemeModal({ kurs, onClose }: OdemeModalProps) {
  const { user } = useAuth();
  const [ayarlar, setAyarlar] = useState<BankaAyarlari>({ iban: '', banka: '', hesap_sahibi: '' });
  const [kopyalandi, setKopyalandi] = useState(false);
  const [havaleDurum, setHavaleDurum] = useState<'yok' | 'gonderiliyor' | 'gonderildi' | 'zaten_var'>('yok');

  useEffect(() => {
    supabase
      .from('ayarlar')
      .select('anahtar, deger')
      .in('anahtar', ['iban', 'banka', 'hesap_sahibi'])
      .then(({ data }) => {
        if (data) {
          const map: any = {};
          data.forEach((r: any) => { map[r.anahtar] = r.deger; });
          setAyarlar({ iban: map.iban, banka: map.banka, hesap_sahibi: map.hesap_sahibi });
        }
      });

    // Daha önce başvuru yapılmış mı kontrol et
    if (user) {
      supabase
        .from('kurs_kayitlari')
        .select('id, durum')
        .eq('kullanici_id', user.id)
        .eq('kurs_id', kurs.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setHavaleDurum('zaten_var');
        });
    }

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, user, kurs.id]);

  const ibanKopyala = () => {
    navigator.clipboard.writeText(ayarlar.iban.replace(/\s/g, ''));
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  };

  const havaleEttim = async () => {
    if (!user) return;
    setHavaleDurum('gonderiliyor');
    const { error } = await supabase.from('kurs_kayitlari').insert({
      kullanici_id: user.id,
      kurs_id: kurs.id,
      kurs_baslik: kurs.baslik,
      kullanici_ad: user['isim soyisim'] || '',
      kullanici_mail: user.mail || '',
      durum: 'beklemede',
    });
    if (error) {
      setHavaleDurum('yok');
      alert('Bir hata oluştu, tekrar deneyin.');
    } else {
      setHavaleDurum('gonderildi');
    }
  };

  const odenecekFiyat = kurs.indirim_fiyat || kurs.fiyat;

  return (
    <div className="odeme-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="odeme-modal">
        <div className="odeme-header">
          <div>
            <div className="odeme-header-title">💳 Havale ile Ödeme</div>
            <div className="odeme-header-sub">Kayıt işlemi için aşağıdaki bilgilere havale yapın</div>
          </div>
          <button className="odeme-close" onClick={onClose}>✕</button>
        </div>

        <div className="odeme-kurs-ozet">
          <div className="odeme-kurs-icon">
            {kurs.kategori === 'Sörf' ? '🌊' : kurs.kategori === 'Snowboard' ? '🏂' : '🎯'}
          </div>
          <div>
            <div className="odeme-kurs-baslik">{kurs.baslik}</div>
            <div className="odeme-kurs-meta">{kurs.kategori} · {kurs.seviye}</div>
          </div>
          <div className="odeme-kurs-fiyat">₺{odenecekFiyat.toLocaleString('tr-TR')}</div>
        </div>

        <div className="odeme-banka-card">
          <div className="odeme-banka-header">
            <span className="odeme-banka-logo">🏦</span>
            <span className="odeme-banka-adi">{ayarlar.banka}</span>
          </div>
          <div className="odeme-banka-rows">
            <div className="odeme-banka-row">
              <span className="odeme-banka-label">Hesap Sahibi</span>
              <span className="odeme-banka-value">{ayarlar.hesap_sahibi}</span>
            </div>
            <div className="odeme-banka-row">
              <span className="odeme-banka-label">IBAN</span>
              <div className="odeme-iban-wrap">
                <span className="odeme-banka-value iban">{ayarlar.iban}</span>
                <button className={`odeme-kopyala-btn ${kopyalandi ? 'copied' : ''}`} onClick={ibanKopyala}>
                  {kopyalandi ? '✅ Kopyalandı' : '📋 Kopyala'}
                </button>
              </div>
            </div>
            <div className="odeme-banka-row">
              <span className="odeme-banka-label">Açıklama</span>
              <span className="odeme-banka-value accent">{kurs.baslik} — Kurs Kaydı</span>
            </div>
            <div className="odeme-banka-row">
              <span className="odeme-banka-label">Tutar</span>
              <span className="odeme-banka-value fiyat">₺{odenecekFiyat.toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </div>

        <div className="odeme-adimlar">
          {[
            'Yukarıdaki IBAN\'a belirtilen tutarı havale edin',
            'Açıklama kısmına kurs adınızı ve adınızı yazın',
            'Aşağıdaki "Havale Ettim" butonuna basın',
            'Admin onayladıktan sonra kursa erişiminiz açılır',
          ].map((adim, i) => (
            <div className="odeme-adim" key={i}>
              <div className="odeme-adim-num">{i + 1}</div>
              <span>{adim}</span>
            </div>
          ))}
        </div>

        {/* Havale Ettim Butonu */}
        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          {havaleDurum === 'gonderildi' ? (
            <div className="havale-basari">
              ✅ Başvurunuz alındı! Admin onayladıktan sonra kursa erişiminiz açılacak.
            </div>
          ) : havaleDurum === 'zaten_var' ? (
            <div className="havale-basari">
              ⏳ Bu kurs için başvurunuz zaten mevcut. Admin onayı bekleniyor.
            </div>
          ) : (
            <button
              className="havale-ettim-btn"
              onClick={havaleEttim}
              disabled={havaleDurum === 'gonderiliyor' || !user}
            >
              {havaleDurum === 'gonderiliyor' ? '⏳ Gönderiliyor...' : '✅ Havale Ettim, Onay Bekleyeyim'}
            </button>
          )}
          {!user && (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Başvuru yapabilmek için giriş yapmanız gerekiyor.
            </p>
          )}
        </div>

        <div className="odeme-footer-note">
          ℹ️ Sorularınız için <strong>+90 555 123 45 67</strong> numarasından bize ulaşabilirsiniz.
        </div>
      </div>
    </div>
  );
}
