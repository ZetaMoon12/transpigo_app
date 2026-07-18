import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { companiesService, type Company, type CompanyPlan } from '@/services/companies.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
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
import { CompanyFormDialog } from './components/CompanyFormDialog';
import {
  PlusIcon,
  MoreVerticalIcon,
  EyeIcon,
  PencilIcon,
  PowerIcon,
  Search,
  LayoutGrid,
  List,
  Building2,
  Mail,
  Phone,
  MapPin,
  Users,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/helpers';

const PLAN_LABEL: Record<CompanyPlan, string> = {
  BASICO: 'Básico',
  EMPRESARIAL: 'Empresarial',
  ENTERPRISE: 'Enterprise',
};

export function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deactivatingCompany, setDeactivatingCompany] = useState<Company | null>(null);

  // Estados de control superior
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<CompanyPlan | 'TODOS'>('TODOS');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  function load(targetPage: number) {
    setIsLoading(true);
    companiesService
      .list(targetPage)
      .then((res) => {
        setCompanies(res.data);
        setTotalPages(res.meta.totalPages || 1);
        setPage(res.meta.page);
      })
      .catch(() => toast.error('No se pudieron cargar las empresas'))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load(1);
  }, []);

  async function handleDeactivate() {
    if (!deactivatingCompany) return;
    const company = deactivatingCompany;

    try {
      await companiesService.deactivate(company.id);
      setCompanies((prev) => prev.map((c) => (c.id === company.id ? { ...c, active: false } : c)));
      toast.success(`${company.name} fue desactivada`);
    } catch {
      toast.error('No se pudo desactivar la empresa');
    } finally {
      setDeactivatingCompany(null);
    }
  }

  // Filtrado del lado del cliente
  const filteredCompanies = companies.filter((c) => {
    // Filtro por Plan
    if (planFilter !== 'TODOS' && c.plan !== planFilter) return false;

    // Filtro por Buscador
    const query = searchTerm.toLowerCase().trim();
    if (query === '') return true;

    return (
      c.name.toLowerCase().includes(query) ||
      c.nit.toLowerCase().includes(query) ||
      c.contactEmail.toLowerCase().includes(query) ||
      (c.contactPhone || '').toLowerCase().includes(query) ||
      (c.address || '').toLowerCase().includes(query)
    );
  });

  // Generador de iniciales del avatar
  const getCompanyInitials = (name: string) => {
    const cleanName = name.replace(/[^a-zA-Z0-9 ]/g, '');
    const words = cleanName.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generador de gradiente dinámico según el hash del nombre
  const getAvatarGradient = (name: string) => {
    const colors = [
      'from-blue-600 to-cyan-500',
      'from-[#0B1E36] to-slate-700',
      'from-[#5AB507] to-emerald-500',
      'from-indigo-600 to-purple-500',
      'from-amber-500 to-orange-500',
      'from-rose-600 to-pink-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 w-full max-w-none">
      {/* Cabecera del Módulo */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-[#0B1E36] tracking-tight">Empresas</h1>
          <p className="text-sm text-slate-500 font-medium">
            Empresas B2B que contratan servicios de transporte con tu operación.
          </p>
        </div>
        <CompanyFormDialog
          trigger={
            <Button className="bg-[#5AB507] hover:bg-[#5AB507]/90 text-white font-bold flex items-center gap-2 shadow-xs cursor-pointer">
              <PlusIcon className="w-4 h-4" />
              <span>Nueva empresa</span>
            </Button>
          }
          onSaved={(company) => setCompanies((prev) => [company, ...prev])}
        />
      </div>

      {/* Control Bar (Buscador, Plan y Vista) */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Input Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar empresa por nombre, NIT, correo..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#5AB507] focus:ring-1 focus:ring-[#5AB507] transition-all"
          />
        </div>

        {/* Filtros e Interruptores */}
        <div className="flex items-center gap-4 self-end md:self-auto flex-wrap sm:flex-nowrap">
          {/* Selector de Plan */}
          <div className="flex bg-slate-50 p-1 border border-slate-200/50 rounded-xl">
            {(['TODOS', 'BASICO', 'EMPRESARIAL', 'ENTERPRISE'] as (CompanyPlan | 'TODOS')[]).map((plan) => (
              <button
                key={plan}
                onClick={() => setPlanFilter(plan)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                  planFilter === plan
                    ? "bg-[#0B1E36] text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {plan === 'TODOS' ? 'Todos' : PLAN_LABEL[plan] ?? plan}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-200 hidden sm:block" />

          {/* Conmutador Grid/List */}
          <div className="flex bg-slate-50 p-1 border border-slate-200/50 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer",
                viewMode === 'grid' ? "bg-white text-[#0B1E36] shadow-2xs" : "text-slate-400 hover:text-slate-600"
              )}
              title="Vista de Tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer",
                viewMode === 'list' ? "bg-white text-[#0B1E36] shadow-2xs" : "text-slate-400 hover:text-slate-600"
              )}
              title="Vista de Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Listado de Contenido */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-slate-100 rounded-2xl p-5 space-y-4 bg-white shadow-3xs">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-4 w-1/4 rounded-full" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center text-sm text-slate-400 font-medium">
          Aún no tienes empresas registradas en esta vista.
        </div>
      ) : viewMode === 'grid' ? (
        // MODO TARJETAS (Grid Layout)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredCompanies.map((company) => {
            const limit = parseFloat(company.creditLimit) || 0;
            const balance = parseFloat(company.creditBalance) || 0;
            const isCreditAssigned = limit > 0;
            const creditRatio = isCreditAssigned ? balance / limit : 0;
            const creditPercent = Math.min(creditRatio * 100, 100);

            return (
              <div
                key={company.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group overflow-hidden"
              >
                {/* Accent Background Glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#5AB507]/5 to-transparent rounded-bl-full pointer-events-none" />

                <div>
                  {/* Tarjeta Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl text-white flex items-center justify-center font-black text-sm uppercase shadow-3xs border border-white shrink-0 bg-gradient-to-br",
                        getAvatarGradient(company.name)
                      )}>
                        {getCompanyInitials(company.name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-800 text-base truncate tracking-tight leading-snug" title={company.name}>
                          {company.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mt-0.5">
                          NIT: {company.nit}
                        </span>
                      </div>
                    </div>

                    <Badge className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 shadow-3xs",
                      company.active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                    )}>
                      {company.active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>

                  {/* Plan Tag */}
                  <div className="mb-4">
                    <Badge variant="outline" className={cn(
                      "px-2.5 py-0.5 rounded-lg text-xs font-bold border",
                      company.plan === 'BASICO' && "bg-slate-50 text-slate-600 border-slate-200",
                      company.plan === 'EMPRESARIAL' && "bg-blue-50 text-blue-700 border-blue-200/80",
                      company.plan === 'ENTERPRISE' && "bg-purple-50 text-purple-700 border-purple-200 font-black"
                    )}>
                      {PLAN_LABEL[company.plan] ?? company.plan}
                    </Badge>
                  </div>

                  {/* Datos de Contacto */}
                  <div className="space-y-2 text-xs text-slate-600 font-semibold mb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{company.contactEmail}</span>
                    </div>
                    {company.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{company.contactPhone}</span>
                      </div>
                    )}
                    {company.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate" title={company.address}>{company.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Sucursales y Usuarios */}
                  <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 text-[11px] text-slate-500 font-bold">
                    <div className="flex items-center gap-1.5 justify-center border-r border-slate-200/50">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{company._count?.branches ?? 0} Sucursales</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-center">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{company._count?.users ?? 0} Usuarios</span>
                    </div>
                  </div>
                </div>

                {/* Línea de Crédito & Acciones */}
                <div className="space-y-4">
                  {isCreditAssigned ? (
                    <div className="bg-slate-50 border border-slate-150/50 rounded-xl p-3 space-y-2.5 pt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Línea de Crédito</span>
                        <Badge className={cn(
                          "px-2 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider border shadow-3xs",
                          creditRatio > 0.8 ? "bg-red-50 text-red-700 border-red-100" : creditRatio > 0.5 ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100/70"
                        )}>
                          {Math.round(creditPercent)}% Usado
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner relative">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            creditRatio > 0.8 ? "bg-gradient-to-r from-rose-500 to-red-600" : creditRatio > 0.5 ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-[#5AB507] to-emerald-600"
                          )}
                          style={{ width: `${creditPercent}%` }}
                        />
                      </div>

                      {/* Financial Detail Breakdown */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 pt-1.5 border-t border-slate-200/40">
                        <div>
                          <span className="text-slate-400 block text-[8px] uppercase tracking-wide">Deuda actual</span>
                          <span className={cn("text-xs font-extrabold", balance > 0 ? "text-rose-600" : "text-slate-700")}>
                            {formatCurrency(balance, 'COP', 'es-CO')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[8px] uppercase tracking-wide">Cupo disponible</span>
                          <span className="text-xs font-extrabold text-[#5AB507]">
                            {formatCurrency(limit - balance, 'COP', 'es-CO')}
                          </span>
                        </div>
                      </div>

                      {/* Total Authorized limit */}
                      <div className="text-[10px] text-slate-400 font-extrabold flex justify-between pt-1 border-t border-dashed border-slate-200/50">
                        <span>Límite de Cupo:</span>
                        <span className="text-slate-700">{formatCurrency(limit, 'COP', 'es-CO')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3 text-center text-[10px] text-slate-400 font-bold italic">
                      Sin línea de crédito asignada
                    </div>
                  )}

                  {/* Acciones del Footer */}
                  <div className="flex items-center justify-between gap-2 border-t border-slate-50 pt-3 mt-1">
                    <Link to={`/companies/${company.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full font-bold text-xs gap-1 hover:text-[#5AB507] hover:border-[#5AB507] transition-all bg-white cursor-pointer">
                        <span>Gestionar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" className="border border-slate-200 bg-white hover:bg-slate-50 rounded-lg cursor-pointer">
                            <MoreVerticalIcon className="w-4 h-4 text-slate-500" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem render={<Link to={`/companies/${company.id}`} />}>
                          <EyeIcon className="w-4 h-4" /> Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingCompany(company)}>
                          <PencilIcon className="w-4 h-4" /> Editar
                        </DropdownMenuItem>
                        {company.active && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeactivatingCompany(company)}
                          >
                            <PowerIcon className="w-4 h-4" /> Desactivar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // MODO LISTA (Tabla Estilizada Clásica)
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-3xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-bold">Empresa</TableHead>
                <TableHead className="font-bold">NIT</TableHead>
                <TableHead className="font-bold">Contacto</TableHead>
                <TableHead className="font-bold">Plan</TableHead>
                <TableHead className="font-bold">Sucursales</TableHead>
                <TableHead className="font-bold">Usuarios</TableHead>
                <TableHead className="font-bold">Línea de Crédito</TableHead>
                <TableHead className="font-bold">Estado</TableHead>
                <TableHead className="text-right font-bold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => {
                const limit = parseFloat(company.creditLimit) || 0;
                const balance = parseFloat(company.creditBalance) || 0;
                const creditRatio = limit > 0 ? balance / limit : 0;
                const creditPercent = Math.min(100, Math.max(0, creditRatio * 100));

                return (
                  <TableRow key={company.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold text-slate-800">{company.name}</TableCell>
                    <TableCell className="text-slate-500 font-semibold">{company.nit}</TableCell>
                    <TableCell className="text-slate-500 font-semibold">{company.contactEmail}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "px-2 py-0.5 rounded-lg text-xs font-bold border",
                        company.plan === 'BASICO' && "bg-slate-50 text-slate-600 border-slate-200",
                        company.plan === 'EMPRESARIAL' && "bg-blue-50 text-blue-700 border-blue-200",
                        company.plan === 'ENTERPRISE' && "bg-purple-50 text-purple-700 border-purple-200 font-black"
                      )}>
                        {PLAN_LABEL[company.plan] ?? company.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 font-bold">{company._count?.branches ?? 0}</TableCell>
                    <TableCell className="text-slate-500 font-bold">{company._count?.users ?? 0}</TableCell>
                    <TableCell>
                      {limit > 0 ? (
                        <div className="flex flex-col gap-1 text-[10px] font-bold" style={{ minWidth: '130px' }}>
                          <div className="flex justify-between text-slate-500">
                            <span>Deuda:</span>
                            <span className={balance > 0 ? "text-rose-600" : "text-slate-700"}>
                              {formatCurrency(balance, 'COP', 'es-CO')}
                            </span>
                          </div>
                          <div className="flex justify-between text-[#5AB507]">
                            <span>Disponible:</span>
                            <span>{formatCurrency(limit - balance, 'COP', 'es-CO')}</span>
                          </div>
                          {/* Mini-progress bar */}
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-0.5">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                creditRatio > 0.8 ? "bg-red-500" : creditRatio > 0.5 ? "bg-amber-500" : "bg-[#5AB507]"
                              )}
                              style={{ width: `${creditPercent}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px] font-semibold">Sin crédito</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                        company.active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                      )}>
                        {company.active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" className="cursor-pointer">
                              <MoreVerticalIcon className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem render={<Link to={`/companies/${company.id}`} />}>
                            <EyeIcon /> Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingCompany(company)}>
                            <PencilIcon /> Editar
                          </DropdownMenuItem>
                          {company.active && (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeactivatingCompany(company)}
                            >
                              <PowerIcon /> Desactivar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)} className="font-bold text-xs bg-white border-slate-200 text-slate-600 shadow-3xs cursor-pointer">
            Anterior
          </Button>
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-250/20 shadow-3xs">
            Página {page} de {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1)} className="font-bold text-xs bg-white border-slate-200 text-slate-600 shadow-3xs cursor-pointer">
            Siguiente
          </Button>
        </div>
      )}

      {/* Diálogos controlados de Formulario y Alertas */}
      <CompanyFormDialog
        open={editingCompany !== null}
        onOpenChange={(v) => !v && setEditingCompany(null)}
        company={editingCompany ?? undefined}
        onSaved={(updated) => {
          setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          setEditingCompany(null);
        }}
      />

      <AlertDialog open={deactivatingCompany !== null} onOpenChange={(v) => !v && setDeactivatingCompany(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-extrabold text-[#0B1E36]">¿Desactivar {deactivatingCompany?.name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              La empresa dejará de poder crear nuevas solicitudes de transporte. Podrás reactivarla editando su
              información más adelante en cualquier momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold border-slate-200 rounded-xl cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} className="bg-red-600 hover:bg-red-700 font-bold text-white rounded-xl cursor-pointer">Desactivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
