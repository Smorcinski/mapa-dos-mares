module.exports = {
  mode: "production",
  devtool: false, // evita gerar sourcemap (e aquele 404 no GitHub Pages)

  output: {
    filename: "[name].js"
    // se você não gerar sourcemap, não precisa do sourceMapFilename
  },

  module: {}
};