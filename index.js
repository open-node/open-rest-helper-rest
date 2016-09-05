module.exports = function(rest) {
  return rest.helper.rest = {
    list: require('./helper/list')(rest)
  };
};
