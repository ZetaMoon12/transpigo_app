import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  companiesService,
  type Company,
  type CompanyBranch,
  type CompanyUser,
  type CompanyUserRole,
} from '@/services/companies.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { BranchFormDialog } from './components/BranchFormDialog';
import { InviteUserDialog } from './components/InviteUserDialog';
import { ArrowLeftIcon, PlusIcon, PencilIcon, UserXIcon, MailPlusIcon } from 'lucide-react';

const PLAN_LABEL: Record<string, string> = {
  BASICO: 'Básico',
  EMPRESARIAL: 'Empresarial',
  ENTERPRISE: 'Enterprise',
};

const ROLE_LABEL: Record<CompanyUserRole, string> = {
  COMPANY_ADMIN: 'Administrador',
  COMPANY_USER: 'Usuario',
};

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const companyId = Number(id);

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState(false);

  const [branches, setBranches] = useState<CompanyBranch[]>([]);
  const [editingBranch, setEditingBranch] = useState<CompanyBranch | null>(null);

  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<CompanyUser | null>(null);

  function loadCompany() {
    setIsLoading(true);
    companiesService
      .getById(companyId)
      .then((res) => {
        setCompany(res.data);
        setBranches(res.data.branches ?? []);
      })
      .catch(() => toast.error('No se pudo cargar la empresa'))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  function loadUsers() {
    companiesService
      .listUsers(companyId)
      .then((res) => setUsers(res.data))
      .catch(() => toast.error('No se pudieron cargar los usuarios'))
      .finally(() => setUsersLoaded(true));
  }

  async function handleRoleChange(user: CompanyUser, role: CompanyUserRole) {
    try {
      await companiesService.updateUserRole(companyId, user.id, role);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
      toast.success('Rol actualizado');
    } catch {
      toast.error('No se pudo actualizar el rol');
    }
  }

  async function handleDeactivateUser() {
    if (!deactivatingUser) return;
    const user = deactivatingUser;

    try {
      await companiesService.deactivateUser(companyId, user.id);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, active: false } : u)));
      toast.success(`${user.name} fue desactivado`);
    } catch {
      toast.error('No se pudo desactivar al usuario');
    } finally {
      setDeactivatingUser(null);
    }
  }

  if (isLoading || !company) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4">
        <Link
          to="/companies"
          className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 hover:bg-slate-50 px-3.5 py-2.5 rounded-xl shadow-3xs transition-all w-fit mb-1"
        >
          <ArrowLeftIcon className="h-4 w-4 text-slate-500" />
          <span>Volver a empresas</span>
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-[#0B1E36] tracking-tight">{company.name}</h1>
              <Badge className={company.active ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-slate-500'}>
                {company.active ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              NIT {company.nit} · Plan {PLAN_LABEL[company.plan] ?? company.plan}
            </p>
          </div>
          <Button variant="outline" onClick={() => setEditingCompany(true)}>
            <PencilIcon /> Editar empresa
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="info"
        onValueChange={(value) => {
          if (value === 'users' && !usersLoaded) loadUsers();
        }}
      >
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="branches">Sucursales</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="pt-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <InfoRow label="Email de contacto" value={company.contactEmail} />
            <InfoRow label="Teléfono de contacto" value={company.contactPhone ?? '—'} />
            <InfoRow label="Dirección" value={company.address ?? '—'} />
            <InfoRow label="Cupo de crédito" value={formatCurrency(company.creditLimit)} />
            <InfoRow label="Saldo disponible" value={formatCurrency(company.creditBalance)} />
          </div>
        </TabsContent>

        <TabsContent value="branches" className="pt-4">
          <div className="flex justify-end mb-3">
            <BranchFormDialog
              companyId={companyId}
              trigger={
                <Button size="sm">
                  <PlusIcon /> Nueva sucursal
                </Button>
              }
              onSaved={(branch) => setBranches((prev) => [branch, ...prev])}
            />
          </div>

          {branches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
              Esta empresa aún no tiene sucursales.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium text-slate-800">{branch.name}</TableCell>
                      <TableCell className="text-slate-500">{branch.city}</TableCell>
                      <TableCell className="text-slate-500">{branch.address ?? '—'}</TableCell>
                      <TableCell>
                        <Badge className={branch.active ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-slate-500'}>
                          {branch.active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditingBranch(branch)}>
                          <PencilIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="pt-4">
          <div className="flex justify-end mb-3">
            <InviteUserDialog
              companyId={companyId}
              trigger={
                <Button size="sm">
                  <MailPlusIcon /> Invitar usuario
                </Button>
              }
              onInvited={(user) => setUsers((prev) => [user, ...prev])}
            />
          </div>

          {!usersLoaded ? (
            <Skeleton className="h-24 w-full" />
          ) : users.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
              Esta empresa aún no tiene usuarios invitados.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-slate-800">{user.name}</TableCell>
                      <TableCell className="text-slate-500">{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(v) => handleRoleChange(user, v as CompanyUserRole)}
                          disabled={!user.active}
                        >
                          <SelectTrigger size="sm">
                            <SelectValue>{ROLE_LABEL[user.role]}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COMPANY_USER">Usuario</SelectItem>
                            <SelectItem value="COMPANY_ADMIN">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge className={user.active ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-slate-500'}>
                          {user.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {user.active && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive"
                            onClick={() => setDeactivatingUser(user)}
                          >
                            <UserXIcon />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CompanyFormDialog
        open={editingCompany}
        onOpenChange={setEditingCompany}
        company={company}
        onSaved={(updated) => {
          setCompany(updated);
          setEditingCompany(false);
        }}
      />

      <BranchFormDialog
        companyId={companyId}
        open={editingBranch !== null}
        onOpenChange={(v) => !v && setEditingBranch(null)}
        branch={editingBranch ?? undefined}
        onSaved={(updated) => {
          setBranches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
          setEditingBranch(null);
        }}
      />

      <AlertDialog open={deactivatingUser !== null} onOpenChange={(v) => !v && setDeactivatingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar a {deactivatingUser?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              No podrá volver a iniciar sesión. Su historial de solicitudes se conserva.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivateUser}>Desactivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-slate-700 font-medium">{value}</span>
    </div>
  );
}

function formatCurrency(value: string) {
  const amount = Number(value);
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
    amount,
  );
}
