import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Tractor, Wrench, ChevronDown, ChevronUp, CloudRain, MapPin, Eye, Info, Calendar, BoxSelect } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';
import {
    Card, Button, Input, Select, Modal, Textarea, RadioGroup, Checkbox,
    ErrorBanner, SuccessBanner, EmptyState, Spinner, SectionHeader, StatusBadge, cn
} from './ui';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ coords, onChange }) {
    function LocationMarker() {
        useMapEvents({
            click(e) {
                onChange(e.latlng);
            },
        });

        return coords ? <Marker position={coords} /> : null;
    }

    const initialPos = coords || [22.29742, -101.57468]; // Pinos, Zacatecas center

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden border border-slate-200 mt-2">
            <MapContainer center={initialPos} zoom={coords ? 15 : 12} scrollWheelZoom={false} className="h-full w-full">
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                />
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <LocationMarker />
            </MapContainer>
        </div>
    );
}

/* Map Viewer Component (ReadOnly) */
function ViewerMap({ lat, lng }) {
    if (!lat || !lng) return (
        <div className="h-[200px] w-full rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 italic text-xs border border-dashed border-slate-200 mt-2">
            <MapPin className="w-5 h-5 mb-1 opacity-20" /> Sin ubicación registrada
        </div>
    );

    return (
        <div className="h-[350px] w-full rounded-2xl overflow-hidden border-4 border-white shadow-lg mt-2 ring-1 ring-slate-200">
            <MapContainer center={[lat, lng]} zoom={16} scrollWheelZoom={false} className="h-full w-full">
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; Esri'
                />
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
                />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
                />
                <Marker position={[lat, lng]} />
            </MapContainer>
        </div>
    );
}

