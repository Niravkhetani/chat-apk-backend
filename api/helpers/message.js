module.exports = {

  createOne: function (data) {
    return new Promise((resolve, reject) => {
      Message
        .create(data)
        .exec((err, result) => {
          if (err) {
            reject(err);
          } else if (result) {
            resolve(result);
          } else {
            resolve(null);
          }
        })
    })
  },

  findAndUpdate: function (query, data, projection = {}, condition = {}) {
    return new Promise((resolve, reject) => {
      Message
        .update(query)
        .set(data)
        .exec((err, result) => {
          if (err) {
            reject(err);
          } else if (result) {
            resolve(result);
          } else {
            resolve(null);
          }
        })
    })
  },

  fn: async function (inputs) {
    // TODO
  }

};
