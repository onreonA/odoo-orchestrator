# 📝 Format ve Commit Rehberi

## 🎯 Sorun

Cursor'da "25 files edited" görünmesi ve "Keep all" dediğinizde hata almanızın nedeni:
- Pre-commit hook'ları (`lint-staged`) commit sırasında Prettier ile dosyaları otomatik formatlıyor
- Cursor bu değişiklikleri "edited" olarak gösteriyor
- "Keep all" dediğinizde formatlanmamış versiyonlar kalıyor ve tutarsızlık oluşuyor

## ✅ Çözüm

### 1. Format Script'leri Eklendi

`package.json`'a şu script'ler eklendi:
- `npm run format` - Tüm dosyaları formatla
- `npm run format:check` - Format kontrolü yap (değiştirme)

### 2. lint-staged Güncellendi

`lint-staged` konfigürasyonuna `git add` eklendi. Artık formatlanmış dosyalar otomatik olarak stage'e ekleniyor.

### 3. Önerilen İş Akışı

#### ✅ Doğru Yöntem:

```bash
# 1. Kod yazın ve değişiklikleri yapın

# 2. Commit yapmadan önce formatlayın
npm run format

# 3. Cursor'da "Accept All" yerine "Review Changes" yapın
#    Formatlanmış versiyonları kontrol edin ve kabul edin

# 4. Commit edin
git add .
git commit -m "feat: Yeni özellik"
```

#### ❌ Yanlış Yöntem:

```bash
# ❌ Direkt commit yapmayın (pre-commit hook formatlayacak)
git commit -m "feat: Yeni özellik"

# ❌ Cursor'da "Keep all" demeyin (formatlanmamış versiyonlar kalır)
```

### 4. Cursor Ayarları

Cursor'da şu ayarları kontrol edin:

1. **Settings → Format On Save**: Kapalı olmalı
   - Pre-commit hook zaten formatlıyor
   - Çift formatlama sorun yaratabilir

2. **Settings → Editor → Format On Paste**: Kapalı olmalı

3. **Settings → Prettier → Auto Format**: Kapalı olmalı

### 5. Hızlı Format ve Commit

```bash
# Tek komutla formatla ve commit et
npm run format && git add . && git commit -m "chore: Format code"
```

### 6. Pre-commit Hook Çalıştığında

Eğer pre-commit hook çalışırsa ve dosyaları formatlarsa:
- Formatlanmış dosyalar otomatik olarak stage'e eklenir
- Commit işlemi devam eder
- Ekstra bir adım gerekmez

## 🔍 Sorun Giderme

### "25 files edited" görünüyorsa:

1. **Kontrol edin:**
   ```bash
   git status --short
   ```

2. **Formatlayın:**
   ```bash
   npm run format
   ```

3. **Değişiklikleri kontrol edin:**
   ```bash
   git diff
   ```

4. **Formatlanmış versiyonları kabul edin:**
   ```bash
   git add .
   ```

### "Keep all" dedikten sonra hata alıyorsanız:

1. **Formatlanmamış dosyaları düzeltin:**
   ```bash
   npm run format
   git add .
   git commit --amend --no-edit
   ```

2. **Veya yeni commit yapın:**
   ```bash
   npm run format
   git add .
   git commit -m "chore: Fix formatting"
   ```

## 📋 Özet

- ✅ Commit yapmadan önce `npm run format` çalıştırın
- ✅ Cursor'da "Keep all" yerine formatlanmış versiyonları kabul edin
- ✅ Format On Save'i kapalı tutun
- ✅ Pre-commit hook'larına güvenin (otomatik formatlama yapıyor)

---

**Son Güncelleme:** 15 Kasım 2024

