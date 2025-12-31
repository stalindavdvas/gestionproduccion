import os
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from dotenv import load_dotenv

load_dotenv()

# Definir los permisos que necesitamos de Google
SCOPE = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive"
]


def get_gspread_client():
    """
    Autentica con Google usando el archivo JSON y retorna el cliente.
    """
    # Buscamos el archivo dentro del contenedor
    # En docker-compose definimos que /app/credentials/google_secret.json es la ruta
    creds_file = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials/google_secret.json")

    # Verificación de seguridad
    if not os.path.exists(creds_file):
        # Intentamos ruta relativa por si lo corres local sin docker
        if os.path.exists("credentials/google_secret.json"):
            creds_file = "credentials/google_secret.json"
        else:
            raise FileNotFoundError(f"❌ ERROR CRÍTICO: No encuentro el archivo de credenciales en: {creds_file}")

    creds = ServiceAccountCredentials.from_json_keyfile_name(creds_file, SCOPE)
    client = gspread.authorize(creds)
    return client