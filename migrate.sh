#!/bin/bash

# AdsGuardsPro Database Migration Script
# Yeni tablo yapısını uygular

echo "🚀 AdsGuardsPro Database Migration Başlatılıyor..."
echo ""

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database bilgileri
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-adsguardspro}"

echo "📋 Database Bilgileri:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Onay al
read -p "Devam etmek istiyor musunuz? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "${YELLOW}❌ Migration iptal edildi${NC}"
    exit 1
fi

echo ""
echo "⚠️  DİKKAT: Bu işlem mevcut tablolarınızı etkileyebilir!"
echo "   Lütfen devam etmeden önce database backup'ı aldığınızdan emin olun."
echo ""
read -p "Backup aldınız mı? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "${YELLOW}❌ Lütfen önce backup alın!${NC}"
    exit 1
fi

echo ""
echo "📦 Migration başlıyor..."
echo ""

# SQL dosyasını çalıştır
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f db.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "${GREEN}✅ Migration başarıyla tamamlandı!${NC}"
    echo ""
    echo "📊 Oluşturulan tablolar:"
    echo "  ✅ profiles"
    echo "  ✅ domains"
    echo "  ✅ devices"
    echo "  ✅ ip_info"
    echo "  ✅ ip_whitelist"
    echo "  ✅ ads_campaigns"
    echo "  ✅ ad_clicks"
    echo "  ✅ blocked_ips"
    echo "  ✅ sessions"
    echo "  ✅ session_events"
    echo "  ✅ google_oauth_tokens"
    echo ""
    echo "🔧 Helper fonksiyonlar:"
    echo "  ✅ check_ip_whitelist()"
    echo "  ✅ get_top_500_ips_for_domain()"
    echo "  ✅ cleanup_old_blocked_ips()"
    echo ""
    echo "${GREEN}🎉 Sistem hazır! Development server'ı başlatabilirsiniz.${NC}"
    echo ""
    echo "Komut: npm run dev"
else
    echo ""
    echo "${RED}❌ Migration sırasında hata oluştu!${NC}"
    echo "Lütfen hata mesajlarını kontrol edin."
    exit 1
fi

