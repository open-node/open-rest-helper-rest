const detail = require('./helper/detail');
const list = require('./helper/list');
const beforeModify = require('./helper/before-modify');
const save = require('./helper/save');
const modify = require('./helper/modify');
const beforeAdd = require('./helper/before-add');
const add = require('./helper/add');
const batchAdd = require('./helper/batch-add');
const remove = require('./helper/remove');
const statistics = require('./helper/statistics');

module.exports = (rest) => {
  rest.helper.rest = {
    detail: detail(rest),
    list: list(rest),
    beforeModify: beforeModify(rest),
    save: save(rest),
    modify: modify(rest),
    beforeAdd: beforeAdd(rest),
    add: add(rest),
    batchAdd: batchAdd(rest),
    remove: remove(rest),
    statistics: statistics(rest),
  };
  return rest.helper.rest;
};
