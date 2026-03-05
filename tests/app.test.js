// Application Tests
// Author: Emmanuel Ubani - Cloud & DevOps Engineer

const request = require("supertest");
const app = require("../app/index");

describe("Application Tests", () => {
  // Test 1 - Health Check
  describe("GET /health", () => {
    it("should return 200 and healthy status", async () => {
      const response = await request(app)
        .get("/health")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.status).toBe("healthy");
      expect(response.body.author).toBe("Emmanuel Ubani");
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBeDefined();
    });
  });

  // Test 2 - Home Route
  describe("GET /", () => {
    it("should return 200 and welcome message", async () => {
      const response = await request(app)
        .get("/")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.message).toBeDefined();
      expect(response.body.stack).toContain("Node.js");
      expect(response.body.stack).toContain("Docker");
      expect(response.body.links.github).toBeDefined();
      expect(response.body.links.linkedin).toBeDefined();
    });
  });

  // Test 3 - API Status Route
  describe("GET /api/v1/status", () => {
    it("should return 200 and operational status", async () => {
      const response = await request(app)
        .get("/api/v1/status")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.status).toBe("operational");
      expect(response.body.uptime).toBeDefined();
      expect(response.body.memory).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  // Test 4 - 404 Handler
  describe("GET /nonexistent", () => {
    it("should return 404 for unknown routes", async () => {
      const response = await request(app)
        .get("/nonexistent-route")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body.error).toBe("Route not found");
      expect(response.body.message).toBeDefined();
    });
  });
});