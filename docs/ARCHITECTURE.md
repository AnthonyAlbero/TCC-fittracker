
# FitTracker - Arquitetura Técnica Completa

## 🏗️ Visão Geral da Arquitetura

FitTracker é uma aplicação full-stack moderna com arquitetura **Cliente-Servidor** seguindo padrões RESTful, com integração de IA multimodal e cálculos científicos avançados.

---

## 📊 Diagrama de Arquitetura de Alto Nível

```
┌──────────────────────────────────────────────────────────────────┐
│                         CAMADA DE APRESENTAÇÃO                    │
│                          (React Frontend)                         │
├──────────────────────────────────────────────────────────────────┤
│  Browser / Mobile PWA                                             │
│  ├─ CaloriesTab (rastreamento de alimentos)                      │
│  ├─ WorkoutsTab (registro de exercícios)                         │
│  ├─ BodyFatTab (análise de composição)                           │
│  ├─ ProfileTab (gerenciamento de perfil)                         │
│  └─ Temas: Light/Dark Mode com persistência                      │
└──────────────────────────────────────────────────────────────────┘
                              ↕
                    HTTP/REST (JSON APIs)
                              ↕
┌──────────────────────────────────────────────────────────────────┐
│                      CAMADA DE APLICAÇÃO                           │
│                      (Express.js Backend)                         │
├──────────────────────────────────────────────────────────────────┤
│  API Server (Node.js)                                             │
│  ├─ Route Handlers (/api/*)                                      │
│  ├─ Business Logic Layer                                         │
│  ├─ Authentication Middleware                                    │
│  ├─ Error Handling                                               │
│  ├─ Validation Layer (Zod)                                       │
│  └─ Session Management                                           │
└──────────────────────────────────────────────────────────────────┘
                              ↕
                         SQL (ORM)
                              ↕
┌──────────────────────────────────────────────────────────────────┐
│                      CAMADA DE DADOS                               │
│                    (PostgreSQL Database)                          │
├──────────────────────────────────────────────────────────────────┤
│  Relational Database                                              │
│  ├─ users (auth)                                                 │
│  ├─ user_profiles (personal data)                                │
│  ├─ food_entries (calorie logs)                                  │
│  ├─ workout_entries (exercise logs)                              │
│  ├─ body_fat_measurements (composition)                           │
│  ├─ foods (food database)                                        │
│  ├─ exercises (exercise catalog)                                 │
│  └─ sessions (session management)                                │
└──────────────────────────────────────────────────────────────────┘

                    ┌─ Google Gemini 2.5 Flash
                    │  (AI Vision Analysis)
                    │
                    ├─ Multi-angle photo processing
                    ├─ Body composition analysis
                    └─ Confidence scoring
```

---

## 🎨 Arquitetura de Frontend

### Stack Tecnológico

```
Frontend/
├── React 18.3 (UI Framework)
│   ├── Functional Components with Hooks
│   ├── Custom Hooks (useUser, useFood, useWorkout)
│   └── Context API (quando necessário)
│
├── TypeScript 5.6 (Type Safety)
│   ├── Strict mode habilitado
│   ├── Tipos para componentes, hooks, APIs
│   └── Zod para validação runtime
│
├── Vite 5.1 (Build Tool)
│   ├── Fast HMR (Hot Module Replacement)
│   ├── Otimização de bundle
│   └── Code splitting por rota
│
├── Wouter (Routing)
│   ├── Client-side routing lightweight
│   ├── Rota patterns: /:userId/profile
│   └── Sem dependência de router complexo
│
├── TanStack Query 5.60 (Server State)
│   ├── Fetching de dados
│   ├── Caching automático
│   ├── Invalidação de cache
│   └── Loading/Error states
│
├── React Hook Form (Form Management)
│   ├── Integração com Zod validation
│   ├── Controle de input
│   └── Submit handling
│
├── Tailwind CSS 3.4 (Styling)
│   ├── Utility-first CSS
│   ├── Dark mode configurado
│   ├── Responsive design (mobile-first)
│   └── Custom configuration
│
├── Shadcn/UI (Component Library)
│   ├── Button, Input, Card, Dialog
│   ├── Radix UI primitives
│   ├── Customização com Tailwind
│   └── Acessibilidade built-in
│
├── Recharts (Data Visualization)
│   ├── Gráficos de progresso
│   ├── Line charts (histórico)
│   ├── Pie charts (macros)
│   └── Responsive charts
│
└── Next-themes (Theme Management)
    ├── Light/Dark mode toggle
    ├── Persistência no localStorage
    ├── Sincronização com preferência do SO
    └── Transições suaves
```

