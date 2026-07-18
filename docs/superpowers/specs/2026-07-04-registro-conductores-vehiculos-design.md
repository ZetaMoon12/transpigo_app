# Registro de Conductores y Vehículos (apertura de HV) — Design

## Contexto

`CLAUDE_CONDUCTORES.md` documenta un flujo de **invitación** para conductores:
el admin envía solo `name` + `email`, se genera un `inviteToken`, y el
conductor completa su propio registro (datos, documentos, vehículo) a través
de un link público (`app.transpigo.com/onboarding/:token`).

Las imágenes de referencia ("DOCUMENTOS APERTURA DE HV") describen un proceso
distinto y más amplio: el **admin captura todo de una vez** — datos del
conductor, del propietario del vehículo y del vehículo mismo, junto con sus
documentos — sin pasar por el token de onboarding. Este es el proceso de
"apertura de hoja de vida" que usa el equipo administrativo cuando recibe
todos los documentos directamente (ej. por WhatsApp/correo) y los carga al
sistema.

**Ninguna API de este flujo existe en el backend todavía.** Este documento
define el contrato que el frontend asumirá; el backend deberá implementarlo
después.

Varios campos pedidos en las imágenes no existen en el esquema de
`CLAUDE_CONDUCTORES.md` (propietario como entidad, referencias
familiares/laborales, credenciales de empresa satelital, dirección/ciudad
detallada del conductor). Se definen aquí como parte del contrato nuevo.

## Alcance

Una página nueva, multi-paso (no modal), para que un `ADMIN`/`SUPER_ADMIN`
registre un conductor + propietario + vehículo (+ planchón si aplica) en una
sola sesión, con carga de todos los documentos requeridos.

Fuera de alcance: el flujo de invitación/onboarding existente (no se toca),
listado/edición de conductores ya registrados (se deja una lista vacía con
CTA), aprobación de documentos (ya documentada en el md, no se repite aquí).

## Rutas y navegación

- `/conductores` — lista (vacía por ahora, `GET /api/drivers` no existe aún)
  con estado vacío y botón "Registrar conductor".
- `/conductores/nuevo` — el wizard.
- Ambas protegidas: `ProtectedRoute` → `MainLayout`.
- Nuevo item "Conductores" (icono `UsersIcon` de lucide-react) en el grupo
  "Operaciones" del sidebar (`MainLayout.tsx`), junto al item "Dashboard".
- Nuevas claves en `ROUTES` (`router/routes.ts`): `DRIVERS: '/conductores'`,
  `DRIVERS_NEW: '/conductores/nuevo'`.

## Flujo de pasos

Componente `Stepper` nuevo en `src/components/ui/stepper.tsx` (no existe hoy,
se construye con Tailwind — sin librería extra). Barra horizontal fija arriba
del formulario mostrando cada paso con estado `pending | current | complete`.
Navegación con botones "Anterior" / "Siguiente" (o "Registrar" en el último).

1. **Conductor** — datos personales + documentos + referencias
2. **Propietario** — datos del dueño del vehículo (siempre presente, no
   condicional a si el conductor es el dueño)
3. **Vehículo** — datos + documentos + selección de `VehicleType`
4. **Planchón** — condicional: solo si el tipo elegido en el paso 3 es
   `GRUA_PLATAFORMA` o `GRUA_BRAZO`. Si el usuario retrocede y cambia el tipo
   a un camión, el paso desaparece del stepper y sus datos se descartan.
5. **Revisión y envío** — resumen de solo lectura de cada sección con link
   "Editar" que regresa al step correspondiente.

Cada paso valida su propia porción antes de permitir avanzar
(`react-hook-form` `trigger()` sobre el sub-schema del paso). El estado
completo vive en un único `useForm` para que "Revisión" lea todo sin duplicar
estado y el submit final envíe el objeto completo.

## Stack de formulario

