# Setup Rápido HTTPS

## Para Desenvolvimento (Certificado Auto-Assinado)

```bash
# 1. Gerar certificados
cd platform-frontend
./generate-ssl-cert.sh

# 2. Reiniciar containers
cd ../platform-backend
docker-compose down
docker-compose up -d

# 3. Aceder
# HTTP: http://localhost:3000 (redireciona para HTTPS)
# HTTPS: https://localhost:3443
```

⚠️ O navegador mostrará aviso de segurança. Clica em "Avançado" → "Aceitar risco e continuar".

## Para Produção (Let's Encrypt)

Ver instruções completas em `README-SSL.md`.

```bash
# Resumo:
sudo certbot certonly --standalone -d SEU_DOMINIO.pt
sudo cp /etc/letsencrypt/live/SEU_DOMINIO.pt/fullchain.pem platform-frontend/ssl/cert.pem
sudo cp /etc/letsencrypt/live/SEU_DOMINIO.pt/privkey.pem platform-frontend/ssl/key.pem
sudo chown $USER:$USER platform-frontend/ssl/*.pem
docker-compose restart frontend
```

## Portas

- **3000** - HTTP (redireciona para HTTPS)
- **3443** - HTTPS (porta principal)

Em produção, usa 80 e 443 (portas standard).
