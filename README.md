# Task Manager — System do zespołowego zarządzania zadaniami

Aplikacja webowa do organizacji pracy w małych zespołach projektowych.  
Tablica Kanban z drag & drop, autoryzacja JWT, role użytkowników.

## Stos technologiczny

| Warstwa    | Technologia                       |
|-----------|-----------------------------------|
| Frontend  | React 18 + Tailwind CSS + Vite    |
| Backend   | Python 3.12 + FastAPI             |
| Baza      | PostgreSQL 16                     |
| ORM       | SQLAlchemy 2 (async) + Alembic    |
| Auth      | JWT (python-jose + passlib/bcrypt)|
| Kanban    | @hello-pangea/dnd                 |
| Deploy    | Docker Compose                    |

## Szybki start

### Wymagania
- Docker + Docker Compose (v2)

### Uruchomienie

```bash
git clone <url-repozytorium>
cd task-manager
docker compose up --build
```

Po uruchomieniu:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **Swagger UI (dokumentacja API):** http://localhost:8000/docs

### Pierwsze kroki
1. Otwórz http://localhost:5173/register i utwórz konto
2. Utwórz pierwszą tablicę na dashboardzie
3. Dodaj zadania i przeciągaj je między kolumnami

## Struktura projektu

```
task-manager/
├── backend/            # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── main.py     # punkt wejścia
│   │   ├── models.py   # modele bazy danych
│   │   ├── schemas.py  # walidacja Pydantic
│   │   ├── config.py   # ustawienia
│   │   ├── database.py # połączenie z DB
│   │   ├── dependencies.py # auth, JWT
│   │   └── routers/    # endpointy API
│   ├── alembic/        # migracje bazy danych
│   └── Dockerfile
├── frontend/           # React + Tailwind
│   ├── src/
│   │   ├── components/ # Navbar, TaskModal
│   │   ├── pages/      # Login, Register, Dashboard, BoardView, Profile
│   │   ├── context/    # AuthContext (stan użytkownika)
│   │   └── api/        # klient HTTP (axios)
│   └── Dockerfile
├── docs/               # dokumentacja projektu
├── docker-compose.yml  # orchestracja usług
└── README.md
```

## Endpointy API

| Metoda   | Ścieżka                                  | Opis                   |
|----------|------------------------------------------|------------------------|
| POST     | /api/auth/register                       | Rejestracja            |
| POST     | /api/auth/login                          | Logowanie → JWT token  |
| GET      | /api/users/me                            | Profil zalogowanego    |
| PATCH    | /api/users/me                            | Edycja profilu         |
| GET      | /api/users/                              | Lista użytkowników     |
| POST     | /api/boards/                             | Utwórz tablicę        |
| GET      | /api/boards/                             | Moje tablice           |
| GET      | /api/boards/{id}                         | Szczegóły tablicy      |
| DELETE   | /api/boards/{id}                         | Usuń tablicę           |
| POST     | /api/boards/{id}/members/{user_id}       | Dodaj członka          |
| POST     | /api/boards/{id}/tasks/                  | Utwórz zadanie         |
| GET      | /api/boards/{id}/tasks/                  | Lista zadań            |
| PATCH    | /api/boards/{id}/tasks/{task_id}         | Edytuj zadanie/status  |
| DELETE   | /api/boards/{id}/tasks/{task_id}         | Usuń zadanie           |

## Zespół

| Rola                  | Osoba       |
|-----------------------|-------------|
| Project Manager       |             |
| Backend Developer     |             |
| Frontend Developer    |             |
| QA / Tester           |             |

## Licencja

Projekt akademicki — Uniwersytet Warszawski.