El proyecto no tiene `react-hook-form` ni `zod` instalados (los forms
existentes, ej. `LoginPage.tsx`, usan `useState` manual). Se agregan ambas
dependencias — justificado por el volumen de campos (~25+) y pasos.

```
npm install react-hook-form zod @hookform/resolvers
```

## Modelo de datos y validación

Nuevos archivos:
- `src/types/driver-registration.types.ts` — interfaces del payload.
- `src/schemas/driver-registration.schema.ts` — zod schemas por paso.

### Paso 1 — Conductor (`driverSchema`)

| Campo | Tipo/regla |
|---|---|
| `name` | string, min 2 |
| `cedulaNumero` | string |
| `city`, `neighborhood`, `address` | string, requeridos |
| `phone` | string, max 20 |
| `email` | email válido |
| `licenciaVencimiento` | date |
| `fotoDocumento` | File (sin gorra/gafas — solo validación de tipo/tamaño, la regla de "sin gorra" es instructiva para el usuario, no validable) |
| `fotoCedulaFrente`, `fotoCedulaReverso` | File |
| `fotoLicenciaFrente`, `fotoLicenciaReverso` | File |
| `planillaSeguridadSocial` | File |
| `referenciasFamiliares` | array fijo de 2: `{ nombre, parentesco, celular }` |
| `referenciasLaborales` | array fijo de 2: `{ empresa, contacto, celular }` |

Todos los campos son obligatorios (las imágenes no marcan ninguno como
opcional).

### Paso 2 — Propietario (`ownerSchema`)

| Campo | Tipo/regla |
|---|---|
| `fotoCedulaFrente`, `fotoCedulaReverso` | File |
| `municipality`, `neighborhood`, `address` | string |
| `phone` | string |
| `email` | email válido |
| `rut` | File |
| `certificadoBancario` | File |

### Paso 3 — Vehículo (`vehicleSchema`)

Reutiliza exactamente las reglas de `createVehicleSchema` en
`CLAUDE_CONDUCTORES.md`:

```ts
type:          z.nativeEnum(VehicleType)
plate:         z.string().min(5).max(10) // se normaliza a mayúsculas
brand:         z.string().min(2).max(60)
model:         z.string().min(2).max(60)
year:          z.number().int().min(1990).max(currentYear + 1)
maxWeightTons: z.number().min(0).max(100)
color:         z.string().max(40).optional()
```

Más, del listado de imágenes:

| Campo | Tipo/regla |
|---|---|
| `matriculaFrente`, `matriculaReverso` | File |
| `cartaAutorizacion` | File, opcional (solo si la matrícula no tiene el nombre del propietario actual) |
| `seguroResponsabilidadCivil` | File |
| `soat` | File |
| `tecnomecanica` | File |
| `empresaSatelital` | `{ nombre: string, usuario: string, contrasena: string }` |
| `fotoLateralIzquierda`, `fotoLateralDerecha` | File |
| `fotoFrontal`, `fotoTrasera` | File |

`cartaAutorizacion` es el único campo opcional de todo el formulario —
condicionado con un checkbox "¿La matrícula está a nombre de otra persona?".

### Paso 4 — Planchón (`attachmentSchema`, condicional)

Reutiliza `createAttachmentSchema` del md:

```ts
type:          z.nativeEnum(AttachmentType) // PLANCHON | REMOLQUE | CARROCERIA
plate:         z.string().min(5).max(10)
brand, model:  z.string().optional()
year:          z.number().int().min(1990).optional()
maxWeightTons: z.number().min(0).max(100)
```

Más documentos: `soat`, `tecnomecanica`, `tarjetaPropiedad`, `fotoPlanchon`
(todos `File`).

### Validación de archivos (todos los campos `File`)

`z.instanceof(File)` + refine: tipo MIME en `image/*` o `application/pdf`,
tamaño máx. 5MB. Mensaje de error uniforme mostrado bajo el `FileDropInput`.

### Schema combinado

