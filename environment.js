const {TwingEnvironment, TwingLoaderFilesystem} = require("twing");
 
module.exports = new TwingEnvironment(
    new TwingLoaderFilesystem('./templates')
);
