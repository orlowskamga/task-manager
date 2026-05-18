# Instrukcja uruchomienia

## Wymagania

- **Docker Desktop** (Windows/Mac) lub **Docker Engine + Docker Compose v2** (Linux)
- **Git**
- Wolne porty: 5173 (frontend), 8000 (backend), 5432 (baza danych)

## Krok po kroku

### 1. Sklonuj repozytorium

```bash
git clone <adres-repozytorium>
cd task-manager
```

### 2. Uruchom wszystkie usługi

```bash
docker compose up --build
```

Pierwsze uruchomienie pobierze obrazy i zainstaluje zależności (~3–5 min).
Kolejne starty będą znacznie szybsze dzięki cache'owi Dockera.

### 3. Otwórz aplikację

- **Aplikacja:** http://localhost:5173
- **API docs (Swagger):** http://localhost:8000/docs
- **API health check:** http://localhost:8000/api/health

### 4. Zatrzymanie

```bash
docker compose down        # zatrzymaj kontenery
docker compose down -v     # zatrzymaj i usuń dane bazy (reset)
```

## Praca nad kodem

### Tryb deweloperski

Docker Compose montuje katalogi `backend/` i `frontend/src/` jako wolumeny.
Zmiany w kodzie przeładowują się automatycznie (hot reload):
- Backend: uvicorn `--reload`
- Frontend: Vite HMR

### Nowa migracja bazy

Jeśli zmienisz modele w `backend/app/models.py`:

```bash
docker compose exec backend alembic revision --autogenerate -m "opis zmian"
docker compose exec backend alembic upgrade head
```

### Dodanie pakietu Python

```bash
# Dopisz do backend/requirements.txt, potem:
docker compose up --build backend
```

### Dodanie pakietu npm

```bash
docker compose exec frontend npm install <pakiet>
```

## Rozwiązywanie problemów

**Port zajęty:** Zmień mapowanie portów w `docker-compose.yml` (np. `"3000:5173"`).

**Baza się nie łączy:** Upewnij się, że kontener `db` jest zdrowy:
```bash
docker compose ps
```

**Reset bazy danych:**
```bash
docker compose down -v
docker compose up --build
```
