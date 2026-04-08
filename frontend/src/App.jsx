import { useMemo, useState } from 'react'
import axios from 'axios'

const API = 'http://127.0.0.1:8000/api'

function ScoreBadge({ score }) {
  let label = 'Low'
  if (score >= 0.55) label = 'Strong'
  else if (score >= 0.4) label = 'Good'

  return (
    <div className="score-badge">
      <span className="score-label">{label} match</span>
      <span className="score-value">{Math.round(score * 100)}%</span>
    </div>
  )
}

function ResultCard({ result }) {
  return (
    <div className="result-card">
      <div className="result-top">
        <div>
          <div className="result-file">{result.file}</div>
          <div className="result-meta">Page {result.page}</div>
        </div>
        <ScoreBadge score={result.score} />
      </div>

      <div className="reason">{result.match_reason}</div>

      {result.matched_terms?.length > 0 && (
        <div className="term-row">
          {result.matched_terms.map((term, i) => (
            <span className="term-pill" key={`${term}-${i}`}>
              {term}
            </span>
          ))}
        </div>
      )}

      <p className="preview">{result.text_preview}</p>
    </div>
  )
}

export default function App() {
  const [file, setFile] = useState(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchMeta, setSearchMeta] = useState(null)

  const canSearch = useMemo(() => query.trim().length > 0, [query])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setMessage('Choose a PDF first.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploading(true)
      setMessage('')
      const res = await axios.post(`${API}/upload`, formData)
      setMessage(`Indexed ${res.data.pages_indexed} pages from ${res.data.file}`)
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!canSearch) return

    try {
      setSearching(true)
      setMessage('')
      const res = await axios.post(`${API}/search`, {
        query,
        top_k: 8
      })
      setResults(res.data.results || [])
      setSearchMeta({
        query: res.data.query,
        count: res.data.count
      })
    } catch (err) {
      setResults([])
      setSearchMeta(null)
      setMessage(err.response?.data?.detail || 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="hero">
        <div className="hero-badge">Kahua Project • V2</div>
        <h1>Drawing Search</h1>
        <p>
          Search construction PDFs by meaning instead of file name. Upload documents,
          index them, and retrieve the most relevant pages fast.
        </p>
      </div>

      <div className="main-grid">
        <div className="panel">
          <h2>Upload PDF</h2>
          <p className="panel-subtitle">
            Best results come from text-based drawings, specs, and submittals.
          </p>

          <form onSubmit={handleUpload} className="stack-form">
            <label className="file-input">
              <span>{file ? file.name : 'Choose a PDF file'}</span>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </label>

            <button type="submit" className="primary-btn" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload and Index'}
            </button>
          </form>
        </div>

        <div className="panel">
          <h2>Search</h2>
          <p className="panel-subtitle">
            Try searches like foundation detail, concrete footing, steel connection.
          </p>

          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search drawings by meaning..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="primary-btn" disabled={!canSearch || searching}>
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
      </div>

      {message && <div className="message-bar">{message}</div>}

      {searchMeta && (
        <div className="results-header">
          <div>
            <h3>Results</h3>
            <p>
              {searchMeta.count} match{searchMeta.count === 1 ? '' : 'es'} for “{searchMeta.query}”
            </p>
          </div>
        </div>
      )}

      <div className="results-list">
        {results.map((result, index) => (
          <ResultCard result={result} key={`${result.file}-${result.page}-${index}`} />
        ))}
      </div>

      {!searching && results.length === 0 && searchMeta && (
        <div className="empty-state">
          No matches found. Try broader construction terms or upload more PDFs.
        </div>
      )}
    </div>
  )
}
