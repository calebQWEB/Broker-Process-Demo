import { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
    const [role, setRole] = useState("Ops Manager");

    return (
        <RoleContext.Provider value={{ role, setRole }}>
            {children}
        </RoleContext.Provider>
    );
}

RoleProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export function useRole() {
    const context = useContext(RoleContext);
    if (!context) {
        throw new Error("useRole must be used within a RoleProvider");
    }
    return context;
}
