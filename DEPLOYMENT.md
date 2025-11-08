# ImaLink Frontend Deployment Guide

Deployment av ImaLink Web til DigitalOcean med subdomenet `imalink.trollfjell.com`.

## 📋 Forutsetninger

- DigitalOcean droplet med Docker og Docker Compose installert
- Traefik reverse proxy kjører allerede (for SSL/HTTPS)
- DNS A-record: `imalink.trollfjell.com` → droplet IP
- Backend API kjører på `api.trollfjell.com`

## 🚀 Deployment Steps

### 1. SSH til DigitalOcean Droplet

```bash
ssh root@trollfjell.com
# eller ssh root@<droplet-ip>
```

### 2. Klon Repo eller Oppdater

```bash
# Første gang:
cd /opt
git clone https://github.com/kjelkols/imalink-web.git
cd imalink-web

# Eller oppdater eksisterende:
cd /opt/imalink-web
git pull origin main
```

### 3. Build og Start Container

```bash
# Build image
docker compose build

# Start service
docker compose up -d

# Sjekk at den kjører
docker compose ps
docker compose logs -f
```

### 4. Verifiser Deployment

1. **Åpne i nettleser**: https://imalink.trollfjell.com
2. **Sjekk at SSL fungerer** (grønn hengelås)
3. **Test login** med eksisterende bruker
4. **Verifiser at bilder lastes** fra backend API

### 5. DNS Konfigurasjon (hvis ikke allerede gjort)

Logg inn på DNS-provider for `trollfjell.com` og legg til:

```
Type: A Record
Host: imalink
Value: <droplet-ip-address>
TTL: 3600 (eller standard)
```

Vent 5-15 minutter for DNS propagering.

## 🔄 Oppdatering (Re-deployment)

Når du har gjort endringer i koden:

```bash
# Lokalt:
git add .
git commit -m "Your changes"
git push origin main

# På serveren:
cd /opt/imalink-web
git pull origin main
docker compose down
docker compose build
docker compose up -d
```

## 🔍 Feilsøking

### Container starter ikke

```bash
# Sjekk logs
docker compose logs imalink-web

# Rebuild fra scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Port 3000 i bruk

```bash
# Sjekk hva som bruker port 3000
sudo lsof -i :3000

# Eller endre port i docker-compose.yml:
# ports:
#   - "3001:3000"
```

### SSL/HTTPS fungerer ikke

Sjekk at Traefik kjører:
```bash
docker ps | grep traefik
```

Verifiser labels i `docker-compose.yml` matcher Traefik-konfigurasjonen.

### Bilder lastes ikke

- Verifiser at API er tilgjengelig: `curl https://api.trollfjell.com/api/v1/photos/`
- Sjekk CORS-innstillinger i backend
- Sjekk nettverks-tab i browser DevTools

## 📊 Monitoring

```bash
# Se live logs
docker compose logs -f

# Sjekk ressursbruk
docker stats imalink-web

# Container info
docker inspect imalink-web
```

## 🛑 Stoppe Service

```bash
# Stopp uten å fjerne container
docker compose stop

# Stopp og fjern container
docker compose down

# Stopp, fjern container og images
docker compose down --rmi all
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
- Port 3000 eksponeres internt til Traefik
- Automatisk restart ved feil (`restart: unless-stopped`)
- Let's Encrypt SSL via Traefik
