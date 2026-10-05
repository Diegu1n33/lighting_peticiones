import os

# Se fija antes de importar la app para que todas las pruebas usen la misma base temporal.
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["ADMIN_PASSWORD"] = "secreto"
