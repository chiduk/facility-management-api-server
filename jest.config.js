module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.spec.ts"],
  collectCoverageFrom: ["**/*.ts", "!**/*.test.ts", "!**/node_modules/**"]
}