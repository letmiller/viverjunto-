#!/bin/bash
# ViverJunto — Script de atualização
# Uso: bash atualizar.sh "mensagem do commit"

MSG=${1:-"feat: atualização"}

echo "📦 Extraindo ZIP..."
unzip -o viverjunto-parte1.zip -d /tmp/vj-update > /dev/null
cp -r /tmp/vj-update/viverjunto/. .
rm -rf /tmp/vj-update viverjunto-parte1.zip

echo "📤 Subindo para o GitHub..."
git add .
git commit -m "$MSG"
git push

echo "✅ Pronto! Vercel vai fazer o deploy automaticamente."
