"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import builder from "./builder.png";
import { Divider, Drawer } from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import Header from "./components/Header";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [openTransaction, setOpen] = useState(false);

    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <div className="flex flex-col items-center justify-center">
                    <Header />
                    <Image
                        src={builder}
                        alt="hedera builder"
                        width={200}
                        style={{ marginBottom: 20 }}
                    />

                    {children}
                </div>
            </body>
        </html>
    );
}
