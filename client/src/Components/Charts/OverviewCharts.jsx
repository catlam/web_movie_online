// Components/Charts/OverviewCharts.jsx
import React, { useMemo } from 'react';
import {
    ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart, Line
} from 'recharts';

const containerCls = "bg-main border border-border rounded p-4";

function normalize(arr) {
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
}

export default function OverviewCharts({ movies = [], series = [] }) {
    const m = normalize(movies);
    const s = normalize(series);

    // 1) Pie: Movies vs Series
    const pieData = useMemo(() => ([
        { name: 'Movies', value: m.length },
        { name: 'Series', value: s.length },
    ]), [m.length, s.length]);

    const PIE_COLORS = ['#60a5fa', '#c084fc'];

    // 2) Bar: Top 8 category (movies + series)
    const barData = useMemo(() => {
        const count = {};
        const add = (it) => {
            const c = (it?.category && typeof it.category === 'string')
                ? it.category
                : Array.isArray(it?.category) ? it.category?.[0] : 'Unknown';
            count[c || 'Unknown'] = (count[c || 'Unknown'] || 0) + 1;
        };
        m.forEach(add); s.forEach(add);
        return Object.entries(count)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);
    }, [m, s]);

    // 3) Line: Titles by year (6 năm gần nhất)
    const lineData = useMemo(() => {
        const cur = new Date().getFullYear();
        const years = Array.from({ length: 6 }, (_, i) => cur - 5 + i);
        const bucket = Object.fromEntries(years.map(y => [y, { year: String(y), Movies: 0, Series: 0, Total: 0 }]));
        const safeYear = (v) => {
            const y = parseInt(v, 10);
            return Number.isFinite(y) ? y : null;
        };
        m.forEach(it => {
            const y = safeYear(it?.year);
            if (bucket[y]) { bucket[y].Movies += 1; bucket[y].Total += 1; }
        });
        s.forEach(it => {
            const y = safeYear(it?.year);
            if (bucket[y]) { bucket[y].Series += 1; bucket[y].Total += 1; }
        });
        return years.map(y => bucket[y]);
    }, [m, s]);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Pie */}
            <div className={containerCls}>
                <h4 className="text-sm text-border mb-3">Movies vs Series</h4>
                <div className="h-64">
                    <ResponsiveContainer>
                        <PieChart>
                            <Tooltip />
                            <Legend />
                            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80}>
                                {pieData.map((entry, idx) => (
                                    <Cell key={`pie-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bar */}
            <div className={containerCls}>
                <h4 className="text-sm text-border mb-3">Top Categories</h4>
                <div className="h-64">
                    <ResponsiveContainer>
                        <BarChart data={barData} margin={{ left: 8, right: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="total" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Line */}
            <div className={containerCls}>
                <h4 className="text-sm text-border mb-3">Titles by Year</h4>
                <div className="h-64">
                    <ResponsiveContainer>
                        <LineChart data={lineData} margin={{ left: 8, right: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="Movies" />
                            <Line type="monotone" dataKey="Series" />
                            <Line type="monotone" dataKey="Total" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
