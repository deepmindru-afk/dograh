"use client";

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { getCampaignsApiV1CampaignGet } from '@/client/sdk.gen';
import type { CampaignsResponse } from '@/client/types.gen';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/lib/auth';

export default function CampaignsPage() {
    const { user, getAccessToken, redirectToLogin, loading } = useAuth();
    const router = useRouter();

    const [campaignsData, setCampaignsData] = useState<CampaignsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const hasFetched = useRef(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            redirectToLogin();
        }
    }, [loading, user, redirectToLogin]);

    // Fetch campaigns once when user is ready
    useEffect(() => {
        if (loading || !user || hasFetched.current) {
            return;
        }
        hasFetched.current = true;

        const fetchCampaigns = async () => {
            setIsLoading(true);
            try {
                const accessToken = await getAccessToken();
                const response = await getCampaignsApiV1CampaignGet({
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    }
                });

                if (response.data) {
                    setCampaignsData(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch campaigns:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCampaigns();
    }, [loading, user, getAccessToken]);

    const handleRowClick = (campaignId: number) => {
        router.push(`/campaigns/${campaignId}`);
    };

    const handleCreateCampaign = () => {
        router.push('/campaigns/new');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getStateBadgeVariant = (state: string) => {
        switch (state) {
            case 'created':
                return 'secondary';
            case 'running':
                return 'default';
            case 'paused':
                return 'outline';
            case 'completed':
                return 'secondary';
            case 'failed':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Кампании</h1>
                    <p>Управляйте массовыми кампаниями выполнения воркфлоу</p>
                </div>
                    <Button onClick={handleCreateCampaign}>
                        <Plus className="h-4 w-4 mr-2" />
                        Создать кампанию
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Все кампании</CardTitle>
                        <CardDescription>
                            Просмотр и управление кампаниями
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="animate-pulse space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-12 bg-muted rounded"></div>
                                ))}
                            </div>
                        ) : campaignsData && campaignsData.campaigns.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Название</TableHead>
                                            <TableHead>Воркфлоу</TableHead>
                                            <TableHead>Статус</TableHead>
                                            <TableHead>Прогресс</TableHead>
                                            <TableHead>Создана</TableHead>
                                            <TableHead className="text-right">Действие</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {campaignsData.campaigns.map((campaign) => (
                                            <TableRow
                                                key={campaign.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => handleRowClick(campaign.id)}
                                            >
                                                <TableCell>{campaign.id}</TableCell>
                                                <TableCell className="font-medium">{campaign.name}</TableCell>
                                                <TableCell>{campaign.workflow_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getStateBadgeVariant(campaign.state)}>
                                                        {campaign.state}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {campaign.executed_count} / {campaign.total_queued_count}
                                                </TableCell>
                                                <TableCell>{formatDate(campaign.created_at)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRowClick(campaign.id);
                                                        }}
                                                    >
                                                        Открыть
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="mb-4">Кампании не найдены</p>
                                <Button onClick={handleCreateCampaign} variant="outline">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Создать первую кампанию
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
        </div>
    );
}
