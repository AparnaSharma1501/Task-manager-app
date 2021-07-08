const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt=require('jsonwebtoken')
const Task=require('./Tasks')
//user schema
const userSchema = new mongoose.Schema({
  name:{
    type: String,
    required: true,
    trim:true
  },
  email:{
    type:String,
    unique:true,
    required:true,
    trim:true,
    lowercase:true,
    validate(value){
      if(!validator.isEmail(value))
      throw new Error('Invalid email address')
    }
  },
  age:{
    type:Number,
    default:0,
    validate(value){
      if(value<0)
      throw new Error("Age must be a positive number")
    }
  },
  password:{
    type:String,
    required:true,
    trim:true,
    minLength:7,
    validate(value){
      if(!validator.isStrongPassword(value))
      throw new Error('Weak password')
      if(value.toLowerCase().includes('password'))
      throw new Error("password can't contain 'password'")
    }
  },
  tokens:[{
    token:{
      type:String,
      required:true
    }
  }],
  avatar:{
    type:Buffer
  }
},{
  timestamps:true
})

//Making Virtual relationship that helps mongoose to figure out relationship between collections
userSchema.virtual('tasks',{
  ref:'Tasks',
  localField:'_id',
  foreignField:'owner'
})

//Hiding hidden data from user
userSchema.methods.toJSON = function (){
  const user = this
  const userObject = user.toObject()
  delete userObject.password
  delete userObject.tokens
  delete userObject.avatar
  return userObject
}

//Generating tokens for authentication
userSchema.methods.generateAuthToken=async function(){
  const user=this
  const token= jwt.sign({_id:user._id.toString()},process.env.JWT_SECRET)
  user.tokens =user.tokens.concat({token})
  await user.save()
  return token
}

//Checking user credentials and returning them
userSchema.statics.findByCredentials = async (email,password)=>{
  const user = await User.findOne({email})
  if(!user)
  throw new Error("Unable to login")
  const isMatch = await bcrypt.compare(password,user.password)
  if(!isMatch)
  throw new Error("Unable to login")
  return user
}

//middlewares

// Hashing plain text password before saving it
userSchema.pre('save', async function(next){
  const user = this
  if(user.isModified('password'))
  {
    user.password =await bcrypt.hash(user.password,8)
  }
  next()    //to call next  middleware (in this case save) by saying we are done with current middleware(pre)
})

//Deleting Tasks before deleting a userRouter
userSchema.pre('remove',async function(next){
  const user=this
  await Task.deleteMany({owner:user._id})
  next()
})

//Creating basic user model
const User = mongoose.model('User',userSchema)

module.exports = User
