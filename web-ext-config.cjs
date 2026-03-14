module.exports = {
  sourceDir: ".",
  artifactsDir: "dist",
  build: {
    overwriteDest: true,
  },
  sign: {
    channel: "listed",
    license: "MIT",
  },
  ignoreFiles: [
    ".github",
    ".idea",
    "*.md",
    ".gitignore",
    "web-ext-config.cjs",
    "package-lock.json",
    "dist",
    "signed-dist"
  ],
};
