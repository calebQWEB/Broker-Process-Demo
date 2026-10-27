import PropTypes from "prop-types";

export default function StatCard({ label, value, icon: Icon, accent }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1.5 truncate">
                    {value}
                </p>
            </div>
            <div
                className={`hidden sm:flex w-9 h-9 rounded-lg items-center justify-center shrink-0 ${accent}`}
            >
                <Icon size={16} />
            </div>
        </div>
    );
}

StatCard.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.elementType.isRequired,
    accent: PropTypes.string.isRequired,
};
