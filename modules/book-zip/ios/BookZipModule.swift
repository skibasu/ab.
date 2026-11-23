import ExpoModulesCore
import Foundation

struct NativeZipEntry: Record {
  @Field var size: Double = 0
  @Field var checksum: Double = 0
  @Field var directory: Bool = false
  @Field var output: String? = nil
}

public final class BookZipModule: Module, @unchecked Sendable {
  private let lock = NSLock()
  private var jobs: [String: ZipCancellation] = [:]
  private let extractionQueue = DispatchQueue(label: "ab.book-zip", qos: .userInitiated)

  public func definition() -> ModuleDefinition {
    Name("BookZip")
    Events("onProgress")

    // Register synchronously before dispatching work so an immediate cancellation cannot be lost.
    Function("begin") { (id: String) in
      self.lock.lock()
      defer { self.lock.unlock() }
      self.jobs[id] = ZipCancellation()
    }
    Function("cancel") { (id: String) in
      self.lock.lock()
      let job = self.jobs[id]
      self.lock.unlock()
      job?.cancel()
    }
    AsyncFunction("extract") { (
      id: String, archiveURI: String, destinationURI: String,
      entries: [NativeZipEntry], maxBytes: Double, chunkBytes: Int
    ) -> String? in
      self.lock.lock()
      let job = self.jobs[id]
      self.lock.unlock()
      defer {
        self.lock.lock()
        self.jobs.removeValue(forKey: id)
        self.lock.unlock()
      }
      guard let job,
            let archive = URL(string: archiveURI), archive.isFileURL,
            let destination = URL(string: destinationURI), destination.isFileURL,
            maxBytes.isFinite, maxBytes > 0, maxBytes <= Double(Int64.max),
            chunkBytes > 0 else { return ZipFailure.invalid.rawValue }
      do {
        let checked = try entries.map { entry -> CheckedZipEntry in
          guard entry.size.isFinite, entry.size >= 0, entry.size <= maxBytes,
                entry.size.rounded(.down) == entry.size,
                entry.checksum.isFinite, entry.checksum >= 0,
                entry.checksum <= Double(UInt32.max),
                entry.checksum.rounded(.down) == entry.checksum else { throw ZipFailure.invalid }
          return CheckedZipEntry(size: UInt64(entry.size), checksum: UInt32(entry.checksum),
                                 directory: entry.directory, output: entry.output)
        }
        try extractBookZip(archiveURL: archive, destination: destination, expected: checked,
                           maxBytes: UInt64(maxBytes), chunkBytes: chunkBytes, cancellation: job)
        return nil
      } catch let error as ZipFailure {
        return error.rawValue
      } catch {
        return ZipFailure.invalid.rawValue
      }
    }.runOnQueue(extractionQueue)

    AsyncFunction("extractStage") { (
      id: String, archiveURI: String, destinationURI: String,
      entries: [NativeZipEntry], maxBytes: Double, chunkBytes: Int, phaseName: String
    ) -> String? in
      self.lock.lock()
      let job = self.jobs[id]
      self.lock.unlock()
      defer {
        self.lock.lock()
        self.jobs.removeValue(forKey: id)
        self.lock.unlock()
      }
      guard let phase = ZipExtractionPhase(rawValue: phaseName), let job,
            let archive = URL(string: archiveURI), archive.isFileURL,
            let destination = URL(string: destinationURI), destination.isFileURL,
            maxBytes.isFinite, maxBytes > 0, maxBytes <= Double(Int64.max),
            chunkBytes > 0 else { return ZipFailure.invalid.rawValue }
      do {
        let checked = try entries.map { entry -> CheckedZipEntry in
          guard entry.size.isFinite, entry.size >= 0, entry.size <= maxBytes,
                entry.size.rounded(.down) == entry.size,
                entry.checksum.isFinite, entry.checksum >= 0,
                entry.checksum <= Double(UInt32.max),
                entry.checksum.rounded(.down) == entry.checksum else { throw ZipFailure.invalid }
          return CheckedZipEntry(size: UInt64(entry.size), checksum: UInt32(entry.checksum),
                                 directory: entry.directory, output: entry.output)
        }
        var lastEventAt = Date.distantPast
        try extractBookZip(archiveURL: archive, destination: destination, expected: checked,
                           maxBytes: UInt64(maxBytes), chunkBytes: chunkBytes, cancellation: job, phase: phase) { written, total in
          let now = Date()
          if now.timeIntervalSince(lastEventAt) >= 0.1 || written == total {
            lastEventAt = now
            self.sendEvent("onProgress", ["id": id, "written": Double(written), "total": Double(total)])
          }
        }
        return nil
      } catch let error as ZipFailure {
        return error.rawValue
      } catch {
        return ZipFailure.invalid.rawValue
      }
    }.runOnQueue(extractionQueue)

    OnDestroy {
      self.lock.lock()
      let active = Array(self.jobs.values)
      self.jobs.removeAll()
      self.lock.unlock()
      active.forEach { $0.cancel() }
    }
  }
}
