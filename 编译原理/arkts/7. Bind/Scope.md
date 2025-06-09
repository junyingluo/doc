## 类

- Scope
  - ParamScope
    - FunctionParamScope
    * CatchParamScope

## Variable

## Decl

## Scope

- Scope \_parent\_ {};
- ArenaVector<Decl _> decls\*;
- VariableMap bindings\*;
- ir::AstNode _node_ {};
- ScopeFlags flags\* {};
- const compiler::IRNode _startIns_ {};
- const compiler::IRNode \*endIns\* {};

## FindInGlobal

```c++
ConstScopeFindResult Scope::FindInGlobal(const util::StringView &name, const ResolveBindingOptions options) const
{
    const auto *scopeIter = this;
    Variable *resolved = nullptr;
    while (scopeIter != nullptr && !scopeIter->IsGlobalScope()) {
        bool isModule = scopeIter->Node() != nullptr && scopeIter->Node()->IsClassDefinition() &&
                        scopeIter->Node()->AsClassDefinition()->IsModule();
        if (isModule) {
            resolved = scopeIter->FindLocal(name, options);
            if (resolved != nullptr) {
                break;
            }
        }
        scopeIter = scopeIter->Parent();
    }
    if (resolved == nullptr && scopeIter != nullptr && scopeIter->IsGlobalScope()) {
        resolved = scopeIter->FindLocal(name, options);
    }
    return {name, scopeIter, 0, 0, resolved};
}
```
