const express=require('express')
require('./db/mongoose')
const userRouter =require('./routers/users')
const taskRouter =require('./routers/tasks')

//New express application
const app=express()
//getting port
const port = process.env.PORT

//configuring express to automaticaaly get json parsed to object
app.use(express.json())
//User routes
app.use(userRouter)
//Task routes
app.use(taskRouter)

//listening on port
app.listen(port,()=>{
  console.log("My server is up and running on port "+port)
})
