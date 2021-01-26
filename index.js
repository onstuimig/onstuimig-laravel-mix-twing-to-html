const mix = require("laravel-mix");
const { dirname, basename, extname, join, sep } = require("path");

const assign = Object.assign;

class OnstuimigTwingToHtml {
  dependencies() {
    return ["html-replace-webpack-plugin", "html-webpack-plugin", "onstuimig-twing-loader", "twing"];
  }

  register(config) {
    if (!config.files || config.files.length <= 0) {
      throw new Error(
        `Missing files\nEg: mix.twingToHtml({ files: ['path/to/twigfile.twig'] })`
      );
    }
    if (!config.fileBase) {
      throw new Error(
        `Missing fileBase\nEg: mix.twingToHtml({ fileBase: ['path/to/your/twig/templates'] })`
      );
    }
    this.config = assign(
      {
        files: [],
        fileBase: undefined,
        twingOptions: null,
        htmlWebpack: null,
        enabled: true
      },
      config
    );
  }

  webpackRules() {
    if (!this.config.enabled) return;

    const options = assign(
      {
        environmentModulePath: require.resolve('./environment.js'),
        renderContext: {}
      },
      this.config.twingOptions
    );

    return {
      test: /\.twig$/,
      use: [
        {
          loader: "onstuimig-twing-loader",
          options: options
        }
      ]
    };
  }

  webpackPlugins() {
    if (!this.config.enabled) return;

    const HtmlWebpackPlugin = require("html-webpack-plugin");
    const HtmlReplaceWebpackPlugin = require("html-replace-webpack-plugin");
    const { sync } = require("globby");

    const normaliseFileConfig = files =>
      typeof files[0] === "string"
        ? sync(files).map(file => ({ template: file }))
        : typeof files[0] === "object"
        ? Object.values(files).reduce((prev, fileConfig) => {
            const paths = sync(fileConfig.template).map(file => ({
              ...fileConfig,
              template: file
            }));
            return prev.concat(paths);
          }, [])
        : [];

    const removeUnderscorePaths = config =>
      config.filter(
        item =>
          item.template
            .split("/")
            .map(chunk => chunk.startsWith("_"))
            .filter(Boolean).length === 0
      );

    const addFilename = config =>
      config.map(item => {
        const isSubPath = this.config.fileBase !== dirname(item.template);
        const prefixPath = isSubPath
          ? dirname(item.template)
              .split("/")
              .pop()
          : "";
        const newFileName = `${basename(
          item.template,
          extname(item.template)
        )}.html`;
        return {
          ...item,
          filename: join(prefixPath, newFileName)
        };
      });

    const createPages = (pages) => {
      const HtmlWebpackPluginMap = pages.map(page => {
        const options = assign(
          {
            ...page,
            hash: mix.inProduction()
          },
          this.config.htmlWebpack
        );

        return new HtmlWebpackPlugin(options);
      });
	  
      const HtmlReplaceWebpackPluginMap = pages.map(page => {
        const options = assign(
          [],
          this.config.htmlReplace
        );

        return new HtmlReplaceWebpackPlugin(options);
      });
	  
	  return Array.prototype.concat.apply(HtmlWebpackPluginMap, HtmlReplaceWebpackPluginMap);
	}
    return createPages(
      addFilename(removeUnderscorePaths(normaliseFileConfig(this.config.files)))
    );
  }

  webpackConfig(webpackConfig) {
    if (!this.config.enabled) return;
    webpackConfig.output.publicPath = ""; // Fix path issues
  }
}

mix.extend("twingToHtmlOnstuimig", new OnstuimigTwingToHtml());
