const {heroui} = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#001B3D",
                foreground: "#ffffff",
                darkblue: "#001B3D",
                gold: "#D4AF37",
                orange: "#F97316",
            },
            fontFamily: {
                sans: ["var(--font-geist-sans)", "Arial", "Helvetica", "sans-serif"],
                mono: ["var(--font-geist-mono)", "monospace"],
            },
        },
    },
    darkMode: "class",
    plugins: [
        heroui({
            themes: {
                dark: {
                    colors: {
                        primary: {
                            DEFAULT: "#D4AF37",
                            foreground: "#001B3D",
                        },
                        secondary: {
                            DEFAULT: "#F97316",
                            foreground: "#ffffff",
                        },
                        background: "#001B3D",
                        foreground: "#ffffff",
                    },
                },
            },
        }),
    ],
};
