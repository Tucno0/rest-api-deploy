const crypto = require('node:crypto') // Sirve para generar un hash

const express = require('express')
const cors = require('cors')

const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.disable('x-powered-by')

// Metodos normales: GEt/HEAD/POST
// Metodos complejos: PUT/PATCH/DELETE -> CORS PRE-FLIGHT (OPTIONS)

// Middleware
app.use(express.json())
app.use(
  cors({
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        'http://localhost:8080',
        'http://localhost:3000',
        'http://localhost:5000',
        'http://movies.com'
      ]

      if (!origin) return callback(null, true)

      if (!ACCEPTED_ORIGINS.includes(origin)) {
        return callback(new Error('Not allowed by CORS'))
      }

      callback(null, true)
    }
  })
)

// Rutas
app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' })
})

// Todos los recursos que sean MOVIES se identifican con el prefijo /movies
app.get('/movies', (req, res) => {
  const { genre } = req.query // Se recupera el parámetro de la ruta

  if (genre) {
    const filteredMovies = movies.filter((movie) => {
      return movie.genre.some((movieGenre) => movieGenre.toLowerCase() === genre.toLowerCase())
    })

    return res.json(filteredMovies)
  }

  res.json(movies)
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    // 422 Unprocessable Entity
    return res.status(400).json({ message: JSON.parse(result.error.message) })
  }

  // en base de datos
  const newMovie = {
    id: crypto.randomUUID(), // Genera un hash aleatorio
    ...result.data
  }

  // Validar los datos
  // if (!title || !genre || !year || !director || !duration || !rate || !poster) {
  //   return res.status(400).json({ message: 'Missing required fields' })
  // }

  // Esto no sería REST, porque estamos guardando el estado de la aplicacion en memoria
  movies.push(newMovie)

  res.status(201).json(newMovie) // Actualizar la cache del cliente
})

app.get('/movies/:id', (req, res) => {
  // path-to-regexp
  const { id } = req.params // Se recupera el parámetro de la ruta
  const movie = movies.find((movie) => movie.id === id)

  if (movie) return res.json(movie)

  res.status(404).json({ message: 'Movie not found' })
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ message: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex((movie) => movie.id === id)

  if (movieIndex === -1) return res.status(404).json({ message: 'Movie not found' })

  const updateMovie = {
    ...movies[movieIndex], // Copia de la pelicula
    ...result.data // Actualizacion de la pelicula
  }

  movies[movieIndex] = updateMovie

  res.json(updateMovie)
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex((movie) => movie.id === id)

  if (movieIndex === -1) return res.status(404).json({ message: 'Movie not found' })

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

const PORT = process.env.PORT ?? 3000 // Poner un puerto por variable de entorno para utilizar lo que nos da el hosting

app.listen(PORT, () => {
  console.log(`App listening on port http://localhost:${PORT}`)
})
