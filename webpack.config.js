var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    'dep': './src_examples/dependencies.ts',
    'app': './src_examples/main.ts'
  },

  output: {
    path: 'examples',
    filename: '[name].js',
    chunkFilename: '[id].chunk.js'
  },

  resolve: {
    root: [path.resolve(__dirname + "./src")],

    extensions: ['', '.js', '.ts', '.css'],
  },

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: 'ts'
      },
      {
        test: /\.css$/,
        loader: 'raw'
      },
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: 'src_examples/index.html'
    })
  ]
};
