// auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const { generateAccessToken } = require("../utils/jwt");

const router = express.Router();

const users = [
  {
    id: 1,
    username: "exampleUser",
    password: "$2b$10$gxzYYMYMLgzzlEV7/2J3RO6PYL0kZnbhACm.Y8VpgvBy3.XSz8.2C",
  },
];

router.post("/signup", (req, res) => {
  const { username, password, email } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  const user = {
    id: users.length + 1,
    username,
    email,
    password: hashedPassword,
  };

  users.push(user);

  const accessToken = generateAccessToken({
    username,
    email,
    id: user.id,
  });

  res.json({ accessToken });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = generateAccessToken({
    email: user.email,
    id: user.id,
  });

  res.json({ accessToken });
});

module.exports = router;
