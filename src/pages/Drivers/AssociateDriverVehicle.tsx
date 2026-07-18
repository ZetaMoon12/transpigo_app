import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Link2Icon,
  UnlinkIcon,
  UserIcon,
  TruckIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { driversService } from '@/services';

interface DriverMock {
  id: string;
  name: string;
  cedula: string;
  phone: string;
}

interface VehicleMock {
  id: string;
  plate: string;
  brand: string;
  type: string;
  capacity: string;
}

interface AssociationMock {
  id: string;
  driverId: string;
  driverName: string;
  driverCedula: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleType: string;
}

export function AssociateDriverVehicle() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Available Drivers State
  const [availableDrivers, setAvailableDrivers] = useState<DriverMock[]>([]);

  // Available Vehicles State
  const [availableVehicles, setAvailableVehicles] = useState<VehicleMock[]>([]);

  // Current Associations State
  const [associations, setAssociations] = useState<AssociationMock[]>([]);

  // Selected state for pairing form
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  // Autocomplete Search States
  const [driverSearch, setDriverSearch] = useState('');
  const [isDriverOpen, setIsDriverOpen] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [isVehicleOpen, setIsVehicleOpen] = useState(false);

  // Load data from API with fallback to Mock Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [driversRes, vehiclesRes, associationsRes] = await Promise.all([
        driversService.getAvailableDrivers(),
        driversService.getAvailableVehicles(),
        driversService.getActiveAssociations(),
      ]);
      setAvailableDrivers(driversRes.data || []);
      setAvailableVehicles(vehiclesRes.data || []);
      setAssociations(associationsRes.data || []);
    } catch (err: any) {
      console.warn('API error, falling back to mock data:', err);
      // Load mock data on API failure so the module is immediately testable
      setAvailableDrivers([
        { id: 'd1', name: 'Carlos Mario Gómez', cedula: '71.222.333', phone: '3124445555' },
        { id: 'd2', name: 'Martha Lucía Pérez', cedula: '1.036.444.555', phone: '3156667777' },
        { id: 'd3', name: 'Hernán Darío Alzate', cedula: '8.222.999', phone: '3008889999' },
      ]);
      setAvailableVehicles([
        { id: 'v1', plate: 'WXZ987', brand: 'Chevrolet NQR', type: 'Grúa de Plataforma', capacity: '4.5 T' },
        { id: 'v2', plate: 'TRQ555', brand: 'Volvo FMX', type: 'Camión 10 Toneladas', capacity: '12 T' },
        { id: 'v3', plate: 'KLO345', brand: 'Hino Dutro', type: 'Camión 5 Toneladas', capacity: '5 T' },
      ]);
      setAssociations([
        {
          id: 'a1',
          driverId: 'd4',
          driverName: 'Juan Pérez',
          driverCedula: '1.020.304.050',
          vehicleId: 'v4',
          vehiclePlate: 'AAA123',
          vehicleBrand: 'Kenworth T800',
          vehicleType: 'Camión Refrigerado',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Find currently selected details
  const selectedDriver = availableDrivers.find((d) => d.id === selectedDriverId);
  const selectedVehicle = availableVehicles.find((v) => v.id === selectedVehicleId);

  // Filters for available items
  const filteredDrivers = availableDrivers.filter(
    (d) =>
      d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.cedula.toLowerCase().includes(driverSearch.toLowerCase())
  );

  const filteredVehicles = availableVehicles.filter(
    (v) =>
      v.plate.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.brand.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.type.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const handleAssociate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDriverId || !selectedVehicleId) {
      toast.error('Por favor selecciona tanto un conductor como un vehículo');
      return;
    }

    if (!selectedDriver || !selectedVehicle) return;

    try {
      await driversService.associateDriverVehicle(selectedDriverId, selectedVehicleId);
      toast.success('Asociación realizada exitosamente');
      loadData();
    } catch (err: any) {
      console.warn('API associate failed, executing locally:', err);
      // Fallback local logic
      const newAssoc: AssociationMock = {
        id: 'a_' + Date.now(),
        driverId: selectedDriver.id,
        driverName: selectedDriver.name,
        driverCedula: selectedDriver.cedula,
        vehicleId: selectedVehicle.id,
        vehiclePlate: selectedVehicle.plate,
        vehicleBrand: selectedVehicle.brand,
        vehicleType: selectedVehicle.type,
      };

      setAssociations((prev) => [...prev, newAssoc]);
      setAvailableDrivers((prev) => prev.filter((d) => d.id !== selectedDriverId));
      setAvailableVehicles((prev) => prev.filter((v) => v.id !== selectedVehicleId));
      toast.success('Asociación realizada exitosamente (Simulado)');
    } finally {
      setSelectedDriverId('');
      setSelectedVehicleId('');
      setDriverSearch('');
      setVehicleSearch('');
    }
  };

  const handleDisassociate = async (assoc: AssociationMock) => {
    try {
      await driversService.disassociateDriverVehicle(assoc.driverId, assoc.vehicleId);
      toast.success('Conductor y vehículo desasociados con éxito');
      loadData();
    } catch (err: any) {
      console.warn('API disassociate failed, executing locally:', err);
      // Fallback local logic
      const restoredDriver: DriverMock = {
        id: assoc.driverId,
        name: assoc.driverName,
        cedula: assoc.driverCedula,
        phone: '3000000000',
      };

      const restoredVehicle: VehicleMock = {
        id: assoc.vehicleId,
        plate: assoc.vehiclePlate,
        brand: assoc.vehicleBrand,
        type: assoc.vehicleType,
        capacity: 'N/A',
      };

      setAvailableDrivers((prev) => [...prev, restoredDriver]);
      setAvailableVehicles((prev) => [...prev, restoredVehicle]);
      setAssociations((prev) => prev.filter((a) => a.id !== assoc.id));
      toast.success('Desasociación completada (Simulado)');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/conductores')}
            className="text-slate-800 border-slate-300 bg-white hover:bg-slate-100 hover:text-slate-950 shadow-xs flex items-center justify-center h-9 w-9 p-0"
            title="Volver a Conductores"
          >
            <ArrowLeftIcon className="w-5 h-5 stroke-[2.5]" />
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0B1E36] tracking-tight">
              Asociación de Conductor y Vehículo
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Asigna conductores disponibles a vehículos activos para iniciar operaciones.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-60">
          <Spinner className="w-8 h-8 text-[#5AB507]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side: Form */}
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl shadow-xs p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Nueva Asociación</h2>
              <p className="text-xs text-slate-500 font-medium">Asocia una pareja para habilitar sus viajes en carretera.</p>
            </div>

            <form onSubmit={handleAssociate} className="space-y-6">
              {/* Driver Select (Searchable Combobox) */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Conductor Disponible
                </label>
                
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Buscar conductor por nombre o CC..."
                    value={selectedDriver ? selectedDriver.name : driverSearch}
                    onChange={(e) => {
                      if (selectedDriverId) {
                        setSelectedDriverId('');
                      }
                      setDriverSearch(e.target.value);
                      setIsDriverOpen(true);
                    }}
                    onFocus={() => setIsDriverOpen(true)}
                    className="h-9 w-full rounded-md border border-input bg-white px-2.5 pr-8 py-1 text-sm shadow-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  />
                  {selectedDriverId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDriverId('');
                        setDriverSearch('');
                      }}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <XIcon className="w-4 h-4 stroke-[2]" />
                    </button>
                  ) : (
                    <span className="absolute right-2.5 text-slate-400 pointer-events-none">
                      <SearchIcon className="w-4 h-4" />
                    </span>
                  )}
                </div>

                {isDriverOpen && !selectedDriverId && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDriverOpen(false)} />
                    <div className="absolute z-50 left-0 right-0 top-16 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredDrivers.length === 0 ? (
                        <div className="p-3 text-xs text-slate-400 text-center font-medium">
                          No se encontraron conductores
                        </div>
                      ) : (
                        filteredDrivers.map((d) => (
                          <div
                            key={d.id}
                            onClick={() => {
                              setSelectedDriverId(d.id);
                              setDriverSearch('');
                              setIsDriverOpen(false);
                            }}
                            className="p-2.5 hover:bg-[#5AB507]/10 hover:text-slate-800 text-xs font-semibold text-slate-700 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                          >
                            <div>{d.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">CC: {d.cedula}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Vehicle Select (Searchable Combobox) */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Vehículo Disponible
                </label>
                
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Buscar por placa, marca o tipo..."
                    value={selectedVehicle ? `${selectedVehicle.plate} — ${selectedVehicle.brand}` : vehicleSearch}
                    onChange={(e) => {
                      if (selectedVehicleId) {
                        setSelectedVehicleId('');
                      }
                      setVehicleSearch(e.target.value);
                      setIsVehicleOpen(true);
                    }}
                    onFocus={() => setIsVehicleOpen(true)}
                    className="h-9 w-full rounded-md border border-input bg-white px-2.5 pr-8 py-1 text-sm shadow-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  />
                  {selectedVehicleId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVehicleId('');
                        setVehicleSearch('');
                      }}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <XIcon className="w-4 h-4 stroke-[2]" />
                    </button>
                  ) : (
                    <span className="absolute right-2.5 text-slate-400 pointer-events-none">
                      <SearchIcon className="w-4 h-4" />
                    </span>
                  )}
                </div>

                {isVehicleOpen && !selectedVehicleId && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsVehicleOpen(false)} />
                    <div className="absolute z-50 left-0 right-0 top-16 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredVehicles.length === 0 ? (
                        <div className="p-3 text-xs text-slate-400 text-center font-medium">
                          No se encontraron vehículos
                        </div>
                      ) : (
                        filteredVehicles.map((v) => (
                          <div
                            key={v.id}
                            onClick={() => {
                              setSelectedVehicleId(v.id);
                              setVehicleSearch('');
                              setIsVehicleOpen(false);
                            }}
                            className="p-2.5 hover:bg-[#5AB507]/10 hover:text-slate-800 text-xs font-semibold text-slate-700 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                          >
                            <div><span className="text-[#5AB507] font-bold">{v.plate}</span> — {v.brand}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{v.type}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Preview Cards */}
              {(selectedDriver || selectedVehicle) && (
                <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-200">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Previsualización</h3>
                  
                  {selectedDriver && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-[#0B1E36]/5 text-[#0B1E36] flex items-center justify-center shrink-0">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{selectedDriver.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">CC: {selectedDriver.cedula} • Cel: {selectedDriver.phone}</p>
                      </div>
                    </div>
                  )}

                  {selectedVehicle && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-[#5AB507]/10 text-[#5AB507] flex items-center justify-center shrink-0">
                        <TruckIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{selectedVehicle.plate} — {selectedVehicle.brand}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{selectedVehicle.type} • Capacidad: {selectedVehicle.capacity}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={!selectedDriverId || !selectedVehicleId}
                className="w-full bg-[#5AB507] hover:bg-[#5AB507]/90 text-white font-semibold flex items-center justify-center gap-2"
              >
                <Link2Icon className="w-4 h-4" />
                <span>Asociar Pareja</span>
              </Button>
            </form>
          </div>

          {/* Right Side: Active Associations List */}
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl shadow-xs p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Asociaciones Activas</h2>
              <p className="text-xs text-slate-500 font-medium">Parejas asignadas actualmente en la base de datos.</p>
            </div>

            {associations.length === 0 ? (
              <div className="border-2 border-dashed border-slate-100 rounded-xl p-10 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                  <CheckCircle2Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">No hay asociaciones activas</p>
                  <p className="text-xs text-slate-400 font-medium">Selecciona un conductor y un vehículo para iniciar una asignación.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {associations.map((assoc) => (
                  <div
                    key={assoc.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-slate-100 rounded-xl p-4 bg-slate-50/20 hover:bg-slate-50/50 hover:border-slate-200 transition-colors gap-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                      {/* Driver Block */}
                      <div className="flex items-center gap-2.5 min-w-0 max-w-[200px]">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block truncate">{assoc.driverName}</span>
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Conductor</span>
                        </div>
                      </div>

                      {/* Arrow / Link Icon connector */}
                      <div className="hidden sm:flex text-slate-300">
                        <Link2Icon className="w-4 h-4" />
                      </div>

                      {/* Vehicle Block */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <TruckIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block">
                            <span className="text-[#5AB507] font-extrabold mr-1">{assoc.vehiclePlate}</span> — {assoc.vehicleBrand}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium leading-none mt-0.5">{assoc.vehicleType}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisassociate(assoc)}
                      className="border border-transparent flex items-center gap-1 hover:shadow-xs self-start sm:self-auto"
                    >
                      <UnlinkIcon className="w-3.5 h-3.5" />
                      <span>Desasociar</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
