'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import AOS from 'aos';
import 'aos/dist/aos.css';

interface PayrollChartProps {
    data: {
        month: string;
        amount: number;
    }[];
}

export default function PayrollChart({ data }: PayrollChartProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="lg:col-span-2 bg-[hsl(var(--card-bg))] rounded-2xl p-6 border border-border/5" data-aos="fade-up" data-aos-delay="100">
            <h3 className="text-xl font-semibold mb-6 text-foreground">Payroll Overview</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={isDark ? '#333' : '#e5e7eb'} 
                        />
                        <XAxis 
                            dataKey="month" 
                            stroke={isDark ? '#666' : '#4b5563'} 
                        />
                        <YAxis 
                            stroke={isDark ? '#666' : '#4b5563'} 
                        />
                        <Tooltip 
                            contentStyle={{ 
                                background: isDark ? '#14141F' : '#ffffff',
                                border: '1px solid',
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                color: isDark ? '#ffffff' : '#000000'
                            }} 
                        />
                        <Line 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}