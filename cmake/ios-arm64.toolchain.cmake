# iOS device toolchain for the shared Chiaki protocol core.
# Invoke from macOS with Xcode selected (xcode-select -p).
if(NOT APPLE)
    message(FATAL_ERROR "The iOS toolchain requires macOS and Xcode.")
endif()

set(CMAKE_SYSTEM_NAME iOS)
set(CMAKE_OSX_SYSROOT iphoneos CACHE STRING "iOS SDK" FORCE)
set(CMAKE_OSX_ARCHITECTURES arm64 CACHE STRING "iOS device architecture" FORCE)
set(CMAKE_OSX_DEPLOYMENT_TARGET "15.0" CACHE STRING "Minimum iOS version" FORCE)

# CMake must execute host tools (Python and protoc), while resolving libraries,
# headers and package configs from the iOS dependency prefix / SDK.
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)

# Avoid trying to link executable probes while cross-compiling for iOS.
set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)
