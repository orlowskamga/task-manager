import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import api from '../api/client'
import TaskModal from '../components/TaskModal'

const COLUMNS = [
  { id: 'todo', label: 'Do zrobienia', color: 'bg-gray-100', accent: 'border-gray-400' },
  { id: 'in_progress', label: 'W trakcie', color: 'bg-blue-50', accent: 'border-brand-500' },
  { id: 'done', label: 'Zrobione', color: 'bg-green-50', accent: 'border-green-500' },
]

const PRIORITY_BADGE = {
  low: 'bg-gray-200 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

const PRIORITY_LABEL = { low: 'Niski', medium: 'Średni', high: 'Wysoki' }

export default function BoardView() {
  const { boardId } = useParams()
  const [board, setBoard] = useState(null)
  const [tasks, setTasks] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [members, setMembers] = useState([])

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
      const { data } = await api.get(`/api/boards/${boardId}/tasks/`)
      setTasks(data)
    } catch (err) {
      console.error(err)
    }
  }, [boardId])

  useEffect(() => {
    fetchBoard()
    fetchTasks()
  }, [fetchBoard, fetchTasks])

  const onDragEnd = async (result) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStatus = destination.droppableId
    const taskId = parseInt(draggableId)

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )

    try {
      await api.patch(`/api/boards/${boardId}/tasks/${taskId}`, { status: newStatus })
    } catch {
      fetchTasks() // revert on error
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
      } else {
        await api.post(`/api/boards/${boardId}/tasks/`, data)
      }
      setModalOpen(false)
      fetchTasks()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (taskId) => {
    if (!confirm('Usunąć to zadanie?')) return
    try {
      await api.delete(`/api/boards/${boardId}/tasks/${taskId}`)
      setModalOpen(false)
      fetchTasks()
    } catch (err) {
      console.error(err)
    }
  }

  if (!board) {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Tablice
          </Link>
          <h1 className="text-2xl font-bold mt-1">{board.name}</h1>
        </div>
        <button
          onClick={openCreate}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Nowe zadanie
        </button>
      </div>

      {/* Kanban columns */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id)
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

                    {colTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            onClick={() => openEdit(task)}
                            className={`bg-white rounded-lg p-3 mb-2 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow ${
                              snap.isDragging ? 'shadow-lg rotate-2' : ''
                            }`}
                          >
                            <p className="font-medium text-sm leading-snug">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[task.priority]}`}
                              >
                                {PRIORITY_LABEL[task.priority]}
                              </span>
                              {task.due_date && (
                                <span className="text-[10px] text-gray-400">
                                  📅 {new Date(task.due_date).toLocaleDateString('pl-PL')}
                                </span>
                              )}
                              {task.assignee && (
                                <span className="text-[10px] text-gray-400">
                                  👤 {task.assignee.display_name}
                                </span>
                              )}
                            </div>
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
