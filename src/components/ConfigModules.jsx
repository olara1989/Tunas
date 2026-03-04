import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Users, Sprout, Building } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import {
    Card, Button, Input, Select, Modal, RadioGroup,
    Textarea, ErrorBanner, SuccessBanner, EmptyState, Spinner, SectionHeader, StatusBadge
} from './ui';

/* ── Generic Entity Manager ── */
function EntityManager({ title, icon: Icon, collectionName, fields, renderRow, emptyMessage }) {
    const { data, loading, error, addNode, updateNode, deleteNode } = useFirestore(collectionName);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [formError, setFormError] = useState('');

    const openAdd = () => { setEditing(null); setForm({}); setFormError(''); setModalOpen(true); };
    const openEdit = (item) => { setEditing(item); setForm({ ...item }); setFormError(''); setModalOpen(true); };

    const handleSave = async () => {
        setSaving(true); setFormError('');
        try {
            if (editing) { await updateNode(editing.id, form); setSuccess('Actualizado exitosamente.'); }
            else { await addNode(form); setSuccess('Guardado exitosamente.'); }
            setModalOpen(false);
        } catch (e) { setFormError(e.message); }
        finally { setSaving(false); setTimeout(() => setSuccess(''), 3000); }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este registro?')) return;
        await deleteNode(id);
    };

    return (
        <div className="space-y-4">
            <SectionHeader
                title={title}
                action={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Nuevo</Button>}
            />
            <ErrorBanner error={error} />
            <SuccessBanner message={success} />
            {loading ? <Spinner /> : data.length === 0 ? (
                <EmptyState icon={Icon} message={emptyMessage || 'No hay registros aún'} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {data.map(item => (
                        <Card key={item.id} className="flex flex-col gap-3">
                            {renderRow(item)}
                            <div className="flex gap-2 pt-2 border-t border-slate-100">
                                <Button variant="outline" className="flex-1 text-xs" onClick={() => openEdit(item)}>
                                    <Pencil className="w-3 h-3" /> Editar
                                </Button>
                                <Button variant="danger" className="text-xs" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar' : 'Nuevo Registro'}>
                <div className="space-y-4">
                    <ErrorBanner error={formError} />
                    {fields.map(f => f.type === 'select' ? (
                        <Select key={f.key} label={f.label} options={f.options} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    ) : f.type === 'radio' ? (
                        <RadioGroup key={f.key} label={f.label} options={f.options} value={form[f.key] || ''} onChange={val => setForm(p => ({ ...p, [f.key]: val }))} />
                    ) : f.type === 'textarea' ? (
                        <Textarea key={f.key} label={f.label} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    ) : (
                        <Input key={f.key} label={f.label} type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    ))}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button loading={saving} onClick={handleSave}>Guardar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

/* ── Productores ── */
export function ProductoresManager() {
    return (
        <EntityManager
            title="Productores" icon={Users} collectionName="productores"
            emptyMessage="Sin productores registrados"
            fields={[
                { key: 'nombre', label: 'Nombre' },
                { key: 'direccion', label: 'Dirección' },
                { key: 'telefono', label: 'Teléfono', type: 'tel' },
            ]}
            renderRow={(item) => (
                <>
                    <p className="font-semibold text-slate-900">{item.nombre}</p>
                    <p className="text-sm text-slate-500">{item.direccion}</p>
                    <p className="text-sm text-slate-500">📞 {item.telefono}</p>
                </>
            )}
        />
    );
}

/* ── Clientes ── */
export function ClientesManager() {
    return (
        <EntityManager
            title="Clientes" icon={Building} collectionName="clientes"
            emptyMessage="Sin clientes registrados"
            fields={[
                { key: 'nombre', label: 'Nombre' },
                { key: 'direccion', label: 'Dirección' },
                { key: 'telefono', label: 'Teléfono', type: 'tel' },
            ]}
            renderRow={(item) => (
                <>
                    <p className="font-semibold text-slate-900">{item.nombre}</p>
                    <p className="text-sm text-slate-500">{item.direccion}</p>
                    <p className="text-sm text-slate-500">📞 {item.telefono}</p>
                </>
            )}
        />
    );
}

/* ── Variedades ── */
export function VariedadesManager() {
    return (
        <EntityManager
            title="Variedades de Tuna" icon={Sprout} collectionName="variedades"
            emptyMessage="Sin variedades registradas"
            fields={[
                { key: 'nombre', label: 'Nombre de variedad' },
                { key: 'precio_compra', label: 'Precio de compra', type: 'number' },
                { key: 'precio_venta', label: 'Precio de venta', type: 'number' },
                {
                    key: 'presentacion_default',
                    label: 'Presentación por defecto',
                    type: 'radio',
                    options: [
                        { value: 'Caja', label: 'Caja', icon: '📦' },
                        { value: 'Kilo', label: 'Kilo', icon: '⚖️' }
                    ]
                },
            ]}
            renderRow={(item) => (
                <>
                    <p className="font-semibold text-slate-900">{item.nombre}</p>
                    <div className="flex gap-4 text-sm">
                        <span className="text-slate-500">Compra: <strong className="text-slate-700">${item.precio_compra}</strong></span>
                        <span className="text-slate-500">Venta: <strong className="text-green-700">${item.precio_venta}</strong></span>
                    </div>
                    <p className="text-xs text-slate-400">Presentación: {item.presentacion_default}</p>
                </>
            )}
        />
    );
}
