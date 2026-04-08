import { useState } from 'react'
import axios from 'axios'

const API = 'http://127.0.0.1:8000/api'

export default function App() {
  const [file, setFile] = useState(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [message, setMessage] = useState('')

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await axios.post(`${API}/upload`, formData)
      setMessage(`Indexed ${res.data.pages_indexed} pages from ${res.data.file}`)
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Upload failed')
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${API}/search`, {
        query,
        top_k: 5
      })
      setResults(res.data.results || [])
    } catch (err) {
      setMessage('Search failed')
    }
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Kahua Drawing Search</h1>
        <p className="subtitle">Upload construction drawing PDFs and search them by meaning.</p>

        <div className="card">
          <h2>Upload Drawing PDF</h2>
          <form onSubmit={handleUpload}>
            <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
            <button type="submit">Upload and Index</button>
          </form>
        </div>

        <div className="card">
          <h2>Search Drawings</h2>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search for foundation detail, beam connection, concrete footing..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </div>

        {message && <div className="message">{message}</div>}

        <div className="results">
          {results.map((result, index) => (
            <div className="result-card" key={index}>
              <div className="result-header">
                <strong>{result.file}</strong>
                <span>Page {result.page}</span>
              </div>
              <p>{result.text_preview}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
