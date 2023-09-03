const path = require("path");

module.exports = {
  entry: "./app.js", // Adjust the entry point based on your project structure
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"), // Adjust the output path as needed
  },
  target: "node", // Set the target to Node.js
  // Add loaders and plugins as per your project's requirements
};
