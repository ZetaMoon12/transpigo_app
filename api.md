# Transpigo API — Auth + Tenants

Base URL local: `http://localhost:3001`

Formato de respuesta estándar:

```jsonc
// Éxito
{ "success": true, "data": { ... }, "message"?: "..." }

// Lista paginada
{ "success": true, "data": [...], "meta": { "total": 7, "page": 1, "limit": 20, "totalPages": 1 } }

// Error
{ "success": false, "error": "CODIGO", "message": "Descripción legible" }
```

---

## Auth (`/api/auth`)

Todas públicas, excepto `/me` que requiere `Authorization: Bearer <accessToken>`.

### `POST /api/auth/super-admin`

Crea el super administrador. Solo funciona **una vez** — si ya existe un usuario con rol `SUPER_ADMIN`, responde `409 CONFLICT`.

**Body:**
```json
{
  "name": "Admin TranspiGo",
  "email": "admin@transpigo.com",
  "password": "Admin123"
}
```

**Respuesta 201:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tenantId": null,
    "companyId": null,
    "name": "Admin TranspiGo",
    "email": "admin@transpigo.com",
    "role": "SUPER_ADMIN",
    "active": true,
    "createdAt": "2026-07-03T02:22:29.705Z",
    "updatedAt": "2026-07-03T02:22:29.705Z"
  },
  "message": "Super administrador creado exitosamente"
}
```

Errores: `409 CONFLICT` (ya existe super admin, o el email ya está en uso).

---

### `POST /api/auth/login`

Login unificado para todos los roles (`SUPER_ADMIN`, `ADMIN`, `COMPANY_ADMIN`, `COMPANY_USER`, `DRIVER`). Busca por email sin filtrar por tenant.

**Body:**
```json
{ "email": "admin@transpigo.com", "password": "Admin123" }
```

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": 1,
      "tenantId": null,
      "companyId": null,
      "name": "Admin TranspiGo",
      "email": "admin@transpigo.com",
      "role": "SUPER_ADMIN",
      "active": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  },
  "message": "Inicio de sesión exitoso"
}
```

Redirección sugerida en frontend según `role`:
- `SUPER_ADMIN` → `admin.transpigo.com/dashboard`
- `ADMIN` → `app.transpigo.com/dashboard`
- `DRIVER` → `app.transpigo.com/conductor`

Errores: `401 UNAUTHORIZED` — `"Credenciales inválidas"` (email no existe o password no coincide, mensaje genérico a propósito) o `"Cuenta inactiva"`.

---

### `POST /api/auth/refresh`

Renueva el access token. El `refreshToken` se valida contra su hash almacenado en la tabla `refresh_tokens` (un registro activo por usuario) y **rota**: se emite un par nuevo y se invalida el anterior.

**Body:**
```json
{ "refreshToken": "eyJ..." }
```

**Respuesta 200:** igual forma que `login` (`accessToken`, `refreshToken`, `user`), mensaje `"Token renovado exitosamente"`.

Errores: `401 UNAUTHORIZED` — `"Refresh token inválido o expirado"` (token vencido, ya rotado, revocado por logout, o cuenta inactiva).

---

### `POST /api/auth/logout`

Revoca el refresh token (borra el registro en `refresh_tokens`). Idempotente — responde éxito aunque el token ya sea inválido.

**Body:**
```json
{ "refreshToken": "eyJ..." }
```

**Respuesta 200:**
```json
{ "success": true, "data": null, "message": "Sesión cerrada exitosamente" }
```

---

### `GET /api/auth/me`

Requiere `Authorization: Bearer <accessToken>`.

**Respuesta 200 (SUPER_ADMIN):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tenantId": null,
    "companyId": null,
    "name": "Admin TranspiGo",
    "email": "admin@transpigo.com",
    "role": "SUPER_ADMIN",
    "active": true,
    "createdAt": "...",
    "updatedAt": "...",
    "tenant": null
  }
}
```

**Respuesta 200 (ADMIN de un tenant):** igual, pero `tenant` viene poblado:
```json
"tenant": {
  "name": "Grúas del Valle SAS",
  "slug": "gruas-del-valle-sas",
  "plan": "GROWTH",
  "status": "ACTIVE",
  "settings": {
    "brandName": "Grúas del Valle",
    "logoUrl": null,
    "primaryColor": "#F5A623"
  }
}
```

Errores: `401 UNAUTHORIZED` — `"Token no proporcionado"` o `"Token inválido o expirado"`.

---

## Tenants (`/api/tenants`)

Todas requieren `Authorization: Bearer <accessToken>` de un usuario `SUPER_ADMIN`. Cualquier otro rol recibe `403 FORBIDDEN`; sin token, `401 UNAUTHORIZED`.

### `GET /api/tenants?page=1&limit=20`

Lista paginada, incluye `settings`. `limit` máximo 100.

**Respuesta 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Grúas del Valle SAS",
      "slug": "gruas-del-valle-sas",
      "domain": null,
      "plan": "GROWTH",
      "status": "ACTIVE",
      "billingEmail": "admin@gruas.co",
      "billingNit": "900123456-7",
      "trialEndsAt": null,
      "createdAt": "...",
      "updatedAt": "...",
      "settings": { "...": "..." }
    }
  ],
  "meta": { "total": 7, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

### `GET /api/tenants/:id`

Detalle con `settings` y `subscription` (puede ser `null` si el tenant no tiene suscripción paga).

Errores: `404 NOT_FOUND`.

---

### `POST /api/tenants`

Crea el tenant en una sola transacción: `tenants` → `tenant_settings` (con defaults del plan) → `users` (admin inicial, rol `ADMIN`). Si algo falla, se revierte todo.

**Body:**
```json
{
  "name": "Grúas del Valle SAS",
  "billingEmail": "facturacion@gruas.co",
  "billingNit": "900123456-7",
  "plan": "TRIAL",
  "adminName": "Carlos Rodríguez",
  "adminEmail": "carlos@gruas.co",
  "adminPassword": "minimo8chars"
}
```

Campos: `plan` es opcional (default `TRIAL`), `billingNit` opcional. `plan` ∈ `TRIAL | STARTER | GROWTH | BUSINESS | ENTERPRISE`.

**Slug:** autogenerado desde `name` (minúsculas, sin tildes, espacios → guiones). Colisión → sufijo `-2`, `-3`, ... Ej: `"Grúas del Valle SAS"` → `gruas-del-valle-sas`.

**Trial:** si `plan = TRIAL`, `trialEndsAt` se fija a **+30 días** desde la creación.

**Defaults de `tenant_settings`:** se copian de la tabla `plans` (ver sección [Plans](#plans-apiplans) más abajo) — `maxDrivers`, `maxMonthlyServices` y `overagePricePerService` del plan elegido. Si el `code` no existe en el catálogo, responde `404 NOT_FOUND`.

**Respuesta 201:**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "name": "Grúas del Valle SAS",
    "slug": "gruas-del-valle-sas",
    "plan": "TRIAL",
    "status": "TRIAL",
    "trialEndsAt": "2026-08-02T...",
    "settings": { "...": "..." }
  },
  "message": "Tenant creado correctamente"
}
```

Errores: `409 CONFLICT` — el `adminEmail` ya está en uso (es único a nivel global, no solo por tenant, porque el login busca sin filtrar por tenant).

---

### `PATCH /api/tenants/:id`

Actualiza datos generales. Todos los campos son opcionales.

**Body:**
```json
{
  "name": "Grúas del Valle S.A.S.",
  "billingEmail": "nuevo@gruas.co",
  "billingNit": "900123456-7",
  "domain": "https://gruasdelvalle.com"
}
```

No regenera el `slug` (eso requeriría un endpoint dedicado, no está en el spec actual).

Errores: `404 NOT_FOUND`.

---

### `PATCH /api/tenants/:id/status`

Cambia el estado del tenant.

**Body:**
```json
{ "status": "ACTIVE" }
```
`status` ∈ `ACTIVE | SUSPENDED | CANCELLED`.

**Tabla de transiciones:**

