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

// === INVERSIONISTAS ===
interface Distribucion {
  id: string;
  monto: number;
  fecha: string;
  concepto: 'rendimiento' | 'devolucion';
  comprobante?: string;
  notas?: string;
}

interface FEG {
  activo: boolean;
  banco: string;
  numeroFideicomiso: string;
  montoDepositado: number;
  fechaConstitucion: string;
  documentos: string[];
}

interface Inversion {
  id: string;
  monto: number;
  fechaAportacion: string;
  tipo: 'semilla' | 'desarrollo' | 'otro';
  porcentaje?: number;
  rendimientoPactado?: number;
  plazoMeses?: number;
  status: 'activa' | 'liquidada';
  feg?: FEG;
  distribuciones: Distribucion[];
}

interface Inversionista {
  id: string;
  nombre: string;
  tipoPersona: 'fisica' | 'moral';
  rfc: string;
  email: string;
  telefono: string;
  documentos: string[];
  inversiones: Inversion[];
}
// === CONSTRUCCION ===
interface FotoAvance {
  id: string;
  imagen: string;
  fecha: string;
  descripcion: string;
}

interface EtapaObra {
  id: string;
  nombre: string;
  avance: number;
  fechaInicio: string;
  fechaFinEstimada: string;
  status: 'pendiente' | 'en_proceso' | 'completada';
  notas: string;
  fotos: FotoAvance[];
}

// === GASTOS ===
interface Gasto {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  categoria: 'construccion' | 'permisos' | 'honorarios' | 'marketing' | 'administrativo' | 'servicios' | 'financiero' | 'otro';
  proveedor: string;
  facturado: boolean;
  comprobante?: string;
  comprobanteNombre?: string;
  notas: string;
}



