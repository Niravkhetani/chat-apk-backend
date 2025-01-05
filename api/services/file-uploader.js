var dir = require('node-dir');
var mkdir = require('mkdirp');
var fs = require('fs');
var PATH = require('path');
const { resolve } = require('path');
const { reject } = require('lodash');
/**
 * uploads profile picture in a spacific folder
 * @param filesToUpload
 * @param path
 * @param user
 * @param tag
 */
module.exports.profileImageUpload = function (
  filesToUpload,
  path,
  user,
  tag,
  ext
) {
  // console.log(path, user, tag);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      filesToUpload.upload(
        {
          maxBytes: 500000000000,
          dirname: require('path').resolve(sails.config.appPath, path),
        },
        async function (err, uploadedFiles) {
          if (err) {
            reject(err);
          } else if (uploadedFiles.length) {
            let dataFile;
            await fs.readFile(uploadedFiles[0].fd, 'utf8', (er, fi) => {
              if (er) {
                console.log('line 89 reading file error', er);
              } else {
                // console.log("line 92 reading file data",fi);
                dataFile = fi.toString();
                // console.log("AFTER FILE UPLOAD=========================>", dataFile);
                fs.unlink(uploadedFiles[0].fd, (err) => {
                  if (err) throw err;
                });
                dir.files(path, function (err, files) {
                  if (err) {
                    mkdir(path, 0775);
                    setTimeout(() => {
                      fs.writeFile(
                        PATH.join(
                          __dirname,
                          '../../' + path + '/' + user + '-' + tag + '-1.' + ext
                        ),
                        dataFile,
                        { encoding: 'base64' },
                        function (err) {
                          if (err) {
                            console.log('ERROR>>>>>>>>>>>>>>>>>', err);
                          } else {
                            console.log('File created', files);
                            resolve(
                              path + '/' + user + '-' + tag + '-1.' + ext
                            );
                          }
                        }
                      );
                    }, 1000);
                    // return next(undefined, user + '-' + tag + '-1.' + __newFileStream.filename.split('.').reverse()[0]);
                  } else if (files.length <= 0) {
                    fs.writeFile(
                      PATH.join(
                        __dirname,
                        '../../' +
                          path +
                          '/' +
                          user +
                          '-' +
                          tag +
                          '-' +
                          (files.length + 1) +
                          '.' +
                          ext
                      ),
                      dataFile,
                      { encoding: 'base64' },
                      function (err) {
                        if (err) {
                          console.log('ERROR>>>>>>>>>>>>>>>>>', err);
                        } else {
                          console.log('File created', files);
                          resolve(
                            path +
                              '/' +
                              user +
                              '-' +
                              tag +
                              '-' +
                              (files.length + 1) +
                              '.' +
                              ext
                          );
                        }
                      }
                    );
                    // return next(undefined, user + '-' + tag + '-' + (files.length + 1) + '.' + __newFileStream.filename.split('.').reverse()[0]);
                  } else if (files.length > 0) {
                    var name = new Array();
                    files.forEach((file) => {
                      name.push(
                        parseInt(
                          file
                            .split('/')
                            .reverse()[0]
                            .split('-')
                            .reverse()[0]
                            .split('.')
                            .reverse()[1]
                        )
                      );
                    });
                    var missing = new Array();
                    for (var i = 1; i <= name[name.length - 1]; i++) {
                      if (name.indexOf(i) == -1) {
                        missing.push(i);
                      }
                    }
                    if (missing.length > 0) {
                      fs.writeFile(
                        PATH.join(
                          __dirname,
                          '../../' +
                            path +
                            '/' +
                            user +
                            '-' +
                            tag +
                            '-' +
                            missing[0] +
                            '.' +
                            ext
                        ),
                        dataFile,
                        { encoding: 'base64' },
                        function (err) {
                          if (err) {
                            console.log('ERROR>>>>>>>>>>>>>>>>>', err);
                          } else {
                            console.log('File created', files);
                            resolve(
                              path +
                                '/' +
                                user +
                                '-' +
                                tag +
                                '-' +
                                missing[0] +
                                '.' +
                                ext
                            );
                          }
                        }
                      );
                      // return next(undefined, user + '-' + tag + '-' + missing[0] + '.' + __newFileStream.filename.split('.').reverse()[0]);
                    } else {
                      fs.writeFile(
                        PATH.join(
                          __dirname,
                          '../../' +
                            path +
                            '/' +
                            user +
                            '-' +
                            tag +
                            '-' +
                            (Math.max(...name) + 1) +
                            '.' +
                            ext
                        ),
                        dataFile,
                        { encoding: 'base64' },
                        function (err) {
                          if (err) {
                            console.log('ERROR>>>>>>>>>>>>>>>>>', err);
                          } else {
                            console.log('File created', files);
                            resolve(
                              path +
                                '/' +
                                user +
                                '-' +
                                tag +
                                '-' +
                                (Math.max(...name) + 1) +
                                '.' +
                                ext
                            );
                          }
                        }
                      );
                      // return next(undefined, user + '-' + tag + '-' + (Math.max(...name) + 1) + '.' + __newFileStream.filename.split('.').reverse()[0]);
                    }
                  }
                });
              }
            });
          } else {
            resolve(uploadedFiles);
          }
        }
      );
    }, 500);
  });
};

