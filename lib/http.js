export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

export function sendJson(res, status, data) {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
}

/**
 * Read a JSON request body. Vercel pre-parses it into req.body;
 * the Vite dev server leaves the raw stream for us to read.
 */
export async function readJsonBody(req) {
    if (req.body !== undefined) {
        return typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
    }

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const text = Buffer.concat(chunks).toString("utf8");

    return text ? JSON.parse(text) : {};
}

/**
 * Resolve the API path (e.g. "schedules/raw") and query params from a request.
 * On Vercel the path arrives via the ?path= rewrite; in dev it's the URL itself.
 */
export function parseRequest(req) {
    const url = new URL(req.url, "http://localhost");
    const query = Object.fromEntries(url.searchParams);

    const path = (query.path ?? url.pathname)
        .replace(/^\/+/, "")
        .replace(/^api\//, "")
        .replace(/\/+$/, "");
    delete query.path;

    return { path, query };
}
