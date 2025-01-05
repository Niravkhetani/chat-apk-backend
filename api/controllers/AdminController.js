/**
 * AdminController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var nodemailer = require("nodemailer");
const {generatePasswordCode} = require("../validations/Admin");
const {generateRandomDigit} = require("../helpers/common");

const Status = sails.config.constants.ResponseCodes;
const UserResponseCodes = sails.config.constants.UserResponseCodes;
module.exports = {
  createAdmin: async (req, res) => {
    let response = {};
    try {
      const adminExist = await Admin.findOne({username: req.body.username});
      console.log("adminExist ", adminExist);
      if (adminExist === undefined) {
        console.log("new admin");
        const token = await sails.services.tokenauth.generateToken({
          username: req.body.username,
          type: req.body.type || "admin",
        });
        const createdAdmin = await Admin.create({
          name: req.body.admin_name,
          username: req.body.username,
          password: req.body.password,
          token,
          type: req.body.type,
        }).fetch();
        // console.log({name: req.body.admin_name,
        //     username: req.body.username,
        //     password: req.body.password});
        response.status = Status.CREATED;
        response.data = createdAdmin;
        response.message = "Admin created successfully.";
        return res.status(Status.CREATED).json(response);
      } else {
        console.log("Already exits");
        response.status = Status.OK;
        response.data = {exist: true};
        response.message = "Admin already exists.";
        return res.status(Status.OK).json(response);
      }
    } catch (error) {
      console.log("error: " + error);
      response.status = Status.BAD_REQUEST;
      response.message = "Admin not created.";
      return res.status(Status.OK).json(response);
    }
  },

  userToken: async (req, res) => {
    let response;

    const token = await sails.services.tokenauth.generateToken({
      username: req.body.username,
      id: admin[0].id,
      type: "admin",
    });

    response.status = Status.OK;
    response.token = token;
    response.message = "Token generate successfully.";

    return res.status(Status.OK).json(response);
  },

  verifyAdmin: async (req, res) => {
    let response = {};
    // console.log(req.body);

    const admin = await Admin.find({
      username: req.body.username,
      password: req.body.password,
    });

    // console.log("Admin ", admin);

    if (!admin.length && admin.length === 0) {
      console.log("Not valid credential..");
      response.status = Status.OK;
      response.data = {login: false};
      response.message = "Not valid credential";
      return res.status(Status.OK).json(response);
    }

    if (admin.length > 0) {
      let token = await sails.services.tokenauth.generateToken({
        userName: req.body.username,
        id: admin[0].id,
        type: "admin",
      });
      console.log("value of token", token);

      const updatedAdmin = await Admin.updateOne({username: req.body.username}).set({
        token: token,
        tokenExpire: new Date().setDate(new Date().getDate() + 1).toString(),
      });
      // console.log(updatedAdmin);
      response.status = Status.OK;
      response.data = updatedAdmin;
      response.data["login"] = true;
      response.message = "Get admin successfully.";

      return res.status(Status.OK).json(response);
    }
  },

  updateAdmin: async (req, res) => {
    let response = {};
    // console.log(req.body);

    const updatedAdmin = await Admin.updateOne({username: req.body.username}).set({
      username: req.body.username,
      password: req.body.password,
    });

    if (!updatedAdmin) {
      response.status = Status.BAD_REQUEST;
      response.message = "Admin not updated.";
      return res.status(Status.BAD_REQUEST).json(response);
    }
    response.status = Status.OK;
    response.data = updatedAdmin;
    response.message = "Admin updated successfully.";
    return res.status(Status.OK).json(response);
  },

  deleteAdmin: async (req, res) => {
    let response = {};
    console.log("user id for delete admin " + req.body.id);
    const id = req.body.id;
    const admin = await Admin.destroyOne({id});
    console.log("ADmin deleted ", admin);

    response.status = Status.OK;
    response.data = admin;
    response.message = "Admin deleted successfully.";
    return res.status(Status.OK).json(response);
  },

  getAllAdmin: async (req, res) => {
    let response = {};
    let body = {
      recordPerPage: req.body.recordPerPage,
      skipRecord: req.body.pageNumber > 1 ? (req.body.pageNumber - 1) * req.body.recordPerPage : 0,
      // sortBy: req.body.sortBy,
    };
    console.log("getAllAdmin body", body);

    const total = await Admin.count({});
    const admins = await Admin.find({type: {"!=": "superAdmin"}})
      .limit(body.recordPerPage)
      .skip(body.skipRecord);

    if (!admins) {
      response.status = Status.BAD_REQUEST;
      response.message = "Admins not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }
    response.status = Status.OK;
    response.data = admins;
    response.message = "Get admins successfully.";
    response.totalAdmins = total;
    return res.status(Status.OK).json(response);
  },

  //When user click on forget password link first verify Token if it is expire or not
  verifyToken: async (req, res) => {
    let response = {};
    console.log("token " + req.body.token);
    console.log("tokenExpire " + req.body.tokenExpire);
    let token = req.body.token;
    let tokenExpire = req.body.tokenExpire;

    let admin = await Admin.findOne({token: token});
    console.log("Admin in verify tokne ", admin);

    if (!admin) {
      response.status = Status.NOT_FOUND;
      response.message = "Invalid token.";
      return res.status(Status.OK).json(response);
    }
    if (tokenExpire > new Date().getTime()) {
      response.status = Status.OK;
      response.data = {
        verifyToken: true,
        admin,
      };
      response.message = "Token verified successfully.";
      return res.status(Status.OK).json(response);
    } else {
      response.status = Status.OK;
      response.data = {
        verifyToken: false,
      };
      response.message = "Token expired please login again.";
      return res.status(Status.OK).json(response);
    }
  },

  resetPassword: async (req, res) => {
    let response = {};
    console.log("new password", req.body.password);
    console.log("username ", req.body.username);

    const updatedAdmin = await Admin.updateOne({username: req.body.username}).set({
      password: req.body.password,
    });
    if (!updatedAdmin) {
      response.status = Status.BAD_REQUEST;
      response.message = "Admin not updated.";
      return res.status(Status.BAD_REQUEST).json(response);
    }
    response.status = Status.OK;
    response.data = updatedAdmin;
    response.message = "Admin updated successfully.";
    return res.status(Status.OK).json(response);
  },

  //If user verify email then send email
  sendEmail: async (req, res) => {
    let response = {};
    console.log("email " + req.body.email);
    console.log("url  " + req.body.url);

    let admin = await Admin.findOne({username: req.body.email});
    console.log("Admin in send mail ", admin);
    if (admin) {
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "razgovor6367829@gmail.com",
          pass: "knwdhnpcuvsrevir",
        },
      });
      var mailOptions = {
        from: "razgovor6367829@gmail.com",
        to: req.body.email,
        subject: "Forget Password for Admin by Razgovor Chat.",
        text: `Hi click this link to recover your forgotten password : ${req.body.url}?token=${admin.token}&tokenExpire=${admin.tokenExpire}`,
        // html: "<b>Hello world?</b>"
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log("Send mail error ", error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });

      response.status = Status.OK;
      response.message = "Email send successfully.";
      return res.status(Status.OK).json(response);
    } else {
      response.status = Status.BAD_REQUEST;
      response.message = "This email is not registered.";
      return res.status(Status.OK).json(response);
    }
  },

  //When user forget password first verify email
  verifyEmail: async (req, res) => {
    let response = {};
    console.log("email " + req.body.email);

    const admin = await Admin.findOne({username: req.body.email});

    if (admin === undefined) {
      console.log("emailExit not exits in admin");
      (response.status = Status.NOT_FOUND),
        (response.message = "Email not exist."),
        (response.data = {
          isVerifed: false,
        });
      return res.status(Status.OK).json(response);
    }

    let token = await sails.services.tokenauth.generateToken({
      username: req.body.email,
      id: admin.id,
      type: "admin",
    });
    console.log("value of token", token);

    const updatedAdmin = await Admin.updateOne({username: req.body.email}).set({
      token: token,
      tokenExpire: new Date().setDate(new Date().getDate() + 1).toString(),
    });

    response.status = Status.OK;
    response.data = {
      isVerifed: true,
      admin: updatedAdmin,
    };
    response.message = "Email verify successfully.";
    return res.status(Status.OK).json(response);
  },

  getSuperAdmin: async (req, res) => {
    let response = {};

    let superAdmin = await Admin.find({
      type: "superAdmin",
      username: req.body.username,
    });

    superAdmin = superAdmin[0];
    console.log("Super admin Find ", superAdmin);
    if (!superAdmin) {
      response.status = Status.OK;
      response.data = {superAdmin: false};
      response.message = "Not a superAdmin";
      return res.status(Status.OK).json(response);
    }

    response.status = Status.OK;
    response.data = superAdmin;
    response.message = "Super admin get successfully.";
    return res.status(Status.OK).json(response);
  },

  getResetPasswordCode: async (req, res) => {
    return await generatePasswordCode(req.body).then(async () => {
      let response = {};
      const user = await Users.findOne({userName: req.body.userName});
      console.log(user);
      if (!user) {
        response.code = UserResponseCodes.USER_NOT_FOUND;
        response.message = "User Not found with same this username Please check Username";
        response.data = {};
        response.success = false;
        return res.status(Status.OK).json(response);
      }
      const resetCode = generateRandomDigit(4);
      const updateUser = await Users.updateOne({userName: user.userName}).set({resetPassword: resetCode});
      response.code = UserResponseCodes.USER_SUCCESS;
      response.message = "User updated successfully";
      response.data = {updateUser};
      response.success = false;
      return res.status(Status.OK).json(response);
    });
  },
};
