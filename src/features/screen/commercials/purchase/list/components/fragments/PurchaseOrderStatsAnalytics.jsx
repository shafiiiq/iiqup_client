import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './PurchaseOrderStats.css';
import Table from '@/shared/components/widgets/table/Table';

const formatCurrency = (value) =>
    `QAR ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function PurchaseOrderStatsAnalytics({ series, loading }) {
    if (loading || !series) {
        return <div className="purchase order stats empty"><p>Loading analytics…</p></div>;
    }

    return (
        <div className="purchase order stats analytics">
            <div className="purchase order stats chart-card">
                <div className="purchase order stats chart-header">
                    <h3>Cost vs Count — {series.rangeLabel}</h3>
                    <p>Compare purchase order volume against total spend per bucket</p>
                </div>
                {series.buckets?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={360}>
                        <ComposedChart data={series.buckets}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip formatter={(value, name) => (name === 'total' ? [formatCurrency(value), 'Cost'] : [value, 'Count'])} />
                            <Legend />
                            <Bar yAxisId="left" dataKey="total" fill="#f08c4a" name="Cost" radius={[6, 6, 0, 0]} />
                            <Line yAxisId="right" type="monotone" dataKey="count" stroke="#7c9cf5" strokeWidth={3} dot name="Purchase Orders" />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="purchase order stats empty"><p>No purchase orders for this period</p></div>
                )}
            </div>

            <div className="purchase order stats table-card">
                <div className="purchase order stats chart-header">
                    <h3>Bucket Breakdown</h3>
                    <p>Raw numbers behind the chart above</p>
                </div>
                <Table
                    columns={[
                        { key: 'label', header: 'Period', render: (b) => b.label },
                        { key: 'count', header: 'Purchase Orders', render: (b) => b.count },
                        { key: 'total', header: 'Total Cost', render: (b) => formatCurrency(b.total) },
                    ]}
                    data={series.buckets || []}
                    rowKey={(b) => b.label}
                    emptyMessage="No purchase orders for this period"
                />
            </div>
        </div>
    );
}

export default PurchaseOrderStatsAnalytics;