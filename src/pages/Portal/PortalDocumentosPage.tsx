import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { UploadIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { driversService } from '@/services/drivers.service';

interface DocItem {
  id: number;
  type: string;
  status: 'PENDIENTE' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO';
  fileUrl: string | null;
  rejectionReason?: string | null;
  expiresAt?: string | null;
}

type DocSlot = DocItem | { type: string; status: null };

const PERSONAL_TYPES = ['CEDULA', 'LICENCIA_CONDUCCION', 'FOTO_PERFIL', 'ANTECEDENTES'];
const VEHICLE_TYPES = [
  'SOAT',
  'TECNOMECANICA',
  'TARJETA_PROPIEDAD',
  'SEGURO_EXTRACONTRACTUAL',
  'FOTO_VEHICULO',
  'OWNER_CEDULA_FRENTE',
  'OWNER_CEDULA_REVERSO',
  'OWNER_RUT',
  'OWNER_CERTIFICADO_BANCARIO',
  'CARTA_AUTORIZACION',
];
const ATTACHMENT_TYPES = ['SOAT', 'TECNOMECANICA', 'TARJETA_PROPIEDAD', 'FOTO_PLANCHON'];

const TYPE_LABEL: Record<string, string> = {
  CEDULA: 'Cédula',
  LICENCIA_CONDUCCION: 'Licencia de conducción',
  FOTO_PERFIL: 'Foto de perfil',
  ANTECEDENTES: 'Antecedentes',
  SOAT: 'SOAT',
  TECNOMECANICA: 'Tecnomecánica',
  TARJETA_PROPIEDAD: 'Tarjeta de propiedad',
  SEGURO_EXTRACONTRACTUAL: 'Seguro extracontractual',
  FOTO_VEHICULO: 'Foto del vehículo',
  OWNER_CEDULA_FRENTE: 'Cédula propietario (frente)',
  OWNER_CEDULA_REVERSO: 'Cédula propietario (reverso)',
  OWNER_RUT: 'RUT propietario',
  OWNER_CERTIFICADO_BANCARIO: 'Certificado bancario',
  CARTA_AUTORIZACION: 'Carta de autorización',
  FOTO_PLANCHON: 'Foto del planchón',
};

const STATUS_STYLE: Record<string, string> = {
  PENDIENTE: 'bg-slate-100 text-slate-600',
  EN_REVISION: 'bg-blue-50 text-blue-700',
  APROBADO: 'bg-emerald-50 text-emerald-700',
  RECHAZADO: 'bg-red-50 text-red-600',
};

function buildSlots(types: string[], docs: DocItem[]): DocSlot[] {
  return types.map((type) => docs.find((d) => d.type === type) ?? { type, status: null });
}

function DocumentRow({ slot, onUpload }: { slot: DocSlot; onUpload: (file: File) => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl bg-white border border-slate-100 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-slate-800">{TYPE_LABEL[slot.type] ?? slot.type}</span>
        <Badge className={slot.status ? STATUS_STYLE[slot.status] : 'bg-slate-100 text-slate-400'}>
          {slot.status ?? 'SIN SUBIR'}
        </Badge>
      </div>
      {slot.status === 'RECHAZADO' && 'rejectionReason' in slot && slot.rejectionReason && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{slot.rejectionReason}</p>
      )}
      <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="self-start flex items-center gap-1.5"
      >
        <UploadIcon className="h-3.5 w-3.5" />
        <span>{uploading ? 'Subiendo…' : slot.status === 'RECHAZADO' ? 'Resubir' : slot.status ? 'Actualizar' : 'Subir'}</span>
      </Button>
    </div>
  );
}

export function PortalDocumentosPage() {
  const [personal, setPersonal] = useState<DocItem[] | null>(null);
  const [vehicle, setVehicle] = useState<DocItem[] | null>(null);
  const [attachment, setAttachment] = useState<DocItem[] | null>(null);
  const [hasVehicle, setHasVehicle] = useState(true);
  const [hasAttachment, setHasAttachment] = useState(true);

  useEffect(() => {
    driversService
      .getCurrentDriverDocuments()
      .then((res) => setPersonal(res.data))
      .catch(() => toast.error('No se pudieron cargar tus documentos'));

    driversService
      .getMeVehicleDocuments()
      .then((res) => setVehicle(res.data))
      .catch(() => {
        setHasVehicle(false);
        setVehicle([]);
      });

    driversService
      .getMeAttachmentDocuments()
      .then((res) => setAttachment(res.data))
      .catch(() => {
        setHasAttachment(false);
        setAttachment([]);
      });
  }, []);

  async function uploadPersonal(type: string, file: File) {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file);
    try {
      await driversService.uploadDriverDocument(formData);
      toast.success('Documento subido');
      const res = await driversService.getCurrentDriverDocuments();
      setPersonal(res.data);
    } catch {
      toast.error('No se pudo subir el documento');
    }
  }

  async function uploadVehicle(type: string, file: File) {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file);
    try {
      await driversService.uploadVehicleDocument(formData);
      toast.success('Documento subido');
      const res = await driversService.getMeVehicleDocuments();
      setVehicle(res.data);
    } catch {
      toast.error('No se pudo subir el documento');
    }
  }

  async function uploadAttachment(type: string, file: File) {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file);
    try {
      await driversService.uploadAttachmentDocument(formData);
      toast.success('Documento subido');
      const res = await driversService.getMeAttachmentDocuments();
      setAttachment(res.data);
    } catch {
      toast.error('No se pudo subir el documento');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-extrabold text-[#0B1E36]">Mis documentos</h1>
        <p className="text-sm text-slate-500 mt-0.5">Revisa el estado y sube o resube lo que falte.</p>
      </div>

      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="vehicle">Vehículo</TabsTrigger>
          <TabsTrigger value="attachment">Planchón</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="pt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {personal === null ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : (
            buildSlots(PERSONAL_TYPES, personal).map((slot) => (
              <DocumentRow key={slot.type} slot={slot} onUpload={(file) => uploadPersonal(slot.type, file)} />
            ))
          )}
        </TabsContent>

        <TabsContent value="vehicle" className="pt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {vehicle === null ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : !hasVehicle ? (
            <p className="text-sm text-slate-400 text-center py-8 md:col-span-2">Aún no tienes un vehículo registrado.</p>
          ) : (
            buildSlots(VEHICLE_TYPES, vehicle).map((slot) => (
              <DocumentRow key={slot.type} slot={slot} onUpload={(file) => uploadVehicle(slot.type, file)} />
            ))
          )}
        </TabsContent>

        <TabsContent value="attachment" className="pt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {attachment === null ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : !hasAttachment ? (
            <p className="text-sm text-slate-400 text-center py-8 md:col-span-2">No tienes un planchón registrado.</p>
          ) : (
            buildSlots(ATTACHMENT_TYPES, attachment).map((slot) => (
              <DocumentRow key={slot.type} slot={slot} onUpload={(file) => uploadAttachment(slot.type, file)} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
