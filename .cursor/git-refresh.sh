#!/bin/bash
# Git durumunu yenile ve Cursor'un algılaması için yardımcı script
# Kullanım: ./git-refresh.sh

echo "🔄 Git durumunu yeniliyorum..."

# 1. Git cache'i temizle
git rm -r --cached . 2>/dev/null || true
git add .

# 2. Git durumunu kontrol et
echo ""
echo "📊 Git durumu:"
git status --short

# 3. Staged dosyaları kontrol et
echo ""
echo "📦 Staged dosyalar:"
git diff --cached --name-only | wc -l | xargs echo "Toplam:"

# 4. Working tree durumu
echo ""
echo "🌳 Working tree:"
if git diff --quiet && git diff --cached --quiet; then
    echo "✅ Temiz - commit edilecek bir şey yok"
else
    echo "⚠️  Değişiklikler var"
fi

echo ""
echo "✅ Git durumu yenilendi. Cursor'u yeniden başlatın (Cmd+Shift+P -> 'Reload Window')"

