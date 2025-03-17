import { Router } from "express";
import { UsuarioController } from "../controllers/usuario.controller.js";
import { verifyToken, verifyAdmin } from "../middlewares/jwt.middleware.js";

const router = Router();

router.post("/register", UsuarioController.register);

router.post("/login", UsuarioController.login);

router.get("/all-users", verifyToken, verifyAdmin, UsuarioController.getAllUsers);

router.post("/assign-role", verifyToken, verifyAdmin, UsuarioController.assignRoleUser);

router.post("/delete-user", verifyToken, verifyAdmin, UsuarioController.deleteUser);

export default router;