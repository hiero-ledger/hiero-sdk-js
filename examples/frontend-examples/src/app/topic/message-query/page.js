"use client";

import { useState } from "react";
import {
    AccountId,
    Client,
    PrivateKey,
    TopicCreateTransaction,
    TopicId,
    TopicMessageSubmitTransaction,
} from "@hiero-ledger/sdk";
import { Button, TextField, CircularProgress } from "@mui/material";
import TopicListener from "@/app/components/TopicListener";

const MessageQueryPage = () => {
    const [topicId, setTopicId] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    // Setup Hedera client
    const accountId = AccountId.fromString(process.env.NEXT_PUBLIC_OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(
        process.env.NEXT_PUBLIC_OPERATOR_KEY,
    );
    const client = Client.forTestnet().setOperator(accountId, operatorKey);

    // Create a new topic
    const handleCreateTopic = async () => {
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const transaction = await (
                await new TopicCreateTransaction()
                    .setTopicMemo("Test Topic")
                    .execute(client)
            ).getReceipt(client);
            setTopicId(transaction.topicId.toString());
            setSuccess("Topic created successfully!");
        } catch (err) {
            setError("Failed to create topic: " + err.message);
        }
        setLoading(false);
    };

    // Send a message to the topic
    const handleSendMessage = async () => {
        setSending(true);
        setError("");
        setSuccess("");
        try {
            await (
                await new TopicMessageSubmitTransaction()
                    .setTopicId(TopicId.fromString(topicId))
                    .setMessage(message)
                    .execute(client)
            ).getReceipt(client);
            setSuccess("Message sent!");
            setMessage("");
        } catch (err) {
            setError("Failed to send message: " + err.message);
        }
        setSending(false);
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 p-8 flex flex-col space-y-8">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            1. Generate a Topic
                        </h2>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCreateTopic}
                            disabled={loading}
                            fullWidth
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                "Generate Topic"
                            )}
                        </Button>
                        {topicId && (
                            <p className="mt-3 text-sm text-blue-400 break-all">
                                <span className="font-semibold text-gray-300">
                                    Topic ID:
                                </span>{" "}
                                {topicId}
                            </p>
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            2. Send a Message
                        </h2>
                        <TextField
                            label="Message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={!topicId || sending}
                            fullWidth
                            variant="outlined"
                            className="bg-white rounded"
                        />
                        <Button
                            variant="contained"
                            color="secondary"
                            disabled={!topicId || sending || !message}
                            onClick={handleSendMessage}
                            fullWidth
                            className="mt-3"
                        >
                            {sending ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                "Send Message"
                            )}
                        </Button>
                    </div>
                    {success && (
                        <div className="bg-green-800 text-green-200 rounded p-2 text-center">
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-800 text-red-200 rounded p-2 text-center">
                            {error}
                        </div>
                    )}
                </div>

                <TopicListener topicId={topicId} />
            </div>
        </div>
    );
};

export default MessageQueryPage;
