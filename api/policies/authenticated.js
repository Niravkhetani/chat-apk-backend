module.exports = function (req, res, next) {
  // if (req.session.isAuthorised) {
  // get token from header an validate it
  var token = req.headers["authorization"];
  // console.log("Authorize token ", token);
  // console.log("REquest.headers ", req.headers);
  // validate we have all params
  if (!token || token === "") {
    return res.status(200).json({
      status: false,
      code: 401,
      message: "Authorization Token is required",
    });
  } else {
    // validate token and set req.User if we have a valid token
    sails.services.tokenauth.verifyToken(token, async function (err, data) {
      if (err) {
        console.log("Error in verify token ", err);
        return res.status(200).json({
          status: false,
          code: 401,
          message: "Authorization Token not valid.",
        });
      } else if (data.userName) {
        // console.log(data)
        let user;
        if (data.type && data.type == "admin") user = await Admin.findOne({username: data.userName});
        else user = await Users.findOne({userName: data.userName}).populate("userSetting");
        if (!user) {
          return res.status(200).json({
            status: false,
            code: 401,
            message: "Not a valid user.",
          });
        }
        req.user = {userId: user.id, user: user};
        next();
      } else {
        console.log("In authenticated.js Authorization Token not valid ");
        return res.status(200).json({
          status: false,
          code: 401,
          message: "Authorization Token not valid.",
        });
      }
    });
  }
};
