const express = require('express');
const router = express.Router();

const user = require('./user');
const project = require('./project');
const dashboard = require('./dashboard');
const order = require('./order');
const orderRouter =  order.router;

router.use(user.middleware);

router.get('/', function(req, res, next) {
  if (req.user) {
    dashboard.index(req, res, next);
  } else {
    user.login(req, res);
  }
});

router.get('/login', user.login);
router.get('/logout', user.logout);
router.post('/login', user.postLogin);

router.post('/user', user.newUser);
router.post('/user/:id', user.updateUser);
router.post('/user/:id/delete', user.deleteUser);


router.get('/project/:projectId/order/create', order.create);
router.post('/project/:projectId/order', order.postOrder);
router.get('/project/:projectId/order/:id', order.details);

router.use('/order', orderRouter);

router.get('/project', project.index);
router.post('/project/:id', project.updateInfo);
router.post('/project', project.post);
router.post('/project/:id/delete', project.delete);

module.exports = router;
