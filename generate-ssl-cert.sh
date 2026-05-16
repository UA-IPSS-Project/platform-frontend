#!/bin/bash
# Script para gerar certificados SSL auto-assinados (DESENVOLVIMENTO)

mkdir -p ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=PT/ST=Aveiro/L=Aveiro/O=Florinhas do Vouga/CN=localhost"

echo "✅ Certificados SSL gerados em ./ssl/"
echo "⚠️  ATENÇÃO: Estes são certificados auto-assinados apenas para DESENVOLVIMENTO"
echo "   Para PRODUÇÃO, use Let's Encrypt (ver README-SSL.md)"
