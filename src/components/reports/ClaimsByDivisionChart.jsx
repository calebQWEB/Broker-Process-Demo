import PropTypes from "prop-types";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import useMediaQuery from "../../hooks/useMediaQuery.js";
import { shortLabel } from "../../utils/format.js";

function formatNaira(value) {
    if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
    return `₦${value}`;
}

export default function ClaimsByDivisionChart({ data }) {
    // Long division names overlap on phones, so angle them more and shorten them there
    const isNarrow = useMediaQuery("(max-width: 639px)");

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Claims Value by Division
            </h3>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ left: -10 }}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="division"
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={isNarrow ? -40 : -15}
                        textAnchor="end"
                        height={isNarrow ? 80 : 60}
                        tickFormatter={isNarrow ? (v) => shortLabel(v) : undefined}
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={formatNaira}
                    />
                    <Tooltip
                        formatter={(value) => [
                            `₦${Number(value).toLocaleString()}`,
                            "Total Claims",
                        ]}
                    />
                    <Bar
                        dataKey="totalClaims"
                        fill="#c65d5d"
                        radius={[6, 6, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

ClaimsByDivisionChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
};
