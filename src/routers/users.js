const express =require('express')
const User = require('../models/Users')
const router = new express.Router()
const auth = require('../middlewares/auth')
const multer = require('multer')
const sharp= require('sharp')

//Create User endpoint
router.post('/users',async (req,res)=>{
  //creating instance of User model
  const user = new User(req.body)
  try{
    await user.save()
    const token = await user.generateAuthToken()

    res.status(201).send({user,token})
  }catch(e){
    res.status(400).send(e)
  }
})

//login user endpoint
router.post('/users/login', async(req,res)=>{
  try {
    const user = await User.findByCredentials(req.body.email,req.body.password)
    const token = await user.generateAuthToken()
    // await user.save()
    res.send({user,token})
  } catch (e) {
    res.status(400).send(e)
  }
})

//Logout user endpoint
router.post('/users/logout',auth,async (req,res)=>{
  try {
    req.user.tokens = req.user.tokens.filter((token)=>{
      return token.token!==req.token
    })
    await req.user.save()
    res.send('Succesfully Logout')
  } catch (e) {
    res.status(500).send(e)
  }
})

//Logout user fromm all devices endpoint
router.post('/users/logoutAll',auth,async (req,res)=>{
  try {
    req.user.tokens.splice(0,req.user.tokens.length) //req.user.tokens=[]
    await req.user.save()
    res.send('Logout from everywhere')
  } catch (e) {
    res.status(500).send(e)
  }
})

//Reading User endpoint
router.get('/users/me',auth,async (req,res)=>{
  res.send(req.user)
})

//User Updation endpoint
router.patch('/users/me',auth, async (req,res)=>{
  const updates = Object.keys(req.body)
  const allowedUpdates = ["name","age","email","password"]
  const isValidUpdate = updates.every((update)=>allowedUpdates.includes(update))
  if(!isValidUpdate)
  return res.status(404).send({error:"Invalid Updates"})
    try {
      updates.forEach((update)=>req.user[update] = req.body[update])  //user.name = "Someone's name" but we here updtaing dynamically using [] syntax
      await req.user.save()
      //const user = await User.findByIdAndUpdate(req.params.id, req.body, {new:true,runValidators:true})
      res.send(req.user)
    } catch (e) {
      res.status(400).send(e)
    }
})

//delete user endpoint
router.delete('/users/me',auth,async (req,res)=>{
  try {
    await req.user.remove()
    res.send(req.user)
  } catch (e) {
    res.status(500).send(e);
  }
})

//For uploading profile img
const upload=multer({
  limits:{
    fileSize:1000000
  },
  fileFilter(req,file,cb){
    if(!file.originalname.match(/\.(jpg|jpeg|png)$/))
    return cb(new Error('File should be an image only.'))
    cb(undefined,true);
  }
})

//User Profile img endpoint
router.post('/users/me/avatar',auth,upload.single('avatar'),async (req,res)=>{
  const buffer=await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
  req.user.avatar=buffer
  await req.user.save()
  res.send()
},(error,req,res,next)=>{
  res.status(404).send({Error:error.message})
})

//Delete Profile img endpoint
router.delete('/users/me/avatar',auth,async (req,res)=>{
  req.user.avatar=undefined
  await req.user.save()
  res.send()
})

//fetching profile img
router.get('/users/:id/avatar',async(req,res)=>{
  try {
    const user= await User.findById(req.params.id)
    if(!user||!user.avatar)
    {
      throw new Error();
    }
    res.set('Content-type','image/png')
    res.send(user.avatar)
  } catch (e) {
    res.status(404).send()
  }
})

module.exports = router
