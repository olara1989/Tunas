import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, PackageSearch, ShoppingCart, CheckCircle, ArrowRight, Trash2, Printer, FileText, Search, Scale, Box, Calendar, LayoutGrid, Eye } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';
import {
    Card, Button, Input, Select, Modal, Textarea, RadioGroup,
    ErrorBanner, SuccessBanner, EmptyState, Spinner, SectionHeader, StatusBadge, cn,
    SearchableSelect, Checkbox
} from './ui';

/* ── Entradas (Recepciones de Lotes) ── */
export function EntradasSection({ productores, variedades }) {
    const { userData } = useAuth();
    const { data: entradas, loading, error, addNode, updateNode } = useFirestore('registro_entradas');
    const { data: detalles, addNode: addDetalle } = useFirestore('detalle_entradas');
    const [searchTerm, setSearchTerm] = useState('');
    const [entradaModal, setEntradaModal] = useState(false);
    const [viewing, setViewing] = useState(null); // Para ver detalles y mandar a imprimir

    const defaultModo = userData?.bodega_info?.tipo_produccion || 'Caja';

    // Form state for cumulative entry
    const [form, setForm] = useState({
        productor_id: '',
        fecha: new Date().toISOString().split('T')[0],
        folio: 1,
        items: []
    });

    // Temp state for adding items to the current entry form
    const [tempItem, setTempItem] = useState({
        variedad_id: '',
        modo: defaultModo,
        cantidad: '',
        cajas: '',
        precio_sugerido: ''
    });

    // Update defaultModo when userData changes
    useEffect(() => {
        if (userData?.bodega_info?.tipo_produccion) {
            setTempItem(prev => ({ ...prev, modo: userData.bodega_info.tipo_produccion }));
        }
    }, [userData]);

    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState('');

    // Progressive Folio Calculation
    useEffect(() => {
        if (entradaModal && !saving) {
            const lastFolio = entradas.reduce((max, e) => Math.max(max, Number(e.folio) || 0), 0);
            setForm(p => ({ ...p, folio: lastFolio + 1, items: [] }));
        }
    }, [entradaModal, entradas]);

    const handleAddItem = () => {
        if (!tempItem.variedad_id || !tempItem.cantidad) {
            setFormError('Completa los campos del lote antes de añadirlo.');
            return;
        }
        setForm(p => ({
            ...p,
            items: [...p.items, { ...tempItem, id: Date.now() }]
        }));
        setTempItem({
            variedad_id: '',
            modo: defaultModo,
            cantidad: '',
            cajas: '',
            precio_sugerido: ''
        });
        setFormError('');
    };

    const handleRemoveItem = (id) => {
        setForm(p => ({ ...p, items: p.items.filter(i => i.id !== id) }));
    };

    const handleSaveEntrada = async () => {
        if (!form.productor_id || form.items.length === 0) {
            setFormError('Debes seleccionar un productor y agregar al menos un lote.');
            return;
        }
        setSaving(true); setFormError('');
        try {
            // 1. Create the main entry
            const entryRef = await addNode({
                productor_id: form.productor_id,
                fecha: form.fecha,
                folio: form.folio,
                monto_total_productor: 0,
                status: 'pendiente'
            });

            // 2. Create the items (detalles)
            for (const item of form.items) {
                await addDetalle({
                    registro_entrada_id: entryRef.id,
                    variedad_id: item.variedad_id,
                    presentacion: item.modo,
                    cantidad_recibida: Number(item.cantidad),
                    cajas_fisicas: item.modo === 'Caja' ? Number(item.cantidad) : Number(item.cajas || 0),
                    precio_venta_sugerido: Number(item.precio_sugerido || 0),
                    tarima_no: form.folio, // Use folio as base for tarima numbering if needed, or keep it separate
                    cantidad_vendida: 0,
                    merma: 0,
                    status: 'almacenada',
                });
            }

            setEntradaModal(false);
            setSuccess(`Entrada #${form.folio} registrada exitosamente.`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) { setFormError(e); }
        finally { setSaving(false); }
    };

    const printEntry = (e, items) => {
        const prod = productores.find(p => p.id === e.productor_id);
        const printWindow = window.open('', '_blank');

        const totalUnidades = items.reduce((s, it) => s + Number(it.cantidad_recibida || 0), 0);
        const totalCajasFisicas = items.reduce((s, it) => s + (it.presentacion === 'Kilo' ? Number(it.cajas_fisicas || 0) : Number(it.cantidad_recibida || 0)), 0);

        const itemsHtml = items.map(d => `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">${variedades.find(v => v.id === d.variedad_id)?.nombre || 'N/A'}</td>
                <td style="padding: 10px; text-align: right;">${d.cantidad_recibida} ${d.presentacion === 'Caja' ? 'Cajas' : 'Kg'}</td>
                <td style="padding: 10px; text-align: right;">${d.presentacion === 'Kilo' ? (d.cajas_fisicas || 0) + ' Cajas' : (d.cantidad_recibida + ' Cajas')}</td>
                <td style="padding: 10px; text-align: right;">${d.status === 'completa' ? '<span style="color: #16a34a; font-weight: bold;">Liquidado</span>' : '<span style="color: #ca8a04;">Pendiente</span>'}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Liquidación de Entrada #${e.folio}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; line-height: 1.5; }
                        .header { border-bottom: 3px solid #16a34a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                        .title { color: #166534; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; }
                        .info { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; background: #f8fafc; padding: 20px; rounded-2xl; }
                        .label { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
                        .value { font-size: 16px; font-weight: 600; margin-top: 4px; color: #1e293b; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th { background: #16a34a; text-align: left; padding: 12px; color: white; font-size: 11px; text-transform: uppercase; }
                        .totals { border-top: 2px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: flex-end; }
                        .totals-box { background: #f1f5f9; padding: 15px 30px; border-radius: 12px; text-align: right; }
                        .footer { margin-top: 80px; display: grid; grid-template-cols: 1fr 1fr; gap: 60px; text-align: center; }
                        .signature-line { border-top: 1px solid #94a3b8; margin-top: 40px; padding-top: 10px; color: #64748b; font-size: 12px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1 class="title">Liquidación de Producto</h1>
                            <p style="margin: 4px 0 0 0; color: #16a34a; font-weight: bold; font-size: 18px;">Tunas La Huerta</p>
                        </div>
                        <div style="text-align: right;">
                            <span class="label">Folio del Lote</span>
                            <div class="value" style="font-size: 32px; color: #166534; line-height: 1;">#${e.folio}</div>
                        </div>
                    </div>
                    
                    <div class="info">
                        <div>
                            <span class="label">Productor</span>
                            <div class="value">${prod?.nombre || 'Desconocido'}</div>
                            <div style="margin-top: 10px;">
                                <span class="label">Estatus de Pago</span>
                                <div class="value" style="color: ${e.status === 'pagado' ? '#16a34a' : '#ca8a04'}">${e.status.toUpperCase()}</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <span class="label">Fecha de Recepción</span>
                            <div class="value">${e.fecha}</div>
                            <div style="margin-top: 10px;">
                                <span class="label">Fecha de Impresión</span>
                                <div class="value">${new Date().toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Variedad</th>
                                <th style="text-align: right;">Cantidad Recibida</th>
                                <th style="text-align: right;">Cajas Físicas / Empaque</th>
                                <th style="text-align: right;">Estado de Venta</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <div class="totals">
                        <div class="totals-box">
                            <span class="label">Resumen de Recepción</span>
                            <div style="margin-top: 10px;">
                                <p style="margin: 0; font-size: 14px;">Total Cajas Físicas: <strong>${totalCajasFisicas}</strong></p>
                                <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">El productor debe retirar sus cajas vacías en la brevedad posible.</p>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <div>
                            <div class="signature-line">Firma del Productor</div>
                        </div>
                        <div>
                            <div class="signature-line">Recibe Bodega (Sello)</div>
                        </div>
                    </div>

                    <div style="margin-top: 50px; text-align: center; color: #94a3b8; font-size: 10px;">
                        <p>Documento generado por el Sistema de Gestión Tunas La Huerta.</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const getDetalles = (entradaId) => detalles.filter(d => d.registro_entrada_id === entradaId);
    const getProductor = (id) => productores.find(p => p.id === id);

    const filteredEntradas = entradas.filter(e => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        const prod = getProductor(e.productor_id);
        return prod?.nombre?.toLowerCase().includes(s) ||
            e.folio?.toString().includes(s) ||
            e.fecha?.toLowerCase().includes(s);
    });

    return (
        <div className="space-y-4">
            <SectionHeader title="Entradas de Producto"
                action={
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Input
                            placeholder="Buscar folio o productor..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64"
                        />
                        <Button onClick={() => setEntradaModal(true)}>
                            <Plus className="w-4 h-4" /> Nueva Entrada
                        </Button>
                    </div>
                } />
            <ErrorBanner error={error} /><SuccessBanner message={success} />

            {loading ? <Spinner /> : filteredEntradas.length === 0 ? <EmptyState icon={PackageSearch} message={searchTerm ? "No se encontraron entradas" : "Sin entradas registradas"} /> : (
                <div className="space-y-3">
                    {[...filteredEntradas].sort((a, b) => b.folio - a.folio).map(e => {
                        const ds = getDetalles(e.id);
                        const prod = getProductor(e.productor_id);
                        return (
                            <Card key={e.id} className="hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center border border-green-100">
                                            <FileText className="text-green-600 w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded leading-none">FOLIO #{e.folio}</span>
                                                <p className="font-bold text-slate-900">{prod?.nombre || 'Productor eliminado'}</p>
                                                <StatusBadge status={e.status} />
                                            </div>
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" /> {e.fecha} · <LayoutGrid className="w-3.5 h-3.5" /> {ds.length} partidas
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {(ds.every(d => d.status === 'completa') || e.status === 'pagado') && (
                                            <Button variant="outline" className="text-xs h-9 px-3 border-green-600 text-green-700 hover:bg-green-50" onClick={() => printEntry(e, ds)}>
                                                <Printer className="w-3.5 h-3.5 mr-1" /> Liquidación
                                            </Button>
                                        )}
                                        <Button variant="secondary" className="text-xs h-9 px-3" onClick={() => setViewing({ entry: e, details: ds })}>
                                            <Eye className="w-3.5 h-3.5" /> Ver
                                        </Button>
                                        {e.status === 'pendiente' && (
                                            <Button variant="yellow" className="text-xs h-9 px-4 font-bold" onClick={() => updateNode(e.id, { status: 'pagado' })}>
                                                Liquidado
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modal nueva entrada con múltiples partidas */}
            <Modal open={entradaModal} onClose={() => setEntradaModal(false)} title={`Nueva Entrada · Folio #${form.folio}`} size="xl">
                <div className="space-y-6">
                    <ErrorBanner error={formError} />

                    {/* Header: Productor y Fecha */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <SearchableSelect
                            label="Seleccionar Productor"
                            options={productores.map(p => ({ value: p.id, label: p.nombre }))}
                            value={form.productor_id}
                            onChange={e => setForm(p => ({ ...p, productor_id: e.target.value }))}
                        />
                        <Input
                            label="Fecha de entrada"
                            type="date"
                            value={form.fecha}
                            onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
                        />
                    </div>

                    {/* Partidas Builder */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Scale className="w-4 h-4 text-green-500" /> Partidas de Mercancía
                            </h3>
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{form.items.length} añadidas</span>
                        </div>

                        {/* Items Table with Integrated Adder */}
                        <div className="border rounded-2xl overflow-hidden bg-white shadow-sm border-slate-200">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                                        <th className="px-4 py-3 text-left font-bold">Variedad</th>
                                        <th className="px-4 py-3 text-left font-bold w-32">Modo</th>
                                        <th className="px-4 py-3 text-right font-bold w-32">Cantidad</th>
                                        <th className="px-4 py-3 text-right font-bold w-32">Cajas Fís.</th>
                                        <th className="px-4 py-3 text-right font-bold w-32">Precio Ref.</th>
                                        <th className="px-4 py-3 text-center w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {/* Compact Adder Row */}
                                    <tr className="bg-green-50/30">
                                        <td className="px-2 py-2">
                                            <Select
                                                options={variedades.map(v => ({ value: v.id, label: v.nombre }))}
                                                value={tempItem.variedad_id}
                                                onChange={e => {
                                                    const v = variedades.find(x => x.id === e.target.value);
                                                    setTempItem(p => ({ ...p, variedad_id: e.target.value, precio_sugerido: v?.precio_compra || 0 }));
                                                }}
                                                className="border-none bg-transparent focus:ring-0"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <Select
                                                options={[{ value: 'Caja', label: 'Cajas' }, { value: 'Kilo', label: 'Kilos' }]}
                                                value={tempItem.modo}
                                                onChange={e => setTempItem(p => ({ ...p, modo: e.target.value }))}
                                                className="border-none bg-transparent focus:ring-0"
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-right">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={tempItem.cantidad}
                                                onChange={e => setTempItem(p => ({ ...p, cantidad: e.target.value }))}
                                                className="w-full text-right bg-transparent border-none focus:ring-0 text-sm font-semibold"
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-right">
                                            <input
                                                type="number"
                                                placeholder="Cjs"
                                                value={tempItem.cajas}
                                                onChange={e => setTempItem(p => ({ ...p, cajas: e.target.value }))}
                                                disabled={tempItem.modo === 'Caja'}
                                                className="w-full text-right bg-transparent border-none focus:ring-0 text-sm disabled:opacity-30"
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-right">
                                            <input
                                                type="number"
                                                placeholder="$0.00"
                                                value={tempItem.precio_sugerido}
                                                onChange={e => setTempItem(p => ({ ...p, precio_sugerido: e.target.value }))}
                                                className="w-full text-right bg-transparent border-none focus:ring-0 text-sm text-green-700 font-bold"
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <button onClick={handleAddItem} className="bg-green-600 hover:bg-green-700 text-white rounded-lg w-8 h-8 flex items-center justify-center shadow-sm transition-colors mx-auto">
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                    {form.items.length === 0 ? (
                                        <tr><td colSpan="6" className="py-10 text-center text-slate-400">Sin partidas agregadas aún</td></tr>
                                    ) : (
                                        form.items.map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 font-medium text-slate-800">{variedades.find(v => v.id === item.variedad_id)?.nombre}</td>
                                                <td className="px-4 py-3 text-left">{item.modo}</td>
                                                <td className="px-4 py-3 text-right">{item.cantidad} <span className="text-[10px] font-bold text-slate-400">{item.modo === 'Caja' ? 'CJ' : 'KG'}</span></td>
                                                <td className="px-4 py-3 text-right">{item.modo === 'Caja' ? item.cantidad : (item.cajas || 0)}</td>
                                                <td className="px-4 py-3 text-right text-green-600 font-bold">${Number(item.precio_sugerido).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                            <Button variant="secondary" onClick={() => setEntradaModal(false)}>Cancelar</Button>
                            <Button loading={saving} onClick={handleSaveEntrada} className="px-10 h-12 text-base shadow-lg shadow-green-100">
                                <Box className="w-5 h-5 mr-2" /> Unificar y Guardar Entrada
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Modal Vista de Detalle (Eye Icon) */}
            <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Detalle de Entrada #${viewing?.entry.folio}`} size="xl">
                {viewing && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Productor</p>
                                <p className="text-xl font-bold text-slate-900">{getProductor(viewing.entry.productor_id)?.nombre || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fecha</p>
                                <p className="text-lg font-semibold text-slate-800">{viewing.entry.fecha}</p>
                            </div>
                        </div>

                        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Variedad</th>
                                        <th className="px-4 py-3 text-right">Cant. Recibida</th>
                                        <th className="px-4 py-3 text-right">Cajas Físicas</th>
                                        <th className="px-4 py-3 text-right">Estatus</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {viewing.details.map(d => (
                                        <tr key={d.id}>
                                            <td className="px-4 py-3 font-medium">{variedades.find(v => v.id === d.variedad_id)?.nombre}</td>
                                            <td className="px-4 py-3 text-right">{d.cantidad_recibida} <span className="text-[10px] text-slate-400">{d.presentacion}</span></td>
                                            <td className="px-4 py-3 text-right">{d.cajas_fisicas || d.cantidad_recibida}</td>
                                            <td className="px-4 py-3 text-right"><StatusBadge status={d.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3">
                            {(viewing.details.every(d => d.status === 'completa') || viewing.entry.status === 'pagado') && (
                                <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50" onClick={() => printEntry(viewing.entry, viewing.details)}>
                                    <Printer className="w-4 h-4 mr-2" /> Imprimir Liquidación
                                </Button>
                            )}
                            <Button onClick={() => setViewing(null)}>Cerrar</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}


/* ── Registra Barrida/Venta (Carrito de Salida) ── */
export function ConsolidadorSection({ clientes, variedades }) {
    const { userData } = useAuth();
    const { data: detalles, updateNode: updateDetalle } = useFirestore('detalle_entradas');
    const { data: entradas } = useFirestore('registro_entradas');
    const { addNode: addSalida } = useFirestore('registro_salidas');
    const { addNode: addDetalleSalida } = useFirestore('detalle_salidas');

    const defaultModo = userData?.bodega_info?.tipo_produccion || 'Caja';

    const { data: vNodes, updateNode: updateVariety } = useFirestore('variedades');
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('tunas_sale_cart');
        return saved ? JSON.parse(saved) : [];
    });
    const [clienteId, setClienteId] = useState(() => localStorage.getItem('tunas_sale_cliente') || '');
    const [fecha, setFecha] = useState(() => localStorage.getItem('tunas_sale_fecha') || new Date().toISOString().split('T')[0]);
    const [saleContext, setSaleContext] = useState(() => {
        const saved = localStorage.getItem('tunas_sale_context');
        return saved ? JSON.parse(saved) : null;
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // New Sale Setup States
    const [setupModal, setSetupModal] = useState(false);
    const [setupForm, setSetupForm] = useState({ cliente_id: '', varieties: [] });
    const [currentVariety, setCurrentVariety] = useState({ presentacion: defaultModo });

    // Update defaultModo when userData changes
    useEffect(() => {
        if (userData?.bodega_info?.tipo_produccion) {
            setCurrentVariety(prev => ({ ...prev, presentacion: userData.bodega_info.tipo_produccion }));
        }
    }, [userData]);

    const [updateConfirm, setUpdateConfirm] = useState(null); // { changes: [{vId, changes:[]}] }

    // Persist session to localStorage
    useEffect(() => {
        localStorage.setItem('tunas_sale_cart', JSON.stringify(cart));
        localStorage.setItem('tunas_sale_cliente', clienteId);
        localStorage.setItem('tunas_sale_fecha', fecha);
        localStorage.setItem('tunas_sale_context', JSON.stringify(saleContext));
    }, [cart, clienteId, fecha, saleContext]);

    const clearSession = () => {
        setCart([]);
        setClienteId('');
        setSaleContext(null);
        localStorage.removeItem('tunas_sale_cart');
        localStorage.removeItem('tunas_sale_cliente');
        localStorage.removeItem('tunas_sale_fecha');
        localStorage.removeItem('tunas_sale_context');
    };



    // Only show disponibles (almacenada or en_proceso) with boxes still available
    // AND filtered by selected varieties if saleContext exists
    // AND excluding lots from paid entries (liquidados)
    const disponibles = useMemo(() =>
        detalles.filter(d => {
            // Filter by selected varieties
            const matchesVariety = !saleContext || saleContext.varieties.some(v => v.variedad_id === d.variedad_id);
            
            // Check if the parent entry is already paid (liquidado)
            const parentEntry = entradas.find(e => e.id === d.registro_entrada_id);
            const isLiquidado = parentEntry?.status === 'pagado';

            const disponible = d.cantidad_recibida - (d.cantidad_vendida || 0) - (d.merma || 0);

            // Filter by search term
            const searchStr = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                d.tarima_no?.toString().includes(searchStr) ||
                variedades.find(v => v.id === d.variedad_id)?.nombre?.toLowerCase().includes(searchStr);

            return !isLiquidado && (d.status === 'almacenada' || d.status === 'en_proceso') && disponible > 0 && matchesVariety && matchesSearch;
        }),
        [detalles, entradas, saleContext, searchTerm, variedades]
    );

    const inCart = (id) => cart.find(c => c.detalle.id === id);

    const addToCart = (det) => {
        if (inCart(det.id)) return;
        const config = saleContext?.varieties.find(v => v.variedad_id === det.variedad_id);
        setCart(p => [...p, {
            detalle: det,
            cantidad: det.cantidad_recibida - det.cantidad_vendida - det.merma,
            precio_dia: config?.precio_venta || det.precio_venta_sugerido || 0,
            terminarLote: false
        }]);
    };

    const removeFromCart = (id) => setCart(p => p.filter(c => c.detalle.id !== id));

    const updateCartItem = (id, field, val) => setCart(p => p.map(c => c.detalle.id === id ? { ...c, [field]: field === 'terminarLote' ? val : Number(val) } : c));

    const total = useMemo(() => cart.reduce((s, c) => s + (c.cantidad * c.precio_dia), 0), [cart]);

    const handleStartSetup = () => {
        clearSession();
        setSetupForm({ cliente_id: '', varieties: [] });
        setCurrentVariety({
            variedad_id: variedades[0]?.id || '',
            precio_venta: variedades[0]?.precio_venta || 0,
            precio_compra: variedades[0]?.precio_compra || 0,
            presentacion: defaultModo,
            kilos_por_caja: 0
        });
        setSetupModal(true);
    };

    const addVarietyToSetup = () => {
        if (!currentVariety.variedad_id) return;
        
        // Evitar duplicados
        if (setupForm.varieties.some(v => v.variedad_id === currentVariety.variedad_id)) {
            setError('Esta variedad ya ha sido añadida.');
            return;
        }

        setSetupForm(p => ({
            ...p,
            varieties: [...p.varieties, { ...currentVariety, id: Date.now() }]
        }));
        
        // Reset temp variety with defaults but keeping presentation
        setCurrentVariety(prev => ({
            ...prev,
            variedad_id: '',
            precio_venta: 0,
            precio_compra: 0,
            kilos_por_caja: 25
        }));
        setError('');
    };

    const removeVarietyFromSetup = (id) => {
        setSetupForm(p => ({
            ...p,
            varieties: p.varieties.filter(v => v.id !== id)
        }));
    };

    const handleConfirmSetup = async () => {
        if (!setupForm.cliente_id || setupForm.varieties.length === 0) {
            setError('Cliente y al menos una variedad son requeridos.'); return;
        }

        // Check for price changes across all added varieties
        const changes = [];
        for (const sv of setupForm.varieties) {
            const baseV = variedades.find(x => x.id === sv.variedad_id);
            const vChanges = [];
            if (Number(sv.precio_venta) !== Number(baseV.precio_venta)) vChanges.push('venta');
            if (Number(sv.precio_compra) !== Number(baseV.precio_compra)) vChanges.push('compra');

            if (vChanges.length > 0) {
                changes.push({ variedad_id: sv.variedad_id, nombre: baseV.nombre, changes: vChanges, sv });
            }
        }

        if (changes.length > 0) {
            setUpdateConfirm({ changes, setup: setupForm });
        } else {
            finalizeSetup(setupForm);
        }
    };

    const finalizeSetup = (data) => {
        setSaleContext(data);
        setClienteId(data.cliente_id);
        setSetupModal(false);
        setUpdateConfirm(null);
    };

    const handleUpdateVarietiesAndStart = async (update) => {
        if (update) {
            for (const item of updateConfirm.changes) {
                const updates = {};
                if (item.changes.includes('venta')) updates.precio_venta = Number(item.sv.precio_venta);
                if (item.changes.includes('compra')) updates.precio_compra = Number(item.sv.precio_compra);
                await updateVariety(item.variedad_id, updates);
            }
        }
        finalizeSetup(updateConfirm.setup);
    };

    const handleRegistrarSalida = async () => {
        if (!clienteId) { setError('Selecciona un cliente.'); return; }
        if (cart.length === 0) { setError('Agrega al menos un lote al carrito.'); return; }
        setSaving(true); setError('');
        try {
            // Create registro_salida (include context details)
            // Note: Now we might have multiple varieties, so we store general context
            const salidaRef = await addSalida({
                cliente_id: clienteId,
                fecha,
                monto_total: total,
                varieties_config: saleContext.varieties
            });
            const salidaId = salidaRef.id;

            for (const item of cart) {
                await addDetalleSalida({
                    registro_salida_id: salidaId,
                    detalle_entrada_id: item.detalle.id,
                    cantidad_vendida: item.cantidad,
                    precio_dia: item.precio_dia,
                });
                const newVendido = item.detalle.cantidad_vendida + item.cantidad;
                const disponible = item.detalle.cantidad_recibida - newVendido - item.detalle.merma;
                await updateDetalle(item.detalle.id, {
                    cantidad_vendida: newVendido,
                    status: (item.terminarLote || disponible <= 0) ? 'completa' : 'en_proceso',
                });
            }

            clearSession();
            setSuccess('¡Salida registrada exitosamente!');
            setTimeout(() => setSuccess(''), 4000);
        } catch (e) { setError(e); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-4">
            <SectionHeader title="Registra Barrida/Venta"
                action={!saleContext && <Button onClick={handleStartSetup}><ShoppingCart className="w-4 h-4" /> Iniciar Venta</Button>} />
            <ErrorBanner error={error} /><SuccessBanner message={success} />

            {!saleContext ? (
                <EmptyState icon={ShoppingCart} message="Haz clic en 'Iniciar Venta' para configurar la operación" />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: available lotes */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-slate-600">Lotes disponibles ({disponibles.length})</p>
                            <Input
                                placeholder="Filtrar lotes..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-48 h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                            {disponibles.length === 0 && <EmptyState icon={PackageSearch} message="No hay lotes disponibles" />}
                            {disponibles.map(d => {
                                const variedad = variedades.find(v => v.id === d.variedad_id);
                                const disponible = d.cantidad_recibida - d.cantidad_vendida - d.merma;
                                const already = !!inCart(d.id);
                                return (
                                    <div key={d.id} className={cn(
                                        "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                                        already ? "bg-green-50 border-green-200 opacity-60" : "bg-white border-slate-200 hover:border-green-300 hover:bg-green-50"
                                    )} onClick={() => !already && addToCart(d)}>
                                        <div>
                                            <p className="font-mono text-sm font-semibold text-slate-800">Lote #{d.tarima_no}</p>
                                            <p className="text-xs text-slate-500">{variedad?.nombre} · {d.presentacion}</p>
                                            <p className="text-xs text-slate-400">Disponible: <strong>{disponible} cajas</strong></p>
                                        </div>
                                        {already
                                            ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            : <ArrowRight className="w-5 h-5 text-slate-300 flex-shrink-0" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: cart */}
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3">
                            <Select label="Cliente" className="flex-1" options={clientes.map(c => ({ value: c.id, label: c.nombre }))} value={clienteId} disabled />
                            <Input label="Fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
                        </div>

                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-semibold text-slate-600">Carrito ({cart.length})</p>
                            {cart.length === 0 && <p className="text-sm text-slate-400 py-6 text-center border-2 border-dashed border-slate-200 rounded-xl">Selecciona lotes de la izquierda</p>}
                            {cart.map(item => (
                                <div key={item.detalle.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono text-sm font-semibold">Lote #{item.detalle.tarima_no}</span>
                                        <button onClick={() => removeFromCart(item.detalle.id)} className="text-red-400 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input label="Cajas a vender" type="number" value={item.cantidad} onChange={e => updateCartItem(item.detalle.id, 'cantidad', e.target.value)} />
                                        <Input label="Precio del día ($)" type="number" value={item.precio_dia} onChange={e => updateCartItem(item.detalle.id, 'precio_dia', e.target.value)} />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Checkbox 
                                                checked={item.terminarLote} 
                                                onChange={checked => updateCartItem(item.detalle.id, 'terminarLote', checked)} 
                                            />
                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Cerrar este lote (Barrida)</span>
                                        </div>
                                        <p className="text-right text-sm font-semibold text-green-700">
                                            Subtotal: ${(item.cantidad * item.precio_dia).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {cart.length > 0 && (
                            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-green-800">Total</span>
                                    <span className="text-2xl font-bold text-green-700">${total.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="secondary" className="flex-1" onClick={clearSession}>Cancelar Proceso</Button>
                            <Button loading={saving} onClick={handleRegistrarSalida} className="flex-[2] py-3">
                                <ShoppingCart className="w-5 h-5" /> Registrar Salida
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Configuración de Venta */}
            <Modal open={setupModal} onClose={() => setSetupModal(false)} title="Configurar venta / barrida nueva" size="xl">
                <div className="space-y-6">
                    <ErrorBanner error={error} />
                    
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <SearchableSelect 
                            label="Seleccionar Cliente" 
                            options={clientes.map(c => ({ value: c.id, label: c.nombre }))} 
                            value={setupForm.cliente_id || ''} 
                            onChange={e => setSetupForm(p => ({ ...p, cliente_id: e.target.value }))} 
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Scale className="w-4 h-4 text-green-500" /> Variedades en esta operación
                            </h3>
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{setupForm.varieties.length} añadidas</span>
                        </div>

                        <div className="border rounded-2xl overflow-hidden bg-white shadow-sm border-slate-200">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                                        <th className="px-4 py-3 text-left font-bold">Variedad</th>
                                        <th className="px-4 py-3 text-right font-bold w-32">P. Venta ($)</th>
                                        <th className="px-4 py-3 text-right font-bold w-32">P. Compra ($)</th>
                                        <th className="px-4 py-3 text-left font-bold w-32">Modo</th>
                                        <th className="px-4 py-3 text-right font-bold w-32">Kg/Caja</th>
                                        <th className="px-4 py-3 text-center w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {/* Adder Row */}
                                    <tr className="bg-green-50/30">
                                        <td className="px-2 py-2">
                                            <Select
                                                options={variedades.map(v => ({ value: v.id, label: v.nombre }))}
                                                value={currentVariety.variedad_id}
                                                onChange={e => {
                                                    const v = variedades.find(x => x.id === e.target.value);
                                                    setCurrentVariety(p => ({ 
                                                        ...p, 
                                                        variedad_id: e.target.value, 
                                                        precio_venta: v?.precio_venta || 0,
                                                        precio_compra: v?.precio_compra || 0,
                                                        presentacion: v?.presentacion_default || defaultModo
                                                    }));
                                                }}
                                                className="border-none bg-transparent focus:ring-0"
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-right">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={currentVariety.precio_venta}
                                                onChange={e => setCurrentVariety(p => ({ ...p, precio_venta: e.target.value }))}
                                                className="w-full text-right bg-transparent border-none focus:ring-0 text-sm font-semibold text-green-700"
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-right">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={currentVariety.precio_compra}
                                                onChange={e => setCurrentVariety(p => ({ ...p, precio_compra: e.target.value }))}
                                                className="w-full text-right bg-transparent border-none focus:ring-0 text-sm font-semibold text-orange-600"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <Select
                                                options={[{ value: 'Caja', label: 'Cajas' }, { value: 'Kilo', label: 'Kilos' }]}
                                                value={currentVariety.presentacion}
                                                onChange={e => setCurrentVariety(p => ({ ...p, presentacion: e.target.value }))}
                                                className="border-none bg-transparent focus:ring-0"
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-right">
                                            <input
                                                type="number"
                                                placeholder="Kg"
                                                value={currentVariety.kilos_por_caja}
                                                disabled={currentVariety.presentacion !== 'Caja'}
                                                onChange={e => setCurrentVariety(p => ({ ...p, kilos_por_caja: e.target.value }))}
                                                className="w-full text-right bg-transparent border-none focus:ring-0 text-sm disabled:opacity-30"
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <button onClick={addVarietyToSetup} className="bg-green-600 hover:bg-green-700 text-white rounded-lg w-8 h-8 flex items-center justify-center shadow-sm transition-colors mx-auto">
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>

                                    {setupForm.varieties.length === 0 ? (
                                        <tr><td colSpan="6" className="py-10 text-center text-slate-400">Ninguna variedad añadida a esta operación</td></tr>
                                    ) : (
                                        setupForm.varieties.map(sv => {
                                            const v = variedades.find(x => x.id === sv.variedad_id);
                                            return (
                                                <tr key={sv.id} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-medium text-slate-800">{v?.nombre}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-green-700">${Number(sv.precio_venta).toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-orange-600">${Number(sv.precio_compra).toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-left">{sv.presentacion}</td>
                                                    <td className="px-4 py-3 text-right">{sv.presentacion === 'Caja' ? sv.kilos_por_caja : '–'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button onClick={() => removeVarietyFromSetup(sv.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 bg-white">
                        <Button variant="secondary" onClick={() => setSetupModal(false)}>Cancelar</Button>
                        <Button
                            loading={saving}
                            onClick={handleConfirmSetup}
                            disabled={setupForm.varieties.length === 0}
                            className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
                        >
                            Iniciar Proceso
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Alerta de cambio de precios */}
            <Modal open={!!updateConfirm} onClose={() => setUpdateConfirm(null)} title="¿Actualizar Precios Base?">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Has modificado los precios de algunas variedades. ¿Deseas guardar estos nuevos precios como predeterminados?
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {updateConfirm?.changes.map(item => (
                            <div key={item.variedad_id} className="text-sm bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <p className="font-bold">{item.nombre}</p>
                                {item.changes.includes('venta') && <p className="text-xs text-slate-500">• Nueva Venta: ${item.sv.precio_venta}</p>}
                                {item.changes.includes('compra') && <p className="text-xs text-slate-500">• Nueva Compra: ${item.sv.precio_compra}</p>}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => handleUpdateVarietiesAndStart(false)}>No, solo para esta venta</Button>
                        <Button onClick={() => handleUpdateVarietiesAndStart(true)}>Sí, actualizar y continuar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

/* ── Historial de Salidas ── */
export function SalidasSection({ clientes }) {
    const { data: salidas, loading, error } = useFirestore('registro_salidas');
    const { data: detalleSalidas } = useFirestore('detalle_salidas');
    const { data: detalleEntradas } = useFirestore('detalle_entradas');
    const [searchTerm, setSearchTerm] = useState('');

    const getCliente = (id) => clientes.find(c => c.id === id);
    const getDetalles = (salidaId) => detalleSalidas.filter(d => d.registro_salida_id === salidaId);

    const filteredSalidas = salidas.filter(s => {
        if (!searchTerm) return true;
        const sStr = searchTerm.toLowerCase();
        const cliente = getCliente(s.cliente_id);
        return cliente?.nombre?.toLowerCase().includes(sStr) ||
            s.fecha?.toLowerCase().includes(sStr);
    });

    return (
        <div className="space-y-4 mt-6">
            <SectionHeader title="Historial de Salidas"
                action={
                    <Input
                        placeholder="Buscar cliente o fecha..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64"
                    />
                }
            />
            <ErrorBanner error={error} />
            {loading ? <Spinner /> : filteredSalidas.length === 0 ? <EmptyState icon={ShoppingCart} message={searchTerm ? "Sin resultados" : "Sin salidas registradas"} /> : (
                <div className="space-y-3">
                    {[...filteredSalidas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(s => {
                        const cliente = getCliente(s.cliente_id);
                        const ds = getDetalles(s.id);
                        return (
                            <Card key={s.id}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-slate-900">{cliente?.nombre || 'Cliente eliminado'}</p>
                                        <p className="text-sm text-slate-500">📅 {s.fecha} · {ds.length} partida(s)</p>
                                    </div>
                                    <p className="text-xl font-bold text-green-700">${(s.monto_total || 0).toFixed(2)}</p>
                                </div>
                                {ds.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 overflow-x-auto">
                                        <table className="w-full text-sm min-w-[400px]">
                                            <thead>
                                                <tr className="text-xs text-slate-400 uppercase">
                                                    <th className="text-left pb-2">Lote</th>
                                                    <th className="text-right pb-2">Cantidad</th>
                                                    <th className="text-right pb-2">Precio/caja</th>
                                                    <th className="text-right pb-2">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {ds.map(d => {
                                                    const det = detalleEntradas.find(e => e.id === d.detalle_entrada_id);
                                                    return (
                                                        <tr key={d.id}>
                                                            <td className="py-1.5 font-mono text-slate-600">#{det?.tarima_no || '–'}</td>
                                                            <td className="py-1.5 text-right">{d.cantidad_vendida}</td>
                                                            <td className="py-1.5 text-right">${d.precio_dia}</td>
                                                            <td className="py-1.5 text-right font-semibold text-green-700">${(d.cantidad_vendida * d.precio_dia).toFixed(2)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
