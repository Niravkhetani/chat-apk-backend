module.exports = {
  findOne: function (query, projection = {}, condition = {}) {
    return new Promise((resolve, reject) => {
      Chat.findOne(query)
        .populateAll(projection)
        .exec((err, result) => {
          if (err) {
            reject(err);
          } else if (result) {
            resolve(result);
          } else {
            resolve(null);
          }
        });
    });
  },

  fn: async function (inputs) {
    // TODO
  },
};
