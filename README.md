## Integrantes:
Reyes Vinces Jeremy Daniel: Servicio REST
Delgado Cuadros Jostin Manuel: GRAPHQL
Marcos Zambrano: Frontend, Websocket

## Proyecto autonomo CINE
Este proyecto está construido en una arquitectura de microservicios con diferentes lenguajes de programación en los cuales se desarrollo un componente importante y diferente que construyen este proyecto.

El objetivo del proyecto CINE es ofrecer diferentes peliculas de diferentes generos, poder adquirir un asiento dentro de la sala de cine y ver todas las funciones de esa película.

El rol de administrador cuenta con un panel donde puede ver en tiempo real usuarios activos, funciones, peliculas, etc.

## 🆕 Arquitectura de Autenticación
A partir de esta versión, la autenticación se gestiona a través de un **microservicio independiente** (Auth Service) que centraliza:
- Gestión de usuarios
- Generación de tokens JWT (access y refresh)
- Validación de credenciales
- Rate limiting en login
- Blacklist de tokens revocados

**Ver documentación completa:**
- [Guía rápida (5 min)](QUICK_START_AUTH.md)
- [Resumen de implementación](AUTH_SERVICE_IMPLEMENTATION_SUMMARY.md)
- [Arquitectura completa](AUTHENTICATION_ARCHITECTURE.md)
- [Guía de testing](TESTING_GUIDE.md)

## Lenguajes y Tecnologías utilizadas:

**Backend:**
- Python 3.10+, FastAPI, Uvicorn (REST API + Auth Service)
- Go 1.20+ (WebSocket)
- NestJS + TypeScript (GraphQL)

**Frontend:**
- Next.js + React + TypeScript

**Base de Datos:**
- Supabase (PostgreSQL) - Datos principales
- SQLite (Auth Service) - Gestión de autenticación

**Herramientas:**
- pnpm (gestor de dependencias frontend)
- Git

## Pre-requisitos:
    Python 3.10+
    Node.js 18+
    Go 1.20+
    pnpm
    Git

## Cómo ejecutar el servicio completo (recomendado)

**Terminal 1 - Auth Service:**
```bash
cd backend/auth-service
python -m venv venv
venv/Scripts/activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```
✅ Acceso: http://localhost:8001/api/v1/docs

**Terminal 2 - REST API:**
```bash
cd backend/api-rest
venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
✅ Acceso: http://localhost:8000/api/v1/docs

**Terminal 3 - GraphQL:**
```bash
cd backend/graphql-nest
npm install  # Si no se ha hecho
npm run start:dev
```
✅ Acceso: http://localhost:3001/graphql

**Terminal 4 - WebSocket:**
```bash
cd backend/websocket-go
go run main.go
```
✅ Acceso: ws://localhost:8080/ws

**Terminal 5 - Frontend:**
```bash
cd frontend
pnpm install  # Si no se ha hecho
pnpm dev
```
✅ Acceso: http://localhost:3000

---

## ⚡ Instrucciones rápidas (versión anterior)

### Cómo ejecutar el Auth Service (NUEVO)

Primero ejecuta el servicio de autenticación:
```bash
cd backend/auth-service
python -m venv venv
venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Acceder a: http://localhost:8001/api/v1/docs

### Cómo ejecutar el REST

Cuándo esté en ejecución el frontend, entrar en la url que genera y listo.

## Endopoints

REST: http://localhost:8000/  --Este es el endopoint base, los endopoints de la aplicación son otros, para poder obtener/editar/ingresar/borrar datos de las tablas se usan los siguientes endpoints:

        ---Para Autenticación:---
        POST   /auth/register
        POST   /auth/login
        POST   /auth/login-json

        ---Para la tabla Películas:---
        GET    /peliculas
        POST   /peliculas
        GET    /peliculas/{id}
        PUT    /peliculas/{id}
        DELETE /peliculas/{id}

        ---Para la tabla Salas:---
        GET    /salas
        POST   /salas
        GET    /salas/{id}
        PUT    /salas/{id}
        DELETE /salas/{id}

       --- Para la tabla Funciones:---
        GET    /funciones
        POST   /funciones
        GET    /funciones/{id}
        PUT    /funciones/{id}
        DELETE /funciones/{id}

        ---Para la tabla Asientos:---
        GET    /asientos
        POST   /asientos
        GET    /asientos/{id}
        PUT    /asientos/{id}
        DELETE /asientos/{id}

        ---Para la tabla Reservas:---
        GET    /reservas
        POST   /reservas
        GET    /reservas/{id}
        PUT    /reservas/{id}
        DELETE /reservas/{id}

        ---Para la tabla Facturas:---
        GET    /facturas
        POST   /facturas
        GET    /facturas/{id}
        PUT    /facturas/{id}
        DELETE /facturas/{id}

        ---Para la tabla Incidencias:---
        GET    /incidencias
        POST   /incidencias
        GET    /incidencias/{id}
        PUT    /incidencias/{id}
        DELETE /incidencias/{id}

        ---Para la tabla Usuarios (requieren auth):---
        GET    /usuarios
        GET    /usuarios/me
        GET    /usuarios/{id}
        PUT    /usuarios/{id}
        DELETE /usuarios/{id}

GRAPHQL: http://localhost:${process.env.PORT ?? 3001}/graphql  --El graphql utilizara variable de entorno de supabase que está en un archivo .env

WEBSOCKET: ws://localhost:8080/ws   --El websocket corre en el peurto 8080 por defecto.

FRONTEND: El frontend está conectado por defecto al websocket

## Arquitectura usada:
    La arquitectura que se ha usado es de microservicios, por qué está compuesta de diferente servicios dentro de un mismo repositorio. Usamos un servicio para usar REST (Push, Get, Put, Read, Delete), usamos un servicio aparte (Graphql) para obtener consultas personalizadas desde la base de datos, utilizamos frontend para poder visualizar lo que hacemos y utilizamos websocket en un servicio aparte también, para poder unir el REST y el Graphql con el frontend.

    

## Estructura del proyecto:
cinema-project/
├── backend/
│   ├── app/                    # REST API (Python/FastAPI)
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas/
│   │   ├── routes/
│   │   └── services/
│   ├── graphql/                # GraphQL Service (NestJS)
│   ├── websocket/              # WebSocket Server (Go)
│   ├── requirements.txt
│   ├── .env
│   └── venv/
├── frontend/                   # Frontend (Next.js/React)
└── README.md