### Estrutura de Diretórios Frontend

```
client/src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx          # Form de login com validação
│   │   ├── RegisterForm.tsx       # Form de registro
│   │   └── AuthGuard.tsx          # Protected routes wrapper
│   │
│   ├── tabs/
│   │   ├── CaloriesTab.tsx        # Tab principal de calorias
│   │   ├── WorkoutsTab.tsx        # Tab de treinos
│   │   ├── BodyFatTab.tsx         # Tab de gordura corporal
│   │   └── ProfileTab.tsx         # Tab de perfil
│   │
│   ├── ui/
│   │   ├── Button.tsx             # Shadcn Button
│   │   ├── Input.tsx              # Shadcn Input
│   │   ├── Card.tsx               # Custom Card
│   │   ├── Dialog.tsx             # Modal/Dialog
│   │   ├── Tabs.tsx               # Tab component
│   │   └── [outros componentes]
│   │
│   ├── common/
│   │   ├── Navigation.tsx         # Bottom tab navigation
│   │   ├── Header.tsx             # Header com tema toggle
│   │   ├── MetricCard.tsx         # Card de métrica
│   │   ├── LoadingSkeleton.tsx    # Skeleton loading
│   │   ├── Toast.tsx              # Notificações
│   │   └── ErrorBoundary.tsx      # Error handling
│   │
│   └── layouts/
│       ├── MainLayout.tsx         # Layout principal com nav
│       └── AuthLayout.tsx         # Layout auth sem nav
│
├── hooks/
│   ├── useUser.ts                 # Hook para dados de usuário
│   ├── useFood.ts                 # Hook para alimentos
│   ├── useWorkout.ts              # Hook para treinos
│   ├── useBodyFat.ts              # Hook para gordura corporal
│   ├── useAuth.ts                 # Hook para autenticação
│   └── useToast.ts                # Hook para notificações
│
├── lib/
│   ├── api.ts                     # TanStack Query setup + endpoints
│   ├── utils.ts                   # Funções utilitárias
│   ├── validations.ts             # Zod schemas
│   ├── calculations.ts            # Fórmulas (TDEE, BMR, etc)
│   └── constants.ts               # Constantes da app
│
├── pages/
│   ├── Dashboard.tsx              # Página principal
│   ├── Login.tsx                  # Página de login
│   ├── Register.tsx               # Página de registro
│   ├── Profile.tsx                # Página de perfil
│   └── NotFound.tsx               # 404
│
├── styles/
│   └── index.css                  # Tailwind imports + customizações
│
├── App.tsx                        # Root component com routing
├── main.tsx                       # Vite entry point
└── vite-env.d.ts                  # Tipos Vite
```

---

## 🔧 Arquitetura de Backend

### Stack Tecnológico

```
Backend/
├── Express.js 4.21 (Web Framework)
│   ├── Rotas RESTful (/api/*)
│   ├── Middleware stack
│   ├── Error handling
│   └── CORS configuration
│
├── TypeScript 5.6 (Type Safety)
│   ├── Strict mode
│   ├── Types para requests/responses
│   └── Compilação type-safe
│
├── PostgreSQL + Drizzle ORM
│   ├── Type-safe queries
│   ├── Migrations com Drizzle Kit
│   ├── Relationship management
│   └── Connection pooling
│
├── express-session + connect-pg-simple
│   ├── Session persistence em DB
│   ├── Secure cookies
│   ├── HttpOnly + Secure flags
│   └── Auto cleanup
│
├── bcrypt (Password Hashing)
│   ├── 10 rounds salt
│   ├── Timing-safe comparison
│   └── OWASP compliant
│
├── Zod (Validation)
│   ├── Runtime validation
│   ├── Type inference
│   └── Custom error messages
│
└── @google/generative-ai (Gemini API)
    ├── Multi-modal vision
    ├── Image processing
    ├── JSON response parsing
    └── Error handling & retries
```

