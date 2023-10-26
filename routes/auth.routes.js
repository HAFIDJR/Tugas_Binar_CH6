const router = require('express').Router()
const {register,login,updateProfile,authenticate} = require('../controllers/auth.controllers')
const {restrict} = require('../middleware/auth.middleware')
const {image} = require('../libs/multer')
router.post('/register',register);
router.post('/login',login);
router.put('/profile',[restrict,image.single('profile')],updateProfile)
router.get('/auth', restrict, authenticate);

module.exports = router