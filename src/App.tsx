import React, { useState, useEffect } from 'react';
import './App.css';
import LoadingSpinner from './components/ui/snow-ball-loading-spinner';
import AuthPage from './components/ui/AuthPage';
import AdminPanel from './components/ui/AdminPanel';
import OdemeModal from './components/ui/OdemeModal';
import KursDetay from './components/ui/KursDetay';
import KurslarimModal from './components/ui/KurslarimModal';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth, isAdmin } from './context/AuthContext';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: "easeOut" }
} as const;

const AppInner: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'surf' | 'snowboard'>('all');
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [odemeKurs, setOdemeKurs] = useState<any>(null);
  const [detayKurs, setDetayKurs] = useState<any>(null);
  const [showKurslarim, setShowKurslarim] = useState(false);
  const [menuAcik, setMenuAcik] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      // Show auth screen after loading if not logged in
      if (!authLoading && !user) setShowAuth(true);
    }, 2800);
    return () => clearTimeout(timer);
  }, [authLoading, user]);

  // If user logs in while auth screen is open, close it
  useEffect(() => {
    if (user) setShowAuth(false);
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    const { supabase } = require('./utils/supabase/client');
    supabase
      .from('kurslar')
      .select('*')
      .eq('durum', 'active')
      .order('created_at', { ascending: false })
      .then(({ data }: any) => { if (data) setCourses(data); });
  }, []);

  const filtered = activeTab === 'all'
    ? courses
    : courses.filter(c => {
      if (activeTab === 'surf') return c.kategori === 'Sörf';
      if (activeTab === 'snowboard') return c.kategori === 'Snowboard';
      return true;
    });

  const testimonials = [
    {
      text: 'Hakan Hoca sayesinde 3 günde hayatımda ilk defa dalga üzerinde durdum. İnanılmaz bir deneyimdi. Gerçekten sabırlı ve motive edici bir eğitmen!',
      name: 'Selin Kaya',
      sport: '🏄‍♀️ Surf Öğrencisi',
      avatar: '👩',
    },
    {
      text: 'Snowboard kampına katılmadan önce çok korktum ama Hakan Hoca\'nın rehberliğiyle 4. günde pistten bağımsız iniyordum. Kesinlikle tekrar katılacağım!',
      name: 'Emre Demir',
      sport: '🏂 Snowboard Öğrencisi',
      avatar: '👨',
    },
    {
      text: 'Özel dersler gerçekten fark yarattı. Grup derslerde öğrenemediğim teknikleri Hakan ile bire bir çalışarak 2 saatte öğrendim. Çok değerliydi.',
      name: 'Ayşe Yıldız',
      sport: '🌊 Özel Ders Öğrencisi',
      avatar: '👩‍🦱',
    },
  ];

  return (
    <div>
      {/* LOADING SCREEN */}
      <div className={`loading-screen ${loading ? '' : 'hidden'}`}>
        <LoadingSpinner />
        <div className="loading-screen-title">Hakan Abay</div>
        <div className="loading-screen-sub">Surf & Snowboard Akademi</div>
      </div>

      {/* AUTH SCREEN */}
      {showAuth && !loading && (
        <AuthPage onSuccess={() => setShowAuth(false)} />
      )}

      {/* ADMIN PANEL */}
      {showAdmin && isAdmin(user) && (
        <AdminPanel onClose={() => setShowAdmin(false)} />
      )}

      {/* ÖDEME MODAL */}
      {odemeKurs && (
        <OdemeModal kurs={odemeKurs} onClose={() => setOdemeKurs(null)} />
      )}

      {/* KURSLARIM */}
      {showKurslarim && user && (
        <KurslarimModal
          userId={user.id}
          onClose={() => setShowKurslarim(false)}
          onKursAc={(kurs) => { setShowKurslarim(false); setDetayKurs(kurs); }}
        />
      )}

      {/* KURS DETAY */}
      {detayKurs && (
        <KursDetay
          kurs={detayKurs}
          onClose={() => setDetayKurs(null)}
          onKayitOl={(k) => { setDetayKurs(null); setOdemeKurs(k); }}
        />
      )}

      {/* NAVBAR */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo">
          <span className="nav-logo-name">Hakan Abay</span>
          <span className="nav-logo-sub">Surf & Snowboard Akademi</span>
        </div>
        <ul className="nav-links">
          <li><a href="#hakkimda">Hakkımda</a></li>
          <li><a href="#kurslar">Kurslar</a></li>
          <li><a href="#ozel-ders">Özel Ders</a></li>
          <li><a href="#yorumlar">Yorumlar</a></li>
          <li><a href="#iletisim" className="nav-cta">İletişime Geç</a></li>
        </ul>
        <div className="nav-user">
          {user ? (
            <>
              {isAdmin(user) && (
                <button className="nav-admin-btn" onClick={() => setShowAdmin(true)}>
                  🛡️ Admin
                </button>
              )}
              <div className="nav-user-menu-wrap" style={{ position: 'relative' }}>
                <button className="nav-user-email" onClick={() => setMenuAcik(p => !p)} style={{ cursor: 'pointer', background: 'none', border: 'none' }}>
                  👤 {user['isim soyisim']} ▾
                </button>
                {menuAcik && (
                  <div className="nav-dropdown" onClick={() => setMenuAcik(false)}>
                    <button className="nav-dropdown-item" onClick={() => setShowKurslarim(true)}>
                      🎓 Kurslarım
                    </button>
                    <div className="nav-dropdown-divider" />
                    <button className="nav-dropdown-item danger" onClick={signOut}>
                      🚪 Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button className="nav-signout" onClick={() => setShowAuth(true)}>Giriş Yap</button>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="hero hero-video">
        {/* Video Arka Plan */}
        <div className="hero-video-bg">
          <video
            className="hero-video-el hero-video-left"
            src="/videos/surf.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          <video
            className="hero-video-el hero-video-right"
            src="/videos/snow.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="hero-video-split-line" />
          <div className="hero-video-overlay" />
        </div>

        {/* İçerik */}
        <div className="hero-video-content">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Türkiye'nin Tek Çift Branş Akademisi
            <span className="hero-eyebrow-dot" />
          </div>

          <h1 className="hero-video-title">
            <span className="hero-vt-line1">Dalgaları</span>
            <span className="hero-vt-accent">Fethet.</span>
            <span className="hero-vt-line2">Karı <em>Kaydır.</em></span>
          </h1>

          <p className="hero-video-desc">
            Sörf &amp; Snowboard'da profesyonel eğitim.<br />
            Hakan Abay ile limitlerini zorla.
          </p>

          <div className="hero-video-btns">
            <a href="#kurslar" className="hvb-primary">
              Kurslara Bak
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#ozel-ders" className="hvb-secondary">
              Özel Ders Al
            </a>
          </div>

          <div className="hero-video-stats">
            {[
              { num: '500+', label: 'Mutlu Öğrenci' },
              { num: '12', label: 'Yıl Deneyim' },
              { num: '2', label: 'Spor Branşı' },
              { num: '98%', label: 'Memnuniyet' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                <div className="hvs-item">
                  <span className="hvs-num">{s.num}</span>
                  <span className="hvs-label">{s.label}</span>
                </div>
                {i < 3 && <div className="hvs-divider" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Alt scroll göstergesi */}
        <div className="hero-scroll-hint">
          <div className="hero-scroll-mouse"><div className="hero-scroll-wheel" /></div>
        </div>

        {/* Köşe Etiketleri */}
        <div className="hero-sport-tags">
          <span className="hero-sport-tag surf">🌊 SÖRF</span>
          <span className="hero-sport-tag snow">🏂 SNOWBOARD</span>
        </div>
      </section>

      {/* ABOUT */}
      <motion.section 
        className="section about" 
        id="hakkimda"
        {...fadeInUp}
      >
        <div className="about-inner">
          <div className="about-image-wrap">
            <div className="about-image-bg">
              <div className="about-image-placeholder">
                <span>🏄‍♂️</span>
                <p>Hakan Abay</p>
              </div>
            </div>
            <div className="about-badge">
              <div className="about-badge-num">12</div>
              <div className="about-badge-text">Yıl Tecrübe</div>
            </div>
          </div>
          <div>
            <span className="section-tag">Eğitmen</span>
            <h2 className="section-title">
              Merhaba, Ben <span>Hakan Abay</span>
            </h2>
            <p className="section-desc" style={{ marginBottom: '1.5rem' }}>
              12 yıldır hem sörf hem de snowboard eğitimi veren profesyonel bir eğitmeniyim. Her iki sporu da en yüksek seviyede öğretme tutkusuyla, öğrencilerimin güvenli ve keyifli bir deneyim yaşamasını sağlıyorum.
            </p>
            <p className="section-desc">
              Türkiye'nin en güzel plajlarında ve kayak merkezlerinde gerçekleştirdiğim kamp ve özel derslerimde, teknik bilgiyi eğlenceli bir öğrenme ortamıyla buluşturuyorum.
            </p>
            <div className="about-skills">
              {[
                { label: 'Sörf Eğitimi', pct: 95 },
                { label: 'Snowboard Eğitimi', pct: 92 },
                { label: 'Güvenlik & Risk Yönetimi', pct: 98 },
              ].map((s) => (
                <div className="skill-bar-wrap" key={s.label}>
                  <div className="skill-bar-header">
                    <span>{s.label}</span>
                    <span>{s.pct}%</span>
                  </div>
                  <div className="skill-bar-track">
                    <div className="skill-bar-fill" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="about-tags">
              {['🌊 Sörf Ustası', '🏂 Snowboard Pro', '🎓 Sertifikalı Eğitmen', '🌍 Uluslararası Deneyim', '🛡️ İlk Yardım'].map((t) => (
                <span className="about-tag" key={t}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* COURSES */}
      <motion.section 
        className="section courses" 
        id="kurslar"
        {...fadeInUp}
      >
        <div className="courses-inner">
          <div className="courses-header">
            <span className="section-tag">Kurslar</span>
            <h2 className="section-title">Sana Uygun <span>Programı</span> Seç</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Başlangıçtan ileri seviyeye tüm kurs seçenekleri. Küçük gruplar, maksimum öğrenme.
            </p>
          </div>
          <div className="courses-tabs">
            {([
              { key: 'all', label: '🎯 Tümü' },
              { key: 'surf', label: '🌊 Sörf' },
              { key: 'snowboard', label: '🏂 Snowboard' },
            ] as const).map((t) => (
              <button
                key={t.key}
                className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="courses-grid">
            {filtered.length === 0 && (
              <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                Henüz bu kategoride aktif kurs bulunmuyor.
              </p>
            )}
            {filtered.map((c: any) => (
              <div className="course-card" key={c.id} onClick={async () => {
                if (c.fiyat_turu === 'free') { setDetayKurs(c); return; }
                if (!user) { setShowAuth(true); return; }
                if (isAdmin(user)) { setDetayKurs(c); return; }
                const { supabase: sb } = require('./utils/supabase/client');
                const { data } = await sb.from('kurs_kayitlari').select('durum').eq('kullanici_id', user.id).eq('kurs_id', c.id).eq('durum', 'onaylandi').maybeSingle();
                if (data) { setDetayKurs(c); } else { setOdemeKurs(c); }
              }} style={{ cursor: 'pointer' }}>
                <div className={`course-card-img ${c.kategori === 'Sörf' ? 'surf-bg' : 'snow-bg'}`}>
                  {c.thumbnail_url
                    ? <img src={c.thumbnail_url} alt={c.baslik} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '4rem' }}>{c.kategori === 'Sörf' ? '🌊' : '🏂'}</span>
                  }
                  <div className="course-level">{c.seviye}</div>
                </div>
                <div className="course-card-body">
                  <div className="course-type-tag">
                    {c.kategori === 'Sörf' ? '🌊 SÖRF' : c.kategori === 'Snowboard' ? '🏂 SNOWBOARD' : `🎯 ${c.kategori?.toUpperCase()}`}
                  </div>
                  <h3 className="course-title">{c.baslik}</h3>
                  <p className="course-desc">{c.kisa_aciklama}</p>
                  <div className="course-meta">
                    <span className="course-meta-item">📚 {c.seviye}</span>
                    <span className="course-meta-item">🌐 {c.dil}</span>
                  </div>
                  <div className="course-footer">
                    <div>
                      {c.fiyat_turu === 'free'
                        ? <div className="course-price" style={{ color: '#059669' }}>Ücretsiz</div>
                        : <>
                          <div className="course-price">₺{Number(c.fiyat).toLocaleString('tr-TR')}</div>
                          {c.indirim_fiyat && (
                            <div style={{ fontSize: '0.75rem', color: '#dc2626', textDecoration: 'line-through' }}>
                              ₺{Number(c.indirim_fiyat).toLocaleString('tr-TR')}
                            </div>
                          )}
                        </>
                      }
                    </div>
                    <button
                      className="course-btn"
                      onClick={(e) => { e.stopPropagation(); setOdemeKurs(c); }}
                    >Kayıt Ol →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* PRIVATE LESSONS */}
      <motion.section 
        className="section private" 
        id="ozel-ders"
        {...fadeInUp}
      >
        <div className="private-inner">
          <div>
            <span className="section-tag" style={{ color: 'var(--gold)' }}>Özel Ders</span>
            <h2 className="section-title section-title-white">
              Bire Bir<br /><span>Özel Eğitim</span>
            </h2>
            <p className="section-desc" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
              Sana özel hazırlanan program ve birebir ilgiyle en hızlı gelişimi sen yakalatırsın.
            </p>
            <div className="private-features">
              {[
                { icon: '🎯', title: 'Kişiye Özel Program', desc: 'Senin seviyene ve hedeflerine göre hazırlanan ders planı.' },
                { icon: '⚡', title: 'Hızlı İlerleme', desc: 'Grup derslerine göre 3x daha hızlı öğrenme garantisi.' },
                { icon: '📍', title: 'Lokasyon Esnekliği', desc: 'İstediğin plajda veya kayak merkezinde ders imkânı.' },
                { icon: '🎥', title: 'Video Analiz', desc: 'Hareketlerini video ile analiz ederek anında geri bildirim.' },
              ].map((f) => (
                <div className="private-feature" key={f.title}>
                  <div className="private-feature-icon">{f.icon}</div>
                  <div className="private-feature-text">
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="private-card">
            <div className="private-card-title">💎 Özel Ders Fiyatları</div>
            <div className="price-options">
              {[
                { label: '🌊 Sörf — 1 Saat', value: '₺800' },
                { label: '🌊 Sörf — Yarım Gün (4 Saat)', value: '₺2.800' },
                { label: '🏂 Snowboard — 1 Saat', value: '₺900' },
                { label: '🏂 Snowboard — Yarım Gün (4 Saat)', value: '₺3.200' },
                { label: '🎯 Combo (Sörf + Snowboard)', value: '₺4.500' },
              ].map((p) => (
                <div className="price-option" key={p.label}>
                  <span className="price-option-label">{p.label}</span>
                  <span className="price-option-value">{p.value}</span>
                </div>
              ))}
            </div>
            <a href="#iletisim" className="private-cta">
              📅 Hemen Rezervasyon Yap
            </a>
          </div>
        </div>
      </motion.section>

      {/* TESTIMONIALS */}
      <motion.section 
        className="section testimonials" 
        id="yorumlar"
        {...fadeInUp}
      >
        <div className="testimonials-inner">
          <div className="testimonials-header">
            <span className="section-tag">Yorumlar</span>
            <h2 className="section-title">Öğrencilerim <span>Ne Diyor?</span></h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t) => (
              <div className="testimonial-card" key={t.name}>
                <div className="testimonial-quote">"</div>
                <div className="stars">★★★★★</div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.avatar}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-sport">{t.sport}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CONTACT */}
      <motion.section 
        className="section contact" 
        id="iletisim"
        {...fadeInUp}
      >
        <div className="contact-inner">
          <div>
            <span className="section-tag">İletişim</span>
            <h2 className="section-title">Hemen <span>Başlayalım!</span></h2>
            <p className="section-desc" style={{ marginBottom: '2.5rem' }}>
              Kurs veya özel ders hakkında bilgi almak için iletişime geçin. En kısa sürede dönüş yapacağım.
            </p>
            <div className="contact-info">
              {[
                { icon: '📞', label: 'Telefon', value: '+90 536 522 53 00' },
                { icon: '📧', label: 'E-posta', value: 'hakan@hakanabay.com' },
                { icon: '📍', label: 'Lokasyon', value: 'Alaçatı / Uludağ' },
                { icon: '📸', label: 'Instagram', value: '@hakanabay_surf' },
              ].map((c) => (
                <div className="contact-item" key={c.label}>
                  <div className="contact-icon">{c.icon}</div>
                  <div>
                    <div className="contact-item-label">{c.label}</div>
                    <div className="contact-item-value">{c.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="contact-form-wrap">
            <h3 className="form-title">Bize Ulaşın 🏄‍♂️</h3>
            <p className="form-subtitle">Formu doldurun, 24 saat içinde dönüş yapalım.</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const ad = formData.get('ad');
              const tel = formData.get('tel');
              const mail = formData.get('mail');
              const ders = formData.get('ders');
              const mesaj = formData.get('mesaj');
              
              const wpMesaj = `Merhaba Hakan Hocam,\n\nBen *${ad}*.\nEğitim hakkında bilgi almak istiyorum.\n\n📱 *Telefon:* ${tel}\n📧 *E-posta:* ${mail}\n🎯 *İlgilenilen Ders:* ${ders}\n\n📝 *Mesajım:* ${mesaj}`;
              const wpUrl = `https://wa.me/905365225300?text=${encodeURIComponent(wpMesaj)}`;
              window.open(wpUrl, '_blank');
            }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Ad Soyad</label>
                  <input type="text" name="ad" placeholder="Adınız Soyadınız" required />
                </div>
                <div className="form-group">
                  <label>Telefon</label>
                  <input type="tel" name="tel" placeholder="+90 555 000 00 00" required />
                </div>
              </div>
              <div className="form-group">
                <label>E-posta</label>
                <input type="email" name="mail" placeholder="ornek@email.com" required />
              </div>
              <div className="form-group">
                <label>İlgilendiğiniz Ders</label>
                <select name="ders">
                  <option value="">Seçiniz...</option>
                  <option>🌊 Sörf Kursu — Başlangıç</option>
                  <option>🌊 Sörf Kursu — Orta Seviye</option>
                  <option>🏂 Snowboard Kursu — Başlangıç</option>
                  <option>🏂 Snowboard Kursu — İleri Seviye</option>
                  <option>⭐ Özel Ders (Sörf)</option>
                  <option>⭐ Özel Ders (Snowboard)</option>
                  <option>🎯 Combo Özel Ders</option>
                </select>
              </div>
              <div className="form-group">
                <label>Mesajınız</label>
                <textarea name="mesaj" placeholder="Merhaba Hakan Hoca, hakkında bilgi almak istiyorum..."></textarea>
              </div>
              <button type="submit" className="form-submit">
                Gönder — Hemen İletişime Geç 🚀
              </button>
            </form>
          </div>
        </div>
      </motion.section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div className="footer-brand-name">Hakan Abay</div>
            <div className="footer-brand-sub">Surf & Snowboard Akademi</div>
            <p className="footer-brand-desc">
              Türkiye'nin en iyi lokasyonlarında profesyonel sörf ve snowboard eğitimi. Dalgaları fethet, karı kaydır.
            </p>
          </div>
          <div>
            <div className="footer-col-title">Hızlı Erişim</div>
            <ul className="footer-links">
              <li><a href="#hakkimda">Hakkımda</a></li>
              <li><a href="#kurslar">Kurslar</a></li>
              <li><a href="#ozel-ders">Özel Ders</a></li>
              <li><a href="#yorumlar">Yorumlar</a></li>
              <li><a href="#iletisim">İletişim</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Spor Dalları</div>
            <ul className="footer-links">
              <li><a href="#kurslar">🌊 Sörf Kursları</a></li>
              <li><a href="#kurslar">🏂 Snowboard Kursları</a></li>
              <li><a href="#ozel-ders">⭐ Özel Dersler</a></li>
              <li><a href="#iletisim">📅 Rezervasyon</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2024 Hakan Abay Akademi. Tüm hakları saklıdır.</span>
          <span>Tasarlandı ile <span>❤️</span></span>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppInner />
  </AuthProvider>
);

export default App;
