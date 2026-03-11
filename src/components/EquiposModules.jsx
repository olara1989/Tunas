import React, { useState } from 'react';
import { Plus, Wrench, Truck } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import {
    Card, Button, Input, Select, Modal, Textarea,
    ErrorBanner, SuccessBanner, EmptyState, Spinner, SectionHeader, cn
} from './ui';

const TIPOS_EQUIPO = ['Equipo', 'Maquinaria', 'Vehiculo'];
const TIPOS_MANTENIMIENTO = ['Preventivo', 'Correctivo', 'Revisión'];

export function EquipoSection() {
    const { data: equipo, loading, error, addNode, deleteNode } = useFirestore('equipo');
    const { data: mantenimientos, addNode: addManto } = useFirestore('mantenimientos');
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState('');
    const [eqModal, setEqModal] = useState(false);
    const [eqForm, setEqForm] = useState({});
    const [mantoModal, setMantoModal] = useState(null);
    const [mantoForm, setMantoForm] = useState({});

    const tipoIcon = { Equipo: '⚙️', Maquinaria: '🏗️', Vehiculo: '🚛' };

    const handleSaveEquipo = async () => {
        if (!eqForm.nombre || !eqForm.tipo) { setFormError('Nombre y tipo son requeridos.'); return; }
        setSaving(true); setFormError('');
        try {
            await addNode(eqForm); setEqModal(false); setSuccess('Equipo guardado.'); setTimeout(() => setSuccess(''), 3000);
        } catch (e) { setFormError(e); }
        finally { setSaving(false); }
    };

    const handleSaveManto = async () => {
        if (!mantoForm.tipo_mantenimiento || !mantoForm.fecha) { setFormError('Tipo y fecha son requeridos.'); return; }
        setSaving(true); setFormError('');
        try {
            await addManto({ ...mantoForm, equipo_id: mantoModal.id });
            setMantoModal(null); setSuccess('Mantenimiento registrado.'); setTimeout(() => setSuccess(''), 3000);
        } catch (e) { setFormError(e); }
        finally { setSaving(false); }
    };

    const getMantos = (equipoId) => mantenimientos.filter(m => m.equipo_id === equipoId);
    const nextManto = (equipoId) => getMantos(equipoId).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];

    const filteredEquipo = equipo.filter(eq => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return eq.nombre?.toLowerCase().includes(s) ||
            eq.marca?.toLowerCase().includes(s) ||
            eq.modelo?.toLowerCase().includes(s) ||
            eq.tipo?.toLowerCase().includes(s);
    });

    return (
        <div className="space-y-4">
            <SectionHeader title="Equipos y Maquinaria"
                action={
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Input
                            placeholder="Buscar equipo..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64"
                        />
                        <Button onClick={() => { setEqForm({}); setFormError(''); setEqModal(true); }}><Plus className="w-4 h-4" /> Nuevo Equipo</Button>
                    </div>
                } />
            <ErrorBanner error={error} /><SuccessBanner message={success} />
            {loading ? <Spinner /> : filteredEquipo.length === 0 ? <EmptyState icon={Truck} message={searchTerm ? "No se encontraron equipos" : "Sin equipos registrados"} /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredEquipo.map(eq => {
                        const ms = getMantos(eq.id);
                        const last = nextManto(eq.id);
                        return (
                            <Card key={eq.id} className="flex flex-col gap-3">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{tipoIcon[eq.tipo] || '⚙️'}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 truncate">{eq.nombre}</p>
                                        <p className="text-sm text-slate-500">{eq.marca} {eq.modelo}</p>
                                        <span className="inline-block mt-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{eq.tipo}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3">
                                    <p className="text-xs text-slate-500 font-medium mb-1">Mantenimientos: {ms.length}</p>
                                    {last && <p className="text-xs text-slate-400">Último: {last.fecha} · {last.tipo_mantenimiento}</p>}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 text-xs" onClick={() => { setMantoForm({}); setFormError(''); setMantoModal(eq); }}>
                                        <Wrench className="w-3 h-3" /> Mantenimiento
                                    </Button>
                                    <Button variant="danger" className="text-xs" onClick={() => deleteNode(eq.id)}>Eliminar</Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Add Equipo Modal */}
            <Modal open={eqModal} onClose={() => setEqModal(false)} title="Nuevo Equipo">
                <div className="space-y-4">
                    <ErrorBanner error={formError} />
                    <Input label="Nombre" value={eqForm.nombre || ''} onChange={e => setEqForm(p => ({ ...p, nombre: e.target.value }))} />
                    <Select label="Tipo" options={TIPOS_EQUIPO.map(t => ({ value: t, label: t }))} value={eqForm.tipo || ''} onChange={e => setEqForm(p => ({ ...p, tipo: e.target.value }))} />
                    <Input label="Marca" value={eqForm.marca || ''} onChange={e => setEqForm(p => ({ ...p, marca: e.target.value }))} />
                    <Input label="Modelo" value={eqForm.modelo || ''} onChange={e => setEqForm(p => ({ ...p, modelo: e.target.value }))} />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setEqModal(false)}>Cancelar</Button>
                        <Button loading={saving} onClick={handleSaveEquipo}>Guardar</Button>
                    </div>
                </div>
            </Modal>

            {/* Add Mantenimiento Modal */}
            <Modal open={!!mantoModal} onClose={() => setMantoModal(null)} title={`Mantenimiento: ${mantoModal?.nombre}`}>
                <div className="space-y-4">
                    <ErrorBanner error={formError} />
                    <Select label="Tipo de mantenimiento" options={TIPOS_MANTENIMIENTO.map(t => ({ value: t, label: t }))} value={mantoForm.tipo_mantenimiento || ''} onChange={e => setMantoForm(p => ({ ...p, tipo_mantenimiento: e.target.value }))} />
                    <Textarea label="Descripción" value={mantoForm.descripcion || ''} onChange={e => setMantoForm(p => ({ ...p, descripcion: e.target.value }))} />
                    <Input label="Fecha" type="date" value={mantoForm.fecha || ''} onChange={e => setMantoForm(p => ({ ...p, fecha: e.target.value }))} />
                    <Input label="Costo ($)" type="number" value={mantoForm.costo || ''} onChange={e => setMantoForm(p => ({ ...p, costo: e.target.value }))} />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setMantoModal(null)}>Cancelar</Button>
                        <Button loading={saving} onClick={handleSaveManto}>Guardar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export function MantenimientosSection() {
    const { data: mantenimientos, loading, error } = useFirestore('mantenimientos');
    const { data: equipo } = useFirestore('equipo');
    const [searchTerm, setSearchTerm] = useState('');

    const getEquipo = (id) => equipo.find(e => e.id === id);

    const filteredMantos = mantenimientos.filter(m => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        const eq = getEquipo(m.equipo_id);
        return m.tipo_mantenimiento?.toLowerCase().includes(s) ||
            m.descripcion?.toLowerCase().includes(s) ||
            eq?.nombre?.toLowerCase().includes(s);
    });

    return (
        <div className="space-y-4 mt-6">
            <SectionHeader title="Historial de Mantenimientos"
                action={
                    <Input
                        placeholder="Buscar mantenimiento..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64"
                    />
                }
            />
            <ErrorBanner error={error} />
            {loading ? <Spinner /> : filteredMantos.length === 0 ? <EmptyState icon={Wrench} message={searchTerm ? "No se encontraron registros" : "Sin mantenimientos registrados"} /> : (
                <div className="space-y-3">
                    {[...filteredMantos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(m => {
                        const eq = getEquipo(m.equipo_id);
                        const typeColors = { Preventivo: 'bg-blue-50 text-blue-700', Correctivo: 'bg-red-50 text-red-700', 'Revisión': 'bg-yellow-50 text-yellow-700' };
                        return (
                            <Card key={m.id} className="flex items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", typeColors[m.tipo_mantenimiento] || 'bg-slate-100 text-slate-600')}>{m.tipo_mantenimiento}</span>
                                        <span className="text-sm font-medium text-slate-700">{eq?.nombre || 'Equipo eliminado'}</span>
                                    </div>
                                    {m.descripcion && <p className="text-sm text-slate-500 mt-1">{m.descripcion}</p>}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-semibold text-slate-800">${m.costo || 0}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{m.fecha}</p>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
