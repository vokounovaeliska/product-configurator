# Architecture Pattern - Quick Reference

## Project Structure Philosophy

**Single-module Maven project** with **feature modules as packages** (NOT Maven modules). Each feature (products, users, orders, etc.) follows hexagonal architecture within the same Maven module.

## Module Structure (per feature)

```
{module}/
├── api/              # External facades & DTOs
├── domain/           # Pure Kotlin entities, no dependencies
├── application/      # Use cases, configuration, exceptions, validation
├── infrastructure/   # REST controllers, persistence, jobs
└── ports/            # Interfaces (inbound=API, outbound=Repository)
```

## Domain Layer Pattern

1. **Value class for ID**: `@JvmInline value class {Feature}Id(val value: UUID)`
2. **Entity with factory**: `companion object { fun create(params: {Feature}CreateParams): {Feature} }`
3. **Business methods**: Keep in domain entity (e.g., `duplicate()`)
4. **Required files**:
   - `{Feature}.kt` - Entity
   - `{Feature}Id.kt` - ID value class
   - `{Feature}Filter.kt` - Query filter
   - `{Feature}Params.kt` - Create/Update params
   - `{Feature}SortableField.kt` - Sortable fields enum

## Application Layer Pattern

- **{Feature}APIManager**: Implements `{Feature}API` (inbound port), contains use cases
- **{Feature}FacadeManager**: Implements `{Feature}Facade` (external API)
- Use `@Transactional` in managers, not repositories
- Use `@Service` or `@Component`

## Infrastructure Layer Pattern

- **{Feature}RepositoryDB**: Implements `{Feature}Repository` (outbound port), uses jOOQ
- **{Feature}sController**: REST controller, maps request/response, calls API
- Separate mappers for domain <-> DTO and domain <-> DB

## Key Principles

1. Domain has NO dependencies (pure Kotlin)
2. Application depends on Domain + Ports
3. Infrastructure depends on Domain + Application + Ports
4. Use value classes for type-safe IDs
5. Factory methods in companion objects
6. Business logic in domain entities
7. Transactions in use case managers
8. Separate mappers for each boundary

## Naming

- Entities: Singular (`Material`, `ProductModel`)
- Controllers: Plural (`MaterialsController`)
- Repositories: `{Feature}Repository` (interface), `{Feature}RepositoryDB` (impl)
- Use Cases: `{Feature}APIManager`, `{Feature}FacadeManager`

## Reference

See `ARCHITECTURE.md` for detailed examples. The `products/domain/materials/` module is the reference implementation (can be deleted once pattern is understood).

