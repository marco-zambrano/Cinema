# Queries GraphQL Disponibles - Guía de Pruebas

Este documento contiene todas las queries disponibles en el GraphQL Playground, organizadas por módulo. Puedes copiar y pegar cada query para probarlas una por una.

**URL del GraphQL Playground:** `http://localhost:3001/graphql`

---

## 📋 Índice de Módulos

1. [Asientos](#1-asientos)
2. [Usuarios](#2-usuarios)
3. [Peliculas](#3-peliculas)
4. [Salas](#4-salas)
5. [Funciones](#5-funciones)
6. [Reservas](#6-reservas)
7. [Reserva-Asiento](#7-reserva-asiento)
8. [Facturas](#8-facturas)
9. [Incidencias](#9-incidencias)

---

## 1. Asientos

### Query: Obtener todos los asientos
```graphql
query GetAllAsientos {
  asientos {
    id_asiento
    numero
    estado
  }
}
```

### Query: Obtener un asiento por ID
```graphql
query GetAsientoById {
  asiento(id: "ID_DEL_ASIENTO_AQUI") {
    id_asiento
    numero
    estado
  }
}
```

**Nota:** Reemplaza `"ID_DEL_ASIENTO_AQUI"` con un ID real de asiento.

---

## 2. Usuarios

### Query: Obtener todos los usuarios
```graphql
query GetAllUsuarios {
  usuarios {
    id_usuario
    nombre
    correo
    password
    rol
  }
}
```

### Query: Obtener un usuario por ID
```graphql
query GetUsuarioById {
  usuario(id: 1) {
    id_usuario
    nombre
    correo
    password
    rol
  }
}
```

**Nota:** El ID del usuario es de tipo `Int`, no `String`.

---

## 3. Peliculas

### Query: Obtener todas las películas
```graphql
query GetAllPeliculas {
  peliculas {
    id_pelicula
    titulo
    genero
    descripcion
    clasificacion
    duracion
  }
}
```

### Query: Obtener una película por ID
```graphql
query GetPeliculaById {
  pelicula(id: "ID_DE_LA_PELICULA_AQUI") {
    id_pelicula
    titulo
    genero
    descripcion
    clasificacion
    duracion
  }
}
```

**Nota:** Reemplaza `"ID_DE_LA_PELICULA_AQUI"` con un ID real de película.

---

## 4. Salas

### Query: Obtener todas las salas
```graphql
query GetAllSalas {
  salas {
    id_sala
    nombre
    capacidad
    tipo
    estado
    filas
    columnas
  }
}
```

### Query: Obtener una sala por ID
```graphql
query GetSalaById {
  sala(id: "ID_DE_LA_SALA_AQUI") {
    id_sala
    nombre
    capacidad
    tipo
    estado
    filas
    columnas
  }
}
```

**Nota:** Reemplaza `"ID_DE_LA_SALA_AQUI"` con un ID real de sala.

---

## 5. Funciones

### Query: Obtener todas las funciones
```graphql
query GetAllFunciones {
  funciones {
    id_funcion
    fecha_hora
    precio
    peliculas {
      id_pelicula
      titulo
      genero
      clasificacion
      duracion
    }
    salas {
      id_sala
      nombre
      capacidad
      tipo
      estado
      filas
      columnas
    }
  }
}
```

### Query: Obtener una función por ID
```graphql
query GetFuncionById {
  funcion(id: "ID_DE_LA_FUNCION_AQUI") {
    id_funcion
    fecha_hora
    precio
    peliculas {
      id_pelicula
      titulo
      genero
      clasificacion
      duracion
    }
    salas {
      id_sala
      nombre
      capacidad
      tipo
      estado
      filas
      columnas
    }
  }
}
```

**Nota:** Reemplaza `"ID_DE_LA_FUNCION_AQUI"` con un ID real de función.

---

## 6. Reservas

### Query: Obtener todas las reservas
```graphql
query GetAllReservas {
  reservas {
    id_reserva
    id_usuario
    id_funcion
    cantidad_asientos
    estado
    total
    fecha_reserva
  }
}
```

### Query: Obtener una reserva por ID
```graphql
query GetReservaById {
  reserva(id: "ID_DE_LA_RESERVA_AQUI") {
    id_reserva
    id_usuario
    id_funcion
    cantidad_asientos
    estado
    total
    fecha_reserva
  }
}
```

**Nota:** Reemplaza `"ID_DE_LA_RESERVA_AQUI"` con un ID real de reserva.

---

## 7. Reserva-Asiento

### Query: Obtener asientos por reserva
```graphql
query GetAsientosPorReserva {
  asientosPorReserva(id_reserva: "ID_DE_LA_RESERVA_AQUI") {
    id_reserva
    id_asiento
  }
}
```

**Nota:** Reemplaza `"ID_DE_LA_RESERVA_AQUI"` con un ID real de reserva.

---

## 8. Facturas

### Query: Obtener todas las facturas
```graphql
query GetAllFacturas {
  facturas {
    id_factura
    fecha_emision
    total
    metodo_pago
    id_reserva
    reserva {
      id_reserva
      id_usuario
      id_funcion
      cantidad_asientos
      estado
      total
      fecha_reserva
    }
  }
}
```

### Query: Obtener una factura por ID
```graphql
query GetFacturaById {
  factura(id: "ID_DE_LA_FACTURA_AQUI") {
    id_factura
    fecha_emision
    total
    metodo_pago
    id_reserva
    reserva {
      id_reserva
      id_usuario
      id_funcion
      cantidad_asientos
      estado
      total
      fecha_reserva
    }
  }
}
```

**Nota:** Reemplaza `"ID_DE_LA_FACTURA_AQUI"` con un ID real de factura.

---

## 9. Incidencias

### Query: Obtener todas las incidencias
```graphql
query GetAllIncidencias {
  incidencias {
    id_incidencia
    fecha_generacion
  }
}
```

### Query: Obtener una incidencia por ID
```graphql
query GetIncidenciaById {
  incidencia(id: "ID_DE_LA_INCIDENCIA_AQUI") {
    id_incidencia
    fecha_generacion
  }
}
```

---

## Cómo Usar en GraphQL Playground

1. Abre tu navegador y ve a: `http://localhost:3001/graphql`
2. Copia una de las queries de arriba
3. Pégala en el panel izquierdo del playground
4. Si la query requiere variables, úsalas en el panel de variables (abajo)
5. Presiona el botón de "Play" (▶️) para ejecutar la query
6. Revisa los resultados en el panel derecho

---