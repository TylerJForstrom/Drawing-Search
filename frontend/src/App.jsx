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

function PreviewPanel({ selectedResult }) {
  if (!selectedResult) {
    return (
      <div className="preview-panel empty-preview">
        <h3>Preview</h3>
        <p>Select a result to preview the PDF here.</p>
      </div>
    )
  }

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <div>
          <h3>{selectedResult.file}</h3>
          <p>Page {selectedResult.page}</p>
        </div>
        <a
          className="secondary-btn"
          href={selectedResult.page_url}
          target="_blank"
          rel="noreferrer"
        >
          Open in New Tab
        </a>
      </div>

      <div className="preview-frame-wrap">
        <iframe
          title="PDF Preview"
          src={selectedResult.page_url}
          className="preview-frame"
        />
      </div>
    </div>
  )
}

function ResultCard({ result, isSelected, onSelect }) {
  return (
    <div className={`result-card ${isSelected ? 'selected-card' : ''}`}>
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

      <div className="result-actions">
        <button className="primary-btn small-btn" onClick={() => onSelect(result)}>
          Preview Page
        </button>
        <a
          className="secondary-btn"
          href={result.page_url}
          target="_blank"
          rel="noreferrer"
        >
          Open PDF
        </a>
      </div>
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
  const [selectedResult, setSelectedResult] = useState(null)

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
      const found = res.data.results || []
      setResults(found)
      setSearchMeta({
        query: res.data.query,
        count: res.data.count
      })
      setSelectedResult(found.length > 0 ? found[0] : null)
    } catch (err) {
      setResults([])
      setSearchMeta(null)
      setSelectedResult(null)
      setMessage(err.response?.data?.detail || 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="hero">
        <div className="hero-badge">Kahua Project • V3</div>
        <h1>Drawing Search</h1>
        <p>
          Search construction PDFs by meaning, inspect the best match, and jump
          straight to the relevant page.
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

      <div className="v3-layout">
        <div className="results-list">
          {results.map((result, index) => (
            <ResultCard
              result={result}
              key={`${result.file}-${result.page}-${index}`}
              isSelected={
                selectedResult &&
                selectedResult.file === result.file &&
                selectedResult.page === result.page
              }
              onSelect={setSelectedResult}
            />
          ))}
        </div>

        <PreviewPanel selectedResult={selectedResult} />
      </div>

      {!searching && results.length === 0 && searchMeta && (
        <div className="empty-state">
          No matches found. Try broader construction terms or upload more PDFs.
        </div>
      )}
    </div>
  )
}
