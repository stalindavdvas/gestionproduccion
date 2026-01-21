from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from app.database import get_db
from app.models import OrdenTrabajo, Cliente, Tecnico, TipoServicio, Equipo
from app.services.analytics_service import generar_analisis_estrategico
from datetime import date, timedelta
from typing import Optional

router = APIRouter(prefix="/api/analytics", tags=["Analítica"])


def obtener_metricas_raw(db: Session, start_date: date, end_date: date):
    # 1. RENDIMIENTO TÉCNICO (Usando tabla Tecnico relacionada)
    tech_perf = (
        db.query(
            Tecnico.nombre_completo,
            func.count(OrdenTrabajo.id_appsheet).label("total")
        )
        .join(OrdenTrabajo, OrdenTrabajo.tecnico_id == Tecnico.id)
        .filter(OrdenTrabajo.fecha_ingreso >= start_date, OrdenTrabajo.fecha_ingreso <= end_date)
        .group_by(Tecnico.nombre_completo)
        .order_by(desc("total"))
        .all()
    )
    tech_data = [{"name": t[0], "total": t[1]} for t in tech_perf]

    # 2. TENDENCIAS (Por Mes)
    jobs = db.query(OrdenTrabajo.fecha_ingreso).filter(
        OrdenTrabajo.fecha_ingreso >= start_date, OrdenTrabajo.fecha_ingreso <= end_date
    ).all()

    trends_map = {}
    for j in jobs:
        if j.fecha_ingreso:
            key = j.fecha_ingreso.strftime("%Y-%m")
            trends_map[key] = trends_map.get(key, 0) + 1
    trends_data = [{"date": k, "count": v} for k, v in sorted(trends_map.items())]

    # 3. SERVICIOS (Usando tabla TipoServicio relacionada)
    serv_dist = (
        db.query(TipoServicio.nombre, func.count(OrdenTrabajo.id_appsheet))
        .join(OrdenTrabajo, OrdenTrabajo.servicio_id == TipoServicio.id)
        .filter(OrdenTrabajo.fecha_ingreso >= start_date, OrdenTrabajo.fecha_ingreso <= end_date)
        .group_by(TipoServicio.nombre)
        .all()
    )
    serv_data = [{"name": s[0], "value": s[1]} for s in serv_dist]

    # 4. UBICACIÓN (Top Ciudades)
    loc_dist = (
        db.query(Cliente.ciudad, func.count(OrdenTrabajo.id_appsheet).label("t"))
        .join(OrdenTrabajo, Cliente.id_cliente_appsheet == OrdenTrabajo.cliente_id)
        .filter(OrdenTrabajo.fecha_ingreso >= start_date, OrdenTrabajo.fecha_ingreso <= end_date)
        .group_by(Cliente.ciudad)
        .order_by(desc("t"))
        .limit(10)
        .all()
    )
    loc_data = [{"city": l[0] or "S/N", "count": l[1]} for l in loc_dist]

    # 5. CÁLCULO DE CALIDAD (ALGORITMO DE REINCIDENCIA)
    # Traemos las órdenes con sus equipos para analizar series repetidas
    ordenes_raw = (
        db.query(OrdenTrabajo)
        .join(Equipo, OrdenTrabajo.equipo_id == Equipo.id)
        .filter(OrdenTrabajo.fecha_ingreso >= start_date, OrdenTrabajo.fecha_ingreso <= end_date)
        .options(joinedload(OrdenTrabajo.equipo_rel))
        .all()
    )

    # Agrupar por serie
    equipos_vistos = {}
    reincidencias = 0
    total_ordenes = len(ordenes_raw)

    for orden in ordenes_raw:
        if orden.equipo_rel and orden.equipo_rel.serie:
            serie = orden.equipo_rel.serie.upper()
            if len(serie) > 3 and serie != "S/N":  # Ignorar series basura
                if serie in equipos_vistos:
                    # ¡Ya vimos esta serie en este periodo! Es una reincidencia.
                    equipos_vistos[serie] += 1
                    if equipos_vistos[serie] == 2:  # Contamos solo cuando se repite la primera vez
                        reincidencias += 1
                else:
                    equipos_vistos[serie] = 1

    # Fórmula KPI
    tasa_calidad = 100
    if total_ordenes > 0:
        pct_fallas = (reincidencias / total_ordenes) * 100
        tasa_calidad = round(max(0, 100 - pct_fallas), 1)

    kpi_data = {
        "total_trabajos": total_ordenes,
        "reincidencias_detectadas": reincidencias,
        "tasa_calidad": tasa_calidad
    }

    return {
        "periodo": f"{start_date} al {end_date}",
        "technicians": tech_data,
        "trends": trends_data,
        "services": serv_data,
        "locations": loc_data,
        "quality_kpi": kpi_data
    }


@router.get("/dashboard")
def get_analytics_dashboard(start_date: Optional[date] = None, end_date: Optional[date] = None,
                            db: Session = Depends(get_db)):
    if not end_date: end_date = date.today()
    if not start_date: start_date = end_date - timedelta(days=180)
    return obtener_metricas_raw(db, start_date, end_date)


@router.get("/insight")
def get_ai_insight(start_date: Optional[date] = None, end_date: Optional[date] = None, db: Session = Depends(get_db)):
    if not end_date: end_date = date.today()
    if not start_date: start_date = end_date - timedelta(days=180)

    raw = obtener_metricas_raw(db, start_date, end_date)
    # Convertimos a formato simple para que la IA entienda
    texto = generar_analisis_estrategico(raw)
    return {"content": texto}