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

export default function LossRatioChart({ data }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Loss Ratio by Division
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
                        angle={-15}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip
                        formatter={(value) => [`${value}%`, "Avg Loss Ratio"]}
                    />
                    <Bar
                        dataKey="avgLossRatio"
                        fill="#0f3d2e"
                        radius={[6, 6, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

LossRatioChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
};
