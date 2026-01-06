'use client';

import { useState, useEffect } from 'react';

interface Pago {
  id: string;
  monto: number;
  fecha: string;
  fechaPago?: string;
  tipo: 'enganche' | 'mensualidad' | 'extraordinario';
  status: 'pendiente' | 'pagado' | 'vencido';
  comprobante?: string;
  notas?: string;
}

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
  galeria: string[];
  compradorId?: string;
  pagos?: Pago[];
}

interface Comprador {
  id: string;
  name: string;
  dob: string;
  pob: string;
  nationality: string;
  docType: string;
  ine: string;
  passport: string;
  passportVenc: string;
  marital: string;
  addressMx: string;
  addressAbroad: string;
  occupation: string;
  company: string;
  curp: string;
  rfc: string;
  email: string;
  phone: string;
}

interface RDC { id: string; nombre: string; fecha: string; archivo: string; archivoNombre: string; }

const PIN_CORRECTO = '2835';
const countries = ["México", "EUA", "Canadá"];
const maritalStatuses = ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Unión Libre"];
const STATUS_COLORS = { disponible: 'bg-green-500', apartado: 'bg-yellow-500', vendido: 'bg-blue-500', escriturado: 'bg-purple-500' };
const STATUS_LABELS = { disponible: 'Disponible', apartado: 'Apartado', vendido: 'Vendido', escriturado: 'Escriturado' };
const PAGO_STATUS_COLORS = { pendiente: 'bg-yellow-500', pagado: 'bg-green-500', vencido: 'bg-red-500' };
const PAGO_TIPO_LABELS = { enganche: 'Enganche', mensualidad: 'Mensualidad', extraordinario: 'Extraordinario' };

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(true);
  
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [inventarioView, setInventarioView] = useState<'list' | 'form' | 'detail' | 'rdc' | 'galeria'>('list');
  const [editingUnidad, setEditingUnidad] = useState<Unidad | null>(null);
  const [selectedUnidad, setSelectedUnidad] = useState<Unidad | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [rdcList, setRdcList] = useState<RDC[]>([]);
  const [rdcForm, setRdcForm] = useState({ nombre: '', fecha: '', archivo: '', archivoNombre: '' });
  const [formData, setFormData] = useState({ nombre: '', tipo: 'departamento', planta: 1, m2: 0, precio: 0, status: 'disponible' as const, vista: '', notas: '', galeria: [] as string[], compradorId: '' });

  const [compradores, setCompradores] = useState<Comprador[]>([]);
  const [compradoresView, setCompradoresView] = useState<'list' | 'form' | 'detail'>('list');
  const [editingComprador, setEditingComprador] = useState<Comprador | null>(null);
  const [selectedComprador, setSelectedComprador] = useState<Comprador | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrMessage, setOcrMessage] = useState('');
  const [compradorForm, setCompradorForm] = useState<Omit<Comprador, 'id'>>({
    name: '', dob: '', pob: '', nationality: 'México', docType: 'INE', ine: '',
    passport: '', passportVenc: '', marital: 'Soltero/a',
    addressMx: '', addressAbroad: '', occupation: '', company: '',
    curp: '', rfc: '', email: '', phone: ''
  });

  // Pagos state
  const [pagosView, setPagosView] = useState<'list' | 'detail' | 'form'>('list');
  const [selectedUnidadPago, setSelectedUnidadPago] = useState<Unidad | null>(null);
  const [editingPago, setEditingPago] = useState<Pago | null>(null);
  const [pagoForm, setPagoForm] = useState<Omit<Pago, 'id'>>({
    monto: 0, fecha: '', tipo: 'mensualidad', status: 'pendiente', notas: ''
  });

  useEffect(() => {
    const savedUnidades = localStorage.getItem('dev_unidades');
    const savedRdc = localStorage.getItem('dev_rdc');
    const savedCompradores = localStorage.getItem('dev_compradores');
    if (savedUnidades) setUnidades(JSON.parse(savedUnidades));
    if (savedRdc) setRdcList(JSON.parse(savedRdc));
    if (savedCompradores) setCompradores(JSON.parse(savedCompradores));
  }, []);

  useEffect(() => { localStorage.setItem('dev_unidades', JSON.stringify(unidades)); }, [unidades]);
  useEffect(() => { localStorage.setItem('dev_rdc', JSON.stringify(rdcList)); }, [rdcList]);
  useEffect(() => { localStorage.setItem('dev_compradores', JSON.stringify(compradores)); }, [compradores]);

  useEffect(() => {
    const checkInstalled = () => { const isStandalone = window.matchMedia('(display-mode: standalone)').matches; const isIosStandalone = (window.navigator as any).standalone === true; setIsInstalled(isStandalone || isIosStandalone); };
    checkInstalled(); const mediaQuery = window.matchMedia('(display-mode: standalone)'); mediaQuery.addEventListener('change', checkInstalled); return () => mediaQuery.removeEventListener('change', checkInstalled);
  }, []);

  useEffect(() => { const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); }; window.addEventListener('beforeinstallprompt', handler); return () => window.removeEventListener('beforeinstallprompt', handler); }, []);

  const handleInstall = async () => { if (deferredPrompt) { deferredPrompt.prompt(); const result = await deferredPrompt.userChoice; if (result.outcome === 'accepted') setIsInstalled(true); setDeferredPrompt(null); } else { alert('Para instalar:\niPhone: Compartir → Agregar a inicio\nAndroid: Menú → Instalar app'); } };
  const handleSectionClick = (section: string) => { if (section === 'gastos') { setShowPinModal(true); } else { setActiveSection(section); if (section === 'inventario') setInventarioView('list'); if (section === 'compradores') setCompradoresView('list'); if (section === 'pagos') setPagosView('list'); } };
  const handlePinSubmit = () => { if (pin === PIN_CORRECTO) { setShowPinModal(false); setPin(''); setPinError(false); setActiveSection('gastos'); } else { setPinError(true); } };

  // Inventario handlers
  const handleSaveUnidad = () => { if (!formData.nombre) { alert('Ingresa el nombre'); return; } if (editingUnidad) { setUnidades(unidades.map(u => u.id === editingUnidad.id ? { ...formData, id: editingUnidad.id, pagos: u.pagos } : u)); } else { setUnidades([...unidades, { ...formData, id: Date.now().toString(), pagos: [] }]); } setFormData({ nombre: '', tipo: 'departamento', planta: 1, m2: 0, precio: 0, status: 'disponible', vista: '', notas: '', galeria: [], compradorId: '' }); setEditingUnidad(null); setInventarioView('list'); };
  const handleEditUnidad = (u: Unidad) => { setFormData({ nombre: u.nombre, tipo: u.tipo, planta: u.planta, m2: u.m2, precio: u.precio, status: u.status, vista: u.vista, notas: u.notas, galeria: u.galeria || [], compradorId: u.compradorId || '' }); setEditingUnidad(u); setInventarioView('form'); };
  const handleDeleteUnidad = (id: string) => { if (confirm('¿Eliminar?')) { setUnidades(unidades.filter(u => u.id !== id)); setInventarioView('list'); } };
  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => { const files = e.target.files; if (!files) return; Array.from(files).forEach(file => { const reader = new FileReader(); reader.onload = (ev) => { setFormData(prev => ({ ...prev, galeria: [...prev.galeria, ev.target?.result as string] })); }; reader.readAsDataURL(file); }); };
  const handleRemoveImage = (index: number) => { setFormData(prev => ({ ...prev, galeria: prev.galeria.filter((_, i) => i !== index) })); };
  const handleRdcFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { setRdcForm({ ...rdcForm, archivo: ev.target?.result as string, archivoNombre: file.name }); }; reader.readAsDataURL(file); } };
  const handleSaveRdc = () => { if (!rdcForm.nombre || !rdcForm.archivo) { alert('Completa nombre y archivo'); return; } setRdcList([...rdcList, { ...rdcForm, id: Date.now().toString(), fecha: rdcForm.fecha || new Date().toISOString().split('T')[0] }]); setRdcForm({ nombre: '', fecha: '', archivo: '', archivoNombre: '' }); };
  const handleDeleteRdc = (id: string) => { if (confirm('¿Eliminar?')) { setRdcList(rdcList.filter(r => r.id !== id)); } };

  // Compradores handlers
  const handleCompradorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { 
    const { name, value } = e.target;
    setCompradorForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'nationality' && value !== 'México') { updated.docType = 'Pasaporte'; updated.ine = ''; }
      return updated;
    });
  };
  
  const handleOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsProcessingOCR(true); setOcrMessage('');
    try {
      const formDataUpload = new FormData(); formDataUpload.append('file', file);
      const response = await fetch('/api/ocr', { method: 'POST', body: formDataUpload });
      const data = await response.json();
      if (data.fields) { setCompradorForm(prev => ({ ...prev, ...data.fields })); setOcrMessage('✓ Campos extraídos'); }
    } catch (error) { console.error('OCR error:', error); setOcrMessage('Error OCR'); }
    finally { setIsProcessingOCR(false); }
  };

  const handleSaveComprador = () => {
    if (!compradorForm.name) { alert('Ingresa el nombre'); return; }
    if (editingComprador) { setCompradores(compradores.map(c => c.id === editingComprador.id ? { ...compradorForm, id: editingComprador.id } : c)); }
    else { setCompradores([...compradores, { ...compradorForm, id: Date.now().toString() }]); }
    setCompradorForm({ name: '', dob: '', pob: '', nationality: 'México', docType: 'INE', ine: '', passport: '', passportVenc: '', marital: 'Soltero/a', addressMx: '', addressAbroad: '', occupation: '', company: '', curp: '', rfc: '', email: '', phone: '' });
    setEditingComprador(null); setCompradoresView('list'); setOcrMessage('');
  };

  const handleEditComprador = (c: Comprador) => { 
    setCompradorForm({ name: c.name, dob: c.dob, pob: c.pob, nationality: c.nationality, docType: c.docType || 'INE', ine: c.ine || '', passport: c.passport, passportVenc: c.passportVenc, marital: c.marital, addressMx: c.addressMx, addressAbroad: c.addressAbroad, occupation: c.occupation, company: c.company, curp: c.curp, rfc: c.rfc, email: c.email, phone: c.phone }); 
    setEditingComprador(c); setCompradoresView('form'); 
  };
  const handleDeleteComprador = (id: string) => { if (confirm('¿Eliminar?')) { setCompradores(compradores.filter(c => c.id !== id)); setCompradoresView('list'); } };

  // Pagos handlers
  const handleSavePago = () => {
    if (!pagoForm.monto || !pagoForm.fecha) { alert('Completa monto y fecha'); return; }
    if (!selectedUnidadPago) return;
    
    const newPago: Pago = { ...pagoForm, id: editingPago?.id || Date.now().toString() };
    
    setUnidades(unidades.map(u => {
      if (u.id === selectedUnidadPago.id) {
        const pagos = u.pagos || [];
        if (editingPago) {
          return { ...u, pagos: pagos.map(p => p.id === editingPago.id ? newPago : p) };
        } else {
          return { ...u, pagos: [...pagos, newPago] };
        }
      }
      return u;
    }));
    
    setPagoForm({ monto: 0, fecha: '', tipo: 'mensualidad', status: 'pendiente', notas: '' });
    setEditingPago(null);
    setPagosView('detail');
    // Actualizar selectedUnidadPago
    const updated = unidades.find(u => u.id === selectedUnidadPago.id);
    if (updated) setSelectedUnidadPago({ ...updated, pagos: editingPago ? updated.pagos?.map(p => p.id === editingPago.id ? newPago : p) : [...(updated.pagos || []), newPago] });
  };

  const handleDeletePago = (pagoId: string) => {
    if (!confirm('¿Eliminar pago?') || !selectedUnidadPago) return;
    setUnidades(unidades.map(u => {
      if (u.id === selectedUnidadPago.id) {
        return { ...u, pagos: (u.pagos || []).filter(p => p.id !== pagoId) };
      }
      return u;
    }));
    setSelectedUnidadPago({ ...selectedUnidadPago, pagos: (selectedUnidadPago.pagos || []).filter(p => p.id !== pagoId) });
  };

  const handleMarcarPagado = (pago: Pago) => {
    if (!selectedUnidadPago) return;
    const updatedPago = { ...pago, status: 'pagado' as const, fechaPago: new Date().toISOString().split('T')[0] };
    setUnidades(unidades.map(u => {
      if (u.id === selectedUnidadPago.id) {
        return { ...u, pagos: (u.pagos || []).map(p => p.id === pago.id ? updatedPago : p) };
      }
      return u;
    }));
    setSelectedUnidadPago({ ...selectedUnidadPago, pagos: (selectedUnidadPago.pagos || []).map(p => p.id === pago.id ? updatedPago : p) });
  };

  const getComprador = (id?: string) => compradores.find(c => c.id === id);
  
  // Stats
  const isMexican = compradorForm.nationality === 'México';
  const showPassport = compradorForm.docType === 'Pasaporte' || !isMexican;
  const stats = { total: unidades.length, disponibles: unidades.filter(u => u.status === 'disponible').length, apartados: unidades.filter(u => u.status === 'apartado').length, vendidos: unidades.filter(u => u.status === 'vendido').length };
  const formatMoney = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
  
  // Pagos stats
  const unidadesConPagos = unidades.filter(u => u.compradorId && (u.status === 'apartado' || u.status === 'vendido' || u.status === 'escriturado'));
  const totalPendiente = unidadesConPagos.reduce((acc, u) => acc + (u.pagos || []).filter(p => p.status === 'pendiente' || p.status === 'vencido').reduce((a, p) => a + p.monto, 0), 0);
  const totalCobrado = unidadesConPagos.reduce((acc, u) => acc + (u.pagos || []).filter(p => p.status === 'pagado').reduce((a, p) => a + p.monto, 0), 0);
  const pagosVencidos = unidadesConPagos.reduce((acc, u) => acc + (u.pagos || []).filter(p => p.status === 'vencido').length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-800 to-emerald-900">
      <header className="pt-6 pb-4 px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div><h1 className="text-2xl font-light tracking-wide text-white">DEVELOPMENT<span className="font-bold"> SOLUTIONS</span></h1></div>
          </div>
          <p className="text-white/60 text-sm">Gestión de desarrollos inmobiliarios</p>
          {!isInstalled && (<button onClick={handleInstall} className="mt-3 bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-white/30 flex items-center gap-2 mx-auto border border-white/30"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Instalar App</button>)}
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {!activeSection ? (
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleSectionClick('inventario')} className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95"><div className="w-full aspect-square overflow-hidden"><img src="/icon-inventario.png" alt="Inventario" className="w-full h-full object-cover" /></div><div className="p-3 text-center"><span className="text-white font-semibold text-lg block">Inventario</span><span className="text-white/50 text-xs">Unidades disponibles</span></div></button>
            <button onClick={() => handleSectionClick('compradores')} className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95"><div className="w-full aspect-square overflow-hidden"><img src="/icon-compradores.png" alt="Compradores" className="w-full h-full object-cover" /></div><div className="p-3 text-center"><span className="text-white font-semibold text-lg block">Compradores</span><span className="text-white/50 text-xs">Clientes y prospectos</span></div></button>
            <button onClick={() => handleSectionClick('pagos')} className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95"><div className="w-full aspect-square overflow-hidden"><img src="/icon-pagos.png" alt="Pagos" className="w-full h-full object-cover" /></div><div className="p-3 text-center"><span className="text-white font-semibold text-lg block">Pagos</span><span className="text-white/50 text-xs">Cobranza y adeudos</span></div></button>
            <button onClick={() => handleSectionClick('inversionistas')} className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95"><div className="w-full aspect-square overflow-hidden"><img src="/icon-inversionistas.png" alt="Inversionistas" className="w-full h-full object-cover" /></div><div className="p-3 text-center"><span className="text-white font-semibold text-lg block">Inversionistas</span><span className="text-white/50 text-xs">Capital y socios</span></div></button>
            <button onClick={() => handleSectionClick('construccion')} className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95"><div className="w-full aspect-square overflow-hidden"><img src="/icon-construccion.png" alt="Construcción" className="w-full h-full object-cover" /></div><div className="p-3 text-center"><span className="text-white font-semibold text-lg block">Construcción</span><span className="text-white/50 text-xs">Avance de obra</span></div></button>
            <button onClick={() => handleSectionClick('gastos')} className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-red-400/50 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95 relative"><div className="absolute top-2 right-2"><svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div><div className="w-full aspect-square overflow-hidden"><img src="/icon-gastos.png" alt="Gastos" className="w-full h-full object-cover" /></div><div className="p-3 text-center"><span className="text-white font-semibold text-lg block">Gastos</span><span className="text-red-300/70 text-xs">Acceso con PIN</span></div></button>
          </div>
        ) : activeSection === 'pagos' ? (
          <div className="animate-fadeIn">
            <button onClick={() => { if (pagosView === 'list') setActiveSection(null); else if (pagosView === 'form') setPagosView('detail'); else setPagosView('list'); }} className="mb-4 flex items-center gap-2 text-white/60 hover:text-white transition"><span>←</span> <span>Volver</span></button>

            {pagosView === 'list' && (
              <>
                <h2 className="text-xl font-bold text-white mb-4">💰 Cobranza</h2>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-green-500/20 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-green-400">{formatMoney(totalCobrado)}</div>
                    <div className="text-xs text-white/60">Cobrado</div>
                  </div>
                  <div className="bg-yellow-500/20 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-yellow-400">{formatMoney(totalPendiente)}</div>
                    <div className="text-xs text-white/60">Pendiente</div>
                  </div>
                  <div className="bg-red-500/20 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-red-400">{pagosVencidos}</div>
                    <div className="text-xs text-white/60">Vencidos</div>
                  </div>
                </div>

                {/* Lista de unidades con pagos */}
                <div className="space-y-3">
                  {unidadesConPagos.length === 0 ? (
                    <div className="bg-white/10 rounded-xl p-6 text-center text-white/60">
                      <p>No hay unidades con pagos</p>
                      <p className="text-sm mt-2">Asigna un comprador a una unidad en Inventario</p>
                    </div>
                  ) : (
                    unidadesConPagos.map(u => {
                      const comprador = getComprador(u.compradorId);
                      const pagos = u.pagos || [];
                      const pendientes = pagos.filter(p => p.status === 'pendiente' || p.status === 'vencido');
                      const totalUnidad = pagos.reduce((a, p) => a + p.monto, 0);
                      const pagadoUnidad = pagos.filter(p => p.status === 'pagado').reduce((a, p) => a + p.monto, 0);
                      
                      return (
                        <div key={u.id} onClick={() => { setSelectedUnidadPago(u); setPagosView('detail'); }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-white font-semibold">{u.nombre}</h3>
                              <p className="text-white/60 text-sm">{comprador?.name || 'Sin comprador'}</p>
                            </div>
                            <span className={`${STATUS_COLORS[u.status]} text-white text-xs px-2 py-1 rounded-full`}>{STATUS_LABELS[u.status]}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm">
                              <span className="text-green-400">{formatMoney(pagadoUnidad)}</span>
                              <span className="text-white/40"> / {formatMoney(totalUnidad)}</span>
                            </div>
                            {pendientes.length > 0 && (
                              <span className="text-yellow-400 text-sm">{pendientes.length} pendiente{pendientes.length > 1 ? 's' : ''}</span>
                            )}
                          </div>
                          {/* Progress bar */}
                          <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${totalUnidad > 0 ? (pagadoUnidad / totalUnidad) * 100 : 0}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {pagosView === 'detail' && selectedUnidadPago && (
              <>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedUnidadPago.nombre}</h2>
                      <p className="text-white/60">{getComprador(selectedUnidadPago.compradorId)?.name || 'Sin comprador'}</p>
                    </div>
                    <button onClick={() => { setEditingPago(null); setPagoForm({ monto: 0, fecha: '', tipo: 'mensualidad', status: 'pendiente', notas: '' }); setPagosView('form'); }} className="bg-emerald-500 text-white py-2 px-4 rounded-xl font-semibold hover:bg-emerald-600 text-sm">+ Pago</button>
                  </div>
                </div>

                <div className="space-y-3">
                  {(!selectedUnidadPago.pagos || selectedUnidadPago.pagos.length === 0) ? (
                    <div className="bg-white/10 rounded-xl p-6 text-center text-white/60">No hay pagos registrados</div>
                  ) : (
                    selectedUnidadPago.pagos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).map(p => (
                      <div key={p.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-xs text-white/40">{PAGO_TIPO_LABELS[p.tipo]}</span>
                            <div className="text-white font-bold text-lg">{formatMoney(p.monto)}</div>
                          </div>
                          <span className={`${PAGO_STATUS_COLORS[p.status]} text-white text-xs px-2 py-1 rounded-full`}>{p.status}</span>
                        </div>
                        <div className="text-white/60 text-sm mb-2">
                          <span>Vence: {p.fecha}</span>
                          {p.fechaPago && <span className="ml-3 text-green-400">Pagado: {p.fechaPago}</span>}
                        </div>
                        {p.notas && <p className="text-white/40 text-sm">{p.notas}</p>}
                        <div className="flex gap-2 mt-3">
                          {p.status !== 'pagado' && (
                            <button onClick={() => handleMarcarPagado(p)} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-600">✓ Marcar pagado</button>
                          )}
                          <button onClick={() => { setEditingPago(p); setPagoForm({ monto: p.monto, fecha: p.fecha, tipo: p.tipo, status: p.status, notas: p.notas || '' }); setPagosView('form'); }} className="bg-blue-500 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-600">✏️</button>
                          <button onClick={() => handleDeletePago(p.id)} className="bg-red-500 text-white py-2 px-4 rounded-lg text-sm hover:bg-red-600">🗑️</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {pagosView === 'form' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">{editingPago ? 'Editar Pago' : 'Nuevo Pago'}</h2>
                <div className="space-y-4">
                  <div><label className="block text-white/60 text-sm mb-1">Monto *</label><input type="number" value={pagoForm.monto} onChange={e => setPagoForm({...pagoForm, monto: parseFloat(e.target.value) || 0})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  <div><label className="block text-white/60 text-sm mb-1">Fecha Vencimiento *</label><input type="date" value={pagoForm.fecha} onChange={e => setPagoForm({...pagoForm, fecha: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">Tipo</label><select value={pagoForm.tipo} onChange={e => setPagoForm({...pagoForm, tipo: e.target.value as any})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"><option value="enganche">Enganche</option><option value="mensualidad">Mensualidad</option><option value="extraordinario">Extraordinario</option></select></div>
                    <div><label className="block text-white/60 text-sm mb-1">Status</label><select value={pagoForm.status} onChange={e => setPagoForm({...pagoForm, status: e.target.value as any})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"><option value="pendiente">Pendiente</option><option value="pagado">Pagado</option><option value="vencido">Vencido</option></select></div>
                  </div>
                  <div><label className="block text-white/60 text-sm mb-1">Notas</label><input type="text" value={pagoForm.notas} onChange={e => setPagoForm({...pagoForm, notas: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={handleSavePago} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600">Guardar</button>
                    <button onClick={() => setPagosView('detail')} className="bg-white/20 text-white py-3 px-6 rounded-xl hover:bg-white/30">Cancelar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeSection === 'compradores' ? (
          <div className="animate-fadeIn">
            <button onClick={() => { if (compradoresView === 'list') setActiveSection(null); else setCompradoresView('list'); }} className="mb-4 flex items-center gap-2 text-white/60 hover:text-white transition"><span>←</span> <span>Volver</span></button>

            {compradoresView === 'list' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Compradores</h2>
                  <button onClick={() => { setEditingComprador(null); setCompradorForm({ name: '', dob: '', pob: '', nationality: 'México', docType: 'INE', ine: '', passport: '', passportVenc: '', marital: 'Soltero/a', addressMx: '', addressAbroad: '', occupation: '', company: '', curp: '', rfc: '', email: '', phone: '' }); setCompradoresView('form'); }} className="bg-emerald-500 text-white py-2 px-4 rounded-xl font-semibold hover:bg-emerald-600">+ Nuevo</button>
                </div>
                <div className="space-y-3">
                  {compradores.length === 0 ? (<div className="bg-white/10 rounded-xl p-6 text-center text-white/60">No hay compradores</div>) : (
                    compradores.map(c => (
                      <div key={c.id} onClick={() => { setSelectedComprador(c); setCompradoresView('detail'); }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition">
                        <h3 className="text-white font-semibold">{c.name}</h3>
                        <div className="flex gap-3 text-sm text-white/60 mt-1"><span>{c.nationality}</span>{c.phone && <span>📞 {c.phone}</span>}</div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {compradoresView === 'form' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">{editingComprador ? 'Editar Comprador' : 'Nuevo Comprador'}</h2>
                <div className="mb-4 p-4 bg-blue-500/20 rounded-xl border border-blue-500/30">
                  <label className="block text-white font-medium mb-2">📄 Subir Documento (OCR)</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleOCRUpload} disabled={isProcessingOCR} className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white" />
                  {isProcessingOCR && <p className="text-blue-300 text-sm mt-2">⏳ Procesando...</p>}
                  {ocrMessage && <p className="text-green-400 text-sm mt-2">{ocrMessage}</p>}
                </div>
                <div className="space-y-4">
                  <div><label className="block text-white/60 text-sm mb-1">Nombre Completo *</label><input name="name" value={compradorForm.name} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">Fecha Nacimiento</label><input name="dob" type="date" value={compradorForm.dob} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                    <div><label className="block text-white/60 text-sm mb-1">Lugar Nacimiento</label><input name="pob" value={compradorForm.pob} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">Nacionalidad</label><select name="nationality" value={compradorForm.nationality} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white">{countries.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div><label className="block text-white/60 text-sm mb-1">Estado Civil</label><select name="marital" value={compradorForm.marital} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white">{maritalStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <label className="block text-white font-medium mb-3">🪪 Documento de Identidad</label>
                    {isMexican && (<div className="mb-3"><label className="block text-white/60 text-sm mb-1">Tipo</label><select name="docType" value={compradorForm.docType} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"><option value="INE">INE</option><option value="Pasaporte">Pasaporte</option></select></div>)}
                    {isMexican && compradorForm.docType === 'INE' && (<div><label className="block text-white/60 text-sm mb-1">Número de INE</label><input name="ine" value={compradorForm.ine} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" placeholder="Clave de elector" /></div>)}
                    {showPassport && (<div className="grid grid-cols-2 gap-4"><div><label className="block text-white/60 text-sm mb-1">Pasaporte</label><input name="passport" value={compradorForm.passport} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div><div><label className="block text-white/60 text-sm mb-1">Vencimiento</label><input name="passportVenc" type="date" value={compradorForm.passportVenc} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div></div>)}
                  </div>
                  <div><label className="block text-white/60 text-sm mb-1">Dirección en México</label><input name="addressMx" value={compradorForm.addressMx} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  {!isMexican && <div><label className="block text-white/60 text-sm mb-1">Dirección en Extranjero</label><input name="addressAbroad" value={compradorForm.addressAbroad} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>}
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">Ocupación</label><input name="occupation" value={compradorForm.occupation} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                    <div><label className="block text-white/60 text-sm mb-1">Empresa</label><input name="company" value={compradorForm.company} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  </div>
                  {isMexican && (<div className="grid grid-cols-2 gap-4"><div><label className="block text-white/60 text-sm mb-1">CURP</label><input name="curp" value={compradorForm.curp} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white uppercase" maxLength={18} /></div><div><label className="block text-white/60 text-sm mb-1">RFC</label><input name="rfc" value={compradorForm.rfc} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white uppercase" maxLength={13} /></div></div>)}
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">Email</label><input name="email" type="email" value={compradorForm.email} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                    <div><label className="block text-white/60 text-sm mb-1">Teléfono</label><input name="phone" value={compradorForm.phone} onChange={handleCompradorChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={handleSaveComprador} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600">Guardar</button>
                    <button onClick={() => setCompradoresView('list')} className="bg-white/20 text-white py-3 px-6 rounded-xl hover:bg-white/30">Cancelar</button>
                  </div>
                </div>
              </div>
            )}

            {compradoresView === 'detail' && selectedComprador && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">{selectedComprador.name}</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-white/80"><span>Nacionalidad:</span><span className="font-semibold">{selectedComprador.nationality}</span></div>
                  {selectedComprador.dob && <div className="flex justify-between text-white/80"><span>Nacimiento:</span><span className="font-semibold">{selectedComprador.dob}</span></div>}
                  {selectedComprador.pob && <div className="flex justify-between text-white/80"><span>Lugar:</span><span className="font-semibold">{selectedComprador.pob}</span></div>}
                  <div className="flex justify-between text-white/80"><span>Estado Civil:</span><span className="font-semibold">{selectedComprador.marital}</span></div>
                  {selectedComprador.ine && <div className="flex justify-between text-white/80"><span>INE:</span><span className="font-semibold">{selectedComprador.ine}</span></div>}
                  {selectedComprador.passport && <div className="flex justify-between text-white/80"><span>Pasaporte:</span><span className="font-semibold">{selectedComprador.passport}</span></div>}
                  {selectedComprador.passportVenc && <div className="flex justify-between text-white/80"><span>Vence:</span><span className="font-semibold">{selectedComprador.passportVenc}</span></div>}
                  {selectedComprador.addressMx && <div className="pt-2 border-t border-white/20"><span className="text-white/60 text-sm">Dirección MX:</span><p className="text-white">{selectedComprador.addressMx}</p></div>}
                  {selectedComprador.addressAbroad && <div><span className="text-white/60 text-sm">Dirección Extranjero:</span><p className="text-white">{selectedComprador.addressAbroad}</p></div>}
                  {selectedComprador.occupation && <div className="flex justify-between text-white/80"><span>Ocupación:</span><span className="font-semibold">{selectedComprador.occupation}</span></div>}
                  {selectedComprador.company && <div className="flex justify-between text-white/80"><span>Empresa:</span><span className="font-semibold">{selectedComprador.company}</span></div>}
                  {selectedComprador.curp && <div className="flex justify-between text-white/80"><span>CURP:</span><span className="font-semibold">{selectedComprador.curp}</span></div>}
                  {selectedComprador.rfc && <div className="flex justify-between text-white/80"><span>RFC:</span><span className="font-semibold">{selectedComprador.rfc}</span></div>}
                  {selectedComprador.email && <div className="flex justify-between text-white/80"><span>Email:</span><span className="font-semibold">{selectedComprador.email}</span></div>}
                  {selectedComprador.phone && <div className="flex justify-between text-white/80"><span>Teléfono:</span><span className="font-semibold">{selectedComprador.phone}</span></div>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleEditComprador(selectedComprador)} className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600">Editar</button>
                  <button onClick={() => handleDeleteComprador(selectedComprador.id)} className="bg-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-600">Eliminar</button>
                </div>
              </div>
            )}
          </div>
        ) : activeSection === 'inventario' ? (
          <div className="animate-fadeIn">
            <button onClick={() => { if (inventarioView === 'list') setActiveSection(null); else if (inventarioView === 'galeria') setInventarioView('detail'); else setInventarioView('list'); }} className="mb-4 flex items-center gap-2 text-white/60 hover:text-white transition"><span>←</span> <span>Volver</span></button>

            {inventarioView === 'list' && (
              <>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-white/10 rounded-xl p-3 text-center"><div className="text-xl font-bold text-white">{stats.total}</div><div className="text-xs text-white/60">Total</div></div>
                  <div className="bg-green-500/20 rounded-xl p-3 text-center"><div className="text-xl font-bold text-green-400">{stats.disponibles}</div><div className="text-xs text-white/60">Disp.</div></div>
                  <div className="bg-yellow-500/20 rounded-xl p-3 text-center"><div className="text-xl font-bold text-yellow-400">{stats.apartados}</div><div className="text-xs text-white/60">Apart.</div></div>
                  <div className="bg-blue-500/20 rounded-xl p-3 text-center"><div className="text-xl font-bold text-blue-400">{stats.vendidos}</div><div className="text-xs text-white/60">Vend.</div></div>
                </div>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => { setEditingUnidad(null); setFormData({ nombre: '', tipo: 'departamento', planta: 1, m2: 0, precio: 0, status: 'disponible', vista: '', notas: '', galeria: [], compradorId: '' }); setInventarioView('form'); }} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 flex items-center justify-center gap-2"><span>+</span> Nueva Unidad</button>
                  <button onClick={() => setInventarioView('rdc')} className="bg-amber-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-amber-600">📜 RDC</button>
                </div>
                <div className="space-y-3">
                  {unidades.length === 0 ? (<div className="bg-white/10 rounded-xl p-6 text-center text-white/60">No hay unidades</div>) : (
                    unidades.map(u => (
                      <div key={u.id} onClick={() => { setSelectedUnidad(u); setSelectedImageIndex(0); setInventarioView('detail'); }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition">
                        <div className="flex gap-3">
                          {u.galeria && u.galeria.length > 0 && (<img src={u.galeria[0]} alt={u.nombre} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1"><h3 className="text-white font-semibold">{u.nombre}</h3><span className={`${STATUS_COLORS[u.status]} text-white text-xs px-2 py-1 rounded-full`}>{STATUS_LABELS[u.status]}</span></div>
                            <div className="flex items-center gap-3 text-sm text-white/60"><span>{u.tipo}</span><span>P{u.planta}</span><span>{u.m2}m²</span><span className="text-emerald-400 font-semibold">{formatMoney(u.precio)}</span></div>
                            {u.compradorId && <div className="text-xs text-blue-400 mt-1">👤 {getComprador(u.compradorId)?.name}</div>}
                          </div>
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
                  <div><label className="block text-white/60 text-sm mb-1">Nombre *</label><input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">Tipo</label><select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"><option value="departamento">Departamento</option><option value="casa">Casa</option><option value="local">Local</option><option value="oficina">Oficina</option><option value="bodega">Bodega</option><option value="terreno">Terreno</option></select></div>
                    <div><label className="block text-white/60 text-sm mb-1">Planta</label><input type="number" value={formData.planta} onChange={e => setFormData({...formData, planta: parseInt(e.target.value) || 1})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">M²</label><input type="number" value={formData.m2} onChange={e => setFormData({...formData, m2: parseFloat(e.target.value) || 0})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                    <div><label className="block text-white/60 text-sm mb-1">Precio</label><input type="number" value={formData.precio} onChange={e => setFormData({...formData, precio: parseFloat(e.target.value) || 0})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"><option value="disponible">Disponible</option><option value="apartado">Apartado</option><option value="vendido">Vendido</option><option value="escriturado">Escriturado</option></select></div>
                    <div><label className="block text-white/60 text-sm mb-1">Comprador</label><select value={formData.compradorId} onChange={e => setFormData({...formData, compradorId: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"><option value="">-- Sin asignar --</option>{compradores.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  </div>
                  <div><label className="block text-white/60 text-sm mb-1">Vista</label><input type="text" value={formData.vista} onChange={e => setFormData({...formData, vista: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  <div><label className="block text-white/60 text-sm mb-1">Notas</label><textarea value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} rows={2} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white resize-none" /></div>
                  <div className="border-t border-white/20 pt-4">
                    <label className="block text-white/60 text-sm mb-2">📷 Galería</label>
                    <input type="file" accept="image/*" multiple onChange={handleAddImages} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-500 file:text-white" />
                    {formData.galeria.length > 0 && (<div className="grid grid-cols-4 gap-2 mt-3">{formData.galeria.map((img, i) => (<div key={i} className="relative"><img src={img} alt={`Foto ${i+1}`} className="w-full aspect-square object-cover rounded-lg" /><button onClick={() => handleRemoveImage(i)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs">×</button></div>))}</div>)}
                  </div>
                  <button onClick={handleSaveUnidad} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600">Guardar</button>
                </div>
              </div>
            )}

            {inventarioView === 'detail' && selectedUnidad && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                {selectedUnidad.galeria && selectedUnidad.galeria.length > 0 && (
                  <div className="mb-4">
                    <img src={selectedUnidad.galeria[selectedImageIndex]} alt={selectedUnidad.nombre} className="w-full h-48 object-cover rounded-xl cursor-pointer" onClick={() => setInventarioView('galeria')} />
                    {selectedUnidad.galeria.length > 1 && (<div className="flex gap-2 mt-2 overflow-x-auto pb-2">{selectedUnidad.galeria.map((img, i) => (<img key={i} src={img} onClick={() => setSelectedImageIndex(i)} className={`w-12 h-12 object-cover rounded-lg cursor-pointer flex-shrink-0 ${i === selectedImageIndex ? 'ring-2 ring-emerald-400' : 'opacity-60'}`} />))}</div>)}
                  </div>
                )}
                <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold text-white">{selectedUnidad.nombre}</h2><span className={`${STATUS_COLORS[selectedUnidad.status]} text-white text-sm px-3 py-1 rounded-full`}>{STATUS_LABELS[selectedUnidad.status]}</span></div>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-white/80"><span>Tipo:</span><span className="font-semibold capitalize">{selectedUnidad.tipo}</span></div>
                  <div className="flex justify-between text-white/80"><span>Planta:</span><span className="font-semibold">{selectedUnidad.planta}</span></div>
                  <div className="flex justify-between text-white/80"><span>Superficie:</span><span className="font-semibold">{selectedUnidad.m2} m²</span></div>
                  <div className="flex justify-between text-white/80"><span>Precio:</span><span className="font-semibold text-emerald-400">{formatMoney(selectedUnidad.precio)}</span></div>
                  {selectedUnidad.vista && <div className="flex justify-between text-white/80"><span>Vista:</span><span className="font-semibold">{selectedUnidad.vista}</span></div>}
                  {selectedUnidad.compradorId && <div className="flex justify-between text-white/80"><span>Comprador:</span><span className="font-semibold text-blue-400">{getComprador(selectedUnidad.compradorId)?.name}</span></div>}
                  {selectedUnidad.notas && <div className="pt-3 border-t border-white/20"><span className="text-white/60 text-sm">Notas:</span><p className="text-white mt-1">{selectedUnidad.notas}</p></div>}
                </div>
                <div className="flex gap-3"><button onClick={() => handleEditUnidad(selectedUnidad)} className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600">Editar</button><button onClick={() => handleDeleteUnidad(selectedUnidad.id)} className="bg-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-600">Eliminar</button></div>
              </div>
            )}

            {inventarioView === 'galeria' && selectedUnidad && selectedUnidad.galeria && (
              <div className="fixed inset-0 bg-black z-50 flex flex-col">
                <div className="flex items-center justify-between p-4"><button onClick={() => setInventarioView('detail')} className="text-white text-2xl">←</button><span className="text-white">{selectedImageIndex + 1} / {selectedUnidad.galeria.length}</span><div className="w-8"></div></div>
                <div className="flex-1 flex items-center justify-center p-4"><img src={selectedUnidad.galeria[selectedImageIndex]} className="max-w-full max-h-full object-contain" /></div>
                <div className="flex gap-2 p-4 overflow-x-auto">{selectedUnidad.galeria.map((img, i) => (<img key={i} src={img} onClick={() => setSelectedImageIndex(i)} className={`w-16 h-16 object-cover rounded-lg cursor-pointer flex-shrink-0 ${i === selectedImageIndex ? 'ring-2 ring-emerald-400' : 'opacity-50'}`} />))}</div>
              </div>
            )}

            {inventarioView === 'rdc' && (
              <div className="space-y-4">
                <div className="bg-amber-500/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/30">
                  <h2 className="text-xl font-bold text-white mb-4">📜 Régimen de Condominio</h2>
                  <div className="space-y-4">
                    <div><label className="block text-white/60 text-sm mb-1">Nombre *</label><input type="text" value={rdcForm.nombre} onChange={e => setRdcForm({...rdcForm, nombre: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                    <div><label className="block text-white/60 text-sm mb-1">Fecha</label><input type="date" value={rdcForm.fecha} onChange={e => setRdcForm({...rdcForm, fecha: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                    <div><label className="block text-white/60 text-sm mb-1">Archivo *</label><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleRdcFileChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-500 file:text-white" />{rdcForm.archivoNombre && <p className="text-sm text-amber-400 mt-1">✓ {rdcForm.archivoNombre}</p>}</div>
                    <button onClick={handleSaveRdc} className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600">Guardar</button>
                  </div>
                </div>
                {rdcList.length > 0 && (<div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"><h3 className="text-lg font-bold text-white mb-4">Documentos</h3><div className="space-y-3">{rdcList.map(rdc => (<div key={rdc.id} className="bg-white/10 rounded-xl p-4 flex items-center justify-between"><div><h4 className="text-white font-semibold">{rdc.nombre}</h4><p className="text-white/60 text-sm">{rdc.fecha}</p></div><div className="flex gap-2"><a href={rdc.archivo} download={rdc.archivoNombre} className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600">📥</a><button onClick={() => handleDeleteRdc(rdc.id)} className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600">🗑️</button></div></div>))}</div></div>)}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fadeIn">
            <button onClick={() => setActiveSection(null)} className="mb-4 flex items-center gap-2 text-white/60 hover:text-white transition"><span>←</span> <span>Volver</span></button>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"><h2 className="text-xl font-bold text-white mb-4 capitalize">{activeSection}</h2><p className="text-white/60">Sección en desarrollo...</p></div>
          </div>
        )}
        <footer className="mt-12 text-center"><p className="text-white/40 text-sm">Hecho por <span className="text-amber-400">Colmena (C6)</span> • 2025</p></footer>
      </main>

      {showPinModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 w-full max-w-sm border border-white/20">
            <div className="text-center mb-6"><div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div><h2 className="text-xl font-bold text-white">Acceso Restringido</h2><p className="text-white/60 text-sm mt-1">Ingresa el PIN</p></div>
            <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => { setPin(e.target.value); setPinError(false); }} onKeyDown={e => e.key === 'Enter' && handlePinSubmit()} className={`w-full text-center text-2xl tracking-[1em] py-4 bg-white/10 border ${pinError ? 'border-red-500' : 'border-white/20'} rounded-xl text-white placeholder-white/30`} placeholder="••••" />
            {pinError && <p className="text-red-400 text-sm text-center mt-2">PIN incorrecto</p>}
            <div className="flex gap-3 mt-6"><button onClick={() => { setShowPinModal(false); setPin(''); setPinError(false); }} className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20">Cancelar</button><button onClick={handlePinSubmit} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600">Acceder</button></div>
          </div>
        </div>
      )}
      <style jsx>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.3s ease-out; }`}</style>
    </div>
  );
}
