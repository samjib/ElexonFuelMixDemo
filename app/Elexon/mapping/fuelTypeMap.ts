// https://bscdocs.elexon.co.uk/interface-definition-documents/neta-interface-definition-and-design-document-part-1-interfaces-with-bsc-parties-and-their-agents#block-672c7c072ac92325a5046112
const fuelTypeMap: { key: string; displayName: string; group: string }[] = [
    { key: "CCGT", displayName: "Combined Cycle Gas Turbine", group: "Gas" },
    { key: "OIL", displayName: "Oil", group: "Oil" },
    { key: "COAL", displayName: "Coal", group: "Coal" },
    { key: "NUCLEAR", displayName: "Nuclear", group: "Nuclear" },
    { key: "PS", displayName: "Pumped Storage", group: "Storage" },

    { key: "NPSHYD", displayName: "Non Pumped Storage Hydro", group: "Hydro" },

    { key: "WIND", displayName: "Wind", group: "Renewable" },
    { key: "BIOMASS", displayName: "Biomass", group: "Renewable" },

    { key: "OCGT", displayName: "Open Cycle Gas Turbine", group: "Gas" },

    { key: "OTHER", displayName: "Other", group: "Other" },

    { key: "INTFR", displayName: "Interconnector", group: "Interconnector" },
    {
        key: "INTIRL",
        displayName: "Interconnector Ireland",
        group: "Interconnector",
    },
    {
        key: "INTNED",
        displayName: "Interconnector Netherlands",
        group: "Interconnector",
    },
    {
        key: "INTIFA2",
        displayName: "Interconnector France",
        group: "Interconnector",
    },
    {
        key: "INTNSL",
        displayName: "Interconnector Northern Ireland",
        group: "Interconnector",
    },
    {
        key: "INTBEL",
        displayName: "Interconnector Belgium",
        group: "Interconnector",
    },
    {
        key: "INTSCTY",
        displayName: "Interconnector Scotland",
        group: "Interconnector",
    },
    {
        key: "INTGER",
        displayName: "Interconnector Germany",
        group: "Interconnector",
    },
    {
        key: "INTNEM",
        displayName: "Interconnector Norway",
        group: "Interconnector",
    },
    {
        key: "INTICE",
        displayName: "Interconnector Iceland",
        group: "Interconnector",
    },
    { key: "INTUK", displayName: "Interconnector UK", group: "Interconnector" },

    { key: "INTELEC", displayName: "Interconnector Electric ????", group: "Interconnector" },
    { key: "INTEW", displayName: "Interconnector Electric ????", group: "Interconnector" },
    { key: "INTGRNL", displayName: "Interconnector Electric ????", group: "Interconnector" },
    { key: "INTVKL", displayName: "Interconnector Electric ????", group: "Interconnector" },
];

export default fuelTypeMap;