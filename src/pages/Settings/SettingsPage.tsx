import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { tenantService, type TenantProfile } from '@/services/tenant.service';
import { formatCurrency } from '@/utils/helpers';
import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogoDropzone } from './components/LogoDropzone';
import {
  Building2Icon,
  PaletteIcon,
  SparklesIcon,
  UsersIcon,
  PackageIcon,
  RefreshCwIcon,
} from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  TRIAL: 'Prueba',
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
  CANCELLED: 'Cancelado',
};

const STATUS_CLASS: Record<string, string> = {
  TRIAL: 'bg-amber-50 text-amber-700',
  ACTIVE: 'bg-accent/10 text-accent',
  SUSPENDED: 'bg-red-50 text-red-600',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function SettingsPage() {
  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingNit, setBillingNit] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [brandName, setBrandName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [savingBranding, setSavingBranding] = useState(false);

  useEffect(() => {
    tenantService
      .getProfile()
      .then((res) => {
        const t = res.data;
        setTenant(t);
        setName(t.name);
        setBillingEmail(t.billingEmail);
        setBillingNit(t.billingNit ?? '');
        setBrandName(t.settings?.brandName ?? '');
        setLogoUrl(t.settings?.logoUrl ?? '');
        setPrimaryColor(t.settings?.primaryColor ?? '');
        setSupportEmail(t.settings?.supportEmail ?? '');
        setSupportPhone(t.settings?.supportPhone ?? '');
      })
      .catch(() => toast.error('No se pudo cargar el perfil de la empresa'))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await tenantService.updateProfile({
        name,
        billingEmail,
        billingNit: billingNit || undefined,
      });
      setTenant((prev) => (prev ? { ...prev, ...res.data } : prev));
      toast.success('Datos generales actualizados');
    } catch {
      toast.error('No se pudieron guardar los datos generales');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveBranding(e: FormEvent) {
    e.preventDefault();
    setSavingBranding(true);
    try {
      const res = await tenantService.updateProfileSettings({
        brandName: brandName || undefined,
        logoUrl: logoUrl || undefined,
        primaryColor: primaryColor || undefined,
        supportEmail: supportEmail || undefined,
        supportPhone: supportPhone || undefined,
      });
      setTenant((prev) => (prev ? { ...prev, settings: { ...prev.settings, ...res.data } } : prev));
      toast.success('Marca y soporte actualizados');
    } catch {
      toast.error('No se pudo guardar la configuración de marca');
    } finally {
      setSavingBranding(false);
    }
  }

  if (isLoading || !tenant) {
    return (
      <div className="p-6 @lg:p-8 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 @4xl:grid-cols-[280px_1fr] gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const settings = tenant.settings;
  const subscription = tenant.subscription;

  return (
    <div className="p-6 @lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-[#0B1E36] tracking-tight">Perfil de la empresa</h1>
        <p className="text-sm text-slate-500 font-medium">
          Administra la información, el plan y la marca de tu espacio de trabajo en TranspiGO.
        </p>
      </div>

      {/* Breakpoints @ (container queries, ver <main> en MainLayout) reaccionan al ancho
          real disponible, no al viewport completo — con el sidebar expandido en un portátil,
          el viewport puede ser "grande" pero el espacio real para el contenido, no. */}
      <div className="grid grid-cols-1 @4xl:grid-cols-[280px_1fr] gap-6 items-start">
        {/* ── Columna izquierda: identidad + plan ── */}
        <Card className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0B1E36] text-xl font-extrabold text-white ring-4 ring-accent/10">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt={tenant.name} className="h-full w-full object-contain p-2" />
            ) : (
              getInitials(tenant.name)
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-slate-800">{tenant.name}</span>
            <span className="text-xs text-slate-400">{tenant.slug}.transpigo.com</span>
          </div>
          <Badge className={STATUS_CLASS[tenant.status] ?? 'bg-slate-100 text-slate-600'}>
            {STATUS_LABEL[tenant.status] ?? tenant.status}
          </Badge>
        </Card>

        <Card className="@container">
          <form onSubmit={handleSaveProfile}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2Icon className="h-4 w-4 text-accent" /> Datos generales
              </CardTitle>
              <CardDescription>Nombre legal y datos de facturación de tu empresa.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 @md:grid-cols-2 gap-5">
              <FormField label="Nombre de la empresa" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </FormField>
              <FormField label="Email de facturación" required>
                <Input
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  required
                />
              </FormField>
              <FormField label="NIT">
                <Input value={billingNit} onChange={(e) => setBillingNit(e.target.value)} />
              </FormField>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* ── Plan: sección propia y destacada ── */}
        <Card className="relative overflow-hidden border-none bg-[#0B1E36] text-white shadow-sm">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 20% 0%, rgba(90,181,7,0.18) 0%, transparent 60%)',
            }}
          />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-white">
              <SparklesIcon className="h-4 w-4 text-[#5AB507]" /> Tu plan
            </CardTitle>
            <CardDescription className="text-white/50">Gestionado por TranspiGO.</CardDescription>
          </CardHeader>
          <CardContent className="relative flex flex-col gap-4">
            <div className="text-2xl font-extrabold tracking-tight text-white">{tenant.plan}</div>

            {settings && (
              <div className="flex flex-col gap-2.5 text-xs text-white/70">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-3.5 w-3.5 text-[#5AB507] shrink-0" />
                  Hasta {settings.maxDrivers.toLocaleString('es-CO')} conductores
                </div>
                <div className="flex items-center gap-2">
                  <PackageIcon className="h-3.5 w-3.5 text-[#5AB507] shrink-0" />
                  Hasta {settings.maxMonthlyServices.toLocaleString('es-CO')} servicios/mes
                </div>
              </div>
            )}

            {subscription && (
              <div className="flex flex-col gap-2 rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-white/50">Precio mensual</span>
                  <span className="text-sm font-bold text-white">
                    {formatCurrency(Number(subscription.priceMonthly), subscription.currency, 'es-CO')}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-white/50">Vigente hasta</span>
                  <span className="text-xs font-semibold text-white">
                    {new Date(subscription.periodEnd).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <RefreshCwIcon className="h-3 w-3" />
                  {subscription.autoRenew ? 'Renovación automática activa' : 'Sin renovación automática'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="@container">
          <form onSubmit={handleSaveBranding}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PaletteIcon className="h-4 w-4 text-accent" /> Marca y soporte
              </CardTitle>
              <CardDescription>
                Cómo se muestra tu empresa a tus conductores y clientes dentro de la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <FormField label="Logo">
                <LogoDropzone value={logoUrl} onChange={setLogoUrl} />
              </FormField>

              <div className="grid grid-cols-1 @md:grid-cols-2 gap-5">
                <FormField label="Nombre de marca">
                  <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
                </FormField>
                <FormField label="Color primario">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-9 w-9 shrink-0 rounded-md border border-slate-200"
                      style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(primaryColor) ? primaryColor : undefined }}
                    />
                    <Input
                      placeholder="#F5A623"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                  </div>
                </FormField>
                <FormField label="Email de soporte">
                  <Input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                  />
                </FormField>
                <FormField label="Teléfono de soporte">
                  <Input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
                </FormField>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" disabled={savingBranding}>
                {savingBranding ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
