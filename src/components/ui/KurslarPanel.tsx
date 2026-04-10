import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import KursDetay from './KursDetay';

interface Kurs {
  id: string;
  baslik: string;
  kisa_aciklama: string;
  aciklama: string;
  kategori: string;
  seviye: string;
  dil: string;
  fiyat_turu: 'paid' | 'free';
  fiyat: number;
  indirim_fiyat: number | null;
  thumbnail_url: string;
  durum: 'active' | 'pending' | 'draft';
  created_at: string;
}

interface KursBolumu {
  id: string;
  baslik: string;
  aciklama: string;
  siralama: number;
}

interface KursDersi {
  id: string;
  bolum_id: string;
  baslik: string;
  ozet: string;
  video_url: string;
  sure: string;
  siralama: number;
}

const BOSH_KURS: Omit<Kurs, 'id' | 'created_at'> = {
  baslik: '',
  kisa_aciklama: '',
  aciklama: '',
  kategori: '',
  seviye: 'Başlangıç',
  dil: 'Türkçe',
  fiyat_turu: 'paid',
  fiyat: 0,
  indirim_fiyat: null,
  thumbnail_url: '',
  durum: 'pending',
};

type View = 'list' | 'form';

export default function KurslarPanel() {
  const [kurslar, setKurslar] = useState<Kurs[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [seciliKurs, setSeciliKurs] = useState<Kurs | null>(null);
  const [detayKurs, setDetayKurs] = useState<Kurs | null>(null);
  const [form, setForm] = useState({ ...BOSH_KURS });
  const [kaydetLoading, setKaydetLoading] = useState(false);
  const [hata, setHata] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [bolumler, setBolumler] = useState<KursBolumu[]>([]);
  const [dersler, setDersler] = useState<KursDersi[]>([]);
  const [bolumForm, setBolumForm] = useState({ baslik: '', aciklama: '' });
  const [dersModalOpen, setDersModalOpen] = useState(false);
  const [seciliDers, setSeciliDers] = useState<KursDersi | null>(null);
  const [videoUploadLoading, setVideoUploadLoading] = useState(false);
  const [videoUploadMesaj, setVideoUploadMesaj] = useState('');
  const [videoUploadMesajTip, setVideoUploadMesajTip] = useState<'success' | 'error' | ''>('');
  const [previewSignedUrl, setPreviewSignedUrl] = useState('');
  const [dersForm, setDersForm] = useState({
    bolum_id: '',
    baslik: '',
    ozet: '',
    video_url: '',
    sure: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dersVideoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchKurslar();
  }, []);

  const toplamDers = dersler.length;
  const toplamBolum = bolumler.length;
  const mufredatTamam = useMemo(() => bolumler.every(b => dersler.some(d => d.bolum_id === b.id)), [bolumler, dersler]);

  const fetchKurslar = async () => {
    setLoading(true);
    const { data } = await supabase.from('kurslar').select('*').order('created_at', { ascending: false });
    if (data) setKurslar(data as Kurs[]);
    setLoading(false);
  };

  const fetchMufredat = async (kursId: string) => {
    const { data: bolumData, error: bolumErr } = await supabase
      .from('kurs_bolumler')
      .select('*')
      .eq('kurs_id', kursId)
      .order('siralama', { ascending: true });

    if (bolumErr) {
      setHata('Bolumler yuklenemedi. Supabase tablosu kontrol edilmeli: kurs_bolumler.');
      setBolumler([]);
      setDersler([]);
      return;
    }

    const { data: dersData, error: dersErr } = await supabase
      .from('kurs_dersler')
      .select('*')
      .eq('kurs_id', kursId)
      .order('siralama', { ascending: true });

    if (dersErr) {
      setHata('Dersler yuklenemedi. Supabase tablosu kontrol edilmeli: kurs_dersler.');
      setBolumler((bolumData || []) as KursBolumu[]);
      setDersler([]);
      return;
    }

    setBolumler((bolumData || []) as KursBolumu[]);
    setDersler((dersData || []) as KursDersi[]);
  };

  const gorselYukle = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setHata('Lutfen bir gorsel dosyasi secin.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setHata('Dosya 5MB dan kucuk olmalidir.');
      return;
    }
    setUploadLoading(true);
    setHata('');
    const ext = file.name.split('.').pop();
    const dosyaAdi = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('kurs-gorselleri').upload(dosyaAdi, file, { upsert: true });
    if (error) {
      setHata(`Gorsel yuklenemedi: ${error.message}`);
      setUploadLoading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('kurs-gorselleri').getPublicUrl(dosyaAdi);
    setForm(p => ({ ...p, thumbnail_url: urlData.publicUrl }));
    setUploadLoading(false);
  };

  const dersVideoYukle = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setHata('Lutfen bir video dosyasi secin.');
      setVideoUploadMesaj('Lutfen bir video dosyasi secin.');
      setVideoUploadMesajTip('error');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setHata('Video dosyasi 500MB dan kucuk olmalidir.');
      setVideoUploadMesaj('Video dosyasi 500MB dan kucuk olmalidir.');
      setVideoUploadMesajTip('error');
      return;
    }
    setVideoUploadLoading(true);
    setVideoUploadMesaj('Yukleniyor...');
    setVideoUploadMesajTip('');
    setHata('');

    try {
      // 1. Edge function'dan presigned URL al
      const { data: json, error: fnError } = await supabase.functions.invoke('super-task', {
        body: { fileName: file.name, contentType: file.type },
      });

      if (fnError) throw new Error(fnError.message);
      if (json?.error) throw new Error(json.error);

      // 2. Presigned URL ile direkt B2'ye yükle
      const uploadResp = await fetch(json.presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResp.ok) {
        const errText = await uploadResp.text();
        throw new Error(errText);
      }

      const sure = await dosyaSuresiOku(file);
      setDersForm(prev => ({ ...prev, video_url: json.downloadUrl, sure }));
      const signed = await getSignedVideoUrl(json.downloadUrl);
      setPreviewSignedUrl(signed);
      setVideoUploadMesaj('Video basariyla yuklendi.');
      setVideoUploadMesajTip('success');
      setVideoUploadLoading(false);
    } catch (err: any) {
      setHata(`Video yuklenemedi: ${err?.message || 'Bilinmeyen hata'}`);
      setVideoUploadMesaj(`Yukleme basarisiz: ${err?.message || 'Bilinmeyen hata'}`);
      setVideoUploadMesajTip('error');
      setVideoUploadLoading(false);
    }
  };

  const cloudflareIframeUrl = (_urlOrUid: string) => '';

  const getSignedVideoUrl = async (url: string): Promise<string> => {
    try {
      // URL: https://s3.eu-central-003.backblazeb2.com/hakan-hoca-videos/videos/xxx.mp4
      // Key: videos/xxx.mp4 (bucket adı olmadan)
      const afterDomain = url.split('.backblazeb2.com/')[1];
      if (!afterDomain) return url;
      const key = afterDomain.split('/').slice(1).join('/'); // bucket adını atla
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

  const dosyaSha1 = async (buffer: ArrayBuffer): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const dosyaSuresiOku = (file: File): Promise<string> => {
    return new Promise(resolve => {
      const video = document.createElement('video');
      const objectUrl = URL.createObjectURL(file);
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const toplamSaniye = Math.floor(video.duration || 0);
        URL.revokeObjectURL(objectUrl);
        const saat = Math.floor(toplamSaniye / 3600);
        const dakika = Math.floor((toplamSaniye % 3600) / 60);
        const saniye = toplamSaniye % 60;
        if (saat > 0) {
          resolve(`${String(saat).padStart(2, '0')}:${String(dakika).padStart(2, '0')}:${String(saniye).padStart(2, '0')}`);
          return;
        }
        resolve(`${String(dakika).padStart(2, '0')}:${String(saniye).padStart(2, '0')}`);
      };
      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve('');
      };
      video.src = objectUrl;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) gorselYukle(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) gorselYukle(file);
  };

  const yeniKursAc = () => {
    setSeciliKurs(null);
    setForm({ ...BOSH_KURS });
    setBolumler([]);
    setDersler([]);
    setBolumForm({ baslik: '', aciklama: '' });
    setHata('');
    setView('form');
  };

  const duzenle = async (kurs: Kurs) => {
    setSeciliKurs(kurs);
    setForm({
      baslik: kurs.baslik,
      kisa_aciklama: kurs.kisa_aciklama,
      aciklama: kurs.aciklama,
      kategori: kurs.kategori,
      seviye: kurs.seviye,
      dil: kurs.dil,
      fiyat_turu: kurs.fiyat_turu,
      fiyat: kurs.fiyat,
      indirim_fiyat: kurs.indirim_fiyat,
      thumbnail_url: kurs.thumbnail_url,
      durum: kurs.durum,
    });
    setHata('');
    setView('form');
    await fetchMufredat(kurs.id);
  };

  const bolumEkle = () => {
    if (!bolumForm.baslik.trim()) {
      setHata('Bolum basligi zorunludur.');
      return;
    }
    setHata('');
    setBolumler(prev => [
      ...prev,
      {
        id: `section-${Date.now()}`,
        baslik: bolumForm.baslik,
        aciklama: bolumForm.aciklama,
        siralama: prev.length + 1,
      },
    ]);
    setBolumForm({ baslik: '', aciklama: '' });
  };

  const bolumSil = (bolumId: string) => {
    setBolumler(prev => prev.filter(b => b.id !== bolumId));
    setDersler(prev => prev.filter(d => d.bolum_id !== bolumId));
  };

  const dersModalTemizle = () => {
    setSeciliDers(null);
    setDersForm({
      bolum_id: bolumler[0]?.id || '',
      baslik: '',
      ozet: '',
      video_url: '',
      sure: '',
    });
    setVideoUploadMesaj('');
    setVideoUploadMesajTip('');
    setPreviewSignedUrl('');
  };

  const dersModalAc = (ders?: KursDersi) => {
    if (ders) {
      setSeciliDers(ders);
      setDersForm({
        bolum_id: ders.bolum_id,
        baslik: ders.baslik,
        ozet: ders.ozet,
        video_url: ders.video_url,
        sure: ders.sure,
      });
    } else {
      dersModalTemizle();
    }
    setDersModalOpen(true);
  };

  const dersKaydet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dersForm.baslik.trim()) {
      setHata('Ders basligi zorunludur.');
      return;
    }
    if (!dersForm.bolum_id) {
      setHata('Ders icin bir bolum secmelisiniz.');
      return;
    }
    if (!dersForm.video_url.trim()) {
      setHata('Lutfen ders videosu ekleyin.');
      return;
    }
    setHata('');

    const bolumDersSayisi = dersler.filter(d => d.bolum_id === dersForm.bolum_id).length;
    if (seciliDers) {
      setDersler(prev =>
        prev.map(d =>
          d.id === seciliDers.id
            ? {
                ...d,
                bolum_id: dersForm.bolum_id,
                baslik: dersForm.baslik,
                ozet: dersForm.ozet,
                video_url: dersForm.video_url,
                sure: dersForm.sure,
              }
            : d
        )
      );
    } else {
      setDersler(prev => [
        ...prev,
        {
          id: `lesson-${Date.now()}`,
          bolum_id: dersForm.bolum_id,
          baslik: dersForm.baslik,
          ozet: dersForm.ozet,
          video_url: dersForm.video_url,
          sure: dersForm.sure,
          siralama: bolumDersSayisi + 1,
        },
      ]);
    }

    setDersModalOpen(false);
    dersModalTemizle();
  };

  const dersSil = (id: string) => {
    setDersler(prev => prev.filter(d => d.id !== id));
  };

  const kaydetMufredat = async (kursId: string) => {
    const bolumPayload = bolumler.map((b, index) => ({
      kurs_id: kursId,
      baslik: b.baslik,
      aciklama: b.aciklama,
      siralama: index + 1,
    }));

    const { error: delDersErr } = await supabase.from('kurs_dersler').delete().eq('kurs_id', kursId);
    if (delDersErr) throw new Error(delDersErr.message);
    const { error: delBolumErr } = await supabase.from('kurs_bolumler').delete().eq('kurs_id', kursId);
    if (delBolumErr) throw new Error(delBolumErr.message);

    if (bolumPayload.length === 0) return;

    const { data: yeniBolumler, error: bolumInsertErr } = await supabase
      .from('kurs_bolumler')
      .insert(bolumPayload)
      .select('id, baslik, siralama');

    if (bolumInsertErr) throw new Error(bolumInsertErr.message);

    const bolumMap = new Map<string, string>();
    bolumler.forEach((localB, i) => {
      const remoteB = (yeniBolumler || []).find((rb: any) => rb.siralama === i + 1);
      if (remoteB) bolumMap.set(localB.id, remoteB.id);
    });

    const dersPayload = dersler
      .map(d => ({
        kurs_id: kursId,
        bolum_id: bolumMap.get(d.bolum_id),
        baslik: d.baslik,
        ozet: d.ozet,
        video_url: d.video_url,
        sure: d.sure,
        siralama: d.siralama || 1,
      }))
      .filter(d => d.bolum_id);

    if (dersPayload.length > 0) {
      const { error: dersInsertErr } = await supabase.from('kurs_dersler').insert(dersPayload);
      if (dersInsertErr) throw new Error(dersInsertErr.message);
    }
  };

  const sil = async (id: string) => {
    if (!window.confirm('Bu kursu silmek istediginize emin misiniz?')) return;
    await supabase.from('kurs_dersler').delete().eq('kurs_id', id);
    await supabase.from('kurs_bolumler').delete().eq('kurs_id', id);
    await supabase.from('kurslar').delete().eq('id', id);
    setKurslar(prev => prev.filter(k => k.id !== id));
  };

  const kaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata('');
    if (!form.baslik.trim()) {
      setHata('Kurs basligi zorunludur.');
      return;
    }
    if (bolumler.length === 0) {
      setHata('En az bir bolum eklemelisiniz.');
      return;
    }
    if (!mufredatTamam) {
      setHata('Her bolume en az bir ders ekleyin.');
      return;
    }

    setKaydetLoading(true);
    try {
      let kursId = seciliKurs?.id || '';

      if (seciliKurs) {
        const { error } = await supabase.from('kurslar').update(form).eq('id', seciliKurs.id);
        if (error) throw new Error(error.message);
        setKurslar(prev => prev.map(k => (k.id === seciliKurs.id ? { ...k, ...form } : k)));
      } else {
        const { data, error } = await supabase.from('kurslar').insert(form).select('*').single();
        if (error) throw new Error(error.message);
        kursId = (data as Kurs).id;
        setKurslar(prev => [data as Kurs, ...prev]);
      }

      await kaydetMufredat(kursId);
      setView('list');
    } catch (err: any) {
      setHata(`Kayit hatasi: ${err?.message || 'Bilinmeyen hata'}`);
    } finally {
      setKaydetLoading(false);
    }
  };

  const durumRenk = (durum: string) => {
    if (durum === 'active') return 'kurs-durum active';
    if (durum === 'pending') return 'kurs-durum pending';
    return 'kurs-durum draft';
  };

  const durumLabel = (durum: string) => {
    if (durum === 'active') return 'Aktif';
    if (durum === 'pending') return 'Bekliyor';
    return 'Taslak';
  };

  const filtered = kurslar.filter(
    k =>
      k.baslik.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.kategori?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dersModal = dersModalOpen ? (
    <div className="ders-modal-overlay" onClick={() => setDersModalOpen(false)}>
      <div className="ders-modal" onClick={e => e.stopPropagation()}>
        <div className="ders-modal-head">
          <div>
            <div className="ders-modal-title">{seciliDers ? 'Dersi Duzenle' : 'Yeni Ders Ekle'}</div>
            <div className="ders-modal-sub">Lokalden video yukleyip derse baglayabilirsiniz</div>
          </div>
          <button className="ders-modal-close" onClick={() => setDersModalOpen(false)}>x</button>
        </div>

        <form className="ders-modal-body" onSubmit={dersKaydet}>
          <div className="ders-field">
            <label>Bagli Bolum</label>
            <select value={dersForm.bolum_id} onChange={e => setDersForm(prev => ({ ...prev, bolum_id: e.target.value }))} required>
              <option value="">Bolum secin</option>
              {bolumler.map(b => (
                <option key={b.id} value={b.id}>{b.baslik}</option>
              ))}
            </select>
            {bolumler.length === 0 && (
              <div className="ders-upload-msg error">
                Once kursa en az bir bolum ekleyin, sonra dersi bu bolume baglayin.
              </div>
            )}
          </div>

          <div className="ders-field">
            <label>Ders Basligi</label>
            <input type="text" value={dersForm.baslik} onChange={e => setDersForm(prev => ({ ...prev, baslik: e.target.value }))} required />
          </div>

          <div className="ders-field">
            <label>Video Adresi</label>
            <div className="ders-video-row">
              <input type="text" placeholder="https://..." value={dersForm.video_url} onChange={e => setDersForm(prev => ({ ...prev, video_url: e.target.value }))} />
              <input
                ref={dersVideoInputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) dersVideoYukle(file);
                }}
              />
                  <button type="button" className="ders-upload-btn" onClick={() => dersVideoInputRef.current?.click()} disabled={videoUploadLoading}>
                    {videoUploadLoading ? 'Yukleniyor...' : 'Cloudflare\'a Yukle'}
              </button>
            </div>
            {videoUploadMesaj && (
              <div className={`ders-upload-msg ${videoUploadMesajTip}`}>
                {videoUploadMesaj}
              </div>
            )}
          </div>

          <div className="ders-field">
            <label>Sure</label>
            <input type="text" placeholder="Orn: 12:35" value={dersForm.sure} onChange={e => setDersForm(prev => ({ ...prev, sure: e.target.value }))} />
          </div>

          <div className="ders-field">
            <label>Ozet</label>
            <textarea rows={4} value={dersForm.ozet} onChange={e => setDersForm(prev => ({ ...prev, ozet: e.target.value }))} />
          </div>

          {dersForm.video_url && !cloudflareIframeUrl(dersForm.video_url) && (
            <div className="ders-preview-wrap">
              <video className="ders-preview-video" src={previewSignedUrl || dersForm.video_url} controls preload="metadata" />
            </div>
          )}

          {cloudflareIframeUrl(dersForm.video_url) && (
            <div className="ders-preview-wrap">
              <iframe
                title="Cloudflare video onizleme"
                src={cloudflareIframeUrl(dersForm.video_url)}
                className="ders-preview-video"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              />
            </div>
          )}

          <div className="ders-modal-actions">
            {seciliDers && <button type="button" className="ders-delete-btn" onClick={() => { dersSil(seciliDers.id); setDersModalOpen(false); }}>Dersi Sil</button>}
            <button type="submit" className="ders-save-btn">{seciliDers ? 'Dersi Guncelle' : 'Dersi Ekle'}</button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  if (view === 'form') {
    return (
      <div className="kurs-form-wrap">
        <div className="kurs-form-header">
          <button className="kurs-back-btn" onClick={() => setView('list')}>← Geri</button>
          <h2 className="kurs-form-title">{seciliKurs ? 'Kursu Duzenle' : 'Yeni Kurs Ekle'}</h2>
        </div>

        <form onSubmit={kaydet} className="kurs-form">
          <div className="kurs-form-grid">
            <div className="kurs-form-left">
              <div className="kf-group">
                <label>Kurs Basligi *</label>
                <input type="text" value={form.baslik} onChange={e => setForm(p => ({ ...p, baslik: e.target.value }))} required />
              </div>

              <div className="kf-group">
                <label>Kisa Aciklama</label>
                <input type="text" value={form.kisa_aciklama} onChange={e => setForm(p => ({ ...p, kisa_aciklama: e.target.value }))} />
              </div>

              <div className="kf-group">
                <label>Detayli Aciklama</label>
                <textarea value={form.aciklama} onChange={e => setForm(p => ({ ...p, aciklama: e.target.value }))} rows={6} />
              </div>

              <div className="kf-group">
                <label>Kurs Kapak Gorseli</label>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                {form.thumbnail_url ? (
                  <div className="kf-upload-preview">
                    <img src={form.thumbnail_url} alt="kapak" className="kf-thumbnail-preview" />
                    <div className="kf-upload-preview-actions">
                      <button type="button" className="kf-change-btn" onClick={() => fileInputRef.current?.click()} disabled={uploadLoading}>
                        Degistir
                      </button>
                      <button type="button" className="kf-remove-btn" onClick={() => setForm(p => ({ ...p, thumbnail_url: '' }))}>
                        Kaldir
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`kf-upload-area ${dragOver ? 'drag-over' : ''} ${uploadLoading ? 'uploading' : ''}`}
                    onClick={() => !uploadLoading && fileInputRef.current?.click()}
                    onDragOver={e => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <div className="kf-upload-icon">🖼️</div>
                    <p className="kf-upload-text"><strong>Tikla</strong> veya surukle birak</p>
                    <p className="kf-upload-hint">PNG, JPG, WEBP - Maks. 5MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="kurs-form-right">
              <div className="kf-group">
                <label>Kategori</label>
                <select value={form.kategori} onChange={e => setForm(p => ({ ...p, kategori: e.target.value }))}>
                  <option value="">Bir kategori secin</option>
                  <option value="Sörf">Sorf</option>
                  <option value="Snowboard">Snowboard</option>
                  <option value="Combo">Combo</option>
                  <option value="Özel Ders">Ozel Ders</option>
                </select>
              </div>

              <div className="kf-group">
                <label>Ders Seviyesi</label>
                <select value={form.seviye} onChange={e => setForm(p => ({ ...p, seviye: e.target.value }))}>
                  <option value="Başlangıç">Baslangic</option>
                  <option value="Orta">Orta</option>
                  <option value="İleri">Ileri</option>
                  <option value="Tüm Seviyeler">Tum Seviyeler</option>
                </select>
              </div>

              <div className="kf-group">
                <label>Dil</label>
                <select value={form.dil} onChange={e => setForm(p => ({ ...p, dil: e.target.value }))}>
                  <option value="Türkçe">Turkce</option>
                  <option value="İngilizce">Ingilizce</option>
                </select>
              </div>

              <div className="kf-group">
                <label>Fiyatlandirma</label>
                <div className="kf-radio-group">
                  <label className="kf-radio">
                    <input type="radio" value="paid" checked={form.fiyat_turu === 'paid'} onChange={() => setForm(p => ({ ...p, fiyat_turu: 'paid' }))} />
                    <span>Ucretli</span>
                  </label>
                  <label className="kf-radio">
                    <input type="radio" value="free" checked={form.fiyat_turu === 'free'} onChange={() => setForm(p => ({ ...p, fiyat_turu: 'free', fiyat: 0 }))} />
                    <span>Ucretsiz</span>
                  </label>
                </div>
              </div>

              {form.fiyat_turu === 'paid' && (
                <>
                  <div className="kf-group">
                    <label>Fiyat (TL)</label>
                    <input type="number" min={0} value={form.fiyat} onChange={e => setForm(p => ({ ...p, fiyat: +e.target.value }))} />
                  </div>
                  <div className="kf-group">
                    <label>Indirim Fiyati (TL)</label>
                    <input type="number" min={0} value={form.indirim_fiyat ?? ''} onChange={e => setForm(p => ({ ...p, indirim_fiyat: e.target.value ? +e.target.value : null }))} />
                  </div>
                </>
              )}

              <div className="kf-group">
                <label>Durum</label>
                <select value={form.durum} onChange={e => setForm(p => ({ ...p, durum: e.target.value as any }))}>
                  <option value="pending">Bekliyor</option>
                  <option value="active">Aktif</option>
                  <option value="draft">Taslak</option>
                </select>
              </div>

              <div className="kf-group kf-ders-group">
                <label>Mufredat (Bolum + Ders)</label>
                <div className="kf-ders-card">
                  <div className="kf-ders-card-head">
                    <div>
                      <div className="kf-ders-title">{toplamBolum} bolum / {toplamDers} ders</div>
                      <div className="kf-ders-sub">{mufredatTamam ? 'Tum bolumlerde ders var' : 'Eksik bolum dersi var'}</div>
                    </div>
                    <button type="button" className="kf-ders-open-btn" onClick={() => dersModalAc()}>
                      + Ders Ekle
                    </button>
                  </div>

                  <div className="kf-group" style={{ marginTop: '0.8rem' }}>
                    <label>Yeni Bolum Ekle</label>
                    <input type="text" placeholder="Bolum basligi" value={bolumForm.baslik} onChange={e => setBolumForm(p => ({ ...p, baslik: e.target.value }))} />
                    <input type="text" placeholder="Bolum aciklamasi (opsiyonel)" value={bolumForm.aciklama} onChange={e => setBolumForm(p => ({ ...p, aciklama: e.target.value }))} />
                    <button type="button" className="kf-ders-open-btn" onClick={bolumEkle}>+ Bolum Ekle</button>
                  </div>

                  {bolumler.length > 0 ? (
                    <div className="kf-ders-list">
                      {bolumler.map((bolum, i) => {
                        const bolumDersleri = dersler.filter(d => d.bolum_id === bolum.id);
                        return (
                          <div className="kf-ders-item" key={bolum.id}>
                            <div>
                              <div className="kf-ders-item-title">{i + 1}. {bolum.baslik}</div>
                              <div className="kf-ders-item-meta">{bolumDersleri.length} ders</div>
                              {bolumDersleri.slice(0, 2).map(d => (
                                <div key={d.id} className="kf-ders-item-meta">- {d.baslik}</div>
                              ))}
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button type="button" className="kf-ders-edit-mini" onClick={() => dersModalAc()}>Ders Ekle</button>
                              <button type="button" className="kf-remove-btn" onClick={() => bolumSil(bolum.id)}>Sil</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="kf-ders-empty">Henuz bolum yok. Once bolum olusturun.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {hata && <div className="kf-error">{hata}</div>}

          <div className="kf-actions">
            <button type="button" className="kf-btn-cancel" onClick={() => setView('list')}>Iptal</button>
            <button type="submit" className="kf-btn-submit" disabled={kaydetLoading}>
              {kaydetLoading ? 'Kaydediliyor...' : seciliKurs ? 'Guncelle' : 'Kursu Kaydet'}
            </button>
          </div>
        </form>
        {dersModal}
      </div>
    );
  }

  return (
    <div className="kurslar-panel">
      {detayKurs && (
        <KursDetay
          kurs={detayKurs}
          onClose={() => setDetayKurs(null)}
          onKayitOl={() => setDetayKurs(null)}
        />
      )}
      <div className="kurslar-topbar">
        <div className="kurslar-stats">
          {[
            { label: 'Aktif dersler', value: kurslar.filter(k => k.durum === 'active').length },
            { label: 'Bekleyen dersler', value: kurslar.filter(k => k.durum === 'pending').length },
            { label: 'Taslak', value: kurslar.filter(k => k.durum === 'draft').length },
            { label: 'Ucretli kurslar', value: kurslar.filter(k => k.fiyat_turu === 'paid').length },
          ].map(s => (
            <div className="kurslar-stat" key={s.label}>
              <div className="kurslar-stat-num">{s.value}</div>
              <div className="kurslar-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
        <button className="kurslar-add-btn" onClick={yeniKursAc}>+ Kurs Ekle</button>
      </div>

      <div className="kurslar-search-bar">
        <span>🔍</span>
        <input type="text" placeholder="Kurs adi veya kategori ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {loading ? (
        <div className="admin-loading">Kurslar yukleniyor...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Kurs Basligi</th>
                <th>Kategori</th>
                <th>Seviye</th>
                <th>Durum</th>
                <th>Fiyat</th>
                <th>Secenekler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((kurs, i) => (
                <tr key={kurs.id}>
                  <td className="admin-date">{i + 1}</td>
                  <td>
                    <div className="kurs-title-cell">
                      {kurs.thumbnail_url ? (
                        <img src={kurs.thumbnail_url} alt="" className="kurs-thumb" />
                      ) : (
                        <div className="kurs-thumb-placeholder">{kurs.kategori === 'Snowboard' ? '🏂' : '🌊'}</div>
                      )}
                      <div>
                        <div className="kurs-name">{kurs.baslik}</div>
                        <div className="kurs-desc-short">{kurs.kisa_aciklama}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="kurs-kategori-badge">{kurs.kategori || '-'}</span></td>
                  <td className="admin-mail">{kurs.seviye}</td>
                  <td><span className={durumRenk(kurs.durum)}>{durumLabel(kurs.durum)}</span></td>
                  <td>
                    {kurs.fiyat_turu === 'free' ? (
                      <span className="kurs-free-badge">Ucretsiz</span>
                    ) : (
                      <div>
                        <div className="kurs-price">TL {kurs.fiyat.toLocaleString('tr-TR')}</div>
                        {kurs.indirim_fiyat && <div className="kurs-price-indirim">TL {kurs.indirim_fiyat.toLocaleString('tr-TR')}</div>}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-action-btn" style={{background:'#e0f2fe',color:'#0284c7'}} onClick={() => setDetayKurs(kurs)}>Goruntule</button>
                      <button className="admin-action-btn promote" onClick={() => duzenle(kurs)}>Duzenle</button>
                      <button className="admin-action-btn delete" onClick={() => sil(kurs.id)}>Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="admin-empty">{kurslar.length === 0 ? 'Henuz kurs eklenmemis.' : 'Arama sonucu bulunamadi.'}</div>
          )}
        </div>
      )}

      {dersModal}
    </div>
  );
}
