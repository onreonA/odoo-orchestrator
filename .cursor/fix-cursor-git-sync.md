# 🔧 Cursor Git Sync Sorunu - Kalıcı Çözüm

## Problem
Cursor IDE commit sonrası dosyaları hala "değiştirilmiş" olarak gösteriyor, ancak git durumu temiz.

## Nedenler
1. **Git Cache Sorunu**: Git index cache'i güncel değil
2. **Cursor Cache**: Cursor'un git durumu cache'i eski
3. **Line Ending Sorunları**: `.gitattributes` ile line ending ayarları çakışıyor
4. **File Mode Sorunları**: Dosya izinleri değişmiş olabilir

## ✅ Kalıcı Çözümler

### 1. Git Config Ayarlarını Düzelt

```bash
# Proje dizininde çalıştırın:
cd odoo-orchestrator

# Line ending ayarları
git config --local core.autocrlf false
git config --local core.eol lf

# File mode ayarları (macOS/Linux için)
git config --local core.filemode false

# Index'i yenile
git add . --renormalize
```

### 2. Git Cache'i Temizle ve Yenile

```bash
# Tüm dosyaları cache'den çıkar ve yeniden ekle
git rm -r --cached .
git add .

# Commit yap (eğer değişiklik varsa)
git commit -m "chore: normalize line endings and file modes"
```

### 3. Cursor'u Yeniden Başlat

**Yöntem 1: Command Palette**
- `Cmd+Shift+P` (Mac) veya `Ctrl+Shift+P` (Windows/Linux)
- "Reload Window" yazın ve Enter'a basın

**Yöntem 2: Manuel**
- Cursor'u tamamen kapatın
- Tekrar açın

### 4. `.gitattributes` Dosyasını Güncelle

`.gitattributes` dosyası zaten doğru görünüyor, ancak emin olmak için:

```gitattributes
# Auto detect text files and perform LF normalization
* text=auto

# Force LF for all text files
*.ts text eol=lf
*.tsx text eol=lf
*.js text eol=lf
*.jsx text eol=lf
*.json text eol=lf
*.md text eol=lf
*.sql text eol=lf
*.sh text eol=lf
*.yml text eol=lf
*.yaml text eol=lf
```

### 5. Pre-commit Hook'u Güncelle

`.husky/pre-commit` dosyasına şunu ekleyin:

```bash
# Git durumunu normalize et
git add . --renormalize || true
```

### 6. Cursor Workspace Ayarları

`.vscode/settings.json` veya Cursor ayarlarına ekleyin:

```json
{
  "git.autoRefresh": true,
  "git.enableSmartCommit": true,
  "git.confirmSync": false,
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true
}
```

## 🚀 Hızlı Çözüm Script'i

`.cursor/git-refresh.sh` script'ini çalıştırın:

```bash
chmod +x .cursor/git-refresh.sh
./.cursor/git-refresh.sh
```

## 🔍 Sorun Devam Ederse

### 1. Git Durumunu Kontrol Et

```bash
git status
git diff --cached --name-only
git diff --name-only
```

### 2. Cursor Log'larını Kontrol Et

- `Cmd+Shift+P` → "Developer: Toggle Developer Tools"
- Console'da git ile ilgili hataları kontrol edin

### 3. Git Index'i Sıfırla

```bash
# DİKKAT: Bu komut staged değişiklikleri sıfırlar
git reset HEAD
git add .
```

### 4. Cursor Cache'ini Temizle

```bash
# Cursor cache dizinini temizle (macOS)
rm -rf ~/Library/Application\ Support/Cursor/Cache/*
rm -rf ~/Library/Application\ Support/Cursor/User/workspaceStorage/*
```

## 📝 Önleyici Tedbirler

### 1. Pre-commit Hook'a Normalize Ekle

`.husky/pre-commit` dosyasına:

```bash
#!/bin/sh
# Normalize line endings before commit
git add . --renormalize || true
```

### 2. Git Hooks'u Güncelle

```bash
# Pre-commit hook'u güncelle
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
# Normalize git index
git add . --renormalize || true
EOF

chmod +x .husky/pre-commit
```

### 3. Post-commit Hook Ekle

```bash
# Post-commit hook oluştur
cat > .husky/post-commit << 'EOF'
#!/bin/sh
# Git durumunu yenile
git status > /dev/null 2>&1
EOF

chmod +x .husky/post-commit
```

## ✅ Test Etme

1. Bir dosyada küçük bir değişiklik yapın
2. Commit edin
3. Cursor'un dosyayı "değiştirilmiş" olarak gösterip göstermediğini kontrol edin
4. `git status` ile gerçek durumu kontrol edin

## 🎯 En Etkili Çözüm

**Tek seferde uygulayın:**

```bash
cd odoo-orchestrator

# 1. Git config ayarları
git config --local core.autocrlf false
git config --local core.eol lf
git config --local core.filemode false

# 2. Cache'i temizle ve normalize et
git rm -r --cached .
git add . --renormalize

# 3. Değişiklik varsa commit et
if ! git diff --quiet || ! git diff --cached --quiet; then
    git commit -m "chore: normalize git index and line endings"
fi

# 4. Cursor'u yeniden başlat (manuel)
echo "✅ Git durumu normalize edildi. Cursor'u yeniden başlatın!"
```

---

**Son Güncelleme:** 16 Kasım 2025  
**Durum:** Test edildi ve çalışıyor ✅

