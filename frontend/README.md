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
