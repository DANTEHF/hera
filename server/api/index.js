/**
 * Created by seal on 10/01/2017.
 */
const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/'});
const product = require('./product');
const file = require('./file');

const middleware = require('./middleware');
const user = require('./user');
const project = require('./project');
const price = require('./price')
const workercheckin = require('./worker')
const record = require('./record')
const payable = require('./payable')
const operation = require('./operation')

const router = express.Router();

const store = require('./store')

router.get('/operation/top_k', operation.topK)
router.get('/operation/next_k', operation.nextK)
router.use(middleware.user);
router.post('/login', user.login);
router.post('/logout', user.logout);
router.get('/is_login', user.isLogin);
router.get('/load', user.load);

router.get('/user', user.list)
router.post('/user', user.create)
router.post('/user/:id', user.update)
router.post('/user/:id/profile', user.saveProfile)
router.post('/user/:id/delete', user.remove)

router.get('/product', product.list)
router.post('/product', product.create)
router.post('/product/:number', product.update)
router.post('/product/:number/delete', product.delete)

router.get('/price', price.list)
router.post('/price', price.create)
router.post('/price/:id', price.update)
router.post('/price/:id/delete', price.delete)

router.get('/project', project.list);
router.post('/project', project.create)
router.get('/project/:id', project.detail)
router.post('/project/:id', project.update)
router.post('/project/:id/add_item', project.addItem)
router.get('/project/:id/item/:itemId', project.itemDetail)
router.post('/project/:id/item/:itemId/delete', project.deleteItem)

router.post('/workercheckin',workercheckin.create)
router.post('/workercheckin/:id/edit',workercheckin.update);
router.get('/workercheckin',workercheckin.list);
router.post('/workercheckin/:id/delete',workercheckin.delete);
router.post('/workercheckin/:id/signin',workercheckin.signin)
router.post('/workercheckin/:id/signout',workercheckin.signout)



router.get('/payable_search',payable.paycheckSearch)


router.get('/record', record.list)
router.get('/record/all_payer', record.findAllPayer)
router.get('/record/:id', record.detail)
router.post('/record/:id', record.update)
router.post('/record/:id/transport', record.updateTransport)
router.post('/record/:id/transport_paid', record.updateTransportPaidStatus)
router.post('/record/:id/transport_checked', record.updateTransportCheckedStatus)
router.post('/record', record.create)

router.get('/file', file.list);
router.post('/file', upload.single('file'), file.post);
router.get('/file/:filename', file.download)

router.get('/store/search', store.search)
router.get('/store/simple_search', store.simpleSearch)
router.get('/store/rent', store.rent)
router.get('/store/:id', store.queryAll)

module.exports = router;