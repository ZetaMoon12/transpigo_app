import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UsersIcon,
  UserPlusIcon,
  Link2Icon,
  Search,
  Eye,
  Download,
  User,
  Truck,
  Calendar,
  Mail,
  Phone,
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  FileText,
  Tag,
  Cpu,
  Layers,
  Palette,
  Globe,
  Weight,
  Check,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { driversService } from '@/services/drivers.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VehicleType } from '@/types/driver-registration.types';

export function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [selectedDriverDetail, setSelectedDriverDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [previewDoc, setPreviewDoc] = useState<{ label: string; url: string; type: 'driver' | 'vehicle' | 'attachment'; id: number; status: string } | null>(null);

  // Estados para modales de edición y alertas
  const [editDriverOpen, setEditDriverOpen] = useState(false);
  const [editVehicleOpen, setEditVehicleOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  // Estados de formularios
  const [driverForm, setDriverForm] = useState({
    name: '',
    email: '',
    phone: '',
    cedulaNumero: '',
    city: '',
    neighborhood: '',
    address: '',
    licenciaVencimiento: '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    type: 'TRUCK' as any,
    plate: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    maxWeightTons: '',
    satelitalNombre: '',
    satelitalUsuario: '',
    satelitalContrasena: '',
    ownerName: '',
    ownerMunicipality: '',
    ownerNeighborhood: '',
    ownerAddress: '',
    ownerPhone: '',
    ownerEmail: '',
  });

  // Inicializar formularios cuando se carga el detalle
  useEffect(() => {
    if (selectedDriverDetail) {
      setDriverForm({
        name: selectedDriverDetail.user?.name || '',
        email: selectedDriverDetail.user?.email || '',
        phone: selectedDriverDetail.user?.phone || '',
        cedulaNumero: selectedDriverDetail.cedulaNumero || '',
        city: selectedDriverDetail.city || '',
        neighborhood: selectedDriverDetail.neighborhood || '',
        address: selectedDriverDetail.address || '',
        licenciaVencimiento: selectedDriverDetail.licenciaVencimiento || '',
      });

      if (selectedDriverDetail.vehicle) {
        setVehicleForm({
          type: selectedDriverDetail.vehicle.type || 'TRUCK',
          plate: selectedDriverDetail.vehicle.plate || '',
          brand: selectedDriverDetail.vehicle.brand || '',
          model: selectedDriverDetail.vehicle.model || '',
          year: selectedDriverDetail.vehicle.year || '',
          color: selectedDriverDetail.vehicle.color || '',
          maxWeightTons: selectedDriverDetail.vehicle.maxWeightTons || '',
          satelitalNombre: selectedDriverDetail.vehicle.satelitalNombre || '',
          satelitalUsuario: selectedDriverDetail.vehicle.satelitalUsuario || '',
          satelitalContrasena: selectedDriverDetail.vehicle.satelitalContrasena || '',
          ownerName: selectedDriverDetail.vehicle.ownerName || '',
          ownerMunicipality: selectedDriverDetail.vehicle.ownerMunicipality || '',
          ownerNeighborhood: selectedDriverDetail.vehicle.ownerNeighborhood || '',
          ownerAddress: selectedDriverDetail.vehicle.ownerAddress || '',
          ownerPhone: selectedDriverDetail.vehicle.ownerPhone || '',
          ownerEmail: selectedDriverDetail.vehicle.ownerEmail || '',
        });
      }
    }
  }, [selectedDriverDetail]);

  const handleUpdateDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) return;
    try {
      await driversService.updateDriver(selectedDriverId, driverForm);
      toast.success('Información del conductor actualizada con éxito');
      setEditDriverOpen(false);
      loadDriverDetail(selectedDriverId, false);
      loadDrivers(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar el conductor');
    }
  };

  const handleUpdateVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) return;
    try {
      await driversService.updateVehicle(selectedDriverId, vehicleForm);
      toast.success('Información del vehículo actualizada con éxito');
      setEditVehicleOpen(false);
      loadDriverDetail(selectedDriverId, false);
      loadDrivers(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar el vehículo');
    }
  };

  const handleDeactivateDriver = async () => {
    if (!selectedDriverId) return;
    try {
      await driversService.deleteDriver(selectedDriverId);
      toast.success('Hoja de vida desactivada con éxito');
      setDeactivateDialogOpen(false);
      setSelectedDriverId(null);
      setSelectedDriverDetail(null);
      loadDrivers(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al desactivar la hoja de vida');
    }
  };

  const handleApproveDocument = async (type: 'driver' | 'vehicle' | 'attachment', docId: number, label: string) => {
    if (!selectedDriverId) return;
    try {
      if (type === 'driver') {
        await driversService.reviewDriverDocument(selectedDriverId, docId, { status: 'APROBADO' });
      } else if (type === 'vehicle') {
        await driversService.reviewVehicleDocument(selectedDriverId, docId, { status: 'APROBADO' });
      } else if (type === 'attachment') {
        await driversService.reviewAttachmentDocument(selectedDriverId, docId, { status: 'APROBADO' });
      }
      toast.success(`Documento "${label}" aprobado con éxito`);
      loadDriverDetail(selectedDriverId, false);
      loadDrivers(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al aprobar el documento');
    }
  };

  const handleRejectDocument = async (type: 'driver' | 'vehicle' | 'attachment', docId: number, label: string) => {
    if (!selectedDriverId) return;
    const reason = prompt('Motivo del rechazo (mínimo 10 caracteres):');
    if (reason === null) return;
    if (reason.length < 10) {
      toast.error('El motivo de rechazo debe tener al menos 10 caracteres.');
      return;
    }
    try {
      if (type === 'driver') {
        await driversService.reviewDriverDocument(selectedDriverId, docId, { status: 'RECHAZADO', rejectionReason: reason });
      } else if (type === 'vehicle') {
        await driversService.reviewVehicleDocument(selectedDriverId, docId, { status: 'RECHAZADO', rejectionReason: reason });
      } else if (type === 'attachment') {
        await driversService.reviewAttachmentDocument(selectedDriverId, docId, { status: 'RECHAZADO', rejectionReason: reason });
      }
      toast.success(`Documento "${label}" rechazado con éxito`);
      loadDriverDetail(selectedDriverId, false);
      loadDrivers(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al rechazar el documento');
    }
  };

  const renderDocBadge = (label: string, doc: any, type: 'driver' | 'vehicle' | 'attachment') => {
    return (
      <DocumentPreviewBadge
        label={label}
        doc={doc}
        onPreview={(l, u) => setPreviewDoc({ label: l, url: u, type, id: doc?.id, status: doc?.status })}
        onApprove={() => handleApproveDocument(type, doc?.id, label)}
        onReject={() => handleRejectDocument(type, doc?.id, label)}
      />
    );
  };

  // Cargar lista de conductores
  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const response = await driversService.getDrivers();
      // En la respuesta, los conductores vienen en response.data
      setDrivers(response.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Error al cargar la lista de conductores');
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  const loadDriverDetail = async (id: number, showSkeleton = true) => {
    if (showSkeleton) setLoadingDetail(true);
    try {
      const response = await driversService.getDriverById(id);
      setSelectedDriverDetail(response.data || null);
    } catch (err: any) {
      console.error(err);
      toast.error('Error al cargar los detalles del conductor');
      setSelectedDriverId(null);
    } finally {
      if (showSkeleton) setLoadingDetail(false);
    }
  };

  // Cargar detalle del conductor seleccionado
  useEffect(() => {
    if (selectedDriverId === null) {
      setSelectedDriverDetail(null);
      return;
    }

    loadDriverDetail(selectedDriverId);
  }, [selectedDriverId]);

  // Filtrar conductores en el cliente
  const filteredDrivers = drivers.filter(d => {
    const name = (d.user?.name || '').toLowerCase();
    const email = (d.user?.email || '').toLowerCase();
    const phone = (d.user?.phone || '').toLowerCase();
    const plate = (d.vehicle?.plate || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search) || phone.includes(search) || plate.includes(search);
  });

  const getVehicleTypeName = (type?: string) => {
    switch (type) {
      case VehicleType.TIPO_LIVIANO: return 'Tipo Liviano';
      case VehicleType.CAMION_SENCILLO: return 'Camión Sencillo';
      case VehicleType.DOBLE_TROQUE: return 'Doble Troque';
      case VehicleType.GRUA_PLATAFORMA: return 'Grúa de plataforma';
      case VehicleType.GRUA_ELEVADOR: return 'Grúa con elevador';
      case VehicleType.GRUA_GANCHO_CADENA: return 'Grúa de gancho y cadena';
      case VehicleType.GRUA_PLUMA: return 'Grúa de pluma';
      case VehicleType.GRUA_CAMABAJA: return 'Grúa Camabaja';
      default: return 'No especificado';
    }
  };

  const getAttachmentTypeName = (type?: string) => {
    switch (type) {
      case 'PLANCHON': return 'Planchón';
      case 'REMOLQUE': return 'Remolque';
      case 'CARROCERIA': return 'Carrocería';
      default: return type || 'No especificado';
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 w-full max-w-none">
      {/* Estilos para impresión y scrollbars */}
      <style>{`
        /* Custom scrollbar classes */
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

        @media print {
          nav, aside, header, footer, button, .no-print, [data-slot="sidebar-rail"], [data-slot="sidebar-trigger"], .border-t, svg {
            display: none !important;
          }
          body, main, html {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            display: block !important;
          }
          .bg-white {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1E36] tracking-tight">
            Conductores
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Gestión de hojas de vida, vehículos asociados y documentación legal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/conductores/asociar">
            <Button className="bg-[#0B1E36] hover:bg-[#0B1E36]/90 text-white font-semibold flex items-center gap-2">
              <Link2Icon className="w-4 h-4" />
              <span>Asociar Conductor/Vehículo</span>
            </Button>
          </Link>
          <Link to="/conductores/nuevo">
            <Button className="bg-[#5AB507] hover:bg-[#5AB507]/90 text-white font-semibold flex items-center gap-2">
              <UserPlusIcon className="w-4 h-4" />
              <span>Registrar Conductor</span>
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        // Loading State de toda la pantalla
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-215px)] no-print">
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-4 space-y-4">
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 border border-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-100 rounded-md w-2/3 animate-pulse" />
                    <div className="h-3 bg-slate-100 rounded-md w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center">
            <Clock className="w-8 h-8 text-slate-300 animate-spin mb-3" />
            <span className="text-sm font-semibold text-slate-400">Cargando conductores...</span>
          </div>
        </div>
      ) : drivers.length === 0 ? (
        // Empty State Global (cuando no hay ningún conductor registrado en la base de datos)
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-8 md:p-16 flex flex-col items-center justify-center text-center max-w-3xl mx-auto mt-10 no-print">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-6 border border-slate-100/50">
            <UsersIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            No hay conductores registrados
          </h2>
          <p className="text-sm text-slate-500 max-w-md mt-2 leading-relaxed">
            Para comenzar, realiza la apertura de la hoja de vida cargando los datos y documentos del conductor, el propietario y su vehículo asociado.
          </p>
          <Link to="/conductores/nuevo" className="mt-8">
            <Button className="bg-[#0B1E36] hover:bg-[#0B1E36]/90 text-white font-semibold px-6">
              Realizar Apertura de HV
            </Button>
          </Link>
        </div>
      ) : (
        // Split Master-Detail Layout
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch no-print">

          {/* Panel Izquierdo (Master: Buscador y Lista) */}
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl flex flex-col shadow-xs overflow-hidden h-[calc(100vh-215px)] max-h-[calc(100vh-215px)]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col gap-3 shrink-0">
              <h2 className="text-sm font-bold text-[#0B1E36] uppercase tracking-wider">
                Conductores Registrados ({filteredDrivers.length})
              </h2>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, email o placa..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#5AB507] focus:ring-1 focus:ring-[#5AB507] transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
              {filteredDrivers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No se encontraron resultados
                </div>
              ) : (
                filteredDrivers.map((d) => {
                  const isActive = selectedDriverId === d.id;
                  const hasVehicle = !!d.vehicle;

                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDriverId(d.id)}
                      className={cn(
                        "p-4 cursor-pointer hover:bg-slate-50/80 transition-all flex items-start gap-3.5 border-l-4",
                        isActive ? "bg-slate-50 border-l-[#5AB507]" : "border-l-transparent"
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center shrink-0 font-extrabold text-[#0B1E36] text-sm uppercase">
                        {d.user?.name ? d.user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : 'C'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800 text-sm truncate block">
                            {d.user?.name}
                          </span>
                        </div>
                        <span className="text-slate-500 text-xs truncate block mt-0.5 font-medium">
                          {d.user?.email}
                        </span>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          {/* Status Badge */}
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border",
                            d.status === 'DISPONIBLE' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                            d.status === 'EN_SERVICIO' && "bg-blue-50 text-blue-700 border-blue-100",
                            d.status === 'DESCONECTADO' && "bg-slate-50 text-slate-600 border-slate-200",
                            d.status === 'INACTIVO' && "bg-red-50 text-red-700 border-red-100"
                          )}>
                            {d.status}
                          </span>

                          {/* Vehicle Tag */}
                          {hasVehicle ? (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[9px] font-bold uppercase tracking-wide flex items-center gap-1">
                              <Truck className="w-2.5 h-2.5 text-slate-500" />
                              <span>{d.vehicle.plate}</span>
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 border border-slate-100 rounded-md text-[9px] font-semibold tracking-wide">
                              Sin Vehículo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel Derecho (Detail: Visualización Profesional) */}
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl flex flex-col shadow-xs overflow-hidden h-[calc(100vh-215px)] max-h-[calc(100vh-215px)]">
            {selectedDriverId === null ? (
              // Estado inicial: no hay selección
              <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 mb-6 text-slate-400 shadow-xs">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  Visualizar Hoja de Vida
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1.5 leading-relaxed font-medium">
                  Selecciona un conductor de la lista de la izquierda para ver su información detallada, vehículo asignado y documentación adjunta.
                </p>
              </div>
            ) : loadingDetail ? (
              // Loading Detail Skeleton
              <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 animate-pulse" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4.5 bg-slate-100 rounded-md w-1/3 animate-pulse" />
                    <div className="h-3.5 bg-slate-100 rounded-md w-1/4 animate-pulse" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-32 bg-slate-50 border border-slate-100/50 rounded-2xl animate-pulse" />
                  <div className="h-32 bg-slate-50 border border-slate-100/50 rounded-2xl animate-pulse" />
                </div>
              </div>
            ) : selectedDriverDetail ? (
              // Vista de Detalle Real y Profesional
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header Acciones del Detalle */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Hoja de Vida Completa
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => setDeactivateDialogOpen(true)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5 shadow-sm text-xs py-1.5 px-3.5 rounded-lg no-print"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Desactivar Hoja de Vida</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={() => window.print()}
                      className="bg-[#0B1E36] hover:bg-[#0B1E36]/90 text-white font-bold flex items-center gap-1.5 shadow-sm text-xs py-1.5 px-3.5 rounded-lg no-print"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir Reporte (PDF)</span>
                    </Button>
                  </div>
                </div>

                {/* Contenido Scrollable */}
                <div className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-6 custom-scrollbar">

                  {/* Tarjeta de Identificación Principal */}
                  <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#5AB507]/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-start gap-4">
                      {/* Avatar / Iniciales */}
                      <div className="w-16 h-16 rounded-2xl bg-[#0B1E36] text-white flex items-center justify-center font-black text-xl uppercase shadow-md shrink-0 border border-white">
                        {selectedDriverDetail.user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-black text-[#0B1E36] tracking-tight">
                            {selectedDriverDetail.user.name}
                          </h2>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border shadow-xs",
                            selectedDriverDetail.status === 'DISPONIBLE' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                            selectedDriverDetail.status === 'EN_SERVICIO' && "bg-blue-50 text-blue-700 border-blue-100",
                            selectedDriverDetail.status === 'DESCONECTADO' && "bg-slate-50 text-slate-600 border-slate-200",
                            selectedDriverDetail.status === 'INACTIVO' && "bg-red-50 text-red-700 border-red-100"
                          )}>
                            {selectedDriverDetail.status}
                          </span>
                        </div>

                        {/* Tipo de Relación (Propietario / Conductor) */}
                        <div className="flex items-center gap-2 mt-2">
                          {selectedDriverDetail.vehicle ? (
                            (() => {
                              const isOwner = selectedDriverDetail.vehicle.ownerEmail === selectedDriverDetail.user.email || !selectedDriverDetail.vehicle.ownerEmail;
                              return (
                                <span className={cn(
                                  "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-2xs border",
                                  isOwner
                                    ? "bg-emerald-100/30 text-emerald-800 border-emerald-200/50"
                                    : "bg-amber-100/30 text-amber-800 border-amber-200/50"
                                )}>
                                  {isOwner ? "Conductor y Propietario" : "Solo Conductor (Vehículo de Tercero)"}
                                </span>
                              );
                            })()
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-md text-[9px] font-black uppercase tracking-wider">
                              Sin Vehículo Asignado
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 mt-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{selectedDriverDetail.user.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{selectedDriverDetail.user.phone || 'Teléfono no registrado'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección 1: Información del Conductor */}
                  <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50/70 to-white border-b border-slate-100 border-l-4 border-l-[#0B1E36] px-5 py-3 flex items-center justify-between gap-2.5 no-print">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-100 text-[#0B1E36] shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-[#0B1E36] uppercase tracking-wider leading-none">
                            1. Información del Conductor
                          </h3>
                          <span className="text-[9px] text-slate-400 font-semibold block mt-1 leading-none">Datos personales y referencias del postulante</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setEditDriverOpen(true)}
                        className="bg-[#0B1E36] hover:bg-[#0B1E36]/90 text-white font-bold flex items-center gap-1.5 shadow-sm text-[10px] py-1.5 px-3 rounded-lg"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Editar Conductor</span>
                      </Button>
                    </div>
                    <div className="p-5 space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        <DetailRow label="Cédula de Ciudadanía" value={selectedDriverDetail.cedulaNumero} />
                        <DetailRow label="Municipio / Ciudad" value={selectedDriverDetail.city} />
                        <DetailRow label="Barrio" value={selectedDriverDetail.neighborhood} />
                        <DetailRow label="Dirección de Domicilio" value={selectedDriverDetail.address} />
                        <DetailRow label="Vencimiento de Licencia" value={selectedDriverDetail.licenciaVencimiento} />
                      </div>

                      {/* Referencias */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-50">
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                            Referencias Familiares
                          </h4>
                          <div className="space-y-2">
                            {selectedDriverDetail.referenciasFamiliares && selectedDriverDetail.referenciasFamiliares.length > 0 ? (
                              selectedDriverDetail.referenciasFamiliares.map((ref: any, idx: number) => (
                                <div key={idx} className="text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-start justify-between">
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-700 block truncate">{ref.nombre}</span>
                                    <span className="text-slate-500 font-semibold block mt-0.5">{ref.parentesco}</span>
                                  </div>
                                  <span className="text-slate-500 font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-150 self-center">
                                    {ref.celular}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-slate-400 font-medium italic p-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                                No registradas
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                            Referencias Laborales
                          </h4>
                          <div className="space-y-2">
                            {selectedDriverDetail.referenciasLaborales && selectedDriverDetail.referenciasLaborales.length > 0 ? (
                              selectedDriverDetail.referenciasLaborales.map((ref: any, idx: number) => (
                                <div key={idx} className="text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-start justify-between">
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-700 block truncate">{ref.empresa}</span>
                                    <span className="text-slate-500 font-semibold block mt-0.5">Contacto: {ref.contacto}</span>
                                  </div>
                                  <span className="text-slate-500 font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-150 self-center">
                                    {ref.celular}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-slate-400 font-medium italic p-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                                No registradas
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Documentos del Conductor */}
                      <div className="pt-4 border-t border-slate-50 space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Documentos Adjuntos (HV)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {(() => {
                            const docs = selectedDriverDetail.documents || [];
                            const fotoPerfil = docs.find((d: any) => d.type === 'FOTO_PERFIL');
                            const planilla = docs.find((d: any) => d.type === 'ANTECEDENTES');
                            const cedulas = docs.filter((d: any) => d.type === 'CEDULA');
                            const licencias = docs.filter((d: any) => d.type === 'LICENCIA_CONDUCCION');

                            return (
                              <>
                                {renderDocBadge("Foto de Perfil", fotoPerfil, "driver")}
                                {renderDocBadge("Seguridad Social / Antecedentes", planilla, "driver")}
                                {renderDocBadge("Cédula Ciudadanía (Frente)", cedulas[0], "driver")}
                                {renderDocBadge("Cédula Ciudadanía (Reverso)", cedulas[1], "driver")}
                                {renderDocBadge("Licencia de Conducción (Frente)", licencias[0], "driver")}
                                {renderDocBadge("Licencia de Conducción (Reverso)", licencias[1], "driver")}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección 2: Información del Propietario (Si hay vehículo) */}
                  {selectedDriverDetail.vehicle && (
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
                      <div className="bg-slate-50/50 border-b border-slate-100 px-5 py-3.5 flex items-center gap-2">
                        <Building2 className="w-4.5 h-4.5 text-[#0B1E36]" />
                        <h3 className="text-xs font-black text-[#0B1E36] uppercase tracking-wider">
                          2. Información del Propietario
                        </h3>
                      </div>
                      <div className="p-5 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                          <DetailRow label="Municipio / Ciudad" value={selectedDriverDetail.vehicle.ownerMunicipality} />
                          <DetailRow label="Barrio" value={selectedDriverDetail.vehicle.ownerNeighborhood} />
                          <DetailRow label="Dirección de Facturación" value={selectedDriverDetail.vehicle.ownerAddress} />
                          <DetailRow label="Teléfono de Contacto" value={selectedDriverDetail.vehicle.ownerPhone} />
                          <DetailRow label="Correo Electrónico" value={selectedDriverDetail.vehicle.ownerEmail} />
                        </div>

                        {/* Documentos de Propietario */}
                        <div className="pt-4 border-t border-slate-50 space-y-3">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Documentos Adjuntos (Propietario)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {(() => {
                              const docs = selectedDriverDetail.vehicle.documents || [];
                              const ownerCedulaFrente = docs.find((d: any) => d.type === 'OWNER_CEDULA_FRENTE');
                              const ownerCedulaReverso = docs.find((d: any) => d.type === 'OWNER_CEDULA_REVERSO');
                              const ownerRut = docs.find((d: any) => d.type === 'OWNER_RUT');
                              const ownerCertificado = docs.find((d: any) => d.type === 'OWNER_CERTIFICADO_BANCARIO');

                              return (
                                <>
                                  {renderDocBadge("Cédula Propietario (Frente)", ownerCedulaFrente, "vehicle")}
                                  {renderDocBadge("Cédula Propietario (Reverso)", ownerCedulaReverso, "vehicle")}
                                  {renderDocBadge("Registro Único Tributario (RUT)", ownerRut, "vehicle")}
                                  {renderDocBadge("Certificación Bancaria", ownerCertificado, "vehicle")}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sección 3: Información del Vehículo (Si hay vehículo) */}
                  {selectedDriverDetail.vehicle && (
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
                      <div className="bg-gradient-to-r from-slate-50/70 to-white border-b border-slate-100 border-l-4 border-l-[#5AB507] px-5 py-3 flex items-center justify-between gap-2.5 no-print">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-emerald-50 text-[#5AB507] shrink-0">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider leading-none">
                              3. Información del Vehículo
                            </h3>
                            <span className="text-[9px] text-slate-400 font-semibold block mt-1 leading-none">Características físicas, mecánicas y rastreo GPS</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setEditVehicleOpen(true)}
                          className="bg-[#5AB507] hover:bg-[#5AB507]/90 text-white font-bold flex items-center gap-1.5 shadow-sm text-[10px] py-1.5 px-3 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Editar Vehículo</span>
                        </Button>
                      </div>
                      <div className="p-5 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                          <DetailRow label="Tipo de Vehículo" value={getVehicleTypeName(selectedDriverDetail.vehicle.type)} icon={Truck} />
                          <DetailRow label="Placa" value={selectedDriverDetail.vehicle.plate} highlight icon={Tag} />
                          <DetailRow label="Marca" value={selectedDriverDetail.vehicle.brand} icon={Cpu} />
                          <DetailRow label="Modelo" value={selectedDriverDetail.vehicle.model} icon={Layers} />
                          <DetailRow label="Año de Fabricación" value={selectedDriverDetail.vehicle.year} icon={Calendar} />
                          <DetailRow label="Capacidad de Carga" value={selectedDriverDetail.vehicle.maxWeightTons ? `${selectedDriverDetail.vehicle.maxWeightTons} Toneladas` : undefined} icon={Weight} />
                          <DetailRow label="Color" value={selectedDriverDetail.vehicle.color} icon={Palette} />
                        </div>

                        {/* Satelital */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-slate-50">
                          <DetailRow label="Proveedor GPS" value={selectedDriverDetail.vehicle.satelitalNombre} icon={Globe} />
                          <DetailRow label="Usuario GPS" value={selectedDriverDetail.vehicle.satelitalUsuario} icon={User} />
                          <DetailRow label="Contraseña GPS" value={selectedDriverDetail.vehicle.satelitalContrasena ? '••••••••' : undefined} icon={Cpu} />
                        </div>

                        {/* Documentos del Vehículo */}
                        <div className="pt-4 border-t border-slate-50 space-y-3">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Documentos Adjuntos (Vehículo)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {(() => {
                              const docs = selectedDriverDetail.vehicle.documents || [];
                              const matriculas = docs.filter((d: any) => d.type === 'TARJETA_PROPIEDAD');
                              const soat = docs.find((d: any) => d.type === 'SOAT');
                              const tecnomecanica = docs.find((d: any) => d.type === 'TECNOMECANICA');
                              const seguro = docs.find((d: any) => d.type === 'SEGURO_EXTRACONTRACTUAL');
                              const autorizacion = docs.find((d: any) => d.type === 'CARTA_AUTORIZACION');

                              return (
                                <>
                                  {renderDocBadge("Matrícula / Tarjeta Propiedad (Frente)", matriculas[0], "vehicle")}
                                  {renderDocBadge("Matrícula / Tarjeta Propiedad (Reverso)", matriculas[1], "vehicle")}
                                  {renderDocBadge("SOAT Vigente", soat, "vehicle")}
                                  {renderDocBadge("Revisión Tecnomecánica", tecnomecanica, "vehicle")}
                                  {renderDocBadge("Seguro Responsabilidad Civil", seguro, "vehicle")}
                                  {renderDocBadge("Carta de Autorización", autorizacion, "vehicle")}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Registro Fotográfico del Vehículo */}
                        <div className="pt-4 border-t border-slate-50 space-y-3">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Registro Fotográfico del Vehículo
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                            {(() => {
                              const docs = selectedDriverDetail.vehicle.documents || [];
                              const fotos = docs.filter((d: any) => d.type === 'FOTO_VEHICULO');

                              return (
                                <>
                                  {renderDocBadge("Foto Frontal", fotos[0], "vehicle")}
                                  {renderDocBadge("Foto Trasera", fotos[1], "vehicle")}
                                  {renderDocBadge("Foto Lateral Izq.", fotos[2], "vehicle")}
                                  {renderDocBadge("Foto Lateral Der.", fotos[3], "vehicle")}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sección 4: Información del Planchón (solo grúas acopladas) */}
                  {selectedDriverDetail.vehicle && 
                    selectedDriverDetail.vehicle.attachment && (
                      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-50/70 to-white border-b border-slate-100 border-l-4 border-l-orange-500 px-5 py-3 flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider leading-none">
                              4. Información del Planchón / Acople
                            </h3>
                            <span className="text-[9px] text-slate-400 font-semibold block mt-1 leading-none">Detalles técnicos de la plataforma o remolque acoplado</span>
                          </div>
                        </div>
                        <div className="p-5 space-y-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            <DetailRow label="Tipo de Acople" value={getAttachmentTypeName(selectedDriverDetail.vehicle.attachment.type)} icon={Truck} />
                            <DetailRow label="Placa del Planchón" value={selectedDriverDetail.vehicle.attachment.plate} highlight icon={Tag} />
                            <DetailRow label="Marca" value={selectedDriverDetail.vehicle.attachment.brand} icon={Cpu} />
                            <DetailRow label="Modelo" value={selectedDriverDetail.vehicle.attachment.model} icon={Layers} />
                            <DetailRow label="Año" value={selectedDriverDetail.vehicle.attachment.year} icon={Calendar} />
                            <DetailRow label="Capacidad (Tons)" value={selectedDriverDetail.vehicle.attachment.maxWeightTons ? `${selectedDriverDetail.vehicle.attachment.maxWeightTons} Toneladas` : undefined} icon={Weight} />
                          </div>

                          {/* Documentos del planchón */}
                          <div className="pt-4 border-t border-slate-50 space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Documentos Adjuntos (Planchón)
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              {(() => {
                                const docs = selectedDriverDetail.vehicle.attachment.documents || [];
                                const tarjeta = docs.find((d: any) => d.type === 'TARJETA_PROPIEDAD');
                                const fotoPlanchon = docs.find((d: any) => d.type === 'FOTO_PLANCHON');

                                return (
                                  <>
                                    {renderDocBadge("Tarjeta de Propiedad", tarjeta, "attachment")}
                                    {renderDocBadge("Foto General del Planchón", fotoPlanchon, "attachment")}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 bg-[#0B1E36]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Previsualización de Documento</span>
                <h3 className="text-sm font-bold text-[#0B1E36]">{previewDoc.label}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#5AB507] hover:text-[#5AB507]/90 px-3 py-1.5 rounded-xl hover:bg-slate-50 border border-slate-150 transition-all bg-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Abrir en pestaña nueva</span>
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100/50 p-6 flex items-center justify-center overflow-auto min-h-[50vh]">
              {previewDoc.url.toLowerCase().includes('.pdf') ? (
                <iframe src={previewDoc.url} className="w-full h-full min-h-[65vh] border-0 rounded-lg shadow-xs bg-white" />
              ) : (
                <img src={previewDoc.url} alt={previewDoc.label} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md bg-white p-2" />
              )}
            </div>
            {previewDoc.status !== 'APROBADO' && (
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold bg-white"
                  onClick={() => {
                    handleRejectDocument(previewDoc.type, previewDoc.id, previewDoc.label);
                    setPreviewDoc(null);
                  }}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  <span>Rechazar Documento</span>
                </Button>
                <Button
                  size="sm"
                  className="bg-[#5AB507] hover:bg-[#5AB507]/90 text-white font-semibold"
                  onClick={() => {
                    handleApproveDocument(previewDoc.type, previewDoc.id, previewDoc.label);
                    setPreviewDoc(null);
                  }}
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  <span>Aprobar Documento</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Editar Conductor */}
      <Dialog open={editDriverOpen} onOpenChange={setEditDriverOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Información de Conductor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateDriverSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="drv-name" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nombre Completo</Label>
                <Input id="drv-name" type="text" value={driverForm.name} onChange={e => setDriverForm({ ...driverForm, name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="drv-email" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Correo Electrónico</Label>
                <Input id="drv-email" type="email" value={driverForm.email} onChange={e => setDriverForm({ ...driverForm, email: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="drv-phone" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Teléfono</Label>
                <Input id="drv-phone" type="text" value={driverForm.phone} onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="drv-cedula" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Número de Cédula</Label>
                <Input id="drv-cedula" type="text" value={driverForm.cedulaNumero} onChange={e => setDriverForm({ ...driverForm, cedulaNumero: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="drv-licence" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Vencimiento de Licencia</Label>
                <Input id="drv-licence" type="date" value={driverForm.licenciaVencimiento ? driverForm.licenciaVencimiento.substring(0, 10) : ''} onChange={e => setDriverForm({ ...driverForm, licenciaVencimiento: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="drv-city" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Municipio / Ciudad</Label>
                <Input id="drv-city" type="text" value={driverForm.city} onChange={e => setDriverForm({ ...driverForm, city: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="drv-neighborhood" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Barrio</Label>
                <Input id="drv-neighborhood" type="text" value={driverForm.neighborhood} onChange={e => setDriverForm({ ...driverForm, neighborhood: e.target.value })} required />
              </div>
              <div className="col-span-2">
                <Label htmlFor="drv-address" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dirección de Domicilio</Label>
                <Input id="drv-address" type="text" value={driverForm.address} onChange={e => setDriverForm({ ...driverForm, address: e.target.value })} required />
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditDriverOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-[#0B1E36] hover:bg-[#0B1E36]/90 text-white font-semibold">
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Vehículo */}
      <Dialog open={editVehicleOpen} onOpenChange={setEditVehicleOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Vehículo & Propietario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateVehicleSubmit} className="space-y-6 pt-2">
            {/* Información General */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">1. Datos del Vehículo</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="vh-plate" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Placa</Label>
                  <Input id="vh-plate" type="text" value={vehicleForm.plate} onChange={e => setVehicleForm({ ...vehicleForm, plate: e.target.value })} required className="uppercase" />
                </div>
                <div>
                  <Label htmlFor="vh-brand" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Marca</Label>
                  <Input id="vh-brand" type="text" value={vehicleForm.brand} onChange={e => setVehicleForm({ ...vehicleForm, brand: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="vh-model" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Modelo</Label>
                  <Input id="vh-model" type="text" value={vehicleForm.model} onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="vh-year" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Año</Label>
                  <Input id="vh-year" type="number" value={vehicleForm.year} onChange={e => setVehicleForm({ ...vehicleForm, year: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="vh-color" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Color</Label>
                  <Input id="vh-color" type="text" value={vehicleForm.color} onChange={e => setVehicleForm({ ...vehicleForm, color: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="vh-weight" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Capacidad Carga (Tons)</Label>
                  <Input id="vh-weight" type="number" step="0.1" value={vehicleForm.maxWeightTons} onChange={e => setVehicleForm({ ...vehicleForm, maxWeightTons: e.target.value })} required />
                </div>
              </div>
            </div>

            {/* Monitoreo GPS Satelital */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">2. Monitoreo GPS Satelital</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="vh-gps-provider" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Proveedor GPS</Label>
                  <Input id="vh-gps-provider" type="text" value={vehicleForm.satelitalNombre} onChange={e => setVehicleForm({ ...vehicleForm, satelitalNombre: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="vh-gps-user" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Usuario GPS</Label>
                  <Input id="vh-gps-user" type="text" value={vehicleForm.satelitalUsuario} onChange={e => setVehicleForm({ ...vehicleForm, satelitalUsuario: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="vh-gps-password" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nueva Contraseña GPS</Label>
                  <Input id="vh-gps-password" type="password" placeholder="Solo si desea cambiarla" onChange={e => setVehicleForm({ ...vehicleForm, satelitalContrasena: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Información del Propietario */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">3. Información del Propietario</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-2 md:col-span-3">
                  <Label htmlFor="vh-owner-name" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nombre Propietario</Label>
                  <Input id="vh-owner-name" type="text" value={vehicleForm.ownerName} onChange={e => setVehicleForm({ ...vehicleForm, ownerName: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="vh-owner-city" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Municipio / Ciudad</Label>
                  <Input id="vh-owner-city" type="text" value={vehicleForm.ownerMunicipality} onChange={e => setVehicleForm({ ...vehicleForm, ownerMunicipality: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="vh-owner-neighborhood" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Barrio</Label>
                  <Input id="vh-owner-neighborhood" type="text" value={vehicleForm.ownerNeighborhood} onChange={e => setVehicleForm({ ...vehicleForm, ownerNeighborhood: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="vh-owner-address" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dirección Facturación</Label>
                  <Input id="vh-owner-address" type="text" value={vehicleForm.ownerAddress} onChange={e => setVehicleForm({ ...vehicleForm, ownerAddress: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="vh-owner-phone" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Teléfono Contacto</Label>
                  <Input id="vh-owner-phone" type="text" value={vehicleForm.ownerPhone} onChange={e => setVehicleForm({ ...vehicleForm, ownerPhone: e.target.value })} required />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="vh-owner-email" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Correo Electrónico</Label>
                  <Input id="vh-owner-email" type="email" value={vehicleForm.ownerEmail} onChange={e => setVehicleForm({ ...vehicleForm, ownerEmail: e.target.value })} required />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditVehicleOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-[#0B1E36] hover:bg-[#0B1E36]/90 text-white font-semibold">
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Desactivación */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar Hoja de Vida?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas desactivar la hoja de vida de <span className="font-extrabold text-slate-700">{selectedDriverDetail?.user?.name}</span>? 
              Esto cambiará el estado del conductor a <span className="font-bold text-red-600">INACTIVO</span> y no podrá ser asignado a ningún viaje en el panel de control.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivateDriver} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
              Sí, desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


// === Componentes Auxiliares Locales ===

function DetailRow({ label, value, highlight, icon: Icon }: { label: string; value: string | number | undefined; highlight?: boolean; icon?: any }) {
  return (
    <div className="min-w-0 flex items-start gap-2">
      {Icon && (
        <div className="p-1 rounded-lg bg-slate-50 text-slate-400 shrink-0 border border-slate-100 mt-0.5">
          <Icon className="w-3.5 h-3.5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider leading-none">
          {label}
        </span>
        <span className={cn(
          "text-xs font-semibold block mt-1.5 truncate",
          highlight ? "text-[#0B1E36] font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-200 text-amber-800" : "text-slate-700"
        )} title={String(value || '')}>
          {value || 'No especificado'}
        </span>
      </div>
    </div>
  );
}

function DocumentPreviewBadge({
  label,
  doc,
  onPreview,
  onApprove,
  onReject
}: {
  label: string;
  doc?: { fileUrl: string; status: string };
  onPreview: (label: string, url: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  if (!doc) {
    return (
      <div className="flex items-center gap-2.5 p-3 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-xs opacity-60">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold shrink-0">
          N/A
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-slate-400 text-[9px] font-bold block uppercase tracking-wider leading-none">{label}</span>
          <span className="text-slate-400 font-semibold block truncate mt-1 leading-none">
            No adjuntado
          </span>
        </div>
      </div>
    );
  }

  const fileUrl = doc.fileUrl;
  const isPdf = fileUrl.toLowerCase().includes('.pdf');
  const status = doc.status;

  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'APROBADO':
        return {
          colorClass: 'border-emerald-100 bg-emerald-50/10 text-emerald-700 hover:border-emerald-200',
          badge: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        };
      case 'RECHAZADO':
        return {
          colorClass: 'border-red-100 bg-red-50/10 text-red-700 hover:border-red-200',
          badge: <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
        };
      default:
        return {
          colorClass: 'border-amber-100 bg-amber-50/10 text-amber-700 hover:border-amber-200',
          badge: <Clock className="w-4 h-4 text-amber-500 shrink-0" />
        };
    }
  };

  const { colorClass, badge } = getStatusDetails(status);

  // Obtener URL absoluta para la previsualización
  const absoluteUrl = fileUrl.startsWith('http://') || fileUrl.startsWith('https://')
    ? fileUrl
    : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;

  return (
    <div
      onClick={() => onPreview(label, absoluteUrl)}
      className={cn(
        "flex items-center justify-between gap-2.5 p-3 border rounded-xl text-xs min-w-0 cursor-pointer hover:shadow-xs transition-all bg-white group",
        colorClass
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-extrabold select-none transition-transform group-hover:scale-105 shadow-xs border",
          isPdf ? "bg-red-50 text-red-600 border-red-100/50" : "bg-emerald-50 text-emerald-600 border-emerald-100/50"
        )}>
          {isPdf ? 'PDF' : 'IMG'}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-slate-400 text-[9px] font-bold block uppercase tracking-wider leading-none">{label}</span>
          <span className="text-slate-700 font-semibold block truncate mt-1 leading-none flex items-center gap-1 group-hover:text-[#0B1E36]">
            <span>Ver documento</span>
            <Eye className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </span>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-1.5 no-print" onClick={e => e.stopPropagation()}>
        {status !== 'APROBADO' && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApprove();
              }}
              title="Aprobar documento"
              className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all shadow-2xs hover:scale-105"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject();
              }}
              title="Rechazar documento"
              className="w-6 h-6 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-2xs hover:scale-105"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        <div title={`Estado: ${status}`}>
          {badge}
        </div>
      </div>
    </div>
  );
}


