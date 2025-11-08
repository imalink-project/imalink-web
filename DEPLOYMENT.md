# ImaLink Frontend Deployment Guide

Deployment av ImaLink Web til DigitalOcean med subdomenet `imalink.trollfjell.com`.

## 📋 Forutsetninger

- DigitalOcean droplet med Docker og Docker Compose installert
- Nginx installert og kjører
- DNS A-record: `imalink.trollfjell.com` → droplet IP
- Backend API kjører på `api.trollfjell.com`
- Certbot for Let's Encrypt SSL (valgfritt, men anbefalt)

## 🚀 Deployment Steps

### 1. SSH til DigitalOcean Droplet

```bash
ssh kjell@trollfjell.com
```

### 2. Klon Repo eller Oppdater

```bash
# Første gang:
cd ~
git clone https://github.com/kjelkols/imalink-web.git
cd imalink-web

# Eller oppdater eksisterende:
cd ~/imalink-web
git pull origin main
```

### 3. Build og Start Container

```bash
# Build image
sudo docker compose build

# Start service
sudo docker compose up -d

# Sjekk at den kjører
sudo docker compose ps
sudo docker compose logs -f
```

### 4. Konfigurer Nginx

```bash
# Kopier nginx konfigurasjon
sudo cp nginx.conf /etc/nginx/sites-available/imalink.trollfjell.com

# Aktiver site
sudo ln -s /etc/nginx/sites-available/imalink.trollfjell.com /etc/nginx/sites-enabled/

# Test nginx konfigurasjon
sudo nginx -t
```

### 5. Sett opp SSL med Let's Encrypt

```bash
# Installer certbot hvis ikke allerede installert
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Generer SSL-sertifikat
sudo certbot --nginx -d imalink.trollfjell.com

# Certbot vil automatisk oppdatere nginx-konfigurasjonen
```

**Alternativ**: Hvis du allerede har sertifikater, verifiser at de eksisterer:
```bash
ls -la /etc/letsencrypt/live/imalink.trollfjell.com/
```

### 6. Restart Nginx

```bash
sudo systemctl restart nginx
```

### 7. Verifiser Deployment

1. **Åpne i nettleser**: https://imalink.trollfjell.com
2. **Sjekk at SSL fungerer** (grønn hengelås)
3. **Test login** med eksisterende bruker
4. **Verifiser at bilder lastes** fra backend API

### 8. DNS Konfigurasjon

I DigitalOcean dashboard:
1. Gå til **Networking → Domains**
2. Velg **trollfjell.com**
3. Legg til ny **A Record**:
   - **Hostname**: `imalink`
   - **Will direct to**: Velg din droplet
   - **TTL**: 3600

Vent 2-5 minutter for DNS propagering.

Verifiser med:
```bash
dig imalink.trollfjell.com
# eller
nslookup imalink.trollfjell.com
```

## 🔄 Oppdatering (Re-deployment)

Når du har gjort endringer i koden:

```bash
# Lokalt:
git add .
git commit -m "Your changes"
git push origin main

# På serveren:
cd ~/imalink-web
git pull origin main
sudo docker compose down
sudo docker compose build
sudo docker compose up -d

# Ingen nginx restart nødvendig (proxyer til samme port)
```

## 🔍 Feilsøking

### Container starter ikke

```bash
# Sjekk logs
sudo docker compose logs imalink-web

# Rebuild fra scratch
sudo docker compose down
sudo docker compose build --no-cache
sudo docker compose up -d
```

### Port 3000 i bruk

```bash
# Sjekk hva som bruker port 3000
sudo lsof -i :3000

# Container skal bare lytte på localhost (127.0.0.1:3000)
```

### Nginx 502 Bad Gateway

```bash
# Sjekk at containeren kjører
sudo docker compose ps

# Sjekk nginx error log
sudo tail -f /var/log/nginx/imalink.error.log

# Test at port 3000 svarer
curl http://localhost:3000
```

### SSL/HTTPS fungerer ikke

```bash
# Sjekk nginx konfigurasjon
sudo nginx -t

# Verifiser sertifikat
sudo certbot certificates

# Forny sertifikat manuelt om nødvendig
sudo certbot renew --dry-run
```

### Bilder lastes ikke

- Verifiser at API er tilgjengelig: `curl https://api.trollfjell.com/api/v1/photos/`
- Sjekk CORS-innstillinger i backend
- Sjekk nettverks-tab i browser DevTools

## 📊 Monitoring

```bash
# Se live logs
sudo docker compose logs -f

# Sjekk ressursbruk
sudo docker stats imalink-web

# Container info
sudo docker inspect imalink-web

# Nginx access log
sudo tail -f /var/log/nginx/imalink.access.log

# Nginx error log
sudo tail -f /var/log/nginx/imalink.error.log
```

## 🛑 Stoppe Service

```bash
# Stopp uten å fjerne container
sudo docker compose stop

# Stopp og fjern container
sudo docker compose down

# Stopp, fjern container og images
sudo docker compose down --rmi all

# Disable nginx site (uten å slette)
sudo rm /etc/nginx/sites-enabled/imalink.trollfjell.com
sudo systemctl reload nginx
```

## 🔐 Miljøvariabler

API URL er hardkodet i `docker-compose.yml`:
```yaml
args:
  NEXT_PUBLIC_API_URL: https://api.trollfjell.com/api/v1
```

For å endre, oppdater `docker-compose.yml` og rebuild.

## 📝 Notater

- Next.js kjører i production mode
- Standalone output reduserer image størrelse
- Port 3000 eksponeres kun til localhost (127.0.0.1)
- Nginx håndterer SSL/TLS og reverse proxy
- Automatisk restart ved feil (`restart: unless-stopped`)
- Let's Encrypt SSL via certbot
- Certbot auto-renewal via systemd timer
