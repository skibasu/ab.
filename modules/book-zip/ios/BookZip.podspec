Pod::Spec.new do |s|
  s.name = 'BookZip'
  s.version = '1.0.0'
  s.summary = 'Bounded native audiobook ZIP extraction'
  s.description = s.summary
  s.license = { :type => 'MIT' }
  s.author = 'aB'
  s.homepage = 'https://expo.dev'
  s.source = { :git => '' }
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.dependency 'ZIPFoundation', '0.9.20'
  s.source_files = '*.swift'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
