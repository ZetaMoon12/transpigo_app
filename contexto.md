# CLAUDE_TENANTS.md — Módulo Auth + Tenants

## Módulo Auth

### Descripción

Un solo endpoint de login para todos los roles.
El sistema distingue `SUPER_ADMIN` de `ADMIN` por el `role` en la tabla `users`.

### Tablas involucradas

**`users`** — campos relevantes para auth:
```typescript
id:       number
tenantId: number | null  // null = SUPER_ADMIN
email:    string         // único globalmente para SUPER_ADMIN
                         // único por tenant para el resto
password: string         // bcrypt — select: false en TypeORM siempre
role:     UserRole
active:   boolean
```

### Endpoints

```
POST /api/auth/login    → Login unificado (SUPER_ADMIN y ADMIN usan la misma ruta)
POST /api/auth/refresh  → Renovar access token con refresh token
POST /api/auth/logout   → Invalidar refresh token
GET  /api/auth/me       → Perfil del usuario autenticado
```

Todas las rutas de auth son **públicas** excepto `/me` que requiere `verifyJWT`.

### Flujo de login

```
1. POST /api/auth/login { email, password }

2. Buscar user por email — SIN filtro de tenant_id
   (el email es el identificador único a nivel global)

3. Si no existe → 401 'Credenciales inválidas'
   (nunca revelar si el email existe o no)

4. Si user.active === false → 401 'Cuenta inactiva'

5. bcrypt.compare(password, user.password)
   Si no coincide → 401 'Credenciales inválidas'

6. Generar access token (JWT_EXPIRES_IN)
   Payload: { sub: user.id, email, role, tenantId }

7. Generar refresh token (JWT_REFRESH_EXPIRES_IN)
   Guardar hash del refresh token en Redis:
   clave: refresh:{userId} | valor: hash | TTL: 30d

8. Retornar respuesta
```

### Validación Zod

```typescript
const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
```

### Respuesta exitosa

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": 1,
      "name": "William García",
      "email": "admin@transpigo.com",
      "role": "SUPER_ADMIN",
      "tenantId": null
    }
  }
}
```

El frontend redirige según `role`:
- `SUPER_ADMIN` → `admin.transpigo.com/dashboard`
- `ADMIN` → `app.transpigo.com/dashboard` (panel del tenant)
- `DRIVER` → `app.transpigo.com/conductor`

### GET /api/auth/me

Requiere `verifyJWT`. Retorna el usuario autenticado con su tenant si aplica.

```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Carlos Rodríguez",
    "email": "carlos@gruas.co",
    "role": "ADMIN",
    "tenantId": 3,
    "tenant": {
      "name": "Grúas del Valle SAS",
      "slug": "gruas-del-valle",
      "plan": "GROWTH",
      "status": "ACTIVE",
      "settings": {
        "brandName": "Grúas del Valle",
        "logoUrl": "https://...",
        "primaryColor": "#F5A623"
      }
    }
  }
}
```

Para `SUPER_ADMIN` el campo `tenant` es `null`.

---

## Módulo Tenants

### Descripción

Gestión de tenants desde `admin.transpigo.com`.
Solo el `SUPER_ADMIN` consume estos endpoints.

### Tablas involucradas

**`tenants`**
```typescript
id:           number
name:         string
slug:         string        // UNIQUE — identifica al tenant por subdominio
domain:       string | null // dominio custom opcional
plan:         TenantPlan
status:       TenantStatus
billingEmail: string
billingNit:   string | null
trialEndsAt:  Date | null
createdAt:    Date
updatedAt:    Date
```

**`tenant_settings`** (1:1 con tenant, siempre existe)
```typescript
id:                     number
tenantId:               number
brandName:              string | null
logoUrl:                string | null
primaryColor:           string        // default '#F5A623'
supportEmail:           string | null
supportPhone:           string | null
timezone:               string        // default 'America/Bogota'
currency:               string        // default 'COP'
maxDrivers:             number
maxMonthlyServices:     number
overagePricePerService: number
```

**`tenant_subscriptions`** (1:1, existe solo con plan pagado)
```typescript
id:           number
tenantId:     number
plan:         TenantPlan
priceMonthly: number
currency:     string
periodStart:  Date
periodEnd:    Date
payuRef:      string | null
autoRenew:    boolean
cancelledAt:  Date | null
```

### Enums

```typescript
export enum TenantPlan {
  TRIAL      = 'TRIAL',
  STARTER    = 'STARTER',
  GROWTH     = 'GROWTH',
  BUSINESS   = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

export enum TenantStatus {
  TRIAL     = 'TRIAL',
  ACTIVE    = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}
```

### Endpoints

```
GET   /api/tenants                   → Lista paginada
GET   /api/tenants/:id               → Detalle con settings y subscription
POST  /api/tenants                   → Crear tenant nuevo
PATCH /api/tenants/:id               → Actualizar datos
PATCH /api/tenants/:id/status        → Cambiar status
PATCH /api/tenants/:id/settings      → Actualizar configuración
GET   /api/tenants/:id/subscription  → Ver suscripción activa
```

Todos con: `verifyJWT → requireRole('SUPER_ADMIN')`

### Reglas de negocio

**Crear tenant — transacción única con 3 inserts:**
```
1. tenants          → registro principal
2. tenant_settings  → con defaults del plan
3. users            → usuario ADMIN inicial del tenant
```

Si cualquiera falla, hacer rollback de los 3.

**Generación de slug:**
```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
// "Grúas del Valle SAS" → "gruas-del-valle-sas"
// Si ya existe → "gruas-del-valle-sas-2"
```

**Cambio de status:**

| Transición | Permitida | Condición |
|---|---|---|
| TRIAL → ACTIVE | ✅ | Debe tener suscripción activa |
| ACTIVE → SUSPENDED | ✅ | Siempre |
| SUSPENDED → ACTIVE | ✅ | Suscripción vigente (`periodEnd > NOW()`) |
| * → CANCELLED | ✅ | Siempre — no borra datos |
| CANCELLED → * | ❌ | No se reactiva |

**Defaults de `tenant_settings` por plan:**

| Plan | maxDrivers | maxMonthlyServices | overagePrice |
|---|---|---|---|
| TRIAL | 3 | 50 | 0 |
| STARTER | 5 | 200 | 15000 |
| GROWTH | 20 | 1000 | 12000 |
| BUSINESS | 50 | 999999 | 0 |
| ENTERPRISE | 999999 | 999999 | 0 |

### Validaciones Zod

```typescript
// POST /api/tenants
const createTenantSchema = z.object({
  name:          z.string().min(2).max(150),
  billingEmail:  z.string().email(),
  billingNit:    z.string().optional(),
  plan:          z.nativeEnum(TenantPlan).default(TenantPlan.TRIAL),
  adminName:     z.string().min(2),
  adminEmail:    z.string().email(),
  adminPassword: z.string().min(8),
})

// PATCH /api/tenants/:id
const updateTenantSchema = z.object({
  name:         z.string().min(2).max(150).optional(),
  billingEmail: z.string().email().optional(),
  billingNit:   z.string().optional(),
  domain:       z.string().url().optional(),
})

// PATCH /api/tenants/:id/status
const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']),
})

