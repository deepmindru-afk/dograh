'use client';

import { Check, Copy, ExternalLink, FileText, LoaderCircle, Phone, Video } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect, useRef, useState } from 'react';

import BrowserCall from '@/app/workflow/[workflowId]/run/[runId]/BrowserCall';
import LiveKitCall from '@/app/workflow/[workflowId]/run/[runId]/components/LiveKitCall';
import { RealtimeFeedback, WorkflowRunLogs } from '@/app/workflow/[workflowId]/run/[runId]/components/RealtimeFeedback';
import WorkflowLayout from '@/app/workflow/WorkflowLayout';
import {
    createWorkflowRunApiV1WorkflowWorkflowIdRunsPost,
    getWorkflowRunApiV1WorkflowWorkflowIdRunsRunIdGet,
} from '@/client/sdk.gen';
import { MediaPreviewButton, MediaPreviewDialog } from '@/components/MediaPreviewDialog';
import { OnboardingTooltip } from '@/components/onboarding/OnboardingTooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PostHogEvent } from '@/constants/posthog-events';
import { WORKFLOW_RUN_MODES } from '@/constants/workflowRunModes';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { downloadFile } from '@/lib/files';
import { getRandomId } from '@/lib/utils';

interface WorkflowRunResponse {
    is_completed: boolean;
    mode: string;
    transcript_url: string | null;
    recording_url: string | null;
    initial_context: Record<string, string | number | boolean | object> | null;
    gathered_context: Record<string, string | number | boolean | object> | null;
    logs: WorkflowRunLogs | null;
    annotations: Record<string, unknown> | null;
}

