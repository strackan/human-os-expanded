# Structured ID System Guide

## Overview

This document outlines the structured ID naming convention implemented across the Renubu application to ensure consistent, predictable, and easily identifiable elements for testing, automation, and screen scraping purposes.

## Naming Convention

The ID structure follows this pattern:
```
{page-type}-{page-name}-{section}-{component}-{element}
```

### Breakdown:

1. **Page Type**: Identifies the type of page (e.g., `page`, `layout`, `component`)
2. **Page Name**: The specific page or component name (e.g., `dashboard`, `customers`, `renewals`)
3. **Section**: The main section of the page (e.g., `header`, `main`, `sidebar`, `content`)
4. **Component**: The specific component within the section (e.g., `title`, `grid`, `card`, `button`)
5. **Element**: The specific element or instance (e.g., `1`, `2`, `customer-name`, `status`)

## Examples

### Page IDs
- `page-dashboard-container` - Main dashboard page container
- `page-renewals-title` - Renewals page title
- `page-events-header` - Events page header section
- `page-reports-grid` - Reports page grid container

### Customer Page IDs
- `page-customers-initech-container` - Initech customer page container
- `page-customers-initech-customer-name` - Customer name display
- `page-customers-initech-context-panel` - Context panel component
- `page-customers-initech-chat-container` - Chat container

### Layout IDs
- `layout-app-container` - Main app layout container
- `layout-app-sidebar` - Sidebar component
- `layout-app-header` - Header component
- `layout-app-main` - Main content area

### Component IDs
- `page-customers-initech-stat-current-arr` - Current ARR stat
- `page-customers-initech-context-insight-0` - First AI insight
- `page-renewals-card-123-header` - Header of renewal card with ID 123
- `page-reports-card-segment-price` - Segment price report card

## Implementation by Page Type

### 1. Dashboard Page (`/dashboard`)
```html
<div id="page-dashboard-container">
  <div id="page-dashboard-main-content">
    <div id="page-dashboard-welcome-message">
      <h2 id="page-dashboard-title">🎉 Authentication Working!</h2>
      <p id="page-dashboard-description">You've successfully accessed the protected dashboard.</p>
      <p id="page-dashboard-subtitle">This page is protected by the layout-based auth guard.</p>
    </div>
  </div>
</div>
```

### 2. Renewals Page (`/renewals`)
```html
<div id="page-renewals-container">
  <div id="page-renewals-content">
    <div id="page-renewals-header">
      <h1 id="page-renewals-title">Renewals Dashboard</h1>
      <p id="page-renewals-subtitle">Monitor and manage your renewal opportunities</p>
    </div>
    <div id="page-renewals-main">
      <div id="page-renewals-section-header">
        <h2 id="page-renewals-section-title">Active Renewals</h2>
        <button id="page-renewals-refresh-button">Refresh</button>
      </div>
      <div id="page-renewals-grid">
        <div id="page-renewals-card-{id}">
          <div id="page-renewals-card-{id}-header">
            <div id="page-renewals-card-{id}-info">
              <h3 id="page-renewals-card-{id}-title">{product_name}</h3>
              <p id="page-renewals-card-{id}-status">Status: {status}</p>
            </div>
            <span id="page-renewals-card-{id}-value">${value}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 3. Events Page (`/events`)
```html
<div id="page-events-container">
  <div id="page-events-content">
    <div id="page-events-header">
      <h1 id="page-events-title">Events Dashboard</h1>
      <p id="page-events-subtitle">Monitor and respond to important renewal events</p>
    </div>
    <div id="page-events-dashboard">
      <!-- EventsDashboard component -->
    </div>
  </div>
</div>
```

### 4. Reports Page (`/reports`)
```html
<main id="page-reports-container">
  <div id="page-reports-header">
    <h1 id="page-reports-title">Renewals Reports & Insights</h1>
    <p id="page-reports-subtitle">Actionable, profit-centric analytics...</p>
  </div>
  <div id="page-reports-grid">
    <div id="page-reports-card-segment-price">
      <!-- Segment Price Increase Chart -->
    </div>
    <div id="page-reports-card-industry-value">
      <!-- Industry Value Chart -->
    </div>
    <div id="page-reports-card-contract-anomalies">
      <!-- Contract Anomalies Chart -->
    </div>
    <!-- Additional report cards... -->
  </div>
