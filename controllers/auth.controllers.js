const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const imagekit = require("../libs/imagekit");
const path = require("path");
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  register: async (req, res, next) => {
    try {
      let { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Email Or Password Not Exist",
          data: null,
        });
      }
      let userExist = await prisma.user.findUnique({ where: { email } });
      if (userExist) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "user has already been used!",
          data: null,
        });
      }
      let encryptedPassword = await bcrypt.hash(password, 10);
      try {
        const user = await prisma.user.create({
          data: {
            email,
            password: encryptedPassword,
            Profile: {
              create: {
                first_name: null,
                last_name: null,
                birth_date: null,
                profile_picture: null,
              },
            },
          },
        });
        res.status(201).json({
          status: true,
          message: "OK",
          err: null,
          data: user,
        });
      } catch (err) {
        res.status(400).json({
          status: true,
          message: "Bad Request",
          err: null,
          data: user,
        });
      }
    } catch (err) {
      next(err);
    }
  },
  login: async (req, res, next) => {
    try {
      let { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Email Or Password Not Exist",
          data: null,
        });
      }
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Invalid email or password",
          data: null,
        });
      }

      let isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "invalid email or password!",
          data: null,
        });
      }

      let token = jwt.sign({ id: user.id }, JWT_SECRET_KEY);

      return res.status(200).json({
        status: true,
        message: "OK",
        err: null,
        data: { user, token },
      });
    } catch (err) {
      next(err);
    }
  },
  updateProfile: async (req, res, next) => {
    try {
      const { first_name, last_name, birth_date } = req.body;
      const { id } = req.user;
      let strFile = req.file.buffer.toString("base64");
      let { url } = await imagekit.upload({
        fileName: Date.now() + path.extname(req.file.originalname),
        file: strFile,
      });

      let updateProfile = await prisma.userProfile.update({
        where: {
          userId: id,
        },
        data: {
          first_name,
          last_name,
          birth_date,
          profile_picture: url,
        },
      });
      return res.status(200).json({
        status: true,
        message: "OK",
        error: null,
        data: { updateProfile },
      });
    } catch (err) {
      next(err);
    }
  },
  authenticate: async (req, res, next) => {
    try {
      const { id } = req.user;
      const profileUser = await prisma.userProfile.findUnique({
        where: {
          userId: id,
        },
      });
      return res.status(200).json({
        status: true,
        message: "OK",
        err: null,
        data: { user: profileUser },
      });
    } catch (error) {
      next(err);
    }
  },
};
