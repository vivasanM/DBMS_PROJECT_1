const express = require("express");
const router = express.Router();
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
} = require("../controllers/userController");

// Routes
router.post("/", createUser);      // POST /users
router.get("/", getUsers);         // GET /users
router.get("/:id", getUserById);   // GET /users/:id
router.put("/:id", updateUser);    // PUT /users/:id
router.delete("/:id", deleteUser); // DELETE /users/:id
router.post("/login", loginUser); // GET /users/login

module.exports = router;
