import Foundation
import XCTest
import ZIPFoundation
@testable import BookZipCore

final class ZipExtractorTests: XCTestCase {
  private var root: URL!
  private var archiveURL: URL { root.appendingPathComponent("source.zip") }
  private var destination: URL { root.appendingPathComponent("output") }

  override func setUpWithError() throws {
    root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    try FileManager.default.createDirectory(at: destination, withIntermediateDirectories: true)
  }

  override func tearDownWithError() throws {
    try FileManager.default.removeItem(at: root)
  }

  private func makeArchive(_ data: Data, method: CompressionMethod = .deflate) throws -> [CheckedZipEntry] {
    let archive = try Archive(url: archiveURL, accessMode: .create)
    try archive.addEntry(with: "folder/chapter.mp3", type: .file, uncompressedSize: Int64(data.count),
                         compressionMethod: method) { position, size in
      data.subdata(in: Int(position)..<(Int(position) + size))
    }
    return archive.map {
      CheckedZipEntry(size: $0.uncompressedSize, checksum: $0.checksum,
                      directory: false, output: UUID().uuidString + ".mp3")
    }
  }

  private func extract(_ entries: [CheckedZipEntry], maxBytes: UInt64 = 100_000,
                       cancellation: ZipCancellation = ZipCancellation()) throws {
    try extractBookZip(archiveURL: archiveURL, destination: destination, expected: entries,
                       maxBytes: maxBytes, chunkBytes: 64, cancellation: cancellation)
  }

  func testStoredAndDeflatedContentsAndGeneratedNames() throws {
    let data = Data(repeating: 42, count: 8192)
    for method in [CompressionMethod.none, .deflate] {
      if FileManager.default.fileExists(atPath: archiveURL.path) {
        try FileManager.default.removeItem(at: archiveURL)
      }
      let entries = try makeArchive(data, method: method)
      try extract(entries)
      XCTAssertEqual(try Data(contentsOf: destination.appendingPathComponent(entries[0].output!)), data)
      XCTAssertFalse(FileManager.default.fileExists(atPath: destination.appendingPathComponent("folder").path))
    }
  }

  func testActualOutputLimitStopsBeforeWritingExcessChunk() throws {
    let entries = try makeArchive(Data(repeating: 12, count: 8192))
    XCTAssertThrowsError(try extract(entries, maxBytes: 100)) {
      XCTAssertEqual($0 as? ZipFailure, .limit)
    }
    let size = try FileManager.default.attributesOfItem(atPath: destination.appendingPathComponent(entries[0].output!).path)[.size] as! NSNumber
    XCTAssertLessThanOrEqual(size.intValue, 100)
  }

  func testCancelledBeforeExtractionCreatesNoOutputs() throws {
    let entries = try makeArchive(Data(repeating: 1, count: 8192))
    let job = ZipCancellation()
    job.cancel()
    XCTAssertThrowsError(try extract(entries, cancellation: job)) {
      XCTAssertEqual($0 as? ZipFailure, .cancelled)
    }
    XCTAssertEqual(try FileManager.default.contentsOfDirectory(atPath: destination.path), [])
  }

  func testFalseDeclaredSizeCannotHideLargerDeflateOutput() throws {
    let entries = try makeArchive(Data(repeating: 1, count: 8192))
    var bytes = try Data(contentsOf: archiveURL)
    // Change both declared sizes while retaining the full compressed payload and CRC.
    let central = bytes.range(of: Data([0x50, 0x4b, 0x01, 0x02]))!.lowerBound
    for offset in [22, central + 24] {
      bytes.replaceSubrange(offset..<(offset + 4), with: [64, 0, 0, 0])
    }
    try bytes.write(to: archiveURL)
    let forged = [CheckedZipEntry(size: 64, checksum: entries[0].checksum,
                                  directory: false, output: entries[0].output)]
    XCTAssertThrowsError(try extract(forged))
    let size = try FileManager.default.attributesOfItem(atPath: destination.appendingPathComponent(entries[0].output!).path)[.size] as! NSNumber
    XCTAssertLessThanOrEqual(size.intValue, 64)
  }

  func testDiscardedFilesAreStillCheckedAgainstRealLimit() throws {
    let entries = try makeArchive(Data(repeating: 1, count: 8192))
    let ignored = entries.map { CheckedZipEntry(size: $0.size, checksum: $0.checksum, directory: false, output: nil) }
    XCTAssertThrowsError(try extract(ignored, maxBytes: 100)) {
      XCTAssertEqual($0 as? ZipFailure, .limit)
    }
    XCTAssertEqual(try FileManager.default.contentsOfDirectory(atPath: destination.path), [])
  }

  func testManifestMismatchRejectsArchive() throws {
    let entries = try makeArchive(Data(repeating: 1, count: 100))
    let wrong = [CheckedZipEntry(size: entries[0].size, checksum: entries[0].checksum ^ 1,
                                 directory: false, output: entries[0].output)]
    XCTAssertThrowsError(try extract(wrong))
    XCTAssertThrowsError(try extract([]))
    XCTAssertThrowsError(try extract(entries + entries))
  }

  func testExistingOutputCannotBeOverwritten() throws {
    let entries = try makeArchive(Data(repeating: 1, count: 100))
    let url = destination.appendingPathComponent(entries[0].output!)
    let original = Data("original".utf8)
    try original.write(to: url)
    XCTAssertThrowsError(try extract(entries))
    XCTAssertEqual(try Data(contentsOf: url), original)
  }

  func testUnsafeOutputNameIsRejected() throws {
    let entries = try makeArchive(Data(repeating: 1, count: 100))
    let wrong = [CheckedZipEntry(size: entries[0].size, checksum: entries[0].checksum,
                                 directory: false, output: "../outside.mp3")]
    XCTAssertThrowsError(try extract(wrong))
    XCTAssertFalse(FileManager.default.fileExists(atPath: root.appendingPathComponent("outside.mp3").path))
  }

  func testCorruptedDataIsRejectedEvenWhenDiscarded() throws {
    let entries = try makeArchive(Data(repeating: 1, count: 100), method: .none)
    var bytes = try Data(contentsOf: archiveURL)
    // Local header: 30 fixed bytes, then filename and extra data.
    let nameLength = Int(bytes[26]) | Int(bytes[27]) << 8
    let extraLength = Int(bytes[28]) | Int(bytes[29]) << 8
    bytes[30 + nameLength + extraLength] ^= 1
    try bytes.write(to: archiveURL)
    let ignored = entries.map { CheckedZipEntry(size: $0.size, checksum: $0.checksum, directory: false, output: nil) }
    XCTAssertThrowsError(try extract(ignored)) {
      XCTAssertEqual($0 as? ZipFailure, .invalid)
    }
  }
}
