## 类关系

- AstNode
  - Typed
    - TypedAstNode
      - Expression
        - Literal
          - NumberLiteral
  - Statement
    - Decorator
    - AnnotationAllowed
      - FunctionDeclaration
      - ScriptFunction
    - ClassDeclaration
    - BlockStatement

## 节点关系

- FunctionDeclaration
  - Decorator
  - ScriptFunction

## AstNode

- AstNode \*parent\_ 父节点
- lexer::SourceRange range\_
- AstNodeType type\_ 节点类型

  - astNodeMapping.h 定义`节点类型`和`节点映射`关系

    /home/rander/arkcompiler/ets_frontend/ets2panda/ir/astNodeMapping.h

- ModifierFlags flags\_
- mutable AstNodeFlags astNodeFlags\_
- mutable BoxingUnboxingFlags boxingUnboxingFlags\_
- varbinder::Variable \*variable\_
- AstNode \*originalNode\_

## FunctionDeclaration

- ArenaVector<Decorator \*> decorators\_;
- ScriptFunction \*func\_;
- const bool isAnonymous\_;

## Decorator

## ScriptFunction

## Dump

- ast

```c++
std::string Program::Dump() const
{
    ir::AstDumper dumper {ast_, SourceCode()};
    return dumper.Str();
}
```

- src

es2panda test.sts --dump-ets-src-before-phases=plugins-after-parse > dump.txt

```c++
std::string AstNode::DumpEtsSrc() const
{
    ir::SrcDumper dumper {this};
    return dumper.Str();
}
```
