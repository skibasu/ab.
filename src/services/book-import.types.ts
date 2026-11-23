export type ImportStage = 'preparing' | 'cover' | 'extracting' | 'metadata' | 'saving' | 'complete';

export type ImportBookPreview = {
  key: string;
  title: string;
  author: string;
  coverUri: string | null;
};

export type BookImportUpdate = {
  stage?: ImportStage;
  progress?: number;
  previews?: ImportBookPreview[];
};

export type ZipImportCallbacks = {
  onProgress?: (fraction: number) => void;
  onPreview?: (file: import('expo-document-picker').DocumentPickerAsset) => Promise<void>;
};
