"use client";

import { Zap } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AutomationPage() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Автоматизация</h1>
                <p>Автоматизируйте свои workflow и процессы</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Скоро</CardTitle>
                    <CardDescription>
                        Функции автоматизации находятся в разработке
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Zap className="w-16 h-16 mx-auto mb-6" />
                        <p className="text-lg mb-4">
                            Мы работаем над мощными функциями автоматизации, которые помогут оптимизировать ваши workflow.
                        </p>
                        <p>
                            Автоматизируйте повторяющиеся задачи, запускайте действия по событиям и создавайте интеллектуальные конвейеры workflow.
                        </p>
                        <p className="mt-4">
                            Следите за обновлениями!
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
