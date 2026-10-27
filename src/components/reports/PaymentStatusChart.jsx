import PropTypes from "prop-types";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const COLORS = ["#0f3d2e", "#4a9d7f", "#a3d9c5", "#e0a458", "#c65d5d"];

export default function PaymentStatusChart({ data }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Payment Status Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ status, count }) => `${status}: ${count}`}
                        labelLine={false}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={entry.status}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

PaymentStatusChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
};
