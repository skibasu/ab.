import type { AudioPlayer, AudioStatus } from 'expo-audio';

import type { LibraryBookWithTracks, LibraryTrack, PlaybackProgressInput } from './book-repository';

type SessionTrack = {
  track: LibraryTrack;
  position: number;
  lastSavedPosition: number;
  completed: boolean;
  ready: boolean;
  restoring: boolean;
  seeking: boolean;
  engaged: boolean;
  wasPlaying: boolean;
  pendingSave: boolean;
  lastPlayedAt: number | null;
};

type Options = {
  player: Pick<
    AudioPlayer,
    'play' | 'pause' | 'replace' | 'seekTo' | 'currentTime' | 'duration' | 'playing'
  >;
  book: LibraryBookWithTracks;
  source: (track: LibraryTrack) => { uri: string };
  save: (snapshot: PlaybackProgressInput) => Promise<boolean>;
  getProgress: (trackId: string) => Partial<LibraryTrack> | undefined;
  onChange: (track: LibraryTrack, ready: boolean) => void;
  onError: (error: unknown) => void;
};

/** Owns playback transitions, not React rendering. The same native player is reused for every track. */
export class PlaybackSession {
  private current?: SessionTrack;
  private generation = 0;
  private active = false;
  private switching = false;
  private autoplay = false;

  private readonly options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  start() {
    this.active = true;
    const { book } = this.options;
    const track = book.tracks.find((item) => item.id === book.lastPlayedTrackId) ?? book.tracks[0];
    if (track) this.load(track, true, 'resume');
  }

  private load(track: LibraryTrack, autoplay: boolean, mode: 'resume' | 'start') {
    const saved = { ...track, ...this.options.getProgress(track.id) };
    const position = mode === 'resume' ? Math.max(0, saved.positionSeconds - 15) : 0;
    this.generation++;
    this.autoplay = autoplay;
    this.current = {
      track: saved,
      position,
      lastSavedPosition: position,
      completed: saved.completed,
      ready: false,
      restoring: false,
      seeking: false,
      engaged: false,
      wasPlaying: false,
      pendingSave: false,
      lastPlayedAt: saved.lastPlayedAt,
    };
    this.options.onChange(saved, false);
    this.options.player.pause();
    this.options.player.replace(this.options.source(saved));
  }

  private async restore(current: SessionTrack) {
    current.restoring = true;
    const generation = this.generation;
    try {
      const duration = this.options.player.duration;
      const target = duration > 0 ? Math.min(current.position, duration) : current.position;
      await this.options.player.seekTo(target);
      if (!this.active || generation !== this.generation) return;
      current.position = target;
      current.lastSavedPosition = target;
      current.ready = true;
      this.options.onChange(current.track, true);
      if (this.autoplay) this.play(current);
    } catch (error) {
      if (this.active && generation === this.generation) this.options.onError(error);
    }
  }

  private play(current: SessionTrack) {
    current.position = Math.max(0, this.options.player.currentTime);
    current.engaged = true;
    current.lastPlayedAt = Date.now();
    current.wasPlaying = true;
    this.options.player.play();
    void this.persist(current);
  }

  /** Reopening a paused book rewinds once; reopening a playing book is a no-op. */
  async resumeOnOpen() {
    const current = this.current;
    if (
      !this.active ||
      !current ||
      this.options.player.playing ||
      this.switching ||
      current.seeking
    )
      return;
    if (!current.ready) {
      this.autoplay = true;
      return;
    }
    const generation = this.generation;
    const position = Math.max(0, this.options.player.currentTime - 15);
    current.seeking = true;
    try {
      await this.options.player.seekTo(position);
      if (!this.active || generation !== this.generation) return;
      current.position = position;
      this.play(current);
    } catch (error) {
      if (this.active && generation === this.generation) this.options.onError(error);
    } finally {
      current.seeking = false;
    }
  }

  private async persist(current: SessionTrack, completed = current.completed) {
    if (!current.engaged && !completed) return true;
    const position = current.position;
    const snapshot: PlaybackProgressInput = {
      userId: this.options.book.userId,
      bookId: this.options.book.id,
      trackId: current.track.id,
      positionSeconds: position,
      completed,
      lastPlayedAt: current.lastPlayedAt,
      updatedAt: Date.now(),
    };
    const saved = await this.options.save(snapshot);
    if (saved) {
      current.lastSavedPosition = position;
      current.completed = completed;
    }
    return saved;
  }

