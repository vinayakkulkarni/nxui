# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.

---

## 1. Reactivity Fundamentals (reactivity)

**Impact:** CRITICAL  
**Description:** Vue's reactivity system is the foundation of all state management. Misusing it causes bugs, memory leaks, and unnecessary re-renders. Getting reactivity right yields the largest performance gains.

## 2. Component Performance (component)

**Impact:** CRITICAL  
**Description:** Components that re-render unnecessarily or load heavy resources synchronously degrade user experience significantly.

## 3. Computed & Watchers (computed)

**Impact:** HIGH  
**Description:** Proper use of computed properties and watchers reduces redundant calculations and side effects.

## 4. Template Optimization (template)

**Impact:** MEDIUM-HIGH  
**Description:** Template-level optimizations reduce virtual DOM diffing work and improve rendering performance.

## 5. Composition API Patterns (composable)

**Impact:** MEDIUM  
**Description:** Well-structured composables improve code reusability, testability, and maintainability.

## 6. State Management (state)

**Impact:** MEDIUM  
**Description:** Efficient state management with Pinia or other solutions prevents unnecessary component updates.

## 7. Async & Data Fetching (async)

**Impact:** LOW-MEDIUM  
**Description:** Proper async patterns prevent memory leaks, race conditions, and improve perceived performance.

## 8. Advanced Patterns (advanced)

**Impact:** LOW  
**Description:** Advanced patterns for specific use cases that require careful implementation.
