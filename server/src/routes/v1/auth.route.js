import express from "express";
const router = express.Router();

import validateRequest from "#src/http/middlewares/validateRequest.js";
import {
  login,
  register,
  logout,
} from "#src/http/controllers/auth.controller.js";
import { LOGIN_RULES, REGISTER_RULES } from "#src/http/rules/auth.rule.js";

router.post("/login", validateRequest(LOGIN_RULES), login);

router.post("/register", validateRequest(REGISTER_RULES), register);

router.post("/logout", logout);

export default router;