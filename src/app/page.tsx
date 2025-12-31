'use client';

import { useState, useEffect } from 'react';

interface Unidad {
  id: string;
  nombre: string;
  tipo: string;
  planta: number;
  m2: number;
  precio: number;
  status: string;
  vista: string;
  notas: string | null;
}

interface Comprador {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  unidadId: string | null;
  status: string;
  notas: string | null;
}

interface Pago {
  id: string;
  compradorId: string;
  concepto: string;
  monto: number;
  fecha: string;
  status: string;
}

interface Inversionista {
  id: string;
  nombre: string;
  telefono: string;
  aportacion: number;
  porcentaje: number;
  notas: string | null;
}

interface Gasto {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  categoria: string;
  notas: string | null;
}

const PIN_CORRECTO = '2835';

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      alert('Para instalar:\n\niPhone: Toca el icono de compartir y selecciona "Agregar a pantalla de inicio"\n\nAndroid/Chrome: Toca el menú (3 puntos) y selecciona "Instalar app"');
    }
  };

  const handleSectionClick = (section: string) => {
    if (section === 'gastos') {
      setShowPinModal(true);
    } else {
      setActiveSection(section);
    }
  };

  const handlePinSubmit = () => {
    if (pin === PIN_CORRECTO) {
      setShowPinModal(false);
      setPin('');
      setPinError(false);
      setActiveSection('gastos');
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-800 to-emerald-900">
      {/* Header */}
      <header className="pt-6 pb-4 px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-light tracking-wide text-white">
                DEVELOPMENT<span className="font-bold"> SOLUTIONS</span>
              </h1>
            </div>
          </div>
          <p className="text-white/60 text-sm">Gestión de desarrollos inmobiliarios</p>
          <button onClick={handleInstall}
            className="mt-3 bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-white/30 flex items-center gap-2 mx-auto border border-white/30">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Instalar App
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-lg mx-auto">
        {!activeSection ? (
          <div className="grid grid-cols-2 gap-4">
            {/* Inventario */}
            <button onClick={() => handleSectionClick('inventario')}
              className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95">
              <div className="w-full aspect-square flex items-center justify-center">
                <svg className="w-20 h-20 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="p-3 text-center">
                <span className="text-white font-semibold text-lg block">Inventario</span>
                <span className="text-white/50 text-xs">Unidades disponibles</span>
              </div>
            </button>

            {/* Compradores */}
            <button onClick={() => handleSectionClick('compradores')}
              className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95">
              <div className="w-full aspect-square flex items-center justify-center">
                <svg className="w-20 h-20 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="p-3 text-center">
                <span className="text-white font-semibold text-lg block">Compradores</span>
                <span className="text-white/50 text-xs">Clientes y prospectos</span>
              </div>
            </button>

            {/* Pagos */}
            <button onClick={() => handleSectionClick('pagos')}
              className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95">
              <div className="w-full aspect-square flex items-center justify-center">
                <svg className="w-20 h-20 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="p-3 text-center">
                <span className="text-white font-semibold text-lg block">Pagos</span>
                <span className="text-white/50 text-xs">Cobranza y adeudos</span>
              </div>
            </button>

            {/* Inversionistas */}
            <button onClick={() => handleSectionClick('inversionistas')}
              className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95">
              <div className="w-full aspect-square flex items-center justify-center">
                <svg className="w-20 h-20 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="p-3 text-center">
                <span className="text-white font-semibold text-lg block">Inversionistas</span>
                <span className="text-white/50 text-xs">Capital y socios</span>
              </div>
            </button>

            {/* Construcción */}
            <button onClick={() => handleSectionClick('construccion')}
              className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95">
              <div className="w-full aspect-square flex items-center justify-center">
                <svg className="w-20 h-20 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="p-3 text-center">
                <span className="text-white font-semibold text-lg block">Construcción</span>
                <span className="text-white/50 text-xs">Avance de obra</span>
              </div>
            </button>

            {/* Gastos (con PIN) */}
            <button onClick={() => handleSectionClick('gastos')}
              className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-red-400/50 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-95 relative">
              <div className="absolute top-2 right-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="w-full aspect-square flex items-center justify-center">
                <svg className="w-20 h-20 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <div className="p-3 text-center">
                <span className="text-white font-semibold text-lg block">Gastos</span>
                <span className="text-red-300/70 text-xs">Acceso con PIN</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="animate-fadeIn">
            <button onClick={() => setActiveSection(null)}
              className="mb-4 flex items-center gap-2 text-white/60 hover:text-white transition">
              <span>←</span> <span>Volver</span>
            </button>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 capitalize">{activeSection}</h2>
              <p className="text-white/60">Sección en desarrollo...</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-white/40 text-sm">
            Hecho por <span className="text-amber-400">Colmena (C6)</span> • 2025
          </p>
        </footer>
      </main>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 w-full max-w-sm border border-white/20">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Acceso Restringido</h2>
              <p className="text-white/60 text-sm mt-1">Ingresa el PIN de seguridad</p>
            </div>
            
            <input type="password" inputMode="numeric" maxLength={4}
              value={pin} onChange={e => { setPin(e.target.value); setPinError(false); }}
              onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
              className={`w-full text-center text-2xl tracking-[1em] py-4 bg-white/10 border ${pinError ? 'border-red-500' : 'border-white/20'} rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-red-500`}
              placeholder="••••" />
            
            {pinError && <p className="text-red-400 text-sm text-center mt-2">PIN incorrecto</p>}
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowPinModal(false); setPin(''); setPinError(false); }}
                className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20">
                Cancelar
              </button>
              <button onClick={handlePinSubmit}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600">
                Acceder
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
