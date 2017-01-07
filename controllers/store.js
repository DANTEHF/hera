/**
 * Created by seal on 05/01/2017.
 */


const Project = require('../models/Project');
const StockRecord = require('../models/StockRecord');
const ObjectId = require('mongoose').Types.ObjectId;

exports.index = (req, res, next) => {


  if (res.locals.current && res.locals.current.type == '基地仓库') {
    const projectId = req.query['project'] || '';

    if (projectId) {
      Project.find().then(projects => {
        res.locals.projects = projects;
        return StockRecord.aggregate([
          {
            $match: {outStock: ObjectId(projectId)},
          },
          {
            $unwind: '$entries'
          },
          {
            $group: {
              _id: {
                name: '$entries.name',
                size: '$entries.size'
              },
              sum: {
                $sum: '$entries.count'
              }
            }
          }
        ]);
      }).then(result => {
        res.locals.outRecords = result;
        return StockRecord.aggregate([
          {
            $match: {inStock: ObjectId(projectId)},
          },
          {
            $unwind: '$entries'
          },
          {
            $group: {
              _id: {
                name: '$entries.name',
                size: '$entries.size'
              },
              sum: {
                $sum: '$entries.count'
              }
            }
          }
        ])
      }).then(result => {
        res.locals.inRecords = result;

        const outRecords = res.locals.outRecords.map(record => {
          return {
            name: record._id.name,
            size: record._id.size,
            sum: record.sum
          };
        });

        const inRecords = res.locals.inRecords.map(record => {
          return {
            name: record._id.name,
            size: record._id.size,
            sum: record.sum
          };
        });

        let store = {};
        outRecords.forEach(record => {
          const key = record.name + record.size;
          store[key] = {
            name: record.name,
            size: record.size,
            sum: -record.sum
          };
        });
        inRecords.forEach(record => {
          const key = record.name + record.size;
          if (key in store) {
            store[key].sum += record.sum;
          } else {
            store[key] = {
              name: record.name,
              size: record.size,
              sum: record.sum
            };
          }
        });
        res.locals.store = store;

        return Project.findById(projectId);
      }).then(project => {
        res.locals.project = project;
        beforeRender(res);
        res.render('store/index');
      });


    } else {
      Project.find().then(projects => {
        beforeRender(res);
        res.render('store/index', {
          projects
        });
      });
    }
  } else if (res.locals.current && res.locals.current.type == '项目部仓库') {
    StockRecord.aggregate([
      {
        $match: {outStock: ObjectId(res.locals.current._id)},
      },
      {
        $unwind: '$entries'
      },
      {
        $group: {
          _id: {
            name: '$entries.name',
            size: '$entries.size'
          },
          sum: {
            $sum: '$entries.count'
          }
        }
      }
    ]).then(result => {
      res.locals.outRecords = result;
      return StockRecord.aggregate([
        {
          $match: {inStock: ObjectId(res.locals.current._id)},
        },
        {
          $unwind: '$entries'
        },
        {
          $group: {
            _id: {
              name: '$entries.name',
              size: '$entries.size'
            },
            sum: {
              $sum: '$entries.count'
            }
          }
        }
      ])
    }).then(result => {
      res.locals.inRecords = result;

      const outRecords = res.locals.outRecords.map(record => {
        return {
          name: record._id.name,
          size: record._id.size,
          sum: record.sum
        };
      });

      const inRecords = res.locals.inRecords.map(record => {
        return {
          name: record._id.name,
          size: record._id.size,
          sum: record.sum
        };
      });

      let store = {};
      outRecords.forEach(record => {
        const key = record.name + record.size;
        store[key] = {
          name: record.name,
          size: record.size,
          sum: -record.sum
        };
      });
      inRecords.forEach(record => {
        const key = record.name + record.size;
        if (key in store) {
          store[key].sum += record.sum;
        } else {
          store[key] = {
            name: record.name,
            size: record.size,
            sum: record.sum
          };
        }
      });
      res.locals.store = store;


      res.locals.project = res.locals.current;
      beforeRender(res);
      res.render('store/index');
    });
  }
};

function beforeRender(res) {
  const productTypes = global.companyData.productTypes;
  let inRecords = res.locals.inRecords || [];
  let outRecords = res.locals.outRecords || [];
  let store = res.locals.store || {};

  let inRecordMap = {};
  inRecords.forEach(inRecord => {
    inRecordMap[inRecord._id.name + inRecord._id.size] = inRecord;
  });
  inRecords = [];
  productTypes.forEach(productType => {
    productType.sizes.forEach(size => {
      const key = productType.name + size;
      if (key in inRecordMap) {
        inRecords.push(inRecordMap[key]);
      }
    });
  });
  res.locals.inRecords = inRecords;

  let outRecordMap = {};
  outRecords.forEach(outRecord => {
    outRecordMap[outRecord._id.name + outRecord._id.size] = outRecord;
  });
  outRecords = [];
  productTypes.forEach(productType => {
    productType.sizes.forEach(size => {
      const key = productType.name + size;
      if (key in outRecordMap) {
        outRecords.push(outRecordMap[key]);
      }
    });
  });
  res.locals.outRecords = outRecords;

  let storeMap = store;
  store = [];
  productTypes.forEach(productType => {
    productType.sizes.forEach(size => {
      const key = productType.name + size;
      if (key in storeMap) {
        store.push(storeMap[key]);
      }
    });
  });
  res.locals.store = store;
}
