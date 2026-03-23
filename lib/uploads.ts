// lib/upload.ts
export async function uploadFile(file: File): Promise<{ url: string; key: string }> {
    // For development/testing, you can use FormData to send to your own API
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      return {
        url: data.url,
        key: data.key || data.public_id || data.secure_url
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }