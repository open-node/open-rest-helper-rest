var assert      = require('assert')
  , rest        = require('open-rest')
  , Sequelize   = rest.Sequelize
  , utils       = require('../lib/utils');

describe('utils', function() {
  describe('#searchOpt', function() {
    var Model = {
      name: 'user',
      searchCols: {
        name: {
          op: 'LIKE',
          match: ['%{1}%']
        },
        email: {
          op: 'LIKE',
          match: ['%{1}%']
        },
        id: {
          op: '=',
          match: ['{1}']
        }
      }
    };

    it("normal", function(done) {
      var except = [
        ["((`user`.`name` LIKE '%a%'))"],
        ["((`user`.`email` LIKE '%a%'))"],
        ["((`user`.`id` = 'a'))"]
      ];
      var real = utils.searchOpt(Model, '', 'a');
      assert.deepEqual(except, real);
      done();
    });

    it("mutil keyword", function(done) {
      var except = [
        [
          '((`user`.`name` LIKE \'%a%\'))',
          '((`user`.`name` LIKE \'%b%\'))'
        ],
        [
          '((`user`.`email` LIKE \'%a%\'))',
          '((`user`.`email` LIKE \'%b%\'))'
        ],
        [
          '((`user`.`id` = \'a\'))',
          '((`user`.`id` = \'b\'))'
        ]
      ];
      var real = utils.searchOpt(Model, '', 'a b');
      assert.deepEqual(except, real);
      done();
    });

    it("mutil match, single keyword", function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['{1}', '%,{1}', '{1},%', '%,{1},%']
          },
          email: {
            op: 'LIKE',
            match: ['%{1}%']
          },
          id: {
            op: '=',
            match: ['{1}']
          }
        }
      };
      var except = [
        [
          '((`user`.`name` LIKE \'a\') OR (`user`.`name` LIKE \'%,a\') OR (`user`.`name` LIKE \'a,%\') OR (`user`.`name` LIKE \'%,a,%\'))',
          '((`user`.`name` LIKE \'b\') OR (`user`.`name` LIKE \'%,b\') OR (`user`.`name` LIKE \'b,%\') OR (`user`.`name` LIKE \'%,b,%\'))'
        ],
        [
          '((`user`.`email` LIKE \'%a%\'))',
          '((`user`.`email` LIKE \'%b%\'))'
        ],
        [
          '((`user`.`id` = \'a\'))',
          '((`user`.`id` = \'b\'))'
        ]
      ];

      var real = utils.searchOpt(Model, '', 'a b');
      assert.deepEqual(except, real);
      done();
    });

    it("container single quote", function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var except = [
        ["((`user`.`name` LIKE '%a\\\'%'))"]
      ];
      var real = utils.searchOpt(Model, '', "a'");
      assert.deepEqual(except, real);
      done();
    });
  });

  describe('#mergeSearchOrs', function() {
    it('single searchOpt result', function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var except = "((((`user`.`name` LIKE '%a%'))))";
      var real = utils.mergeSearchOrs([utils.searchOpt(Model, '', "a")]);
      assert.deepEqual(except, real);
      done();
    });

    it('single searchOpt, mutil keyword result', function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var except = "((((`user`.`name` LIKE '%a%'))) AND (((`user`.`name` LIKE '%b%'))))";
      var real = utils.mergeSearchOrs([utils.searchOpt(Model, '', "a b")]);
      assert.deepEqual(except, real);
      done();
    });

    it('mutil searchOpt, single keyword result', function(done) {
      var Model1 = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var Model2 = {
        name: 'book',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var except = "((((`user`.`name` LIKE '%a%')) OR ((`book`.`name` LIKE '%a%'))))";
      var real = utils.mergeSearchOrs([
        utils.searchOpt(Model1, '', "a"),
        utils.searchOpt(Model2, '', "a")
      ]);
      assert.deepEqual(except, real);
      done();
    });

    it('mutil searchOpt, mutil keyword result', function(done) {
      var Model1 = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var Model2 = {
        name: 'book',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var except = "((((`user`.`name` LIKE '%a%')) OR ((`book`.`name` LIKE '%a%'))) AND (((`user`.`name` LIKE '%b%')) OR ((`book`.`name` LIKE '%b%'))))";
      var real = utils.mergeSearchOrs([
        utils.searchOpt(Model1, '', "a b"),
        utils.searchOpt(Model2, '', "a b")
      ]);
      assert.deepEqual(except, real);
      done();
    });
  });

  describe('#findOptFilter', function() {
    it("The 4th argument col unset", function(done) {
      var params, where = {};
      params = {
        name: 'hello',
        names: 'zhangsan,lisi,wangwu',
        'name!': 'zhaoliu',
        'names!': 'wangqi,houba',
        address_like: '北京*',
        address_notLike: '*昌平*',
        age_gte: 20,
        age_lte: '30'
      };
      utils.findOptFilter(params, 'name', where);

      assert.deepEqual({
        name: {
          $eq: 'hello',
          $in: ['zhangsan', 'lisi', 'wangwu'],
          $not: ['wangqi', 'houba'],
          $ne: 'zhaoliu'
        }
      }, where);

      utils.findOptFilter(params, 'age', where);
      assert.deepEqual({
        name: {
          $eq: 'hello',
          $in: ['zhangsan', 'lisi', 'wangwu'],
          $not: ['wangqi', 'houba'],
          $ne: 'zhaoliu'
        },
        age: {
          $gte: 20,
          $lte: '30'
        }
      }, where);

      utils.findOptFilter(params, 'address', where);
      assert.deepEqual({
        name: {
          $eq: 'hello',
          $in: ['zhangsan', 'lisi', 'wangwu'],
          $not: ['wangqi', 'houba'],
          $ne: 'zhaoliu'
        },
        age: {
          $gte: 20,
          $lte: '30'
        },
        address: {
          $like: '北京%',
          $notLike: '%昌平%'
        }
      }, where);

      done();
    });

    it("col set", function(done) {
      var params = {
        name: '.null.',
        'email!': '.null.',
        age: 20,
        genders: 'male,female',
        'addresss!': '北七家,天通苑'
      };
      var where = {};
      utils.findOptFilter(params, 'name', where, 'personName');
      assert.deepEqual({
        personName: {
          $eq: null
        }
      }, where);

      utils.findOptFilter(params, 'email', where, 'personEmail');
      assert.deepEqual({
        personName: {
          $eq: null
        },
        personEmail: {
          $ne: null
        }
      }, where);

      utils.findOptFilter(params, 'age', where);
      assert.deepEqual({
        personName: {
          $eq: null
        },
        personEmail: {
          $ne: null
        },
        age: {
          $eq: 20
        }
      }, where);

      utils.findOptFilter(params, 'gender', where);
      assert.deepEqual({
        personName: {
          $eq: null
        },
        personEmail: {
          $ne: null
        },
        age: {
          $eq: 20
        },
        gender: {
          $in: ['male', 'female']
        }
      }, where);

      utils.findOptFilter(params, 'address', where);
      assert.deepEqual({
        personName: {
          $eq: null
        },
        personEmail: {
          $ne: null
        },
        age: {
          $eq: 20
        },
        gender: {
          $in: ['male', 'female']
        },
        address: {
          $not: ['北七家', '天通苑']
        }
      }, where);

      params.parent_like = '*@xiongfei.me';
      utils.findOptFilter(params, 'parent', where);
      assert.deepEqual({
        personName: {
          $eq: null
        },
        personEmail: {
          $ne: null
        },
        age: {
          $eq: 20
        },
        gender: {
          $in: ['male', 'female']
        },
        address: {
          $not: ['北七家', '天通苑']
        },
        parent: {
          $like: '%@xiongfei.me'
        }
      }, where);

      params['parent!'] = 'haha@xiongfei.me';
      utils.findOptFilter(params, 'parent', where);
      assert.deepEqual({
        personName: {
          $eq: null
        },
        personEmail: {
          $ne: null
        },
        age: {
          $eq: 20
        },
        gender: {
          $in: ['male', 'female']
        },
        address: {
          $not: ['北七家', '天通苑']
        },
        parent: {
          $like: '%@xiongfei.me',
          $ne: 'haha@xiongfei.me'
        }
      }, where);

      params.friend_notLike = '%@qq.com';
      utils.findOptFilter(params, 'friend', where);
      assert.deepEqual({
        personName: {
          $eq: null
        },
        personEmail: {
          $ne: null
        },
        age: {
          $eq: 20
        },
        gender: {
          $in: ['male', 'female']
        },
        address: {
          $not: ['北七家', '天通苑']
        },
        parent: {
          $like: '%@xiongfei.me',
          $ne: 'haha@xiongfei.me'
        },
        friend: {
          $notLike: '%@qq.com'
        }
      }, where);

      done();
    });

    it("params unset", function(done) {
      assert.equal(undefined, utils.findOptFilter());

      done();
    });

    it("params no object", function(done) {
      assert.equal(undefined, utils.findOptFilter('hello world'));

      done();
    });

    it("$eq where[col] already exists", function(done) {
      var params = {
        name: 'zhaoxiongfei',
        age: 30
      };
      var where = {
        name: {
          $ne: 'StonePHP'
        },
        age: {
          $gte: 20
        }
      };
      utils.findOptFilter(params, 'name', where);
      utils.findOptFilter(params, 'age', where);
      assert.deepEqual({
        name: {
          $ne: 'StonePHP',
          $eq: 'zhaoxiongfei'
        },
        age: {
          $gte: 20,
          $eq: 30
        }
      }, where);

      done();
    });

  });

  describe('#findOpts', function() {
    it("normal", function(done) {
      var sequelize = new Sequelize();
      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100),
        isDelete: Sequelize.ENUM('yes', 'no')
      });
      var params = {
        showDelete: 'yes'
      };

      var opts = utils.findAllOpts(Model, params);
      assert.deepEqual({
        include: undefined,
        order: undefined,
        offset: 0,
        limit: 10
      }, opts);

      params = {
        name: 'hi'
      };

      opts = utils.findAllOpts(Model, params);
      assert.deepEqual({
        include: undefined,
        order: undefined,
        where: {
          name: {
            $eq: 'hi'
          },
          isDelete: 'no'
        },
        offset: 0,
        limit: 10
      }, opts);

      done();
    });
  });

});
