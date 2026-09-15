cmake_minimum_required(VERSION 3.22.1)
project(nova_llama LANGUAGES C CXX)

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(GGML_NATIVE OFF CACHE BOOL "" FORCE)
set(GGML_CUDA OFF CACHE BOOL "" FORCE)
set(GGML_METAL OFF CACHE BOOL "" FORCE)
set(GGML_OPENCL OFF CACHE BOOL "" FORCE)
set(GGML_VULKAN OFF CACHE BOOL "" FORCE)
set(GGML_BLAS OFF CACHE BOOL "" FORCE)
set(GGML_OPENMP OFF CACHE BOOL "" FORCE)
set(GGML_LLAMAFILE OFF CACHE BOOL "" FORCE)
set(GGML_RPC OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_TOOLS OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_SERVER OFF CACHE BOOL "" FORCE)
set(LLAMA_CURL OFF CACHE BOOL "" FORCE)
set(BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)

if(DEFINED ANDROID_ABI AND ANDROID_ABI STREQUAL "arm64-v8a")
    set(GGML_CPU_KLEIDIAI ON CACHE BOOL "" FORCE)
endif()

set(LLAMA_DIR "${CMAKE_CURRENT_LIST_DIR}/../../../../third_party/llama.cpp")

if(EXISTS "${LLAMA_DIR}/CMakeLists.txt")
    message(STATUS "Using vendored llama.cpp at ${LLAMA_DIR}")
    add_subdirectory("${LLAMA_DIR}" llama-build EXCLUDE_FROM_ALL)
else()
    include(FetchContent)
    set(LLAMA_TAG "master" CACHE STRING "llama.cpp git tag")
    message(STATUS "Fetching llama.cpp (${LLAMA_TAG})")
    FetchContent_Declare(
        llama
        GIT_REPOSITORY https://github.com/ggml-org/llama.cpp.git
        GIT_TAG        ${LLAMA_TAG}
        GIT_SHALLOW    TRUE
    )
    FetchContent_MakeAvailable(llama)
endif()

add_library(nova_llama SHARED nova_llama.cpp)

if(NOT TARGET llama)
    message(FATAL_ERROR "llama.cpp target 'llama' was not created")
endif()

target_link_libraries(nova_llama llama android log)
