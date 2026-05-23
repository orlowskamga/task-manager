import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import api from '../api/client'
import { useToast } from '../components/Toast'
import TaskModal from '../components/TaskModal'
import TaskCard from '../components/TaskCard'
import FilterBar from '../components/FilterBar'

const COLUMNS = [
  { id: 'todo', label: 'Do zrobienia', color: 'bg-gray-100', accent: 'border-gray-400' },
  { id: 'in_progress', label: 'W trakcie', color: 'bg-blue-50', accent: 'border-brand-500' },
  { id: 'done', label: 'Zrobione', color: 'bg-green-50', accent: 'border-green-500' },
]

export default function BoardView() {
  const { boardId } = useParams()
  const toast = useToast()
  const [board, setBoard] = useState(null)
  const [tasks, setTasks] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [members, setMembers] = useState([])
  const [filters, setFilters] = useState({ search: null, priority: null, assignee_id: null })

  const fetchBoard = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/boards/${boardId}`)
      setBoard(data)
      setMembers(data.members || [])
    } catch (err) {
      console.error(err)
    }
  }, [boardId])

  const fetchTasks = useCallback(async () => {
    try {
      const params = {}
      if (filters.search) params.search = filters.search
      if (filters.priority) params.priority = filters.priority
      if (filters.assignee_id) params.assignee_id = filters.assignee_id
      const { data } = await api.get(`/api/boards/${boardId}/tasks/`, { params })
      setTasks(data)
    } catch (err) {
      console.error(err)
    }
  }, [boardId, filters])

  useEffect(() => { fetchBoard() }, [fetchBoard])
  useEffect(() => { fetchTasks() }, [fetchTasks])

  const getColumnTasks = (colId) =>
    tasks
      .filter((t) => t.status === colId)
      .sort((a, b) => a.position - b.position)

  const onDragEnd = async (result) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStatus = destination.droppableId
    const newIndex = destination.index
    const taskId = parseInt(draggableId)

    // Optymistyczny update — oblicz nową pozycję
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // Zaktualizuj lokalnie
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) return { ...t, status: newStatus, position: newIndex }
      return t
    })
    setTasks(updatedTasks)

    try {
      await api.put(`/api/boards/${boardId}/tasks/${taskId}/move`, {
        status: newStatus,
        position: newIndex,
      })
      // Przeładuj żeby zsynchronizować pozycje
      fetchTasks()
    } catch {
      toast.error('Nie udało się przenieść zadania')
      fetchTasks()
    }
  }

  const openCreate = () => {
    setEditingTask(null)
    setModalOpen(true)
  }

  const openEdit = (task) => {
    setEditingTask(task)
    setModalOpen(true)
  }

  const handleSave = async (data) => {
    try {
      if (editingTask) {
        await api.patch(`/api/boards/${boardId}/tasks/${editingTask.id}`, data)
        toast.success('Zadanie zaktualizowane')
      } else {
        await api.post(`/api/boards/${boardId}/tasks/`, data)
        toast.success('Zadanie utworzone')
      }
      setModalOpen(false)
      fetchTasks()
    } catch (err) {
      toast.error('Błąd zapisu zadania')
    }
  }

  const handleDelete = async (taskId) => {
    if (!confirm('Usunąć to zadanie?')) return
    try {
      await api.delete(`/api/boards/${boardId}/tasks/${taskId}`)
      toast.success('Zadanie usunięte')
      setModalOpen(false)
      fetchTasks()
    } catch (err) {
      toast.error('Błąd usuwania')
    }
  }

  if (!board) {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === 'done').length

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Tablice
          </Link>
          <h1 className="text-2xl font-bold mt-1">{board.name}</h1>
          {totalTasks > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {doneTasks}/{totalTasks} ukończonych
            </p>
          )}
        </div>
        <button
          onClick={openCreate}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Nowe zadanie
        </button>
      </div>

      {/* Filters */}
      <FilterBar members={members} filters={filters} onChange={setFilters} />

      {/* Kanban columns */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = getColumnTasks(col.id)
            return (
              <Droppable key={col.id} droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-xl p-3 min-h-[300px] border-t-4 ${col.accent} ${col.color} ${
                      snapshot.isDraggingOver ? 'ring-2 ring-brand-300' : ''
                    } transition-all`}
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="font-semibold text-sm text-gray-700">{col.label}</h3>
                      <span className="text-xs bg-white/70 rounded-full px-2 py-0.5 text-gray-500 font-medium">
                        {colTasks.length}
                      </span>
                    </div>

                    {colTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center text-gray-300 text-xs py-8">
                        Przeciągnij tutaj lub utwórz nowe
                      </div>
                    )}

                    {colTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                          >
                            <TaskCard
                              task={task}
                              onClick={openEdit}
                              isDragging={snap.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )
          })}
        </div>
      </DragDropContext>

      {/* Task modal */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          members={members}
          onSave={handleSave}
          onDelete={editingTask ? () => handleDelete(editingTask.id) : null}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
