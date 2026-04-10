create table if not exists public.kurs_bolumler (
  id uuid primary key default gen_random_uuid(),
  kurs_id uuid not null references public.kurslar(id) on delete cascade,
  baslik text not null,
  aciklama text,
  siralama integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_kurs_bolumler_kurs_id
  on public.kurs_bolumler (kurs_id);

create table if not exists public.kurs_dersler (
  id uuid primary key default gen_random_uuid(),
  kurs_id uuid not null references public.kurslar(id) on delete cascade,
  bolum_id uuid not null references public.kurs_bolumler(id) on delete cascade,
  baslik text not null,
  ozet text,
  video_url text not null,
  sure text,
  siralama integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_kurs_dersler_kurs_id
  on public.kurs_dersler (kurs_id);

create index if not exists idx_kurs_dersler_bolum_id
  on public.kurs_dersler (bolum_id);
