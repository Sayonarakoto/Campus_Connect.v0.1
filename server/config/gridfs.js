// config/gridfs.js
const mongoose = require('mongoose');
const { Readable } = require('stream');
const crypto = require('crypto');

let bucket = null;

// Initialize GridFS bucket
const initGridFS = () => {
  return new Promise((resolve, reject) => {
    const conn = mongoose.connection;
    
    if (conn.readyState !== 1) {
      return reject(new Error('MongoDB connection not ready'));
    }

    try {
      bucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'event_uploads'
      });
      resolve(bucket);
    } catch (error) {
      reject(error);
    }
  });
};

// Get GridFS bucket instance
const getBucket = () => {
  if (!bucket) {
    throw new Error('GridFS not initialized. Call initGridFS() first.');
  }
  return bucket;
};

// Upload file to GridFS
const uploadToGridFS = (fileBuffer, filename, mimeType, metadata = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getBucket();
      
      // Create readable stream from buffer
      const readableStream = new Readable();
      readableStream.push(fileBuffer);
      readableStream.push(null);

      // Generate unique filename
      const uniqueFilename = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}_${filename}`;

      // Create upload stream
      const uploadStream = bucket.openUploadStream(uniqueFilename, {
        contentType: mimeType,
        metadata: {
          ...metadata,
          originalName: filename,
          uploadDate: new Date(),
          fileSize: fileBuffer.length
        }
      });

      // Handle upload completion
      uploadStream.on('error', (error) => {
        reject(error);
      });

      uploadStream.on('finish', () => {
        resolve({
          fileId: uploadStream.id,
          filename: uniqueFilename,
          originalName: filename,
          mimeType: mimeType,
          size: fileBuffer.length,
          url: `/api/files/${uploadStream.id}`
        });
      });

      // Pipe file to GridFS
      readableStream.pipe(uploadStream);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Delete file from GridFS
const deleteFromGridFS = async (fileId) => {
  try {
    const bucket = getBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);
    
    // Check if file exists
    const files = await bucket.find({ _id: objectId }).toArray();
    if (files.length === 0) {
      return false;
    }

    await bucket.delete(objectId);
    return true;
  } catch (error) {
    console.error('Error deleting file from GridFS:', error);
    return false;
  }
};

// Get file info
const getFileInfo = async (fileId) => {
  try {
    const bucket = getBucket();
    const files = await bucket.find({ 
      _id: new mongoose.Types.ObjectId(fileId) 
    }).toArray();
    
    if (files.length === 0) {
      return null;
    }
    
    return files[0];
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
};

// Get file stream
const getFileStream = (fileId) => {
  try {
    const bucket = getBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);
    return bucket.openDownloadStream(objectId);
  } catch (error) {
    console.error('Error getting file stream:', error);
    throw error;
  }
};

module.exports = {
  initGridFS,
  getBucket,
  uploadToGridFS,
  deleteFromGridFS,
  getFileInfo,
  getFileStream
};