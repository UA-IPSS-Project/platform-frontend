#!/bin/bash

# Navigate to the script's directory
cd "$(dirname "$0")"

echo "Generating self-signed SSL certificate for Florinhas..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem \
  -out cert.pem \
  -subj "/C=PT/ST=Aveiro/L=Aveiro/O=Florinhas do Vouga/OU=IT/CN=localhost"

if [ $? -eq 0 ]; then
    echo "SL certificate (cert.pem) and key (key.pem) generated successfully."
    echo "Don't forget to restart your frontend container to apply changes:"
    echo "   docker compose restart frontend"
else
    echo "Failed to generate SSL certificate."
    exit 1
fi
