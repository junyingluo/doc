## ETSLexer

ETSLexer 是 Lexer 派生类

## Lexer

- StringView source\_
  - std::string*view sv* 源码
- LexerPosition pos\_
  - StringView::Iterator iterator\_
    - std::string*view sv*
    - std::string*view::const_iterator iter*
    - PeekCp 查看下一个字符
    - Next 查看下一个字符，且 iter\_ 前进 n 个字节（utf8 编码的字符大小不确定）
  - Token token\_
    - TokenType type\_ 类型
    - TokenType keywordType* 关键词类型（keywordType* 和 type\_ 区别不太清晰）
    - TokenFlags flags\_
    - SourceRange loc\_ 在源码中的位置
    - Number number\_ 如果是 TokenType::LITERAL_NUMBER，则保存转换后的数字
    - util::StringView src\_ 字符串
- Iterator
- NextToken
- Rewind
- Lookahead
- BackwardToken
- ForwardToken
- TryEatTokenType
- TryEatTokenKeyword
- ScanMultilineString
- ScanTemplateStringEnd

## 关键词识别

- 主流程

  ```c++
  void ETSLexer::NextToken(NextTokenFlags flags)
  {
      ETSKeywords kws(this, static_cast<NextTokenFlags>(flags & ~NextTokenFlags::KEYWORD_TO_IDENT));
      Lexer::NextToken(&kws);
  }

  void Lexer::NextToken(Keywords *kws)
  {
      KeywordsUtil &kwu = kws->Util();

      // 设置 token_.loc_.start
      SetTokenStart();

      auto cp = Iterator().Peek();
      Iterator().Forward(1);

      switch (cp) {
          .....
          case LEX_CHAR_LOWERCASE_C: {
              // 获取 keyword
              kws->ScanKeyword(cp);
              break;
          }
          ......
      }

      // 设置 token_.loc_.end
      SetTokenEnd();
      SkipWhiteSpaces();
  }
  ETSKeywords::ScanKeyword(char32_t)
  ETSKeywords::Scan_c()
  ETSKeywords::Scan_cl()
  ETSKeywords::Scan_cla()
  ETSKeywords::Scan_clas()
  inline void Scan_class()
  {
      switch(Util().Iterator().Peek()) {
        default: {
            if (!KeywordsUtil::IsIdentifierPart(Util().Iterator().PeekCp())) {
                // 识别为 class，结束递归
                SetKeyword({"class", TokenType::KEYW_CLASS, TokenType::KEYW_CLASS});
                return;
            }
            break;
        }
      }
      Util().ScanIdContinueMaybeKeyword(this, Span<const KeywordString>(KEYWORDS_c));
  }

  void SetKeyword(KeywordString kws) const
  {
      if ((util_.Flags() & NextTokenFlags::KEYWORD_TO_IDENT) != 0) {
          util_.SetKeyword({kws.Str(), TokenType::LITERAL_IDENT, kws.GetKeywordType()});
      } else {
          util_.CheckEscapedKeyword();
          util_.SetKeyword(kws);
      }
  }

  inline void SetKeyword(KeywordString kws) const
  {
      lexer_->GetToken().src_ = util::StringView(kws.Str());
      lexer_->GetToken().type_ = kws.GetTokenType();
      lexer_->GetToken().keywordType_ = kws.GetKeywordType();
  }
  ```

- 判断是否为变量

  ```c++
  bool KeywordsUtil::IsIdentifierPart(char32_t cp)
  {
      if (cp < LEX_ASCII_MAX_BITS) {
          return (ASCII_FLAGS[cp] & AsciiFlags::ID_CONTINUE) != 0;
      }

      // u_isIDPart or Other_ID_Continue characters or ZWJ/ZWNJ.
      auto uchar = static_cast<UChar32>(cp);
      return (u_hasBinaryProperty(uchar, UCHAR_ID_CONTINUE) || cp == LEX_CHAR_ZWNJ || cp == LEX_CHAR_ZWJ);
  }
  ```

## 工具函数

- TokenToString

## 入口

```c++
void ParserImpl::ParseScript(const SourceFile &sourceFile, bool genStdLib)
{
    auto lexer = InitLexer(sourceFile);

    if (sourceFile.isModule) {
        context_.Status() |= (ParserStatus::MODULE);
        ParseProgram(ScriptKind::MODULE);
    } else if (genStdLib) {
        ParseProgram(ScriptKind::STDLIB);
    } else {
        // 普通脚本，走这个分支
        ParseProgram(ScriptKind::SCRIPT);
    }
}

std::unique_ptr<lexer::Lexer> ETSParser::InitLexer(const SourceFile &sourceFile)
{
    GetProgram()->SetSource(sourceFile);
    auto lexer = std::make_unique<lexer::ETSLexer>(&GetContext(), DiagnosticEngine());
    SetLexer(lexer.get());
    return lexer;
}
```

```c++
void ETSParser::ParseProgram(ScriptKind kind)
{
    lexer::SourcePosition startLoc = Lexer()->GetToken().Start();
    Lexer()->NextToken();
    GetProgram()->SetKind(kind);

    ArenaVector<ir::Statement *> statements(Allocator()->Adapter());
    auto decl = ParsePackageDeclaration();
    if (decl != nullptr) {
        statements.emplace_back(decl);
        // If we found a package declaration, then add all files with the same package to the package parse list
        AddPackageSourcesToParseList();
    }

    ir::ETSModule *script;
    if ((GetContext().Status() & parser::ParserStatus::DEPENDENCY_ANALYZER_MODE) == 0) {
        script = ParseETSGlobalScript(startLoc, statements);
    } else {
        script = ParseImportsOnly(startLoc, statements);
    }

    AddExternalSource(ParseSources(true));
    GetProgram()->SetAst(script);
}
```
