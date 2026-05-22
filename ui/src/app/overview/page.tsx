"use client";

import Link from 'next/link';

import { GitHubStarBadge } from '@/components/layout/GitHubStarBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

export default function OverviewPage() {
    const { user, provider } = useAuth();
    const isOSSMode = provider !== 'stack';

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Welcome Card */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-3xl">
                            {isOSSMode ? (
                                "Добро пожаловать в Портал"
                            ) : (
                                `С возвращением${user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}!`
                            )}
                        </CardTitle>
                        <CardDescription className="text-lg mt-2">
                            {isOSSMode ? (
                                <>
                                    No-code Голосовые агенты 
                                </>
                            ) : (
                                "Начните создавать голосовые AI-сценарии"
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isOSSMode && (
                            <div className="mb-6">
                                <GitHubStarBadge label="АО Портал" showCount source="overview_page" />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Создавайте и управляйте голосовыми агентами</CardTitle>
                            <CardDescription>
                                Создавайте мощных AI-агентов с помощью визуального редактора
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href="/workflow">
                                    Перейти к агентам
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Настройка сервисов</CardTitle>
                            <CardDescription>
                                Настройте AI-сервисы: LLM, TTS и STT провайдеры
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline">
                                <Link href="/model-configurations">
                                    Настроить модели
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Resources Section */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Ресурсы</CardTitle>
                        <CardDescription>
                            Получите помощь и узнайте больше о Portal
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <Button asChild variant="outline">
                                <a
                                    href="https://www.portalos.ru"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    АО Портал
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