  handleStatus(status: AudioStatus) {
    const current = this.current;
    if (!this.active || !current || !status.isLoaded) return;
    if (!current.ready) {
      if (!current.restoring) void this.restore(current);
      return;
    }
    if (current.seeking || this.switching) return;
    if (!Number.isFinite(status.currentTime)) return;
    current.position = Math.max(0, status.currentTime);
    if (status.playing) {
      current.engaged = true;
      current.lastPlayedAt = Date.now();
    }
    if (status.didJustFinish) {
      current.position = status.duration > 0 ? status.duration : current.position;
      current.engaged = true;
      current.wasPlaying = false;
      void this.finish(current);
      return;
    }
    if (status.playing !== current.wasPlaying) {
      current.wasPlaying = status.playing;
      void this.persist(current);
    } else if (
      status.playing &&
      !current.pendingSave &&
      Math.abs(current.position - current.lastSavedPosition) >= 15
    ) {
      current.pendingSave = true;
      void this.persist(current).finally(() => {
        current.pendingSave = false;
      });
    }
  }

  togglePlay() {
    const current = this.current;
    if (!this.active || !current?.ready || current.seeking || this.switching) return;
    current.position = Math.max(0, this.options.player.currentTime);
    if (
      !this.options.player.playing &&
      this.options.player.duration > 0 &&
      current.position >= this.options.player.duration
    ) {
      const generation = this.generation;
      current.seeking = true;
      void this.options.player
        .seekTo(0)
        .then(() => {
          if (!this.active || generation !== this.generation) return;
          current.seeking = false;
          current.position = 0;
          this.togglePlay();
        })
        .catch((error) => {
          current.seeking = false;
          this.options.onError(error);
        });
      return;
    }
    current.engaged = true;
    current.lastPlayedAt = Date.now();
    current.wasPlaying = !this.options.player.playing;
    if (current.wasPlaying) this.options.player.play();
    else this.options.player.pause();
    void this.persist(current);
  }

  async skip(seconds: number) {
    const current = this.current;
    if (!this.active || !current?.ready || current.seeking || this.switching) return;
    const duration = this.options.player.duration;
    const target = Math.max(0, Math.min(duration, this.options.player.currentTime + seconds));
    const generation = this.generation;
    current.seeking = true;
    try {
      await this.options.player.seekTo(target);
      if (!this.active || generation !== this.generation) return;
      current.position = target;
      current.engaged = true;
      current.lastPlayedAt = Date.now();
      await this.persist(current);
    } catch (error) {
      this.options.onError(error);
    } finally {
      current.seeking = false;
    }
  }

  async selectTrack(track: LibraryTrack) {
    if (!this.active || this.switching || this.current?.seeking) return;
    const current = this.current;
    const generation = this.generation;
    this.switching = true;
    try {
      if (current?.ready) {
        current.position = Math.max(0, this.options.player.currentTime);
        this.options.player.pause();
        const completed = current.completed || track.position > current.track.position;
        if (!(await this.persist(current, completed))) return;
      }
      if (this.active && generation === this.generation) this.load(track, true, 'start');
    } catch (error) {
      this.options.onError(error);
    } finally {
      this.switching = false;
    }
  }

  private async finish(current: SessionTrack) {
    if (this.switching) return;
    const generation = this.generation;
    this.switching = true;
    try {
      if (!(await this.persist(current, true))) return;
      if (!this.active || generation !== this.generation) return;
      const index = this.options.book.tracks.findIndex((track) => track.id === current.track.id);
      const next = this.options.book.tracks[index + 1];
      if (next) this.load(next, true, 'start');
    } finally {
      this.switching = false;
    }
  }

  flush() {
    const current = this.current;
    if (current?.ready && !current.seeking) {
      current.position = Math.max(0, this.options.player.currentTime);
      return this.persist(current);
    }
    return Promise.resolve(true);
  }

  dispose() {
    this.active = false;
    this.generation++;
    // Cached status is safe even if React has already released the native object.
    if (this.current?.ready) void this.persist(this.current);
    try {
      this.options.player.pause();
    } catch {
      /* Native player may already be released. */
    }
  }
}
