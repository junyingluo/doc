cmake_minimum_required(VERSION 3.20)
project(llvm_hello)

# ========== 核心：指定 LLVM 20 路径 ==========
# 1. LLVM 编译产物目录（build）
set(LLVM_BUILD_ROOT /home/rander/llvm-project/build)
# 2. LLVM 源码头文件目录（关键：补充这行！）
set(LLVM_SRC_ROOT /home/rander/llvm-project/llvm)

# 3. 验证路径有效性
if (NOT EXISTS ${LLVM_BUILD_ROOT}/bin/llvm-config)
    message(FATAL_ERROR "LLVM 20 编译产物不存在！检查路径：${LLVM_BUILD_ROOT}")
endif()
if (NOT EXISTS ${LLVM_SRC_ROOT}/include/llvm/Bitstream/BitstreamReader.h)
    message(FATAL_ERROR "LLVM 源码头文件不存在！检查路径：${LLVM_SRC_ROOT}")
endif()

# 4. 手动获取 LLVM 配置（通过 llvm-config）
execute_process(
    COMMAND ${LLVM_BUILD_ROOT}/bin/llvm-config --cxxflags
    OUTPUT_VARIABLE LLVM_CXXFLAGS
    OUTPUT_STRIP_TRAILING_WHITESPACE
)
execute_process(
    COMMAND ${LLVM_BUILD_ROOT}/bin/llvm-config --ldflags
    OUTPUT_VARIABLE LLVM_LDFLAGS
    OUTPUT_STRIP_TRAILING_WHITESPACE
)
execute_process(
    COMMAND ${LLVM_BUILD_ROOT}/bin/llvm-config --libs core bitreader irreader support
    OUTPUT_VARIABLE LLVM_LIBS
    OUTPUT_STRIP_TRAILING_WHITESPACE
)
execute_process(
    COMMAND ${LLVM_BUILD_ROOT}/bin/llvm-config --includedir
    OUTPUT_VARIABLE LLVM_BUILD_INC
    OUTPUT_STRIP_TRAILING_WHITESPACE
)

# ========== 编译配置 ==========
# 1. 设置 C++17 标准
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 2. 强制使用 LLVM 20 的 Clang
set(CMAKE_C_COMPILER ${LLVM_BUILD_ROOT}/bin/clang)
set(CMAKE_CXX_COMPILER ${LLVM_BUILD_ROOT}/bin/clang++)

# 3. 导入头文件（核心：同时包含 build/include 和 源码头文件）
include_directories(
    ${LLVM_BUILD_INC}          # 编译产物头文件
    ${LLVM_SRC_ROOT}/include   # 源码头文件（解决 BitstreamReader.h 找不到）
)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${LLVM_CXXFLAGS}")

# ========== 构建程序 ==========
add_executable(llvm_hello llvm_hello.cpp)

target_link_libraries(llvm_hello
    PRIVATE
    ${LLVM_LDFLAGS}
    ${LLVM_LIBS}
)