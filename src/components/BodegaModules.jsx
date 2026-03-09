import React, { useState, useMemo } from 'react';
import { Plus, PackageSearch, ShoppingCart, CheckCircle, ArrowRight, Trash2 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import {
    Card, Button, Input, Select, Modal, Textarea, RadioGroup,
    ErrorBanner, SuccessBanner, EmptyState, Spinner, SectionHeader, StatusBadge, cn
} from './ui';

/* ── Entradas (Recepciones de Lotes) ── */
export function EntradasSection({ productores, variedades }) {
    const { data: entradas, loading, error, addNode, updateNode } = useFirestore('registro_entradas');
    const { data: detalles, addNode: addDetalle } = useFirestore('detalle_entradas');
    const [entradaModal, setEntradaModal] = useState(false);
    const [loteModal, setLoteModal] = useState(null); // entradaId
    const [form, setForm] = useState({});
    const [lForm, setLForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSaveEntrada = async () => {
        if (!form.productor_id || !form.fecha) { setFormError('Productor y fecha son requeridos.'); return; }
        setSaving(true); setFormError('');
        try {
            await addNode({ ...form, monto_total_productor: 0, status: 'pendiente' });
            setEntradaModal(false); setSuccess('Entrada registrada.'); setTimeout(() => setSuccess(''), 3000);
        } catch (e) { setFormError(e.message); }
        finally { setSaving(false); }
    };

    const handleSaveLote = async () => {
        if (!lForm.variedad_id || !lForm.cantidad_recibida) {
            setFormError('Variedad y cantidad son requeridos.'); return;
        }
        setSaving(true); setFormError('');
        try {
            const lastLote = detalles.reduce((max, d) => Math.max(max, Number(d.tarima_no) || 0), 0);
            await addDetalle({
                registro_entrada_id: loteModal,
                ...lForm,
                tarima_no: lastLote + 1,
                cantidad_vendida: 0,
                merma: 0,
                status: 'almacenada',
            });
            setLoteModal(null); setSuccess('Lote registrado.'); setTimeout(() => setSuccess(''), 3000);
        } catch (e) { setFormError(e.message); }
        finally { setSaving(false); }
    };

    const getDetalles = (entradaId) => detalles.filter(d => d.registro_entrada_id === entradaId);
    const getProductor = (id) => productores.find(p => p.id === id);

    return (
        <div className="space-y-4">
            <SectionHeader title="Entradas de Producto"
                action={<Button onClick={() => { setForm({ fecha: new Date().toISOString().split('T')[0] }); setFormError(''); setEntradaModal(true); }}>
                    <Plus className="w-4 h-4" /> Nueva Entrada
                </Button>} />
            <ErrorBanner error={error} /><SuccessBanner message={success} />
            {loading ? <Spinner /> : entradas.length === 0 ? <EmptyState icon={PackageSearch} message="Sin entradas registradas" /> : (
                <div className="space-y-3">
                    {[...entradas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(e => {
                        const ds = getDetalles(e.id);
                        const prod = getProductor(e.productor_id);
                        return (
                            <Card key={e.id}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-semibold text-slate-900">{prod?.nombre || 'Productor eliminado'}</p>
                                            <StatusBadge status={e.status} />
                                        </div>
                                        <p className="text-sm text-slate-500">📅 {e.fecha} · {ds.length} lote(s)</p>
                                        <p className="text-sm text-slate-500">Monto productor: <span className="font-semibold text-green-700">${(e.monto_total_productor || 0).toFixed(2)}</span></p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="text-sm" onClick={() => {
                                            const v0 = variedades[0];
                                            setLForm({
                                                presentacion: v0?.presentacion_default || '',
                                                variedad_id: v0?.id || '',
                                                precio_venta_sugerido: v0?.precio_compra || 0
                                            });
                                            setFormError('');
                                            setLoteModal(e.id);
                                        }}>
                                            <Plus className="w-4 h-4" /> Lote
                                        </Button>
                                        {e.status === 'pendiente' && (
                                            <Button variant="yellow" className="text-sm" onClick={() => updateNode(e.id, { status: 'pagado' })}>
                                                ✓ Liquidar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {ds.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 overflow-x-auto">
                                        <table className="w-full text-sm min-w-[500px]">
                                            <thead>
                                                <tr className="text-xs text-slate-400 uppercase">
                                                    <th className="text-left pb-2">Lote #</th>
                                                    <th className="text-left pb-2">Variedad</th>
                                                    <th className="text-right pb-2">Recibido</th>
                                                    <th className="text-right pb-2">Vendido</th>
                                                    <th className="text-right pb-2">Merma</th>
                                                    <th className="text-left pb-2">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {ds.map(d => (
                                                    <tr key={d.id}>
                                                        <td className="py-1.5 font-mono text-slate-700">{d.tarima_no}</td>
                                                        <td className="py-1.5 text-slate-600">{variedades.find(v => v.id === d.variedad_id)?.nombre}</td>
                                                        <td className="py-1.5 text-right text-slate-700">{d.cantidad_recibida}</td>
                                                        <td className="py-1.5 text-right text-green-600">{d.cantidad_vendida}</td>
                                                        <td className="py-1.5 text-right text-orange-500">{d.merma}</td>
                                                        <td className="py-1.5"><StatusBadge status={d.status} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modal nueva entrada */}
            <Modal open={entradaModal} onClose={() => setEntradaModal(false)} title="Nueva Entrada de Producto">
                <div className="space-y-4">
                    <ErrorBanner error={formError} />
                    <Select label="Productor" options={productores.map(p => ({ value: p.id, label: p.nombre }))} value={form.productor_id || ''} onChange={e => setForm(p => ({ ...p, productor_id: e.target.value }))} />
                    <Input label="Fecha de recepción" type="date" value={form.fecha || ''} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setEntradaModal(false)}>Cancelar</Button>
                        <Button loading={saving} onClick={handleSaveEntrada}>Registrar Entrada</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal nuevo lote */}
            <Modal open={!!loteModal} onClose={() => setLoteModal(null)} title="Agregar Lote">
                <div className="space-y-4">
                    <ErrorBanner error={formError} />
                    <Select
                        label="Variedad"
                        options={variedades.map(v => ({ value: v.id, label: v.nombre }))}
                        value={lForm.variedad_id || ''}
                        onChange={e => {
                            const vId = e.target.value;
                            const v = variedades.find(x => x.id === vId);
                            setLForm(p => ({ ...p, variedad_id: vId, precio_venta_sugerido: v?.precio_compra || 0 }));
                        }}
                    />
                    <Input label="Cantidad recibida (cajas)" type="number" value={lForm.cantidad_recibida || ''} onChange={e => setLForm(p => ({ ...p, cantidad_recibida: Number(e.target.value) }))} />
                    <RadioGroup
                        label="Presentación"
                        options={[
                            { value: 'Caja', label: 'Caja', icon: '📦' },
                            { value: 'Kilo', label: 'Kilo', icon: '⚖️' }
                        ]}
                        value={lForm.presentacion || ''}
                        onChange={val => setLForm(p => ({ ...p, presentacion: val }))}
                    />
                    <Input label="Precio sugerido de venta ($)" type="number" value={lForm.precio_venta_sugerido || ''} onChange={e => setLForm(p => ({ ...p, precio_venta_sugerido: Number(e.target.value) }))} />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setLoteModal(null)}>Cancelar</Button>
                        <Button loading={saving} onClick={handleSaveLote}>Agregar Lote</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

/* ── Registra Barrida/Venta (Carrito de Salida) ── */
export function ConsolidadorSection({ clientes, variedades }) {
    const { data: detalles, updateNode: updateDetalle } = useFirestore('detalle_entradas');
    const { data: entradas } = useFirestore('registro_entradas');
    const { addNode: addSalida } = useFirestore('registro_salidas');
    const { addNode: addDetalleSalida } = useFirestore('detalle_salidas');

    const [cart, setCart] = useState([]); // Array of {detalleEntrada, cantidad, precio_dia}
    const [clienteId, setClienteId] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Only show disponibles (almacenada or en_proceso)
    const disponibles = useMemo(() =>
        detalles.filter(d => d.status === 'almacenada' || d.status === 'en_proceso'),
        [detalles]
    );

    const inCart = (id) => cart.find(c => c.detalle.id === id);

    const addToCart = (det) => {
        if (inCart(det.id)) return;
        const variedad = variedades.find(v => v.id === det.variedad_id);
        setCart(p => [...p, { detalle: det, cantidad: det.cantidad_recibida - det.cantidad_vendida - det.merma, precio_dia: det.precio_venta_sugerido || variedad?.precio_venta || 0 }]);
    };

    const removeFromCart = (id) => setCart(p => p.filter(c => c.detalle.id !== id));

    const updateCartItem = (id, field, val) => setCart(p => p.map(c => c.detalle.id === id ? { ...c, [field]: Number(val) } : c));

    const total = useMemo(() => cart.reduce((s, c) => s + (c.cantidad * c.precio_dia), 0), [cart]);

    const handleRegistrarSalida = async () => {
        if (!clienteId) { setError('Selecciona un cliente.'); return; }
        if (cart.length === 0) { setError('Agrega al menos un lote al carrito.'); return; }
        setSaving(true); setError('');
        try {
            // Create registro_salida
            const salidaRef = await addSalida({ cliente_id: clienteId, fecha, monto_total: total, presentacion: '' });
            const salidaId = salidaRef.id;

            // For each cart item: create detalle_salida, update detalle_entrada
            for (const item of cart) {
                await addDetalleSalida({
                    registro_salida_id: salidaId,
                    detalle_entrada_id: item.detalle.id,
                    cantidad_vendida: item.cantidad,
                    precio_dia: item.precio_dia,
                });
                // Update lote
                const newVendido = item.detalle.cantidad_vendida + item.cantidad;
                const disponible = item.detalle.cantidad_recibida - newVendido - item.detalle.merma;
                await updateDetalle(item.detalle.id, {
                    cantidad_vendida: newVendido,
                    status: disponible <= 0 ? 'en_proceso' : 'en_proceso',
                });
                // Recalculate monto_total_productor on parent entrada
                // (done in real usage by querying all detalle_salidas for that entrada's lotes)
            }

            setCart([]); setClienteId(''); setSuccess('¡Salida registrada exitosamente!');
            setTimeout(() => setSuccess(''), 4000);
        } catch (e) { setError(e.message); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-4">
            <SectionHeader title="Registra Barrida/Venta" />
            <ErrorBanner error={error} /><SuccessBanner message={success} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: available lotes */}
                <div>
                    <p className="text-sm font-semibold text-slate-600 mb-3">Lotes disponibles ({disponibles.length})</p>
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
                        <Select label="Cliente" className="flex-1" options={clientes.map(c => ({ value: c.id, label: c.nombre }))} value={clienteId} onChange={e => setClienteId(e.target.value)} />
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
                                <p className="text-right text-sm font-semibold text-green-700 mt-1">
                                    Subtotal: ${(item.cantidad * item.precio_dia).toFixed(2)}
                                </p>
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

                    <Button loading={saving} onClick={handleRegistrarSalida} className="w-full py-3">
                        <ShoppingCart className="w-5 h-5" /> Registrar Salida
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ── Historial de Salidas ── */
export function SalidasSection({ clientes }) {
    const { data: salidas, loading, error } = useFirestore('registro_salidas');
    const { data: detalleSalidas } = useFirestore('detalle_salidas');
    const { data: detalleEntradas } = useFirestore('detalle_entradas');

    const getCliente = (id) => clientes.find(c => c.id === id);
    const getDetalles = (salidaId) => detalleSalidas.filter(d => d.registro_salida_id === salidaId);

    return (
        <div className="space-y-4 mt-6">
            <SectionHeader title="Historial de Salidas" />
            <ErrorBanner error={error} />
            {loading ? <Spinner /> : salidas.length === 0 ? <EmptyState icon={ShoppingCart} message="Sin salidas registradas" /> : (
                <div className="space-y-3">
                    {[...salidas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(s => {
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
