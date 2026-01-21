import time
import re
import unicodedata
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from datetime import datetime
from app.models import Cliente, OrdenTrabajo, VisitaCampo, Industria, Tecnico, Equipo, TipoServicio
from app.services.sheets_client import get_gspread_client

SPREADSHEET_ID = "1UxrhgQATwY1yQAhm_pM4xc3sGUpr_Aw8VQH6IRpAXkU"

# Nombres exactos de las pestañas
HOJA_CLIENTES = "Clientes"
HOJA_INGRESOS = "Ingresos"
HOJA_CAMPO = "Campo"


# --- HELPERS ---
def normalizar_texto(texto):
    if not texto: return None
    return str(texto).strip()


def normalizar_header(texto):
    if not texto: return ""
    texto = str(texto).lower().strip()
    texto = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
    texto = re.sub(r'[^a-z0-9]', '', texto)
    return texto


def parse_date(date_str):
    if not date_str: return None
    date_str = str(date_str).strip()
    try:
        if " " in date_str: date_str = date_str.split(" ")[0]
        for fmt in ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"]:
            try:
                return datetime.strptime(date_str, fmt).date()
            except:
                continue
        return None
    except:
        return None


def get_or_create(session, model, **kwargs):
    """Busca un registro, si no existe lo crea y devuelve la instancia"""
    instance = session.query(model).filter_by(**kwargs).first()
    if instance:
        return instance
    else:
        instance = model(**kwargs)
        session.add(instance)
        session.flush()  # Para obtener el ID sin commit final
        return instance


def obtener_valor(row, headers_map, key_db):
    """
    Busca el valor en la fila normalizando las llaves.
    Retorna None si la celda está vacía, para que la BD guarde NULL.
    """
    # 1. Normalizamos las llaves que vienen del Excel
    row_normalized = {}
    for k, v in row.items():
        clean_key = normalizar_header(k)
        row_normalized[clean_key] = v

    # 2. Buscamos según el mapa
    posibles = headers_map.get(key_db, [])
    for p in posibles:
        if p in row_normalized:
            val = row_normalized[p]

            # Si es vacío, retornamos None (Null en BD)
            if val == "" or val is None:
                return None

            # Convertimos a string seguro (por si es número 123)
            return str(val).strip()

    return None


# --- MAPEOS DE COLUMNAS ---
MAPEO_CLIENTES = {
    "id_cliente_appsheet": ["id"], "clave": ["clave"], "nombre_fiscal": ["nombre"],
    "ruc": ["ciruc", "ruc"], "ciudad": ["ciudad"], "direccion": ["direccion"],
    "contacto": ["contacto"], "telefono": ["telefono"], "correo": ["correo"],
    "industria_nombre": ["industria"], "asesor": ["asesorresponsable"]
}

MAPEO_INGRESOS = {
    "id_appsheet": ["id"], "fecha_ingreso": ["fechaingreso"], "tipo_ingreso": ["tipoingreso"],
    "no_orden_taller": ["noordentaller"], "no_orden_campo": ["noordencampo"],
    "cliente_id": ["cliente"], "servicio_nombre": ["servicio"],
    "tecnico_nombre": ["tecnicoejecucion"], "estado": ["estado"],
    "marca": ["marca"], "modelo": ["modelo"], "serie": ["serie"],
    "tipo_equipo": ["tipo"], "capacidad": ["capacidad"], "sensibilidad": ["sensibilidad"],
    "observaciones": ["observaciones"], "dano_reportado": ["danobalanza"]
}

MAPEO_CAMPO = {
    "id_campo_appsheet": ["id"], "codigo": ["codigo"], "agencia_zona": ["agenciaplantazona"],
    "ubicacion": ["ubicacion"], "ultima_fecha": ["ultimafecha"],
    "marca": ["marca"], "modelo": ["modelo"], "serie": ["serie"],
    "tecnico1": ["tecnico1"], "tecnico2": ["tecnico2"],
    "estado": ["estado"], "enlace_informe": ["enlaceinforme"]
}