// PATCH /api/tenants/:id/settings
const updateSettingsSchema = z.object({
  brandName:              z.string().max(100).optional(),
  logoUrl:                z.string().url().optional(),
  primaryColor:           z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  supportEmail:           z.string().email().optional(),
  supportPhone:           z.string().max(20).optional(),
  maxDrivers:             z.number().int().min(1).optional(),
  maxMonthlyServices:     z.number().int().min(1).optional(),
  overagePricePerService: z.number().min(0).optional(),
})
```

### Respuestas esperadas

**GET /api/tenants**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Grúas del Valle SAS",
      "slug": "gruas-del-valle-sas",
      "plan": "GROWTH",
      "status": "ACTIVE",
      "billingEmail": "admin@gruas.co",
      "trialEndsAt": null,
      "createdAt": "2025-01-15T10:00:00Z",
      "settings": {
        "brandName": "Grúas del Valle",
        "logoUrl": "https://...",
        "maxDrivers": 20,
        "maxMonthlyServices": 1000
      }
    }
  ],
  "meta": { "total": 7, "page": 1, "limit": 20, "totalPages": 1 }
}
```

**POST /api/tenants**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "name": "Grúas del Norte",
    "slug": "gruas-del-norte",
    "plan": "TRIAL",
    "status": "TRIAL",
    "trialEndsAt": "2025-02-14T10:00:00Z"
  },
  "message": "Tenant creado correctamente"
}
```

**PATCH /api/tenants/:id/status — error**
```json
{
  "success": false,
  "error": "INVALID_TRANSITION",
  "message": "No se puede reactivar un tenant cancelado"
}
```

## Archivos a crear

```
src/entities/Tenant.ts
src/entities/TenantSettings.ts
src/entities/TenantSubscription.ts
src/entities/User.ts
src/modules/auth/auth.routes.ts
src/modules/auth/auth.controller.ts
src/modules/auth/auth.service.ts
src/modules/tenants/tenants.routes.ts
src/modules/tenants/tenants.controller.ts
src/modules/tenants/tenants.service.ts
```
