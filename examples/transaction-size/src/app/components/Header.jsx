import { Divider, Drawer } from "@mui/material";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
    const [openTransaction, setOpen] = useState(false);

    return (
        <>
            <ul className="flex gap-2 ">
                <li>
                    <Link href="/">Home</Link>
                </li>
                <li onClick={() => setOpen(!openTransaction)}>Transactions</li>
                <li onClick={() => alert("Coming soon")}>Account</li>
                <li onClick={() => alert("Coming soon")}>System</li>
                <li onClick={() => alert("Coming soon")}>Contracts</li>
                <li onClick={() => alert("Coming soon")}>Airdrops</li>
            </ul>
            <Drawer
                open={openTransaction}
                onClose={() => setOpen(false)}
                anchor="left"
            >
                <div className="p-4">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                        Examples
                    </h3>
                    <ul>
                        <li>
                            <Link href="/transaction-size">
                                Transaction Size
                            </Link>
                        </li>
                    </ul>
                </div>
            </Drawer>
        </>
    );
}
