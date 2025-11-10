#!/bin/bash

# Vercel Deployment Script
# Bu script Vercel'e deployment yapar

echo "🚀 Vercel Deployment Başlatılıyor..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI bulunamadı${NC}"
    echo "   Kurulum: npm install -g vercel"
    echo "   Devam ediliyor..."
    npm install -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel'e giriş yapılmamış${NC}"
    echo "   Giriş yapılıyor..."
    vercel login
fi

echo ""
echo "📋 Deployment Seçenekleri:"
echo "  1. Preview Deployment (test için)"
echo "  2. Production Deployment"
echo ""
read -p "Seçiminiz (1 veya 2): " choice

case $choice in
    1)
        echo ""
        echo "🔍 Preview deployment başlatılıyor..."
        vercel
        ;;
    2)
        echo ""
        echo "🚀 Production deployment başlatılıyor..."
        vercel --prod
        ;;
    *)
        echo "Geçersiz seçim. Preview deployment yapılıyor..."
        vercel
        ;;
esac

echo ""
echo -e "${GREEN}✅ Deployment tamamlandı!${NC}"
echo ""
echo "📝 Sonraki Adımlar:"
echo "  1. Health check endpoint'ini test edin:"
echo "     curl https://your-domain.vercel.app/api/health"
echo "  2. Environment variables'ları Vercel Dashboard'dan kontrol edin"
echo "  3. Monitoring kurulumunu yapın"

