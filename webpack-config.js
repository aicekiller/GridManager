const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const getRules = require('./webpack-common.loader');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CleanPlugin = require('clean-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const { name, version } = require('./package.json');
const buildPath = path.join(__dirname, './dist');

const srcDir = path.join(__dirname, './src');
// API: https://www.css88.com/doc/webpack2/configuration/devtool/
const config = {
    mode: 'production',

	// 入口文件所在的上下文
	context: srcDir,

	// 入口文件配置
	entry: {
        gm: './module/index.js'
	},

	// 配置模块如何解析
	resolve: {
		extensions: ['.js'], // 当requrie的模块找不到时,添加这些后缀
        alias: {
            '@common': path.join(__dirname, './src/common'),
            '@jTool': path.join(__dirname, './src/jTool'),
            '@module': path.join(__dirname, './src/module')
        }
	},

	// 文件导出的配置
	output: {
		path: buildPath,
		filename: 'js/gm.js',

        // 通过script标签引入时，由index.js中设置的window.GridManager将被覆盖为{default: {..gm object}}。原因是通过library设置所返回的值为{default: {..gm object}}
        // library: 'GridManager', // 引入后可以通过全局变量GridManager来使用

        // 允许与CommonJS，AMD和全局变量一起使用。
        // 如: `import gridManager from 'gridmanager';` `const gridManager = require('gridmanager').default;`
        libraryTarget: 'umd'
	},

    // 优化代码
    optimization: {
        minimizer: [
            // 压缩js
            new UglifyJsPlugin({
                uglifyOptions: {
                    cache: true,
                    parallel: true,
                    sourceMap: true,
                    warnings: false
                }
            }),

            // 压缩css
            new OptimizeCssAssetsPlugin({
                assetNameRegExp: /\.css$/g,
                cssProcessor: require('cssnano'),
                cssProcessorOptions: {
                    discardComments: {removeAll: true},
                    minifyGradients: true
                },
                canPrint: true
            })
        ]
    },

	// 以插件形式定制webpack构建过程
	plugins: [
        new CleanPlugin([buildPath]),
        // 将样式文件 抽取至独立文件内
        new MiniCssExtractPlugin({
            filename: 'css/gm.css',
            chunkFilename: '[id].css'
        }),

        // 将文件复制到构建目录
		// CopyWebpackPlugin-> https://github.com/webpack-contrib/copy-webpack-plugin
		new CopyWebpackPlugin([
            {from: __dirname + '/src/demo', to: 'demo'},
			{from: path.join(__dirname, '/package.json'), to: '', toType: 'file'},
			{from: path.join(__dirname, '/README.md'), to: '', toType: 'file'}
		]),

        // 配置环境变量
        new webpack.DefinePlugin({
            'process.env': {
                VERSION: JSON.stringify(version)
            }
        }),

        // 构建带版本号的zip包
        new FileManagerPlugin({
            onStart: {
                delete: [
                    './zip'
                ]
            },
            onEnd: {
                mkdir: ['./zip', './tempzip'],
                copy: [{
                    source: './dist/**/*.{html,css,js}',
                    destination: `./tempzip/${name}-${version}/`
                }],
                archive: [
                    {source: `./tempzip/${name}-${version}`, destination: `./zip/${name}-${version}.zip`}
                ],
                delete: [
                    './tempzip'
                ]
            }
        })
	],

	// 处理项目中的不同类型的模块。
	module: {
        rules: getRules()
	}
};

module.exports = config;
