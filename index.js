module.exports = function(rest) {
  return rest.helper.rest = {
    detail: require('./helper/detail')(rest),
    list: require('./helper/list')(rest)
  };
};
