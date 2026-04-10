import React, { useState, useEffect, useRef } from 'react';

interface SnowboardPageProps {
  onClose: () => void;
}

interface Course {
  num: string;
  title: string;
  stat?: string;
  img?: string;
  learners?: string;
}

export default function SnowboardPage({ onClose }: SnowboardPageProps) {
  const [openCourse, setOpenCourse] = useState<number | null>(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const scrollTo = (id: string) => {
    pageRef.current?.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const courses: Course[] = [
    {
      num: '01',
      title: 'Çocuklar için Snowboard',
      stat: '%100 güvenlik ve ekipman desteği',
      img: 'https://images.unsplash.com/photo-1589553416260-f586c8f1514f?w=400&q=80',
    },
    { num: '02', title: 'Snowboard Sürüşünü Öğren', learners: '303 öğrenciyi başarıyla yetiştirdik' },
    { num: '03', title: 'Snowboard Antrenman Programları', learners: '255 deneyimli koç ve sporcu' },
    { num: '04', title: 'Kar Kampını Keşfet', learners: '200 dünya genelinde üye' },
  ];

  const testimonials = [
    {
      text: 'Hakan Hoca sayesinde ilk hafta sonunda kar üzerinde durmayı başardım. Profesyonel ve sabırlı bir eğitmen. Kesinlikle tavsiye ederim!',
      name: 'Ahmet Yılmaz',
      role: 'CEO of Hurly',
      initials: 'AY',
    },
    {
      text: 'Uludağ kampı muhteşemdi. Hakan\'ın teknik bilgisi ve motivasyonu sayesinde iki günde pisti tek başıma inebildim. İnanılmaz bir deneyim!',
      name: 'Selin Kaya',
      role: 'General Manager of UXEL',
      initials: 'SK',
    },
    {
      text: 'Çocuğum için çok endişelendim ama ekipman kalitesi ve güvenlik önlemleri mükemmeldi. Artık snowboard çocuğumun en sevdiği aktivite!',
      name: 'Elif Demir',
      role: 'Creative Director of Aiyada',
      initials: 'ED',
    },
  ];

  const partners = ['ESPN', 'CBS Sports', 'Eurosport', 'Red Bull', 'GoPro', 'The North Face', 'Salomon', 'Burton'];

  const handleSubscribe = () => {
    if (email.trim()) { setSubscribed(true); setEmail(''); }
  };

  return (
    <div className="sb-page" ref={pageRef}>

      {/* ── NAVBAR ── */}
      <nav className="sb-nav">
        <div className="sb-logo">HakanSky<span className="sb-logo-dot">.</span></div>
        <ul className="sb-nav-links">
          <li><button onClick={() => scrollTo('#sb-hero')}>HOME</button></li>
          <li><button onClick={() => scrollTo('#sb-kurslar')}>KURSLAR</button></li>
          <li><button onClick={() => scrollTo('#sb-hakkimda')}>HAKKIMDA</button></li>
        </ul>
        <div className="sb-nav-right">
          <button className="sb-contact-btn" onClick={() => scrollTo('#sb-subscribe')}>İLETİŞİM</button>
          <button className="sb-close-btn" onClick={onClose} title="Kapat (ESC)">✕</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="sb-hero" id="sb-hero">
        <div className="sb-hero-img-wrap">
          <img
            src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1920&q=80"
            alt="snowboarder"
            className="sb-hero-img"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="sb-hero-gradient" />
        </div>
        <div className="sb-hero-decor" aria-hidden>64</div>
        <div className="sb-hero-content">
          <h1 className="sb-hero-title">
            CESUR OL<br />
            <span className="sb-orange">ENGELLERİ AŞ</span><br />
            VE BAŞAR.
          </h1>
          <div className="sb-hero-btns">
            <button className="sb-reg-btn" onClick={() => scrollTo('#sb-kurslar')}>Kayıt Ol</button>
            <button className="sb-text-btn" onClick={() => scrollTo('#sb-subscribe')}>Bağlan</button>
          </div>
        </div>
      </section>

      {/* ── PARTNERS TICKER ── */}
      <div className="sb-partners-wrap">
        <div className="sb-partners-track">
          {[...partners, ...partners, ...partners].map((p, i) => (
            <span key={i} className="sb-partner-item">{p}</span>
          ))}
        </div>
      </div>

      {/* ── ABOUT ── */}
      <section className="sb-about-section" id="sb-hakkimda">
        <div className="sb-about-card">
          <div className="sb-about-img-col">
            <div className="sb-about-watermark" aria-hidden>We Provide</div>
            <img
              src="https://images.unsplash.com/photo-1565992441121-4367a2cca5cf?w=800&q=80"
              alt="snowboard eğitim"
              className="sb-about-img"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div className="sb-about-text-col">
            <h2 className="sb-about-title">Hakkımızda</h2>
            <p className="sb-about-desc">
              Türkiye'nin en iyi snowboard eğitmeni Hakan Abay ile karın keyfini çıkar.
              12 yıllık deneyim, uluslararası sertifikalar ve 500'den fazla mutlu öğrenci
              ile snowboard dünyasına güvenli ve eğlenceli bir adım at. Uludağ'ın
              muhteşem pistlerinde seni bekliyoruz.
            </p>
            <button className="sb-learn-more-btn" onClick={() => scrollTo('#sb-kurslar')}>
              Daha Fazla →
            </button>
          </div>
        </div>
      </section>

      {/* ── COURSES ACCORDION ── */}
      <section className="sb-courses-section" id="sb-kurslar">
        <div className="sb-courses-inner">
          {courses.map((c, i) => (
            <div
              key={i}
              className={`sb-course-row ${openCourse === i ? 'open' : ''}`}
              onClick={() => setOpenCourse(openCourse === i ? null : i)}
            >
              <div className="sb-course-row-main">
                <span className="sb-course-num">{c.num}</span>
                <span className="sb-course-name">{c.title}</span>

                {openCourse === i && c.img && (
                  <div className="sb-course-img-wrap">
                    <img
                      src={c.img}
                      alt={c.title}
                      className="sb-course-thumb"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="sb-course-arrow-btn">↗</div>
                  </div>
                )}

                <span className="sb-course-stat">
                  {c.stat || c.learners || ''}
                </span>
                <button className="sb-course-toggle" onClick={e => { e.stopPropagation(); setOpenCourse(openCourse === i ? null : i); }}>
                  {openCourse === i ? '—' : '+'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FULL WIDTH IMAGE ── */}
      <div className="sb-fullimg-wrap">
        <img
          src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=80"
          alt="snowboard aksiyon"
          className="sb-fullimg"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      {/* ── CTA DARK ── */}
      <section className="sb-cta-section">
        <div className="sb-cta-inner">
          <h2 className="sb-cta-title">
            KAR SPORUNA KAPSAMLI<br />
            BİR RİSK DEĞERLENDİRMESİ<br />
            YAPARAK BAŞLA
          </h2>
          <button className="sb-cta-btn" onClick={() => scrollTo('#sb-subscribe')}>
            KAYIT OL ŞIMDI
          </button>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="sb-testimonials-section">
        <div className="sb-t-left">
          <div className="sb-t-heading">
            <div>HEAR</div>
            <div>FR<span className="sb-t-snowflake">❄</span>M</div>
            <div className="sb-t-our">OUR</div>
            <div>PE<span className="sb-t-snowflake">❄</span>PLE</div>
          </div>
          <div className="sb-t-arrows">
            <button
              className="sb-t-arrow"
              onClick={() => setTestimonialIdx(i => Math.max(0, i - 1))}
              disabled={testimonialIdx === 0}
            >↙</button>
            <button
              className="sb-t-arrow"
              onClick={() => setTestimonialIdx(i => Math.min(testimonials.length - 1, i + 1))}
              disabled={testimonialIdx === testimonials.length - 1}
            >↗</button>
          </div>
        </div>
        <div className="sb-t-cards">
          {testimonials.map((t, i) => (
            <div key={i} className={`sb-t-card ${i === testimonialIdx ? 'active' : i < testimonialIdx ? 'past' : ''}`}>
              <div className="sb-t-quote">"</div>
              <p className="sb-t-text">{t.text}</p>
              <div className="sb-t-author">
                <div className="sb-t-avatar">{t.initials}</div>
                <div>
                  <div className="sb-t-name">{t.name}</div>
                  <div className="sb-t-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SUBSCRIBE ── */}
      <section className="sb-subscribe-section" id="sb-subscribe">
        <div className="sb-subscribe-inner">
          <h2 className="sb-subscribe-title">
            TÜM SEZONLUK ETKİNLİK<br />
            VE KARIYER<br />
            <span className="sb-orange">FIRSATLARINI TAKİP ET.</span>
          </h2>
          <div className="sb-subscribe-form">
            {subscribed ? (
              <div className="sb-subscribe-success">✅ Abone oldunuz! Teşekkürler.</div>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="E-posta adresiniz"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubscribe(); }}
                />
                <button onClick={handleSubscribe}>Abone Ol ↗</button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="sb-footer">
        <div className="sb-footer-top">
          <div className="sb-footer-brand">
            <div className="sb-footer-logo">HakanSky<span className="sb-logo-dot">.</span></div>
            <div className="sb-footer-addr">
              Uludağ Kayak Merkezi, Bursa / Türkiye<br />
              +90 555 123 45 67
            </div>
          </div>
          <div className="sb-footer-nav">
            <button onClick={() => scrollTo('#sb-hakkimda')}>HAKKIMDA</button>
            <button onClick={() => scrollTo('#sb-kurslar')}>KURSLAR</button>
            <button onClick={() => scrollTo('#sb-subscribe')}>İLETİŞİM</button>
          </div>
        </div>
        <div className="sb-footer-bottom">
          <span>TÜM HAKLAR SAKLIDIR, TELİF HAKKI © 2025 HAKANSKY LTD.</span>
          <div className="sb-footer-legal">
            <span>GİZLİLİK POLİTİKASI</span>
            <span>KULLANIM KOŞULLARI</span>
          </div>
          <div className="sb-footer-social">
            <span title="Twitter">𝕏</span>
            <span title="Instagram">◎</span>
            <span title="Facebook">f</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