### Estrutura de Diretórios Backend

```
server/
├── src/
│   ├── routes/
│   │   ├── auth.ts               # POST /api/auth/login, register, logout
│   │   ├── user.ts               # GET/PUT /api/user/profile
│   │   ├── food.ts               # POST/GET/DELETE /api/food-entries
│   │   ├── workout.ts            # POST/GET/DELETE /api/workout-entries
│   │   └── bodyFat.ts            # POST /api/body-fat/analyze, /manual
│   │
│   ├── middleware/
│   │   ├── auth.ts               # Middleware de autenticação
│   │   ├── validation.ts         # Middleware de validação
│   │   ├── errorHandler.ts       # Global error handler
│   │   └── logging.ts            # Request logging
│   │
│   ├── services/
│   │   ├── AuthService.ts        # Lógica de auth
│   │   ├── UserService.ts        # Gerenciamento de usuário
│   │   ├── FoodService.ts        # Lógica de alimentos
│   │   ├── WorkoutService.ts     # Lógica de treinos
│   │   ├── BodyFatService.ts     # Análise de gordura corporal
│   │   └── GeminiService.ts      # Integração com IA
│   │
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema (todas as tabelas)
│   │   ├── queries/
│   │   │   ├── userQueries.ts
│   │   │   ├── foodQueries.ts
│   │   │   ├── workoutQueries.ts
│   │   │   └── bodyFatQueries.ts
│   │   └── client.ts             # Database connection
│   │
│   ├── types/
│   │   ├── index.ts              # Type definitions
│   │   ├── api.ts                # Request/Response types
│   │   ├── database.ts           # DB types
│   │   └── gemini.ts             # AI types
│   │
│   ├── validators/
│   │   ├── auth.ts               # Zod schemas para auth
│   │   ├── food.ts               # Zod schemas para comida
│   │   ├── workout.ts            # Zod schemas para treino
│   │   └── bodyFat.ts            # Zod schemas para gordura
│   │
│   ├── utils/
│   │   ├── calculations.ts       # TDEE, BMR, US Navy formula
│   │   ├── errorMessages.ts      # Mensagens de erro padrão
│   │   └── logger.ts             # Logging utility
│   │
│   ├── config/
│   │   ├── env.ts                # Variáveis de ambiente
│   │   ├── database.ts           # Config do DB
│   │   └── gemini.ts             # Config da IA
│   │
│   └── index.ts                  # Arquivo principal (entrada)
│
├── migrations/
│   ├── 001_init.sql              # Schema inicial
│   └── [migrations]
│
├── drizzle.config.ts             # Config do Drizzle
├── tsconfig.json                 # TypeScript config
├── .env.example                  # Variáveis de exemplo
└── package.json
```

---

## 📡 Fluxo de Requisição API

### Exemplo: POST /api/food-entries (Adicionar Alimento)

```
1. CLIENT (Frontend)
   └─ FoodForm submits → {date, foodId, quantity, portionSize}
   
2. NETWORK REQUEST
   └─ POST /api/food-entries
      Headers: Content-Type: application/json, Cookie: sessionId=...
      Body: {date, foodId, quantity}
   
3. BACKEND - Middleware
   ├─ CORS Check ✓
   ├─ Session Validation (auth middleware) ✓
   ├─ Body Parser (JSON) ✓
   └─ Logger (log request) ✓
   
4. BACKEND - Route Handler
   ├─ Extract user from session
   ├─ Validate with Zod schema
   └─ Call FoodService.addFoodEntry()
   
5. SERVICE LAYER
   ├─ Fetch food nutritional data from DB
   ├─ Calculate macros (protein, carbs, fat)
   ├─ Prepare food entry object
   └─ Call database query
   
6. DATABASE
   ├─ INSERT INTO food_entries (user_id, food_id, date, ...)
   ├─ Return inserted record with ID
   └─ Update user's daily calorie total (trigger/logic)
   
7. BACKEND - Response
   ├─ Status: 200 OK
   ├─ Body: {id, calories, protein, carbs, fat, date}
   └─ Set-Cookie: sessionId (refresh)
   
8. CLIENT - Handler
   ├─ TanStack Query invalidates /api/food-entries query
   ├─ Refetch dados para UI atualizar
   ├─ Show success toast notification
   └─ Update calorie totals em tempo real
```

