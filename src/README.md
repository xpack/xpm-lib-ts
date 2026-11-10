# Source Code Documentation

This folder contains the TypeScript source files that provide the core
functionality of the xpm-lib library.

## Overview

**Total Lines:** ~9,826 lines across 15 TypeScript files  
**Build Output:** Compiled by `tsc` to ES6 modules in the `dist/` folder  
**Module System:** ES modules with `.js` extensions in imports

## Architecture

The library implements a sophisticated **two-phase lazy evaluation pattern**
for optimal performance:

### Phase 1: Collection Initialisation

When `Actions` or `BuildConfigurations` collections are initialised, only
template names are expanded using matrix parameters. Template content
remains unevaluated.

```typescript
const buildConfigurations = new BuildConfigurations({ ... })
await buildConfigurations.initialise()  // Expands names only
```

### Phase 2: Item Retrieval & Initialisation

Individual items are fully evaluated only when accessed and explicitly
initialised:

```typescript
const config = buildConfigurations.get('release-x64')
await config.initialise() // Now processes content, inheritance, etc.
```

**Benefits:**

- ⚡ Performance: Only used configurations incur processing cost
- 💾 Memory: Deferred object creation until needed
- 🔄 Flexibility: Template expansion without content evaluation

## Folder Structure

```
src/
├── classes/              # Core domain classes
│   ├── actions.ts       # Action collections and individual actions
│   ├── build-configurations.ts  # Build configuration management
│   ├── combinations-generator.ts  # Cartesian product for matrices
│   ├── data-model.ts    # Package data model and variable hierarchy
│   ├── errors.ts        # Custom error type hierarchy
│   ├── init-template-base.ts  # Base class for init templates
│   ├── liquid-drop.ts   # Liquid template variable drops
│   ├── liquid-engine.ts # Custom Liquid engine with filters
│   ├── package.ts       # Package.json management
│   ├── platform-detector.ts  # OS and architecture detection
│   ├── policies.ts      # Version compatibility policies
│   └── template-expander.ts  # Generic template expansion engine
│
├── data/                # Static data and constants
│   └── substitutions-variables.ts  # Base substitution variables
│
├── functions/           # Pure utility functions
│   ├── chmod-recursively.ts  # File permission utilities
│   ├── filter-paths.ts  # Path sanitisation filters
│   ├── is-something.ts  # Type guard utilities
│   ├── matrix-expander.ts  # Matrix parameter processing
│   ├── perform-substitutions.ts  # Liquid template substitution
│   └── utils.ts         # General utility functions
│
├── types/               # TypeScript type definitions
│   ├── json.ts          # JSON structure type definitions
│   ├── xpm-init-template.ts  # Init template types
│   └── xpm.ts           # Core xpm types
│
└── index.ts             # Public API exports
```

## Key Components

### Classes

#### Core Domain Classes

- **`BuildConfigurations`** / **`BuildConfiguration`** - Manages build
  configurations with inheritance, template expansion, and property merging
- **`Actions`** / **`Action`** - Manages executable actions with Liquid
  template support
- **`DataModel`** - Top-level coordinator for package processing and
  variable hierarchy
- **`Package`** - Package.json loading, validation, and capability detection

#### Template Processing

- **`TemplateExpander`** - Generic template expansion with matrix parameters
- **`CombinationsGenerator`** - Cartesian product computation for matrix
  expansion
- **`LiquidEngine`** - Custom Liquid engine with xpm-specific filters
- **`LiquidPropertiesDrop`** / **`LiquidMatrixDrop`** - Liquid variable
  access with strict validation

#### Utilities

- **`PlatformDetector`** - Cross-platform OS and architecture detection
- **`Policies`** - Version compatibility and feature flags
- **`InitTemplateBase`** - Abstract base for project initialisation templates

### Functions

Pure utility functions organised by purpose:

- **Type Guards:** `isString()`, `isNumber()`, `isJsonObject()`, etc.
- **Template Detection:** `hasLiquidSyntax()`, `performSubstitutions()`
- **Path Operations:** `filterPath()`, `chmodRecursively()`
- **Matrix Processing:** `processMatrixForExpansion()`
- **Error Handling:** `getErrorMessage()`

### Types

Comprehensive TypeScript definitions:

- **`json.ts`** - All JSON structure types for package.json and xpack section
- **`xpm.ts`** - Core xpm types (Context, etc.)
- **`xpm-init-template.ts`** - Init template property definitions

## Error Hierarchy

Well-defined error types for semantic error handling:

```typescript
// Parsing errors
JsonSyntaxError // Malformed JSON

// Configuration errors
ConfigurationError // Invalid configuration content
TemplateError // Template evaluation failures

// User input errors
InputError // Invalid command-line arguments or user input
PrerequisitesError // Missing dependencies or incompatible versions

// Output errors
OutputError // File generation or output failures
```

## Design Patterns

### 1. Lazy Initialisation

Classes use two-step initialisation (constructor + `initialise()` method)
to defer expensive operations:

```typescript
class BuildConfigurations {
  protected _isInitialised = false

  async initialise(): Promise<boolean> {
    if (this._isInitialised) return true
    // Perform expensive operations
    this._isInitialised = true
    return true
  }
}
```

### 2. Template Inheritance

Build configurations support multiple inheritance with circular reference
detection:

```typescript
{
  "release-x64": {
    "inherits": ["common", "release-base"],
    "properties": { /* overrides */ }
  }
}
```

### 3. Matrix Expansion

Templates generate multiple concrete instances from matrix parameters:

```typescript
{
  "release-{{ matrix.arch }}": {
    "matrix": {
      "arch": ["x64", "arm64", "ia32"]
    },
    "template": { /* configuration */ }
  }
}
// Generates: release-x64, release-arm64, release-ia32
```

