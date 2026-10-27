import { useState, useEffect, useCallback } from "react";
import { getRawSchedules, getCleanedSchedules } from "../api/scheduleApi.js";

export default function useSchedules(variant) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result =
                variant === "cleaned"
                    ? await getCleanedSchedules()
                    : await getRawSchedules();
            setData(result);
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to load schedule data.",
            );
        } finally {
            setLoading(false);
        }
    }, [variant]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
