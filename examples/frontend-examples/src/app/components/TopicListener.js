import EventEmitter from "events";
import { useEffect, useState } from "react";

const TopicListener = ({ topicId }) => {
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const dataEmitter = new EventEmitter();

    useEffect(() => {
        if (topicId) {
            setIsConnected(true);
            pollMirrorNode(dataEmitter, topicId);
        } else {
            setIsConnected(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topicId]);

    dataEmitter.on("newMessages", (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
        setLastUpdate(new Date());
    });

    return (
        <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 p-6 max-w-4xl mx-auto mt-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div
                        className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                    ></div>
                    <h1 className="text-2xl font-bold text-white">
                        Topic Message Listener
                    </h1>
                </div>
                <div className="text-sm text-gray-400">
                    Topic ID:{" "}
                    <span className="font-mono text-blue-400">
                        {topicId || "Not set"}
                    </span>
                </div>
            </div>

            {/* Status Bar */}
            <div className="bg-gray-800 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                    <span
                        className={`flex items-center space-x-2 ${isConnected ? "text-green-400" : "text-red-400"}`}
                    >
                        <span className="w-2 h-2 rounded-full bg-current"></span>
                        <span>
                            {isConnected ? "Connected" : "Disconnected"}
                        </span>
                    </span>
                    {lastUpdate && (
                        <span className="text-gray-400">
                            Last message: {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                    <span className="text-gray-400">
                        Total messages: {messages.length}
                    </span>
                </div>
            </div>

            {/* Messages Container */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
                <div className="p-4 border-b border-gray-700">
                    <h2 className="text-lg font-semibold text-white">
                        Messages
                    </h2>
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {messages.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="text-gray-500 mb-2">
                                <svg
                                    className="w-12 h-12 mx-auto mb-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                            </div>
                            <p className="text-gray-400">
                                Waiting for messages...
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Messages will appear here when sent to the topic
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-3">
                            {messages.map((message, index) => (
                                <div
                                    key={`${message}-${index}`}
                                    className="bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                                    Message #{index + 1}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date().toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className="text-white break-words">
                                                {message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                    Polling every 1 second • Messages are base64 decoded from
                    the Hedera network
                </p>
            </div>
        </div>
    );
};

export default TopicListener;

/**
 * @param {EventEmitter} dataEmitter
 * @param {string} topicId
 * @returns {Promise<void>}
 */
async function pollMirrorNode(dataEmitter, topicId) {
    let lastMessagesLength = 0;

    const pollingSetInterval = setInterval(async () => {
        const BASE_URL = "https://testnet.mirrornode.hedera.com";
        const res = await fetch(
            `${BASE_URL}/api/v1/topics/${topicId}/messages`,
        );

        /**
         * data.messages is an array of objects with a message property
         * @type {{messages: { message: string }[]}}
         */
        const data = await res.json();

        // Check if we have new messages (array length changed)
        const currentMessagesLength = data.messages ? data.messages.length : 0;

        console.log("currentMessagesLength", currentMessagesLength);
        console.log("lastMessagesLength", lastMessagesLength);

        if (currentMessagesLength > lastMessagesLength) {
            // Get the latest message(s) - they are raw base64 encoded strings
            const newMessages = data.messages.slice(lastMessagesLength)[0];
            const decodedMessage = Buffer.from(
                newMessages.message,
                "base64",
            ).toString("utf-8");
            dataEmitter.emit("newMessages", decodedMessage);
            lastMessagesLength = currentMessagesLength;
        }
    }, 1000);
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
