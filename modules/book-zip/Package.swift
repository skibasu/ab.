// swift-tools-version: 5.9
import PackageDescription

// Exercises the actual extraction core on macOS without generating an iOS app project.
let package = Package(
  name: "BookZipCore",
  platforms: [.macOS(.v13)],
  dependencies: [.package(url: "https://github.com/weichsel/ZIPFoundation.git", exact: "0.9.20")],
  targets: [
    .target(name: "BookZipCore", dependencies: ["ZIPFoundation"], path: "ios",
            exclude: ["BookZipModule.swift", "BookZip.podspec"]),
    .testTarget(name: "BookZipCoreTests", dependencies: ["BookZipCore", "ZIPFoundation"], path: "tests")
  ]
)
