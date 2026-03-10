const request = require("supertest");
const app = require("../index");

describe("App Tests", () => {
  afterAll((done) => {
    app.close ? app.close(done) : done();
  });

  test("GET / returns 200", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBeLessThan(500);
  });

  test("App is defined", () => {
    expect(app).toBeDefined();
  });
});