var assert      = require('assert')
  , rest        = require('open-rest')
  , Sequelize   = rest.Sequelize
  , helper      = require('../')(rest);

var sequelize = new Sequelize();
var Model = sequelize.define('book', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING(100)
});

describe("open-rest-helper-rest-statistics", function() {

  describe("argument validate", function() {

    it("Model argument unset", function(done) {
      assert.throws(function() {
        helper.statistics();
      }, function(err) {
        return err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      });
      done();
    });

    it("Model argument type error", function(done) {
      assert.throws(function() {
        helper.statistics({});
      }, function(err) {
        return err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      });
      done();
    });

    it("opt argument type error", function(done) {
      assert.throws(function() {
        helper.statistics(Model, {});
      }, function(err) {
        return err instanceof Error && err.message === "FindAll option req's value path, so `opt` must be a string";
      });
      done();
    });

    it("hook argument type error", function(done) {
      assert.throws(function() {
        helper.statistics(Model, 'opt', {});
      }, function(err) {
        return err instanceof Error && err.message === 'Geted statistics data will hook on req.hooks[hook], so `hook` must be a string'
      });
      done();
    });

    it("conf argument type error", function(done) {
      assert.throws(function() {
        helper.statistics(Model, 'opt', null, {});
      }, function(err) {
        return err instanceof Error && err.message === 'Status dynamic config, req\'s value path'
      });
      done();
    });

  });

  describe('Argument validate pass', function() {

    it("normal", function(done) {
      var sequelize = new Sequelize();
      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100)
      });
      Model.includes = {
        creator: {
          model: Model,
          as: 'creator',
          required: true
        }
      };
      Model.stats = {
        dimensions: {
          user: "`creatorId`"
        },
        metrics: {
          count: 'COUNT(*)'
        },
        pagination: {
          maxResults: 20,
          maxResultsLimit: 2000,
          maxStartIndex: 50000
        }
      };
      Model.findAll = function(options) {
        assert.deepEqual({
          attributes: [
            "Date(`createdAt`) AS `date`",
            "`creatorId` AS `user`",
            "COUNT(*) AS `count`"
          ],
          where: {
            $and: [
              {id: {$gte: 200}},
              [
                "`isDelete`='no'",
                [
                  ""
                ]
              ]
            ]
          },
          group: [
            "`date`",
            "`user`"
          ],
          offset: 0,
          limit: 20,
          include: [{
            model: Model,
            as: 'creator',
            required: true,
            attributes: []
          }],
          raw: true
        }, options);
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve([{
              date: '2016-04-15',
              user: '赵思源',
              count: 100000000
            }, {
              date: '2016-04-16',
              user: '赵思鸣',
              count: 100000000
            }]);
          }, 50);
        });
      },
      Model.findOne = function(options) {
        assert.deepEqual({
          where: {
            $and: [
              {id: {$gte: 200}},
              [
                "`isDelete`='no'",
                [
                  ""
                ]
              ]
            ]
          },
          raw: true,
          include: [{
            model: Model,
            as: 'creator',
            required: true,
            attributes: []
          }],
          attributes: [
            "COUNT(DISTINCT Date(`createdAt`), `creatorId`) AS `count`"
          ]
        }, options);
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve({count: 20});
          }, 50);
        });
      };
      var req = {
        params: {
          dimensions: 'date,user',
          metrics: 'count',
          id_gte: 200,
          includes: 'creator'
        },
        hooks: {
          opt: {
            where: "`isDelete`='no'"
          },
          conf: {
            dimensions: {
              date: "Date(`createdAt`)"
            }
          }
        }
      };

      var res = {
        send: function(data) {
          assert.deepEqual([{
            date: '2016-04-15',
            user: '赵思源',
            count: 100000000
          }, {
            date: '2016-04-16',
            user: '赵思鸣',
            count: 100000000
          }], data);
        },
        header: function(key, value) {
          assert.equal('X-Content-Record-Total', key);
          assert.equal(20, value);
        }
      };
      var statistics = helper.statistics(Model, 'hooks.opt', null, 'hooks.conf');
      statistics(req, res, function(error) {
        assert.equal(null, error);
        done();
      });

    });

    it("set hook, chainning call", function(done) {
      var sequelize = new Sequelize();
      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100)
      });
      Model.includes = {
        creator: {
          model: Model,
          as: 'creator',
          required: true
        }
      };
      Model.stats = {
        dimensions: {
          user: "`creatorId`"
        },
        metrics: {
          count: 'COUNT(*)'
        },
        pagination: {
          maxResults: 20,
          maxResultsLimit: 2000,
          maxStartIndex: 50000
        }
      };
      Model.findAll = function(options) {
        assert.deepEqual({
          attributes: [
            "Date(`createdAt`) AS `date`",
            "`creatorId` AS `user`",
            "COUNT(*) AS `count`"
          ],
          where: {
            $and: [
              {id: {$gte: 200}},
              [
                "`isDelete`='no'",
                [
                  ""
                ]
              ]
            ]
          },
          group: [
            "`date`",
            "`user`"
          ],
          offset: 0,
          limit: 20,
          include: [{
            model: Model,
            as: 'creator',
            required: true,
            attributes: []
          }],
          raw: true
        }, options);
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve([{
              date: '2016-04-15',
              user: '赵思源',
              count: 100000000
            }, {
              date: '2016-04-16',
              user: '赵思鸣',
              count: 100000000
            }]);
          }, 50);
        });
      },
      Model.findOne = function(options) {
        assert.deepEqual({
          where: {
            $and: [
              {id: {$gte: 200}},
              [
                "`isDelete`='no'",
                [
                  ""
                ]
              ]
            ]
          },
          raw: true,
          include: [{
            model: Model,
            as: 'creator',
            required: true,
            attributes: []
          }],
          attributes: [
            "COUNT(DISTINCT Date(`createdAt`), `creatorId`) AS `count`"
          ]
        }, options);
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve({count: 20});
          }, 50);
        });
      };
      var req = {
        params: {
          dimensions: 'date,user',
          metrics: 'count',
          id_gte: 200,
          includes: 'creator'
        },
        hooks: {
          opt: {
            where: "`isDelete`='no'"
          },
          conf: {
            dimensions: {
              date: "Date(`createdAt`)"
            }
          }
        }
      };

      var res = {
        header: function(key, value) {
          assert.equal('X-Content-Record-Total', key);
          assert.equal(20, value);
        }
      };
      var statistics = helper
                        .statistics
                        .Model(Model)
                        .opt('hooks.opt')
                        .hook('stats')
                        .conf('hooks.conf')
                        .exec();
      statistics(req, res, function(error) {
        assert.equal(null, error);
        assert.deepEqual([{
          date: '2016-04-15',
          user: '赵思源',
          count: 100000000
        }, {
          date: '2016-04-16',
          user: '赵思鸣',
          count: 100000000
        }], req.hooks.stats);
        done();
      });

    });

    it("set hook, chainning call", function(done) {
      var sequelize = new Sequelize();
      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100)
      });
      Model.includes = {
        creator: {
          model: Model,
          as: 'creator',
          required: true
        }
      };
      Model.stats = {
        dimensions: {
          user: "`creatorId`"
        },
        metrics: {
          count: 'COUNT(*)'
        },
        pagination: {
          maxResults: 20,
          maxResultsLimit: 2000,
          maxStartIndex: 50000
        }
      };
      Model.findAll = function(options) {
        assert.deepEqual({
          attributes: [
            "Date(`createdAt`) AS `date`",
            "`creatorId` AS `user`",
            "COUNT(*) AS `count`"
          ],
          where: {
            $and: [
              {id: {$gte: 200}},
              [
                "`isDelete`='no'",
                [
                  ""
                ]
              ]
            ]
          },
          group: [
            "`date`",
            "`user`"
          ],
          offset: 0,
          limit: 20,
          include: [{
            model: Model,
            as: 'creator',
            required: true,
            attributes: []
          }],
          raw: true
        }, options);
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve([{
              date: '2016-04-15',
              user: '赵思源',
              count: 100000000
            }, {
              date: '2016-04-16',
              user: '赵思鸣',
              count: 100000000
            }]);
          }, 50);
        });
      },
      Model.findOne = function(options) {
        assert.deepEqual({
          where: {
            $and: [
              {id: {$gte: 200}},
              [
                "`isDelete`='no'",
                [
                  ""
                ]
              ]
            ]
          },
          raw: true,
          include: [{
            model: Model,
            as: 'creator',
            required: true,
            attributes: []
          }],
          attributes: [
            "COUNT(DISTINCT Date(`createdAt`), `creatorId`) AS `count`"
          ]
        }, options);
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve({count: 20});
          }, 50);
        });
      };
      var req = {
        params: {
          dimensions: 'date,user',
          metrics: 'count',
          id_gte: 200,
          includes: 'creator'
        },
        hooks: {
          opt: {
            where: "`isDelete`='no'"
          },
          conf: {
            dimensions: {
              date: "Date(`createdAt`)"
            }
          }
        }
      };

      var res = {
        header: function(key, value) {
          assert.equal('X-Content-Record-Total', key);
          assert.equal(20, value);
        }
      };
      var statistics = helper
                        .statistics
                        .Model(Model)
                        .opt('hooks.opt')
                        .hook('stats')
                        .conf('hooks.conf')
                        .exec();
      statistics(req, res, function(error) {
        assert.equal(null, error);
        assert.deepEqual([{
          date: '2016-04-15',
          user: '赵思源',
          count: 100000000
        }, {
          date: '2016-04-16',
          user: '赵思鸣',
          count: 100000000
        }], req.hooks.stats);
        done();
      });

    });

    it("happen error", function(done) {
      var sequelize = new Sequelize();
      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100)
      });
      Model.includes = {
        creator: {
          model: Model,
          as: 'creator',
          required: true
        }
      };
      Model.stats = {
        dimensions: {
          user: "`creatorId`"
        },
        metrics: {
          count: 'COUNT(*)'
        },
        pagination: {
          maxResults: 20,
          maxResultsLimit: 2000,
          maxStartIndex: 50000
        }
      };
      Model.findAll = function(options) {
        assert.deepEqual({
          attributes: [
            "Date(`createdAt`) AS `date`",
            "`creatorId` AS `user`",
            "COUNT(*) AS `count`"
          ],
          where: {
            $and: [
              {id: {$gte: 200}},
              [
                "`isDelete`='no'",
                [
                  ""
                ]
              ]
            ]
          },
          group: [
            "`date`",
            "`user`"
          ],
          offset: 0,
          limit: 20,
          include: [{
            model: Model,
            as: 'creator',
            required: true,
            attributes: []
          }],
          raw: true
        }, options);
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            reject(Error('Hello world'));
          }, 50);
        });
      },
      Model.findOne = function(options) {
        assert.deepEqual({
          where: {
            $and: [
              {id: {$gte: 200}},
              [
                "`isDelete`='no'",
                [
                  ""
                ]
              ]
            ]
          },
          raw: true,
          include: [{
            model: Model,
            as: 'creator',
            required: true,
            attributes: []
          }],
          attributes: [
            "COUNT(DISTINCT Date(`createdAt`), `creatorId`) AS `count`"
          ]
        }, options);
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve({count: 20});
          }, 50);
        });
      };
      var req = {
        params: {
          dimensions: 'date,user',
          metrics: 'count',
          id_gte: 200,
          includes: 'creator'
        },
        hooks: {
          opt: {
            where: "`isDelete`='no'"
          },
          conf: {
            dimensions: {
              date: "Date(`createdAt`)"
            }
          }
        }
      };

      var res = {
        header: function(key, value) {
          assert.equal('X-Content-Record-Total', key);
          assert.equal(20, value);
        }
      };
      var statistics = helper
                        .statistics
                        .Model(Model)
                        .opt('hooks.opt')
                        .hook('stats')
                        .conf('hooks.conf')
                        .exec();
      statistics(req, res, function(error) {
        assert.ok(error instanceof Error);
        assert.equal('Hello world', error.message);
        done();
      });

    });

  });

});
