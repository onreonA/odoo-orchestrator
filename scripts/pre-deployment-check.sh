#!/bin/bash

# Pre-Deployment Check Script
# Bu script production deployment öncesi gerekli kontrolleri yapar

echo "🔍 Production Deployment Öncesi Kontroller..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check if .env.local exists
echo "1️⃣ Environment Variables Kontrolü..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local dosyası mevcut${NC}"
    
    # Check required variables
    REQUIRED_VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "NEXT_PUBLIC_APP_URL"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env.local; then
            echo -e "${GREEN}  ✅ ${var} tanımlı${NC}"
        else
            echo -e "${RED}  ❌ ${var} eksik${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    echo -e "${YELLOW}⚠️  .env.local dosyası bulunamadı${NC}"
    echo -e "${YELLOW}   .env.example dosyasını kopyalayıp düzenleyin: cp .env.example .env.local${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Check if build works
echo "2️⃣ Build Kontrolü..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build başarılı${NC}"
else
    echo -e "${RED}❌ Build başarısız${NC}"
    echo "   Detaylar için: npm run build"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check if type check passes
echo "3️⃣ Type Check Kontrolü..."
if npm run type-check > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Type check başarılı${NC}"
else
    echo -e "${YELLOW}⚠️  Type check uyarıları var (test dosyalarında olabilir)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Check if migrations exist
echo "4️⃣ Database Migration Kontrolü..."
if [ -d "supabase/migrations" ] && [ "$(ls -A supabase/migrations/*.sql 2>/dev/null)" ]; then
    MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ ${MIGRATION_COUNT} migration dosyası bulundu${NC}"
else
    echo -e "${YELLOW}⚠️  Migration dosyaları bulunamadı${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Check if health check endpoint exists
echo "5️⃣ Health Check Endpoint Kontrolü..."
if [ -f "app/api/health/route.ts" ]; then
    echo -e "${GREEN}✅ Health check endpoint mevcut${NC}"
else
    echo -e "${RED}❌ Health check endpoint bulunamadı${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Özet:"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Tüm kontroller başarılı! Production'a deploy edebilirsiniz.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  ${WARNINGS} uyarı var ama deployment yapılabilir.${NC}"
    exit 0
else
    echo -e "${RED}❌ ${ERRORS} hata ve ${WARNINGS} uyarı bulundu.${NC}"
    echo -e "${RED}   Lütfen hataları düzeltin ve tekrar deneyin.${NC}"
    exit 1
fi

