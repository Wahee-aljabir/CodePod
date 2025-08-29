class CloudinaryService {
  constructor() {
    this.cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    this.uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
    this.thumbnailPreset = 'codepod-thumbnails'; // Your specific preset
    this.baseUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}`;
    
    // Debug logging
    console.log('Cloudinary Config:', {
      cloudName: this.cloudName,
      thumbnailPreset: this.thumbnailPreset,
      baseUrl: this.baseUrl
    });
  }

  /**
   * Upload an image file to Cloudinary
   * @param {File} file - The image file to upload
   * @param {Object} options - Additional upload options
   * @returns {Promise<Object>} - Upload result with URL and public_id
   */
  async uploadImage(file, options = {}) {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', options.folder || 'avatars');
      
      // Remove transformation parameter - not allowed with unsigned uploads
      // Transformations should be configured in the upload preset or applied when displaying

      // Upload to Cloudinary
      const response = await fetch(`${this.baseUrl}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const result = await response.json();
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  /**
   * Upload avatar with specific transformations
   * @param {File} file - The avatar image file
   * @returns {Promise<Object>} - Upload result
   */
  async uploadAvatar(file) {
    const result = await this.uploadImage(file, {
      folder: 'avatars'
      // Remove transformation - will be applied when displaying the image
    });
    
    // Return URL with transformation applied for display
    const transformedUrl = this.getOptimizedUrl(result.publicId, {
      width: 200,
      height: 200,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      format: 'auto'
    });
    
    return {
      ...result,
      url: transformedUrl // Use transformed URL for display
    };
  }

  /**
   * Delete an image from Cloudinary
   * @param {string} publicId - The public ID of the image to delete
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteImage(publicId) {
    try {
      // Note: This requires server-side implementation for security
      // Client-side deletion is not recommended for production
      console.warn('Image deletion should be handled server-side for security');
      
      // For now, we'll just return success
      // In production, make an API call to your backend
      return { success: true };
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  }

  /**
   * Generate optimized URL for existing image
   * @param {string} publicId - The public ID of the image
   * @param {Object} options - Transformation options
   * @returns {string} - Optimized image URL
   */
  getOptimizedUrl(publicId, options = {}) {
    const transformations = [];
    
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.crop) transformations.push(`c_${options.crop}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);
    
    const transformString = transformations.length > 0 
      ? `/${transformations.join(',')}` 
      : '';
    
    return `https://res.cloudinary.com/${this.cloudName}/image/upload${transformString}/${publicId}`;
  }

  /**
   * Upload thumbnail for project
   * @param {File} file - The thumbnail image file
   * @returns {Promise<Object>} - Upload result
   */
  async uploadThumbnail(file) {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Check file size (10MB limit for thumbnails)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      console.log('Uploading thumbnail with preset:', this.thumbnailPreset);
      console.log('File details:', { name: file.name, size: file.size, type: file.type });

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.thumbnailPreset);
      formData.append('folder', 'thumbnails');

      // Upload to Cloudinary
      const response = await fetch(`${this.baseUrl}/image/upload`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Cloudinary error response:', result);
        throw new Error(result.error?.message || `Upload failed: ${response.status}`);
      }

      console.log('Upload successful:', result);
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      };
    } catch (error) {
      console.error('Cloudinary thumbnail upload error:', error);
      throw error;
    }
  }
}

// Export singleton instance
const cloudinaryService = new CloudinaryService();
export default cloudinaryService;