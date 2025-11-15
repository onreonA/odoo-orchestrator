#!/bin/bash
# Cursor Commit Workflow - Otomatik Kontroller

echo "🔍 Commit öncesi kontroller başlatılıyor..."

# 1. Git status kontrolü
echo "📋 Git durumu kontrol ediliyor..."
git status --short

# 2. Silinen dosyaları kontrol et
DELETED_FILES=$(git status --short | grep "^ D" | awk '{print $2}')
if [ ! -z "$DELETED_FILES" ]; then
    echo "⚠️  Silinen dosyalar bulundu:"
    echo "$DELETED_FILES"
fi

# 3. Kritik sayfaları kontrol et
CRITICAL_PAGES=(
    "app/(dashboard)/departments/page.tsx"
    "app/(dashboard)/tasks/page.tsx"
    "app/(dashboard)/layout.tsx"
    "lib/supabase/server.ts"
    "lib/utils.ts"
)

echo "🔍 Kritik dosyalar kontrol ediliyor..."
for page in "${CRITICAL_PAGES[@]}"; do
    if [ ! -f "$page" ]; then
        echo "❌ EKSİK: $page"
    else
        echo "✅ OK: $page"
    fi
done

echo "✅ Kontroller tamamlandı"
