import axios from "axios";
import { parseScheduleFile } from "../utils/spreadsheet.js";
import { downloadScheduleExport } from "../utils/exportSchedule.js";

const client = axios.create({
    baseURL: "/api",
});

export async function uploadSchedule(file) {
    // The file is parsed in the browser; rows are sent in chunks to stay
    // under the serverless request body limit.
    const rows = await parseScheduleFile(file);
    let data;

    for (let i = 0; i < rows.length; i += 1000) {
        const response = await client.post("/schedules/upload", {
            rows: rows.slice(i, i + 1000),
        });
        data = response.data;
    }

    return data;
}

export async function exportCleanedSchedule() {
    const rows = await getCleanedSchedules();
    await downloadScheduleExport(rows, "brokerprocess_cleaned_schedule.xlsx");
}

export async function exportPoliciesByStatus(status, month) {
    const response = await client.get("/policies/export", {
        params: { status, month: month || undefined },
    });
    await downloadScheduleExport(
        response.data,
        `brokerprocess_${status}_renewals${month ? `_${month}` : ""}.xlsx`,
    );
}

export async function getRawSchedules() {
    const response = await client.get("/schedules/raw");
    return response.data;
}

export async function cleanSchedules() {
    const response = await client.post("/schedules/clean");
    return response.data;
}

export async function getCleanedSchedules() {
    const response = await client.get("/schedules/cleaned");
    return response.data;
}

export async function getPendingRenewals(days) {
    const response = await client.get("/policies/pending-renewal", {
        params: { days },
    });
    return response.data;
}

export async function approvePolicy(id) {
    const response = await client.post(`/policies/${id}/approve`);
    return response.data;
}

export async function rejectPolicy(id) {
    const response = await client.post(`/policies/${id}/reject`);
    return response.data;
}

export async function getSummary() {
    const response = await client.get("/reports/summary");
    return response.data;
}

export async function getRenewalHistory(status, month) {
    const response = await client.get("/policies/history", {
        params: { status, month },
    });
    return response.data;
}

export async function clearAllSchedules() {
    const response = await client.delete("/schedules/clear");
    return response.data;
}

export async function getPendingClaims() {
    const response = await client.get("/claims/pending");
    return response.data;
}

export async function approveClaim(id) {
    const response = await client.post(`/claims/${id}/approve`);
    return response.data;
}

export async function rejectClaim(id) {
    const response = await client.post(`/claims/${id}/reject`);
    return response.data;
}

export async function getClaimsHistory(status, month) {
    const response = await client.get("/claims/history", {
        params: { status, month },
    });
    return response.data;
}
