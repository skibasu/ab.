import * as DocumentPicker from 'expo-document-picker';

export async function pickBookFiles(type: 'audio/mpeg' | 'application/zip') {
  const result = await DocumentPicker.getDocumentAsync({
    type: [type],
    multiple: true,
    copyToCacheDirectory: true,
  });

  if (result.canceled) return [];

  return result.assets;
}
