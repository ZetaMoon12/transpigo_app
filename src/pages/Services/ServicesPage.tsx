import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  PlusIcon,
  TruckIcon,
  Search,
  MapPin,
  Phone,
  Star,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Navigation,
  CreditCard,
  FileText,
  Clock,
  Compass,
  UserRoundPlusIcon,
  BanIcon,
  ImageIcon,
  PenToolIcon,
  Flag,
  CircleDot,
  MessageCircle,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/utils/helpers';
import {
  serviciosService,
  SERVICE_STATUS_LABEL,
  SERVICE_STATUS_STYLE as STATUS_STYLE,
  type ServiceRequestSummary,
} from '@/services/servicios.service';
import { driversService } from '@/services/drivers.service';
import { chatService } from '@/services/chat.service';
import { MapRoute } from './components/MapRoute';
import { AssignDriverDialog } from './components/AssignDriverDialog';
import { ServiceChat } from './components/ServiceChat';

type FilterCategory = 'TODOS' | 'ACTIVOS' | 'PENDIENTES' | 'COMPLETADOS' | 'CANCELADOS';

const ASSIGNABLE_STATUSES = ['PENDIENTE', 'COTIZADA', 'CONFIRMADA', 'ASIGNADA'];
const CANCELABLE_STATUSES_EXCLUDED = ['COMPLETADA', 'CANCELADA', 'FALLIDA'];

