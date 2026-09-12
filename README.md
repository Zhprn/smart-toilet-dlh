# Enggal Group Admin Dashboard (React + Vite)

A React-based admin dashboard for managing Enggal Group data: Brands, Promos, Outlets, Team Members, News (Berita), Users, and Careers.

## Features
- CRUD interfaces for core resources
- Support for file uploads (logo/image) to the backend
- Pagination & filtering (Brand, Promo, Outlet, Team, Berita, UserCareer)
- Planned: authentication and role-based access

## Tech Stack
- React 19, Vite 7
- Recommended libs: Axios, TanStack Query (React Query), React Hook Form, Zod

## Getting Started
```bash
cd fe/dashboard
npm install

# Backend API URL
cat > .env.local << 'EOF'
VITE_API_URL="http://localhost:3003"
EOF

# Start dev server
npm run dev
```

## Project Structure (Recommended)
```
src/
├── api/                # axios client, interceptors, domain services, types
├── features/           # domain features (brand, promo, outlet, team, berita, user, career)
│   └── brand/
│       ├── pages/
│       ├── forms/
│       ├── components/
│       └── hooks/
├── routes/             # route definitions
├── components/         # shared UI components
├── store/              # auth store (planned)
├── utils/              # helpers
└── styles/             # global styles
```

## Integration Guidelines

### Axios Client & Interceptors
Use a centralized Axios instance to: attach `Authorization` header, unwrap success envelope, and normalize errors.
```ts
// src/api/axiosClient.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') // or your auth store
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => {
    // backend: { statusCode, message, data }
    return res.data?.data ?? res.data
  },
  (err) => {
    const { response } = err
    const payload = response?.data
    const norm = {
      statusCode: payload?.statusCode ?? response?.status ?? 500,
      message: payload?.message ?? err.message ?? 'Unexpected error',
      data: payload?.data ?? null, // validationErrors when 400
    }
    return Promise.reject(norm)
  }
)
```

### React Query (Data Fetching)
```ts
// src/features/brand/hooks/useBrands.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/axiosClient'

export function useBrands(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['brand', page, limit],
    queryFn: async () => api.get(`/brand?page=${page}&limit=${limit}`),
    staleTime: 60_000,
    keepPreviousData: true,
  })
}
```

### Multipart Form Submission
```ts
// src/features/brand/forms/submitBrand.ts
import { api } from '@/api/axiosClient'

export async function createBrand({ nama, description, logoFile }: {
  nama: string
  description: string
  logoFile: File
}) {
  const fd = new FormData()
  fd.append('nama', nama)
  fd.append('description', description)
  fd.append('logo', logoFile) // required on create
  return api.post('/brand', fd)
}
```

### Validation (RHF + Zod)
```ts
// src/features/brand/forms/schema.ts
import { z } from 'zod'
export const brandSchema = z.object({
  nama: z.string().min(1),
  description: z.string().min(1),
  logo: z.instanceof(File), // create only
})
```

## Available Backend Endpoints (Used by Dashboard)
- Brand: `/brand` (POST create multipart), `/brand?page&limit` (GET), `/brand/:id` (GET/PUT multipart/DELETE)
- Promo: `/promo` (POST create multipart), `/promo?page&limit&brandId?` (GET), `/promo/:id` (GET/PUT multipart/DELETE)
- Outlet: `/outlet` (POST JSON), `/outlet?page&limit&brandId?` (GET), `/outlet/:id` (GET/PUT/DELETE)
- Team: `/team` (POST JSON), `/team?page&limit` (GET), `/team/:id` (GET/PUT/DELETE)
- Berita: `/berita` (POST multipart image optional), `/berita?page&limit` (GET), `/berita/:id` (GET/PUT multipart/DELETE)
- User: `/user` (POST JSON, GET list), `/user/:id` (GET/PUT/DELETE)
- UserCareer: `/user-career` (POST JSON, GET paginated), `/user-career/:id` (GET/PUT/DELETE)
- Upload: `/upload` (POST multipart: `file`), `/upload/:filename` (GET static)

## Environment
- `VITE_API_URL`: Backend base URL (e.g., `http://localhost:3003`)

## API Types (Optional)
Generate TypeScript types from backend Swagger:
```bash
npx openapi-typescript ../../be/swagger-spec.json -o src/api/types.ts
```

## Testing (Suggested)
- Unit/Integration: Vitest + MSW for API mocks
- E2E: Playwright or Cypress for CRUD flows

## Performance & Maintainability
- Use React Query caching with `staleTime`
- Code split per route (`React.lazy`)
- Virtualize large tables/lists
- Strict TypeScript, centralized API services, consistent DTO mapping

## Authentication (Planned)
Swagger includes Bearer auth. When backend auth guards are added, attach the token via Axios and protect routes in the dashboard.
