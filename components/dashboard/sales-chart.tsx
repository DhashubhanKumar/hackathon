'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SalesChartProps {
    data: {
        name: string;
        sales: number;
        tickets: number;
    }[];
}

export function SalesChart({ data }: SalesChartProps) {
    return (
        <div className="w-full h-[400px] glass p-4 rounded-2xl overflow-hidden">
            <h3 className="text-xl font-bold mb-6">Sales & Booking Performance</h3>
            <div className="w-full h-[calc(100%-4rem)]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#9ca3af"
                            tick={{ fill: '#9ca3af' }}
                            tickLine={{ stroke: '#9ca3af' }}
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            stroke="#a78bfa"
                            tick={{ fill: '#a78bfa' }}
                            tickLine={{ stroke: '#a78bfa' }}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#4ade80"
                            tick={{ fill: '#4ade80' }}
                            tickLine={{ stroke: '#4ade80' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: '1px solid #374151',
                                borderRadius: '0.5rem',
                                color: '#f3f4f6'
                            }}
                            cursor={{ fill: '#ffffff10' }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="sales" name="Revenue ($)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="tickets" name="Tickets Sold" fill="#4ade80" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            );
}
