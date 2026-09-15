const { uploadToGridFS, getFileInfo, getFileStream } = require("../config/gridfs");

const MEDICAL_CERTIFICATE_MAX_BYTES = 10 * 1024 * 1024;

function assertPdf(file) {
  if (!file || !file.buffer || file.size === 0) {
    throw new Error("A medical certificate PDF is required.");
  }

  if (file.mimetype !== "application/pdf" || !/\.pdf$/i.test(file.originalname || "")) {
    throw new Error("Medical certificate must be a PDF file.");
  }

  if (file.size > MEDICAL_CERTIFICATE_MAX_BYTES) {
    throw new Error("Medical certificate must be 10 MB or smaller.");
  }
}

async function uploadMedicalCertificate(file, metadata = {}) {
  assertPdf(file);
  const stored = await uploadToGridFS(
    file.buffer,
    file.originalname,
    "application/pdf",
    { ...metadata, purpose: "student_medical_certificate" }
  );

  return {
    fileId: stored.fileId,
    filename: stored.filename,
    originalName: stored.originalName,
    mimeType: stored.mimeType,
    size: stored.size,
    uploadedAt: new Date(),
    storageProvider: "gridfs"
  };
}

module.exports = {
  MEDICAL_CERTIFICATE_MAX_BYTES,
  assertPdf,
  uploadMedicalCertificate,
  getFileInfo,
  getFileStream
};
