from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services.chat_service import interpretar_intencion, buscar_datos_y_generar_excel
import base64

router = APIRouter(prefix="/api/chat", tags=["IA"])


class MensajeUsuario(BaseModel):
    texto: str


@router.post("/mensaje")
def procesar_mensaje(mensaje: MensajeUsuario, db: Session = Depends(get_db)):
    # 1. La IA entiende qué quiere el usuario
    intencion_data = interpretar_intencion(mensaje.texto)

    if not intencion_data:
        return {"tipo": "texto",
                "contenido": "Lo siento, tuve un error conectando con mi cerebro IA. Intenta de nuevo."}

    # 2. Si quiere reporte, buscamos en DB
    if intencion_data.get("intencion") == "reporte_tecnico":
        archivo_excel, respuesta = buscar_datos_y_generar_excel(intencion_data, db)

        # Si archivo_excel es None, respuesta es el mensaje de error ("No se encontró...")
        if archivo_excel is None:
            return {"tipo": "texto", "contenido": respuesta}

        # Si hay archivo, lo convertimos a Base64 para enviarlo fácil al JSON
        archivo_b64 = base64.b64encode(archivo_excel.read()).decode('utf-8')

        return {
            "tipo": "archivo",
            "contenido": f"✅ He generado el reporte solicitado para {intencion_data['tecnico']}.",
            "archivo": {
                "nombre": respuesta,
                "data": archivo_b64,
                "mime": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
        }

    return {"tipo": "texto",
            "contenido": "Entendí tu mensaje, pero por ahora solo sé generar reportes de técnicos. ¡Prueba pidiéndome uno!"}