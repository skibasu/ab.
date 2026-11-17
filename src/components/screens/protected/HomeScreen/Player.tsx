import { formatDuration } from '@/utils/format-duration';
import { Asset } from 'expo-asset';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { File } from 'expo-file-system';
import { parseBuffer } from 'music-metadata';
import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';

const audioSource = require('@/assets/audio/mag.mp3');
type FileMeta = {
  author: string | undefined;
  title: string | undefined;
  track: {
    no: number | null;
    of: number | null;
  };
  album: string | undefined;
  duration: number | undefined;
};
export default function AppPlayer() {
  const player = useAudioPlayer(audioSource);
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);

  useEffect(() => {
    let cancelled = false;

    const logMetadata = async () => {
      try {
        const asset = Asset.fromModule(audioSource);
        await asset.downloadAsync();
        if (cancelled) return;
        if (!asset.localUri) throw new Error('Could not resolve the local MP3 file.');

        // This small test MP3 is read into memory; large audiobooks need chunked reads.
        const file = new File(asset.localUri);
        const bytes = await file.bytes();
        if (cancelled) return;

        const metadata = await parseBuffer(bytes, {
          mimeType: 'audio/mpeg',
          size: bytes.length,
        });

        if (!cancelled) {
          const fileMeta = {
            author: metadata.common.artist,
            title: metadata.common.title,
            album: metadata.common.album,
            track: metadata.common.track,
            duration: metadata.format.duration,
          };
          setFileMeta(fileMeta);
          console.log('[mag.mp3] Metadata:', fileMeta);
        }
      } catch (error) {
        if (!cancelled) console.error('[pink-panther.mp3] Failed to read metadata:', error);
      }
    };

    void logMetadata();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Configure audio session for background playback
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  }, []);

  const handlePlay = () => {
    // Enable lock screen controls with metadata
    player.setActiveForLockScreen(true, {
      title: 'My Audio Title',
      artist: 'Artist Name',
      albumTitle: 'Album Name',
      artworkUrl: 'https://example.com/artwork.jpg', // optional
    });

    // Start playback - this will continue in the background
    player.play();
  };

  const handleStop = () => {
    player.pause();
    // Optionally disable lock screen controls when done
    player.setActiveForLockScreen(false);
  };

  return (
    <View>
      <View>
        {fileMeta?.album && <Text>Title: {fileMeta.album}</Text>}
        {fileMeta?.author && <Text>Author: {fileMeta.author}</Text>}
        {fileMeta?.track?.no && fileMeta?.track?.of && (
          <Text>
            Track: {fileMeta.track.no} of {fileMeta.track.of}
          </Text>
        )}
        {fileMeta?.duration !== undefined && <Text>{formatDuration(fileMeta.duration)}</Text>}
      </View>

      <Button
        title="Play"
        onPress={handlePlay}
      />
      <Button
        title="Stop"
        onPress={handleStop}
      />
    </View>
  );
}
