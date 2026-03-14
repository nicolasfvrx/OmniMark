module.exports = {
  sourceDir: ".",
  artifactsDir: "dist",
  build: {
    overwriteDest: true,
  },
  ignoreFiles: [
    ".github",
    ".idea",
    "*.md",
    ".gitignore",
    "web-ext-config.js",
    "package-lock.json",
    "dist",
    "signed-dist"
  ],
};
