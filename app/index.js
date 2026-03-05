// Main Application Entry Point
// Author: Emmanuel Ubani - Cloud & DevOps Engineer

require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || "1.0.0",
    author: "Emmanuel Ubani",
    environment: process.env.NODE_ENV || "development",
  });
});

// Home Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Emmanuel Ubani's CI/CD Demo App",
    description: "Production grade CI/CD pipeline using GitHub Actions",
    stack: [
      "Node.js",
      "Docker",
      "GitHub Actions",
      "AWS ECR",
      "AWS ECS"
    ],
    links: {
      github: "https://github.com/Eaglewings966",
      linkedin: "https://www.linkedin.com/in/ubaniemmanuel",
      portfolio: "https://ops-run.lovable.app"
    }
  });
});

// API Routes
app.get("/api/v1/status", (req, res) => {
  res.status(200).json({
    status: "operational",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `The route ${req.originalUrl} does not exist`
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal server error",
    message: err.message
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`👤 Author: Emmanuel Ubani - Cloud & DevOps Engineer`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app; 