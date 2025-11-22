#!/bin/bash
# Cursor Git Sync Hızlı Düzeltme Script'i
# Kullanım: ./quick-fix.sh

set -e

echo "🔧 Cursor Git Sync Sorunu - Hızlı Düzeltme"
echo "=========================================="
echo ""

# 1. Git config ayarları
echo "1️⃣ Git config ayarlarını güncelliyorum..."
git config --local core.autocrlf false
git config --local core.eol lf
git config --local core.filemode false
echo "   ✅ Git config güncellendi"
echo ""

# 2. Git cache'i temizle ve normalize et
echo "2️⃣ Git cache'i temizliyorum ve normalize ediyorum..."
git rm -r --cached . > /dev/null 2>&1 || true
git add . --renormalize
echo "   ✅ Git cache temizlendi ve normalize edildi"
echo ""

# 3. Git durumunu kontrol et
echo "3️⃣ Git durumunu kontrol ediyorum..."
if git diff --quiet && git diff --cached --quiet; then
    echo "   ✅ Git durumu temiz - commit edilecek bir şey yok"
else
    echo "   ⚠️  Değişiklikler tespit edildi:"
    git status --short
    echo ""
    echo "   💡 Bu değişiklikleri commit etmek ister misiniz? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        git commit -m "chore: normalize git index and line endings"
        echo "   ✅ Değişiklikler commit edildi"
    else
        echo "   ⏭️  Değişiklikler commit edilmedi"
    fi
fi
echo ""

# 4. Sonuç
echo "✅ Düzeltme tamamlandı!"
echo ""
echo "📋 Sonraki adımlar:"
echo "   1. Cursor'u yeniden başlatın (Cmd+Shift+P -> 'Reload Window')"
echo "   2. Git durumunu kontrol edin (git status)"
echo "   3. Sorun devam ederse: .cursor/fix-cursor-git-sync.md dosyasına bakın"
echo ""



