"use client";

import { ArrowRight, List, Loader2 } from 'lucide-react';
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/lib/auth';
import { impersonateAsSuperadmin } from "@/lib/utils";

export default function SuperadminPage() {
    const [userId, setUserId] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { user, getAccessToken } = useAuth();

    const handleImpersonate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            if (!user) {
                setError("Пользователь не аутентифицирован. Пожалуйста, войдите и попробуйте снова.");
                setIsLoading(false);
                return;
            }
            const accessToken = await getAccessToken();
            if (!accessToken) {
                throw new Error('Missing admin access token');
            }

            await impersonateAsSuperadmin({
                accessToken: accessToken,
                providerUserId: userId,
                redirectPath: '/workflow',
                openInNewTab: true,
            });
        } catch (err) {
            setError("Не удалось имперсонировать пользователя. Пожалуйста, попробуйте снова.");
            console.error("Impersonation error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <main className="container mx-auto p-6 space-y-6 max-w-4xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">Панель суперадминистратора</h1>
                    <p className="text-sm text-muted-foreground">Управление пользователями и просмотр системных данных</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                        {/* User Impersonation Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Имперсонация пользователя</CardTitle>
                                <CardDescription>
                                    Имперсонация учётной записи пользователя для отладки или поддержки
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleImpersonate} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="userId">ID пользователя провайдера</Label>
                                        <Input
                                            id="userId"
                                            value={userId}
                                            onChange={(e) => setUserId(e.target.value)}
                                            placeholder="Введите ID пользователя провайдера"
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Обработка...
                                            </>
                                        ) : (
                                            'Имперсонировать пользователя'
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Workflow Runs Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Запуски Workflow</CardTitle>
                                <CardDescription>
                                    Просмотр и управление всеми запусками workflow в организациях
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Доступ к подробной информации о всех запусках workflow, включая статус, записи, транскрипты и данные об использовании.
                                    </p>
                                    <Link href="/superadmin/runs">
                                        <Button className="w-full">
                                            <List className="mr-2 h-4 w-4" />
                                            Посмотреть все запуски
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                </div>
            </main>
        </>
    );
}
