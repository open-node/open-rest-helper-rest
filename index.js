module.exports = function(rest) {
  return rest.helper.rest = {
    detail: require('./helper/detail')(rest),
    list: require('./helper/list')(rest),
    beforeModify: require('./helper/before-modify')(rest),
    save: require('./helper/save')(rest),
    modify: require('./helper/modify')(rest),
    beforeAdd: require('./helper/before-add')(rest),
    add: require('./helper/add')(rest),
    batchAdd: require('./helper/batch-add')(rest),
    remove: require('./helper/remove')(rest),
    statistics: require('./helper/statistics')(rest)
  };
};
