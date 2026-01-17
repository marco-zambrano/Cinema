📂 app/routes/

🎬 peliculas.py
  GET    /api/v1/peliculas            → Listar películas
  POST   /api/v1/peliculas            → Crear película
  GET    /api/v1/peliculas/{id}       → Obtener película
  PUT    /api/v1/peliculas/{id}       → Actualizar película
  DELETE /api/v1/peliculas/{id}       → Eliminar película

🏢 salas.py
  GET    /api/v1/salas                → Listar salas
  POST   /api/v1/salas                → Crear sala
  GET    /api/v1/salas/{id}           → Obtener sala
  PUT    /api/v1/salas/{id}           → Actualizar sala
  DELETE /api/v1/salas/{id}           → Eliminar sala

📅 funciones.py
  GET    /api/v1/funciones            → Listar funciones
  POST   /api/v1/funciones            → Crear función
  GET    /api/v1/funciones/{id}       → Obtener función
  PUT    /api/v1/funciones/{id}       → Actualizar función
  DELETE /api/v1/funciones/{id}       → Eliminar función

💺 asientos.py (igual estructura)
🎫 reservas.py (igual estructura)
🧾 facturas.py (igual estructura)
⚠️ incidencias.py (igual estructura)

👥 usuarios.py
  GET    /api/v1/usuarios             → Listar usuarios 🔒
  GET    /api/v1/usuarios/me          → Mi perfil 🔒
  GET    /api/v1/usuarios/{id}        → Obtener usuario 🔒
  PUT    /api/v1/usuarios/{id}        → Actualizar usuario 🔒
  DELETE /api/v1/usuarios/{id}        → Eliminar usuario 🔒

🔒 = Requiere autenticación JWT