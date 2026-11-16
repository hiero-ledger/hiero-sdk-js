const protobuf = require("protobufjs");
const staticModule = require("protobufjs-cli/targets/static-module");

module.exports = function (root, options, callback) {
  function visit(object) {
    if (object instanceof protobuf.Enum) {
      for (const name of Object.keys(object.comments)) {
        // pbjs puts value comments in the enum's @property tags. Protect
        // member tags until pbts gives each value its own comment.
        if (object.comments[name]) {
          object.comments[name] = object.comments[name].replace(/(^|\n)(\s*)@deprecated\b/g, "$1$2&#64;deprecated");
        }
      }
    }
    if (object.nestedArray) {
      object.nestedArray.forEach(visit);
    }
  }

  visit(root);
  staticModule(root, options, callback);
};
