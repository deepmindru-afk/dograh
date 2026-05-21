"use client";

import {
    conversationItemsFromLiveFeedback,
    conversationItemsFromRealtimeFeedbackEvents,
} from "./adapters/fromRealtimeFeedback";
import { ConversationContainer } from "./ConversationContainer";
import { ConversationTimeline } from "./ConversationTimeline";
import type {
    ConversationStatus,
    RealtimeFeedbackMessage,
    WorkflowRunLogs,
} from "./types";
import { countConversationMessages } from "./utils";

interface LiveModeProps {
    mode: "live";
    messages: RealtimeFeedbackMessage[];
    isCallActive: boolean;
    isCallCompleted: boolean;
}

interface HistoricalModeProps {
    mode: "historical";
    logs: WorkflowRunLogs | null;
}

type RealtimeFeedbackProps = LiveModeProps | HistoricalModeProps;

export function RealtimeFeedback(props: RealtimeFeedbackProps) {
    let items;
    let status: ConversationStatus;
    let title: string;
    let emptyState: { title: string; subtitle: string };
    let autoScroll = false;

    if (props.mode === "historical") {
        items = props.logs?.realtime_feedback_events
            ? conversationItemsFromRealtimeFeedbackEvents(props.logs.realtime_feedback_events)
            : [];
        status = "ended";
        title = "Транскрипт звонка";
        emptyState = {
            title: "Разговор не записан",
            subtitle: "События обратной связи в реальном времени не были записаны для этого звонка",
        };
    } else {
        items = conversationItemsFromLiveFeedback(props.messages);
        status = props.isCallActive ? "live" : props.isCallCompleted ? "ended" : "ready";
        title = "Транскрипт в реальном времени";
        emptyState = {
            title: "Сообщений пока нет",
            subtitle: props.isCallActive
                ? "Начните говорить, чтобы увидеть транскрипт"
                : "Начните звонок, чтобы начать разговор",
        };
        autoScroll = true;
    }

    return (
        <ConversationContainer
            title={title}
            status={status}
            messageCount={countConversationMessages(items) || undefined}
        >
            <ConversationTimeline
                items={items}
                autoScroll={autoScroll}
                emptyState={emptyState}
            />
        </ConversationContainer>
    );
}