/* Rain Forecast Component (Dynamic) */
function RainForecast({ lat, lng, days = 7, compact = true }) {
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!lat || !lng) return;
        const fetchWeather = async () => {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min&forecast_days=${days}&timezone=auto`);
                const data = await res.json();
                setForecast(data.daily);
            } catch (e) {
                console.error("Error fetching weather:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, [lat, lng, days]);

    if (!lat || !lng) return null;
    if (loading) return (
        <div className="animate-pulse space-y-2 mt-4 text-[10px] text-slate-400">
            Obteniendo pronóstico...
        </div>
    );
    if (!forecast) return null;

    return (
        <div className={cn("mt-4", !compact && "bg-blue-50/30 p-4 rounded-2xl border border-blue-100")}>
            <p className={cn(
                "font-bold text-slate-500 uppercase tracking-tight mb-3 flex items-center gap-2",
                compact ? "text-[9px]" : "text-xs"
            )}>
                <CloudRain className={cn("text-blue-500", compact ? "w-3 h-3" : "w-4 h-4")} />
                Lluvia y Temp. ({days} días)
            </p>

            <div className={cn(
                "grid gap-1.5",
                compact ? "grid-cols-7" : "grid-cols-2 lg:grid-cols-7"
            )}>
                {forecast.time.map((date, i) => {
                    const prob = forecast.precipitation_probability_max[i];
                    const amount = forecast.precipitation_sum[i];
                    const tMax = Math.round(forecast.temperature_2m_max[i]);
                    const tMin = Math.round(forecast.temperature_2m_min[i]);
                    const d = new Date(date + 'T12:00:00');
                    const dayLabel = d.toLocaleDateString('es-ES', { weekday: 'short' });
                    const numLabel = d.toLocaleDateString('es-ES', { day: 'numeric' });

                    return (
                        <div key={date} className={cn(
                            "flex flex-col items-center p-2 rounded-xl border transition-all",
                            prob > 30 ? "bg-blue-100/50 border-blue-200" : "bg-white border-slate-100",
                            !compact && "hover:shadow-md hover:border-blue-300"
                        )}>
                            <span className="text-[10px] font-bold text-slate-400 capitalize whitespace-nowrap">{dayLabel}</span>
                            <span className="text-[8px] text-slate-400 leading-none">{numLabel}</span>

                            <div className="my-1.5 flex flex-col items-center">
                                <span className={cn("text-xs font-black", prob > 30 ? "text-blue-600" : "text-slate-700")}>
                                    {prob}%
                                </span>
                                {amount > 0 && (
                                    <span className="text-[9px] text-blue-500 font-bold leading-none">{amount}mm</span>
                                )}
                            </div>

                            <div className="flex flex-col items-center gap-0.5 mt-auto pt-1 border-t border-slate-100 w-full text-center">
                                <span className="text-[10px] font-bold text-red-500">{tMax}°</span>
                                <span className="text-[10px] font-bold text-blue-400">{tMin}°</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* Huertas section */
export function HuertasSection({ variedades }) {
    const { data: huertas, loading, error, addNode, updateNode, deleteNode } = useFirestore('huertas');
    const { data: manejos } = useFirestore('manejos');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        nombre: '',
        superficie: '',
        ubicacion: '',
        fecha_plantacion: '',
        variedades_ids: [],
        lat: null,
        lng: null
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState('');
    const [viewing, setViewing] = useState(null);

    const openAdd = () => { setEditing(null); setForm({ nombre: '', superficie: '', ubicacion: '', fecha_plantacion: '', variedades_ids: [], lat: null, lng: null }); setModalOpen(true); };
    const openEdit = (h) => { setEditing(h); setForm({ ...h, variedades_ids: h.variedades_ids || [] }); setModalOpen(true); };

    const toggleVariedad = (id) => setForm(p => ({
        ...p,
        variedades_ids: p.variedades_ids.includes(id) ? p.variedades_ids.filter(v => v !== id) : [...p.variedades_ids, id]
    }));

    const getVariedadNombres = (ids) => {
        if (!ids || ids.length === 0) return 'Ninguna';
        return ids.map(id => variedades.find(v => v.id === id)?.nombre).filter(Boolean).join(', ');
    };

    const handleSave = async () => {
        if (!form.nombre) { setFormError('El nombre es requerido.'); return; }
        setSaving(true); setFormError('');
        try {
            if (editing) await updateNode(editing.id, form);
            else await addNode(form);
            setModalOpen(false); setSuccess('Guardado.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) { setFormError(e); }
        finally { setSaving(false); }
    };

    const filteredHuertas = huertas.filter(h => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return h.nombre?.toLowerCase().includes(s) ||
            h.ubicacion?.toLowerCase().includes(s);
    });

    return (
        <div className="space-y-4">
            <SectionHeader title="Huertas"
                action={
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Input
                            placeholder="Buscar huerta..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64"
                        />
                        <Button onClick={openAdd}><Plus className="w-4 h-4" /> Nueva Huerta</Button>
                    </div>
                }
            />
            <ErrorBanner error={error} /><SuccessBanner message={success} />
            {loading ? <Spinner /> : filteredHuertas.length === 0 ? <EmptyState icon={Tractor} message={searchTerm ? "No se encontraron huertas" : "No hay huertas registradas"} /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredHuertas.map(h => {
                        const hsManejos = manejos?.filter(m => m.huerta_id === h.id) || [];
                        const gastos = hsManejos.reduce((acc, m) => acc + Number(m.costo || 0), 0);
                        
                        let totalCajas = 0;
                        let totalKilos = 0;
                        let ingresos = 0;

                        hsManejos.filter(m => m.tipo_trabajo === 'Cosecha').forEach(m => {
                            const cant = Number(m.cantidad_cosechada || 0);
                            if (m.unidad === 'Kilo') totalKilos += cant;
                            else totalCajas += cant;
                            
                            const v = variedades.find(v => v.id === m.variedad_id);
                            const precio = m.ingresar_bodega !== false 
                                ? Number(v?.precio_compra || 0)
                                : Number(v?.precio_venta || 0); 
                                
                            ingresos += (cant * precio);
                        });

                        const ganancias = ingresos - gastos;

                        return (
                        <Card key={h.id}>
                            <p className="font-semibold text-slate-900 text-lg">{h.nombre}</p>
                            <p className="text-sm text-slate-500 mt-1">📍 {h.ubicacion} · {h.superficie} ha</p>
                            {h.lat && (
                                <a
                                    href={`https://www.google.com/maps?q=${h.lat},${h.lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1"
                                >
                                    <MapPin className="w-3 h-3" /> Ver en Google Maps
                                </a>
                            )}

                            {h.variedades_ids?.length > 0 && (
                                <p className="text-xs text-green-700 mt-2 bg-green-50 rounded-lg px-2 py-1 inline-block">🌵 {getVariedadNombres(h.variedades_ids)}</p>
                            )}

                            <div className="grid grid-cols-2 gap-2 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Gastos M.</p>
                                    <p className="text-sm font-bold text-red-500">${gastos.toLocaleString()}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Cosecha</p>
                                    <p className="text-xs font-bold text-green-600 truncate mt-0.5">
                                        {totalCajas > 0 && `${totalCajas} cx`} 
                                        {totalCajas > 0 && totalKilos > 0 && ' | '}
                                        {totalKilos > 0 && `${totalKilos} kg`}
                                        {totalCajas === 0 && totalKilos === 0 && '0'}
                                    </p>
                                </div>
                                <div className="col-span-2 text-center border-t border-slate-200 mt-1 pt-2">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Ganancias Estimadas</p>
                                    <p className={`text-base font-bold ${ganancias >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        ${ganancias.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <RainForecast lat={h.lat} lng={h.lng} />

                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                <Button variant="secondary" className="flex-1 text-xs" onClick={() => setViewing(h)}>
                                    <Eye className="w-3 h-3" /> Detalles
                                </Button>
                                <Button variant="outline" className="text-xs" onClick={() => openEdit(h)}>
                                    <Tractor className="w-3 h-3" /> Editar
                                </Button>
                                <Button variant="danger" className="text-xs" onClick={() => deleteNode(h.id)}>
                                    <Plus className="w-3 h-3 rotate-45" />
                                </Button>
                            </div>
                        </Card>
                    )})}
                </div>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Huerta' : 'Nueva Huerta'} size="xl">
                <div className="space-y-6">
                    <ErrorBanner error={formError} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <Input label="Nombre de la Huerta" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
                            <Input label="Superficie (ha)" type="number" value={form.superficie} onChange={e => setForm(p => ({ ...p, superficie: e.target.value }))} />
                            <Input label="Ubicación (Referencia)" value={form.ubicacion} onChange={e => setForm(p => ({ ...p, ubicacion: e.target.value }))} />
                            <Input label="Fecha de Plantación" type="date" value={form.fecha_plantacion} onChange={e => setForm(p => ({ ...p, fecha_plantacion: e.target.value }))} />

                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-2">Variedades cultivadas</p>
                                <div className="flex flex-wrap gap-2">
                                    {variedades.map(v => (
                                        <button key={v.id} onClick={() => toggleVariedad(v.id)}
                                            className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                                                form.variedades_ids.includes(v.id) ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-300 hover:border-green-400"
                                            )}>
                                            {v.nombre}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-red-500" /> Marcar Ubicación Exacta
                            </label>
                            <p className="text-[10px] text-slate-500 leading-tight">
                                Navega y haz clic sobre el terreno de tu huerta para fijar el marcador.
                            </p>
                            <LocationPicker
                                coords={form.lat ? [form.lat, form.lng] : null}
                                onChange={(pos) => setForm(p => ({ ...p, lat: pos.lat, lng: pos.lng }))}
                            />
                            {form.lat ? (
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                                    <p className="text-[10px] font-mono text-slate-600">
                                        Lat: {form.lat.toFixed(6)} | Lng: {form.lng.toFixed(6)}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-[10px] text-orange-600 font-medium italic">⚠ Sin ubicación marcada en el mapa</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button loading={saving} onClick={handleSave} className="px-8">
                            {editing ? 'Actualizar Huerta' : 'Guardar Huerta'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Detalles Completos */}
            <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Ficha Técnica: ${viewing?.nombre}`} size="2xl">
                {viewing && (() => {
                    const hsManejos = manejos?.filter(m => m.huerta_id === viewing.id) || [];
                    const gastos = hsManejos.reduce((acc, m) => acc + Number(m.costo || 0), 0);
                    let totalCajas = 0, totalKilos = 0, ingresos = 0;
                    hsManejos.filter(m => m.tipo_trabajo === 'Cosecha').forEach(m => {
                        const cant = Number(m.cantidad_cosechada || 0);
                        if (m.unidad === 'Kilo') totalKilos += cant;
                        else totalCajas += cant;
                        const v = variedades.find(v => v.id === m.variedad_id);
                        const precio = m.ingresar_bodega !== false ? Number(v?.precio_compra || 0) : Number(v?.precio_venta || 0); 
                        ingresos += (cant * precio);
                    });
                    const ganancias = ingresos - gastos;

                    return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-blue-50 border-none">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Gastos Totales</p>
                                    <p className="text-xl font-bold text-red-500">${gastos.toLocaleString()}</p>
                                </div>
                            </Card>
                            <Card className="bg-green-50 border-none">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Cosecha Total</p>
                                    <p className="text-lg font-bold text-green-700">
                                        {totalCajas > 0 && `${totalCajas} cx `} 
                                        {totalKilos > 0 && `${totalKilos} kg`}
                                        {totalCajas === 0 && totalKilos === 0 && '0'}
                                    </p>
                                </div>
                            </Card>
                            <Card className={`${ganancias >= 0 ? 'bg-green-100' : 'bg-red-100'} border-none`}>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-slate-600 uppercase">Ganancias Estimadas</p>
                                    <p className={`text-xl font-bold ${ganancias >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                        ${ganancias.toLocaleString()}
                                    </p>
                                </div>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-slate-50 border-none">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-xl shadow-sm">
                                        <BoxSelect className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Superficie</p>
                                        <p className="text-lg font-bold text-slate-900">{viewing.superficie} ha</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="bg-slate-50 border-none">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-xl shadow-sm">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Plantación</p>
                                        <p className="text-lg font-bold text-slate-900">{viewing.fecha_plantacion || '–'}</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="bg-slate-50 border-none">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-xl shadow-sm">
                                        <Info className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Variedades</p>
                                        <p className="text-sm font-bold text-slate-900">{getVariedadNombres(viewing.variedades_ids)}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="mt-8">
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Tractor className="w-5 h-5 text-slate-600" /> Historial Financiero Detallado
                            </h4>
                            <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">Fecha</th>
                                            <th className="px-4 py-3">Actividad</th>
                                            <th className="px-4 py-3 text-right">Gasto</th>
                                            <th className="px-4 py-3 text-center">Cosecha</th>
                                            <th className="px-4 py-3 text-right">Ingreso Est.</th>
                                            <th className="px-4 py-3 text-right">Beneficio Est.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[...hsManejos].sort((a,b) => new Date(b.fecha_inicio||0) - new Date(a.fecha_inicio||0)).map((m, i) => {
                                            const gasto = Number(m.costo || 0);
                                            const isCosecha = m.tipo_trabajo === 'Cosecha';
                                            const v = isCosecha ? variedades.find(v => v.id === m.variedad_id) : null;
                                            const cant = Number(m.cantidad_cosechada || 0);
                                            const precio = isCosecha ? (m.ingresar_bodega !== false ? Number(v?.precio_compra || 0) : Number(v?.precio_venta || 0)) : 0;
                                            const ingreso = isCosecha ? (cant * precio) : 0;
                                            const beneficio = ingreso - gasto;

                                            return (
                                                <tr key={m.id || i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{m.fecha_inicio || '–'}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-900">
                                                        {m.tipo_trabajo}
                                                        {isCosecha && v && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{v.nombre}</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-red-500 font-medium">
                                                        {gasto > 0 ? `-$${gasto.toLocaleString()}` : '–'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {isCosecha && cant > 0 ? (
                                                            <span className="font-semibold text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full">{cant} {m.unidad === 'Kilo' ? 'kg' : 'cx'}</span>
                                                        ) : <span className="text-slate-300">–</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-green-600 font-medium">
                                                        {ingreso > 0 ? `+$${ingreso.toLocaleString()}` : '–'}
                                                    </td>
                                                    <td className={`px-4 py-3 text-right font-bold ${beneficio > 0 ? 'text-green-600' : beneficio < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                        {beneficio > 0 ? '+' : ''}${beneficio.toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {hsManejos.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-8 text-center text-slate-500">No hay registros de manejos en esta huerta</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {hsManejos.length > 0 && (
                                        <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                                            <tr>
                                                <td colSpan="2" className="px-4 py-3 text-right uppercase text-[10px] text-slate-500">Totales</td>
                                                <td className="px-4 py-3 text-right text-red-600">-${gastos.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-center text-green-700 text-xs">
                                                    {totalCajas > 0 && `${totalCajas} cx `} 
                                                    {totalKilos > 0 && `${totalKilos} kg`}
                                                    {totalCajas === 0 && totalKilos === 0 && '–'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-green-600">+${ingresos.toLocaleString()}</td>
                                                <td className={`px-4 py-3 text-right ${ganancias >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {ganancias > 0 ? '+' : ''}${ganancias.toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-red-500" /> Ubicación Geográfica
                            </h4>
                            <ViewerMap lat={viewing.lat} lng={viewing.lng} />
                            <div className="bg-slate-100 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-700">{viewing.ubicacion}</p>
                                    <p className="text-[10px] font-mono text-slate-500 mt-1">Coordenadas: {viewing.lat}, {viewing.lng}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(`https://www.google.com/maps?q=${viewing.lat},${viewing.lng}`, '_blank')}
                                    className="shadow-sm bg-white"
                                >
                                    Abrir en Navegador GPS
                                </Button>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-4">Pronóstico Meteorológico Extendido (14 días)</h4>
                            <RainForecast lat={viewing.lat} lng={viewing.lng} days={14} compact={false} />
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <Button onClick={() => setViewing(null)}>Cerrar Ficha Técnica</Button>
                        </div>
                    </div>
                )})()}
            </Modal>
        </div>
    );
}

/* Manejos section */
export function ManejosSection({ huertas, variedades }) {
    const { userData } = useAuth();
    const { data: manejos, loading, error, addNode, deleteNode } = useFirestore('manejos');
    const { data: entradas, addNode: addEntrada } = useFirestore('registro_entradas');
    const { addNode: addDetalle } = useFirestore('detalle_entradas');
    const { data: productores, addNode: addProductor } = useFirestore('productores');
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedHuerta, setExpandedHuerta] = useState(null);

    const tiposTrabajo = ['Poda', 'Fertilización', 'Riego', 'Control de Plagas', 'Cosecha', 'Limpieza'];

    const handleSave = async () => {
        if (!form.huerta_id || !form.tipo_trabajo) { setFormError('Huerta y tipo de trabajo son requeridos.'); return; }
        setSaving(true); setFormError('');
        try {
            const data = { ...form };
            if (form.tipo_trabajo !== 'Cosecha') {
                delete data.variedad_id;
                delete data.cantidad_cosechada;
                delete data.unidad;
                delete data.ingresar_bodega;
            }
            await addNode(data);

            if (form.tipo_trabajo === 'Cosecha' && form.ingresar_bodega !== false) {
                const defaultModo = userData?.bodega_info?.tipo_produccion || 'Caja';
                const lastFolio = (entradas || []).reduce((max, e) => Math.max(max, Number(e.folio) || 0), 0);
                const nuevoFolio = lastFolio + 1;

                // Encontrar o crear productor con el nombre de la bodega
                const bodegaNombre = userData?.bodega_info?.nombre || 'Bodega Propia';
                let prodId = 'Cosecha Propia'; // Fallback
                const existingProd = productores.find(p => p.nombre === bodegaNombre);

                if (existingProd) {
                    prodId = existingProd.id;
                } else {
                    const newProdRef = await addProductor({
                        nombre: bodegaNombre,
                        tipo: 'Propio',
                        createdAt: new Date().toISOString()
                    });
                    prodId = newProdRef.id;
                }

                const entryRef = await addEntrada({
                    productor_id: prodId,
                    fecha: form.fecha_inicio || new Date().toISOString().split('T')[0],
                    folio: nuevoFolio,
                    monto_total_productor: 0,
                    status: 'pagado'
                });

                const variedadSeleccionada = variedades.find(v => v.id === form.variedad_id);
                const presentacionForm = form.unidad || defaultModo;
                await addDetalle({
                    registro_entrada_id: entryRef.id,
                    variedad_id: form.variedad_id,
                    presentacion: presentacionForm,
                    cantidad_recibida: Number(form.cantidad_cosechada),
                    cajas_fisicas: presentacionForm === 'Caja' ? Number(form.cantidad_cosechada) : 0,
                    precio_venta_sugerido: Number(variedadSeleccionada?.precio_venta || 0),
                    tarima_no: nuevoFolio,
                    cantidad_vendida: 0,
                    merma: 0,
                    status: 'almacenada',
                });
            }

            setModalOpen(false); setSuccess('Manejo registrado.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) { setFormError(e); }
        finally { setSaving(false); }
    };

    const manejosBy = useMemo(() => {
        const map = {};
        manejos.forEach(m => { if (!map[m.huerta_id]) map[m.huerta_id] = []; map[m.huerta_id].push(m); });
        return map;
    }, [manejos]);

    const filteredHuertas = huertas.filter(h => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        const ms = manejosBy[h.id] || [];
        const hasMatchingManejo = ms.some(m =>
            m.tipo_trabajo?.toLowerCase().includes(s) ||
            m.notas?.toLowerCase().includes(s)
        );
        return h.nombre?.toLowerCase().includes(s) || hasMatchingManejo;
    });

    return (
        <div className="space-y-4 mt-6">
            <SectionHeader title="Manejos de Campo"
                action={
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Input
                            placeholder="Buscar en manejos..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64"
                        />
                        <Button onClick={() => { setForm({ ingresar_bodega: true }); setModalOpen(true); }}><Plus className="w-4 h-4" /> Nuevo Manejo</Button>
                    </div>
                } />
            <ErrorBanner error={error} /><SuccessBanner message={success} />
            {loading ? <Spinner /> : filteredHuertas.length === 0 ? <EmptyState icon={Wrench} message={searchTerm ? "Sin resultados" : "Registra huertas primero"} /> : (
                <div className="space-y-3">
                    {filteredHuertas.map(h => {
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
                                                        {m.tipo_trabajo === 'Cosecha' && <p className="text-xs text-green-600 mt-0.5">Cosechado: {m.cantidad_cosechada} {m.unidad || 'kg'} · {variedades.find(v => v.id === m.variedad_id)?.nombre}</p>}
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
                    {form.tipo_trabajo === 'Cosecha' && (() => {
                        const selectedHuerta = huertas.find(h => h.id === form.huerta_id);
                        const variedadesHuerta = selectedHuerta && selectedHuerta.variedades_ids?.length > 0
                            ? variedades.filter(v => selectedHuerta.variedades_ids.includes(v.id))
                            : variedades;
                        const defaultModo = userData?.bodega_info?.tipo_produccion || 'Caja';

                        return (
                            <div className="space-y-4">
                                <Select label="Variedad" options={variedadesHuerta.map(v => ({ value: v.id, label: v.nombre }))} value={form.variedad_id || ''} onChange={e => setForm(p => ({ ...p, variedad_id: e.target.value }))} />

                                <RadioGroup
                                    label="Unidad de Cosecha"
                                    options={[
                                        { value: 'Caja', label: 'Cajas', icon: '📦' },
                                        { value: 'Kilo', label: 'Kilos', icon: '⚖️' }
                                    ]}
                                    value={form.unidad || defaultModo}
                                    onChange={val => setForm(p => ({ ...p, unidad: val }))}
                                />

                                <Input label={`Cantidad cosechada (${form.unidad || defaultModo})`} type="number" value={form.cantidad_cosechada || ''} onChange={e => setForm(p => ({ ...p, cantidad_cosechada: e.target.value }))} />

                                <div className="pt-2">
                                    <Checkbox
                                        label="Ingresar esta cosecha a bodega propia automáticamente"
                                        checked={form.ingresar_bodega !== false}
                                        onChange={checked => setForm(p => ({ ...p, ingresar_bodega: checked }))}
                                    />
                                </div>
                            </div>
                        )
                    })()}
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
