const path = require('path');

/**
 * Turn a multer disk file into a path relative to /public (e.g. "images/foo.jpg")
 * so express.static("public") and ADMIN_URL + path work on all OS paths.
 */
function multerFileToPublicRelativePath(file) {
  if (!file) return '';
  if (file.filename && (!file.path || file.path === file.filename)) {
    return path.posix.join('images', file.filename.replace(/\\/g, '/'));
  }
  const abs = path.resolve(file.path);
  const pubRoot = path.resolve(path.join(process.cwd(), 'public'));
  let rel = path.relative(pubRoot, abs);
  if (rel.startsWith('..') || !rel) {
    return file.filename
      ? path.posix.join('images', String(file.filename).replace(/\\/g, '/'))
      : '';
  }
  return rel.split(path.sep).join('/');
}

module.exports = { multerFileToPublicRelativePath };
