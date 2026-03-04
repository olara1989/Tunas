import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard, Tractor, PackageSearch,
  Wrench, Settings, Sprout, TrendingUp, ShoppingCart, AlertTriangle, ShieldCheck, User
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useFirestore } from './hooks/useFirestore';
import { Card, cn, Spinner } from './components/ui';
import { ProductoresManager, ClientesManager, VariedadesManager } from './components/ConfigModules';
import { HuertasSection, ManejosSection } from './components/ProduccionModules';
import { EquipoSection, MantenimientosSection } from './components/EquiposModules';
import { EntradasSection, ConsolidadorSection, SalidasSection } from './components/BodegaModules';
import Login from './components/Login';
import { AccountModule } from './components/AccountModule';
import { AdminModules } from './components/AdminModules';


/* ─── Nav Item ─────────────────── */
function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left whitespace-nowrap",
        active
          ? "bg-green-600 text-white shadow-lg shadow-green-900/30"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

/* ─── Dashboard ─────────────────── */
function Dashboard({ entradas, detalles, detalleSalidas, mantenimientos, equipo }) {
  const today = new Date().toISOString().split('T')[0];

  const ventasHoy = useMemo(() => {
    const ids = new Set(
      detalleSalidas
        .filter(ds => {
          // We check the salida's fecha — approximate by looking at detalle
          return true; // done via parent joining below
        })
        .map(ds => ds.id)
    );
    return 0; // calculated below
  }, [detalleSalidas]);

  const ventasHoyTotal = useMemo(() => {
    return detalleSalidas.reduce((sum, ds) => sum + (ds.precio_dia * ds.cantidad_vendida || 0), 0);
  }, [detalleSalidas]);

  const tarimasEnInventario = useMemo(() =>
    detalles.filter(d => d.status === 'almacenada' || d.status === 'en_proceso').length,
    [detalles]
  );

  const proximosMantenimientos = useMemo(() => {
    const now = new Date();
    return mantenimientos
      .filter(m => new Date(m.fecha) >= now)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .slice(0, 3);
  }, [mantenimientos]);

  const entradasPendientes = useMemo(() =>
    entradas.filter(e => e.status === 'pendiente').length,
    [entradas]
  );

  const kpis = [
    {
      label: "Ventas Registradas",
      value: `$${ventasHoyTotal.toFixed(0)}`,
      sub: `${detalleSalidas.length} partidas`,
      icon: TrendingUp,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Tarimas en Bodega",
      value: tarimasEnInventario,
      sub: `${detalles.filter(d => d.status === 'almacenada').length} almacenadas`,
      icon: PackageSearch,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Entradas Pendientes",
      value: entradasPendientes,
      sub: "Por liquidar al productor",
      icon: AlertTriangle,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      label: "Equipos Registrados",
      value: equipo.length,
      sub: `${mantenimientos.length} mantenimientos`,
      icon: Wrench,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Sistema Integral · Barredora de Tunas</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>
              </div>
              <div className={cn("p-2.5 rounded-xl", kpi.color)}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Upcoming maintenance */}
      {proximosMantenimientos.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-3">Próximos Mantenimientos</h3>
          <div className="space-y-2">
            {proximosMantenimientos.map(m => {
              const eq = equipo.find(e => e.id === m.equipo_id);
              return (
                <div key={m.id} className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{eq?.nombre || '–'}</p>
                    <p className="text-xs text-slate-500">{m.tipo_mantenimiento} · {m.descripcion}</p>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">{m.fecha}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent tarimas */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-3">Estado de Tarimas</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          {['almacenada', 'en_proceso', 'completa'].map(st => {
            const count = detalles.filter(d => d.status === st).length;
            const styleMap = { almacenada: 'bg-blue-50 text-blue-700', en_proceso: 'bg-orange-50 text-orange-700', completa: 'bg-green-50 text-green-700' };
            const labels = { almacenada: 'Almacenadas', en_proceso: 'En Proceso', completa: 'Completas' };
            return (
              <div key={st} className={cn("rounded-xl p-4", styleMap[st])}>
                <p className="text-3xl font-bold">{count}</p>
                <p className="text-xs font-medium mt-1">{labels[st]}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ─── Tabs sub-nav ─────────────── */
function TabNav({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 overflow-x-auto">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={cn(
            "flex-1 min-w-max px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
            active === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Root App ─────────────────── */
export default function App() {
  const { user, userData, activeTenant, setActiveTenant } = useAuth();
  const isAdmin = userData?.rol === 'admin';
  const [activeTab, setActiveTab] = useState('dashboard');

  // Update default tab based on role once userData is loaded
  useEffect(() => {
    if (activeTenant && activeTab === 'admin') setActiveTab('dashboard');
    else if (!activeTenant && isAdmin) setActiveTab('admin');
    else if (!isAdmin && user && activeTab === 'admin') setActiveTab('dashboard');
  }, [isAdmin, user, activeTenant]);

  const [subTab, setSubTab] = useState({
    produccion: 'huertas',
    bodega: 'entradas',
    equipos: 'equipos',
    config: 'productores',
  });

  const { data: productores } = useFirestore('productores');
  const { data: clientes } = useFirestore('clientes');
  const { data: variedades } = useFirestore('variedades');
  const { data: huertas } = useFirestore('huertas');
  const { data: entradas } = useFirestore('registro_entradas');
  const { data: detalles } = useFirestore('detalle_entradas');
  const { data: detalleSalidas } = useFirestore('detalle_salidas');
  const { data: equipo } = useFirestore('equipo');
  const { data: mantenimientos } = useFirestore('mantenimientos');

  const setTab = (module, tab) => setSubTab(p => ({ ...p, [module]: tab }));

  if (!user) return <Login />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-60 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 z-10 shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-green-600 rounded-xl">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-white leading-tight">Tunas</p>
            <p className="text-xs text-slate-400">Sweeper System</p>
          </div>
        </div>

        <nav className="p-3 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible flex-1">
          {isAdmin && (
            <NavItem
              icon={ShieldCheck}
              label="Super Admin"
              active={activeTab === 'admin' && !activeTenant}
              onClick={() => { setActiveTenant(null); setActiveTab('admin'); }}
            />
          )}

          {(!isAdmin || activeTenant) && (
            <>
              <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
              <NavItem icon={Tractor} label="Producción" active={activeTab === 'produccion'} onClick={() => setActiveTab('produccion')} />
              <NavItem icon={PackageSearch} label="Bodega" active={activeTab === 'bodega'} onClick={() => setActiveTab('bodega')} />
              <NavItem icon={Wrench} label="Equipos" active={activeTab === 'equipos'} onClick={() => setActiveTab('equipos')} />
              <NavItem icon={Settings} label="Configuración" active={activeTab === 'config'} onClick={() => setActiveTab('config')} />
            </>
          )}
        </nav>

        <div className="hidden md:block mt-auto p-4 border-t border-slate-800">
          {!isAdmin && <NavItem icon={User} label="Mi Cuenta" active={activeTab === 'cuenta'} onClick={() => setActiveTab('cuenta')} />}
          <p className="text-xs text-slate-500 mt-4 px-2">Barredora de Tunas © 2026</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTenant && (
          <div className="bg-orange-600 text-white px-4 md:px-8 py-3 flex justify-between items-center shadow-md z-10">
            <span className="font-medium text-sm flex items-center">
              <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>
                Vista Administrador — Gestionando a: <strong className="ml-1">{activeTenant.email}</strong> {activeTenant.nombre ? `(${activeTenant.nombre})` : ''}
              </span>
            </span>
            <button
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors ml-4 whitespace-nowrap"
              onClick={() => { setActiveTenant(null); setActiveTab('admin'); }}
            >
              Cerrar Gestión
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'dashboard' && (
            <Dashboard
              entradas={entradas} detalles={detalles}
              detalleSalidas={detalleSalidas} mantenimientos={mantenimientos} equipo={equipo}
            />
          )}

          {activeTab === 'produccion' && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-5">Producción</h1>
              <TabNav
                tabs={[{ key: 'huertas', label: 'Huertas' }, { key: 'manejos', label: 'Manejos de Campo' }]}
                active={subTab.produccion} onChange={t => setTab('produccion', t)}
              />
              {subTab.produccion === 'huertas' && <HuertasSection variedades={variedades} />}
              {subTab.produccion === 'manejos' && <ManejosSection huertas={huertas} variedades={variedades} />}
            </div>
          )}

          {activeTab === 'bodega' && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-5">Bodega & Ventas</h1>
              <TabNav
                tabs={[
                  { key: 'entradas', label: 'Entradas' },
                  { key: 'consolidador', label: 'Consolidador de Carga' },
                  { key: 'salidas', label: 'Historial Salidas' },
                ]}
                active={subTab.bodega} onChange={t => setTab('bodega', t)}
              />
              {subTab.bodega === 'entradas' && <EntradasSection productores={productores} variedades={variedades} />}
              {subTab.bodega === 'consolidador' && <ConsolidadorSection clientes={clientes} variedades={variedades} />}
              {subTab.bodega === 'salidas' && <SalidasSection clientes={clientes} variedades={variedades} />}
            </div>
          )}

          {activeTab === 'equipos' && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-5">Equipos & Maquinaria</h1>
              <TabNav
                tabs={[{ key: 'equipos', label: 'Equipos' }, { key: 'historial', label: 'Historial Mantenimientos' }]}
                active={subTab.equipos} onChange={t => setTab('equipos', t)}
              />
              {subTab.equipos === 'equipos' && <EquipoSection />}
              {subTab.equipos === 'historial' && <MantenimientosSection />}
            </div>
          )}

          {activeTab === 'config' && !isAdmin && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-5">Configuración</h1>
              <TabNav
                tabs={[
                  { key: 'productores', label: 'Productores' },
                  { key: 'clientes', label: 'Clientes' },
                  { key: 'variedades', label: 'Variedades' },
                ]}
                active={subTab.config} onChange={t => setTab('config', t)}
              />
              {subTab.config === 'productores' && <ProductoresManager />}
              {subTab.config === 'clientes' && <ClientesManager />}
              {subTab.config === 'variedades' && <VariedadesManager />}
            </div>
          )}

          {activeTab === 'cuenta' && !isAdmin && <AccountModule />}
          {activeTab === 'admin' && isAdmin && !activeTenant && <AdminModules />}
        </div>
      </main>
    </div>
  );
}