</main>
```

### 5. Customer Pages (`/customers/[customer]`)
```html
<div id="page-customers-initech-container">
  <div id="page-customers-initech-content">
    <div id="page-customers-initech-header-card">
      <div id="page-customers-initech-header-content">
        <div id="page-customers-initech-header-info">
          <h2 id="page-customers-initech-customer-name">Initech</h2>
          <div id="page-customers-initech-success-likelihood">
            <span id="page-customers-initech-success-badge">Moderate</span>
          </div>
        </div>
      </div>
      <div id="page-customers-initech-navigation">
        <button id="page-customers-initech-next-customer">Next: Umbrella Corp.</button>
      </div>
    </div>
    
    <!-- Main Container -->
    <div id="page-customers-initech-main-container-chat">
      <div id="page-customers-initech-left-panel-chat">
        <div id="page-customers-initech-left-panel-content">
          <div id="page-customers-initech-progress-stepper">
            <button id="page-customers-initech-progress-toggle">Toggle</button>
            <!-- ProgressStepper component -->
          </div>
          <div id="page-customers-initech-context-panel-chat">
            <!-- ContextPanel component -->
          </div>
        </div>
      </div>
      <div id="page-customers-initech-divider-chat">
        <!-- Draggable divider -->
      </div>
      <div id="page-customers-initech-chat-panel">
        <div id="page-customers-initech-chat-container">
          <!-- ConversationalChat component -->
        </div>
      </div>
    </div>
  </div>
</div>
```

### 6. Layout Components
```html
<div id="layout-app-container">
  <aside id="layout-app-sidebar">
    <div id="layout-app-sidebar-content">
      <div id="layout-app-sidebar-header">
        <div id="layout-app-sidebar-logo">
          <div id="layout-app-sidebar-logo-icon">
            <span id="layout-app-sidebar-logo-text">R</span>
          </div>
          <span id="layout-app-sidebar-logo-name">Renubu</span>
        </div>
        <button id="layout-app-sidebar-toggle">Close</button>
      </div>
      <nav id="layout-app-sidebar-nav">
        <!-- Sidebar navigation -->
      </nav>
      <div id="layout-app-sidebar-profile">
        <div id="layout-app-sidebar-profile-content">
          <div id="layout-app-sidebar-profile-avatar">
            <!-- User avatar -->
          </div>
          <div id="layout-app-sidebar-profile-info">
            <p id="layout-app-sidebar-profile-name">Justin</p>
            <p id="layout-app-sidebar-profile-role">Account Manager</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
  
  <div id="layout-app-main-wrapper">
    <main id="layout-app-main">
      <header id="layout-app-header">
        <div id="layout-app-header-content">
          <div id="layout-app-header-left">
            <button id="layout-app-mobile-menu-button">Menu</button>
            <button id="layout-app-sidebar-toggle-desktop">Toggle</button>
            <h1 id="layout-app-header-title">Welcome back, Justin</h1>
            <div id="layout-app-header-weather">
              <span id="layout-app-header-temperature">72°F</span>
              <span id="layout-app-header-weather-desc">Sunny</span>
            </div>
          </div>
          <div id="layout-app-header-right">
            <form id="layout-app-header-search">
              <input id="layout-app-header-search-input" type="search" />
            </form>
            <button id="layout-app-header-settings">Settings</button>
            <button id="layout-app-header-profile">Profile</button>
          </div>
        </div>
      </header>
      <div id="layout-app-page-content">
        <!-- Page content -->
      </div>
    </main>
  </div>
</div>
```

## Benefits

1. **Consistency**: All elements follow the same naming pattern
2. **Predictability**: Easy to guess element IDs based on page structure
3. **Maintainability**: Clear hierarchy makes it easy to understand relationships
4. **Testing**: Simplified test selectors and automation
5. **Screen Scraping**: Easy to identify and extract specific data
6. **Debugging**: Clear element identification in browser dev tools

## Best Practices

1. **Always use kebab-case** for ID names (e.g., `customer-name` not `customerName`)
2. **Be descriptive** but concise
3. **Include the page context** to avoid conflicts
4. **Use consistent section names** across similar pages
5. **Include dynamic data** in IDs when appropriate (e.g., `card-{id}`)
6. **Avoid generic names** that could conflict (e.g., use `page-dashboard-title` not just `title`)

## Usage Examples

### Testing
```javascript
// Easy to write test selectors
cy.get('#page-renewals-title').should('contain', 'Renewals Dashboard');
cy.get('#page-customers-initech-customer-name').should('contain', 'Initech');
cy.get('#layout-app-sidebar-toggle').click();
```

### Screen Scraping
```javascript
// Easy to extract specific data
const customerName = document.querySelector('#page-customers-initech-customer-name').textContent;
const renewalCards = document.querySelectorAll('[id^="page-renewals-card-"]');
const stats = document.querySelectorAll('[id^="page-customers-initech-stat-"]');
```

### Automation
```javascript
// Easy to automate interactions
const nextCustomerButton = document.querySelector('#page-customers-initech-next-customer');
const chatInput = document.querySelector('#page-customers-initech-chat-input');
const refreshButton = document.querySelector('#page-renewals-refresh-button');
```

## Future Considerations

1. **Component Library**: Consider creating a shared component library with consistent ID patterns
2. **Automated Testing**: Use these IDs for comprehensive test coverage
3. **Analytics**: Track user interactions using these predictable selectors
4. **Accessibility**: Ensure all interactive elements have proper ARIA labels and roles
5. **Performance**: Consider using data attributes for dynamic content instead of complex ID generation

## Maintenance

- Review and update this guide when adding new pages or components
- Ensure all new elements follow the established naming convention
- Consider automated linting rules to enforce the ID structure
- Document any exceptions or special cases 