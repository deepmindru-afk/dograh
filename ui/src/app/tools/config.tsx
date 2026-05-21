"use client";

import { Calculator, Cog, Globe, type LucideIcon, PhoneForwarded, PhoneOff, Puzzle } from "lucide-react";
import { type ReactNode } from "react";

import type {
    CalculatorToolDefinition,
    EndCallConfig,
    EndCallToolDefinition,
    HttpApiToolDefinition,
    McpToolDefinition,
    TransferCallConfig,
    TransferCallToolDefinition,
} from "@/client/types.gen";

export type ToolCategory = "http_api" | "end_call" | "transfer_call" | "calculator" | "native" | "integration" | "mcp";

export type EndCallMessageType = "none" | "custom" | "audio";

export interface ToolCategoryConfig {
    value: ToolCategory;
    label: string;
    description: string;
    icon: LucideIcon;
    iconName: string; // String name for storing in database
    iconColor: string;
    disabled?: boolean;
    autoFill?: {
        name: string;
        description: string;
    };
}

export const TOOL_CATEGORIES: ToolCategoryConfig[] = [
    {
        value: "http_api",
        label: "Внешний HTTP API",
        description: "Выполнять HTTP-запросы к внешним API",
        icon: Globe,
        iconName: "globe",
        iconColor: "#3B82F6",
    },
    {
        value: "end_call",
        label: "Завершить звонок",
        description: "Завершить звонок при выполнении условий",
        icon: PhoneOff,
        iconName: "phone-off",
        iconColor: "#EF4444",
        autoFill: {
            name: "Завершить звонок",
            description: "Завершить звонок, когда пользователь просит отключиться или когда пора закончить разговор",
        },
    },
    {
        value: "transfer_call",
        label: "Перевести звонок",
        description: "Перевести звонок на другой номер (только Twilio)",
        icon: PhoneForwarded,
        iconName: "phone-forwarded",
        iconColor: "#10B981",
        autoFill: {
            name: "Перевести звонок",
            description: "Перевести звонящего на другой номер по запросу",
        },
    },
    {
        value: "calculator",
        label: "Калькулятор",
        description: "Встроенный калькулятор для арифметических операций",
        icon: Calculator,
        iconName: "calculator",
        iconColor: "#F59E0B",
        autoFill: {
            name: "Калькулятор",
            description: "Выполнение арифметических операций (поддерживает +, -, *, /, **, %, и скобки)",
        },
    },
    {
        value: "mcp",
        label: "MCP Сервер",
        description: "Подключите MCP-сервер; его инструменты станут доступны агенту",
        icon: Puzzle,
        iconName: "puzzle",
        iconColor: "#8B5CF6",
    },
    {
        value: "native",
        label: "Встроенные (скоро)",
        description: "Встроенные инструменты: перевод звонка, ввод DTMF",
        icon: Cog,
        iconName: "cog",
        iconColor: "#6B7280",
        disabled: true,
    },
    {
        value: "integration",
        label: "Интеграции (скоро)",
        description: "Интеграции со сторонними сервисами, например Google Calendar",
        icon: Puzzle,
        iconName: "puzzle",
        iconColor: "#8B5CF6",
        disabled: true,
    },
];

export function getCategoryConfig(category: ToolCategory): ToolCategoryConfig | undefined {
    return TOOL_CATEGORIES.find(c => c.value === category);
}

export function getToolIcon(category: string): LucideIcon {
    const config = TOOL_CATEGORIES.find(c => c.value === category);
    return config?.icon ?? Globe;
}

export function getToolIconColor(category: string, fallbackColor?: string): string {
    const config = TOOL_CATEGORIES.find(c => c.value === category);
    return config?.iconColor ?? fallbackColor ?? "#3B82F6";
}

export function renderToolIcon(category: string, className: string = "w-5 h-5 text-white"): ReactNode {
    const Icon = getToolIcon(category);
    return <Icon className={className} />;
}

export function getToolTypeLabel(category: string): string {
    switch (category) {
        case "end_call":
            return "Инструмент завершения звонка";
        case "transfer_call":
            return "Инструмент перевода звонка";
        case "http_api":
            return "HTTP API инструмент";
        case "calculator":
            return "Инструмент калькулятор";
        case "native":
            return "Встроенный инструмент";
        case "integration":
            return "Инструмент интеграции";
        case "mcp":
            return "MCP серверный инструмент";
        default:
            return "Инструмент";
    }
}

export const DEFAULT_END_CALL_REASON_DESCRIPTION =
    "The reason for ending the call (e.g., 'voicemail_detected', 'issue_resolved', 'customer_requested')";

export const DEFAULT_END_CALL_CONFIG: EndCallConfig = {
    messageType: "none",
    customMessage: "",
    endCallReason: false,
};

export const DEFAULT_TRANSFER_CALL_CONFIG: TransferCallConfig = {
    destination: "",
    messageType: "none",
    customMessage: "",
    timeout: 30,
};

export type ToolDefinition =
    | HttpApiToolDefinition
    | EndCallToolDefinition
    | TransferCallToolDefinition
    | CalculatorToolDefinition
    | McpToolDefinition;

export function createEndCallDefinition(config: EndCallConfig): EndCallToolDefinition {
    return {
        schema_version: 1,
        type: "end_call",
        config,
    };
}

export function createTransferCallDefinition(config: TransferCallConfig): TransferCallToolDefinition {
    return {
        schema_version: 1,
        type: "transfer_call",
        config,
    };
}

export function createHttpApiDefinition(): HttpApiToolDefinition {
    return {
        schema_version: 1,
        type: "http_api",
        config: {
            method: "POST",
            url: "",
        },
    };
}

export function createCalculatorDefinition(): CalculatorToolDefinition {
    return {
        schema_version: 1,
        type: "calculator",
    };
}

export const MCP_URL_PATTERN = /^https?:\/\//i;

export function createMcpDefinition(
    url: string,
    credentialUuid: string,
    toolsFilterCsv: string,
): McpToolDefinition {
    return {
        schema_version: 1,
        type: "mcp" as const,
        config: {
            transport: "streamable_http" as const,
            url: url.trim(),
            credential_uuid: credentialUuid || null,
            tools_filter: toolsFilterCsv
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0),
        },
    };
}

export function createToolDefinition(category: ToolCategory): ToolDefinition {
    switch (category) {
        case "end_call":
            return createEndCallDefinition(DEFAULT_END_CALL_CONFIG);
        case "transfer_call":
            return createTransferCallDefinition(DEFAULT_TRANSFER_CALL_CONFIG);
        case "calculator":
            return createCalculatorDefinition();
        case "http_api":
        default:
            return createHttpApiDefinition();
    }
}
