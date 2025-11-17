## Integrantes:
Reyes Vinces Jeremy Daniel: Servicio REST
Delgado Cuadros Jostin Manuel: GRAPHQL
Marcos Zambrano: Frontend, Websocket

## Proyecto autonomo CINE
Este proyecto está construido en una arquitectura de microservicios con diferentes lenguajes de programación en los cuales se desarrollo un componente importante y diferente que construyen este proyecto.

El objetivo del proyecto CINE es ofrecer diferentes peliculas de diferentes generos, poder adquirir un asiento dentro de la sala de cine y ver todas las funciones de esa película.

El rol de administrador cuenta con un panel donde puede ver en tiempo real usuarios activos, funciones, peliculas, etc.

## Lenguajes y Tecnologías utilizadas:
Python y fastapi, django y uvicorn para el servicio rest
Go para websocket
Nest y TypeScript para el graphql
Next y React para el frontend
Supabase para base de datos

## Pre-requisitos:
    Python 3.10
    Node.js 18+
    Go 1.20+
    pnpm
    Git

## Cómo ejecutar el REST

Primero se debe entrar al entorno virtual dentro de la carpeta backend:
    venv/Scripts/activate
una vez dentro, instalar todas las librerias dentro del requeriments.txt:
    pip install -r requirements.txt

para ejecutar el rest usar:
    uvicorn app.main:app

generará una url con un puerto. Para poder probar el rest desde SWAGGER se usa /api/v1/docs, quedaría: 
    http://127.0.0.1:8000/api/v1/docs

Uvicorn es el servidor donde correrá la aplicación hecha en FastAPI que contiene todos los endpoints del servicio REST, lógica de negocio, modelos, schemas.
Swagger es la documentación/interfaz visual de FastAPI para poder probar los endpoints.

## Cómo ejecutar el graphql

Para ejecutar el graphql debemos entrar a la carpeta backend y dentro entrar a la carpeta graphql
Dentro instalaremos las siguientes librerias:
    npm i @nestjs/graphql @nestjs/apollo @apollo/server @as-integrations/express5 graphql

cuando se instalen las librerias, se ejecuta con el comando:
    npm run start:dev

y el rest debe estar activado.

## Cómo ejecutar el websocket

Para ejecutar el websocket se debe instalar el lenguaje go en el ordenador desde la pagina web:
    https://go.dev/doc/install

Instalar el lenguaje
Entrar a la carpeta backend/websocket y ejecutar el comando:
    go run main.go

## Cómo ejecutar el frontend
Cuándo se tenga todo lo anterior en ejecución, entrar a la carpeta frontend
instalar pnpm de la siguiente forma (si ya se tiene, saltar este paso):
    npm install -g pnpm

Una vez instalado pnpm, realizar el siguiente comando para instalar las librerias usadas:
    pnpm install

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