# --- ETL CLIENTES ---
def ejecutar_etl_clientes(db: Session):
    print("\n🔵 INICIANDO CARGA DE CLIENTES (MODO ROBUSTO)...")
    try:
        client = get_gspread_client()
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(HOJA_CLIENTES)

        # CAMBIO CLAVE: Usamos get_all_values en lugar de get_all_records
        # Esto trae una lista de listas: [['ID', 'Nombre'], ['1', 'Juan']]
        # No falla si hay columnas repetidas.
        raw_data = sheet.get_all_values()

        if not raw_data or len(raw_data) < 2:
            print("❌ ERROR: La hoja parece vacía o solo tiene encabezados.")
            return {"status": "error", "message": "Hoja vacía"}

        # Separamos encabezados y datos
        headers = raw_data[0]
        filas = raw_data[1:]

        # Convertimos la matriz en una lista de diccionarios manualmente
        # Si hay columnas repetidas, Python se quedará con la última automáticamente y no dará error.
        registros = []
        for fila in filas:
            row_dict = {}
            for i, h in enumerate(headers):
                # Aseguramos que no nos salgamos del índice si la fila es más corta
                val = fila[i] if i < len(fila) else ""
                row_dict[str(h)] = val  # Usamos el encabezado original como llave
            registros.append(row_dict)

        # 🕵️ DIAGNÓSTICO
        headers_leidos = [normalizar_header(k) for k in headers]
        print(f"👀 Encabezados leídos: {headers_leidos}")

        if "id" not in headers_leidos:
            print(f"❌ ERROR CRÍTICO: No encuentro columna 'ID'. Encabezados reales: {headers}")
            return {"status": "error", "message": "Columna ID no encontrada"}

    except Exception as e:
        print(f"❌ Error GSheets: {e}")
        return {"status": "error", "message": f"Error GSheets: {str(e)}"}

    procesados = 0
    omitidos = 0

    for i, row in enumerate(registros):
        # Intentamos obtener el ID usando nuestra función auxiliar
        id_cli = obtener_valor(row, MAPEO_CLIENTES, "id_cliente_appsheet")

        if not id_cli:
            omitidos += 1
            if omitidos <= 3:
                print(f"⚠️ Fila {i + 2} omitida: ID vacío.")
            continue

        # Gestión de Industria
        nombre_ind = obtener_valor(row, MAPEO_CLIENTES, "industria_nombre")
        industria_obj = None
        if nombre_ind:
            industria_obj = get_or_create(db, Industria, nombre=nombre_ind.upper())

        datos = {
            "id_cliente_appsheet": id_cli,
            "clave": obtener_valor(row, MAPEO_CLIENTES, "clave"),
            # Si el nombre viene vacío, ponemos 'Sin Nombre' para que no quede invisible
            "nombre_fiscal": obtener_valor(row, MAPEO_CLIENTES, "nombre_fiscal") or "Sin Nombre",
            "ruc": obtener_valor(row, MAPEO_CLIENTES, "ruc"),
            "ciudad": obtener_valor(row, MAPEO_CLIENTES, "ciudad"),
            "direccion": obtener_valor(row, MAPEO_CLIENTES, "direccion"),
            "contacto": obtener_valor(row, MAPEO_CLIENTES, "contacto"),
            "telefono": obtener_valor(row, MAPEO_CLIENTES, "telefono"),
            "correo": obtener_valor(row, MAPEO_CLIENTES, "correo"),
            "industria_id": industria_obj.id if industria_obj else None,
            "ultima_actualizacion": datetime.now()
        }

        try:
            stmt = insert(Cliente).values(datos)
            stmt = stmt.on_conflict_do_update(
                index_elements=[Cliente.id_cliente_appsheet],
                set_=datos
            )
            db.execute(stmt)
            procesados += 1
        except Exception as e:
            print(f"❌ Error insertando cliente {id_cli}: {e}")

    try:
        db.commit()
        print(f"✅ FIN: {procesados} clientes guardados.")
        return {"status": "success", "mensaje": f"{procesados} guardados, {omitidos} omitidos."}
    except Exception as e:
        db.rollback()
        print(f"❌ Error COMMIT: {e}")
        return {"status": "error", "message": str(e)}


