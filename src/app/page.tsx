'use client';

import { useState, useEffect } from 'react';

interface Unidad {
  id: string;
  nombre: string;
  tipo: string;
  planta: number;
  m2: number;
  precio: number;
  status: 'disponible' | 'apartado' | 'vendido' | 'escriturado';
  vista: string;
  notas: string;
}

interface RDC {
  id: string;
  nombre: string;
  fecha: string;
  archivo: string; // base64
  archivoNombre: string;
}

const PIN_CORRECTO = '2835';

const STATUS_COLORS = {
  disponible: 'bg-green-500',
  apartado: 'bg-yellow-500',
  vendido: 'bg-blue-500',
  escriturado: 'bg-purple-500'
};

const STATUS_LABELS = {
  disponible: 'Disponible',
  apartado: 'Apartado',
  vendido: 'Vendido',
  escriturado: 'Escriturado'
};

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(true);
  
  // Inventario state
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [inventarioView, setInventarioView] = useState<'list' | 'form' | 'detail' | 'rdc'>('list');
  const [editingUnidad, setEditingUnidad] = useState<Unidad | null>(null);
  const [selectedUnidad, setSelectedUnidad] = useState<Unidad | null>(null);
  
  // RDC state
  const [rdcList, setRdcList] = useState<RDC[]>([]);
  const [rdcForm, setRdcForm] = useState({ nombre: '', fecha: '', archivo: '', archivoNombre: '' });
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '', tipo: 'departamento', planta: 1, m2: 0, precio: 0,
    status: 'disponible' as const, vista: '', notas: ''
  });

  // Load data from localStorage
  useEffect(() => {
    const savedUnidades = localStorage.getItem('dev_unidades');
    const savedRdc = localStorage.getItem('dev_rdc');
    if (savedUnidades) setUnidades(JSON.parse(savedUnidades));
    if (savedRdc) setRdcList(JSON.parse(savedRdc));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('dev_unidades', JSON.stringify(unidades));
  }, [unidades]);
  
  useEffect(() => {
    localStorage.setItem('dev_rdc', JSON.stringify(rdcList));
  }, [rdcList]);

  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIosStandalone);
    };
    checkInstalled();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);
    return () => mediaQuery.removeEventListener('change', checkInstalled);
  }, []);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') setIsInstalled(true);
      setDeferredPrompt(null);
    } else {
      alert('Para instalar:\n\niPhone: Toca compartir → "Agregar a inicio"\nAndroid: Menú → "Instalar app"');
    }
  };

  const handleSectionClick = (section: string) => {
    if (section === 'gastos') {
      setShowPinModal(true);
    } else {
      setActiveSection(section);
      if (section === 'inventario') setInventarioView('list');
    }
  };

  const handlePinSubmit = () => {
    if (pin === PIN_CORRECTO) {
      setShowPinModal(false); setPin(''); setPinError(false); setActiveSection('gastos');
    } else { setPinError(true); }
  };

  const handleSaveUnidad = () => {
    if (!formData.nombre) { alert('Ingresa el nombre de la unidad'); return; }
    if (editingUnidad) {
      setUnidades(unidades.map(u => u.id === editingUnidad.id ? { ...formData, id: editingUnidad.id } : u));
    } else {
      setUnidades([...unidades, { ...formData, id: Date.now().toString() }]);
    }
    setFormData({ nombre: '', tipo: 'departamento', planta: 1, m2: 0, precio: 0, status: 'disponible', vista: '', notas: '' });
    setEditingUnidad(null);
    setInventarioView('list');
  };

  const handleEditUnidad = (u: Unidad) => {
    setFormData({ nombre: u.nombre, tipo: u.tipo, planta: u.planta, m2: u.m2, precio: u.precio, status: u.status, vista: u.vista, notas: u.notas });
    setEditingUnidad(u);
    setInventarioView('form');
  };

  const handleDeleteUnidad = (id: string) => {
    if (confirm('¿Eliminar esta unidad?')) {
      setUnidades(unidades.filter(u => u.id !== id));
      setInventarioView('list');
    }
  };

  const handleRdcFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setRdcForm({ ...rdcForm, archivo: ev.target?.result as string, archivoNombre: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveRdc = () => {
    if (!rdcForm.nombre || !rdcForm.archivo) { alert('Completa nombre y archivo'); return; }
    setRdcList([...rdcList, { ...rdcForm, id: Date.now().toString(), fecha: rdcForm.fecha || new Date().toISOString().split('T')[0] }]);
    setRdcForm({ nombre: '', fecha: '', archivo: '', archivoNombre: '' });
  };

  const handleDeleteRdc = (id: string) => {
    if (confirm('¿Eliminar este documento RDC?')) {
      setRdcList(rdcList.filter(r => r.id !== id));
    }
  };

  const stats = {
    total: unidades.length,
    disponibles: unidades.filter(u => u.status === 'disponible').length,
    apartados: unidades.filter(u => u.status === 'apartado').length,
    vendidos: unidades.filter(u => u.status === 'vendido').length
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-800 to-emerald-900">
      <header className="pt-6 pb-4 px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-light tracking-wide text-white">DEVELOPMENT<span className="font-bold"> SOLUTIONS</span></h1>
            </div>
          </div>
          <p className="text-white/60 text-sm">Gestión de desarrollos inmobiliarios</p>
          {!isInstalled && (
            <button onClick={handleInstall} className="mt-3 bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-white/30 flex items-center gap-2 mx-auto border border-white/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Instalar App
            </button>
          )}
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {!activeSection ? (
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleSectionClick('inventario')} className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95">
              <div className="w-full aspect-square overflow-hidden"><img src="/icon-inventario.png" alt="Inventario" className="w-full h-full object-cover" /></div>
              <div className="p-3 text-center"><span className="text-white font-semibold text-lg block">Inventario</span><span className="text-white/50 text-xs">Unidades disponibles</span></div>
            </button>
            <button onClick={() => handleSectionClick('compradores')} className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95">
              <div className="w-full aspect-square overflow-hidden"><img src="/icon-compradores.png" alt="Compradores" className="w-full h-full object-cover" /></div>
              <div className="p-3 text-center"><span className="text-white font-semibold text-lg block">Compradores</span><span className="text-white/50 text-xs">Clientes y prospectos</span></div>
            </button>
            <button onClick={() => handleSectionClick('pagos')} className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95">
              <div className="w-full aspect-square overflow-hidden"><img src="/icon-pagos.png" alt="Pagos" className="w-full h-full object-cover" /></div>
              <div className="p-3 text-center"><span className="text-white font-semibold text-lg block">Pagos</span><span className="text-white/50 text-xs">Cobranza y adeudos</span></div>
            </button>
            <button onClick={() => handleSectionClick('inversionistas')} className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95">
              <div className="w-full aspect-square overflow-hidden"><img src="/icon-inversionistas.png" alt="Inversionistas" className="w-full h-full object-cover" /></div>
              <div className="p-3 text-center"><span className="text-white font-semibold text-lg block">Inversionistas</span><span className="text-white/50 text-xs">Capital y socios</span></div>
            </button>
            <button onClick={() => handleSectionClick('construccion')} className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95">
              <div className="w-full aspect-square overflow-hidden"><img src="/icon-construccion.png" alt="Construcción" className="w-full h-full object-cover" /></div>
              <div className="p-3 text-center"><span className="text-white font-semibold text-lg block">Construcción</span><span className="text-white/50 text-xs">Avance de obra</span></div>
            </button>
            <button onClick={() => handleSectionClick('gastos')} className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-red-400/50 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95 relative">
              <div className="absolute top-2 right-2"><svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
              <div className="w-full aspect-square overflow-hidden"><img src="/icon-gastos.png" alt="Gastos" className="w-full h-full object-cover" /></div>
              <div className="p-3 text-center"><span className="text-white font-semibold text-lg block">Gastos</span><span className="text-red-300/70 text-xs">Acceso con PIN</span></div>
            </button>
          </div>
        ) : activeSection === 'inventario' ? (
          <div className="animate-fadeIn">
            <button onClick={() => { if (inventarioView === 'list') setActiveSection(null); else setInventarioView('list'); }} className="mb-4 flex items-center gap-2 text-white/60 hover:text-white transition">
              <span>←</span> <span>Volver</span>
            </button>

            {inventarioView === 'list' && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-white/10 rounded-xl p-3 text-center"><div className="text-xl font-bold text-white">{stats.total}</div><div className="text-xs text-white/60">Total</div></div>
                  <div className="bg-green-500/20 rounded-xl p-3 text-center"><div className="text-xl font-bold text-green-400">{stats.disponibles}</div><div className="text-xs text-white/60">Disp.</div></div>
                  <div className="bg-yellow-500/20 rounded-xl p-3 text-center"><div className="text-xl font-bold text-yellow-400">{stats.apartados}</div><div className="text-xs text-white/60">Apart.</div></div>
                  <div className="bg-blue-500/20 rounded-xl p-3 text-center"><div className="text-xl font-bold text-blue-400">{stats.vendidos}</div><div className="text-xs text-white/60">Vend.</div></div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                  <button onClick={() => { setEditingUnidad(null); setFormData({ nombre: '', tipo: 'departamento', planta: 1, m2: 0, precio: 0, status: 'disponible', vista: '', notas: '' }); setInventarioView('form'); }} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 flex items-center justify-center gap-2">
                    <span>+</span> Nueva Unidad
                  </button>
                  <button onClick={() => setInventarioView('rdc')} className="bg-amber-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-amber-600 flex items-center gap-2">
                    📜 RDC
                  </button>
                </div>

                {/* Units List */}
                <div className="space-y-3">
                  {unidades.length === 0 ? (
                    <div className="bg-white/10 rounded-xl p-6 text-center text-white/60">No hay unidades registradas</div>
                  ) : (
                    unidades.map(u => (
                      <div key={u.id} onClick={() => { setSelectedUnidad(u); setInventarioView('detail'); }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-semibold text-lg">{u.nombre}</h3>
                          <span className={`${STATUS_COLORS[u.status]} text-white text-xs px-2 py-1 rounded-full`}>{STATUS_LABELS[u.status]}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <span>{u.tipo}</span>
                          <span>Piso {u.planta}</span>
                          <span>{u.m2} m²</span>
                          <span className="text-emerald-400 font-semibold">{formatMoney(u.precio)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {inventarioView === 'form' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">{editingUnidad ? 'Editar Unidad' : 'Nueva Unidad'}</h2>
                <div className="space-y-4">
                  <div><label className="block text-white/60 text-sm mb-1">Nombre/Identificador *</label><input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" placeholder="Ej: Depto 101, Local A, Casa 5" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">Tipo</label><select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"><option value="departamento">Departamento</option><option value="casa">Casa</option><option value="local">Local</option><option value="oficina">Oficina</option><option value="bodega">Bodega</option><option value="terreno">Terreno</option></select></div>
                    <div><label className="block text-white/60 text-sm mb-1">Planta/Piso</label><input type="number" value={formData.planta} onChange={e => setFormData({...formData, planta: parseInt(e.target.value) || 1})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">M² Superficie</label><input type="number" value={formData.m2} onChange={e => setFormData({...formData, m2: parseFloat(e.target.value) || 0})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                    <div><label className="block text-white/60 text-sm mb-1">Precio MXN</label><input type="number" value={formData.precio} onChange={e => setFormData({...formData, precio: parseFloat(e.target.value) || 0})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  </div>
                  <div><label className="block text-white/60 text-sm mb-1">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"><option value="disponible">Disponible</option><option value="apartado">Apartado</option><option value="vendido">Vendido</option><option value="escriturado">Escriturado</option></select></div>
                  <div><label className="block text-white/60 text-sm mb-1">Vista/Orientación</label><input type="text" value={formData.vista} onChange={e => setFormData({...formData, vista: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" placeholder="Ej: Norte, Calle, Jardín" /></div>
                  <div><label className="block text-white/60 text-sm mb-1">Notas</label><textarea value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} rows={3} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white resize-none" /></div>
                  <button onClick={handleSaveUnidad} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600">Guardar Unidad</button>
                </div>
              </div>
            )}

            {inventarioView === 'detail' && selectedUnidad && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">{selectedUnidad.nombre}</h2>
                  <span className={`${STATUS_COLORS[selectedUnidad.status]} text-white text-sm px-3 py-1 rounded-full`}>{STATUS_LABELS[selectedUnidad.status]}</span>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-white/80"><span>Tipo:</span><span className="font-semibold capitalize">{selectedUnidad.tipo}</span></div>
                  <div className="flex justify-between text-white/80"><span>Planta:</span><span className="font-semibold">{selectedUnidad.planta}</span></div>
                  <div className="flex justify-between text-white/80"><span>Superficie:</span><span className="font-semibold">{selectedUnidad.m2} m²</span></div>
                  <div className="flex justify-between text-white/80"><span>Precio:</span><span className="font-semibold text-emerald-400">{formatMoney(selectedUnidad.precio)}</span></div>
                  {selectedUnidad.vista && <div className="flex justify-between text-white/80"><span>Vista:</span><span className="font-semibold">{selectedUnidad.vista}</span></div>}
                  {selectedUnidad.notas && <div className="pt-3 border-t border-white/20"><span className="text-white/60 text-sm">Notas:</span><p className="text-white mt-1">{selectedUnidad.notas}</p></div>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleEditUnidad(selectedUnidad)} className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600">Editar</button>
                  <button onClick={() => handleDeleteUnidad(selectedUnidad.id)} className="bg-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-600">Eliminar</button>
                </div>
              </div>
            )}

            {inventarioView === 'rdc' && (
              <div className="space-y-4">
                <div className="bg-amber-500/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/30">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">📜 Régimen de Condominio</h2>
                  <p className="text-white/60 text-sm mb-4">Sube la escritura del Régimen de Condominio y otros documentos legales del desarrollo.</p>
                  <div className="space-y-4">
                    <div><label className="block text-white/60 text-sm mb-1">Nombre del documento *</label><input type="text" value={rdcForm.nombre} onChange={e => setRdcForm({...rdcForm, nombre: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" placeholder="Ej: Escritura RDC Torre Norte" /></div>
                    <div><label className="block text-white/60 text-sm mb-1">Fecha</label><input type="date" value={rdcForm.fecha} onChange={e => setRdcForm({...rdcForm, fecha: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                    <div><label className="block text-white/60 text-sm mb-1">Archivo (PDF, imagen) *</label><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleRdcFileChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-500 file:text-white" />{rdcForm.archivoNombre && <p className="text-sm text-amber-400 mt-1">✓ {rdcForm.archivoNombre}</p>}</div>
                    <button onClick={handleSaveRdc} className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600">Guardar Documento</button>
                  </div>
                </div>
                
                {rdcList.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <h3 className="text-lg font-bold text-white mb-4">Documentos guardados</h3>
                    <div className="space-y-3">
                      {rdcList.map(rdc => (
                        <div key={rdc.id} className="bg-white/10 rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-semibold">{rdc.nombre}</h4>
                            <p className="text-white/60 text-sm">{rdc.fecha} • {rdc.archivoNombre}</p>
                          </div>
                          <div className="flex gap-2">
                            <a href={rdc.archivo} download={rdc.archivoNombre} className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600">📥</a>
                            <button onClick={() => handleDeleteRdc(rdc.id)} className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600">🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fadeIn">
            <button onClick={() => setActiveSection(null)} className="mb-4 flex items-center gap-2 text-white/60 hover:text-white transition"><span>←</span> <span>Volver</span></button>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 capitalize">{activeSection}</h2>
              <p className="text-white/60">Sección en desarrollo...</p>
            </div>
          </div>
        )}
        <footer className="mt-12 text-center"><p className="text-white/40 text-sm">Hecho por <span className="text-amber-400">Colmena (C6)</span> • 2025</p></footer>
      </main>

      {showPinModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 w-full max-w-sm border border-white/20">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
              <h2 className="text-xl font-bold text-white">Acceso Restringido</h2>
              <p className="text-white/60 text-sm mt-1">Ingresa el PIN de seguridad</p>
            </div>
            <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => { setPin(e.target.value); setPinError(false); }} onKeyDown={e => e.key === 'Enter' && handlePinSubmit()} className={`w-full text-center text-2xl tracking-[1em] py-4 bg-white/10 border ${pinError ? 'border-red-500' : 'border-white/20'} rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-red-500`} placeholder="••••" />
            {pinError && <p className="text-red-400 text-sm text-center mt-2">PIN incorrecto</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowPinModal(false); setPin(''); setPinError(false); }} className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20">Cancelar</button>
              <button onClick={handlePinSubmit} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600">Acceder</button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.3s ease-out; }`}</style>
    </div>
  );
}