export function ServicesPage() {
  const [services, setServices] = useState<ServiceRequestSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterCategory>('TODOS');
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Detalle del servicio seleccionado
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<ServiceRequestSummary | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Detalle operativo del conductor (para coordenadas GPS en tiempo real)
  const [driverDetail, setDriverDetail] = useState<any | null>(null);
  const [loadingDriverDetail, setLoadingDriverDetail] = useState(false);

  // Cancelación de servicio
  const [cancelingServiceId, setCancelingServiceId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [canceling, setCanceling] = useState(false);

  // Cargar lista inicial de servicios
  const loadServices = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    try {
      const res = await serviciosService.list({ page: 1, limit: 100 });
      setServices(res.data || []);
    } catch {
      toast.error('No se pudieron cargar los servicios');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Cargar el detalle del servicio seleccionado y su conductor asignado
  const loadServiceDetails = async (id: number, showSkeleton = true) => {
    if (showSkeleton) setLoadingDetail(true);
    try {
      const res = await serviciosService.getById(id);
      const s = res.data;
      setSelectedServiceDetail(s);

      // Cargar contador de mensajes no leídos
      try {
        const chatRes = await chatService.getMessages(id);
        if (chatRes.success && chatRes.data) {
          const unreads = chatRes.data.messages.filter(
            (m) => !m.readByAdmin && m.senderType !== 'ADMIN'
          );
          setUnreadCount(unreads.length);
        }
      } catch (err) {
        console.error('Error fetching unread chat messages', err);
        setUnreadCount(0);
      }

      // Si tiene conductor asignado, obtener su ubicación GPS actual y HV en tiempo real
      if (s?.driver?.id) {
        setLoadingDriverDetail(true);
        try {
          const drvRes = await driversService.getDriverById(s.driver.id);
          setDriverDetail(drvRes.data || null);
        } catch (err) {
          console.error('Error fetching driver live data', err);
          setDriverDetail(null);
        } finally {
          setLoadingDriverDetail(false);
        }
      } else {
        setDriverDetail(null);
      }
    } catch {
      toast.error('Error al cargar detalles del servicio');
    } finally {
      if (showSkeleton) setLoadingDetail(false);
    }
  };

  useEffect(() => {
    setShowChat(false);
    if (selectedServiceId === null) {
      setSelectedServiceDetail(null);
      setDriverDetail(null);
      return;
    }
    loadServiceDetails(selectedServiceId);
  }, [selectedServiceId]);

  async function handleCancelService() {
    if (cancelingServiceId === null) return;
    setCanceling(true);
    try {
      await serviciosService.cancel(cancelingServiceId, cancelReason.trim() || undefined);
      toast.success('Servicio cancelado');
      setCancelingServiceId(null);
      setCancelReason('');
      loadServices(false);
      if (selectedServiceId === cancelingServiceId) {
        loadServiceDetails(cancelingServiceId, false);
      }
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'No se pudo cancelar el servicio';
      toast.error(message);
    } finally {
      setCanceling(false);
    }
  }

  // Filtrado de servicios en cliente (Buscador + Filtros Rápidos)
  const filteredServices = services.filter((s) => {
    const query = searchTerm.toLowerCase().trim();
    const formattedCode = `TRG-${new Date(s.createdAt).getFullYear()}-${String(s.id).padStart(5, '0')}`;
    const matchesSearch =
      query === '' ||
      formattedCode.toLowerCase().includes(query) ||
      (s.serviceCode || '').toLowerCase().includes(query) ||
      String(s.id).includes(query) ||
      (s.client?.name || '').toLowerCase().includes(query) ||
      (s.client?.email || '').toLowerCase().includes(query) ||
      (s.client?.phone || '').toLowerCase().includes(query) ||
      (s.driver?.name || '').toLowerCase().includes(query) ||
      (s.driver?.vehicle?.plate || '').toLowerCase().includes(query) ||
      (s.origin?.city || '').toLowerCase().includes(query) ||
      (s.destination?.city || '').toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (statusFilter === 'TODOS') return true;
    if (statusFilter === 'ACTIVOS') {
      return ['CONFIRMADA', 'ASIGNADA', 'EN_CAMINO', 'EN_CARGUE', 'EN_RUTA'].includes(s.status);
    }
    if (statusFilter === 'PENDIENTES') {
      return ['PENDIENTE', 'COTIZADA'].includes(s.status);
    }
    if (statusFilter === 'COMPLETADOS') {
      return s.status === 'COMPLETADA';
    }
    if (statusFilter === 'CANCELADOS') {
      return ['CANCELADA', 'FALLIDA'].includes(s.status);
    }
    return true;
  });

  // Helper para obtener conteos de categorías para las insignias
  const getCountByCategory = (category: FilterCategory) => {
    return services.filter((s) => {
      if (category === 'TODOS') return true;
      if (category === 'ACTIVOS') {
        return ['CONFIRMADA', 'ASIGNADA', 'EN_CAMINO', 'EN_CARGUE', 'EN_RUTA'].includes(s.status);
      }
      if (category === 'PENDIENTES') {
        return ['PENDIENTE', 'COTIZADA'].includes(s.status);
      }
      if (category === 'COMPLETADOS') {
        return s.status === 'COMPLETADA';
      }
      if (category === 'CANCELADOS') {
        return ['CANCELADA', 'FALLIDA'].includes(s.status);
      }
      return true;
    }).length;
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 w-full max-w-none">
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1E36] tracking-tight">Servicios</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Historial, ruteo en mapa interactivo y despacho en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/servicios/carga/nuevo">
            <Button
              variant="outline"
              className="border-slate-200 text-slate-700 font-bold flex items-center gap-2 shadow-xs cursor-pointer hover:bg-slate-50"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Nuevo servicio de carga</span>
            </Button>
          </Link>
          <Link to="/servicios/grua/nuevo">
            <Button className="bg-[#5AB507] hover:bg-[#5AB507]/90 text-white font-bold flex items-center gap-2 shadow-xs cursor-pointer">
              <PlusIcon className="w-4 h-4" />
              <span>Nuevo servicio de grúa</span>
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        // Estado de carga inicial de la pantalla completa
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-215px)]">
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-4 space-y-4 shadow-2xs">
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex flex-col gap-2 p-3 border border-slate-50 rounded-xl">
                  <div className="h-4 bg-slate-100 rounded-md w-1/3 animate-pulse" />
                  <div className="h-3 bg-slate-100 rounded-md w-2/3 animate-pulse" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center shadow-2xs">
            <Clock className="w-8 h-8 text-slate-300 animate-spin mb-3" />
            <span className="text-sm font-semibold text-slate-400">Cargando servicios registrados...</span>
          </div>
        </div>
      ) : services.length === 0 ? (
        // Estado Vacío Global (Sin servicios en DB)
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-12 flex flex-col items-center justify-center text-center max-w-2xl mx-auto mt-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-6 border border-slate-100/50">
            <TruckIcon className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Aún no hay servicios registrados</h2>
          <p className="text-sm text-slate-500 max-w-md mt-2">
            Crea una nueva solicitud de grúa o transporte de carga para visualizarla en el panel de despacho.
          </p>
          <div className="flex items-center gap-2 mt-6">
            <Link to="/servicios/carga/nuevo">
              <Button variant="outline" className="border-slate-200 text-slate-700 font-bold px-6 hover:bg-slate-50">
                Servicio de carga
              </Button>
            </Link>
            <Link to="/servicios/grua/nuevo">
              <Button className="bg-[#0B1E36] hover:bg-[#0B1E36]/90 text-white font-bold px-6">
                Servicio de grúa
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        // Layout Master-Detail
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* Panel Izquierdo: Master List */}
          <div className={cn(
            "lg:col-span-4 bg-white border border-slate-100 rounded-2xl flex flex-col shadow-2xs overflow-hidden h-[calc(100vh-215px)] max-h-[calc(100vh-215px)]",
            selectedServiceId !== null && "hidden lg:flex"
          )}>
            {/* Buscador de Servicios */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col gap-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por código, cliente o placa..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#5AB507] focus:ring-1 focus:ring-[#5AB507] transition-all"
                />
              </div>

              {/* Filtros de Categoría */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar shrink-0">
                {(['TODOS', 'ACTIVOS', 'PENDIENTES', 'COMPLETADOS', 'CANCELADOS'] as FilterCategory[]).map((cat) => {
                  const isActive = statusFilter === cat;
                  const count = getCountByCategory(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => setStatusFilter(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer",
                        isActive
                          ? "bg-[#0B1E36] text-white border-[#0B1E36] shadow-2xs"
                          : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-slate-200"
                      )}
                    >
                      <span>
                        {cat === 'TODOS' && 'Todos'}
                        {cat === 'ACTIVOS' && 'Activos'}
                        {cat === 'PENDIENTES' && 'Pendientes'}
                        {cat === 'COMPLETADOS' && 'Completados'}
                        {cat === 'CANCELADOS' && 'Cancelados'}
                      </span>
                      <span className={cn(
                        "px-1.5 py-0.2 rounded-md text-[10px] font-black leading-none",
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Listado de Solicitudes */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
              {filteredServices.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm font-medium italic">
                  No se encontraron servicios que coincidan.
                </div>
              ) : (
                filteredServices.map((s) => {
                  const isActive = selectedServiceId === s.id;
                  const formattedCode = s.serviceCode || `TRG-${new Date(s.createdAt).getFullYear()}-${String(s.id).padStart(5, '0')}`;
                  const style = STATUS_STYLE[s.status] || STATUS_STYLE.PENDIENTE;

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedServiceId(s.id)}
                      className={cn(
                        "p-4 cursor-pointer hover:bg-slate-50/70 border-l-4 transition-all flex flex-col gap-2.5",
                        isActive ? "bg-slate-50 border-l-[#5AB507]" : "border-l-transparent"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-[#0B1E36] text-sm tracking-tight">{formattedCode}</span>
                        <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1", style.bg, style.text, style.border)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
                          <span>{SERVICE_STATUS_LABEL[s.status]}</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5 text-slate-800 font-bold truncate">
                          <span>{s.client?.name ?? 'Cliente no registrado'}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-slate-500 font-semibold truncate">
                          <span>{s.origin?.city || 'Origen'}</span>
                          <span className="text-slate-400">→</span>
                          <span>{s.destination?.city || 'Destino'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mt-0.5 border-t border-slate-50 pt-2">
                        <span>{formatDate(s.createdAt, 'es-CO')}</span>
                        <span className="font-extrabold text-slate-700 text-xs">
                          {s.totalEstimated !== null ? formatCurrency(s.totalEstimated, 'COP', 'es-CO') : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel Derecho: Detail Viewer */}
          <div className={cn(
            "lg:col-span-8 bg-white border border-slate-100 rounded-2xl flex flex-col shadow-2xs overflow-hidden h-[calc(100vh-215px)] max-h-[calc(100vh-215px)]",
            selectedServiceId === null && "hidden lg:flex"
          )}>
            {selectedServiceId === null ? (
              // Vista en Estado Vacío (Sin selección)
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/20">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-xs text-slate-300 mb-6">
                  <Compass className="w-8 h-8 text-[#0B1E36]" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  Despacho de Servicios
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1.5 leading-relaxed font-medium">
                  Selecciona una solicitud en el listado de la izquierda para ver su recorrido de ruta trazada y su ficha operativa en tiempo real.
                </p>
              </div>
            ) : loadingDetail ? (
              // Esqueleto de Carga del Detalle
              <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-2 w-1/3">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
                <Skeleton className="h-[340px] w-full rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-48 w-full rounded-2xl" />
                  <Skeleton className="h-48 w-full rounded-2xl" />
                </div>
              </div>
            ) : selectedServiceDetail ? (
              // Contenedor Real de Detalle
              <div className="flex-1 flex flex-col overflow-hidden">
                {showChat ? (
                  <ServiceChat
                    requestId={selectedServiceDetail.id}
                    serviceCode={selectedServiceDetail.serviceCode || `TRG-${new Date(selectedServiceDetail.createdAt).getFullYear()}-${String(selectedServiceDetail.id).padStart(5, '0')}`}
                    onBack={() => setShowChat(false)}
                  />
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300">
                    {/* Header de Detalle */}
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between shrink-0">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedServiceId(null)}
                      className="lg:hidden mr-2 p-1.5 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg bg-white shadow-2xs hover:bg-slate-50 cursor-pointer"
                    >
                      <ArrowLeft className="w-4.5 h-4.5 mr-1" />
                      <span>Volver</span>
                    </Button>
                    <div>
                      <h2 className="text-base font-extrabold text-[#0B1E36] tracking-tight">
                        Ficha de Servicio: {selectedServiceDetail.serviceCode || `TRG-${new Date(selectedServiceDetail.createdAt).getFullYear()}-${String(selectedServiceDetail.id).padStart(5, '0')}`}
                      </h2>
                      <span className="text-[10px] text-slate-400 font-bold block leading-none mt-1">
                        REGISTRADO EL {formatDate(selectedServiceDetail.createdAt, 'es-CO').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {ASSIGNABLE_STATUSES.includes(selectedServiceDetail.status) && (
                      <AssignDriverDialog
                        serviceId={selectedServiceDetail.id}
                        onAssigned={() => loadServiceDetails(selectedServiceDetail.id, false)}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-slate-600 hover:text-[#0B1E36] border-slate-200 shadow-2xs font-bold gap-1 bg-white cursor-pointer"
                          >
                            <UserRoundPlusIcon className="w-3.5 h-3.5" />
                            <span>{selectedServiceDetail.driver ? 'Reasignar conductor' : 'Asignar conductor'}</span>
                          </Button>
                        }
                      />
                    )}
                    {!CANCELABLE_STATUSES_EXCLUDED.includes(selectedServiceDetail.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancelingServiceId(selectedServiceDetail.id)}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 shadow-2xs font-bold gap-1 bg-white cursor-pointer"
                      >
                        <BanIcon className="w-3.5 h-3.5" />
                        <span>Cancelar servicio</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowChat(true);
                        setUnreadCount(0);
                      }}
                      className="bg-[#5AB507] hover:bg-[#4e9c06] text-white border-none shadow-2xs font-extrabold gap-1.5 cursor-pointer relative px-3.5 py-2 rounded-lg"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-white" />
                      <span>Chat</span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white animate-in zoom-in duration-200 shadow-sm border border-white">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => loadServiceDetails(selectedServiceDetail.id, false)}
                      className="bg-[#0B1E36] hover:bg-[#1E3B5E] text-white border-none shadow-2xs font-extrabold gap-1.5 cursor-pointer px-3.5 py-2 rounded-lg"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5 text-white", loadingDriverDetail && "animate-spin")} />
                      <span>Actualizar GPS</span>
                    </Button>
                    <div className={cn("px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 shadow-2xs", STATUS_STYLE[selectedServiceDetail.status]?.bg, STATUS_STYLE[selectedServiceDetail.status]?.text, STATUS_STYLE[selectedServiceDetail.status]?.border)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_STYLE[selectedServiceDetail.status]?.dot)} />
                      <span>{SERVICE_STATUS_LABEL[selectedServiceDetail.status]}</span>
                    </div>
                  </div>
                </div>

                {/* Contenido Detalle Scrollable */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">

                  {/* Componente de Mapa de Ruta */}
                  <div className="w-full h-[340px] shrink-0">
                    <MapRoute
                      originLat={selectedServiceDetail.origin?.lat ?? null}
                      originLng={selectedServiceDetail.origin?.lng ?? null}
                      destLat={selectedServiceDetail.destination?.lat ?? null}
                      destLng={selectedServiceDetail.destination?.lng ?? null}
                      driverLat={driverDetail?.currentLat ?? null}
                      driverLng={driverDetail?.currentLng ?? null}
                      originAddress={selectedServiceDetail.origin?.address ?? 'Origen'}
                      destAddress={selectedServiceDetail.destination?.address ?? 'Destino'}
                      driverName={selectedServiceDetail.driver?.name ?? 'Conductor'}
                    />
                  </div>

                  {/* Fichas de Información */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                    {/* Ficha 1: Información General del Servicio */}
                    <div className="bg-slate-50/65 border border-slate-200/50 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
                      <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200/40 flex items-center gap-2">
                        <div className="p-1 rounded-md bg-[#0B1E36]/10 text-[#0B1E36]">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-black text-[#0B1E36] uppercase tracking-wider leading-none">
                          Ficha Técnica de Servicio
                        </h3>
                      </div>
                      <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                        {/* Ruta de Origen a Destino dentro de tarjeta blanca */}
                        <div className="bg-white rounded-xl p-4 border border-slate-200/50 shadow-3xs relative pl-10 space-y-5">
                          {/* Línea conectora punteada */}
                          <div className="absolute left-[25px] top-4 bottom-4 w-[2px] border-l-2 border-dashed border-slate-200" />
                          
                          {/* Origen */}
                          <div className="relative flex items-start">
                            <div className="absolute -left-[24px] w-5 h-5 rounded-full bg-emerald-50 border border-emerald-500 flex items-center justify-center shadow-3xs">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider leading-none mb-1">Origen</span>
                              <p className="text-slate-800 text-xs font-extrabold break-words leading-tight">{selectedServiceDetail.origin?.address || '—'}</p>
                              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{selectedServiceDetail.origin?.city}</span>
                            </div>
                          </div>

                          {/* Destino */}
                          <div className="relative flex items-start">
                            <div className="absolute -left-[24px] w-5 h-5 rounded-full bg-rose-50 border border-rose-500 flex items-center justify-center shadow-3xs">
                              <Navigation className="w-3 h-3 text-rose-500" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider leading-none mb-1">Destino</span>
                              <p className="text-slate-800 text-xs font-extrabold break-words leading-tight">{selectedServiceDetail.destination?.address || '—'}</p>
                              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{selectedServiceDetail.destination?.city}</span>
                            </div>
                          </div>
                        </div>

                        {/* Grid de Métricas Principales */}
                        <div className="grid grid-cols-2 gap-3 border-t border-slate-200/40 pt-4">
                          {/* Distancia */}
                          <div className="bg-[#0B1E36] rounded-xl p-3 border border-slate-955/20 flex flex-col justify-center shadow-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                            <span className="text-[9px] text-slate-300 uppercase font-black tracking-wider mb-0.5 z-10">Distancia</span>
                            <span className="text-white font-black text-sm z-10">
                              {selectedServiceDetail.destination?.estimatedKm || '—'}
                              {selectedServiceDetail.destination?.estimatedKm && <span className="text-xs text-blue-400 font-bold ml-0.5">km</span>}
                            </span>
                          </div>

                          {/* Valor Estimado */}
                          <div className="bg-[#0B1E36] rounded-xl p-3 border border-slate-955/20 flex flex-col justify-center shadow-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                            <span className="text-[9px] text-slate-300 uppercase font-black tracking-wider mb-0.5 z-10">Precio Estimado</span>
                            <span className="text-[#5AB507] font-black text-sm z-10">
                              {selectedServiceDetail.totalEstimated !== null ? formatCurrency(selectedServiceDetail.totalEstimated, 'COP', 'es-CO') : '—'}
                            </span>
                          </div>

                          {/* Medio de Pago */}
                          <div className="bg-[#0B1E36] rounded-xl p-3 border border-slate-955/20 flex flex-col justify-center shadow-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                            <span className="text-[9px] text-slate-300 uppercase font-black tracking-wider mb-1 z-10">Medio de Pago</span>
                            <div className="flex items-center gap-1.5 text-white font-extrabold text-[11px] z-10">
                              <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{selectedServiceDetail.paymentType || 'EFECTIVO'}</span>
                            </div>
                          </div>

                          {/* Tipo de Servicio */}
                          <div className="bg-[#0B1E36] rounded-xl p-3 border border-slate-955/20 flex flex-col justify-center shadow-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                            <span className="text-[9px] text-slate-300 uppercase font-black tracking-wider mb-1 z-10">Tipo de Servicio</span>
                            <div className="flex items-center gap-1.5 text-white font-extrabold text-[11px] z-10">
                              <TruckIcon className="w-3.5 h-3.5 text-amber-400" />
                              <span>{selectedServiceDetail.serviceType === 'GRUA_AUXILIO_VIAL' ? 'Auxilio de Grúa' : 'Carga Pesada'}</span>
                            
                          </div>
                        </div>

                        {/* Descripción / Notas */}
                        {selectedServiceDetail.notes && (
                          <div className="border-t border-slate-50 pt-3">
                            <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider leading-none mb-1.5">
                              {selectedServiceDetail.serviceType === 'GRUA_AUXILIO_VIAL' ? 'Observaciones de Auxilio' : 'Descripción de la Carga'}
                            </span>
                            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 text-[11px] text-slate-600 font-medium italic leading-relaxed whitespace-pre-line">
                              "{selectedServiceDetail.notes}"
                            </div>
                          </div>
                        )}
                        </div>
                      </div>
                    </div>

                    {/* Ficha 2: Información del Cliente y Observaciones de Auxilio */}
                    <div className="bg-slate-50/65 border border-slate-200/50 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
                      <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200/40 flex items-center gap-2">
                        <div className="p-1 rounded-md bg-amber-500/10 text-amber-600">
                          <User className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-black text-[#0B1E36] uppercase tracking-wider leading-none">
                          Cliente y Auxilio
                        </h3>
                      </div>
                      <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                        {/* Información del Cliente en tarjeta blanca */}
                        {selectedServiceDetail.client ? (
                          <div className="bg-white rounded-xl p-3.5 border border-slate-200/50 shadow-3xs space-y-2">
                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none mb-1 block">Datos del Cliente</span>
                            <h4 className="font-extrabold text-slate-800 text-xs">{selectedServiceDetail.client.name}</h4>
                            <div className="flex flex-col gap-1 text-[11px] text-slate-500 font-semibold">
                              <span>Email: {selectedServiceDetail.client.email}</span>
                              {selectedServiceDetail.client.phone && (
                                <span className="flex items-center gap-1 mt-1">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  Celular: <a href={`tel:${selectedServiceDetail.client.phone}`} className="text-[#5AB507] hover:underline font-extrabold">{selectedServiceDetail.client.phone}</a>
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white rounded-xl p-3.5 border border-slate-200/50 shadow-3xs text-center text-xs text-slate-400">
                            Sin información del cliente
                          </div>
                        )}

                        {/* Observaciones de Auxilio en tarjeta blanca */}
                        <div className="flex-1 flex flex-col justify-end mt-2">
                          <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block mb-1">Observaciones de Auxilio</span>
                          <div className="bg-white border border-slate-200/50 shadow-3xs rounded-xl p-3.5 text-xs text-slate-700 font-bold leading-relaxed flex-1 flex items-start justify-start text-left">
                            {selectedServiceDetail.notes ? selectedServiceDetail.notes : 'Sin observaciones especificadas para este auxilio'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ficha 3: Información del Conductor Asignado */}
                    <div className="bg-slate-50/65 border border-slate-200/50 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
                      <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200/40 flex items-center gap-2">
                        <div className="p-1 rounded-md bg-[#5AB507]/10 text-[#5AB507]">
                          <TruckIcon className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-black text-[#0B1E36] uppercase tracking-wider leading-none">
                          Conductor Asignado
                        </h3>
                      </div>

                      {selectedServiceDetail.driver ? (
                        <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                          {/* Perfil del conductor en tarjeta blanca */}
                          <div className="bg-white rounded-xl p-3.5 border border-slate-200/50 shadow-3xs flex items-start gap-3.5">
                            {/* Avatar del conductor */}
                            <div className="w-12 h-12 rounded-xl bg-[#0B1E36] text-white flex items-center justify-center font-black text-sm uppercase shadow-xs border border-white">
                              {selectedServiceDetail.driver.name ? selectedServiceDetail.driver.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : 'C'}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="font-extrabold text-slate-800 text-sm truncate">{selectedServiceDetail.driver.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center gap-0.5 text-amber-500 font-black text-[11px]">
                                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                                  <span>{selectedServiceDetail.driver.rating ? selectedServiceDetail.driver.rating.toFixed(1) : '5.0'}</span>
                                </span>
                                <span className="text-[10px] text-slate-300 font-black">|</span>
                                <span className="text-[10px] text-slate-400 font-extrabold">
                                  {selectedServiceDetail.serviceType === 'GRUA_AUXILIO_VIAL' ? 'Operador de Grúa' : 'Conductor de Carga'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Contacto y Placa en tarjeta blanca */}
                          <div className="bg-white rounded-xl p-3.5 border border-slate-200/50 shadow-3xs grid grid-cols-2 gap-4 flex-1">
                            {/* Teléfono */}
                            {selectedServiceDetail.driver.phone && (
                              <div className="flex flex-col">
                                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">Celular</span>
                                <a
                                  href={`tel:${selectedServiceDetail.driver.phone}`}
                                  className="inline-flex items-center gap-1.5 text-slate-800 font-extrabold bg-slate-50 hover:bg-slate-100 border border-slate-200/60 px-3 py-2 rounded-xl text-xs transition-colors hover:text-[#5AB507] cursor-pointer shadow-3xs w-fit"
                                >
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{selectedServiceDetail.driver.phone}</span>
                                </a>
                              </div>
                            )}

                            {/* Placa Estilizada Colombiana */}
                            {selectedServiceDetail.driver.vehicle?.plate && (
                              <div className="flex flex-col">
                                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">Vehículo (Placa)</span>
                                <div className="relative inline-flex flex-col items-center justify-center bg-gradient-to-b from-[#FFF275] to-[#E5A900] text-slate-955 border-2 border-slate-955 font-mono font-extrabold px-3 py-1.5 rounded-md shadow-md select-none w-fit min-w-[105px]">
                                  {/* Tornillos de montaje a los lados */}
                                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-slate-700/60 border border-slate-950/20" />
                                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-slate-700/60 border border-slate-950/20" />
                                  
                                  {/* Borde interior fino */}
                                  <div className="absolute inset-0.5 border border-slate-955/25 rounded-sm pointer-events-none" />
                                  
                                  <span className="text-[13px] leading-none tracking-widest uppercase font-black font-mono">{selectedServiceDetail.driver.vehicle.plate}</span>
                                  <span className="text-[7px] leading-none mt-0.5 text-slate-800 tracking-widest font-sans font-black">COLOMBIA</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Ficha de Equipo en tarjeta blanca */}
                          {selectedServiceDetail.driver.vehicle && (
                            <div className="bg-white rounded-xl p-3.5 border border-slate-200/50 shadow-3xs space-y-2 mt-2">
                              <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider leading-none mb-1">Ficha de Equipo</span>
                              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                                <div>
                                  <span className="text-[9px] text-slate-400 font-bold block mb-0.5">Marca / Modelo</span>
                                  <span className="font-extrabold text-slate-800">{selectedServiceDetail.driver.vehicle.brand} {selectedServiceDetail.driver.vehicle.model}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 font-bold block mb-0.5">Clase de Unidad</span>
                                  <span className="font-extrabold text-slate-800 uppercase">{selectedServiceDetail.driver.vehicle.type ? selectedServiceDetail.driver.vehicle.type.replace('_', ' ') : 'Grúa Plataforma'}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Estado sin conductor asignado
                        <div className="p-5 flex-1 flex flex-col items-center justify-center text-center bg-white rounded-xl border border-slate-200/50 shadow-3xs min-h-[220px] m-4">
                          <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 mb-3 shadow-2xs animate-pulse">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">Pendiente de Conductor</h4>
                          <p className="text-[11px] text-slate-400 font-medium max-w-[240px] mt-1.5 leading-relaxed">
                            {selectedServiceDetail.serviceType === 'GRUA_AUXILIO_VIAL'
                              ? 'Esta orden de grúa aún no tiene un conductor de la flota asignado para realizar el auxilio vial.'
                              : 'Este servicio de carga aún no tiene un conductor de la flota asignado para realizar el transporte.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ficha 3: Paradas y evidencias (fotos/firmas subidas por el conductor) */}
                  <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs overflow-hidden">
                    <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                      <div className="p-1 rounded-md bg-[#0B1E36]/10 text-[#0B1E36]">
                        <Flag className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-black text-[#0B1E36] uppercase tracking-wider leading-none">
                        Paradas y Evidencias
                      </h3>
                    </div>

                    <div className="p-4 flex flex-col gap-4">
                      {selectedServiceDetail.stops.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">Sin paradas registradas.</p>
                      ) : (
                        selectedServiceDetail.stops.map((stop) => (
                          <div key={stop.id} className="flex flex-col gap-2.5 border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                            <div className="flex items-start gap-2.5">
                              <CircleDot className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-extrabold text-slate-800 truncate">
                                    Parada {stop.stopOrder} · {stop.city}
                                  </span>
                                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">{stop.status}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">{stop.address}</p>
                              </div>
                            </div>

                            {stop.proofs.length > 0 && (
                              <div className="flex flex-wrap gap-2 pl-6.5">
                                {stop.proofs.map((proof) => (
                                  <a
                                    key={proof.id}
                                    href={proof.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="relative flex flex-col items-center gap-1 group"
                                    title={proof.type === 'FIRMA' ? `Firma${proof.signerName ? ` de ${proof.signerName}` : ''}` : 'Ver imagen'}
                                  >
                                    <div className="h-16 w-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                                      <img
                                        src={proof.fileUrl}
                                        alt={proof.type}
                                        className="h-full w-full object-cover group-hover:opacity-80 transition-opacity"
                                      />
                                    </div>
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                                      {proof.type === 'FIRMA' ? (
                                        <PenToolIcon className="h-2.5 w-2.5" />
                                      ) : (
                                        <ImageIcon className="h-2.5 w-2.5" />
                                      )}
                                      {proof.type === 'FIRMA' ? 'Firma' : 'Foto'}
                                    </span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
          </div>
        </div>
      )}

      <AlertDialog
        open={cancelingServiceId !== null}
        onOpenChange={(v) => {
          if (!v) {
            setCancelingServiceId(null);
            setCancelReason('');
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-extrabold text-[#0B1E36]">¿Cancelar este servicio?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              Esta acción liberará al conductor asignado (si lo hay) y marcará el servicio como cancelado. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Motivo de la cancelación (opcional)"
            className="min-h-20"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold border-slate-200 rounded-xl cursor-pointer">Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelService}
              disabled={canceling}
              className="bg-red-600 hover:bg-red-700 font-bold text-white rounded-xl cursor-pointer"
            >
              {canceling ? 'Cancelando...' : 'Cancelar servicio'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
