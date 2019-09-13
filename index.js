require("dotenv").config()
const express = require("express")
const bodyParser = require("body-parser")
const morgan = require("morgan")
const cors = require("cors")
const Person = require("./models/person")

const app = express()

app.use(express.static("build"))
app.use(bodyParser.json())
app.use(cors())

morgan.token("body", (req) => {
  return JSON.stringify(req.body)
})
app.use(morgan(":method :url :status :response-time ms :body"))

app.get("/", (req, res) => {
  res.send("<h1>Hello World!</h1>")
})

app.get("/info", (req, res) => {
  Person.find({}).then(people => {
    res.send(
      `Phonebook has info for ${people.length} people <p>${new Date()}</p>`
    )
  })
})

app.get("/api/persons", (req, res) => {
  Person.find({}).then(people => {
    res.json(people.map(person => person.toJSON()))
  })
})

app.get("/api/persons/:id", (req, res, next) => {
  Person.findById(req.params.id)
    .then(person => {
      if (person) {
        res.json(person.toJSON())
      } else {
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.put("/api/persons/:id", (req, res) => {
  Person.findByIdAndUpdate(req.params.id, req.body).then(result => {
    res.json(result.toJSON())
  })
})

app.delete("/api/persons/:id", (req, res, next) => {
  Person.findByIdAndRemove(req.params.id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => next(error))
})

app.post("/api/persons", (req, res, next) => {
  const body = req.body

  if (body.name === undefined) {
    return res.status(400).json({ error: "content missing" })
  }
  const person = new Person({
    name: body.name,
    number: body.number,
    date: new Date()
  })

  person
    .save()
    .then(savedPerson => {
      res.json(savedPerson.toJSON())
    })
    .catch(error => next(error))
})

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === "CastError" && error.kind === "ObjectId") {
    return response.status(400).send({ error: "malformatted id" })
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
