# Diet & Training App Design Guidelines

## Design Approach
**Design System Approach** - This utility-focused health application prioritizes functionality, data clarity, and user efficiency. Drawing inspiration from health and fitness leaders like MyFitnessPal, Fitbit, and Apple Health, combined with Material Design principles for consistent, accessible interfaces.

## Core Design Elements

### Color Palette
**Light Mode:**
- Primary: 37 85% 53% (vibrant blue-green for health/vitality)
- Background: 0 0% 98% (clean white-gray)
- Surface: 0 0% 100% (pure white cards)
- Text: 220 9% 20% (dark blue-gray)
- Success: 142 76% 36% (health green)
- Error: 0 84% 60% (clear red for warnings)

**Dark Mode:**
- Primary: 37 85% 63% (lighter health green)
- Background: 220 13% 8% (deep dark blue)
- Surface: 220 13% 12% (elevated dark surface)
- Text: 0 0% 95% (near white)
- Success: 142 76% 46% (brighter success green)
- Error: 0 84% 70% (lighter error red)

### Typography
- **Primary Font**: Inter (Google Fonts) - excellent readability for data
- **Headers**: Inter 600-700 weight
- **Body**: Inter 400-500 weight
- **Data/Numbers**: Inter 500-600 weight (emphasize numerical data)
- **Small Text**: Inter 400 weight

### Layout System
**Spacing Units**: Consistent use of Tailwind units 1, 2, 3, 4, 6, 8, 12
- Form spacing: p-4, gap-3
- Card padding: p-6
- Section margins: mb-8
- Icon spacing: mr-2, ml-2

### Component Library

**Navigation:**
- Bottom tab bar for mobile (4 tabs: Calories, Profile, Workouts, Body Fat)
- Clean tab indicators with icons + labels
- Active tab: primary color fill
- Inactive tabs: muted gray

**Forms & Inputs:**
- Rounded input fields (rounded-lg)
- Clear labels with proper spacing
- Number inputs for measurements with step controls
- Dropdown selectors for activity levels
- Search bars for food lookup

**Data Display:**
- Clean metric cards showing daily calories, BMR, etc.
- Progress bars for calorie goals
- Simple data tables for workout history
- Calculation result highlights in primary color

**Interactive Elements:**
- Primary buttons: filled primary color
- Secondary buttons: outlined
- Floating action button for quick food/workout entry
- Swipe-to-delete on food/workout entries

**Overlays:**
- Modal dialogs for detailed food entry
- Camera interface overlay for body fat photo analysis
- Loading states for AI processing

### Visual Hierarchy
- **Level 1**: Primary metrics and daily summaries (largest text, primary colors)
- **Level 2**: Section headers and secondary data (medium text, dark gray)
- **Level 3**: Input labels and helper text (smaller text, muted gray)
- **Data Emphasis**: Numerical values slightly larger and heavier weight than surrounding text

### Health-Specific Patterns
- **Progress Indicators**: Circular progress for daily calorie goals
- **Measurement Input**: Side-by-side input fields for neck/waist measurements
- **Photo Capture**: Clean camera viewfinder with measurement guides overlay
- **Results Display**: Highlighted cards for calculated BMR, body fat percentage
- **History Views**: Timeline-style display for tracking progress over time

### Accessibility
- High contrast ratios in both light and dark modes
- Large touch targets (minimum 44px)
- Clear visual feedback for all interactions
- Screen reader friendly labels for all health metrics
- Consistent dark mode across all form inputs

This design prioritizes data clarity, ease of input, and professional health application aesthetics while maintaining the clean, functional approach users expect from serious fitness tracking tools.