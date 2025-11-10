# 🔧 Supabase CLI Kurulum ve Kullanım Rehberi

## 📋 Durum

Migration'lar manuel SQL editörden çalıştırılmış. CLI'nin düzgün çalışması için remote migration durumunu senkronize etmemiz gerekiyor.

## ✅ Çözüm Adımları

### 1. Supabase Projesini Link Et

```bash
cd odoo-orchestrator
supabase link --project-ref bfskxzrwmovgtmccdecx
```

Bu komut:
- Remote Supabase projesine bağlanır
- `.supabase` klasörü oluşturur
- Migration durumunu senkronize eder

### 2. Remote Migration Durumunu Senkronize Et

Eğer migration'lar manuel olarak çalıştırıldıysa:

```bash
# Remote'daki migration durumunu kontrol et
supabase db remote commit

# Veya migration'ları remote'a push et (eğer local'de yeni migration varsa)
supabase db push
```

### 3. Yeni Migration Ekleme

**Doğru Yöntem:**

```bash
# 1. Yeni migration oluştur
supabase migration new migration_name

# 2. Migration dosyasını düzenle
# supabase/migrations/YYYYMMDDHHMMSS_migration_name.sql

# 3. Migration'ı remote'a push et
supabase db push
```

**YANLIŞ Yöntem:**
- ❌ Manuel SQL editörden migration çalıştırmak
- ❌ Migration dosyasını oluşturup manuel çalıştırmak

### 4. Migration Durumunu Kontrol Et

```bash
# Local migration'ları listele
ls supabase/migrations/

# Remote migration durumunu kontrol et
supabase db remote commit
```

## 🚨 Sorun Giderme

### Problem: "relation already exists" hatası

**Sebep:** Migration zaten remote'da çalıştırılmış ama CLI bunu bilmiyor.

**Çözüm:**
```bash
# Remote migration durumunu senkronize et
supabase db remote commit
```

### Problem: Supabase CLI bağlantı hatası

**Sebep:** `.supabase` klasörü yok veya link edilmemiş.

**Çözüm:**
```bash
# Projeyi link et
supabase link --project-ref bfskxzrwmovgtmccdecx

# Veya mevcut link'i kontrol et
cat .supabase/config.toml
```

### Problem: Docker hatası (local development)

**Not:** Local development için Docker gerekli, ama remote'a push için gerekli değil.

**Çözüm:**
- Remote'a push için: `supabase db push` (Docker gerekmez)
- Local development için: Docker'ı başlatın

## 📝 Best Practices

1. **Her zaman CLI kullanın:**
   ```bash
   supabase migration new feature_name
   supabase db push
   ```

2. **Migration dosyalarını commit edin:**
   ```bash
   git add supabase/migrations/
   git commit -m "feat(db): add templates table"
   ```

3. **Migration'ları test edin:**
   ```bash
   # Local'de test et (Docker gerekli)
   supabase db reset
   
   # Remote'a push et
   supabase db push
   ```

4. **Migration durumunu takip edin:**
   - Migration dosyaları `supabase/migrations/` klasöründe
   - Remote durum `.supabase/` klasöründe saklanır

## 🔗 Faydalı Komutlar

```bash
# Proje link et
supabase link --project-ref PROJECT_REF

# Yeni migration oluştur
supabase migration new migration_name

# Migration'ı remote'a push et
supabase db push

# Remote migration durumunu kontrol et
supabase db remote commit

# Migration'ları listele
ls supabase/migrations/

# Local database reset (Docker gerekli)
supabase db reset
```

## 📚 Daha Fazla Bilgi

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)




