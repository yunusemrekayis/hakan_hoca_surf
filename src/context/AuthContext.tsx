import React, { createContext, useContext, useEffect, useState } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '../utils/supabase/client';

export interface KullaniciUser {
  id: string;
  'isim soyisim': string;
  mail: string;
  created_at: string;
  rol: 'admin' | 'kullanici';
}

export const isAdmin = (user: KullaniciUser | null) => 
  user?.rol === 'admin' || user?.mail === 'abayhakan729@gmail.com';

interface AuthContextType {
  user: KullaniciUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  _setUser: (u: KullaniciUser | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  _setUser: () => {},
});

const SESSION_KEY = 'hakan_akademi_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<KullaniciUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sayfa yenilenince localStorage'dan oturumu geri yükle
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem(SESSION_KEY); }
    }
    setLoading(false);
  }, []);

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const _setUser = (u: KullaniciUser | null) => {
    if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    else localStorage.removeItem(SESSION_KEY);
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, _setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// ─── Auth işlemleri ─────────────────────────────────────────────────────────

export interface AuthSonuc {
  basarili: boolean;
  hata?: string;
  kullanici?: KullaniciUser;
}

/** Kayıt ol — email doğrulama yok, direkt hesap açılır */
export async function kayitOl(
  isimSoyisim: string,
  mail: string,
  sifre: string,
): Promise<AuthSonuc> {
  const mailTemiz = mail.toLowerCase().trim();

  // 1. Mail daha önce kayıtlı mı? — sadece kendi tablomuzu kontrol et
  const { data: mevcutKullanici } = await supabase
    .from('kullanıcılar')
    .select('id')
    .eq('mail', mailTemiz)
    .maybeSingle() as any;

  if (mevcutKullanici) {
    return { basarili: false, hata: 'Bu e-posta zaten kayıtlı.' };
  }

  // 2. Şifreyi bcrypt ile hashle
  const sifreHash = await bcrypt.hash(sifre, 10);

  // 3. Kullanıcıyı tabloya ekle (UUID otomatik üretilir)
  const { data: yeni, error: insertError } = await supabase
    .from('kullanıcılar')
    .insert({
      'isim soyisim': isimSoyisim,
      mail: mailTemiz,
      şifre: sifreHash,
      rol: 'kullanici',
    })
    .select('id, "isim soyisim", mail, created_at, rol')
    .single() as any;

  if (insertError) {
    return { basarili: false, hata: insertError.message };
  }

  return { basarili: true, kullanici: yeni as KullaniciUser };
}

/** Giriş yap — kullanıcılar tablosundan sorgular, bcrypt ile şifre karşılaştırır */
export async function girisYap(
  mail: string,
  sifre: string,
): Promise<AuthSonuc> {
  // 1. Tablodan mail ile kullanıcıyı getir (şifre hash dahil)
  const { data, error } = await supabase
    .from('kullanıcılar')
    .select('id, "isim soyisim", mail, created_at, rol, şifre')
    .eq('mail', mail.toLowerCase().trim())
    .maybeSingle() as any;

  if (error) return { basarili: false, hata: error.message };
  if (!data) return { basarili: false, hata: 'Bu e-posta adresiyle kayıtlı hesap bulunamadı.' };

  const row = data as Record<string, any>;

  // 2. Girilen şifreyi hash ile karşılaştır
  const eslesiyorMu = await bcrypt.compare(sifre, row['şifre']);
  if (!eslesiyorMu) return { basarili: false, hata: 'Şifre hatalı.' };

  // 3. Şifreyi çıkart, kullanıcı objesini döndür
  const { şifre: _ignored, ...kullanici } = row;
  return { basarili: true, kullanici: kullanici as KullaniciUser };
}
