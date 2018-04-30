/**
 * Created by seal on 05/01/2017.
 */
const Project = require('../models').Project;
const Record = require('../models').Record;
const ObjectId = require('mongoose').Types.ObjectId;
const Price = require('../models').Price
const service = require('../service')
const mongoose = require('mongoose')
const moment = require('moment')

/**
 * 查询指定 project 的库存
 * @param projectId
 */

function queryAll(projectId, params) {
  return Record.aggregate([
    {
      $match: {
        outStock: ObjectId(projectId),
        outDate: {
          $gte: new Date(params.startDate),
          $lt: new Date(params.endDate)
        }
      },
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
  ]).then(outRecords => {
    console.log(outRecords)
    return Promise.all([Record.aggregate([
      {
        $match: {
          inStock: ObjectId(projectId),
          outDate: {
            $gte: new Date(params.startDate),
            $lt: new Date(params.endDate)
          }
        },
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
    ]), outRecords])
  })
}

exports.queryAll = (req, res, next) => {
  let condition = req.query['condition']
  if (!condition) {
    return res.status(400).json({
      message: '错误的请求格式'
    })
  }
  if (req.params.id) {
    const params = JSON.parse(condition)
    queryAll(req.params.id, params).then(([inRecords, outRecords]) => {
      service.refreshStockCache(req.params.id, inRecords, outRecords)
      res.json({
        message: '查询成功',
        data   : {
          inRecords,
          outRecords
        }
      })
    }).catch(err => {
      next(err)
    })
  } else {
    res.status(400).json({
      message: '错误的请求格式'
    })
  }
}

/**
 *
 * 按条件搜索仓库信息
 * query.condition 是一个 JSON 字符串
 *
 */
exports.search = (req, res, next) => {
  let condition = req.query['condition']

  if (condition) {
    condition = JSON.parse(condition)

    let match = {
      outDate: {
        $gte: new Date(condition.startDate),
        $lt: new Date(condition.endDate)
      },
      'entries.count': {
        $gte: 0
      }
    }

    // 记录类型
    if (condition.type) {
      match['type'] = condition.type
    }

    // 约束最小数量
    if (condition.startCount) {
      match['entries.count']['$gte'] = Number(condition.startCount)
    }

    // 约束最大数量
    if (condition.endCount) {
      match['entries.count']['$lte'] = Number(condition.endCount)
    }

    // 根据名称
    if (condition.name) {
      match['entries.name'] = condition.name

      // 根据规格
      if (condition.size) {
        match['entries.size'] = condition.size
      }
    }

    if (condition.outStock) {
      match['outStock'] = ObjectId(condition.outStock)
    }

    if (condition.inStock) {
      match['inStock'] = ObjectId(condition.inStock)
    }

    Record.aggregate([
      {
        $unwind: '$entries'
      },
      {
        $match: match
      },
      {
        $project: {
          // 默认包含了id
          outStock: '$outStock',
          inStock: '$inStock',
          outDate: '$outDate',
          name: '$entries.name',
          size: '$entries.size',
          count: '$entries.count',
          number: '$number',
          type: '$type',
          vendor: '$vendor'
          //recordId: '$recordId'
        }
      }
    ]).then(search => {
      res.json({
        message: '查询成功！',
        data: {
          search
        }
      })

    }).catch(err => {
      next(err)
    })
  } else {
    res.status(400).json({
      message: '错误的请求格式'
    })
  }
}

/**
 *
 * 主要根据对方单位名称搜索仓库信息
 *
 * query.condition 是一个 JSON 字符串
 *
 * 包含字段
 * self: 表示当前仓库
 * other：表示对方单位、仓库
 * startDate: 开始时间
 * endDate: 结束时间
 *
 */
exports.simpleSearch = (req, res, next) => {
  let condition = req.query['condition']

  if (condition) {
    condition = JSON.parse(condition)

    if (!condition.self) {
      return res.status(400).json({
        message: '请求的参数不正确！'
      })
    }

    let match = {
      outDate: {
        $gte: new Date(condition.startDate),
        $lt: new Date(condition.endDate)
      }
    }

    // 查询运输单
    if (condition.hasTransport) {
      match['hasTransport'] = true
    }

    // 查询车号
    if (condition.carNumber) {
      match['carNumber'] = condition.carNumber
    }

    // 查询收款人
    if (condition.payee) {
      match['transport.payee'] = condition.payee
    }

    // 查询付款方
    if (condition.payer) {
      match['transport.payer'] = condition.payer
    }

    // 查询原始单号
    if (condition.originalOrder) {
      match['originalOrder'] = condition.originalOrder
    }

    let id, vendor
    if (condition.other) {
      // 使用 try catch 来判断是不是 store
      try {
        id = ObjectId(condition.other)
      } catch (e) {
        // 不能转换成 ObjectId 则是vendor
        vendor = condition.other
      }
    }

    // 需要查询对方仓库 调拨单
    if (id) {
      match['$or'] = [
        { outStock: id, inStock: ObjectId(condition.self) },
        { inStock: id, outStock: ObjectId(condition.self) },
      ]
      // 如果是公司角度搜索，不加限制条件
      if (condition.company) {
        match['$or'] = [
          { outStock: id },
          { inStock: id },
        ]
      }
    } else {
      // 如果不是公司角度搜索，加限制条件
      if (!condition.company) {
        match['$or'] = [
          { inStock: ObjectId(condition.self) },
          { outStock: ObjectId(condition.self) },
        ]
      }
    }

    // 需要查询对方单位 采购销售
    if (vendor) {
      match['vendor'] = vendor
    }

    // 查询单号 当按单号查询的时候，忽略其他条件
    if (condition.number) {
      match = {
        number: Number(condition.number)
      }
    }

    Record.aggregate([
      {
        $match: match
      }
    ]).then(search => {
      res.json({
        message: '查询成功！',
        data: {
          search
        }
      })

    }).catch(err => {
      next(err)
    })
  } else {
    res.status(400).json({
      message: '错误的请求格式'
    })
  }
}

const doRent = async ({startDate, endDate, timezone, project, pricePlanId}) => {
  return Record.aggregate([
    {
      $match: {
        $or: [
          {
            inStock: project
          },
          {
            outStock: project
          }
        ],
        outDate: {
          $lt: endDate,
        }
      }
    },
    {
      $addFields: {
        history: {
          $lt: ['$outDate', startDate]
        },
      }
    },
    {
      $addFields: {
        outDate: {
          $cond: {
            if: '$history',
            then: startDate,
            else: '$outDate',
          },
        },
        inOut: {
          $cond: {
            if: {
              $eq: ['$inStock', project]
            },
            then: 1,
            else: -1
          }
        }
      }
    },
    {
      $unwind: '$entries'
    },
    {
      $lookup: {
        from: 'products',
        localField: 'entries.number',
        foreignField: 'number',
        as: 'products',
      }
    },
    {
      $unwind: '$products'
    },
    {
      $addFields: {
        days: {
          $let: {
            vars: {
              outDays: {
                $dayOfYear: {
                  date: '$outDate',
                  timezone: timezone,
                }
              },
              endDays: {
                $dayOfYear: {
                  date: endDate,
                  timezone: timezone,
                }
              }
            },
            in: {
              $subtract: [ '$$endDays', '$$outDays' ]
            }
          }
        },
        count: {
          $switch: {
            branches: [
              {
                case: { $eq: ['$prices.entries.type', '换算数量'] },
                then: { $multiply: ['$entries.count', '$products.scale', '$inOut'] },
              },
              {
                case: { $eq: ['$prices.entries.type', '数量'] },
                then: { $multiply: ['$entries.count', '$inOut'] },
              },
              {
                case: { $eq: ['$prices.entries.type', '重量'] },
                then: { $multiply: ['$entries.count', '$products.weight', '$inOut'] },
              },
            ],
            default:  {
              $cond: {
                if: '$products.isScaled',
                then: {
                  $multiply: ['$entries.count', '$products.scale', '$inOut']
                },
                else: { $multiply: ['$entries.count', '$inOut'] }
              }
            }
          }
        },
        unit: {
          $switch: {
            branches: [
              {
                case: { $eq: ['$prices.entries.type', '换算数量'] },
                then: '$products.unit',
              },
              {
                case: { $eq: ['$prices.entries.type', '数量'] },
                then: '$products.countUnit',
              },
              {
                case: { $eq: ['$prices.entries.type', '重量'] },
                then: '吨',
              },
            ],
            default:  {
              $cond: {
                if: '$products.isScaled',
                then: '$products.unit',
                else: '$products.countUnit',
              }
            }
          }
        },
        weight: {
          $multiply: ['$entries.count', '$products.weight']
        },
      }
    },
    {
      $lookup: {
        from: 'prices',
        let: { number: '$products.number' },
        pipeline: [
          {
            $match: { _id: pricePlanId }
          },
          {
            $unwind: '$entries'
          },
          {
            $match: {
              $expr: {
                $eq: ['$entries.number', '$$number']
              }
            }
          }
        ],
        as: 'prices'
      }
    },
    {
      $unwind: {
        path: '$prices',
        preserveNullAndEmptyArrays: true,
      }
    },
    {
      $addFields: {
        price: {
          $switch: {
            branches: [
              {
                case: { $eq: ['$prices.entries.type', '换算数量'] },
                then: { $multiply: ['$entries.count', '$products.scale', '$prices.entries.unitPrice', '$days', '$inOut'] },
              },
              {
                case: { $eq: ['$prices.entries.type', '数量'] },
                then: { $multiply: ['$entries.count', '$prices.entries.unitPrice', '$days', '$inOut'] },
              },
              {
                case: { $eq: ['$prices.entries.type', '重量'] },
                then: { $multiply: ['$entries.count', '$products.weight', '$prices.entries.unitPrice', '$days', '$inOut'] },
              },
            ],
            default: 0
          }
        },
        freight: {
          $cond: {
            if: {
              $or: [
                {
                  $and: [
                    { $in: ['$prices.freightType', ['出库', '双向']] },
                    { $eq: ['$inOut', 1] },
                  ],
                },
                {
                  $and: [
                    { $in: ['$prices.freightType', ['入库', '双向']] },
                    { $eq: ['$inOut', -1] },
                  ],
                }
              ]
            },
            then: { $multiply: ['$entries.count', '$products.weight', '$prices.freight', 0.001] },
            else: 0,
          },
        }
      }
    },
    {
      $facet: {
        history: [
          {
            $match: {
              history: true
            },
          },
          {
            // TODO 考虑不合并的情况
            $group: {
              _id: '$products.name',
              name: {
                $first: '$products.name',
              },
              count: {
                $sum: '$count',
              },
              days: {
                $first: '$days',
              },
              price: {
                $sum: {
                  $multiply: [ '$prices.entries.unitPrice', '$days', '$count' ],
                }
              },
              unit: {
                $first: '$unit'
              },
            }
          },
          {
            $match: {
              count: {
                $ne: 0
              }
            }
          },
          {
            $addFields: {
              unitPrice: {
                $divide: [
                  {
                    $divide: [
                      '$price', '$count',
                    ],
                  },
                  '$days',
                ],
              }
            }
          }
        ],
        list: [
          {
            $match: {
              history: false
            }
          },
          {
            $project: {
              outDate: '$outDate',
              number: '$entries.number',
              name: '$products.name',
              size: '$products.size',
              count: '$count',
              days: '$days',
              inOut: { $cond: { if: { $eq: ['$inOut', 1] }, then: '出库', else: '入库' } },
              unitPrice: '$prices.entries.unitPrice',
              unitFreight: '$prices.freight',
              price: '$price',
              freight: '$freight',
              history: '$history',
              unit: '$unit',
            }
          },
          {
            $group: {
              // TODO 考虑不合并的情况
              _id: {
                year: { $year: { date: '$outDate', timezone: 'Asia/Shanghai' } },
                month: { $month: { date: '$outDate', timezone: 'Asia/Shanghai' } },
                day: { $dayOfMonth: { date: '$outDate', timezone: 'Asia/Shanghai' } },
                name: '$name',
                inOut: { $cond: { if: { $eq: ['$inOut', 1] }, then: '出库', else: '入库' } }
              },
              outDate: { $first: '$outDate' },
              number: { $first:  '$number' },
              name: { $first: '$name' },
              count: { $sum: '$count' },
              days: { $first: '$days' },
              inOut: { $first: { $cond: { if: { $eq: ['$inOut', 1] }, then: '出库', else: '入库' } } },
              unitPrice: { $first: '$unitPrice' },
              unitFreight: { $first: '$freight' },
              price: { $sum: '$price' },
              freight: { $sum: '$freight' },
              unit: { $first: '$unit' },
            }
          },
          {
            $sort: {
              '_id.year': 1,
              '_id.month': 1,
              '_id.day': 1,
              number: 1,
            }
          }
        ],
        group: [
          {
            $group: {
              _id: null,
              price: {
                $sum: '$price'
              },
              freight: {
                $sum: '$freight'
              },
            }
          }
        ]
      }
    }
  ])
}

const test = () => {
  mongoose
    .connect('mongodb://localhost/hera')
  doRent({
    startDate: moment('2018-02-01').toDate(),
    endDate: moment('2018-02-28').add(1, 'day').toDate(),
    timezone: 'Asia/Shanghai',
    project: ObjectId('587af5e644e35f50b980d2ea'),
    pricePlanId: ObjectId('5a56ff25af16eb8d5163df9c'),
  }).then((result) => {
    console.log(JSON.stringify(result[0].list, null, 4))
    console.log(JSON.stringify(result[0].group, null, 4))
  }).catch((err) => {
    console.log(err)
  })
}

/**
 *
 * 计算租金
 *
 * query.condition 是一个 JSON 字符串
 *
 * 包含字段
 * project: 目标项目
 * startDate: 开始时间
 * endDate: 结束时间
 *
 */
exports.rent = (req, res, next) => {
  let condition = req.query['condition']

  if (condition) {
    condition = JSON.parse(condition)

    const startDate = new Date(condition.startDate)
    const endDate = new Date(condition.endDate)
    const timezone = 'Asia/Shanghai'
    const project = ObjectId(condition.project)
    const pricePlanId = ObjectId(condition.planId)

    doRent({
      startDate,
      endDate,
      timezone,
      project,
      pricePlanId,
    }).then((result) => {
      console.log(JSON.stringify(result[0], null, 4))
      res.json({
        message: '查询成功！',
        data: {
          rent: {
            history: result[0].history,
            list: result[0].list,
            group: result[0].group,
          }
        }
      })
    }).catch((err) => {
      next(err)
    })
  } else {
    res.status(400).json({
      message: '错误的请求格式'
    })
  }
}
