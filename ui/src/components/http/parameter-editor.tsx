"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export type ParameterType = "string" | "number" | "boolean";

export interface ToolParameter {
    name: string;
    type: ParameterType;
    description: string;
    required: boolean;
}

export interface PresetToolParameter {
    name: string;
    type: ParameterType;
    valueTemplate: string;
    required: boolean;
}

interface ParameterEditorProps {
    parameters: ToolParameter[];
    onChange: (parameters: ToolParameter[]) => void;
    disabled?: boolean;
}

export function ParameterEditor({
    parameters,
    onChange,
    disabled = false,
}: ParameterEditorProps) {
    const addParameter = () => {
        onChange([
            ...parameters,
            { name: "", type: "string", description: "", required: true },
        ]);
    };

    const updateParameter = (
        index: number,
        field: keyof ToolParameter,
        value: string | boolean
    ) => {
        const newParams = [...parameters];
        newParams[index] = { ...newParams[index], [field]: value };
        onChange(newParams);
    };

    const removeParameter = (index: number) => {
        onChange(parameters.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            {parameters.length === 0 && (
                <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
                    Параметры не заданы. Добавьте параметр, чтобы указать, какие данные нужны этому инструменту.
                </div>
            )}

            {parameters.map((param, index) => (
                <div
                    key={index}
                    className="border rounded-lg p-4 space-y-3 bg-muted/20"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                            Параметр {index + 1}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeParameter(index)}
                            disabled={disabled}
                            className="h-8 w-8"
                        >
                            <Trash2Icon className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Имя</Label>
                            <Label className="text-xs text-muted-foreground">
                                Имя параметра, например &quot;order_id&quot; или &quot;customer_name&quot;
                            </Label>
                            <Input
                                placeholder="например, customer_name"
                                value={param.name}
                                onChange={(e) =>
                                    updateParameter(index, "name", e.target.value)
                                }
                                disabled={disabled}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Тип</Label>
                            <Label className="text-xs text-muted-foreground">
                                Тип параметра, например &quot;string&quot;, &quot;number&quot; или &quot;boolean&quot;
                            </Label>
                            <Select
                                value={param.type}
                                onValueChange={(value: ParameterType) =>
                                    updateParameter(index, "type", value)
                                }
                                disabled={disabled}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите тип" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="string">Строка</SelectItem>
                                    <SelectItem value="number">Число</SelectItem>
                                    <SelectItem value="boolean">Булево</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Описание</Label>
                        <Label className="text-xs text-muted-foreground">
                            Описание параметра, чтобы LLM могла его понять, например &quot;ID клиента для получения деталей заказа&quot;
                        </Label>
                        <Input
                            placeholder="Опишите назначение параметра..."
                            value={param.description}
                            onChange={(e) =>
                                updateParameter(index, "description", e.target.value)
                            }
                            disabled={disabled}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Switch
                            id={`required-${index}`}
                            checked={param.required}
                            onCheckedChange={(checked) =>
                                updateParameter(index, "required", checked)
                            }
                            disabled={disabled}
                        />
                        <Label htmlFor={`required-${index}`} className="text-sm">
                            Обязательный
                        </Label>
                    </div>
                </div>
            ))}

            <Button
                variant="outline"
                size="sm"
                onClick={addParameter}
                className="w-fit"
                disabled={disabled}
            >
                <PlusIcon className="h-4 w-4 mr-1" /> Добавить параметр
            </Button>
        </div>
    );
}

interface PresetParameterEditorProps {
    parameters: PresetToolParameter[];
    onChange: (parameters: PresetToolParameter[]) => void;
    disabled?: boolean;
}

export function PresetParameterEditor({
    parameters,
    onChange,
    disabled = false,
}: PresetParameterEditorProps) {
    const addParameter = () => {
        onChange([
            ...parameters,
            { name: "", type: "string", valueTemplate: "", required: true },
        ]);
    };

    const updateParameter = (
        index: number,
        field: keyof PresetToolParameter,
        value: string | boolean
    ) => {
        const newParams = [...parameters];
        newParams[index] = { ...newParams[index], [field]: value };
        onChange(newParams);
    };

    const removeParameter = (index: number) => {
        onChange(parameters.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            {parameters.length === 0 && (
                <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
                    Предустановленные параметры не заданы. Добавьте один, чтобы передать фиксированное значение или контекст рабочего процесса в запрос.
                </div>
            )}

            {parameters.map((param, index) => (
                <div
                    key={index}
                    className="border rounded-lg p-4 space-y-3 bg-muted/20"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                            Предуст. параметр {index + 1}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeParameter(index)}
                            disabled={disabled}
                            className="h-8 w-8"
                        >
                            <Trash2Icon className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Имя</Label>
                            <Label className="text-xs text-muted-foreground">
                                Ключ, отправляемый в API, например &quot;phone_number&quot; или &quot;customer_id&quot;
                            </Label>
                            <Input
                                placeholder="например, phone_number"
                                value={param.name}
                                onChange={(e) =>
                                    updateParameter(index, "name", e.target.value)
                                }
                                disabled={disabled}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Тип</Label>
                            <Label className="text-xs text-muted-foreground">
                                JSON-тип для отправки в API
                            </Label>
                            <Select
                                value={param.type}
                                onValueChange={(value: ParameterType) =>
                                    updateParameter(index, "type", value)
                                }
                                disabled={disabled}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите тип" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="string">Строка</SelectItem>
                                    <SelectItem value="number">Число</SelectItem>
                                    <SelectItem value="boolean">Булево</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Значение или шаблон</Label>
                        <Label className="text-xs text-muted-foreground">
                            Используйте фиксированное значение или шаблон, например {`{{initial_context.phone_number}}`} или {`{{gathered_context.customer_id}}`}
                        </Label>
                        <Input
                                placeholder="например, {{initial_context.phone_number}}"
                            value={param.valueTemplate}
                            onChange={(e) =>
                                updateParameter(index, "valueTemplate", e.target.value)
                            }
                            disabled={disabled}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Switch
                            id={`preset-required-${index}`}
                            checked={param.required}
                            onCheckedChange={(checked) =>
                                updateParameter(index, "required", checked)
                            }
                            disabled={disabled}
                        />
                        <Label htmlFor={`preset-required-${index}`} className="text-sm">
                            Обязательный
                        </Label>
                    </div>
                </div>
            ))}

            <Button
                variant="outline"
                size="sm"
                onClick={addParameter}
                className="w-fit"
                disabled={disabled}
            >
                <PlusIcon className="h-4 w-4 mr-1" /> Добавить предуст. параметр
            </Button>
        </div>
    );
}
