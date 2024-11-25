const express = require('express');
const router = express.Router();
const { createUser, updateUser, updatePassword, getUser, getUsers, getUsersI,validationUser, desactivateUser, startPasswordRecovery, validateCode, changePassword, reactivate, updateUsers } = require('../controllers/user');

router.post('/create', createUser);
router.post('/update', updateUsers);
router.put('/updateUser', updateUser);
router.post('/password', updatePassword);
router.post('/validation', validationUser);
router.get('/desactivate/:id', desactivateUser);
router.get('/', getUsers);
router.get('/idle', getUsersI);
router.get('/user/:id', getUser);
router.post('/recover', startPasswordRecovery);
router.post('/validateCode', validateCode);
router.post('/changePassword', changePassword);
router.post('/reactivate', reactivate);


module.exports = router;