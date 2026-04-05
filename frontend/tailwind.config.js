export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                ink: "#202020",
                mist: "#F2F5F8",
                shell: "#F2F5F8",
                surface: "#FFFFFF",
                brand: {
                    DEFAULT: "#2E2E5A",
                    50: "#F2F5F8",
                    100: "#FFFFFF",
                    500: "#2E2E5A",
                    600: "#2B2B2B",
                    700: "#202020"
                },
                text: {
                    DEFAULT: "#2B2B2B",
                    strong: "#202020"
                }
            },
            boxShadow: {
                card: "0 8px 30px rgba(32, 32, 32, 0.08)"
            }
        }
    },
    plugins: []
};
