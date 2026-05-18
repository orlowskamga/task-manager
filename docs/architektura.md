# Architektura systemu

## Ogólny schemat

System składa się z trzech warstw uruchamianych jako kontenery Docker:

```
┌─────────────┐     HTTP/JSON     ┌──────────────┐     SQL      ┌──────────────┐
│   Frontend   │ ◄──────────────► │   Backend    │ ◄──────────► │  PostgreSQL   │
│  React/Vite  │   REST API       │   FastAPI    │   asyncpg    │     16        │
│  port 5173   │                  │  port 8000   │              │  port 5432    │
└─────────────┘                   └──────────────┘              └──────────────┘
```

## Frontend

- **Framework:** React 18 z hookami
- **Bundler:** Vite 5
- **Style:** Tailwind CSS 3
- **Routing:** React Router v6
- **Stan autoryzacji:** React Context (`AuthContext`)
- **Komunikacja z API:** Axios z interceptorami JWT
- **Kanban drag & drop:** @hello-pangea/dnd

Architektura komponentowa: strony (`pages/`) korzystają z komponentów (`components/`)
i współdzielą stan przez konteksty (`context/`).

## Backend

- **Framework:** FastAPI (async)
- **ORM:** SQLAlchemy 2 z async sessionmaker
- **Migracje:** Alembic
- **Walidacja:** Pydantic v2 ze schematami
- **Autoryzacja:** JWT (python-jose), hashowanie haseł bcrypt
- **Struktura:** routery w `routers/`, logika auth w `dependencies.py`

Każdy endpoint wymaga tokenu JWT (oprócz `/register` i `/login`).
Token zawiera `sub` (user ID) i `exp` (czas wygaśnięcia — 24h).

## Baza danych

PostgreSQL 16, cztery tabele:

- `users` — konta użytkowników
- `boards` — tablice Kanban
- `board_members` — relacja many-to-many (użytkownicy ↔ tablice)
- `tasks` — zadania z priorytetem, statusem, terminem, przypisaniem

Migracje zarządzane przez Alembic (`alembic upgrade head` uruchamiane automatycznie
przy starcie kontenera backend).

## Bezpieczeństwo

- Hasła hashowane bcrypt (passlib)
- Tokeny JWT z kluczem SECRET_KEY (konfigurowalny przez zmienną środowiskową)
- CORS ograniczony do dozwolonych originów
- Walidacja danych wejściowych przez Pydantic
