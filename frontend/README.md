# Para el graphql:
# 1: Creamos e instalamos un entorno virtual de python
python -m venv venv
venv\Scripts\activate //para activarlo

# 2: Instalar dependencias

pip install django
pip install psycopg2-binary

Con django podemos usar ORM y con el driver de postgresql se permite una conexión de django a Supabase

# 3: Crear el proyecto Django

django-admin startproject cinema_backend .

Genera la estructura básica del proyecto (manage.py) y la carpeta cinema_backend con settings.py, urls.py, asgi.py, wsgi.py

# 4: Crear una app django para el dominio

python manage.py startapp core

Creó la carpeta core/ con archivos models.py, views.py, admin.py que es donde se pondran los modelos y
la lógica relacionada al dominio

# 5: Conectar django a la base de datos en supabase

El archivo settings.py dentro de la carpeta cinema_backend se editó para configurar la conexión con supabase

# 6: Se generaron modelos Django desde la base de datos

python manage.py inspectdb > core/models.py

Django leyó las tablas existentes en Supabase y generó las clases

# 7: Instalar paquetes necesarios para empezar con graphql

pip install strawberry-graphql strawberry-graphql-django

Instalaremos strawberry con quien usaremos graphql y conectaremos con django

# 8: Configurar django para usar graphql

Una vez instalado strawberry-graphql, editaremos el archivo settings.py agregando la siguiente linea:
    'strawberry.django'
dentro de INSTALLED_APPS = []

# 9: Crear schemas con strawberry
Creamos una carpeta llamada schemas y dentro pondremos archivos de schema para cada entidad
configuraremos segun los models de django
crearemos clase query para hacer consultas y mutation para create, update, delete
Terminando eso, haremos un schema raiz combinando todas las query y todos los mutation de todos los archivos

# 10: Pruebas
Para probar todo el graphql usaremos: python manage.py runserver
si todo esta en orden no habra problemas, luego en el navegador accederemos ah: http://127.0.0.1:8000/graphql/ y realizamos las pruebas, por ejemplo:
    mutation {
        createUsuario(nombre: "Jeremy", correo: "jeremy@email.com", password: "1234", rol: "admin") {
            idUsuario
            nombre
            correo
            password
            rol
    }
    }

    devuelve algo como:
        "data": {
            "createUsuario": {
            "idUsuario": "ac7706a5-3bca-4b88-a4a9-2b76815a3b25",
            "nombre": "Jeremy",
            "correo": "jeremy@email.com",
            "password": "1234",
            "rol": "admin"
            }
        }
        
asi sabremos que todo está en orden.