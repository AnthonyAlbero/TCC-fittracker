# FitTracker - Diet & Training App

## Overview

FitTracker is a comprehensive health and fitness application designed to help users track their diet, workouts, and body composition. The app provides calorie tracking, workout logging, body fat estimation using both manual measurements (US Navy formula) and AI-powered photo analysis, and personalized profile management with BMR/TDEE calculations. Built as a mobile-first progressive web application with a clean, utility-focused interface inspired by MyFitnessPal.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system

**Design System:**
- Custom color palette with health-focused primary colors (vibrant blue-green at HSL 37 85% 53%)
- Full dark mode support with automatic theme detection and manual toggle
- Typography: Inter font family for excellent data readability
- Consistent spacing units following Tailwind's scale
- Mobile-first responsive design with bottom tab navigation

**Component Architecture:**
- Tab-based navigation system with 4 main sections: Calories, Profile, Workouts, Body Fat
- Reusable MetricCard components for displaying health metrics
- Form-heavy interfaces using React Hook Form with Zod validation
- Modular component structure with separate example components for development
- **Unified Body Fat Analysis**: Single card interface combining manual measurements + optional AI photo analysis

### Backend Architecture

**Server Framework:**
- Express.js server with TypeScript
- Vite middleware integration for development hot reloading
- Custom logging middleware for API request tracking
- Session-based architecture prepared (connect-pg-simple installed)

**Storage Layer:**
- PostgreSQL database for production data persistence
- Drizzle ORM v0.39.1 for type-safe database operations
- Database tables: user_profiles, food_entries, workout_entries, foods, exercises
- RESTful API endpoints for all CRUD operations with TanStack Query integration

**API Design:**
- RESTful API structure with `/api` prefix convention
- Type-safe request/response handling using shared TypeScript types
- Error handling middleware with standardized error responses
- CORS and credential support configured

### External Dependencies

**Database & ORM:**
- Drizzle ORM v0.39.1 for type-safe database queries
- Drizzle-Zod for schema validation integration
- Configured for PostgreSQL via @neondatabase/serverless (though not actively used yet)
- Migration system set up with drizzle-kit

**UI & Styling:**
- Radix UI component primitives (dialogs, popovers, dropdowns, etc.)
- Tailwind CSS with PostCSS for processing
- Class Variance Authority for component variant management
- Lucide React for icon system

**Forms & Validation:**
- React Hook Form for form state management
- Zod for runtime type validation and schema definition
- @hookform/resolvers for Zod integration

**Development Tools:**
- Replit-specific plugins for development experience (@replit/vite-plugin-runtime-error-modal, cartographer, dev-banner)
- TSX for TypeScript execution in development
- esbuild for production server bundling

**Date & Time:**
- date-fns v3.6.0 for date manipulation and formatting

**AI Integration:**
- **Google Gemini 2.5 Flash** for AI-powered body fat estimation from photos
  - SDK: @google/generative-ai
  - Model: gemini-2.5-flash (multimodal vision capabilities)
  - Endpoint: POST /api/analyze-body-fat
  - **Multi-Angle Analysis**: Processes up to 3 photos (frontal, lateral, costas) simultaneously
  - **Scientific Prompt Engineering**: 5-stage progressive analysis methodology
    1. Body type classification (ectomorph/mesomorph/endomorph)
    2. Anatomical landmarks analysis (abdominal, upper limbs, thoracic, lower limbs)
    3. Angle-specific evaluation (frontal symmetry, lateral profile, posterior definition)
    4. Anthropometric data integration (BMI, age, gender considerations)
    5. Scientific range calibration with confidence scoring
  - **Hybrid Calibration**: Combines AI visual analysis (60%) with manual measurements (40%)
    - Weighted combination: `combined = AI * 0.6 + manual * 0.4`
    - Manual measurements use US Navy formula (neck, waist) + Deurenberg formula (BMI-based)
  - Robust JSON extraction with multi-candidate parsing and balanced brace tracking
  - Validates bodyFatPercentage (0-100), confidence (0.7-0.95), reasoning
  - Returns both AI-only estimate and calibrated combined estimate
  - GEMINI_API_KEY configured via Replit Secrets

**Planned Integrations:**
- Food database API for calorie lookup (search functionality scaffolded in CaloriesTab)
- Workout exercise database (exercise type selection prepared in WorkoutsTab)

**Authentication:**
- Session storage configured with connect-pg-simple
- User schema includes username/password fields (hash implementation pending)
- Cookie-based session management ready for implementation

### Calorie Goal System

**Objetivos de Usuário:**
- Sistema completo de objetivos com ajustes calóricos automáticos baseados no TDEE
- 5 opções de objetivo disponíveis:
  1. **Manutenção** (maintain): 0 kcal - Manter peso atual
  2. **Ganhos Secos** (lean_bulk): +250 kcal - Ganhar massa muscular aos poucos
  3. **Ganhos Agressivos** (aggressive_bulk): +500 kcal - Ganhar massa muscular rápido
  4. **Emagrecer** (cut): -300 kcal - Perder gordura com calma
  5. **Emagrecer Agressivo** (aggressive_cut): -500 kcal - Perder gordura rápido

**Cálculos:**
- TMB (Taxa Metabólica Basal): Equação Mifflin-St Jeor
- TDEE (Gasto Energético Diário Total): TMB × multiplicador de atividade
- Meta Calórica Diária: TDEE + ajuste do objetivo selecionado
- Ajustes baseados em evidências científicas para mudança de composição corporal