export async function extractTextFromImage(imageUri: string): Promise<string> {
  const MlkitOcr = (await import('react-native-mlkit-ocr')).default;
  const blocks = await MlkitOcr.detectFromUri(imageUri);
  return blocks
    .map((b) => b.text)
    .join('\n')
    .trim();
}
