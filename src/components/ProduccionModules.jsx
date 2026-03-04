import React, { useState, useMemo } from 'react';
import { Plus, Tractor, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import {
    Card, Button, Input, Select, Modal, Textarea,
    ErrorBanner, SuccessBanner, EmptyState, Spinner, SectionHeader, StatusBadge, cn
} from './ui';

/* Huertas section */
export function HuertasSection({ variedades }) {
    const { data: huertas, loading, error, addNode, updateNode, deleteNode } = useFirestore('huertas');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ nombre: '', superficie: '', ubicacion: '', fecha_plantacion: '', variedades_ids: [] });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState('');

    const openAdd = () => { setEditing(null); setForm({ nombre: '', superficie: '', ubicacion: '', fecha_plantacion: '', variedades_ids: [] }); setModalOpen(true); };
    const openEdit = (h) => { setEditing(h); setForm({ ...h, variedades_ids: h.variedades_ids || [] }); setModalOpen(true); };

    const toggleVariedad = (id) => setForm(p => ({
        ...p,
        variedades_ids: p.variedades_ids.includes(id) ? p.variedades_ids.filter(v => v !== id) : [...p.variedades_ids, id]
    }));

    const handleSave = async () => {
        if (!form.nombre) { setFormError('El nombre es requerido.'); return; }
        setSaving(true); setFormError('');
        try {
            if (editing) await updateNode(editing.id, form);
            else await addNode(form);
            setModalOpen(false); setSuccess('Guardado.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) { setFormError(e.message); }
        finally { setSaving(false); }
    };

    const getVariedadNombres = (ids = []) =>
        ids.map(id => variedades.find(v => v.id === id)?.nombre).filter(Boolean).join(', ');

    return (
        <div className="space-y-4">
            <SectionHeader title="Huertas" action={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Nueva Huerta</Button>} />
            <ErrorBanner error={error} /><SuccessBanner message={success} />
            {loading ? <Spinner /> : huertas.length === 0 ? <EmptyState icon={Tractor} message="No hay huertas registradas" /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {huertas.map(h => (
                        <Card key={h.id}>
                            <p className="font-semibold text-slate-900 text-lg">{h.nombre}</p>
                            <p className="text-sm text-slate-500 mt-1">📍 {h.ubicacion} · {h.superficie} ha</p>
                            <p className="text-xs text-slate-400 mt-1">Plantación: {h.fecha_plantacion}</p>
                            {h.variedades_ids?.length > 0 && (
                                <p className="text-xs text-green-700 mt-2 bg-green-50 rounded-lg px-2 py-1">🌵 {getVariedadNombres(h.variedades_ids)}</p>
                            )}
                            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                                <Button variant="outline" className="flex-1 text-xs" onClick={() => openEdit(h)}>Editar</Button>
                                <Button variant="danger" className="text-xs" onClick={() => deleteNode(h.id)}>Eliminar</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Huerta' : 'Nueva Huerta'}>
                <div className="space-y-4">
                    <ErrorBanner error={formError} />
                    <Input label="Nombre" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
                    <Input label="Superficie (ha)" type="number" value={form.superficie} onChange={e => setForm(p => ({ ...p, superficie: e.target.value }))} />
                    <Input label="Ubicación" value={form.ubicacion} onChange={e => setForm(p => ({ ...p, ubicacion: e.target.value }))} />
                    <Input label="Fecha de Plantación" type="date" value={form.fecha_plantacion} onChange={e => setForm(p => ({ ...p, fecha_plantacion: e.target.value }))} />
                    <div>
                        <p className="text-sm font-medium text-slate-600 mb-2">Variedades</p>
                        <div className="flex flex-wrap gap-2">
                            {variedades.map(v => (
                                <button key={v.id} onClick={() => toggleVariedad(v.id)}
                                    className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-all",
                                        form.variedades_ids.includes(v.id) ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-300 hover:border-green-400"
                                    )}>
                                    {v.nombre}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button loading={saving} onClick={handleSave}>Guardar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

/* Manejos section */
export function ManejosSection({ huertas, variedades }) {
    const { data: manejos, loading, error, addNode, deleteNode } = useFirestore('manejos');
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState('');
    const [expandedHuerta, setExpandedHuerta] = useState(null);

    const tiposTrabajo = ['Poda', 'Fertilización', 'Riego', 'Control de Plagas', 'Cosecha', 'Limpieza'];

    const handleSave = async () => {
        if (!form.huerta_id || !form.tipo_trabajo) { setFormError('Huerta y tipo de trabajo son requeridos.'); return; }
        setSaving(true); setFormError('');
        try {
            const data = { ...form };
            if (form.tipo_trabajo !== 'Cosecha') { delete data.variedad_id; delete data.cantidad_cosechada; }
            await addNode(data);
            setModalOpen(false); setSuccess('Manejo registrado.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) { setFormError(e.message); }
        finally { setSaving(false); }
    };

    const manejosBy = useMemo(() => {
        const map = {};
        manejos.forEach(m => { if (!map[m.huerta_id]) map[m.huerta_id] = []; map[m.huerta_id].push(m); });
        return map;
    }, [manejos]);

    return (
        <div className="space-y-4 mt-6">
            <SectionHeader title="Manejos de Campo"
                action={<Button onClick={() => { setForm({}); setModalOpen(true); }}><Plus className="w-4 h-4" /> Nuevo Manejo</Button>} />
            <ErrorBanner error={error} /><SuccessBanner message={success} />
            {loading ? <Spinner /> : huertas.length === 0 ? <EmptyState icon={Wrench} message="Registra huertas primero" /> : (
                <div className="space-y-3">
                    {huertas.map(h => {
                        const ms = manejosBy[h.id] || [];
                        const open = expandedHuerta === h.id;
                        return (
                            <Card key={h.id}>
                                <button className="w-full flex items-center justify-between" onClick={() => setExpandedHuerta(open ? null : h.id)}>
                                    <span className="font-semibold text-slate-900">{h.nombre}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400">{ms.length} manejos</span>
                                        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                    </div>
                                </button>
                                {open && (
                                    <div className="mt-3 space-y-2 pt-3 border-t border-slate-100">
                                        {ms.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">Sin manejos registrados</p> :
                                            ms.map(m => (
                                                <div key={m.id} className="flex items-start justify-between bg-slate-50 rounded-xl p-3">
                                                    <div>
                                                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                                                            m.tipo_trabajo === 'Cosecha' ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                                                        )}>{m.tipo_trabajo}</span>
                                                        <p className="text-sm text-slate-700 mt-1">{m.fecha_inicio} → {m.fecha_fin}</p>
                                                        {m.tipo_trabajo === 'Cosecha' && <p className="text-xs text-green-600 mt-0.5">Cosechado: {m.cantidad_cosechada} kg · {variedades.find(v => v.id === m.variedad_id)?.nombre}</p>}
                                                        {m.notas && <p className="text-xs text-slate-400 mt-0.5">{m.notas}</p>}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-slate-800">${m.costo}</p>
                                                        <button onClick={() => deleteNode(m.id)} className="text-xs text-red-400 hover:text-red-600 mt-1">Eliminar</button>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Manejo">
                <div className="space-y-4">
                    <ErrorBanner error={formError} />
                    <Select label="Huerta" options={huertas.map(h => ({ value: h.id, label: h.nombre }))} value={form.huerta_id || ''} onChange={e => setForm(p => ({ ...p, huerta_id: e.target.value }))} />
                    <Select label="Tipo de trabajo" options={tiposTrabajo.map(t => ({ value: t, label: t }))} value={form.tipo_trabajo || ''} onChange={e => setForm(p => ({ ...p, tipo_trabajo: e.target.value }))} />
                    {form.tipo_trabajo === 'Cosecha' && <>
                        <Select label="Variedad" options={variedades.map(v => ({ value: v.id, label: v.nombre }))} value={form.variedad_id || ''} onChange={e => setForm(p => ({ ...p, variedad_id: e.target.value }))} />
                        <Input label="Cantidad cosechada (kg)" type="number" value={form.cantidad_cosechada || ''} onChange={e => setForm(p => ({ ...p, cantidad_cosechada: e.target.value }))} />
                    </>}
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Fecha inicio" type="date" value={form.fecha_inicio || ''} onChange={e => setForm(p => ({ ...p, fecha_inicio: e.target.value }))} />
                        <Input label="Fecha fin" type="date" value={form.fecha_fin || ''} onChange={e => setForm(p => ({ ...p, fecha_fin: e.target.value }))} />
                    </div>
                    <Input label="Costo ($)" type="number" value={form.costo || ''} onChange={e => setForm(p => ({ ...p, costo: e.target.value }))} />
                    <Textarea label="Notas" value={form.notas || ''} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button loading={saving} onClick={handleSave}>Guardar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
