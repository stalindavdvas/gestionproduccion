import os
import json
from google import genai
from google.genai import types


def generar_analisis_estrategico(datos_json):
    """
    Envía los datos estadísticos a Gemini 3 para que genere un informe ejecutivo
    estrictamente basado en el rango de fechas seleccionado.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Error: Falta configurar la API Key de Gemini."

    client = genai.Client(api_key=api_key)

    # 1. Extraemos el periodo del JSON para forzar el título correcto
    # Esto asegura que la IA sepa exactamente de qué fechas hablar
    rango_fechas = datos_json.get("periodo", "Rango seleccionado")

    # Convertimos a string para el prompt
    datos_str = json.dumps(datos_json, ensure_ascii=False)

    # 2. PROMPT DE ALTA PRECISIÓN (Prompt Engineering)
    prompt = f"""
    Actúa como un Gerente de Operaciones Senior de una empresa de mantenimiento técnico.

    Tus instrucciones maestras (STRICT SYSTEM PROMPT):
    1. **Fuente de Verdad:** Analiza ÚNICAMENTE los datos proporcionados en el JSON adjunto. NO asumas datos externos ni inventes contextos.
    2. **Contexto Temporal:** El análisis corresponde ESTRICTAMENTE al periodo: "{rango_fechas}".
    3. **Prohibición de Fechas Actuales:** NO menciones la fecha actual ("hoy", "ayer", ni la fecha de generación). NO pongas "Generado el...". Céntrate solo en el rango histórico proporcionado.
    4. **Enfoque:** Prioriza el análisis de Mantenimiento Preventivo vs. Correctivo y la productividad técnica.

    DATOS OPERATIVOS DEL PERIODO:
    {datos_str}

    Genera un reporte en formato Markdown limpio con esta estructura exacta:

    # 📊 Informe de Gestión: {rango_fechas}

    ### 1. Diagnóstico Ejecutivo
    * **Resumen de Actividad:** Analiza el volumen total ({datos_json.get('total', 0)} trabajos) y si esto representa una carga alta o baja para el equipo.
    * **Salud Operativa:** Observa los 'services'. ¿Qué porcentaje es Mantenimiento Preventivo vs. Correctivo/Reparación? ¿Estamos siendo proactivos (preventivo) o reactivos (correctivo)?

    ### 2. Desempeño del Equipo Técnico
    * **Liderazgo:** Identifica al técnico con mayor volumen (Top Performer) basándote en la lista 'technicians'.
    * **Análisis de Distribución:** ¿La carga está equilibrada o hay técnicos sin asignaciones? (Menciona si hay técnicos con 0 o muy pocas órdenes comparado al líder).
    * **Recomendación:** Da un consejo directo para nivelar la carga de trabajo o premiar la eficiencia.

    ### 3. Inteligencia de Negocio
    * **Foco Geográfico:** Basado en 'locations', ¿qué ciudad o zona demandó más recursos? Sugiere una acción logística para esa zona.
    * **Tendencias:** Si hay datos en 'trends', menciona brevemente si la curva de trabajo fue estable o tuvo picos inusuales dentro de este rango de fechas.

    ### 4. Conclusión Estratégica
    * Una frase final contundente resumiento el estado del periodo y la acción prioritaria para el siguiente ciclo.

    Mantén un tono profesional, analítico y directo al punto.
    """

    try:
        # ✅ USANDO EL MODELO SOLICITADO: gemini-3-flash-preview
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,  # Temperatura baja para máxima precisión analítica
                max_output_tokens=1500
            )
        )
        return response.text
    except Exception as e:
        return f"⚠️ No se pudo generar el análisis con Gemini 3. Error: {str(e)}"