# --- ETL INGRESOS (Ordenes de Trabajo) ---
def ejecutar_etl_ingresos(db: Session):
    print("🔄 Sincronizando Ingresos...")
    try:
        client = get_gspread_client()
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(HOJA_INGRESOS)
        registros = sheet.get_all_records()
    except Exception as e:
        return {"status": "error", "message": str(e)}

    procesados = 0
    for row in registros:
        id_orden = obtener_valor(row, MAPEO_INGRESOS, "id_appsheet")
        if not id_orden: continue

        # 1. Gestionar Técnico
        tec_nombre = obtener_valor(row, MAPEO_INGRESOS, "tecnico_nombre")
        tec_obj = None
        if tec_nombre and len(tec_nombre) > 2:
            tec_obj = get_or_create(db, Tecnico, nombre_completo=tec_nombre.title())

        # 2. Gestionar Servicio
        serv_nombre = obtener_valor(row, MAPEO_INGRESOS, "servicio_nombre")
        serv_obj = None
        if serv_nombre:
            serv_obj = get_or_create(db, TipoServicio, nombre=serv_nombre.upper())

        # 3. Gestionar Equipo (Vinculado al cliente)
        cliente_id = obtener_valor(row, MAPEO_INGRESOS, "cliente_id")
        serie = obtener_valor(row, MAPEO_INGRESOS, "serie")
        equipo_obj = None

        # Buscamos equipo por serie y cliente, si no existe, lo creamos
        if serie:
            equipo_obj = db.query(Equipo).filter_by(serie=serie).first()
            if not equipo_obj:
                equipo_obj = Equipo(
                    serie=serie,
                    marca=obtener_valor(row, MAPEO_INGRESOS, "marca"),
                    modelo=obtener_valor(row, MAPEO_INGRESOS, "modelo"),
                    tipo_equipo=obtener_valor(row, MAPEO_INGRESOS, "tipo_equipo"),
                    capacidad=obtener_valor(row, MAPEO_INGRESOS, "capacidad"),
                    sensibilidad=obtener_valor(row, MAPEO_INGRESOS, "sensibilidad"),
                    cliente_id=cliente_id
                )
                db.add(equipo_obj)
                db.flush()

        # 4. Crear Cliente Fantasma si falla la FK
        if cliente_id:
            if not db.query(Cliente).filter_by(id_cliente_appsheet=cliente_id).first():
                db.add(Cliente(id_cliente_appsheet=cliente_id, nombre_fiscal=f"Cliente {cliente_id}"))
                db.flush()

        datos = {
            "id_appsheet": id_orden,
            "fecha_ingreso": parse_date(obtener_valor(row, MAPEO_INGRESOS, "fecha_ingreso")),
            "tipo_ingreso": obtener_valor(row, MAPEO_INGRESOS, "tipo_ingreso"),
            "no_orden_taller": obtener_valor(row, MAPEO_INGRESOS, "no_orden_taller"),
            "no_orden_campo": obtener_valor(row, MAPEO_INGRESOS, "no_orden_campo"),
            "estado": obtener_valor(row, MAPEO_INGRESOS, "estado"),
            "observaciones": obtener_valor(row, MAPEO_INGRESOS, "observaciones"),
            "dano_reportado": obtener_valor(row, MAPEO_INGRESOS, "dano_reportado"),
            "cliente_id": cliente_id,
            "equipo_id": equipo_obj.id if equipo_obj else None,
            "servicio_id": serv_obj.id if serv_obj else None,
            "tecnico_id": tec_obj.id if tec_obj else None,
            "ultima_actualizacion": datetime.now()
        }

        stmt = insert(OrdenTrabajo).values(datos)
        stmt = stmt.on_conflict_do_update(index_elements=[OrdenTrabajo.id_appsheet], set_=datos)
        db.execute(stmt)
        procesados += 1

    db.commit()
    return {"status": "success", "mensaje": f"{procesados} órdenes sincronizadas."}


# --- ETL CAMPO (NUEVO) ---
def ejecutar_etl_campo(db: Session):
    print("🔄 Sincronizando Campo...")
    try:
        client = get_gspread_client()
        # Intentamos abrir la hoja campo, si falla, retornamos aviso
        try:
            sheet = client.open_by_key(SPREADSHEET_ID).worksheet(HOJA_CAMPO)
        except:
            return {"status": "warning", "mensaje": f"No se encontró hoja '{HOJA_CAMPO}'"}

        registros = sheet.get_all_records()
    except Exception as e:
        return {"status": "error", "message": str(e)}

    procesados = 0
    for row in registros:
        id_campo = obtener_valor(row, MAPEO_CAMPO, "id_campo_appsheet")
        if not id_campo: continue

        # Gestionar Técnicos (Hasta 2)
        t1_nom = obtener_valor(row, MAPEO_CAMPO, "tecnico1")
        t2_nom = obtener_valor(row, MAPEO_CAMPO, "tecnico2")
        t1_obj, t2_obj = None, None

        if t1_nom: t1_obj = get_or_create(db, Tecnico, nombre_completo=t1_nom.title())
        if t2_nom: t2_obj = get_or_create(db, Tecnico, nombre_completo=t2_nom.title())

        # Gestionar Equipo (Si existe serie)
        serie = obtener_valor(row, MAPEO_CAMPO, "serie")
        equipo_obj = None
        if serie:
            equipo_obj = db.query(Equipo).filter_by(serie=serie).first()
            if not equipo_obj:
                # Si es nuevo equipo de campo, lo creamos sin cliente asignado por ahora
                equipo_obj = Equipo(
                    serie=serie,
                    marca=obtener_valor(row, MAPEO_CAMPO, "marca"),
                    modelo=obtener_valor(row, MAPEO_CAMPO, "modelo")
                )
                db.add(equipo_obj)
                db.flush()

        datos = {
            "id_campo_appsheet": id_campo,
            "codigo": obtener_valor(row, MAPEO_CAMPO, "codigo"),
            "agencia_zona": obtener_valor(row, MAPEO_CAMPO, "agencia_zona"),
            "ubicacion": obtener_valor(row, MAPEO_CAMPO, "ubicacion"),
            "estado": obtener_valor(row, MAPEO_CAMPO, "estado"),
            "enlace_informe": obtener_valor(row, MAPEO_CAMPO, "enlace_informe"),
            "ultima_fecha": parse_date(obtener_valor(row, MAPEO_CAMPO, "ultima_fecha")),
            "equipo_id": equipo_obj.id if equipo_obj else None,
            "tecnico1_id": t1_obj.id if t1_obj else None,
            "tecnico2_id": t2_obj.id if t2_obj else None,
            "ultima_actualizacion": datetime.now()
        }

        stmt = insert(VisitaCampo).values(datos)
        stmt = stmt.on_conflict_do_update(index_elements=[VisitaCampo.id_campo_appsheet], set_=datos)
        db.execute(stmt)
        procesados += 1

    db.commit()
    return {"status": "success", "mensaje": f"{procesados} visitas de campo."}