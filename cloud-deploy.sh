#!/bin/bash

# ☁️ SMSTK Cloud Deployment
# AWS, DigitalOcean, VPS'lere otomatik deployment

set -e

echo "☁️ SMSTK Cloud Deployment başlatılıyor..."

# Renkli çıktı
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Cloud provider seçimi
echo -e "${BLUE}☁️ Cloud provider seçin:${NC}"
echo "1) 🐳 Docker (Herhangi bir VPS)"
echo "2) 🔧 Ubuntu/Debian VPS"
echo "3) 🚀 AWS EC2"
echo "4) 🌊 DigitalOcean Droplet"

read -p "Seçiminiz (1-4): " PROVIDER

case $PROVIDER in
    1)
        echo -e "${GREEN}🐳 Docker deployment seçildi${NC}"
        echo -e "${YELLOW}📋 Sunucu bilgilerini girin:${NC}"
        read -p "Sunucu IP: " SERVER_IP
        read -p "Kullanıcı adı: " USERNAME
        read -p "SSH key dosyası (opsiyonel): " SSH_KEY
        
        if [ ! -z "$SSH_KEY" ]; then
            SSH_OPTIONS="-i $SSH_KEY"
        else
            SSH_OPTIONS=""
        fi
        
        # Dosyaları sunucuya kopyala
        echo -e "${BLUE}📤 Dosyalar sunucuya kopyalanıyor...${NC}"
        rsync -avz --exclude 'node_modules' --exclude '.git' $SSH_OPTIONS ./ $USERNAME@$SERVER_IP:/tmp/smstk/
        
        # Sunucuda deployment
        ssh $SSH_OPTIONS $USERNAME@$SERVER_IP << 'EOF'
            cd /tmp/smstk
            chmod +x docker-deploy.sh
            ./docker-deploy.sh
EOF
        ;;
    2)
        echo -e "${GREEN}🔧 Ubuntu/Debian VPS seçildi${NC}"
        echo -e "${YELLOW}📋 Sunucu bilgilerini girin:${NC}"
        read -p "Sunucu IP: " SERVER_IP
        read -p "Kullanıcı adı: " USERNAME
        read -p "SSH key dosyası (opsiyonel): " SSH_KEY
        
        if [ ! -z "$SSH_KEY" ]; then
            SSH_OPTIONS="-i $SSH_KEY"
        else
            SSH_OPTIONS=""
        fi
        
        # Dosyaları sunucuya kopyala
        echo -e "${BLUE}📤 Dosyalar sunucuya kopyalanıyor...${NC}"
        rsync -avz --exclude 'node_modules' --exclude '.git' $SSH_OPTIONS ./ $USERNAME@$SERVER_IP:/tmp/smstk/
        
        # Sunucuda deployment
        ssh $SSH_OPTIONS $USERNAME@$SERVER_IP << 'EOF'
            cd /tmp/smstk
            chmod +x deploy-automated.sh
            ./deploy-automated.sh
EOF
        ;;
    3)
        echo -e "${GREEN}🚀 AWS EC2 seçildi${NC}"
        echo -e "${YELLOW}📋 AWS bilgilerini girin:${NC}"
        read -p "EC2 Instance ID: " INSTANCE_ID
        read -p "AWS Region: " AWS_REGION
        read -p "SSH key dosyası (.pem): " SSH_KEY
        
        # AWS CLI kontrolü
        if ! command -v aws &> /dev/null; then
            echo -e "${RED}❌ AWS CLI bulunamadı. Yükleyin: https://aws.amazon.com/cli/${NC}"
            exit 1
        fi
        
        # Instance'a bağlan ve deployment yap
        echo -e "${BLUE}🚀 AWS EC2'ye deployment yapılıyor...${NC}"
        aws ec2-instance-connect send-ssh-public-key \
            --instance-id $INSTANCE_ID \
            --region $AWS_REGION \
            --ssh-public-key file://$SSH_KEY
        
        # Deployment script'ini çalıştır
        ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@$INSTANCE_ID << 'EOF'
            curl -fsSL https://raw.githubusercontent.com/zekikose/smstk/main/deploy-automated.sh | bash
EOF
        ;;
    4)
        echo -e "${GREEN}🌊 DigitalOcean Droplet seçildi${NC}"
        echo -e "${YELLOW}📋 DigitalOcean bilgilerini girin:${NC}"
        read -p "Droplet IP: " DROPLET_IP
        read -p "SSH key dosyası: " SSH_KEY
        
        # Dosyaları sunucuya kopyala
        echo -e "${BLUE}📤 Dosyalar sunucuya kopyalanıyor...${NC}"
        rsync -avz --exclude 'node_modules' --exclude '.git' -i $SSH_KEY ./ root@$DROPLET_IP:/tmp/smstk/
        
        # Sunucuda deployment
        ssh -i $SSH_KEY root@$DROPLET_IP << 'EOF'
            cd /tmp/smstk
            chmod +x deploy-automated.sh
            ./deploy-automated.sh
EOF
        ;;
    *)
        echo -e "${RED}❌ Geçersiz seçim${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Cloud deployment tamamlandı!${NC}"
echo -e "${BLUE}📋 Sonraki adımlar:${NC}"
echo -e "1. ${YELLOW}Domain adınızı sunucu IP'sine yönlendirin${NC}"
echo -e "2. ${YELLOW}SSL sertifikası ekleyin${NC}"
echo -e "3. ${YELLOW}Firewall ayarlarını kontrol edin${NC}"