// uploading user profile photo to the assets/profile/userId/profileImage.jpg
module.exports.uploadProfile = async (uploadImage, path) => {
  console.log('path : ', path);
  return new Promise((resolve, reject) => {
    uploadImage.upload(
      {
        maxBytes: 500000000000,
        dirname: require('path').resolve(
          sails.config.appPath,
          'assets/profile/' + path
        ),
        saveAs: async (__newFileStream, next) => {
          console.log('__newFileStream', __newFileStream);
          await rmDir(
            require('path').resolve(
              sails.config.appPath,
              'assets/profile/' + path + '/'
            )
          );
          return next(undefined, `${__newFileStream.filename}`);
        },
      },
      async (err, uploadedImg) => {
        if (err) return reject(err);
        return resolve(uploadedImg);
      }
    );
  });
};

// uploading group profile photo to the assets/group/profile/chatId/groupProfile.jpg
module.exports.uploadGroupProfile = async (uploadMedia, path) => {
  console.log('path : ', path);
  return new Promise((resolve, reject) => {
    uploadMedia.upload(
      {
        maxBytes: 500000000000,
        dirname: require('path').resolve(
          sails.config.appPath,
          'assets/group/profile/' + path
        ),
        saveAs: async (__newFileStream, next) => {
          await rmDir(
            require('path').resolve(
              sails.config.appPath,
              'assets/group/profile/' + path + '/'
            )
          );
          return next(undefined, `${__newFileStream.filename}`);
        },
      },
      async (err, uploadMedia) => {
        if (err) return reject(err);
        return resolve(uploadMedia);
      }
    );
  });
};

// for removing previous user-previous profile photo
rmDir = function (dirPath, removeSelf) {
  console.log('dirPathdirPath', dirPath);
  if (removeSelf === undefined) removeSelf = true;
  try {
    var files = fs.readdirSync(dirPath);
  } catch (e) {
    return;
  }
  if (files.length > 0) {
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
      else rmDir(filePath);
    }
  }
  if (removeSelf) fs.rmdirSync(dirPath);
};

// uploading media to assets/media

module.exports.uploadMedia = async (uploadImage, path) => {
  console.log('path : ', path);
  return new Promise((resolve, reject) => {
    uploadImage.upload(
      {
        maxBytes: 500000000000,
        dirname: require('path').resolve(
          sails.config.appPath,
          'assets/media/' + path
        ),
        saveAs: async (__newFileStream, next) => {
          // console.log('__newFileStream', __newFileStream);
          return next(undefined, `${__newFileStream.filename}`);
        },
      },
      async (err, uploadMedia) => {
        if (err) return reject(err);
        return resolve(uploadMedia);
      }
    );
  });
};
