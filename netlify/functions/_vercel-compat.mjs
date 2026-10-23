// Camada de compatibilidade — NUNCA altera a lógica de negócio dos arquivos
// em api/*.js. Só traduz o formato moderno do Netlify Functions (Request/
// Response do Fetch API) pro formato (req,res) estilo Node/Express que
// esses arquivos já usam (confirmado lendo o código real, não suposição —
// ver inventário: req.method/headers/query/url/body + res.status/setHeader/
// send/json/end/redirect(code,url)).
//
// Qualquer novo api/*.js adicionado no futuro continua funcionando aqui
// sem precisar de nenhuma mudança, desde que use essa mesma assinatura
// (req,res) — que é a única usada nos 10 arquivos hoje.

function parseQuery(url) {
  const out = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key in out) {
      if (Array.isArray(out[key])) out[key].push(value);
      else out[key] = [out[key], value];
    } else {
      out[key] = value;
    }
  }
  return out;
}

async function parseBody(request) {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const contentType = request.headers.get("content-type") || "";
  let raw;
  try {
    raw = await request.text();
  } catch {
    return undefined;
  }
  if (!raw) return undefined;
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw; // corpo malformado — devolve cru, igual o Node faria
    }
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const out = {};
    for (const [k, v] of new URLSearchParams(raw).entries()) out[k] = v;
    return out;
  }
  // sem content-type reconhecido: tenta JSON, senão devolve texto cru
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function buildReq(request, url) {
  const headers = {};
  for (const [k, v] of request.headers.entries()) headers[k] = v;
  return {
    method: request.method,
    url: url.pathname + (url.search || ""),
    headers,
    query: parseQuery(url),
    body: undefined, // preenchido depois, é assíncrono
  };
}

function buildRes() {
  const state = {
    statusCode: 200,
    headers: new Map(),
    body: undefined,
    ended: false,
  };
  const res = {
    status(code) {
      state.statusCode = code;
      return res;
    },
    setHeader(name, value) {
      state.headers.set(String(name), String(value));
      return res;
    },
    json(obj) {
      if (!state.headers.has("content-type") && !state.headers.has("Content-Type")) {
        state.headers.set("Content-Type", "application/json; charset=utf-8");
      }
      state.body = JSON.stringify(obj);
      state.ended = true;
      return res;
    },
    send(data) {
      if (data === undefined || data === null) {
        state.body = "";
      } else if (typeof data === "string" || data instanceof Uint8Array || Buffer.isBuffer?.(data)) {
        if (!state.headers.has("content-type") && !state.headers.has("Content-Type") && typeof data === "string") {
          state.headers.set("Content-Type", "text/html; charset=utf-8");
        }
        state.body = data;
      } else {
        // objeto — mesmo comportamento real do Vercel: serializa como JSON
        if (!state.headers.has("content-type") && !state.headers.has("Content-Type")) {
          state.headers.set("Content-Type", "application/json; charset=utf-8");
        }
        state.body = JSON.stringify(data);
      }
      state.ended = true;
      return res;
    },
    end(data) {
      if (data !== undefined) state.body = data;
      state.ended = true;
      return res;
    },
    redirect(a, b) {
      let statusCode, location;
      if (typeof b === "string") {
        statusCode = a;
        location = b;
      } else {
        statusCode = 302;
        location = a;
      }
      state.statusCode = statusCode;
      state.headers.set("Location", location);
      state.ended = true;
      return res;
    },
    _state: state,
  };
  return res;
}

/**
 * Transforma um handler estilo Vercel (req,res) num handler moderno do
 * Netlify Functions ((Request, Context) => Response).
 */
export function wrapVercelHandler(vercelHandler) {
  return async function netlifyHandler(request, _context) {
    const url = new URL(request.url);
    const req = buildReq(request, url);
    const res = buildRes();
    try {
      req.body = await parseBody(request);
      await vercelHandler(req, res);
    } catch (err) {
      if (!res._state.ended) {
        res.status(500).setHeader("Content-Type", "text/plain; charset=utf-8");
        res._state.body = `internal error: ${err?.message || String(err)}`;
      }
    }
    const headersOut = {};
    for (const [k, v] of res._state.headers.entries()) headersOut[k] = v;
    const body = res._state.body === undefined ? "" : res._state.body;
    return new Response(body, {
      status: res._state.statusCode,
      headers: headersOut,
    });
  };
}
