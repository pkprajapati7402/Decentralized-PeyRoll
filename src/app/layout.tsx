import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { RainbowProvider } from "@/providers/rainbow-provider";
import { OktoProviderComponent } from "@/providers/okto-provider";
import MainLayout from "@/components/layout/main-layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Peyroll - Decentralized Payroll System",
    description: "Manage your payroll on the blockchain",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} min-h-screen antialiased`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={true}
                    disableTransitionOnChange
                >
                    <RainbowProvider>
                        <OktoProviderComponent>
                            <MainLayout>{children}</MainLayout>
                        </OktoProviderComponent>
                    </RainbowProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}