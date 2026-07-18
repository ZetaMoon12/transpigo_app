src/
├── config/                    # Configuración global
│   ├── env.ts                 # Variables de entorno tipadas
│   ├── constants.ts           # Constantes de la app
│   └── index.ts
│
├── types/                     # Tipos compartidos
│   ├── api.types.ts           # ApiResponse, PaginatedResponse, ApiError
│   ├── common.types.ts        # BaseEntity, QueryParams, SelectOption
│   └── index.ts
│
├── services/                  # Capa de servicios (lógica de peticiones)
│   ├── http-client.ts         # Cliente HTTP centralizado (fetch wrapper)
│   ├── auth.service.ts        # Ejemplo: servicio de autenticación
│   └── index.ts
│
├── hooks/                     # Custom hooks reutilizables
│   ├── useAsync.ts            # Manejo de estados async (loading/error/data)
│   ├── useLocalStorage.ts     # Persistencia en localStorage
│   ├── usePagination.ts       # Estado de paginación/búsqueda/orden
│   ├── useDebounce.ts         # Debounce para inputs
│   └── index.ts
│
├── utils/                     # Funciones utilitarias puras
│   ├── formatters.ts          # capitalize, truncate, slugify, getInitials
│   ├── validators.ts          # isValidEmail, isEmpty, validatePassword
│   ├── helpers.ts             # sleep, formatCurrency, formatDate, cn()
│   └── index.ts
│
├── context/                   # React Context providers
│   ├── AuthContext.tsx         # Estado global de autenticación
│   └── index.ts
│
├── components/
│   ├── ui/                    # Componentes UI atómicos (Button, Input, Modal)
│   │   └── index.ts
│   └── common/                # Componentes compartidos (Header, Sidebar)
│       └── index.ts
│
├── layouts/                   # Layouts de página
│   ├── MainLayout.tsx         # Layout principal (con sidebar/header)
│   ├── AuthLayout.tsx         # Layout de auth (mínimo)
│   └── index.ts
│
├── pages/                     # Páginas (una carpeta por feature)
│   ├── Dashboard/
│   ├── Auth/
│   └── NotFound/
│
├── router/                    # Configuración de rutas
│   ├── index.tsx              # Router con createBrowserRouter
│   ├── routes.ts              # Constantes de rutas
│   └── guards.tsx             # ProtectedRoute / PublicRoute
│
├── App.tsx                    # Solo renderiza el RouterProvider
├── main.tsx                   # Entry point con providers
└── index.css                  # Estilos globales + TailwindCSS
