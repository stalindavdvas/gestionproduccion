import os
import json
import pandas as pd
from io import BytesIO
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
# ⚠️ IMPORTANTE: Importamos los nuevos modelos normalizados
from app.models import OrdenTrabajo, Cliente, Tecnico, TipoServicio

# Librería moderna de Google
from google import genai
from google.genai import types


def interpretar_intencion(mensaje: str):
    """
    Usa la IA para convertir texto natural en filtros de fecha y nombre.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("⚠️ Falta GEMINI_API_KEY en .env")
        return None

    client = genai.Client(api_key=api_key)

    prompt = f"""
    Eres un asistente experto en SQL. Analiza este mensaje: "{mensaje}".

    Tu objetivo es extraer filtros para una base de datos de mantenimiento.

    Reglas:
    1. "tecnico": Nombre de la persona.
    2. "fecha_inicio" y "fecha_fin": Rango YYYY-MM-DD.
       - Si dice "Noviembre 2024", inicio=2024-11-01, fin=2024-11-30.
       - Si dice "ayer", calcula la fecha.

    Salida JSON esperada:
    {{
        "intencion": "reporte_tecnico",
        "tecnico": "Nombre o null",
        "fecha_inicio": "YYYY-MM-DD o null",
        "fecha_fin": "YYYY-MM-DD o null"
    }}
    """

    try:
        # Usamos gemini-1.5-flash que es rápido y estable
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)

    except Exception as e:
        print(f"⚠️ Error IA: {e}")
        return None


def buscar_datos_y_generar_excel(filtros, db: Session):
    nombre = filtros.get("tecnico")
    f_inicio = filtros.get("fecha_inicio")
    f_fin = filtros.get("fecha_fin")

    if not nombre or not f_inicio:
        return None, "Necesito saber el nombre del técnico y el rango de fechas."

    print(f"🔎 Buscando reportes para: {nombre} [{f_inicio} - {f_fin}]")

    # --- 1. CONSULTA SQL CON JOINS (Normalización) ---
    # Seleccionamos la Orden, pero unimos con Técnico y Cliente para leer los nombres
    query = (
        db.query(OrdenTrabajo)
        .join(Tecnico, OrdenTrabajo.tecnico_id == Tecnico.id)  # Join obligatorio
        .join(Cliente, OrdenTrabajo.cliente_id == Cliente.id_cliente_appsheet, isouter=True)  # Join opcional
        .join(TipoServicio, OrdenTrabajo.servicio_id == TipoServicio.id, isouter=True)
    )

    # Filtro de Fecha
    query = query.filter(and_(
        OrdenTrabajo.fecha_ingreso >= f_inicio,
        OrdenTrabajo.fecha_ingreso <= f_fin
    ))

    # Filtro de Nombre (Buscamos en la tabla TECNICO, no en la orden)
    partes = nombre.split(" ")
    condiciones = []
    for parte in partes:
        if len(parte) > 2:
            # ilike busca sin importar mayúsculas/minúsculas
            condiciones.append(Tecnico.nombre_completo.ilike(f"%{parte}%"))

    if condiciones:
        query = query.filter(and_(*condiciones))

    resultados = query.all()

    if not resultados:
        return None, f"No encontré mantenimientos de **{nombre}** entre {f_inicio} y {f_fin}."

    # --- 2. GENERAR EXCEL ---
    data_list = []
    for r in resultados:
        # Construcción segura de datos accediendo a las relaciones (_rel)
        cliente_nombre = r.cliente_rel.nombre_fiscal if r.cliente_rel else "Cliente General"
        tecnico_nombre = r.tecnico_rel.nombre_completo if r.tecnico_rel else "Sin Asignar"
        servicio_nombre = r.servicio_rel.nombre if r.servicio_rel else "General"

        # Unificar número de orden
        n_orden = r.no_orden_taller or r.no_orden_campo or r.no_orden_produccion or "S/N"

        data_list.append({
            "Orden": n_orden,
            "Fecha": r.fecha_ingreso.strftime("%Y-%m-%d") if r.fecha_ingreso else "-",
            "Cliente": cliente_nombre,
            "Servicio": servicio_nombre,
            "Técnico": tecnico_nombre,
            "Estado": r.estado or "Pendiente",
            "Observaciones": r.observaciones or ""
        })

    df = pd.DataFrame(data_list)

    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Reporte')

        # Auto-ajuste de columnas
        worksheet = writer.sheets['Reporte']
        for column in worksheet.columns:
            max_length = 0
            column = [cell for cell in column]
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = (max_length + 2)
            try:
                worksheet.column_dimensions[column[0].column_letter].width = adjusted_width
            except:
                pass

    output.seek(0)
    nombre_archivo = f"Reporte_{nombre.replace(' ', '_')}_{f_inicio}.xlsx"

    return output, nombre_archivo