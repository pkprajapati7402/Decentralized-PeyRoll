'use client';

import { Activity, Users, Wallet } from 'lucide-react';

interface ActivityItem {
    id: string;
    type: 'payroll' | 'employee' | 'deposit';
    title: string;
    description: string;
    timestamp: string;
}

interface RecentActivityProps {
    activities: ActivityItem[];
}

const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
        case 'payroll':
            return <Activity className="w-4 h-4 text-emerald-500" />;
        case 'employee':
            return <Users className="w-4 h-4 text-blue-500" />;
        case 'deposit':
            return <Wallet className="w-4 h-4 text-primary" />;
    }
};

const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
        case 'payroll':
            return 'bg-emerald-500/10';
        case 'employee':
            return 'bg-blue-500/10';
        case 'deposit':
            return 'bg-primary/10';
    }
};

export default function RecentActivity({ activities }: RecentActivityProps) {
    return (
        <div className="bg-[hsl(var(--card-bg))] rounded-2xl p-6 border border-border/5">
            <h3 className="text-xl font-semibold mb-6 text-foreground">Recent Activity</h3>
            <div className="space-y-4">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-3 border-b border-border/10">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                                {getActivityIcon(activity.type)}
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{activity.title}</p>
                                <p className="text-sm text-muted-foreground">{activity.description}</p>
                            </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{activity.timestamp}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}