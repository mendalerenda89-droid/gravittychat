/**
 * GRAVITTY — Cloudflare Worker (proxy Anthropic API)
 * ─────────────────────────────────────────────────
 * 1. Crea un Worker en dash.cloudflare.com → Workers & Pages → Create
 * 2. Pega este código
 * 3. Ve a Settings → Variables → añade:
 *      ANTHROPIC_API_KEY = sk-ant-...  (marca "Encrypt")
 * 4. Despliega y copia la URL del worker (ej: gravitty-chat.TU-USUARIO.workers.dev)
 * 5. Ponla en el chatbot en la variable WORKER_URL
 */

const ALLOWED_ORIGIN = "*"; // Cambia a "https://gravitty.es" en producción

const SYSTEM_PROMPT = `Eres el asistente virtual oficial de GRAVITTY, escuela de danza, gimnasia y espectáculos en Lugo (Galicia, España). Tu misión es ayudar a los visitantes, resolver dudas y animarles a inscribirse.

SOBRE GRAVITTY:
- Fundada por Gael Zarza Arias y Rubén Hamade Longarela
- Lema: "Humans in Motion"
- Dirección: Rúa Alcalde Ramiro Rueda, 19, Bajo, 27003 Lugo
- Teléfono: 604 003 626
- Email: info@gravitty.es
- Web: gravitty.es
- Horario de oficina: Lun–Vie 10:00–13:00 y 16:00–20:00 / Sáb 10:00–13:00
- Más de 700 alumnos entre 3 y 70 años
- Valoración 5 estrellas en Google (más de 76 valoraciones)

DISCIPLINAS: Hip Hop, Ballet clásico, Danza contemporánea, Break dance, Gimnasia artística, Gimnasia rítmica, Gimnasia de trampolín, Acrobacias y circo, Pole dance, PekeDance (para los más pequeños).

CLUB GRAVITTY (competición):
- Creado en 2017. Baile Deportivo (Hip-Hop) y Gimnasia (Rítmica, Artística, Trampolín)
- Medalla de bronce en el Campeonato del Mundo de Hip Hop en Narón (Megacrew)
- En 2024 participaron 156 gimnastas y bailarines en competiciones federadas

INSTRUCCIONES:
- Responde en español, cercano y energético — máximo 3-4 líneas por respuesta
- Para precios u horarios concretos: remite a gravitty.es/horarios o al 604 003 626
- Cuando alguien quiera apuntarse: anímale y dile que llame, escriba o entre en la web
- Nunca inventes precios ni horarios concretos
- Transmite la energía y pasión de Gravitty`;

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const { messages } = body;
    if (!messages || !Array.isArray(messages)) {
      return new Response("Missing messages", { status: 400 });
    }

    // Llamada a Anthropic
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = await anthropicRes.json();

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      },
    });
  },
};
