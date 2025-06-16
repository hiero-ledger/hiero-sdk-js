"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        primary: {
            main: "#fb8500", // Replace with your desired color
        },
        secondary: {
            main: "#ffffff", // Replace with your desired color
        },
    },
    components: {
        // Name of the component
        MuiTextField: {
            styleOverrides: {
                // Name of the slot
                root: {
                    // Some CSS
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                },
            },
        },
    },
});

export function Providers({ children }) {
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
