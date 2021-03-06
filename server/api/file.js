/**
 * Created by seal on 11/01/2017.
 */
const File = require('../models').File;
const path = require('path')
const service = require('../service')

exports.post =  (req, res, next) => {
  if (req.file)  {
    const file = new File(req.file);
    file.save().then(() => {
      res.json({
        message: 'success'
      })
    }).catch(err => {
      next(err);
    });
  } else {
    next({
      message: '没有提交文件！'
    })
  }
};

exports.list = (req, res, next) => {
  File.find().then(files => {
    res.json(files);
  }).catch(err => {
    next(err);
  });
};

exports.download = (req, res, next) => {
  res.sendFile(path.join(service.root, 'public/uploads/', req.query.id));
}
