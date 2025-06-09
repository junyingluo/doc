```c++
checker::VerifiedType BinaryExpression::Check(checker::ETSChecker *checker)
{
    if (operator_ == lexer::TokenType::KEYW_INSTANCEOF) {
        printf("ddd");
    }
    return {this, checker->GetAnalyzer()->Check(this)};
}
```