---

## 🤖 Integração com Google Gemini API

### Fluxo de Análise de Gordura Corporal

```
1. USER CAPTURE (Frontend)
   ├─ Tiram até 3 fotos (frontal, lateral, costas)
   ├─ Compress com canvas (max 5MB cada)
   ├─ Preview antes de enviar
   └─ [opcional] Entrada manual: pescoço, cintura

2. FRONTEND UPLOAD
   ├─ POST /api/body-fat/analyze
   ├─ FormData com: photos[], neck_cm, waist_cm, height_cm
   └─ Content-Type: multipart/form-data

3. BACKEND - BodyFatService
   ├─ Validate files (type, size)
   ├─ Convert to base64
   ├─ Call GeminiService.analyzeBodyFat()
   │
   └─ GeminiService.analyzeBodyFat() {
       ├─ Build multi-part request
       ├─ Add vision prompt (5 stages):
       │  ├─ Stage 1: Somatotype classification
       │  ├─ Stage 2: Anatomical landmarks detection
       │  ├─ Stage 3: Angle-specific evaluation
       │  ├─ Stage 4: Anthropometric integration
       │  └─ Stage 5: Confidence calibration
       │
       ├─ Send to Gemini 2.5 Flash
       │  ```
       │  POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
       │  {
       │    "contents": [{
       │      "parts": [
       │        {type: "text", text: "Analyze body fat..."},
       │        {type: "image", inlineData: base64_photo1},
       │        {type: "image", inlineData: base64_photo2},
       │        {type: "image", inlineData: base64_photo3}
       │      ]
       │    }]
       │  }
       │  ```
       │
       ├─ Parse JSON response
       ├─ Extract: bodyFatPercentage, confidence, reasoning
       ├─ Validate against expected ranges (5-50%)
       └─ Return formatted response
   }

4. CALCULATION - Hybrid Calibration
   ├─ IF manual measurements provided:
   │  ├─ Calculate US Navy formula: BF = 495/(1.0324 - 0.19077*log10(abdomen) + 0.15456*log10(height)) - 450
   │  └─ Store as manualEstimate
   │
   ├─ Combine estimates:
   │  └─ combinedEstimate = (aiEstimate * 0.60) + (manualEstimate * 0.40)
   │
   └─ Store confidence score (lower of AI or manual)

5. DATABASE - Persist
   ├─ INSERT INTO body_fat_measurements
   │  (user_id, method, ai_percentage, manual_percentage, 
   │   combined_percentage, confidence, measurement_date)
   └─ Return full measurement record

6. FRONTEND - Display
   ├─ Update BodyFatTab with new measurement
   ├─ Show comparison: AI vs Manual vs Combined
   ├─ Display confidence score with color indicator
   ├─ Add to history chart
   └─ Show reasoning from Gemini
```

---

## 📊 Data Flow - Rastreamento de Calorias

