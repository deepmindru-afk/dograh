'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Room, RoomEvent } from 'livekit-client';
import { Room as LiveKitRoom } from 'livekit-client';

interface LiveKitHookOptions {
    workflowId: number;
    workflowRunId: number;
    accessToken: string | null;
}

interface LiveKitHookReturn {
    room: Room | null;
    isConnecting: boolean;
    isConnected: boolean;
    isCompleted: boolean;
    error: string | null;
    transcriptMessages: TranscriptMessage[];
    start: () => Promise<void>;
    stop: () => void;
}

interface TranscriptMessage {
    type: 'user_transcription' | 'bot_transcription' | 'function_call' | 'pipeline_error' | 'session_started' | 'session_ended';
    text?: string;
    is_final?: boolean;
    name?: string;
    args?: string;
    message?: string;
}

export function useLiveKit({ workflowId, workflowRunId, accessToken }: LiveKitHookOptions): LiveKitHookReturn {
    const [room, setRoom] = useState<Room | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcriptMessages, setTranscriptMessages] = useState<TranscriptMessage[]>([]);
    const roomRef = useRef<Room | null>(null);

    const handleDataReceived = useCallback((payload: Uint8Array) => {
        try {
            const message: TranscriptMessage = JSON.parse(new TextDecoder().decode(payload));
            setTranscriptMessages(prev => [...prev, message]);

            if (message.type === 'session_ended') {
                setIsCompleted(true);
                setIsConnected(false);
            }
        } catch {
            // Ignore malformed messages
        }
    }, []);

    const start = useCallback(async () => {
        if (!accessToken || isConnecting || isConnected) return;

        setIsConnecting(true);
        setError(null);

        try {
            // Step 1: Create room via API
            const baseUrl = window.location.origin;
            const apiUrl = `${baseUrl}/api/v1/livekit/rooms`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ workflow_run_id: workflowRunId }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.detail || `Failed to create LiveKit room: ${response.status}`);
            }

            const data = await response.json();
            const { room_name: roomName, token } = data;

            // Step 2: Get LiveKit WebSocket URL
            const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL || 'ws://localhost:7880';

            // Step 3: Connect to LiveKit room
            const livekitRoom = new LiveKitRoom({
                adaptiveStream: true,
                dynacast: true,
            });

            livekitRoom.on('connected' as RoomEvent, () => {
                setIsConnected(true);
                setIsConnecting(false);
            });

            livekitRoom.on('disconnected' as RoomEvent, () => {
                setIsConnected(false);
                roomRef.current = null;
            });

            livekitRoom.on('dataReceived' as RoomEvent, handleDataReceived);

            await livekitRoom.connect(livekitUrl, token);
            roomRef.current = livekitRoom;
            setRoom(livekitRoom);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to connect to LiveKit';
            setError(message);
            setIsConnecting(false);
        }
    }, [accessToken, workflowRunId, isConnecting, isConnected, handleDataReceived]);

    const stop = useCallback(() => {
        if (roomRef.current) {
            roomRef.current.disconnect();
            roomRef.current = null;
            setRoom(null);
        }
        setIsConnected(false);
        setIsCompleted(true);
    }, []);

    useEffect(() => {
        return () => {
            if (roomRef.current) {
                roomRef.current.disconnect();
                roomRef.current = null;
            }
        };
    }, []);

    return {
        room,
        isConnecting,
        isConnected,
        isCompleted,
        error,
        transcriptMessages,
        start,
        stop,
    };
}
