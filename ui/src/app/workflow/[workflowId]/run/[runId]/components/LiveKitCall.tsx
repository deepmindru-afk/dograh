'use client';

import { Loader2, Mic, MicOff, PhoneOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

import { useLiveKit } from '../hooks/useLiveKit';

interface LiveKitCallProps {
    workflowId: number;
    workflowRunId: number;
}

export default function LiveKitCall({ workflowId, workflowRunId }: LiveKitCallProps) {
    const auth = useAuth();
    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        if (auth.isAuthenticated && !auth.loading) {
            auth.getAccessToken().then(setAccessToken);
        }
    }, [auth]);

    const {
        isConnecting,
        isConnected,
        isCompleted,
        error,
        transcriptMessages,
        start,
        stop,
    } = useLiveKit({ workflowId, workflowRunId, accessToken });

    const handleToggleCall = () => {
        if (isConnected) {
            stop();
        } else {
            start();
        }
    };

    const isInCall = isConnected || isConnecting;

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-6 space-y-6">
                {/* Connection Status */}
                <div className="flex items-center justify-center">
                    <div className={`p-4 rounded-full ${isConnected ? 'bg-green-500/20' : isConnecting ? 'bg-yellow-500/20' : 'bg-muted'}`}>
                        {isConnected ? (
                            <Mic className="h-8 w-8 text-green-500" />
                        ) : isConnecting ? (
                            <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
                        ) : (
                            <MicOff className="h-8 w-8 text-muted-foreground" />
                        )}
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-lg font-medium">
                        {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Ready'}
                    </p>
                    {error && (
                        <p className="text-sm text-destructive mt-1">{error}</p>
                    )}
                </div>

                {/* Transcript */}
                {transcriptMessages.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3 bg-muted/20">
                        {transcriptMessages.map((msg, i) => (
                            <div
                                key={i}
                                className={`text-sm ${msg.type === 'user_transcription' ? 'text-blue-600' : msg.type === 'bot_transcription' ? 'text-green-600' : msg.type === 'pipeline_error' ? 'text-destructive' : 'text-muted-foreground'}`}
                            >
                                {msg.type === 'user_transcription' && <span>You: {msg.text}</span>}
                                {msg.type === 'bot_transcription' && <span>Agent: {msg.text}</span>}
                                {msg.type === 'function_call' && <span>⚡ {msg.name}({msg.args})</span>}
                                {msg.type === 'pipeline_error' && <span>Error: {msg.message}</span>}
                                {msg.type === 'session_started' && <span className="italic">Session started...</span>}
                                {msg.type === 'session_ended' && <span className="italic">Session ended.</span>}
                            </div>
                        ))}
                    </div>
                )}

                {/* Controls */}
                <div className="flex justify-center">
                    <button
                        onClick={handleToggleCall}
                        disabled={isConnecting || isCompleted}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium text-white transition-colors ${
                            isConnected
                                ? 'bg-destructive hover:bg-destructive/90'
                                : 'bg-primary hover:bg-primary/90'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isConnected ? (
                            <>
                                <PhoneOff className="h-4 w-4" />
                                End Call
                            </>
                        ) : (
                            <>
                                <Mic className="h-4 w-4" />
                                {isConnecting ? 'Connecting...' : 'Start Call'}
                            </>
                        )}
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
