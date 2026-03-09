const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/chatbot")
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// Models
const Chat = require("./models/chat");
const User = require("./models/user");


// ================= USER REGISTER =================
app.post("/register", async (req, res, next) => {

  const { email, password } = req.body;

  try {

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    res.json({ token });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }

});


// ================= USER LOGIN =================
app.post("/login", async (req, res) => {

  const { email, password } = req.body;

  try {

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    res.json({ token });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});


// ================= VERIFY TOKEN =================
const verifyToken = (req, res, next) => {

  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Access denied" });
  }

  try {

    const verified = jwt.verify(token, process.env.JWT_SECRET || "secret");

    req.user = verified;

    next();

  } catch (error) {

    res.status(400).json({ error: "Invalid token" });

  }

};


// ================= CHAT =================
app.post("/chat", verifyToken, async (req, res) => {

  const { question } = req.body;

  try {
    let answer;
    if (process.env.OPENAI_API_KEY) {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: question }]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
      answer = response.data.choices[0].message.content;
    } else {
      // Mock response for demo
      answer = `Mock response to: "${question}". Please set OPENAI_API_KEY for real AI responses.`;
    }

    const newChat = new Chat({
      question,
      answer
    });

    await newChat.save();

    res.json({ answer });

  } catch (error) {

    console.error(error);

    res.status(500).json({ error: "Internal server error" });

  }

});


// ================= GET CHAT HISTORY =================
app.get("/chats", verifyToken, async (req, res) => {

  try {

    const chats = await Chat.find().sort({ createdAt: -1 });

    res.json(chats);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

});


// ================= IMAGE GENERATION =================
app.post("/generate-image", verifyToken, async (req, res) => {

  const { prompt } = req.body;

  try {
    let imageUrl;
    if (process.env.OPENAI_API_KEY) {
      const response = await axios.post(
        "https://api.openai.com/v1/images/generations",
        {
          prompt,
          n: 1,
          size: "512x512"
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
      imageUrl = response.data.data[0].url;
    } else {
      // Mock image URL for demo
      imageUrl = "https://via.placeholder.com/512x512?text=Mock+Image";
    }

    res.json({ imageUrl });

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

});


// ================= SERVER =================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});