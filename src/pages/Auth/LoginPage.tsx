import { useState, useEffect, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { useAuth, useTenant } from '@/context';
import { AlertTriangleIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * LoginPage - Pantalla de inicio de sesión premium con Tailwind CSS
 * Diseño dividido: panel izquierdo con branding institucional en Azul Oscuro (#0B1E36) y panel derecho con formulario flotante sobre fondo blanco
 */
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCount, setErrorCount] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const { login } = useAuth();
  const { isLoading: isTenantLoading, isValid: isTenantValid, error: tenantError } = useTenant();
  const isFormDisabled = isTenantLoading || !isTenantValid;

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    let removeTimer: ReturnType<typeof setTimeout>;

    if (error) {
      setIsExiting(false);
      hideTimer = setTimeout(() => {
        setIsExiting(true);
        removeTimer = setTimeout(() => {
          setError('');
          setIsExiting(false);
        }, 300); // 300ms matches Tailwind's duration-300
      }, 2500);
    }

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [error]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsExiting(false);

    if (!isTenantValid) {
      setError('No se puede iniciar sesión: el espacio de trabajo no es válido.');
      return;
    }

    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (!success) {
        setError('Credenciales incorrectas. Intenta de nuevo.');
        const newCount = errorCount + 1;
        setErrorCount(newCount);
        if (newCount === 3) {
          setShowDialog(true);
        }
      }
    } catch {
      setError('Error de conexión o del servidor. Intenta de nuevo.');
      const newCount = errorCount + 1;
      setErrorCount(newCount);
      if (newCount === 3) {
        setShowDialog(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh bg-white font-sans overflow-hidden">

      {/* Toast flotante horizontal global (Centro-Superior) usando componente Alert */}
      {error && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none w-full max-w-[400px] px-4 duration-300 ${isExiting ? 'animate-out fade-out slide-out-to-top-4 zoom-out-95' : 'animate-in fade-in slide-in-from-top-4 zoom-in-95'}`}>
          <Alert variant="default" className="bg-white border-slate-200 shadow-xl pointer-events-auto">
            <AlertTriangleIcon className="!text-red-500" />
            <AlertTitle className="text-slate-900 font-semibold">Aviso</AlertTitle>
            <AlertDescription className="text-slate-500 mt-1">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Alerta persistente cuando el subdominio no corresponde a un tenant válido */}
      {!isTenantLoading && !isTenantValid && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-[420px] px-4">
          <Alert variant="destructive" className="shadow-xl">
            <AlertTriangleIcon />
            <AlertTitle>Espacio de trabajo no encontrado</AlertTitle>
            <AlertDescription>
              {tenantError ?? 'No se pudo verificar el subdominio de esta empresa.'}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* ========== PANEL IZQUIERDO - Branding & Presentación (Fondo Azul Oscuro #0B1E36) ========== */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center relative p-12 overflow-hidden bg-[#0B1E36]">

        {/* Patrón de malla de gradiente de fondo sobre el azul oscuro */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 20% 80%, rgba(90,181,7,0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(26,61,107,0.3) 0%, transparent 60%),
              radial-gradient(circle at 50% 50%, rgba(90,181,7,0.04) 0%, transparent 60%)
            `,
          }}
        />

        {/* Orbes flotantes animados con resplandor (glow) tecnológico */}
        <div className="absolute top-[10%] -left-[5%] w-[300px] h-[300px] rounded-full blur-[80px] animate-orb-1" style={{ background: 'radial-gradient(circle, rgba(90,181,7,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[15%] right-[10%] w-[200px] h-[200px] rounded-full blur-[60px] animate-orb-2" style={{ background: 'radial-gradient(circle, rgba(26,61,107,0.3) 0%, transparent 70%)' }} />
        <div className="absolute top-[50%] left-[60%] w-[150px] h-[150px] rounded-full blur-[50px] animate-orb-3" style={{ background: 'radial-gradient(circle, rgba(90,181,7,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-[60%] left-[10%] w-[250px] h-[250px] rounded-full blur-[70px] animate-orb-4" style={{ background: 'radial-gradient(circle, rgba(90,181,7,0.08) 0%, transparent 70%)' }} />

        {/* Patrón de cuadrícula de ingeniería */}
        <div
          className="absolute inset-0 mask-radial-center"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Líneas de conexión animadas en formato SVG */}
        <div className="absolute inset-0 overflow-hidden">
          <svg viewBox="0 0 500 600" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <path
              d="M50,100 C150,150 200,50 350,120 S450,200 480,300"
              fill="none"
              stroke="rgba(90,181,7,0.2)"
              strokeWidth="1.2"
              className="animate-dash"
            />
            <path
              d="M20,400 C100,350 250,450 350,380 S450,320 490,250"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1.2"
              className="animate-dash-2"
            />
            <path
              d="M0,250 C80,200 180,300 280,230 S400,280 500,200"
              fill="none"
              stroke="rgba(90,181,7,0.12)"
              strokeWidth="1"
              className="animate-dash-3"
            />
            <circle cx="150" cy="130" r="3.5" fill="rgba(90,181,7,0.5)" className="animate-node-1" />
            <circle cx="350" cy="380" r="3.5" fill="rgba(255,255,255,0.2)" className="animate-node-2" />
            <circle cx="280" cy="230" r="3.5" fill="rgba(90,181,7,0.4)" className="animate-node-3" />
          </svg>
        </div>

        {/* Contenido de marca */}
        <div className="relative z-10 text-center max-w-[460px] flex flex-col items-center animate-fade-up">
          {/* Isotipo vectorial de TranspiGO (Camión blanco + Flecha Verde en código) */}
          <div className="flex items-center justify-center w-28 h-28  p-2">
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Cuerpo del camión estilizado en color blanco para destacar en el fondo oscuro */}
              <path d="M15 36C15 33.7909 16.7909 32 19 32H55C57.2091 32 59 33.7909 59 36V62H15V36Z" fill="#FFFFFF" />
              {/* Cabina con perspectiva sutil */}
              <path d="M59 38H72.5C74.3235 38 75.9926 38.9959 76.8485 40.5977L84.3485 54.5977C84.7731 55.3912 85 56.2796 85 57.1824V62H59V38Z" fill="#FFFFFF" />
              {/* Ventana de la cabina en azul oscuro de fondo */}
              <path d="M63 42H70L76 53H63V42Z" fill="#0B1E36" />
              {/* Ruedas del camión */}
              <circle cx="30" cy="68" r="8" fill="#FFFFFF" stroke="#0B1E36" strokeWidth="2.5" />
              <circle cx="70" cy="68" r="8" fill="#FFFFFF" stroke="#0B1E36" strokeWidth="2.5" />
              {/* Detalle interno de ruedas */}
              <circle cx="30" cy="68" r="3" fill="#5AB507" />
              <circle cx="70" cy="68" r="3" fill="#5AB507" />
              {/* Flecha dinámica ascendente verde cruzando el camión con sombra suave */}
              <path
                d="M10 56C25 43 45 32 66 28L56 18L88 25L80 56L71 43C53 46 32 53 10 56Z"
                fill="#5AB507"
                style={{ filter: 'drop-shadow(0px 3px 6px rgba(90, 181, 7, 0.45))' }}
              />
            </svg>
          </div>

          <h2 className="text-[2.25rem] font-extrabold tracking-tight text-white mb-5 leading-tight text-center">
            Transpi<span className="text-accent">GO</span> App
          </h2>

          <p className="text-base text-slate-300/90 leading-relaxed max-w-[360px]">
            Gestión de transporte, despacho y monitoreo de flota en tiempo real.
          </p>

          {/* Badges de características (Fila horizontal fija sin salto de línea - Separado mediante inline style) */}
          <div className="flex flex-row justify-center items-center w-full max-w-4xl flex-nowrap" style={{ marginTop: '26px', gap: '10px' }}>
            <FeaturePill icon="shield" label="Seguridad SSL" />
            <FeaturePill icon="activity" label="Tiempo real" />
            <FeaturePill icon="layout" label="Dashboard" />
            <FeaturePill icon="users" label="Multi-usuario" />
          </div>
        </div>
      </div>

      {/* ========== PANEL DERECHO - Formulario de Acceso (Fondo Blanco Cálido con Cuadrícula y Animación) ========== */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative bg-[#F8FAFC]">

        {/* Patrón de cuadrícula sobre el panel claro */}
        <div
          className="absolute inset-0 mask-radial-center"
          style={{
            backgroundImage: 'linear-gradient(rgba(11,30,54,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(11,30,54,0.02) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Orbes flotantes de fondo sutiles */}
        <div className="absolute top-[20%] right-[5%] w-[250px] h-[250px] rounded-full blur-[80px] animate-orb-1" style={{ background: 'radial-gradient(circle, rgba(90,181,7,0.04) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[10%] left-[5%] w-[300px] h-[300px] rounded-full blur-[90px] animate-orb-2" style={{ background: 'radial-gradient(circle, rgba(11,30,54,0.02) 0%, transparent 70%)' }} />

        {/* Líneas de conexión animadas SVG en tonos muy tenues y elegantes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 500 600" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-60">
            <path
              d="M500,100 C400,150 300,50 150,120 S50,200 20,300"
              fill="none"
              stroke="rgba(90,181,7,0.07)"
              strokeWidth="1.2"
              className="animate-dash"
            />
            <path
              d="M480,400 C400,350 250,450 150,380 S50,320 10,250"
              fill="none"
              stroke="rgba(11,30,54,0.03)"
              strokeWidth="1.2"
              className="animate-dash-2"
            />
          </svg>
        </div>

        {/* Separador vertical decorativo con gradiente en pantallas grandes */}
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-[#0B1E36] via-[#5AB507]/20 to-[#0B1E36]" />

        {/* Encabezado y logo en móvil */}
        <div className="lg:hidden flex flex-col items-center mb-8 text-center animate-fade-up">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-lg border border-slate-100 mb-4 p-3">
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 36C15 33.7909 16.7909 32 19 32H55C57.2091 32 59 33.7909 59 36V62H15V36Z" fill="#0B1E36" />
              <path d="M59 38H72.5C74.3235 38 75.9926 38.9959 76.8485 40.5977L84.3485 54.5977C84.7731 55.3912 85 56.2796 85 57.1824V62H59V38Z" fill="#0B1E36" />
              <path d="M63 42H70L76 53H63V42Z" fill="#FFFFFF" />
              <circle cx="30" cy="68" r="8" fill="#0B1E36" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="70" cy="68" r="8" fill="#0B1E36" stroke="#FFFFFF" strokeWidth="2" />
              <path d="M10 56C25 43 45 32 66 28L56 18L88 25L80 56L71 43C53 46 32 53 10 56Z" fill="#5AB507" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">
            Transpi<span className="text-accent">GO</span> App
          </h1>
        </div>

        {/* Contenedor del formulario flotante */}
        <div className="w-full max-w-[400px] animate-fade-up-delay relative z-10">

          {/* Encabezado del formulario (Centrado con la palabra sesión en verde estilo TranspiGO) */}
          <div className="mb-12 mt-15 text-center flex flex-col items-center">
            <h2 className="text-3xl font-extrabold text-[#0B1E36] tracking-tight mb-3">
              Iniciar <span className="text-accent">sesión</span>
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed font-medium max-w-[340px]">
              Ingresa tu correo y contraseña para acceder a la administración.
            </p>
          </div>



          <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate autoComplete="off">

            {/* Campo de correo electrónico */}
            <div className="flex flex-col" >
              <label htmlFor="login-email" className="block mb-4 text-[10px] font-bold text-[#0B1E36]/70 uppercase tracking-widest">
                Correo electrónico
              </label>
              <div className="relative group">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-text-muted transition-colors duration-300 group-focus-within:text-accent pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="nombre@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  name="email"
                  required
                  disabled={isFormDisabled}
                  style={{ paddingLeft: '46px' }}
                  className="w-full h-12 pr-4 border border-slate-200 rounded-lg text-sm text-primary bg-input-bg outline-none transition-all duration-300 placeholder:text-text-muted hover:border-slate-300 hover:bg-white focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Campo de contraseña */}
            <div className="flex flex-col">
              <label htmlFor="login-password" className="block mb-4 text-[10px] font-bold text-[#0B1E36]/70 uppercase tracking-widest">
                Contraseña
              </label>
              <div className="relative group">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-text-muted transition-colors duration-300 group-focus-within:text-accent pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  name="password"
                  required
                  disabled={isFormDisabled}
                  style={{ paddingLeft: '46px', paddingRight: '48px' }}
                  className="w-full h-12 border border-slate-200 rounded-lg text-sm text-primary bg-input-bg outline-none transition-all duration-300 placeholder:text-text-muted hover:border-slate-300 hover:bg-white focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isFormDisabled}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-secondary transition-colors duration-300 cursor-pointer bg-transparent border-none flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Recordarme y contraseña olvidada */}
            <div className="flex items-center justify-between flex-wrap gap-3 mt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="checkbox-custom w-[18px] h-[18px] border border-slate-200 rounded-[4px] bg-input-bg cursor-pointer transition-all duration-200"
                />
                <span className="text-sm text-slate-500 font-medium select-none">Recordarme</span>
              </label>
              <a href="#" className="text-sm text-accent font-bold no-underline hover:text-accent-dark hover:underline transition-colors duration-200">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Botón de envío principal */}
            <button
              type="submit"
              disabled={isLoading || isFormDisabled}
              className="group/btn relative w-full h-12 border-none rounded-lg text-sm font-bold text-white cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-85 disabled:pointer-events-none mt-2"
              style={{
                background: 'linear-gradient(135deg, #5AB507 0%, #4a9a06 100%)',
                boxShadow: '0 4px 12px rgba(90,181,7,0.22)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(90,181,7,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(90,181,7,0.22)';
              }}
            >
              {/* Contenido del botón */}
              <span className={`relative z-10 flex items-center justify-center gap-2.5 h-full w-full ${isLoading ? 'invisible' : ''}`}>
                Iniciar sesión
                <svg className="w-[18px] h-[18px] transition-transform duration-300 group-hover/btn:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>

              {/* Indicador de carga */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </button>

            {/* Línea divisoria */}
            <div className="flex items-center gap-4 my-2">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">o continúa con</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Botón de acceso mediante SSO - Implementado en Azul Oscuro #0B1E36 */}
            <button
              type="button"
              disabled={isFormDisabled}
              className="w-full h-12 rounded-lg bg-[#0B1E36] text-sm font-semibold text-white cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-300 hover:bg-[#132d4f] shadow-md border-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="w-[18px] h-[18px] text-[#5AB507]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Acceso con SSO empresarial
            </button>
          </form>

          {/* Pie de página empujado hacia abajo */}
          <div className="text-center border-t border-slate-50 pt-6" style={{ marginTop: '80px' }}>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} TranspiGO. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Límite de intentos alcanzado</AlertDialogTitle>
            <AlertDialogDescription>
              Has realizado 3 intentos fallidos. Al tercer intento su cuenta será desactivada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setShowDialog(false);
              setErrorCount(0);
            }}>
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ----------------------------------------
   Subcomponente de Badges / Feature Pills
   ---------------------------------------- */
function FeaturePill({ icon, label }: { icon: string; label: string }) {
  return (
    <div
      className="inline-flex items-center rounded-md border border-[#5AB507]/40 bg-[#5AB507]/8 text-xs font-bold text-[#5AB507] transition-all duration-300 hover:-translate-y-0.5 cursor-default shadow-sm whitespace-nowrap"
      style={{
        padding: '10px 20px',
        gap: '8px'
      }}
    >
      <FeatureIcon name={icon} />
      {label}
    </div>
  );
}

/* Subcomponente para renderizar iconos de características */
function FeatureIcon({ name }: { name: string }) {
  const cls = "w-3.5 h-3.5";
  const style = { color: '#5AB507' };

  switch (name) {
    case 'shield':
      return (
        <svg className={cls} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'activity':
      return (
        <svg className={cls} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case 'layout':
      return (
        <svg className={cls} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      );
    case 'users':
      return (
        <svg className={cls} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    default:
      return null;
  }
}
