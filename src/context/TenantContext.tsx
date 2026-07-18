import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { tenantService, type Tenant } from '@/services/tenant.service';
import { getTenantSlugFromHostname } from '@/utils/helpers';

/**
 * Contexto de Tenant - Resuelve y expone el tenant del subdominio actual
 */

interface TenantState {
  tenant: Tenant | null;
  isLoading: boolean;
  /** true una vez resuelto el subdominio contra un tenant válido y activo */
  isValid: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantState | null>(null);

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TenantState>({
    tenant: null,
    isLoading: true,
    isValid: false,
    error: null,
  });

  useEffect(() => {
    const slug = getTenantSlugFromHostname(window.location.hostname);

    if (!slug) {
      setState({
        tenant: null,
        isLoading: false,
        isValid: false,
        error: 'Este dominio no corresponde a un espacio de trabajo válido.',
      });
      return;
    }

    let cancelled = false;

    tenantService
      .getBySlug(slug)
      .then((res) => {
        if (cancelled) return;
        setState({ tenant: res.data, isLoading: false, isValid: true, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          tenant: null,
          isLoading: false,
          isValid: false,
          error: errorMessage(err, 'No se encontró ningún espacio de trabajo para este subdominio.'),
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <TenantContext.Provider value={state}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantState {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant debe utilizarse dentro de un TenantProvider');
  }
  return context;
}
