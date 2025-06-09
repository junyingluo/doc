```c++
ir::Statement *ETSParser::ParseEnumDeclaration(bool isConst, bool isStatic)
{
    ES2PANDA_ASSERT(Lexer()->GetToken().Type() == lexer::TokenType::KEYW_ENUM);

    lexer::SourcePosition enumStart = Lexer()->GetToken().Start();
    Lexer()->NextToken();  // eat enum keyword

    auto *key = ExpectIdentifier(false, true);

    auto *declNode = ParseEnumMembers(key, enumStart, isConst, isStatic);
    if (declNode == nullptr) {  // Error processing.
        // Error is logged inside ParseEnumMembers
        return AllocBrokenStatement();
    }
    return declNode;
}
```

- varbinder::LocalScope \*scope\_ {nullptr};
- Identifier \*key\_;

  枚举名

- ArenaVector<AstNode \*> members\_;

  枚举名成员
