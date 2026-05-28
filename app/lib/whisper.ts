import * as FileSystem from 'expo-file-system/legacy';

// ggml-tiny model supports multilingual including Vietnamese
// Hosted on HuggingFace (whisper.rn-compatible format)
const MODEL_URL =
  'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin';
const MODEL_DIR = `${FileSystem.documentDirectory ?? ''}whisper-models/`;
const MODEL_PATH = `${MODEL_DIR}ggml-tiny.bin`;

export type WhisperDownloadProgress = {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
};

let whisperCtx: import('whisper.rn').WhisperContext | null = null;

async function ensureModelDir() {
  await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
}

export async function isModelDownloaded(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  return info.exists && info.size != null && info.size > 1_000_000;
}

export async function downloadModel(
  onProgress?: (progress: WhisperDownloadProgress) => void
): Promise<void> {
  await ensureModelDir();
  const downloadResumable = FileSystem.createDownloadResumable(
    MODEL_URL,
    MODEL_PATH,
    {},
    (progress) => {
      onProgress?.(progress);
    }
  );
  await downloadResumable.downloadAsync();
}

export async function initWhisperCtx(): Promise<import('whisper.rn').WhisperContext> {
  if (whisperCtx) return whisperCtx;

  const { initWhisper } = await import('whisper.rn');
  whisperCtx = await initWhisper({ filePath: MODEL_PATH });
  return whisperCtx;
}

export function releaseWhisperCtx() {
  whisperCtx?.release();
  whisperCtx = null;
}

export async function transcribeAudio(
  audioPath: string,
  language = 'vi'
): Promise<string> {
  const ctx = await initWhisperCtx();

  const { stop, promise } = ctx.transcribeFile(audioPath, {
    language,
    maxLen: 0,
    tokenTimestamps: false,
  });

  try {
    const { result } = await promise;
    return result.trim();
  } catch {
    stop();
    throw new Error('Transcription failed');
  }
}
