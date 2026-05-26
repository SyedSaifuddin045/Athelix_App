const React = require("react");
const { Text } = require("react-native");

function Feather({ name, size, color }) {
  return React.createElement(Text, null, `Feather:${name || ""}`);
}

function Ionicons({ name, size, color }) {
  return React.createElement(Text, null, `Ionicons:${name || ""}`);
}

function MaterialCommunityIcons({ name, size, color }) {
  return React.createElement(Text, null, `MaterialCommunityIcons:${name || ""}`);
}

module.exports = { Feather, Ionicons, MaterialCommunityIcons };
module.exports.default = { Feather, Ionicons, MaterialCommunityIcons };
