# Documentation Style Guide

## Overview
This guide establishes consistent documentation standards for the Misinfo Dashboard project. All code should follow these guidelines to ensure maintainability and clarity.

## JSDoc Standards

### Function Documentation Template
```javascript
/**
 * Brief description of what the function does.
 * 
 * More detailed description if needed, explaining the purpose,
 * behavior, and any important implementation details.
 * 
 * @param {string} paramName - Description of the parameter
 * @param {Object} options - Description of options object
 * @param {string} options.key - Description of specific option
 * @returns {Promise<Object>} Description of return value
 * @throws {Error} Description of when this error is thrown
 * @example
 * // Example usage
 * const result = await functionName('param', { key: 'value' });
 */
```

### React Component Documentation Template
```javascript
/**
 * ComponentName - Brief description of the component's purpose.
 * 
 * Detailed description of what this component does, when to use it,
 * and any important implementation details.
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Description of title prop
 * @param {Function} props.onClick - Description of click handler
 * @param {boolean} [props.isVisible=true] - Optional prop with default value
 * @returns {JSX.Element} Rendered component
 * @example
 * <ComponentName 
 *   title="My Title" 
 *   onClick={handleClick}
 *   isVisible={false}
 * />
 */
```

### Class Documentation Template
```javascript
/**
 * ClassName - Brief description of the class purpose.
 * 
 * Detailed description of the class, its responsibilities,
 * and how it fits into the overall architecture.
 * 
 * @class
 * @example
 * const instance = new ClassName(options);
 */
class ClassName {
  /**
   * Constructor description.
   * 
   * @param {Object} options - Configuration options
   * @param {string} options.name - Description of name option
   */
  constructor(options) {
    // Implementation
  }
}
```

## Comment Standards

### Inline Comments
- Use `//` for brief, single-line explanations
- Use `/* */` for multi-line explanations
- Keep comments concise and meaningful
- Explain "why" not "what" when possible

### Good Examples
```javascript
// Check if user has admin privileges before allowing access
if (user.role === 'admin') {
  // Proceed with admin-only operations
}

/* 
 * This complex algorithm handles edge cases where
 * the user might have multiple overlapping permissions.
 * We need to check the most restrictive permission first.
 */
```

### Bad Examples
```javascript
// Set user to admin
user.role = 'admin'; // Too obvious

// Loop through users
for (let user of users) { // Redundant comment
  // Do something
}
```

## File Header Documentation

### JavaScript/JSX Files
```javascript
/**
 * @fileoverview Brief description of the file's purpose and contents.
 * 
 * This file contains [detailed description of what the file does,
 * its main exports, and how it fits into the overall application].
 * 
 * @author [Author Name]
 * @version [Version Number]
 * @since [Date or Version]
 */
```

### Component Files
```javascript
/**
 * @fileoverview [ComponentName] - Brief description of the component.
 * 
 * This component handles [specific functionality] and is used in
 * [contexts where it's used]. It integrates with [other systems/components].
 * 
 * @module components/[ComponentName]
 * @requires [dependencies]
 */
```

## Documentation Categories

### 1. Core Functions
- Authentication functions
- Database operations
- API endpoints
- Utility functions

### 2. React Components
- All component files
- Props documentation
- State management
- Event handlers

### 3. Firebase Functions
- Cloud functions
- Database triggers
- Authentication triggers
- Storage operations

### 4. Configuration Files
- Environment setup
- Build configuration
- Deployment settings

## Quality Checklist

Before committing code, ensure:

- [ ] All functions have JSDoc comments
- [ ] All components have prop documentation
- [ ] Complex logic has inline comments
- [ ] File headers are present
- [ ] Examples are provided for complex functions
- [ ] Error handling is documented
- [ ] Return types are specified
- [ ] Parameter types are documented

## Tools and Automation

### ESLint Configuration
Add JSDoc rules to `.eslintrc.json`:
```json
{
  "plugins": ["jsdoc"],
  "extends": ["plugin:jsdoc/recommended"],
  "rules": {
    "jsdoc/require-jsdoc": ["error", {
      "publicOnly": true,
      "require": {
        "FunctionDeclaration": true,
        "MethodDefinition": true,
        "ClassDeclaration": true
      }
    }]
  }
}
```

### Documentation Generation
Consider using tools like:
- JSDoc for API documentation
- Storybook for component documentation
- TypeDoc for TypeScript projects

## Examples from Our Codebase

### Good Example (FirebaseHelper.jsx)
```javascript
/**
 * Fetches a document from a collection by its ID.
 *
 * @param {string} collectionName - The name of the Firestore collection.
 * @param {string} documentId - The ID of the document to fetch.
 * @returns {Promise<Object>} A promise that resolves to the document data or null if not found.
 * @throws {Error} Throws an error if the fetch operation fails.
 */
```

### Areas for Improvement
- Add more examples in JSDoc comments
- Include error handling documentation
- Add usage examples for complex components
- Document state management patterns

## Implementation Plan

1. **Phase 1**: Document core utilities and helpers
2. **Phase 2**: Document React components
3. **Phase 3**: Document Firebase functions
4. **Phase 4**: Document configuration files
5. **Phase 5**: Set up automated documentation generation

## Maintenance

- Review and update documentation with each major change
- Keep examples current with code changes
- Regular audits of documentation quality
- Team training on documentation standards 