// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Console log the API configuration
console.log("R2 Storage API configuration:", {
  apiUrl: API_BASE_URL,
  environment: import.meta.env.MODE
});

// Upload file to R2 via backend API
export const uploadToR2 = async (file: File, folder?: string) => {
  try {
    console.log(`Uploading file to R2: ${file.name} (${file.size} bytes)`);
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }
    
    console.log(`Making API request to: ${API_BASE_URL}/r2/upload`);
    
    // Upload to backend API
    const response = await fetch(`${API_BASE_URL}/r2/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed with status ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log("R2 upload successful via API:", result.public_id);
    
    return {
      url: result.url,
      public_id: result.public_id,
      size: result.size,
      originalName: result.originalName
    };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    
    if (error instanceof Error) {
      throw new Error(`R2 upload failed: ${error.message}`);
    }
    
    throw new Error('Failed to upload file. Please check your network connection and try again.');
  }
};

// Function to delete a file from R2 via backend API
export const deleteFromR2 = async (filePath: string): Promise<void> => {
  try {
    console.log(`Attempting to delete file from R2: ${filePath}`);
    
    // Make delete request to backend API
    const response = await fetch(`${API_BASE_URL}/r2/delete/${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Delete failed with status ${response.status}`);
    }
    
    const result = await response.json();
    console.log("R2 delete successful via API:", result.filePath);
  } catch (error) {
    console.error('Error deleting from R2:', error);
    throw error;
  }
};

// Function to list files in a folder via backend API
export const listFilesFromR2 = async (folder?: string) => {
  try {
    console.log(`Listing files from R2 folder: ${folder || 'root'}`);
    
    const url = folder 
      ? `${API_BASE_URL}/r2/list/${encodeURIComponent(folder)}`
      : `${API_BASE_URL}/r2/list/`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `List failed with status ${response.status}`);
    }
    
    const result = await response.json();
    console.log("R2 list successful via API:", result.count, "files found");
    
    return result.files;
  } catch (error) {
    console.error('Error listing R2 files:', error);
    throw error;
  }
};

// Function to get file info via backend API
export const getFileInfoFromR2 = async (filePath: string) => {
  try {
    console.log(`Getting file info from R2: ${filePath}`);
    
    const response = await fetch(`${API_BASE_URL}/r2/info/${encodeURIComponent(filePath)}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Get file info failed with status ${response.status}`);
    }
    
    const result = await response.json();
    console.log("R2 file info retrieved via API:", result.file.key);
    
    return result.file;
  } catch (error) {
    console.error('Error getting R2 file info:', error);
    throw error;
  }
};