| Desde → Hacia | Permitida | Condición |
|---|---|---|
| `TRIAL` → `ACTIVE` | ✅ | Necesita `tenant_subscriptions.periodEnd > NOW()` |
| `ACTIVE` → `SUSPENDED` | ✅ | Siempre |
| `SUSPENDED` → `ACTIVE` | ✅ | Necesita `tenant_subscriptions.periodEnd > NOW()` |
| cualquiera → `CANCELLED` | ✅ | Siempre, no borra datos |
| `CANCELLED` → cualquiera | ❌ | Nunca se reactiva |
| mismo estado → mismo estado | ❌ | Rechazado explícitamente |

Para probar `TRIAL → ACTIVE` o `SUSPENDED → ACTIVE`, crea antes la suscripción con `POST /api/tenants/:id/subscription` (ver más abajo).

**Respuesta 200:** el tenant actualizado.

**Error 409 (ejemplo):**
```json
{
  "success": false,
  "error": "INVALID_TRANSITION",
  "message": "No se puede reactivar un tenant cancelado"
}
```

Errores: `404 NOT_FOUND`, `409 INVALID_TRANSITION`.

---

### `PATCH /api/tenants/:id/settings`

Actualiza branding/configuración operativa. Todos los campos opcionales.

**Body:**
```json
{
  "brandName": "Grúas del Valle",
  "logoUrl": "https://cdn.transpigo.com/logo.png",
  "primaryColor": "#F5A623",
  "supportEmail": "soporte@gruas.co",
  "supportPhone": "3001234567",
  "maxDrivers": 25,
  "maxMonthlyServices": 1200,
  "overagePricePerService": 12000
}
```

**Respuesta 200:** el registro `tenant_settings` actualizado.

Errores: `404 NOT_FOUND`.

---

### `GET /api/tenants/:id/subscription`

Suscripción activa del tenant.

Errores: `404 NOT_FOUND` (tenant no existe o no tiene suscripción).

---

### `POST /api/tenants/:id/subscription`

Crea la suscripción del tenant. Falla si ya tiene una (usar `PATCH` para modificarla).

**Body:**
```json
{
  "plan": "GROWTH",
  "priceMonthly": 450000,
  "currency": "COP",
  "periodStart": "2026-07-03T00:00:00.000Z",
  "periodEnd": "2026-08-03T00:00:00.000Z",
  "payuRef": "PAYU-REF-123",
  "autoRenew": true
}
```

`plan` ∈ `STARTER | GROWTH | BUSINESS | ENTERPRISE` (sin `TRIAL` — un tenant en trial no tiene suscripción paga). `currency` (default `COP`) y `autoRenew` (default `true`) son opcionales, igual que `payuRef`. Se valida `periodEnd > periodStart`.

**Respuesta 201:** el registro `tenant_subscriptions` creado.

Errores: `404 NOT_FOUND` (tenant no existe), `409 CONFLICT` (ya tiene suscripción), `422 VALIDATION_ERROR`.

---

### `PATCH /api/tenants/:id/subscription`

Actualiza la suscripción existente — todos los campos opcionales. Útil para renovar (`periodStart`/`periodEnd`), cambiar de plan, o actualizar `payuRef`/`autoRenew`.

**Body (ejemplo — solo renovar el periodo):**
```json
{
  "periodStart": "2026-08-03T00:00:00.000Z",
  "periodEnd": "2026-09-03T00:00:00.000Z"
}
```

**Respuesta 200:** el registro actualizado.

Errores: `404 NOT_FOUND`, `422 VALIDATION_ERROR`.

---

### `DELETE /api/tenants/:id/subscription`

Cancela la suscripción — **soft delete**: fija `cancelledAt` y `autoRenew=false`, no elimina la fila (regla del proyecto: nunca `DELETE` sobre entidades de negocio). No cambia el `status` del tenant automáticamente; usa `PATCH /api/tenants/:id/status` aparte si corresponde.

**Respuesta 200:** el registro con `cancelledAt` seteado.

Errores: `404 NOT_FOUND`.

---

## Plans (`/api/plans`)

