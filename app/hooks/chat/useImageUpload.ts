import { useState } from "react";

export const useImageUpload = () => {
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const uploadImageToR2 = async (imageUri: string): Promise<string | null> => {
    try {
      setIsUploadingImage(true);

      const filename = imageUri.split('/').pop() || 'image.jpg';
      const fileType = filename.toLowerCase().endsWith('.png')
        ? 'image/png'
        : filename.toLowerCase().endsWith('.gif')
        ? 'image/gif'
        : filename.toLowerCase().endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg';

      const fileResponse = await fetch(imageUri);
      const fileBlob = await fileResponse.blob();
      const fileSize = fileBlob.size;

      const uploadUrlResponse = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: filename, fileType, fileSize }),
      });

      if (!uploadUrlResponse.ok) {
        console.error('Failed to get upload URL:', await uploadUrlResponse.json());
        return null;
      }

      const { uploadUrl, publicUrl } = await uploadUrlResponse.json();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': fileType },
        body: fileBlob,
      });

      if (!uploadResponse.ok) {
        console.error('Failed to upload to R2:', uploadResponse.status);
        return null;
      }

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image to R2:', error);
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  return { uploadImageToR2, isUploadingImage };
};
