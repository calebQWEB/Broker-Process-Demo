export function formatDate(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function daysLeftBadgeClasses(days) {
    if (days === null || days === undefined)
        return "bg-gray-100 text-gray-600 border border-gray-200";
    if (days < 0) return "bg-red-50 text-red-700 border border-red-200";
    if (days <= 14)
        return "bg-orange-50 text-orange-700 border border-orange-200";
    return "bg-amber-50 text-amber-700 border border-amber-200";
}

export function daysLeftLabel(days) {
    if (days === null || days === undefined) return "Unknown expiry";
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Due today";
    return `${days} days`;
}
