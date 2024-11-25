const getTextColorFromBackground = (bgColor: string): string => {
    // Parse the hex color
    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
        const cleanHex = hex.replace('#', '');
        const bigint = parseInt(cleanHex, 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255,
        };
    };

    const rgb = hexToRgb(bgColor);

    // Calculate relative luminance
    const calculateLuminance = ({ r, g, b }: { r: number; g: number; b: number }): number => {
        const [R, G, B] = [r, g, b].map((c) => {
            const scaled = c / 255;
            return scaled <= 0.03928
                ? scaled / 12.92
                : Math.pow((scaled + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    };

    const luminance = calculateLuminance(rgb);

    // Choose black (#000000) or white (#FFFFFF) based on luminance
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export default getTextColorFromBackground;