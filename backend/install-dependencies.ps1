# Script PowerShell pour installer les dépendances
Write-Host "Installation des dépendances..." -ForegroundColor Green

# Aller dans le dossier backend
Set-Location $PSScriptRoot

# Nettoyer le cache npm
Write-Host "Nettoyage du cache npm..." -ForegroundColor Yellow
npm cache clean --force

# Installer formidable
Write-Host "Installation de formidable..." -ForegroundColor Yellow
npm install formidable@3.5.1 --save

# Vérifier l'installation
Write-Host "Vérification de l'installation..." -ForegroundColor Yellow
if (Test-Path "node_modules\formidable") {
    Write-Host "✓ Formidable installé avec succès!" -ForegroundColor Green
} else {
    Write-Host "✗ Erreur lors de l'installation de formidable" -ForegroundColor Red
    Write-Host "Essayez manuellement: npm install formidable" -ForegroundColor Yellow
}

# Installer toutes les dépendances
Write-Host "Installation de toutes les dépendances..." -ForegroundColor Yellow
npm install

Write-Host "Terminé! Vous pouvez maintenant lancer 'npm start'" -ForegroundColor Green
