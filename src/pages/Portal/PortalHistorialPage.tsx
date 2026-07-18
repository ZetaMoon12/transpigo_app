import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { StarIcon, ClockIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { driversService, type HistorialItem } from '@/services/drivers.service';
import { SERVICE_STATUS_LABEL, SERVICE_STATUS_STYLE } from '@/services/servicios.service';

const PAGE_SIZE = 20;

export function PortalHistorialPage() {
  const [items, setItems] = useState<HistorialItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    driversService
      .getHistorial({ page: 1, limit: PAGE_SIZE })
      .then((res) => {
        setItems(res.data);
        setTotal(res.meta?.total ?? res.data.length);
      })
      .catch(() => toast.error('No se pudo cargar el historial'))
      .finally(() => setLoading(false));
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await driversService.getHistorial({ page: nextPage, limit: PAGE_SIZE });
      setItems((prev) => [...prev, ...res.data]);
      setPage(nextPage);
    } catch {
      toast.error('No se pudo cargar más historial');
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-extrabold text-[#0B1E36]">Historial de servicios</h1>
        <p className="text-sm text-slate-500 mt-0.5">Tus servicios completados, cancelados o fallidos.</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
            <ClockIcon className="h-7 w-7" />
          </div>
          <p className="text-sm text-slate-500">Todavía no tienes servicios en tu historial.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl bg-white border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{item.serviceCode}</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1',
                      SERVICE_STATUS_STYLE[item.status].bg,
                      SERVICE_STATUS_STYLE[item.status].text,
                      SERVICE_STATUS_STYLE[item.status].border,
                    )}
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full', SERVICE_STATUS_STYLE[item.status].dot)} />
                    <span>{SERVICE_STATUS_LABEL[item.status]}</span>
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{item.client?.name ?? 'Cliente'}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-400">
                    {item.completedAt ? formatDate(item.completedAt, 'es-CO') : '—'}
                  </span>
                  <div className="flex items-center gap-3">
                    {item.driverRating !== null && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                        <StarIcon className="h-3 w-3 fill-amber-400" />
                        {item.driverRating}
                      </span>
                    )}
                    <span className="text-xs font-extrabold text-slate-700">
                      {item.totalFinal !== null ? formatCurrency(item.totalFinal, 'COP', 'es-CO') : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {items.length < total && (
            <Button
              type="button"
              variant="outline"
              onClick={loadMore}
              disabled={loadingMore}
              className="self-center"
            >
              {loadingMore ? 'Cargando…' : 'Cargar más'}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
