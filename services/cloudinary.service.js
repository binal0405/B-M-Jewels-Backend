const { secret } = require("../config/secret");
const cloudinary = require("../utils/cloudinary");
const { Readable } = require('stream');

// cloudinary Image Upload
// const cloudinaryImageUpload = async (image) => {
//   console.log('image service',image)
//   const uploadRes = await cloudinary.uploader.upload(image, {
//     upload_preset: secret.cloudinary_upload_preset,
//   });
//   return uploadRes;
// };

const toUploadError = (error) => {
  if (error instanceof Error) return error;
  if (error && typeof error === "object" && error.message) {
    const err = new Error(error.message);
    if (error.http_code) err.http_code = error.http_code;
    return err;
  }
  return new Error(String(error));
};

const cloudinaryImageUpload = (imageInput, folderName = "BMJEWELS") => {
  return new Promise((resolve, reject) => {
    const options = {
      folder: folderName,
    };
    if (secret.cloudinary_upload_preset) {
      options.upload_preset = secret.cloudinary_upload_preset;
    }

    if (Buffer.isBuffer(imageInput)) {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            console.error('Error uploading to Cloudinary stream:', error);
            reject(toUploadError(error));
          } else {
            resolve(result);
          }
        }
      );

      const bufferStream = new Readable();
      bufferStream.push(imageInput);
      bufferStream.push(null);

      bufferStream.pipe(uploadStream);
    } else {
      // If it is a file path or URL string
      cloudinary.uploader.upload(imageInput, options, (error, result) => {
        if (error) {
          console.error('Error uploading to Cloudinary:', error);
          reject(toUploadError(error));
        } else {
          resolve(result);
        }
      });
    }
  });
};


// cloudinaryImageDelete
const cloudinaryImageDelete = async (public_id) => {
  const deletionResult = await cloudinary.uploader.destroy(public_id);
  return deletionResult;
};

exports.cloudinaryServices = {
  cloudinaryImageDelete,
  cloudinaryImageUpload,
};
