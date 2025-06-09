// LLVM 20 中字节码读写头文件路径调整（Bitcode 改为 Bitstream）
#include "llvm/Bitstream/BitstreamReader.h"
#include "llvm/Bitstream/BitstreamWriter.h"
// LLVM IR 核心头文件（路径不变，但部分接口重构）
#include "llvm/IR/Function.h"
#include "llvm/IR/Module.h"
#include "llvm/IR/LLVMContext.h"
// 命令行参数解析（接口兼容，但建议用新版命名）
#include "llvm/Support/CommandLine.h"
// 内存缓冲区（接口微调，返回值改为 Expected）
#include "llvm/Support/MemoryBuffer.h"
// 原始输出流（接口不变）
#include "llvm/Support/raw_os_ostream.h"
// 错误处理（新版用 Error/Expected 替代旧版 system_error）
#include "llvm/Support/Error.h"
// 字节码解析（新版用 parseBitcodeFile 替代旧版 ParseBitcodeFile）
#include "llvm/Bitcode/BitcodeReader.h"
// C++ 标准库
#include <iostream>
#include <memory>  // 新版用 std::unique_ptr 替代 OwningPtr

// 使用 llvm 命名空间
using namespace llvm;

// 定义命令行参数（接口兼容，desc 字符串改为中文/英文均可）
static cl::opt<std::string> FileName(
    cl::Positional,
    cl::desc("Bitcode file (input .bc file)"),
    cl::Required
);

int main(int argc, char** argv) {
    // 解析命令行参数（接口不变）
    cl::ParseCommandLineOptions(argc, argv, "LLVM 20 Hello World: Read Bitcode and Print Function Info\n");

    // 1. 创建 LLVM 上下文（新版 LLVMContext 需显式命名，接口兼容）
    LLVMContext Context;

    // 2. 读取字节码文件（核心改动：新版返回 Expected<OwningMemoryBuffer>）
    ErrorOr<std::unique_ptr<MemoryBuffer>> MBOrErr = MemoryBuffer::getFile(FileName);
    if (!MBOrErr) {
        std::cerr << "Error reading file: " << MBOrErr.getError().message() << std::endl;
        return -1;
    }
    std::unique_ptr<MemoryBuffer> MB = std::move(*MBOrErr);

    // 3. 解析字节码为 Module（核心改动：新版 parseBitcodeFile 返回 Expected<std::unique_ptr<Module>>）
    Expected<std::unique_ptr<Module>> ModOrErr = parseBitcodeFile(MB->getMemBufferRef(), Context);
    if (!ModOrErr) {
        // 新版错误处理：用 toString 转换 Error 为字符串
        std::cerr << "Error parsing bitcode: " << toString(ModOrErr.takeError()) << std::endl;
        return -1;
    }
    std::unique_ptr<Module> M = std::move(*ModOrErr);  // 新版用 unique_ptr 管理 Module 所有权

    // 4. 遍历函数并输出基本块数量（核心改动：新版用范围 for 循环替代旧版迭代器）
    raw_os_ostream O(std::cout);
    for (const Function &F : *M) {  // 新版推荐范围 for，更简洁
        if (!F.isDeclaration()) {    // isDeclaration() 接口兼容
            O << F.getName().str() << " has " << F.size() << " basic block(s).\n";
        }
    }

    return 0;
}