```
┌─────────────────────────────────────────────────────────────┐
│  USER INTERACTION (Frontend)                                │
│  - Abre CaloriesTab                                         │
│  - Clica "Adicionar Alimento"                               │
│  - Busca "Frango" na food search                           │
│  - Seleciona porção: 200g                                   │
│  - Clica "Adicionar"                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND - React Component                                 │
│  - Validação local com Zod                                 │
│  - Chamada API: POST /api/food-entries                     │
│  - Loading state: mostra spinner                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  BACKEND - Express Route Handler                            │
│  - Auth middleware valida sessão                            │
│  - Valida request body                                      │
│  - Extrai user_id da sessão                                 │
│  - Chama FoodService.addFoodEntry()                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  SERVICE LAYER - FoodService                               │
│  - Busca nutrição do alimento no DB                         │
│    SELECT * FROM foods WHERE id = ?                        │
│  - Calcula para 200g:                                      │
│    calories = (food.calories_per_100g * 200) / 100        │
│    protein = (food.protein_per_100g * 200) / 100           │
│    carbs, fat = similar                                    │
│  - Cria entry object                                        │
│  - Chama database query                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  DATABASE LAYER - Drizzle ORM                              │
│  INSERT INTO food_entries (                                │
│    user_id = 123,                                           │
│    food_id = 456,                                           │
│    quantity_grams = 200,                                    │
│    calories = 264,                                          │
│    protein_g = 52,                                          │
│    carbs_g = 0,                                             │
│    fat_g = 5.6,                                             │
│    date = TODAY                                             │
│  )                                                           │
│  RETURNING *;                                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  RESPONSE - 200 OK                                          │
│  {                                                           │
│    "id": "uuid-123",                                        │
│    "calories": 264,                                         │
│    "protein": 52,                                           │
│    "carbs": 0,                                              │
│    "fat": 5.6,                                              │
│    "message": "Food entry added successfully"              │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND - Update UI                                       │
│  - TanStack Query invalidates cache                         │
│  - Refetch: GET /api/calories/daily-summary               │
│  - Re-render CaloriesTab com novos totais                   │
│  - Show toast: "Frango adicionado com sucesso!"             │
│  - Update progress bar (ex: 1800/2500 kcal)                 │
│  - Adicionar item à lista com opção de delete               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Segurança - Fluxo de Autenticação

```
┌─────────────────────────────────────────┐
│  REGISTRO (POST /api/auth/register)    │
├─────────────────────────────────────────┤
│  1. Client envia {email, password}     │
│  2. Backend valida formato email       │
│  3. Checa se email já existe (unique)  │
│  4. Hash password com bcrypt (10 salt) │
│  5. INSERT INTO users (email, hash)    │
│  6. Retorna success + redirect login   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  LOGIN (POST /api/auth/login)          │
├─────────────────────────────────────────┤
│  1. Client envia {email, password}     │
│  2. Backend SELECT user by email       │
│  3. IF not exists → 401 Unauthorized   │
│  4. Compara hash com bcrypt.compare()  │
│  5. IF não match → 401 Unauthorized    │
│  6. CREATE session (express-session)   │
│    {                                    │
│      session: {                         │
│        user_id: uuid,                   │
│        created_at: timestamp,           │
│        expires_at: +24h                 │
│      }                                  │
│    }                                    │
│  7. Session salva em DB (connect-pg)  │
│  8. Retorna Set-Cookie com sessionId   │
│    Cookie: sid=abc123;                 │
│      HttpOnly=true (js não acessa)     │
│      Secure=true (só HTTPS)            │
│      SameSite=Strict (anti-CSRF)       │
│  9. Redirect para dashboard            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  REQUESTS SUBSEQUENTES (Protected)     │
├─────────────────────────────────────────┤
│  1. Client envia request com Cookie    │
│  2. Middleware busca session no DB     │
│  3. IF session expirada → 401          │
│  4. IF válida → req.session.user_id ok │
│  5. Execute route handler              │
│  6. All responses refresh session TTL  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  LOGOUT (POST /api/auth/logout)        │
├─────────────────────────────────────────┤
│  1. Backend DELETE session from DB     │
│  2. Clear Cookie:                      │
│    Set-Cookie: sid=; Max-Age=0         │
│  3. Redirect para login                │
└─────────────────────────────────────────┘
```

---

## 📦 Dependências Principais

### Frontend (`package.json`)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.6.0",
    "@hookform/resolvers": "^3.10.0",
    "react-hook-form": "^7.52.0",
    "zod": "^3.23.0",
    "@tanstack/react-query": "^5.60.0",
    "wouter": "^3.1.0",
    "@radix-ui/*": "^1.x.x",
    "tailwindcss": "^3.4.0",
    "next-themes": "^0.3.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.408.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "vite": "^5.1.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### Backend (`package.json`)

```json
{
  "dependencies": {
    "express": "^4.21.0",
    "typescript": "^5.6.0",
    "dotenv": "^16.4.0",
    "zod": "^3.23.0",
    "bcryptjs": "^2.4.0",
    "express-session": "^1.18.0",
    "connect-pg-simple": "^9.0.0",
    "pg": "^8.11.0",
    "drizzle-orm": "^0.39.0",
    "@google/generative-ai": "^0.24.0",
    "date-fns": "^3.6.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "@types/express-session": "^1.17.0",
    "tsx": "^4.7.0"
  }
}
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Deploy FitTracker

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: TypeScript check
        run: npm run check
      
      - name: Run tests
        run: npm run test
      
      - name: Build frontend
        run: npm run build --workspace=client
      
      - name: Build backend
        run: npm run build --workspace=server

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel (Frontend)
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: npm run deploy:frontend
      
      - name: Deploy to Railway (Backend)
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: npm run deploy:backend
```

---

## 🎯 Padrões de Arquitetura

### MVC (Model-View-Controller)

```
Models:
- User
- Food Entry  
- Workout Entry
- Body Fat Measurement

