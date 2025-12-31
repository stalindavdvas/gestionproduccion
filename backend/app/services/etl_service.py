import time
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from datetime import datetime
from app.models import TrabajoTecnico, Cliente
from app.services.sheets_client import get_gspread_client

# ==========================================
# ⚠️ TU ID DE HOJA
# ==========================================
SPREADSHEET_ID = "1UxrhgQATwY1yQAhm_pM4xc3sGUpr_Aw8VQH6IRpAXkU"

HOJA_CLIENTES = "Clientes"
HOJA_INGRESOS = "Ingresos"


def ejecutar_etl_clientes(db: Session):
    print(f"\n🔵 [RAYOS X] Iniciando diagnóstico de CLIENTES...")
    try:
        client = get_gspread_client()
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(HOJA_CLIENTES)

        # Obtenemos TODO sin filtrar
        registros = sheet.get_all_records()

        if not registros:
            print("❌ LA HOJA ESTÁ VACÍA O NO SE PUDO LEER.")
            return {"status": "error", "message": "Hoja vacía"}

        # 🕵️ IMPRIMIR ENCABEZADOS REALES
        primer_fila = registros[0]
        headers_reales = list(primer_fila.keys())
        print(f"👀 ENCABEZADOS QUE VEO EN TU EXCEL: {headers_reales}")

        # Intentar procesar con lógica flexible
        procesados = 0
        omitidos = 0

        for row in registros:
            # Buscamos las columnas clave IGNORANDO MAYÚSCULAS/MINÚSCULAS
            # Normalizamos las llaves del excel: "Nombre " -> "nombre"
            row_clean = {str(k).strip().lower(): v for k, v in row.items()}

            datos_db = {}

            # Mapeo Manual (Ajustado a lo que suele venir)
            # Buscamos 'id' en el excel limpio
            id_val = row_clean.get('id') or row_clean.get('idcliente') or row_clean.get('codigo')

            if not id_val:
                omitidos += 1
                continue

            datos_db["id_cliente_appsheet"] = str(id_val).strip()
            datos_db["clave"] = str(row_clean.get('clave', ''))
            datos_db["nombre_fiscal"] = row_clean.get('nombre') or row_clean.get('nombrecliente')
            datos_db["ruc"] = str(row_clean.get('ruc') or row_clean.get('ciruc') or row_clean.get('c.i / ruc') or '')
            datos_db["provincia"] = row_clean.get('provincia')
            datos_db["ciudad"] = row_clean.get('ciudad')
            datos_db["direccion"] = row_clean.get('direccion') or row_clean.get('dirección')
            datos_db["contacto"] = row_clean.get('contacto')
            datos_db["telefono"] = str(row_clean.get('telefono', ''))
            datos_db["correo"] = row_clean.get('correo')
            datos_db["asesor_responsable"] = row_clean.get('asesor responsable') or row_clean.get('asesor')
            datos_db["industria"] = row_clean.get('industria')
            datos_db["observaciones"] = row_clean.get('observaciones')
            datos_db["ultima_actualizacion"] = datetime.now()

            try:
                stmt = insert(Cliente).values(datos_db)
                stmt = stmt.on_conflict_do_update(
                    index_elements=[Cliente.id_cliente_appsheet],
                    set_=datos_db
                )
                db.execute(stmt)
                procesados += 1
            except Exception as e:
                print(f"⚠️ Error guardando cliente {id_val}: {e}")

        db.commit()
        print(f"✅ FIN CLIENTES: {procesados} guardados, {omitidos} omitidos (sin ID).")
        return {"status": "success", "mensaje": f"Sincronizados: {procesados}"}

    except Exception as e:
        print(f"❌ ERROR CRÍTICO: {e}")
        return {"status": "error", "message": str(e)}


def ejecutar_etl_ingresos(db: Session):
    print(f"\n🟠 [RAYOS X] Iniciando diagnóstico de INGRESOS...")
    try:
        client = get_gspread_client()
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(HOJA_INGRESOS)
        registros = sheet.get_all_records()

        if registros:
            print(f"👀 ENCABEZADOS INGRESOS: {list(registros[0].keys())}")

        procesados = 0
        for row in registros:
            row_clean = {str(k).strip().lower(): v for k, v in row.items()}

            # Buscar ID
            id_val = row_clean.get('id') or row_clean.get('idorden')
            if not id_val: continue

            datos_db = {
                "id_appsheet": str(id_val).strip(),
                "clave": str(row_clean.get('clave', '')),
                "tipo_ingreso": row_clean.get('tipoingreso') or row_clean.get('tipo ingreso'),
                "no_orden_taller": row_clean.get('no. orden taller') or row_clean.get('no orden taller'),
                "no_orden_campo": row_clean.get('no orden campo'),
                "no_orden_produccion": row_clean.get('no orden produccion'),
                "cliente_id": str(row_clean.get('cliente') or '').strip(),
                "servicio": row_clean.get('servicio'),
                "tecnico_ejecucion": row_clean.get('tecnico ejecucion') or row_clean.get('tecnico'),
                "estado": row_clean.get('estado'),
                "marca": row_clean.get('marca'),
                "modelo": row_clean.get('modelo'),
                "dano_reportado": row_clean.get('daño balanza') or row_clean.get('dano balanza'),
                "observaciones": row_clean.get('observaciones'),
                "ultima_actualizacion": datetime.now()
            }

            # Fecha (intento simple)
            fecha_str = row_clean.get('fechaingreso') or row_clean.get('fecha ingreso')
            if fecha_str:
                try:
                    # Intenta formato dia/mes/año
                    datos_db["fecha_ingreso"] = datetime.strptime(str(fecha_str).split(' ')[0], "%d/%m/%Y")
                except:
                    pass

            # Guardar Cliente Fantasma
            if datos_db["cliente_id"]:
                exists = db.query(Cliente).filter(Cliente.id_cliente_appsheet == datos_db["cliente_id"]).first()
                if not exists:
                    db.add(Cliente(id_cliente_appsheet=datos_db["cliente_id"],
                                   nombre_fiscal=f"Cliente {datos_db['cliente_id']}"))
                    db.commit()

            stmt = insert(TrabajoTecnico).values(datos_db)
            stmt = stmt.on_conflict_do_update(index_elements=[TrabajoTecnico.id_appsheet], set_=datos_db)
            db.execute(stmt)
            procesados += 1

        db.commit()
        print(f"✅ FIN INGRESOS: {procesados} guardados.")
        return {"status": "success", "mensaje": f"Sincronizados: {procesados}"}

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return {"status": "error", "message": str(e)}