### 4. Dependency Injection

All classes accept dependencies via constructor parameters:

```typescript
constructor({
  engine,
  substitutionsVariables,
  log,
}: BuildConfigurationsConstructorParameters) {
  // No hard dependencies on singletons
}
```

## Variable Hierarchy

Substitution variables follow a clear hierarchy:

```
liquidSubstitutionsVariablesBase (sealed)
  ├── env: { ... }                    # Environment variables
  ├── os: { platform, arch, ... }     # Platform detection
  └── path: { sep, delimiter, ... }   # Path utilities
        ↓
DataModel.substitutionsVariables (sealed)
  ├── [base variables]
  ├── package: { name, version, ... } # Package metadata
  └── properties: { ... }             # User-defined properties
        ↓
BuildConfiguration._substitutionsVariables
  ├── [package variables]
  ├── configuration: { name, ... }    # Configuration context
  ├── properties: { ... }             # Merged inherited properties
  └── matrix: { ... }                 # Template matrix parameters
```

## Coding Conventions

### TypeScript

- Use strict type checking
- Prefer interfaces for public APIs
- Use type guards for runtime validation
- Avoid `any` (use `unknown` when type is truly unknown)

### Naming

- **Classes:** PascalCase (`BuildConfiguration`)
- **Interfaces:** PascalCase with descriptive suffixes
  (`BuildConfigurationConstructorParameters`)
- **Functions:** camelCase (`hasLiquidSyntax`)
- **Constants:** SCREAMING_SNAKE_CASE or descriptive names
- **Protected/Private:** Prefix with underscore (`_isInitialised`)

### Async Patterns

- Always use `async/await` (no callbacks)
- Return `Promise<boolean>` from `initialise()` methods
- Use `Promise<void>` for operations without return values

### Error Handling

- Use specific error types from error hierarchy
- Include context in error messages
- Throw synchronously when possible (no wrapping in Promise.reject)

### Documentation

- Comprehensive TSDoc for all public APIs
- Use `@remarks` for detailed explanations
- Document `@throws` conditions
- Keep line length ≤80 characters in comments

## File Size Guidelines

**Current State:**

- ✅ Most files: 200-800 lines (appropriate)
- ⚠️ `build-configurations.ts`: 2,155 lines (consider splitting)
- ⚠️ `actions.ts`: 1,160 lines (consider splitting)
- ⚠️ `init-template-base.ts`: 1,027 lines (manageable)

**Recommendations:**

- Target: <800 lines per file
- Split at: >1,000 lines
- Extract: Complex subsystems into separate files

See [CODE-REVIEW.md](./CODE-REVIEW.md) for detailed analysis and
refactoring recommendations.

## Development Workflow

### Building

```bash
npm run compile          # Compile TypeScript to dist/
npm run compile-clean    # Clean and compile
npm run watch            # Watch mode for development
```

### Testing

```bash
npm test                 # Run all tests
npm run test-coverage    # Generate coverage report
```

### Linting

```bash
npm run lint             # ESLint check
npm run lint-fix         # Auto-fix linting issues
```

### API Documentation

```bash
cd website
npm run build-api        # Generate API reference
```

## Common Tasks

### Adding a New Class

1. Create file in appropriate folder (`classes/`, `functions/`, etc.)
2. Add comprehensive TSDoc comments
3. Export from `index.ts`
4. Add corresponding tests in `tests/tap/`
5. Update API documentation if needed

### Adding a Liquid Filter

In `liquid-engine.ts`:

```typescript
this.registerFilter('filterName', (value: string, arg?: string) => {
  // Implementation
  return processedValue
})
```

Then add tests in `tests/tap/classes/liquid-engine.ts`.

### Adding Type Definitions

1. Add types to appropriate file in `types/`
2. Use descriptive names with `Json` prefix for JSON structures
3. Export from type file (already re-exported by index.ts)
4. Add type validation in runtime code

## Performance Considerations

### Lazy Loading ⚡

- Collections expand template names without evaluating content
- Items initialised only when accessed
- Caching of expanded names and instances

### Efficient Data Structures

- Maps for O(1) lookups of configurations and actions
- Sets for O(1) duplicate detection
- Cached arrays for repeated access to names

### Memory Management

- Sealed substitution variable objects (no accidental modification)
- References to parent collections (no deep cloning)
- Deferred instantiation of configurations and actions

## Security Considerations

### Template Injection

- Liquid templates are sourced from package.json (user's own code)
- Liquid engine is sandboxed (no filesystem access by default)
- Consider template size limits for production use

### Path Traversal

- All paths resolved relative to package folder
- No user-provided paths accepted without validation
- Build folder paths sanitised

### Command Execution

- Action commands are user-defined (trusted code)
- If accepting commands from external sources, sanitisation required

## Related Documentation

- **[Code Review](./CODE-REVIEW.md)** - Comprehensive analysis with improvement recommendations
- **[API Reference](../website/docs/api/)** - Generated API documentation
- **[Test Suite](../tests/tap/README.md)** - Test organisation and conventions
- **[Main README](../README.md)** - Project overview and usage

## Contributing

When contributing to the source code:

1. Follow existing code style and conventions
2. Add comprehensive TSDoc comments
3. Write tests for all new functionality
4. Ensure all tests pass (`npm test`)
5. Run linter (`npm run lint-fix`)
6. Update documentation as needed

## Questions?

- **Issues:** https://github.com/xpack/xpm-lib-ts/issues
- **Discussions:** https://github.com/xpack/xpm-lib-ts/discussions
- **Documentation:** https://xpack.github.io/xpm-lib/