Views:
- React Components (CaloriesTab, WorkoutsTab, etc)

Controllers:
- Route handlers em Express
- Services com lógica de negócio
```

### Repository Pattern

```
Backend:
├─ repositories/
│  ├─ UserRepository (getUserById, createUser)
│  ├─ FoodRepository (addFoodEntry, getFoodEntries)
│  ├─ WorkoutRepository
│  └─ BodyFatRepository
│
└─ services/ (usar repositories)
   ├─ UserService
   ├─ FoodService
   └─ etc
```

### Custom Hooks Pattern

```
Frontend:
├─ hooks/
│  ├─ useUser() - GET /api/user
│  ├─ useFood() - CRUD /api/food-entries
│  ├─ useWorkout() - CRUD /api/workout-entries
│  └─ useBodyFat() - POST /api/body-fat/analyze
│
└─ Components usam hooks direto
```

---

## 📈 Performance Considerations

### Frontend Optimization

- **Code Splitting**: Lazy load routes com Wouter
- **Bundle Size**: Tree-shake unused dependencies
- **Image Compression**: WebP + responsive images
- **CSS**: Tailwind purge unused styles
- **Caching**: TanStack Query + localStorage
- **Lighthouse Score**: Target >80

### Backend Optimization

- **Database Indexing**: Índices em user_id, date fields
- **Connection Pooling**: PostgreSQL connection management
- **API Caching**: Redis para food database lookups
- **Pagination**: Limitar resultados de queries grandes
- **Compression**: Gzip responses
- **Rate Limiting**: Proteger endpoints sensíveis

---

## 🔍 Monitoramento e Logging

### Frontend Monitoring

```typescript
// Sentry para error tracking
Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})

// Custom logger
logger.info("User added food entry", {userId, foodId, calories})
logger.error("Gemini API failed", {error, photos})
```

### Backend Monitoring

```typescript
// Winston logger
logger.info("POST /api/food-entries", {userId, statusCode: 200})
logger.error("Database connection failed", {error})

// Prometheus metrics
foodEntriesCounter.inc()
apiResponseTime.observe(duration)

// Sentry for exceptions
Sentry.captureException(error)
```

---

## 📚 Escalabilidade Futura

### Horizontal Scaling

```
Load Balancer (nginx/HAProxy)
      ↓
┌─────────────────────────┐
├─ Backend Instance 1    │
├─ Backend Instance 2    │
├─ Backend Instance 3    │
└─────────────────────────┘
      ↓
PostgreSQL Primary (write)
      ↓
PostgreSQL Replicas (read)

Cache Layer (Redis)
  - Food database cache
  - Session store
```

### Microservices (Future)

```
API Gateway
  ├─ Auth Service
  ├─ Food Service
  ├─ Workout Service
  ├─ Body Fat Service (com Gemini)
  └─ User Service

Message Queue (RabbitMQ/Kafka)
  - Async Gemini analysis jobs
  - Email notifications
  - Data sync
```

---

**Última Atualização**: Novembro 12, 2025
