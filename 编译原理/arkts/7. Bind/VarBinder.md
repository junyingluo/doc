## VarBinder

```c++
class VarBinder {
  ArenaAllocator *allocator_ {};
  public_lib::Context *context_ {};
  GlobalScope *topScope_ {};
  Scope *scope_ {};
  VariableScope *varScope_ {};
  ArenaVector<FunctionScope *> functionScopes_;
  ResolveBindingOptions bindingOptions_ {};
}
```