Todas requieren `Authorization: Bearer <accessToken>` de un `SUPER_ADMIN`. CRUD del catálogo de planes — esta tabla es ahora la **única fuente de verdad** para `maxDrivers`, `maxMonthlyServices` y `overagePricePerService`: `POST /api/tenants` consulta esta tabla al crear un tenant (ya no hay valores hardcodeados en el código).

### `GET /api/plans`

Lista **todos** los planes (activos e inactivos), ordenados por precio.

### `GET /api/plans/:id`

Detalle de un plan.

Errores: `404 NOT_FOUND`.

### `POST /api/plans`

Crea un plan nuevo en el catálogo. `code` debe ser único (`409 CONFLICT` si ya existe).

**Body:**
```json
{
  "code": "STARTER",
  "name": "Starter",
  "description": "Para operadores pequeños empezando a digitalizar su flota",
  "priceMonthly": 250000,
  "currency": "COP",
  "maxDrivers": 5,
  "maxMonthlyServices": 200,
  "overagePricePerService": 15000,
  "features": ["Hasta 5 conductores", "200 servicios/mes", "Soporte por email"]
}
```
`code` ∈ `TRIAL | STARTER | GROWTH | BUSINESS | ENTERPRISE`. `description`, `currency` (default `COP`), `overagePricePerService` (default `0`) y `features` son opcionales.

**Respuesta 201:** el plan creado.

### `PATCH /api/plans/:id`

Actualiza cualquier campo (todos opcionales) — incluye `active` para reactivar un plan desactivado. `code` no se puede modificar.

**Respuesta 200:** el plan actualizado.

Errores: `404 NOT_FOUND`.

### `DELETE /api/plans/:id`

**Soft delete**: fija `active=false` (no elimina la fila). Un plan inactivo deja de aparecer en el catálogo público, pero sigue existiendo para tenants que ya lo tienen.

Errores: `404 NOT_FOUND`.

---

## Plan público (`/api/plan`)

Sin autenticación — pensado para la página de precios de la web de Transpigo.

### `GET /api/plan`

Lista solo los planes con `active=true`, ordenados por precio.

**Respuesta 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "code": "STARTER",
      "name": "Starter",
      "description": "...",
      "priceMonthly": "250000.00",
      "currency": "COP",
      "maxDrivers": 5,
      "maxMonthlyServices": 200,
      "overagePricePerService": "15000.00",
      "features": ["Hasta 5 conductores", "200 servicios/mes"],
      "active": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

> ⚠️ **Datos sembrados con `priceMonthly: 0`** en los 5 planes (`TRIAL/STARTER/GROWTH/BUSINESS/ENTERPRISE`) — el spec original no definía precios reales. Actualízalos con `PATCH /api/plans/:id` antes de usar este endpoint en la web pública.

---

## Tenant público (`/api/tenant`)

Sin autenticación — pensado para el frontend del tenant resuelto por wildcard DNS (`{slug}.transpigo.com`).

### `GET /api/tenant/me?slug={slug}`

Devuelve solo lo necesario para brandear el ambiente. **Nunca** expone facturación (`billingEmail`, `billingNit`) ni límites del plan (`maxDrivers`, etc.).

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Grúas del Valle SAS",
    "slug": "gruas-del-valle-sas",
    "plan": "GROWTH",
    "status": "ACTIVE",
    "settings": {
      "brandName": "Grúas del Valle",
      "logoUrl": "https://...",
      "primaryColor": "#F5A623",
      "supportEmail": "soporte@gruas.co",
      "supportPhone": "3001234567",
      "timezone": "America/Bogota",
      "currency": "COP"
    }
  }
}
```

Errores: `422 VALIDATION_ERROR` (falta `slug`), `404 NOT_FOUND` (slug no existe).

---

## Otros

### `GET /health`

Sin autenticación. Chequeo de vida del servidor.

```json
{ "success": true, "data": { "status": "ok" } }
```

---

## Credenciales de prueba (entorno local)

```
email:    admin@transpigo.com
password: Admin123
role:     SUPER_ADMIN
```
