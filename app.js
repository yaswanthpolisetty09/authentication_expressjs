const express = require('express')
const app = express()

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
app.use(express.json())
const dbPath = path.join(__dirname, 'userData.db')

let db = null

const initialze = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB error ${e.message}`)
    process.exit(1)
  }
}

initialze()

app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedpass = await bcrypt.hash(request.body.password, 10)
  const selectuser = `select * from user where username='${username}';`
  const dbUser = await db.get(selectuser)
  let pasw = request.body.password
  if (pasw.length < 5) {
    response.status(400)
    response.send('Password is too short')
  } else if (dbUser == undefined) {
    const createuser = `
            insert into user (username,name,password,gender,location) 
            values(
                '${username}',
                '${name}',
                '${password}',
                '${gender}',
                '${location}'
            );
            `
    const opp = await db.run(createuser)
    response.status(200)
    response.send('User created successfully')
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const checkuser = `select * from user where username='${username}'`
  const uio = await db.get(checkuser)
  if (uio == undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const ispassmatch = await bcrypt.compare(password, uio.password)
    if (ispassmatch) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const yu = `select * from user where username='${username}';`
  const dbUse = await db.get(yu)
  const ispass = await bcrypt.compare(request.body.oldPassword, dbUse.password)
  if (ispass) {
    let pop = request.body.newPassword
    if (pop.length > 5) {
      const haspas = await bcrypt.hash(pop, 10)
      const updatque = `
      update user set password='${haspas}' where username='${username}';
      `
      const updpa = await db.run(updatque)
      response.status(200)
      response.send('Password updated')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})
