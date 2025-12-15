# Archive

Dette er arkiverte filer som ikke lenger brukes i produksjon, men kan være nyttige for referanse.

## Docker-relaterte filer (ikke i bruk)

Prosjektet bruker for tiden **PM2** i stedet for Docker for deployment.

- `Dockerfile` - Docker image build (multi-stage)
- `docker-compose.yml` - Docker Compose setup
- `deploy.sh` - Deploy-script for Docker Hub push
- `DEPLOYMENT_docker.md` - Docker deployment guide
- `INSTALL_DOCKER.md` - Docker installasjonsveiledning
- `LOCAL_BUILD.md` - Lokal Docker build strategi

## Nginx config

- `nginx.conf` - Original nginx config (nå administrert direkte på serveren)

## Hvorfor arkivert?

Vi byttet fra Docker til PM2 for:
- ✅ Raskere iterasjoner (ingen Docker build)
- ✅ Enklere debugging (direkte tilgang til logs)
- ✅ Fungerer bedre med 1GB RAM
- ✅ Enklere deployment workflow

Filene er bevart for referanse hvis vi senere ønsker å gå tilbake til Docker.