```ts
const fullRegistrationSchema = z.object({
  driver: driverSchema,
  owner: ownerSchema,
  vehicle: vehicleSchema,
  attachment: attachmentSchema.optional(), // presente solo si aplica grúa
})
```

## Componente de archivo

`src/components/common/file-drop-input.tsx` — input estilizado tipo
dropzone (click o drag&drop), con preview de nombre de archivo y botón de
quitar. Reutilizado en los ~19 campos de documentos. Props: `label,
required, error, accept, onChange, value`. Usa `FieldError` de
`components/ui/field.tsx` para mostrar errores, consistente con el resto de
inputs del proyecto.

## Envío y servicio

Nuevo `src/services/driver-registration.service.ts`:

```ts
export const driverRegistrationService = {
  create: (payload: FullRegistrationPayload) => {
    const formData = new FormData();
    // Campos de texto por entidad como JSON bajo 'driver', 'owner', 'vehicle', 'attachment'
    // Cada File bajo su propia key, ej. 'driver.fotoCedulaFrente'
    return httpClient.upload<ApiResponse<...>>('/drivers/full-registration', formData);
  },
};
```

`POST /api/drivers/full-registration` es un endpoint **propuesto**, no
documentado en `CLAUDE_CONDUCTORES.md` — se señala con un comentario corto en
el archivo del servicio para que quede claro que el backend debe
implementarlo con este contrato (o el frontend deberá ajustarse si el
backend define otra forma).

**Sin mock de éxito.** El botón "Registrar" llama al service real. Si falla
(404/red, porque el backend no existe aún), se muestra el error tal cual vía
`sonner`, reusando el manejo de errores de `http-client.ts` /
`lib/api-error.ts`. No hay simulación de éxito — se acepta que el flujo no
se puede demostrar end-to-end hasta que el backend exista.

## Estados de UI

- Botón "Registrar" con spinner mientras se envía (mismo patrón visual que
  `LoginPage.tsx`).
- Errores de validación inline por campo al intentar avanzar de paso
  (`FieldError`).
- Paso 5 "Revisión": resumen de solo lectura por sección con link "Editar"
  que regresa al step (`setStep(n)`, sin perder datos ya llenados).
- Éxito → toast + redirección a `/conductores`.
- Error de red/servidor → toast de error, el usuario permanece en el step 5
  con sus datos intactos para reintentar.

## Archivos a crear/modificar

```
src/types/driver-registration.types.ts       (nuevo)
src/schemas/driver-registration.schema.ts     (nuevo)
src/services/driver-registration.service.ts   (nuevo)
src/components/common/file-drop-input.tsx     (nuevo)
src/components/ui/stepper.tsx                 (nuevo)
src/pages/Drivers/DriversPage.tsx             (nuevo — lista vacía + CTA)
src/pages/Drivers/DriverRegistrationWizard.tsx (nuevo — orquesta los steps)
src/pages/Drivers/steps/DriverStep.tsx        (nuevo)
src/pages/Drivers/steps/OwnerStep.tsx         (nuevo)
src/pages/Drivers/steps/VehicleStep.tsx       (nuevo)
src/pages/Drivers/steps/AttachmentStep.tsx    (nuevo)
src/pages/Drivers/steps/ReviewStep.tsx        (nuevo)
src/pages/Drivers/index.ts                   (nuevo)
src/router/routes.ts                          (modificado — 2 rutas nuevas)
src/router/index.tsx                          (modificado — registrar páginas)
src/layouts/MainLayout.tsx                    (modificado — item sidebar)
package.json                                  (modificado — react-hook-form, zod, @hookform/resolvers)
```

## Testing

No hay suite de tests en el proyecto (no hay `vitest`/`jest` configurado).
Verificación manual: `npm run dev`, recorrer los 5 pasos (con y sin tipo
grúa para validar el paso condicional), validar mensajes de error por campo,
confirmar que el submit dispara el error de red esperado (backend
inexistente) y que el toast se muestra correctamente.
