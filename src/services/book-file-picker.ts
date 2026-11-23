import * as DocumentPicker from 'expo-document-picker';

/**
 * Opens the system file picker and returns selected files of the requested MIME type.
 * Creates readable working copies in cache; does not save them to the book library.
 * Canceling the picker returns an empty array.
 */
export async function pickBookFiles(type: 'audio/mpeg' | 'application/zip') {
  const result = await DocumentPicker.getDocumentAsync({
    type: [type],
    multiple: type !== 'application/zip',
    copyToCacheDirectory: true,
  });

  if (result.canceled) return [];

  return result.assets;
}
