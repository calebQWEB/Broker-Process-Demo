// Single serverless function for every /api/* route (vercel.json rewrites to it).
// Keeps the deployment under the Hobby plan's function limit and mirrors routes/api.php.

import { HttpError, parseRequest, readJsonBody, sendJson } from "../lib/http.js";
import * as policies from "../lib/policies.js";

const routes = [
    ["POST", /^schedules\/upload$/, policies.upload],
    ["GET", /^schedules\/(?:raw|cleaned)$/, policies.listAll],
    ["POST", /^schedules\/clean$/, policies.clean],
    ["DELETE", /^schedules\/clear$/, policies.clearAll],
    ["GET", /^policies\/pending-renewal$/, policies.pendingRenewal],
    ["POST", /^policies\/(\d+)\/(approve|reject)$/, policies.reviewPolicy],
    ["GET", /^policies\/history$/, policies.renewalHistory],
    ["GET", /^policies\/export$/, policies.exportByStatus],
    ["GET", /^reports\/summary$/, policies.summary],
    ["GET", /^claims\/pending$/, policies.pendingClaims],
    ["POST", /^claims\/(\d+)\/(approve|reject)$/, policies.reviewClaim],
    ["GET", /^claims\/history$/, policies.claimsHistory],
    ["GET", /^cron\/keep-alive$/, policies.keepAlive],
];

export default async function handler(req, res) {
    const { path, query } = parseRequest(req);

    try {
        for (const [method, pattern, action] of routes) {
            const match = pattern.exec(path);
            if (!match || req.method !== method) continue;

            const body = method === "POST" ? await readJsonBody(req) : {};
            const data = await action({ query, body, params: match.slice(1), headers: req.headers });

            return sendJson(res, 200, data);
        }

        throw new HttpError(404, "Not found.");
    } catch (err) {
        if (!(err instanceof HttpError)) console.error(err);

        sendJson(res, err.status ?? 500, {
            message: err instanceof HttpError ? err.message : "Server error. Please try again.",
        });
    }
}