const PIN_CORRECTO = '2835';
const countries = ["México", "EUA", "Canadá"];
const maritalStatuses = ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Unión Libre"];
const STATUS_COLORS = { disponible: 'bg-green-500', apartado: 'bg-yellow-500', vendido: 'bg-blue-500', escriturado: 'bg-purple-500' };
const STATUS_LABELS = { disponible: 'Disponible', apartado: 'Apartado', vendido: 'Vendido', escriturado: 'Escriturado' };
const PAGO_STATUS_COLORS = { pendiente: 'bg-yellow-500', pagado: 'bg-green-500', vencido: 'bg-red-500' };
const PAGO_TIPO_LABELS = { enganche: 'Enganche', mensualidad: 'Mensualidad', extraordinario: 'Extraordinario' };
const INVERSION_TIPO_LABELS = { semilla: 'Capital Semilla', desarrollo: 'Desarrollo', otro: 'Otro' };
const GASTO_CATEGORIAS = [
  { value: 'construccion', label: 'Construcción', icon: '🏗️', color: 'bg-orange-500' },
  { value: 'permisos', label: 'Permisos/Licencias', icon: '📋', color: 'bg-blue-500' },
  { value: 'honorarios', label: 'Honorarios', icon: '👔', color: 'bg-purple-500' },
  { value: 'marketing', label: 'Marketing/Ventas', icon: '📢', color: 'bg-pink-500' },
  { value: 'administrativo', label: 'Administrativo', icon: '📁', color: 'bg-gray-500' },
  { value: 'servicios', label: 'Servicios', icon: '💡', color: 'bg-yellow-500' },
  { value: 'financiero', label: 'Financiero', icon: '🏦', color: 'bg-green-500' },
  { value: 'otro', label: 'Otro', icon: '📦', color: 'bg-slate-500' },
];
const ETAPA_STATUS_COLORS = { pendiente: 'bg-gray-500', en_proceso: 'bg-yellow-500', completada: 'bg-green-500' };
const ETAPA_STATUS_LABELS = { pendiente: 'Pendiente', en_proceso: 'En Proceso', completada: 'Completada' };
const BANCOS = ['Banorte', 'BBVA', 'Santander', 'Scotiabank', 'HSBC', 'Banamex', 'Otro'];

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
  const [pagoForm, setPagoForm] = useState<Omit<Pago, 'id'>>({ monto: 0, fecha: '', tipo: 'mensualidad', status: 'pendiente', notas: '' });

  // Inversionistas state
  const [inversionistas, setInversionistas] = useState<Inversionista[]>([]);
  const [inversionistasView, setInversionistasView] = useState<'list' | 'form' | 'detail' | 'inversion' | 'distribucion'>('list');
  const [selectedInversionista, setSelectedInversionista] = useState<Inversionista | null>(null);
  const [editingInversionista, setEditingInversionista] = useState<Inversionista | null>(null);
  const [selectedInversion, setSelectedInversion] = useState<Inversion | null>(null);
  const [inversionistaForm, setInversionistaForm] = useState({ nombre: '', tipoPersona: 'fisica' as const, rfc: '', email: '', telefono: '', documentos: [] as string[] });
  const [inversionForm, setInversionForm] = useState({ monto: 0, fechaAportacion: '', tipo: 'desarrollo' as const, porcentaje: 0, rendimientoPactado: 0, plazoMeses: 12, status: 'activa' as const, usaFeg: false, fegBanco: '', fegNumero: '', fegMonto: 0, fegFecha: '' });
  
  // Construccion state
  const [etapas, setEtapas] = useState<EtapaObra[]>([]);
  const [construccionView, setConstruccionView] = useState<'list' | 'form' | 'detail' | 'foto'>('list');
  const [selectedEtapa, setSelectedEtapa] = useState<EtapaObra | null>(null);
  const [editingEtapa, setEditingEtapa] = useState<EtapaObra | null>(null);
  const [etapaForm, setEtapaForm] = useState({ nombre: '', avance: 0, fechaInicio: '', fechaFinEstimada: '', status: 'pendiente' as const, notas: '' });
  
  // Gastos state
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [gastosView, setGastosView] = useState<'list' | 'form' | 'detail'>('list');
  const [selectedGasto, setSelectedGasto] = useState<Gasto | null>(null);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [gastoForm, setGastoForm] = useState({ concepto: '', monto: 0, fecha: '', categoria: 'construccion' as const, proveedor: '', facturado: false, comprobante: '', comprobanteNombre: '', notas: '' });
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');

  const [fotoForm, setFotoForm] = useState({ imagen: '', fecha: '', descripcion: '' });

  const [distribucionForm, setDistribucionForm] = useState({ monto: 0, fecha: '', concepto: 'rendimiento' as const, notas: '' });

  useEffect(() => {
    const savedUnidades = localStorage.getItem('dev_unidades');
    const savedRdc = localStorage.getItem('dev_rdc');
    const savedCompradores = localStorage.getItem('dev_compradores');
    const savedInversionistas = localStorage.getItem('dev_inversionistas');
    const savedEtapas = localStorage.getItem('dev_etapas');
    const savedGastos = localStorage.getItem('dev_gastos');
    if (savedUnidades) setUnidades(JSON.parse(savedUnidades));
    if (savedRdc) setRdcList(JSON.parse(savedRdc));
    if (savedCompradores) setCompradores(JSON.parse(savedCompradores));
    if (savedInversionistas) setInversionistas(JSON.parse(savedInversionistas));
    if (savedEtapas) setEtapas(JSON.parse(savedEtapas));
    if (savedGastos) setGastos(JSON.parse(savedGastos));
  }, []);

  useEffect(() => { localStorage.setItem('dev_unidades', JSON.stringify(unidades)); }, [unidades]);
  useEffect(() => { localStorage.setItem('dev_rdc', JSON.stringify(rdcList)); }, [rdcList]);
  useEffect(() => { localStorage.setItem('dev_compradores', JSON.stringify(compradores)); }, [compradores]);
  useEffect(() => { localStorage.setItem('dev_inversionistas', JSON.stringify(inversionistas)); }, [inversionistas]);
  useEffect(() => { localStorage.setItem('dev_etapas', JSON.stringify(etapas)); }, [etapas]);
  useEffect(() => { localStorage.setItem('dev_gastos', JSON.stringify(gastos)); }, [gastos]);

  useEffect(() => {
    const checkInstalled = () => { const isStandalone = window.matchMedia('(display-mode: standalone)').matches; const isIosStandalone = (window.navigator as any).standalone === true; setIsInstalled(isStandalone || isIosStandalone); };
    checkInstalled(); const mediaQuery = window.matchMedia('(display-mode: standalone)'); mediaQuery.addEventListener('change', checkInstalled); return () => mediaQuery.removeEventListener('change', checkInstalled);
  }, []);

  useEffect(() => { const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); }; window.addEventListener('beforeinstallprompt', handler); return () => window.removeEventListener('beforeinstallprompt', handler); }, []);

  const handleInstall = async () => { if (deferredPrompt) { deferredPrompt.prompt(); const result = await deferredPrompt.userChoice; if (result.outcome === 'accepted') setIsInstalled(true); setDeferredPrompt(null); } else { alert('Para instalar:\niPhone: Compartir → Agregar a inicio\nAndroid: Menú → Instalar app'); } };
  const handleSectionClick = (section: string) => { setActiveSection(section); if (section === 'inventario') setInventarioView('list'); if (section === 'compradores') setCompradoresView('list'); if (section === 'pagos') setPagosView('list'); if (section === 'inversionistas') setInversionistasView('list'); if (section === 'construccion') setConstruccionView('list'); if (section === 'gastos') setGastosView('list'); };
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
        if (editingPago) { return { ...u, pagos: pagos.map(p => p.id === editingPago.id ? newPago : p) }; }
        else { return { ...u, pagos: [...pagos, newPago] }; }
      }
      return u;
    }));
    setPagoForm({ monto: 0, fecha: '', tipo: 'mensualidad', status: 'pendiente', notas: '' });
    setEditingPago(null); setPagosView('detail');
    const updated = unidades.find(u => u.id === selectedUnidadPago.id);
    if (updated) setSelectedUnidadPago({ ...updated, pagos: editingPago ? updated.pagos?.map(p => p.id === editingPago.id ? newPago : p) : [...(updated.pagos || []), newPago] });
  };

  const handleDeletePago = (pagoId: string) => {
    if (!confirm('¿Eliminar pago?') || !selectedUnidadPago) return;
    setUnidades(unidades.map(u => { if (u.id === selectedUnidadPago.id) { return { ...u, pagos: (u.pagos || []).filter(p => p.id !== pagoId) }; } return u; }));
    setSelectedUnidadPago({ ...selectedUnidadPago, pagos: (selectedUnidadPago.pagos || []).filter(p => p.id !== pagoId) });
  };

  const handleMarcarPagado = (pago: Pago) => {
    if (!selectedUnidadPago) return;
    const updatedPago = { ...pago, status: 'pagado' as const, fechaPago: new Date().toISOString().split('T')[0] };
    setUnidades(unidades.map(u => { if (u.id === selectedUnidadPago.id) { return { ...u, pagos: (u.pagos || []).map(p => p.id === pago.id ? updatedPago : p) }; } return u; }));
    setSelectedUnidadPago({ ...selectedUnidadPago, pagos: (selectedUnidadPago.pagos || []).map(p => p.id === pago.id ? updatedPago : p) });
  };

  // Inversionistas handlers
  const handleSaveInversionista = () => {
    if (!inversionistaForm.nombre) { alert('Ingresa el nombre'); return; }
    if (editingInversionista) {
      setInversionistas(inversionistas.map(i => i.id === editingInversionista.id ? { ...inversionistaForm, id: editingInversionista.id, inversiones: i.inversiones } : i));
    } else {
      setInversionistas([...inversionistas, { ...inversionistaForm, id: Date.now().toString(), inversiones: [] }]);
    }
    setInversionistaForm({ nombre: '', tipoPersona: 'fisica', rfc: '', email: '', telefono: '', documentos: [] });
    setEditingInversionista(null); setInversionistasView('list');
  };

  const handleDeleteInversionista = (id: string) => {
    if (!confirm('¿Eliminar inversionista y todas sus inversiones?')) return;
    setInversionistas(inversionistas.filter(i => i.id !== id));
    setInversionistasView('list');
  };

  const handleSaveInversion = () => {
    if (!inversionForm.monto || !inversionForm.fechaAportacion) { alert('Completa monto y fecha'); return; }
    if (!selectedInversionista) return;
    
    const newInversion: Inversion = {
      id: selectedInversion?.id || Date.now().toString(),
      monto: inversionForm.monto,
      fechaAportacion: inversionForm.fechaAportacion,
      tipo: inversionForm.tipo,
      porcentaje: inversionForm.porcentaje || undefined,
      rendimientoPactado: inversionForm.rendimientoPactado || undefined,
      plazoMeses: inversionForm.plazoMeses || undefined,
      status: inversionForm.status,
      feg: inversionForm.usaFeg ? { activo: true, banco: inversionForm.fegBanco, numeroFideicomiso: inversionForm.fegNumero, montoDepositado: inversionForm.fegMonto, fechaConstitucion: inversionForm.fegFecha, documentos: [] } : undefined,
      distribuciones: selectedInversion?.distribuciones || []
    };

    setInversionistas(inversionistas.map(inv => {
      if (inv.id === selectedInversionista.id) {
        if (selectedInversion) { return { ...inv, inversiones: inv.inversiones.map(i => i.id === selectedInversion.id ? newInversion : i) }; }
        else { return { ...inv, inversiones: [...inv.inversiones, newInversion] }; }
      }
      return inv;
    }));

    setInversionForm({ monto: 0, fechaAportacion: '', tipo: 'desarrollo', porcentaje: 0, rendimientoPactado: 0, plazoMeses: 12, status: 'activa', usaFeg: false, fegBanco: '', fegNumero: '', fegMonto: 0, fegFecha: '' });
    setSelectedInversion(null); setInversionistasView('detail');
    // Actualizar selectedInversionista
    const updated = inversionistas.find(i => i.id === selectedInversionista.id);
    if (updated) {
      const newInversiones = selectedInversion ? updated.inversiones.map(i => i.id === selectedInversion.id ? newInversion : i) : [...updated.inversiones, newInversion];
      setSelectedInversionista({ ...updated, inversiones: newInversiones });
    }
  };

  const handleDeleteInversion = (inversionId: string) => {
    if (!confirm('¿Eliminar inversión?') || !selectedInversionista) return;
    setInversionistas(inversionistas.map(inv => {
      if (inv.id === selectedInversionista.id) { return { ...inv, inversiones: inv.inversiones.filter(i => i.id !== inversionId) }; }
      return inv;
    }));
    setSelectedInversionista({ ...selectedInversionista, inversiones: selectedInversionista.inversiones.filter(i => i.id !== inversionId) });
  };

  const handleSaveDistribucion = () => {
    if (!distribucionForm.monto || !distribucionForm.fecha) { alert('Completa monto y fecha'); return; }
    if (!selectedInversionista || !selectedInversion) return;
    
    const newDist: Distribucion = { id: Date.now().toString(), ...distribucionForm };
    
    setInversionistas(inversionistas.map(inv => {
      if (inv.id === selectedInversionista.id) {
        return { ...inv, inversiones: inv.inversiones.map(i => i.id === selectedInversion.id ? { ...i, distribuciones: [...i.distribuciones, newDist] } : i) };
      }
      return inv;
    }));

    setDistribucionForm({ monto: 0, fecha: '', concepto: 'rendimiento', notas: '' });
    setInversionistasView('detail');
    // Actualizar estado local
    setSelectedInversion({ ...selectedInversion, distribuciones: [...selectedInversion.distribuciones, newDist] });
    const updatedInv = inversionistas.find(i => i.id === selectedInversionista.id);
    if (updatedInv) {
      setSelectedInversionista({ ...updatedInv, inversiones: updatedInv.inversiones.map(i => i.id === selectedInversion.id ? { ...i, distribuciones: [...i.distribuciones, newDist] } : i) });
    }
  };

  

  // Construccion handlers
  const handleSaveEtapa = () => {
    if (!etapaForm.nombre) { alert('Ingresa el nombre de la etapa'); return; }
    if (editingEtapa) {
      setEtapas(etapas.map(e => e.id === editingEtapa.id ? { ...etapaForm, id: editingEtapa.id, fotos: e.fotos } : e));
    } else {
      setEtapas([...etapas, { ...etapaForm, id: Date.now().toString(), fotos: [] }]);
    }
    setEtapaForm({ nombre: '', avance: 0, fechaInicio: '', fechaFinEstimada: '', status: 'pendiente', notas: '' });
    setEditingEtapa(null); setConstruccionView('list');
  };

  const handleDeleteEtapa = (id: string) => {
    if (!confirm('¿Eliminar etapa?')) return;
    setEtapas(etapas.filter(e => e.id !== id));
    setConstruccionView('list');
  };

  const handleAddFoto = () => {
    if (!fotoForm.imagen || !selectedEtapa) return;
    const newFoto: FotoAvance = { id: Date.now().toString(), ...fotoForm, fecha: fotoForm.fecha || new Date().toISOString().split('T')[0] };
    setEtapas(etapas.map(e => e.id === selectedEtapa.id ? { ...e, fotos: [...e.fotos, newFoto] } : e));
    setSelectedEtapa({ ...selectedEtapa, fotos: [...selectedEtapa.fotos, newFoto] });
    setFotoForm({ imagen: '', fecha: '', descripcion: '' });
    setConstruccionView('detail');
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => { setFotoForm({ ...fotoForm, imagen: ev.target?.result as string }); };
      reader.readAsDataURL(file);
    }
  };

  

  // Gastos handlers
  const handleSaveGasto = () => {
    if (!gastoForm.concepto || !gastoForm.monto) { alert('Ingresa concepto y monto'); return; }
    if (editingGasto) {
      setGastos(gastos.map(g => g.id === editingGasto.id ? { ...gastoForm, id: editingGasto.id } : g));
    } else {
      setGastos([...gastos, { ...gastoForm, id: Date.now().toString(), fecha: gastoForm.fecha || new Date().toISOString().split('T')[0] }]);
    }
    setGastoForm({ concepto: '', monto: 0, fecha: '', categoria: 'construccion', proveedor: '', facturado: false, comprobante: '', comprobanteNombre: '', notas: '' });
    setEditingGasto(null); setGastosView('list');
  };

  const handleDeleteGasto = (id: string) => {
    if (!confirm('¿Eliminar gasto?')) return;
    setGastos(gastos.filter(g => g.id !== id));
    setGastosView('list');
  };

  const handleComprobanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => { setGastoForm({ ...gastoForm, comprobante: ev.target?.result as string, comprobanteNombre: file.name }); };
      reader.readAsDataURL(file);
    }
  };

  const getCategoriaInfo = (cat: string) => GASTO_CATEGORIAS.find(c => c.value === cat) || GASTO_CATEGORIAS[7];

  const handleDeleteFoto = (fotoId: string) => {
    if (!confirm('¿Eliminar foto?') || !selectedEtapa) return;
    setEtapas(etapas.map(e => e.id === selectedEtapa.id ? { ...e, fotos: e.fotos.filter(f => f.id !== fotoId) } : e));
    setSelectedEtapa({ ...selectedEtapa, fotos: selectedEtapa.fotos.filter(f => f.id !== fotoId) });
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

  // Inversionistas stats
  const totalInvertido = inversionistas.reduce((acc, inv) => acc + inv.inversiones.filter(i => i.status === 'activa').reduce((a, i) => a + i.monto, 0), 0);
  const totalEnFeg = inversionistas.reduce((acc, inv) => acc + inv.inversiones.filter(i => i.feg?.activo).reduce((a, i) => a + (i.feg?.montoDepositado || 0), 0), 0);
  
  // Construccion stats
  const avanceGeneral = etapas.length > 0 ? Math.round(etapas.reduce((a, e) => a + e.avance, 0) / etapas.length) : 0;
  const etapasCompletadas = etapas.filter(e => e.status === 'completada').length;
  
  // Gastos stats
  const totalGastos = gastos.reduce((a, g) => a + g.monto, 0);
  const gastosPorCategoria = GASTO_CATEGORIAS.map(cat => ({
    ...cat,
    total: gastos.filter(g => g.categoria === cat.value).reduce((a, g) => a + g.monto, 0),
    count: gastos.filter(g => g.categoria === cat.value).length
  })).filter(c => c.total > 0);
  const gastosFiltrados = filtroCategoria === 'todas' ? gastos : gastos.filter(g => g.categoria === filtroCategoria);
  const mesActual = new Date().toISOString().slice(0, 7);
  const gastosMesActual = gastos.filter(g => g.fecha.startsWith(mesActual)).reduce((a, g) => a + g.monto, 0);

  const etapasEnProceso = etapas.filter(e => e.status === 'en_proceso').length;

  const totalDistribuido = inversionistas.reduce((acc, inv) => acc + inv.inversiones.reduce((a, i) => a + i.distribuciones.reduce((d, dist) => d + dist.monto, 0), 0), 0);

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
            <button onClick={() => handleSectionClick('gastos')} className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95"><div className="w-full aspect-square overflow-hidden"><img src="/icon-gastos.png" alt="Gastos" className="w-full h-full object-cover" /></div><div className="p-3 text-center"><span className="text-white font-semibold text-lg block">Gastos</span><span className="text-white/50 text-xs">Control de egresos</span></div></button>
          </div>
        ) : activeSection === 'inversionistas' ? (
          <div className="animate-fadeIn">
            <button onClick={() => { if (inversionistasView === 'list') setActiveSection(null); else if (inversionistasView === 'inversion' || inversionistasView === 'distribucion') setInversionistasView('detail'); else setInversionistasView('list'); }} className="mb-4 flex items-center gap-2 text-white/60 hover:text-white transition"><span>←</span> <span>Volver</span></button>

            {inversionistasView === 'list' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">🏦 Inversionistas</h2>
                  <button onClick={() => { setEditingInversionista(null); setInversionistaForm({ nombre: '', tipoPersona: 'fisica', rfc: '', email: '', telefono: '', documentos: [] }); setInversionistasView('form'); }} className="bg-emerald-500 text-white py-2 px-4 rounded-xl font-semibold hover:bg-emerald-600">+ Nuevo</button>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-emerald-500/20 rounded-xl p-3 text-center"><div className="text-lg font-bold text-emerald-400">{formatMoney(totalInvertido)}</div><div className="text-xs text-white/60">Invertido</div></div>
                  <div className="bg-blue-500/20 rounded-xl p-3 text-center"><div className="text-lg font-bold text-blue-400">{formatMoney(totalEnFeg)}</div><div className="text-xs text-white/60">En FEG</div></div>
                  <div className="bg-purple-500/20 rounded-xl p-3 text-center"><div className="text-lg font-bold text-purple-400">{formatMoney(totalDistribuido)}</div><div className="text-xs text-white/60">Distribuido</div></div>
                </div>

                <div className="space-y-3">
                  {inversionistas.length === 0 ? (<div className="bg-white/10 rounded-xl p-6 text-center text-white/60">No hay inversionistas registrados</div>) : (
                    inversionistas.map(inv => {
                      const totalInv = inv.inversiones.filter(i => i.status === 'activa').reduce((a, i) => a + i.monto, 0);
                      const totalDist = inv.inversiones.reduce((a, i) => a + i.distribuciones.reduce((d, dist) => d + dist.monto, 0), 0);
                      return (
                        <div key={inv.id} onClick={() => { setSelectedInversionista(inv); setInversionistasView('detail'); }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-white font-semibold">{inv.nombre}</h3>
                              <p className="text-white/60 text-sm">{inv.tipoPersona === 'fisica' ? 'Persona Física' : 'Persona Moral'}</p>
                            </div>
                            <span className="text-xs text-white/40">{inv.inversiones.length} inversión{inv.inversiones.length !== 1 ? 'es' : ''}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-emerald-400">{formatMoney(totalInv)}</span>
                            {totalDist > 0 && <span className="text-purple-400">Dist: {formatMoney(totalDist)}</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {inversionistasView === 'form' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">{editingInversionista ? 'Editar Inversionista' : 'Nuevo Inversionista'}</h2>
                <div className="space-y-4">
                  <div><label className="block text-white/60 text-sm mb-1">Nombre *</label><input type="text" value={inversionistaForm.nombre} onChange={e => setInversionistaForm({...inversionistaForm, nombre: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  <div><label className="block text-white/60 text-sm mb-1">Tipo</label><select value={inversionistaForm.tipoPersona} onChange={e => setInversionistaForm({...inversionistaForm, tipoPersona: e.target.value as any})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"><option value="fisica">Persona Física</option><option value="moral">Persona Moral</option></select></div>
                  <div><label className="block text-white/60 text-sm mb-1">RFC</label><input type="text" value={inversionistaForm.rfc} onChange={e => setInversionistaForm({...inversionistaForm, rfc: e.target.value.toUpperCase()})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white uppercase" maxLength={13} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">Email</label><input type="email" value={inversionistaForm.email} onChange={e => setInversionistaForm({...inversionistaForm, email: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                    <div><label className="block text-white/60 text-sm mb-1">Teléfono</label><input type="text" value={inversionistaForm.telefono} onChange={e => setInversionistaForm({...inversionistaForm, telefono: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={handleSaveInversionista} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600">Guardar</button>
                    <button onClick={() => setInversionistasView('list')} className="bg-white/20 text-white py-3 px-6 rounded-xl hover:bg-white/30">Cancelar</button>
                  </div>
                </div>
              </div>
            )}

            {inversionistasView === 'detail' && selectedInversionista && (
              <>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedInversionista.nombre}</h2>
                      <p className="text-white/60 text-sm">{selectedInversionista.tipoPersona === 'fisica' ? 'Persona Física' : 'Persona Moral'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingInversionista(selectedInversionista); setInversionistaForm({ nombre: selectedInversionista.nombre, tipoPersona: selectedInversionista.tipoPersona, rfc: selectedInversionista.rfc, email: selectedInversionista.email, telefono: selectedInversionista.telefono, documentos: selectedInversionista.documentos }); setInversionistasView('form'); }} className="bg-blue-500 text-white p-2 rounded-lg text-sm">✏️</button>
                      <button onClick={() => handleDeleteInversionista(selectedInversionista.id)} className="bg-red-500 text-white p-2 rounded-lg text-sm">🗑️</button>
                    </div>
                  </div>
                  {selectedInversionista.rfc && <p className="text-white/60 text-sm">RFC: {selectedInversionista.rfc}</p>}
                  {selectedInversionista.email && <p className="text-white/60 text-sm">📧 {selectedInversionista.email}</p>}
                  {selectedInversionista.telefono && <p className="text-white/60 text-sm">📞 {selectedInversionista.telefono}</p>}
                </div>

                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-white">Inversiones</h3>
                  <button onClick={() => { setSelectedInversion(null); setInversionForm({ monto: 0, fechaAportacion: '', tipo: 'desarrollo', porcentaje: 0, rendimientoPactado: 0, plazoMeses: 12, status: 'activa', usaFeg: false, fegBanco: '', fegNumero: '', fegMonto: 0, fegFecha: '' }); setInversionistasView('inversion'); }} className="bg-emerald-500 text-white py-2 px-3 rounded-xl text-sm font-semibold hover:bg-emerald-600">+ Inversión</button>
                </div>

                <div className="space-y-3">
                  {selectedInversionista.inversiones.length === 0 ? (<div className="bg-white/10 rounded-xl p-4 text-center text-white/60 text-sm">Sin inversiones registradas</div>) : (
                    selectedInversionista.inversiones.map(inv => (
                      <div key={inv.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-xs text-white/40">{INVERSION_TIPO_LABELS[inv.tipo]}</span>
                            <div className="text-white font-bold text-lg">{formatMoney(inv.monto)}</div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${inv.status === 'activa' ? 'bg-green-500' : 'bg-gray-500'} text-white`}>{inv.status}</span>
                        </div>
                        <div className="text-white/60 text-sm space-y-1">
                          <p>📅 {inv.fechaAportacion}</p>
                          {inv.plazoMeses && <p>⏱️ {inv.plazoMeses} meses</p>}
                          {inv.rendimientoPactado && <p>📈 {inv.rendimientoPactado}% rendimiento</p>}
                          {inv.feg?.activo && <p className="text-blue-400">🏦 FEG: {inv.feg.banco} - {formatMoney(inv.feg.montoDepositado)}</p>}
                          {inv.distribuciones.length > 0 && <p className="text-purple-400">💸 {inv.distribuciones.length} distribución{inv.distribuciones.length !== 1 ? 'es' : ''}: {formatMoney(inv.distribuciones.reduce((a, d) => a + d.monto, 0))}</p>}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => { setSelectedInversion(inv); setDistribucionForm({ monto: 0, fecha: '', concepto: 'rendimiento', notas: '' }); setInversionistasView('distribucion'); }} className="flex-1 bg-purple-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-purple-600">+ Distribución</button>
                          <button onClick={() => { setSelectedInversion(inv); setInversionForm({ monto: inv.monto, fechaAportacion: inv.fechaAportacion, tipo: inv.tipo, porcentaje: inv.porcentaje || 0, rendimientoPactado: inv.rendimientoPactado || 0, plazoMeses: inv.plazoMeses || 12, status: inv.status, usaFeg: !!inv.feg?.activo, fegBanco: inv.feg?.banco || '', fegNumero: inv.feg?.numeroFideicomiso || '', fegMonto: inv.feg?.montoDepositado || 0, fegFecha: inv.feg?.fechaConstitucion || '' }); setInversionistasView('inversion'); }} className="bg-blue-500 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-600">✏️</button>
                          <button onClick={() => handleDeleteInversion(inv.id)} className="bg-red-500 text-white py-2 px-4 rounded-lg text-sm hover:bg-red-600">🗑️</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {inversionistasView === 'inversion' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">{selectedInversion ? 'Editar Inversión' : 'Nueva Inversión'}</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">Monto *</label><input type="number" value={inversionForm.monto} onChange={e => setInversionForm({...inversionForm, monto: parseFloat(e.target.value) || 0})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                    <div><label className="block text-white/60 text-sm mb-1">Fecha Aportación *</label><input type="date" value={inversionForm.fechaAportacion} onChange={e => setInversionForm({...inversionForm, fechaAportacion: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">Tipo</label><select value={inversionForm.tipo} onChange={e => setInversionForm({...inversionForm, tipo: e.target.value as any})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"><option value="semilla">Capital Semilla</option><option value="desarrollo">Desarrollo</option><option value="otro">Otro</option></select></div>
                    <div><label className="block text-white/60 text-sm mb-1">Status</label><select value={inversionForm.status} onChange={e => setInversionForm({...inversionForm, status: e.target.value as any})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"><option value="activa">Activa</option><option value="liquidada">Liquidada</option></select></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">% Participación</label><input type="number" value={inversionForm.porcentaje} onChange={e => setInversionForm({...inversionForm, porcentaje: parseFloat(e.target.value) || 0})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                    <div><label className="block text-white/60 text-sm mb-1">Rendimiento %</label><input type="number" value={inversionForm.rendimientoPactado} onChange={e => setInversionForm({...inversionForm, rendimientoPactado: parseFloat(e.target.value) || 0})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                    <div><label className="block text-white/60 text-sm mb-1">Plazo (meses)</label><input type="number" value={inversionForm.plazoMeses} onChange={e => setInversionForm({...inversionForm, plazoMeses: parseInt(e.target.value) || 0})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  </div>
                  
                  {/* FEG Section */}
                  <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                    <label className="flex items-center gap-3 cursor-pointer mb-3">
                      <input type="checkbox" checked={inversionForm.usaFeg} onChange={e => setInversionForm({...inversionForm, usaFeg: e.target.checked})} className="w-5 h-5 rounded" />
                      <span className="text-white font-medium">🏦 Fideicomiso en Garantía (FEG)</span>
                    </label>
                    {inversionForm.usaFeg && (
                      <div className="space-y-3 mt-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-white/60 text-sm mb-1">Banco</label><select value={inversionForm.fegBanco} onChange={e => setInversionForm({...inversionForm, fegBanco: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"><option value="">Seleccionar...</option>{BANCOS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                          <div><label className="block text-white/60 text-sm mb-1">No. Fideicomiso</label><input type="text" value={inversionForm.fegNumero} onChange={e => setInversionForm({...inversionForm, fegNumero: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-white/60 text-sm mb-1">Monto Depositado</label><input type="number" value={inversionForm.fegMonto} onChange={e => setInversionForm({...inversionForm, fegMonto: parseFloat(e.target.value) || 0})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                          <div><label className="block text-white/60 text-sm mb-1">Fecha Constitución</label><input type="date" value={inversionForm.fegFecha} onChange={e => setInversionForm({...inversionForm, fegFecha: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button onClick={handleSaveInversion} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600">Guardar</button>
                    <button onClick={() => setInversionistasView('detail')} className="bg-white/20 text-white py-3 px-6 rounded-xl hover:bg-white/30">Cancelar</button>
                  </div>
                </div>
              </div>
            )}

            {inversionistasView === 'distribucion' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">Nueva Distribución</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">Monto *</label><input type="number" value={distribucionForm.monto} onChange={e => setDistribucionForm({...distribucionForm, monto: parseFloat(e.target.value) || 0})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                    <div><label className="block text-white/60 text-sm mb-1">Fecha *</label><input type="date" value={distribucionForm.fecha} onChange={e => setDistribucionForm({...distribucionForm, fecha: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  </div>
                  <div><label className="block text-white/60 text-sm mb-1">Concepto</label><select value={distribucionForm.concepto} onChange={e => setDistribucionForm({...distribucionForm, concepto: e.target.value as any})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"><option value="rendimiento">Rendimiento</option><option value="devolucion">Devolución de Capital</option></select></div>
                  <div><label className="block text-white/60 text-sm mb-1">Notas</label><input type="text" value={distribucionForm.notas} onChange={e => setDistribucionForm({...distribucionForm, notas: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={handleSaveDistribucion} className="flex-1 bg-purple-500 text-white py-3 rounded-xl font-semibold hover:bg-purple-600">Guardar</button>
                    <button onClick={() => setInversionistasView('detail')} className="bg-white/20 text-white py-3 px-6 rounded-xl hover:bg-white/30">Cancelar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeSection === 'construccion' ? (
          <div className="animate-fadeIn">
            <button onClick={() => { if (construccionView === 'list') setActiveSection(null); else if (construccionView === 'foto') setConstruccionView('detail'); else setConstruccionView('list'); }} className="mb-4 flex items-center gap-2 text-white/60 hover:text-white transition"><span>←</span> <span>Volver</span></button>

            {construccionView === 'list' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">🏗️ Construcción</h2>
                  <button onClick={() => { setEditingEtapa(null); setEtapaForm({ nombre: '', avance: 0, fechaInicio: '', fechaFinEstimada: '', status: 'pendiente', notas: '' }); setConstruccionView('form'); }} className="bg-emerald-500 text-white py-2 px-4 rounded-xl font-semibold hover:bg-emerald-600">+ Etapa</button>
                </div>
                
                {/* Progress General */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-semibold">Avance General</span>
                    <span className="text-2xl font-bold text-emerald-400">{avanceGeneral}%</span>
                  </div>
                  <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500" style={{ width: `${avanceGeneral}%` }}></div>
                  </div>
                  <div className="flex justify-between text-sm text-white/60 mt-2">
                    <span>{etapasCompletadas} completadas</span>
                    <span>{etapasEnProceso} en proceso</span>
                    <span>{etapas.length} total</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {etapas.length === 0 ? (<div className="bg-white/10 rounded-xl p-6 text-center text-white/60">No hay etapas registradas</div>) : (
                    etapas.map(e => (
                      <div key={e.id} onClick={() => { setSelectedEtapa(e); setConstruccionView('detail'); }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-white font-semibold">{e.nombre}</h3>
                          <span className={`${ETAPA_STATUS_COLORS[e.status]} text-white text-xs px-2 py-1 rounded-full`}>{ETAPA_STATUS_LABELS[e.status]}</span>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${e.avance}%` }}></div>
                          </div>
                          <span className="text-emerald-400 font-semibold text-sm">{e.avance}%</span>
                        </div>
                        <div className="flex justify-between text-xs text-white/50">
                          {e.fechaInicio && <span>Inicio: {e.fechaInicio}</span>}
                          {e.fotos.length > 0 && <span>📷 {e.fotos.length} fotos</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {construccionView === 'form' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">{editingEtapa ? 'Editar Etapa' : 'Nueva Etapa'}</h2>
                <div className="space-y-4">
                  <div><label className="block text-white/60 text-sm mb-1">Nombre *</label><input type="text" value={etapaForm.nombre} onChange={e => setEtapaForm({...etapaForm, nombre: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" placeholder="Ej: Cimentación, Estructura..." /></div>
                  <div><label className="block text-white/60 text-sm mb-1">Avance (%)</label><input type="range" min="0" max="100" value={etapaForm.avance} onChange={e => setEtapaForm({...etapaForm, avance: parseInt(e.target.value)})} className="w-full" /><div className="text-center text-emerald-400 font-bold text-xl">{etapaForm.avance}%</div></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">Fecha Inicio</label><input type="date" value={etapaForm.fechaInicio} onChange={e => setEtapaForm({...etapaForm, fechaInicio: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                    <div><label className="block text-white/60 text-sm mb-1">Fecha Fin Est.</label><input type="date" value={etapaForm.fechaFinEstimada} onChange={e => setEtapaForm({...etapaForm, fechaFinEstimada: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  </div>
                  <div><label className="block text-white/60 text-sm mb-1">Status</label><select value={etapaForm.status} onChange={e => setEtapaForm({...etapaForm, status: e.target.value as any})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"><option value="pendiente">Pendiente</option><option value="en_proceso">En Proceso</option><option value="completada">Completada</option></select></div>
                  <div><label className="block text-white/60 text-sm mb-1">Notas</label><textarea value={etapaForm.notas} onChange={e => setEtapaForm({...etapaForm, notas: e.target.value})} rows={2} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white resize-none" /></div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={handleSaveEtapa} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600">Guardar</button>
                    <button onClick={() => setConstruccionView('list')} className="bg-white/20 text-white py-3 px-6 rounded-xl hover:bg-white/30">Cancelar</button>
                  </div>
                </div>
              </div>
            )}

            {construccionView === 'detail' && selectedEtapa && (
              <>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedEtapa.nombre}</h2>
                      <span className={`${ETAPA_STATUS_COLORS[selectedEtapa.status]} text-white text-xs px-2 py-1 rounded-full`}>{ETAPA_STATUS_LABELS[selectedEtapa.status]}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingEtapa(selectedEtapa); setEtapaForm({ nombre: selectedEtapa.nombre, avance: selectedEtapa.avance, fechaInicio: selectedEtapa.fechaInicio, fechaFinEstimada: selectedEtapa.fechaFinEstimada, status: selectedEtapa.status, notas: selectedEtapa.notas }); setConstruccionView('form'); }} className="bg-blue-500 text-white p-2 rounded-lg text-sm">✏️</button>
                      <button onClick={() => handleDeleteEtapa(selectedEtapa.id)} className="bg-red-500 text-white p-2 rounded-lg text-sm">🗑️</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedEtapa.avance}%` }}></div>
                    </div>
                    <span className="text-emerald-400 font-bold">{selectedEtapa.avance}%</span>
                  </div>
                  {selectedEtapa.fechaInicio && <p className="text-white/60 text-sm">📅 Inicio: {selectedEtapa.fechaInicio}</p>}
                  {selectedEtapa.fechaFinEstimada && <p className="text-white/60 text-sm">🏁 Fin est.: {selectedEtapa.fechaFinEstimada}</p>}
                  {selectedEtapa.notas && <p className="text-white/40 text-sm mt-2">{selectedEtapa.notas}</p>}
                </div>

                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-white">📷 Fotos de Avance</h3>
                  <button onClick={() => { setFotoForm({ imagen: '', fecha: '', descripcion: '' }); setConstruccionView('foto'); }} className="bg-emerald-500 text-white py-2 px-3 rounded-xl text-sm font-semibold hover:bg-emerald-600">+ Foto</button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {selectedEtapa.fotos.length === 0 ? (<div className="col-span-2 bg-white/10 rounded-xl p-4 text-center text-white/60 text-sm">Sin fotos</div>) : (
                    selectedEtapa.fotos.map(f => (
                      <div key={f.id} className="bg-white/10 rounded-xl overflow-hidden border border-white/20">
                        <img src={f.imagen} alt={f.descripcion} className="w-full h-32 object-cover" />
                        <div className="p-2">
                          <p className="text-white/60 text-xs">{f.fecha}</p>
                          {f.descripcion && <p className="text-white text-sm truncate">{f.descripcion}</p>}
                          <button onClick={() => handleDeleteFoto(f.id)} className="mt-2 text-red-400 text-xs">🗑️ Eliminar</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {construccionView === 'foto' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">Nueva Foto</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Imagen *</label>
                    <input type="file" accept="image/*" onChange={handleFotoChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-500 file:text-white" />
                    {fotoForm.imagen && <img src={fotoForm.imagen} alt="Preview" className="mt-3 w-full h-40 object-cover rounded-xl" />}
                  </div>
                  <div><label className="block text-white/60 text-sm mb-1">Fecha</label><input type="date" value={fotoForm.fecha} onChange={e => setFotoForm({...fotoForm, fecha: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  <div><label className="block text-white/60 text-sm mb-1">Descripción</label><input type="text" value={fotoForm.descripcion} onChange={e => setFotoForm({...fotoForm, descripcion: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" placeholder="Avance de la etapa..." /></div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={handleAddFoto} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600">Guardar</button>
                    <button onClick={() => setConstruccionView('detail')} className="bg-white/20 text-white py-3 px-6 rounded-xl hover:bg-white/30">Cancelar</button>
                  </div>
                </div>
              </div>
            )}
          </div>

        ) : activeSection === 'pagos' ? (
          <div className="animate-fadeIn">
            <button onClick={() => { if (pagosView === 'list') setActiveSection(null); else if (pagosView === 'form') setPagosView('detail'); else setPagosView('list'); }} className="mb-4 flex items-center gap-2 text-white/60 hover:text-white transition"><span>←</span> <span>Volver</span></button>

            {pagosView === 'list' && (
              <>
                <h2 className="text-xl font-bold text-white mb-4">💰 Cobranza</h2>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-green-500/20 rounded-xl p-3 text-center"><div className="text-lg font-bold text-green-400">{formatMoney(totalCobrado)}</div><div className="text-xs text-white/60">Cobrado</div></div>
                  <div className="bg-yellow-500/20 rounded-xl p-3 text-center"><div className="text-lg font-bold text-yellow-400">{formatMoney(totalPendiente)}</div><div className="text-xs text-white/60">Pendiente</div></div>
                  <div className="bg-red-500/20 rounded-xl p-3 text-center"><div className="text-lg font-bold text-red-400">{pagosVencidos}</div><div className="text-xs text-white/60">Vencidos</div></div>
                </div>
                <div className="space-y-3">
                  {unidadesConPagos.length === 0 ? (<div className="bg-white/10 rounded-xl p-6 text-center text-white/60"><p>No hay unidades con pagos</p><p className="text-sm mt-2">Asigna un comprador a una unidad en Inventario</p></div>) : (
                    unidadesConPagos.map(u => {
                      const comprador = getComprador(u.compradorId);
                      const pagos = u.pagos || [];
                      const pendientes = pagos.filter(p => p.status === 'pendiente' || p.status === 'vencido');
                      const totalUnidad = pagos.reduce((a, p) => a + p.monto, 0);
                      const pagadoUnidad = pagos.filter(p => p.status === 'pagado').reduce((a, p) => a + p.monto, 0);
                      return (
                        <div key={u.id} onClick={() => { setSelectedUnidadPago(u); setPagosView('detail'); }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition">
                          <div className="flex justify-between items-start mb-2"><div><h3 className="text-white font-semibold">{u.nombre}</h3><p className="text-white/60 text-sm">{comprador?.name || 'Sin comprador'}</p></div><span className={`${STATUS_COLORS[u.status]} text-white text-xs px-2 py-1 rounded-full`}>{STATUS_LABELS[u.status]}</span></div>
                          <div className="flex justify-between items-center"><div className="text-sm"><span className="text-green-400">{formatMoney(pagadoUnidad)}</span><span className="text-white/40"> / {formatMoney(totalUnidad)}</span></div>{pendientes.length > 0 && (<span className="text-yellow-400 text-sm">{pendientes.length} pendiente{pendientes.length > 1 ? 's' : ''}</span>)}</div>
                          <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${totalUnidad > 0 ? (pagadoUnidad / totalUnidad) * 100 : 0}%` }}></div></div>
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
                  <div className="flex justify-between items-start"><div><h2 className="text-xl font-bold text-white">{selectedUnidadPago.nombre}</h2><p className="text-white/60">{getComprador(selectedUnidadPago.compradorId)?.name || 'Sin comprador'}</p></div><button onClick={() => { setEditingPago(null); setPagoForm({ monto: 0, fecha: '', tipo: 'mensualidad', status: 'pendiente', notas: '' }); setPagosView('form'); }} className="bg-emerald-500 text-white py-2 px-4 rounded-xl font-semibold hover:bg-emerald-600 text-sm">+ Pago</button></div>
                </div>
                <div className="space-y-3">
                  {(!selectedUnidadPago.pagos || selectedUnidadPago.pagos.length === 0) ? (<div className="bg-white/10 rounded-xl p-6 text-center text-white/60">No hay pagos registrados</div>) : (
                    selectedUnidadPago.pagos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).map(p => (
                      <div key={p.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex justify-between items-start mb-2"><div><span className="text-xs text-white/40">{PAGO_TIPO_LABELS[p.tipo]}</span><div className="text-white font-bold text-lg">{formatMoney(p.monto)}</div></div><span className={`${PAGO_STATUS_COLORS[p.status]} text-white text-xs px-2 py-1 rounded-full`}>{p.status}</span></div>
                        <div className="text-white/60 text-sm mb-2"><span>Vence: {p.fecha}</span>{p.fechaPago && <span className="ml-3 text-green-400">Pagado: {p.fechaPago}</span>}</div>
                        {p.notas && <p className="text-white/40 text-sm">{p.notas}</p>}
                        <div className="flex gap-2 mt-3">{p.status !== 'pagado' && (<button onClick={() => handleMarcarPagado(p)} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-600">✓ Marcar pagado</button>)}<button onClick={() => { setEditingPago(p); setPagoForm({ monto: p.monto, fecha: p.fecha, tipo: p.tipo, status: p.status, notas: p.notas || '' }); setPagosView('form'); }} className="bg-blue-500 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-600">✏️</button><button onClick={() => handleDeletePago(p.id)} className="bg-red-500 text-white py-2 px-4 rounded-lg text-sm hover:bg-red-600">🗑️</button></div>
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
                  <div className="grid grid-cols-2 gap-4"><div><label className="block text-white/60 text-sm mb-1">Tipo</label><select value={pagoForm.tipo} onChange={e => setPagoForm({...pagoForm, tipo: e.target.value as any})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"><option value="enganche">Enganche</option><option value="mensualidad">Mensualidad</option><option value="extraordinario">Extraordinario</option></select></div><div><label className="block text-white/60 text-sm mb-1">Status</label><select value={pagoForm.status} onChange={e => setPagoForm({...pagoForm, status: e.target.value as any})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"><option value="pendiente">Pendiente</option><option value="pagado">Pagado</option><option value="vencido">Vencido</option></select></div></div>
                  <div><label className="block text-white/60 text-sm mb-1">Notas</label><input type="text" value={pagoForm.notas} onChange={e => setPagoForm({...pagoForm, notas: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  <div className="flex gap-3 pt-4"><button onClick={handleSavePago} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600">Guardar</button><button onClick={() => setPagosView('detail')} className="bg-white/20 text-white py-3 px-6 rounded-xl hover:bg-white/30">Cancelar</button></div>
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
        ) : activeSection === 'gastos' ? (
          <div className="animate-fadeIn">
            <button onClick={() => { if (gastosView === 'list') setActiveSection(null); else setGastosView('list'); }} className="mb-4 flex items-center gap-2 text-white/60 hover:text-white transition"><span>←</span> <span>Volver</span></button>

            {gastosView === 'list' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">💸 Gastos</h2>
                  <button onClick={() => { setEditingGasto(null); setGastoForm({ concepto: '', monto: 0, fecha: '', categoria: 'construccion', proveedor: '', facturado: false, comprobante: '', comprobanteNombre: '', notas: '' }); setGastosView('form'); }} className="bg-emerald-500 text-white py-2 px-4 rounded-xl font-semibold hover:bg-emerald-600">+ Gasto</button>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-red-500/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{formatMoney(totalGastos)}</div>
                    <div className="text-xs text-white/60">Total Gastado</div>
                  </div>
                  <div className="bg-orange-500/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-orange-400">{formatMoney(gastosMesActual)}</div>
                    <div className="text-xs text-white/60">Este Mes</div>
                  </div>
                </div>

                {/* Desglose por categoria */}
                {gastosPorCategoria.length > 0 && (
                  <div className="bg-white/10 rounded-xl p-4 mb-4">
                    <h3 className="text-white/60 text-sm mb-3">Por Categoría</h3>
                    <div className="space-y-2">
                      {gastosPorCategoria.map(cat => (
                        <div key={cat.value} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span className="text-white text-sm">{cat.label}</span>
                            <span className="text-white/40 text-xs">({cat.count})</span>
                          </div>
                          <span className="text-white font-semibold">{formatMoney(cat.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filtro */}
                <div className="mb-4">
                  <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm">
                    <option value="todas">Todas las categorías</option>
                    {GASTO_CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                  </select>
                </div>

                {/* Lista */}
                <div className="space-y-3">
                  {gastosFiltrados.length === 0 ? (<div className="bg-white/10 rounded-xl p-6 text-center text-white/60">No hay gastos registrados</div>) : (
                    gastosFiltrados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(g => {
                      const cat = getCategoriaInfo(g.categoria);
                      return (
                        <div key={g.id} onClick={() => { setSelectedGasto(g); setGastosView('detail'); }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`${cat.color} w-8 h-8 rounded-lg flex items-center justify-center text-sm`}>{cat.icon}</span>
                              <div>
                                <h3 className="text-white font-semibold">{g.concepto}</h3>
                                <p className="text-white/50 text-xs">{g.proveedor || cat.label}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-red-400 font-bold">{formatMoney(g.monto)}</div>
                              <div className="text-white/40 text-xs">{g.fecha}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {g.facturado && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">✓ Facturado</span>}
                            {g.comprobante && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">📎 Comprobante</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {gastosView === 'form' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">{editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}</h2>
                <div className="space-y-4">
                  <div><label className="block text-white/60 text-sm mb-1">Concepto *</label><input type="text" value={gastoForm.concepto} onChange={e => setGastoForm({...gastoForm, concepto: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" placeholder="Descripción del gasto" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-white/60 text-sm mb-1">Monto *</label><input type="number" value={gastoForm.monto} onChange={e => setGastoForm({...gastoForm, monto: parseFloat(e.target.value) || 0})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                    <div><label className="block text-white/60 text-sm mb-1">Fecha</label><input type="date" value={gastoForm.fecha} onChange={e => setGastoForm({...gastoForm, fecha: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" /></div>
                  </div>
                  <div><label className="block text-white/60 text-sm mb-1">Categoría</label><select value={gastoForm.categoria} onChange={e => setGastoForm({...gastoForm, categoria: e.target.value as any})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white">{GASTO_CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}</select></div>
                  <div><label className="block text-white/60 text-sm mb-1">Proveedor</label><input type="text" value={gastoForm.proveedor} onChange={e => setGastoForm({...gastoForm, proveedor: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" placeholder="Nombre del proveedor" /></div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="facturado" checked={gastoForm.facturado} onChange={e => setGastoForm({...gastoForm, facturado: e.target.checked})} className="w-5 h-5 rounded" />
                    <label htmlFor="facturado" className="text-white">¿Facturado?</label>
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Comprobante</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleComprobanteChange} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-500 file:text-white" />
                    {gastoForm.comprobanteNombre && <p className="text-sm text-green-400 mt-1">✓ {gastoForm.comprobanteNombre}</p>}
                  </div>
                  <div><label className="block text-white/60 text-sm mb-1">Notas</label><textarea value={gastoForm.notas} onChange={e => setGastoForm({...gastoForm, notas: e.target.value})} rows={2} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white resize-none" /></div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={handleSaveGasto} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600">Guardar</button>
                    <button onClick={() => setGastosView('list')} className="bg-white/20 text-white py-3 px-6 rounded-xl hover:bg-white/30">Cancelar</button>
                  </div>
                </div>
              </div>
            )}

            {gastosView === 'detail' && selectedGasto && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`${getCategoriaInfo(selectedGasto.categoria).color} w-12 h-12 rounded-xl flex items-center justify-center text-xl`}>{getCategoriaInfo(selectedGasto.categoria).icon}</span>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedGasto.concepto}</h2>
                      <p className="text-white/60 text-sm">{getCategoriaInfo(selectedGasto.categoria).label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-400">{formatMoney(selectedGasto.monto)}</div>
                    <div className="text-white/40 text-sm">{selectedGasto.fecha}</div>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  {selectedGasto.proveedor && <div className="flex justify-between text-white/80"><span>Proveedor:</span><span className="font-semibold">{selectedGasto.proveedor}</span></div>}
                  <div className="flex justify-between text-white/80"><span>Facturado:</span><span className={`font-semibold ${selectedGasto.facturado ? 'text-green-400' : 'text-white/40'}`}>{selectedGasto.facturado ? 'Sí' : 'No'}</span></div>
                  {selectedGasto.comprobante && <div className="pt-2"><a href={selectedGasto.comprobante} download={selectedGasto.comprobanteNombre} className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">📎 Descargar Comprobante</a></div>}
                  {selectedGasto.notas && <div className="pt-2 border-t border-white/20"><span className="text-white/60 text-sm">Notas:</span><p className="text-white mt-1">{selectedGasto.notas}</p></div>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setEditingGasto(selectedGasto); setGastoForm({ concepto: selectedGasto.concepto, monto: selectedGasto.monto, fecha: selectedGasto.fecha, categoria: selectedGasto.categoria, proveedor: selectedGasto.proveedor, facturado: selectedGasto.facturado, comprobante: selectedGasto.comprobante || '', comprobanteNombre: selectedGasto.comprobanteNombre || '', notas: selectedGasto.notas }); setGastosView('form'); }} className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600">Editar</button>
                  <button onClick={() => handleDeleteGasto(selectedGasto.id)} className="bg-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-600">Eliminar</button>
                </div>
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
