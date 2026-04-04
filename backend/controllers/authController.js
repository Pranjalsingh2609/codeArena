const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const users = []; // temporary storage

// Signup
exports.signup = async (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = { id: Date.now(), email, password: hashedPassword };

  users.push(user);

  res.json({ message: "User created" });
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Invalid password" });

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token });
};