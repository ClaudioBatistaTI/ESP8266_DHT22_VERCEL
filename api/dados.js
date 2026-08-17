const { createClient } = require("@libsql/client");

const db = createClient({
  url: process.env.TURSO_DATABASE_URL_TURSO_DATABASE_URL,
  authToken: process.env.TURSO_DATABASE_URL_TURSO_AUTH_TOKEN,
});

const DEVICE_TOKEN = process.env.DEVICE_TOKEN || "";

const schemaSQL = `
CREATE TABLE IF NOT EXISTS leituras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  temperatura REAL NOT NULL,
  umidade REAL NOT NULL,
  data_hora TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_leituras_data_hora
ON leituras(data_hora);
`;

function json(res, status, data) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Device-Token");
  return res.end(JSON.stringify(data));
}

async function garantirTabela() {
  const statements = schemaSQL
    .split(";")
    .map(s => s.trim())
    .filter(Boolean);

  for (const sql of statements) {
    await db.execute(sql);
  }
}

function numeroValido(valor) {
  return typeof valor === "number" && Number.isFinite(valor);
}

module.exports = async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      return json(res, 204, {});
    }

    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      return json(res, 500, {
        ok: false,
        erro: "Variáveis TURSO_DATABASE_URL/TURSO_AUTH_TOKEN não configuradas na Vercel."
      });
    }

    await garantirTabela();

    // GET /api/dados?limit=50
    if (req.method === "GET") {
      const rawLimit = Number(req.query?.limit ?? 50);
      const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 50, 1), 500);

      const result = await db.execute({
        sql: `SELECT id, temperatura, umidade, data_hora
              FROM leituras
              ORDER BY id DESC
              LIMIT ?`,
        args: [limit]
      });

      return json(res, 200, {
        ok: true,
        total: result.rows.length,
        leituras: result.rows
      });
    }

    // POST /api/dados
    if (req.method === "POST") {
      if (DEVICE_TOKEN) {
        const recebido = req.headers["x-device-token"];
        if (recebido !== DEVICE_TOKEN) {
          return json(res, 401, {
            ok: false,
            erro: "Token do dispositivo inválido."
          });
        }
      }

      let body = req.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {
          return json(res, 400, { ok: false, erro: "JSON inválido." });
        }
      }

      const temperatura = Number(body?.temperatura);
      const umidade = Number(body?.umidade);

      if (!numeroValido(temperatura) || !numeroValido(umidade)) {
        return json(res, 400, {
          ok: false,
          erro: "Envie temperatura e umidade numéricas."
        });
      }

      if (temperatura < -50 || temperatura > 80) {
        return json(res, 400, {
          ok: false,
          erro: "Temperatura fora da faixa esperada."
        });
      }

      if (umidade < 0 || umidade > 100) {
        return json(res, 400, {
          ok: false,
          erro: "Umidade deve estar entre 0 e 100."
        });
      }

      const result = await db.execute({
        sql: `INSERT INTO leituras (temperatura, umidade)
              VALUES (?, ?)`,
        args: [temperatura, umidade]
      });

      return json(res, 201, {
        ok: true,
        mensagem: "Leitura registrada.",
        id: Number(result.lastInsertRowid),
        temperatura,
        umidade
      });
    }

    return json(res, 405, {
      ok: false,
      erro: "Método não permitido."
    });
  } catch (error) {
    console.error(error);
    return json(res, 500, {
      ok: false,
      erro: "Erro interno da API.",
      detalhe: process.env.NODE_ENV === "development" ? String(error.message) : undefined
    });
  }
};
