import { useState } from 'react'

export default function FilterBar({ members, filters, onChange }) {
  const [searchInput, setSearchInput] = useState(filters.search || '')
  const [debounceTimer, setDebounceTimer] = useState(null)

  const handleSearch = (value) => {
    setSearchInput(value)
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => {
      onChange({ ...filters, search: value || null })
    }, 300)
    setDebounceTimer(timer)
  }

  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value || null })
  }

  const hasActiveFilters = filters.priority || filters.assignee_id || filters.search

  const clearAll = () => {
    setSearchInput('')
    onChange({ search: null, priority: null, assignee_id: null })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Szukaj */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Szukaj zadań..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm
              focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
          />
        </div>

        {/* Priorytet */}
        <select
          value={filters.priority || ''}
          onChange={(e) => handleChange('priority', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm
            focus:ring-2 focus:ring-brand-500 outline-none transition"
        >
          <option value="">Wszystkie priorytety</option>
          <option value="high">🔴 Wysoki</option>
          <option value="medium">🟡 Średni</option>
          <option value="low">⚪ Niski</option>
        </select>

        {/* Osoba */}
        <select
          value={filters.assignee_id || ''}
          onChange={(e) => handleChange('assignee_id', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm
            focus:ring-2 focus:ring-brand-500 outline-none transition"
        >
          <option value="">Wszyscy członkowie</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.display_name}</option>
          ))}
        </select>

        {/* Wyczyść filtry */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-2"
          >
            ✕ Wyczyść filtry
          </button>
        )}
      </div>
    </div>
  )
}
