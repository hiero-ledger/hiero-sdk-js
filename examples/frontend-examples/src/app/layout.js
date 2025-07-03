import "./globals.css";
import { NavigationMenu } from "@base-ui-components/react/navigation-menu";

import { Providers } from "./providers";
import styles from "./index.module.css";
import { createTheme } from "@mui/material";

import Image from "next/image";
import Builder from "./images/builder.png";

// Create theme
const theme = createTheme({
    palette: {
        primary: {
            main: "#000000", // Replace with your desired color
        },
    },
});

export default function RootLayout({ children }) {
    return (
        <html>
            <body className={`relative min-h-screen bg-[#023047] antialiased`}>
                <Providers>
                    <div className="flex flex-col items-center justify-center">
                        <Image
                            src={Builder}
                            alt="builder"
                            width={300}
                            height={300}
                        />
                    </div>
                    <NavigationMenu.Root className={styles.Root}>
                        <NavigationMenu.List className={styles.List}>
                            <NavigationMenu.Item>
                                <NavigationMenu.Trigger
                                    className={styles.Trigger}
                                >
                                    <Link href="/">
                                        <h3 className={styles.LinkTitle}>
                                            {" "}
                                            Home{" "}
                                        </h3>
                                    </Link>
                                </NavigationMenu.Trigger>
                            </NavigationMenu.Item>
                            <NavigationMenu.Item>
                                <NavigationMenu.Trigger
                                    className={styles.Trigger}
                                >
                                    Transaction
                                    <NavigationMenu.Icon
                                        className={styles.Icon}
                                    >
                                        <ChevronDownIcon />
                                    </NavigationMenu.Icon>
                                </NavigationMenu.Trigger>
                                <NavigationMenu.Content
                                    className={styles.Content}
                                >
                                    <ul className={styles.GridLinkList}>
                                        {overviewLinks.map((item) => (
                                            <li key={item.href}>
                                                <Link
                                                    className={styles.LinkCard}
                                                    href={item.href}
                                                >
                                                    <h3
                                                        className={
                                                            styles.LinkTitle
                                                        }
                                                    >
                                                        {item.title}
                                                    </h3>
                                                    <p
                                                        className={
                                                            styles.LinkDescription
                                                        }
                                                    >
                                                        {item.description}
                                                    </p>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </NavigationMenu.Content>
                            </NavigationMenu.Item>
                            <NavigationMenu.Item>
                                <NavigationMenu.Trigger
                                    className={styles.Trigger}
                                >
                                    Client
                                    <NavigationMenu.Icon
                                        className={styles.Icon}
                                    >
                                        <ChevronDownIcon />
                                    </NavigationMenu.Icon>
                                </NavigationMenu.Trigger>
                                <NavigationMenu.Content
                                    className={styles.Content}
                                >
                                    <ul className={styles.GridLinkList}>
                                        {clientLinks.map((item) => (
                                            <li key={item.href}>
                                                <Link
                                                    className={styles.LinkCard}
                                                    href={item.href}
                                                >
                                                    <h3
                                                        className={
                                                            styles.LinkTitle
                                                        }
                                                    >
                                                        {item.title}
                                                    </h3>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </NavigationMenu.Content>
                            </NavigationMenu.Item>
                        </NavigationMenu.List>
                        <NavigationMenu.Portal>
                            <NavigationMenu.Positioner
                                className={styles.Positioner}
                                collisionPadding={{
                                    top: 5,
                                    bottom: 5,
                                    left: 20,
                                    right: 20,
                                }}
                            >
                                <NavigationMenu.Popup className={styles.Popup}>
                                    <NavigationMenu.Arrow
                                        className={styles.Arrow}
                                    >
                                        <ArrowSvg />
                                    </NavigationMenu.Arrow>
                                    <NavigationMenu.Viewport
                                        className={styles.Viewport}
                                    />
                                </NavigationMenu.Popup>
                            </NavigationMenu.Positioner>
                        </NavigationMenu.Portal>
                    </NavigationMenu.Root>
                    <div className="container mx-auto">{children}</div>
                </Providers>
            </body>
        </html>
    );
}

function Link(props) {
    return (
        <NavigationMenu.Link
            render={
                // Use the `render` prop to render your framework's Link component
                // for client-side routing.
                // e.g. `<NextLink href={props.href} />` instead of `<a />`.
                <a />
            }
            {...props}
        />
    );
}

function ChevronDownIcon(props) {
    return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
            <path
                d="M1 3.5L5 7.5L9 3.5"
                stroke="currentcolor"
                strokeWidth="1.5"
            />
        </svg>
    );
}

function ArrowSvg(props) {
    return (
        <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
            <path
                d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
                className={styles.ArrowFill}
            />
            <path
                d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
                className={styles.ArrowOuterStroke}
            />
            <path
                d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
                className={styles.ArrowInnerStroke}
            />
        </svg>
    );
}

const overviewLinks = [
    {
        href: "/transaction/size",
        title: "Transaction Size",
        description: "Get transaction size",
    },
];

const clientLinks = [
    {
        href: "/client/grpc-web-proxy",
        title: "Dynamic GRPC Web Proxy",
        description: "GRPC Web Proxy with dynamic network update",
    },
];
