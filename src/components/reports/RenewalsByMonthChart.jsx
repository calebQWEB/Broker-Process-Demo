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

export default function RenewalsByMonthChart({ data }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Renewals Due by Month
            </h3>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ left: -10 }}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                        vertical={false}
                    />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4a9d7f" radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

RenewalsByMonthChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
};
