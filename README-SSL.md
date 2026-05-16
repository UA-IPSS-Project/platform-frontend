# Configuração SSL/TLS para Nginx

Este documento explica como configurar HTTPS na plataforma Florinhas do Vouga.

## 🔒 Opções de Certificados

### Opção 1: Certificados Auto-Assinados (DESENVOLVIMENTO)

**Uso:** Apenas para ambiente de desenvolvimento local.

```bash
cd platform-frontend
chmod +x generate-ssl-cert.sh
./generate-ssl-cert.sh
```

Isto cria:

- `ssl/cert.pem` - Certificado público
- `ssl/key.pem` - Chave privada

⚠️ **Aviso:** O navegador mostrará aviso de segurança. Aceite manualmente para testar.

### Opção 2: Let's Encrypt (PRODUÇÃO RECOMENDADO)

**Uso:** Ambiente de produção com domínio público.

#### Pré-requisitos

- Domínio registado (ex: `florinhas.pt`)
- DNS apontando para o servidor
- Portas 80 e 443 abertas no firewall

#### Instalação com Certbot

```bash
# 1. Instalar certbot
sudo apt update
sudo apt install certbot

# 2. Parar o container frontend temporariamente
docker stop florinhas_frontend

# 3. Obter certificado (substitua SEU_DOMINIO.pt)
sudo certbot certonly --standalone -d florinhas.pt -d www.florinhas.pt

# 4. Copiar certificados para o projeto
sudo cp /etc/letsencrypt/live/florinhas.pt/fullchain.pem platform-frontend/ssl/cert.pem
sudo cp /etc/letsencrypt/live/florinhas.pt/privkey.pem platform-frontend/ssl/key.pem
sudo chown $USER:$USER platform-frontend/ssl/*.pem

# 5. Reiniciar container
docker start florinhas_frontend
```

#### Renovação Automática

Let's Encrypt expira em 90 dias. Configure renovação automática:

```bash
# Criar script de renovação
sudo nano /etc/cron.d/certbot-renew
```

Conteúdo:

```bash
0 3 * * * root certbot renew --quiet --deploy-hook "docker restart florinhas_frontend"
```

### Opção 3: Certificado Manual (Empresa/Organização)

Se tens certificado comprado:

```bash
mkdir -p platform-frontend/ssl
cp seu_certificado.crt platform-frontend/ssl/cert.pem
cp sua_chave_privada.key platform-frontend/ssl/key.pem
```

## 🐳 Configuração Docker

### Atualizar docker-compose.yml

Adiciona volume para certificados SSL no serviço `frontend`:

```yaml
frontend:
  build:
    context: ../platform-frontend/
    dockerfile: Dockerfile
  container_name: florinhas_frontend
  depends_on:
    - api-gateway
    - marcacoes
    - requisicoes
    - notificacoes
  ports:
    - "80:80"    # HTTP (redireciona para HTTPS)
    - "443:443"  # HTTPS
  volumes:
    - ../platform-frontend/ssl:/etc/nginx/ssl:ro  # Certificados SSL
  restart: unless-stopped
```

### Reconstruir e Reiniciar

```bash
cd platform-backend
docker-compose down
docker-compose up -d --build frontend
```

## ✅ Testar Configuração

### 1. Verificar redirecionamento HTTP → HTTPS

```bash
curl -I http://localhost
# Deve retornar: HTTP/1.1 301 Moved Permanently
# Location: https://localhost/
```

### 2. Testar HTTPS

```bash
# Com certificado auto-assinado (ignora verificação)
curl -k https://localhost

# Com Let's Encrypt (verificação completa)
curl https://florinhas.pt
```

### 3. Verificar no navegador

Acede a `https://localhost` ou `https://florinhas.pt`

**Certificado válido:** Cadeado verde 🔒  
**Auto-assinado:** Aviso de segurança (normal em dev)

## 🔐 Segurança Implementada

O `nginx.conf` já inclui:

✅ **TLS 1.2 e 1.3** - Protocolos modernos  
✅ **Ciphers seguros** - Apenas algoritmos fortes  
✅ **HSTS** - Força HTTPS por 1 ano  
✅ **X-Frame-Options** - Proteção contra clickjacking  
✅ **X-Content-Type-Options** - Previne MIME sniffing  
✅ **X-XSS-Protection** - Proteção XSS básica  
✅ **HTTP/2** - Performance melhorada

## 🚨 Troubleshooting

### Erro: "SSL certificate problem"

```bash
# Verificar permissões
ls -la platform-frontend/ssl/
# Deve mostrar: -rw-r--r-- para ambos os ficheiros
```

### Erro: "Address already in use"

```bash
# Verificar se porta 443 está ocupada
sudo netstat -tlnp | grep :443

# Parar processo conflituoso
sudo systemctl stop apache2  # ou outro serviço
```

### Container não inicia

```bash
# Ver logs
docker logs florinhas_frontend

# Testar configuração nginx
docker exec florinhas_frontend nginx -t
```

## 📋 Checklist de Produção

Antes de ir para produção:

- [ ] Domínio registado e DNS configurado
- [ ] Certificado Let's Encrypt obtido
- [ ] Portas 80 e 443 abertas no firewall
- [ ] Renovação automática configurada
- [ ] Backup dos certificados criado
- [ ] Teste de redirecionamento HTTP→HTTPS
- [ ] Teste de WebSockets sobre HTTPS
- [ ] Verificação SSL em <https://www.ssllabs.com/ssltest/>

## 🔄 Manutenção

### Verificar expiração do certificado

```bash
openssl x509 -in platform-frontend/ssl/cert.pem -noout -dates
```

### Renovar manualmente (Let's Encrypt)

```bash
sudo certbot renew
docker restart florinhas_frontend
```

## 📚 Referências

- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx SSL Module](https://nginx.org/en/docs/http/ngx_http_ssl_module.html)
