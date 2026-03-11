import React, { useState, useMemo } from 'react';
import {
    BarChart3, FileText, Printer, Calendar, Download,
    TrendingUp, ArrowDownCircle, ArrowUpCircle, Package, Wrench, Search
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Card, Button, Input, Select, SectionHeader, EmptyState, Spinner, cn } from './ui';

export function ReportsModule({ productores, clientes, variedades }) {
    const { data: entradas } = useFirestore('registro_entradas');
    const { data: detalles } = useFirestore('detalle_entradas');
    const { data: salidas } = useFirestore('registro_salidas');
    const { data: detalleSalidas } = useFirestore('detalle_salidas');
    const { data: mantenimientos } = useFirestore('mantenimientos');
    const { data: manejos } = useFirestore('manejos');

    const [reportType, setReportType] = useState('ventas');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Helper to filter by date
    const filterByDate = (data, dateField = 'fecha') => {
        return data.filter(item => {
            const date = item[dateField];
            return date >= dateRange.start && date <= dateRange.end;
        });
    };

    /* ── REPORT 1: VENTAS Y LIQUIDACIONES ── */
    const salesReport = useMemo(() => {
        const filteredSalidas = filterByDate(salidas);
        const relatedDetalles = detalleSalidas.filter(ds =>
            filteredSalidas.some(s => s.id === ds.registro_salida_id)
        );

        let totalVenta = 0;
        let totalCajas = 0;

        relatedDetalles.forEach(ds => {
            totalVenta += (ds.precio_dia * ds.cantidad_vendida);
            totalCajas += ds.cantidad_vendida;
        });

        // Group by variety
        const byVariety = {};
        relatedDetalles.forEach(ds => {
            const entryDet = detalles.find(ed => ed.id === ds.detalle_entrada_id);
            if (!entryDet) return;
            const vId = entryDet.variedad_id;
            if (!byVariety[vId]) byVariety[vId] = { venta: 0, cajas: 0 };
            byVariety[vId].venta += (ds.precio_dia * ds.cantidad_vendida);
            byVariety[vId].cajas += ds.cantidad_vendida;
        });

        return { totalVenta, totalCajas, byVariety };
    }, [salidas, detalleSalidas, dateRange, detalles]);

    /* ── REPORT 2: INVENTARIO ACTUAL ── */
    const inventoryReport = useMemo(() => {
        const stock = detalles.filter(d => d.status === 'almacenada' || d.status === 'en_proceso');
        const byVariety = {};
        let totalCajas = 0;

        stock.forEach(d => {
            const vId = d.variedad_id;
            const disponible = d.cantidad_recibida - (d.cantidad_vendida || 0) - (d.merma || 0);
            if (!byVariety[vId]) byVariety[vId] = { stock: 0 };
            byVariety[vId].stock += disponible;
            totalCajas += disponible;
        });

        return { totalCajas, byVariety };
    }, [detalles]);

    /* ── REPORT 3: GASTOS OPERATIVOS ── */
    const expensesReport = useMemo(() => {
        const filteredMantos = filterByDate(mantenimientos);
        const filteredManejos = filterByDate(manejos);

        const totalManto = filteredMantos.reduce((s, m) => s + Number(m.costo || 0), 0);
        const totalManejo = filteredManejos.reduce((s, m) => s + Number(m.costo || 0), 0);

        return { totalManto, totalManejo, total: totalManto + totalManejo };
    }, [mantenimientos, manejos, dateRange]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                <SectionHeader title="Reportes del Sistema" />
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 gap-2 shadow-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input
                            type="date"
                            className="text-xs font-medium border-none p-0 focus:ring-0"
                            value={dateRange.start}
                            onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
                        />
                        <span className="text-slate-300">→</span>
                        <input
                            type="date"
                            className="text-xs font-medium border-none p-0 focus:ring-0"
                            value={dateRange.end}
                            onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
                        />
                    </div>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" /> Imprimir Vista
                    </Button>
                </div>
            </div>

            {/* Selector de Reporte */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-print">
                <ReportBtn
                    active={reportType === 'ventas'}
                    onClick={() => setReportType('ventas')}
                    icon={TrendingUp} label="Ventas y Ingresos" color="green"
                />
                <ReportBtn
                    active={reportType === 'inventario'}
                    onClick={() => setReportType('inventario')}
                    icon={Package} label="Estado de Bodega" color="blue"
                />
                <ReportBtn
                    active={reportType === 'gastos'}
                    onClick={() => setReportType('gastos')}
                    icon={ArrowDownCircle} label="Gastos Operativos" color="orange"
                />
            </div>

            {/* SECCIÓN DE DATOS */}
            <div className="space-y-6 print:m-0">
                {reportType === 'ventas' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <KpiCard label="Ventas Totales" value={`$${salesReport.totalVenta.toLocaleString()}`} sub={`${salesReport.totalCajas} unidades vendidas`} icon={TrendingUp} color="green" />
                            <KpiCard label="Promedio por Venta" value={`$${(salesReport.totalVenta / (filterByDate(salidas).length || 1)).toFixed(2)}`} sub="Ingreso promedio" icon={BarChart3} color="blue" />
                            <KpiCard label="Ventas Periodo" value={filterByDate(salidas).length} sub="Notas de salida emitidas" icon={FileText} color="purple" />
                        </div>

                        <Card title="Ventas por Variedad">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Variedad</th>
                                            <th className="px-4 py-3 text-right">Cant. Vendida</th>
                                            <th className="px-4 py-3 text-right">Monto Total</th>
                                            <th className="px-4 py-3 text-right">% Venta</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {Object.entries(salesReport.byVariety).map(([vId, data]) => {
                                            const v = variedades.find(v => v.id === vId);
                                            const perc = (data.venta / salesReport.totalVenta) * 100;
                                            return (
                                                <tr key={vId}>
                                                    <td className="px-4 py-3 font-semibold text-slate-700">{v?.nombre || 'N/A'}</td>
                                                    <td className="px-4 py-3 text-right">{data.cajas} <span className="text-[10px] text-slate-400">unids</span></td>
                                                    <td className="px-4 py-3 text-right font-bold text-green-700">${data.venta.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-green-500" style={{ width: `${perc}%` }} />
                                                            </div>
                                                            <span className="text-[10px] font-mono">{perc.toFixed(1)}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {Object.keys(salesReport.byVariety).length === 0 && (
                                            <tr><td colSpan="4" className="py-10 text-center text-slate-400 italic">No hay datos para este periodo</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </>
                )}

                {reportType === 'inventario' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <KpiCard label="Total en Existencia" value={inventoryReport.totalCajas} sub="unidades físicas en bodega" icon={Package} color="blue" />
                            <KpiCard label="Variedades con Stock" value={Object.keys(inventoryReport.byVariety).length} sub="Diferentes tipos de tuna" icon={Search} color="green" />
                        </div>

                        <Card title="Desglose de Existencias">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                {Object.entries(inventoryReport.byVariety).map(([vId, data]) => {
                                    const v = variedades.find(v => v.id === vId);
                                    return (
                                        <div key={vId} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center">
                                            <p className="text-xs font-bold text-slate-500 uppercase">{v?.nombre}</p>
                                            <p className="text-3xl font-black text-slate-900 my-1">{data.stock}</p>
                                            <p className="text-[10px] text-slate-400 italic">{v?.presentacion_default || 'unidades'}</p>
                                        </div>
                                    );
                                })}
                            </div>
                            {Object.keys(inventoryReport.byVariety).length === 0 && (
                                <div className="py-12 text-center text-slate-400">No hay producto en bodega actualmente</div>
                            )}
                        </Card>
                    </>
                )}

                {reportType === 'gastos' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <KpiCard label="Gasto Total" value={`$${expensesReport.total.toLocaleString()}`} sub="Operativo acumulado" icon={ArrowDownCircle} color="orange" />
                            <KpiCard label="Mantenimiento" value={`$${expensesReport.totalManto.toLocaleString()}`} sub="Equipos y maquinaria" icon={Wrench} color="blue" />
                            <KpiCard label="Manejo de Campo" value={`$${expensesReport.totalManejo.toLocaleString()}`} sub="Actividades en huertas" icon={TrendingUp} color="green" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card title="Distribución de Gastos">
                                <div className="space-y-4 pt-2">
                                    <ExpenseItem label="Mantenimientos" amount={expensesReport.totalManto} total={expensesReport.total} color="blue" icon={Wrench} />
                                    <ExpenseItem label="Manejo de Huertas" amount={expensesReport.totalManejo} total={expensesReport.total} color="green" icon={TrendingUp} />
                                </div>
                            </Card>

                            <Card title="Últimos Movimientos">
                                <div className="space-y-2">
                                    {filterByDate(mantenimientos).slice(0, 3).map(m => (
                                        <div key={m.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                                            <span className="text-slate-600 font-medium">🚜 Manto: {m.tipo_mantenimiento}</span>
                                            <span className="font-bold text-slate-900">${m.costo}</span>
                                        </div>
                                    ))}
                                    {filterByDate(manejos).slice(0, 3).map(m => (
                                        <div key={m.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                                            <span className="text-slate-600 font-medium">🌳 Campo: {m.tipo_trabajo}</span>
                                            <span className="font-bold text-slate-900">${m.costo}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function ReportBtn({ active, onClick, icon: Icon, label, color }) {
    const colors = {
        green: active ? "bg-green-600 text-white" : "bg-white text-slate-600 hover:bg-green-50",
        blue: active ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-blue-50",
        orange: active ? "bg-orange-600 text-white" : "bg-white text-slate-600 hover:bg-orange-50",
    }
    return (
        <button onClick={onClick} className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all shadow-sm border whitespace-nowrap",
            active ? "shadow-md border-transparent" : "border-slate-200",
            colors[color]
        )}>
            <Icon className="w-4 h-4" /> {label}
        </button>
    );
}

function KpiCard({ label, value, sub, icon: Icon, color }) {
    const colors = {
        green: "bg-green-50 text-green-600",
        blue: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
        orange: "bg-orange-50 text-orange-600",
    };
    return (
        <Card className="flex flex-col gap-2 relative overflow-hidden group">
            <div className={cn("absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-5 group-hover:opacity-10 transition-all", colors[color])} />
            <div className="flex justify-between items-start">
                <div className={cn("p-2.5 rounded-xl", colors[color])}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">{label}</p>
                    <h2 className="text-2xl font-black text-slate-900 mt-1">{value}</h2>
                    <p className="text-[10px] text-slate-500 font-medium italic">{sub}</p>
                </div>
            </div>
        </Card>
    );
}

function ExpenseItem({ label, amount, total, color, icon: Icon }) {
    const perc = total > 0 ? (amount / total) * 100 : 0;
    const colorClasses = {
        blue: "bg-blue-500",
        green: "bg-green-500",
    };
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-700">{label}</span>
                </div>
                <span className="font-bold text-slate-900">${amount.toLocaleString()} ({perc.toFixed(1)}%)</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={cn("h-full transition-all duration-1000", colorClasses[color])} style={{ width: `${perc}%` }} />
            </div>
        </div>
    );
}