function ContextDisplay({ title, context }: { title: string; context: Record<string, string | number | boolean | object> | null }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!context) return;
        navigator.clipboard.writeText(JSON.stringify(context, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!context || Object.keys(context).length === 0) {
        return (
            <Card className="border-border">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Нет данных</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{title}</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-2">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Скопировано' : 'Копировать'}
                </Button>
            </CardHeader>
            <CardContent>
                <pre className="text-sm bg-muted p-3 rounded-md overflow-auto max-h-64">
                    {JSON.stringify(context, null, 2)}
                </pre>
            </CardContent>
        </Card>
    );
}


export default function WorkflowRunPage() {
    const params = useParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [startingCall, setStartingCall] = useState(false);
    const auth = useAuth();
    const [workflowRun, setWorkflowRun] = useState<WorkflowRunResponse | null>(null);
    const { hasSeenTooltip, markTooltipSeen } = useOnboarding();
    const customizeButtonRef = useRef<HTMLButtonElement>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!auth.loading && !auth.isAuthenticated) {
            auth.redirectToLogin();
        }
    }, [auth]);

    // Shrink and reposition Chatwoot bubble on this page
    useEffect(() => {
        document.body.classList.add('chatwoot-compact');
        return () => document.body.classList.remove('chatwoot-compact');
    }, []);

    const { openPreview, dialog } = MediaPreviewDialog();

    useEffect(() => {
        const fetchWorkflowRun = async () => {
            if (!auth.isAuthenticated || auth.loading) return;

            setIsLoading(true);
            const workflowId = params.workflowId;
            const runId = params.runId;
            const response = await getWorkflowRunApiV1WorkflowWorkflowIdRunsRunIdGet({
                path: {
                    workflow_id: Number(workflowId),
                    run_id: Number(runId),
                },
            });
            setIsLoading(false);
            const runData = {
                is_completed: response.data?.is_completed ?? false,
                mode: response.data?.mode ?? '',
                transcript_url: response.data?.transcript_url ?? null,
                recording_url: response.data?.recording_url ?? null,
                initial_context: response.data?.initial_context as Record<string, string> | null ?? null,
                gathered_context: response.data?.gathered_context as Record<string, string> | null ?? null,
                logs: response.data?.logs as WorkflowRunLogs | null ?? null,
                annotations: response.data?.annotations as Record<string, unknown> | null ?? null,
            };
            setWorkflowRun(runData);
            posthog.capture(PostHogEvent.WORKFLOW_RUN_DETAILS_VIEWED, {
                workflow_id: Number(workflowId),
                run_id: Number(runId),
                is_completed: runData.is_completed,
                has_recording: !!runData.recording_url,
                has_transcript: !!runData.transcript_url,
            });
        };
        fetchWorkflowRun();
    }, [params.workflowId, params.runId, auth]);

    const handleTestAgain = async () => {
        if (startingCall) return;
        setStartingCall(true);
        try {
            const workflowId = Number(params.workflowId);
            const workflowRunName = `WR-${getRandomId()}`;
            const testMode = workflowRun?.mode === WORKFLOW_RUN_MODES.LIVEKIT
                ? WORKFLOW_RUN_MODES.LIVEKIT
                : WORKFLOW_RUN_MODES.SMALL_WEBRTC;
            const response = await createWorkflowRunApiV1WorkflowWorkflowIdRunsPost({
                path: { workflow_id: workflowId },
                body: { mode: testMode, name: workflowRunName },
            });
            if (response.data?.id) {
                router.push(`/workflow/${workflowId}/run/${response.data.id}`);
            }
        } finally {
            setStartingCall(false);
        }
    };

    let returnValue = null;

    if (isLoading) {
        returnValue = (
            <div className="h-full flex items-center justify-center">
                <div className="w-full max-w-4xl p-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardContent>
                        <CardFooter className="flex gap-4">
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-10 w-32" />
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }
    else if (workflowRun?.is_completed) {
        returnValue = (
            <div className="flex h-screen w-full overflow-hidden">
                {/* Main content - 2/3 width */}
                <div className="w-2/3 h-full overflow-y-auto">
                    <div className="w-full max-w-4xl space-y-6 p-6">
                    <Card className="border-border">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <CardTitle className="text-2xl">Запуск агента завершён</CardTitle>
                                <div className="h-8 w-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                    <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleTestAgain}
                                    disabled={startingCall}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    {startingCall ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Phone className="h-4 w-4" />
                                    )}
                                    {startingCall ? 'Запуск...' : 'Повторить тест'}
                                </Button>
                                <Link href={`/workflow/${params.workflowId}`}>
                                    <Button
                                        ref={customizeButtonRef}
                                        className="gap-2"
                                        onClick={() => {
                                            if (!hasSeenTooltip('customize_workflow')) {
                                                markTooltipSeen('customize_workflow');
                                            }
                                        }}
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Настроить агента
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-8">Запуск голосового агента успешно завершён. Вы можете просмотреть или скачать транскрипцию и запись.</p>

                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Просмотр:</span>
                                    <MediaPreviewButton
                                        recordingUrl={workflowRun?.recording_url}
                                        transcriptUrl={workflowRun?.transcript_url}
                                        runId={Number(params.runId)}
                                        onOpenPreview={openPreview}
                                    />
                                </div>
                                <div className="flex items-center gap-2 border-l border-border pl-4">
                                    <span className="text-sm text-muted-foreground">Скачать:</span>
                                    <Button
                                        onClick={() => downloadFile(workflowRun?.transcript_url)}
                                        disabled={!workflowRun?.transcript_url || !auth.isAuthenticated}
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Транскрипция
                                    </Button>
                                    <Button
                                        onClick={() => downloadFile(workflowRun?.recording_url)}
                                        disabled={!workflowRun?.recording_url || !auth.isAuthenticated}
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Video className="h-4 w-4" />
                                        Запись
                                    </Button>
                                </div>
                                {workflowRun?.gathered_context?.trace_url && (
                                    <div className="flex items-center gap-2 border-l border-border pl-4">
                                        <span className="text-sm text-muted-foreground">Трассировка:</span>
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="gap-2"
                                        >
                                            <a
                                                href={String(workflowRun.gathered_context.trace_url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                Просмотреть трассировку
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                        <div className="grid gap-6 md:grid-cols-2">
                            <ContextDisplay
                                title="Начальный контекст"
                                context={workflowRun?.initial_context}
                            />
                            <ContextDisplay
                                title="Собранный контекст"
                                context={workflowRun?.gathered_context}
                            />
                        </div>

                        {workflowRun?.annotations && Object.keys(workflowRun.annotations).length > 0 && (
                            <ContextDisplay
                                title="Результаты QA"
                                context={workflowRun.annotations as Record<string, string | number | boolean | object>}
                            />
                        )}
                    </div>
                </div>

                {/* Transcript panel - 1/3 width */}
                <div className="w-1/3 h-full shrink-0 overflow-hidden">
                    <RealtimeFeedback mode="historical" logs={workflowRun?.logs} />
                </div>
            </div>
        );
    }
    else {
        const isLiveKit = workflowRun?.mode === WORKFLOW_RUN_MODES.LIVEKIT;
        returnValue =
            <div className="h-full flex items-center justify-center p-4">
                {isLiveKit ? (
                    <LiveKitCall
                        workflowId={Number(params.workflowId)}
                        workflowRunId={Number(params.runId)}
                    />
                ) : (
                    <BrowserCall
                        workflowId={Number(params.workflowId)}
                        workflowRunId={Number(params.runId)}
                        initialContextVariables={
                            workflowRun?.initial_context
                                ? Object.fromEntries(
                                    Object.entries(workflowRun.initial_context).map(([key, value]) => [
                                        key,
                                        typeof value === 'object' && value !== null
                                            ? JSON.stringify(value)
                                            : String(value)
                                    ])
                                )
                                : null
                        }
                    />
                )}
            </div>
    }

    return (
        <WorkflowLayout>
            {returnValue}
            {dialog}

            {/* Onboarding Tooltip for Customize Workflow */}
            {workflowRun?.is_completed && (
                <OnboardingTooltip
                    title='Настроить ваш сценарий'
                    targetRef={customizeButtonRef}
                    message="Отредактируйте сценарий, чтобы настроить поведение голосового агента, добавить новые шаги или изменить поток разговора."
                    onDismiss={() => markTooltipSeen('customize_workflow')}
                    showNext={false}
                    isVisible={!hasSeenTooltip('customize_workflow')}
                />
            )}
        </WorkflowLayout>
    );
}
