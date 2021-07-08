const mongoose = require('mongoose')

//connecting mongoose to database
mongoose.connect(process.env.MONGODB_URL,{
  useNewUrlParser:true,
  useCreateIndex:true,
  useUnifiedTopology:true,
  useFindAndModify:false
})
