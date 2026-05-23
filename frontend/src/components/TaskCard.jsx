const PRIORITY_BADGE = {
  low: 'bg-gray-200 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

const PRIORITY_LABEL = { low: 'Niski', medium: 'Średni', high: 'Wysoki' }

function getDueDateInfo(dueDateStr) {
  if (!dueDateStr) return null
  const due = new Date(dueDateStr)
  const now = new Date()
  const diffMs = due - now
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: `${Math.abs(diffDays)} dni po terminie`, color: 'text-red-600 font-semibold' }
  if (diffDays === 0) return { label: 'Dziś!', color: 'text-orange-600 font-semibold' }
  if (diffDays === 1) return { label: 'Jutro', color: 'text-orange-500' }
  if (diffDays <= 3) return { label: `Za ${diffDays} dni`, color: 'text-yellow-600' }
  return { label: due.toLocaleDateString('pl-PL'), color: 'text-gray-400' }
}

export default function TaskCard({ task, onClick, isDragging }) {
  const dueInfo = getDueDateInfo(task.due_date)

  return (
    <div
      onClick={() => onClick(task)}
      className={`bg-white rounded-lg p-3 mb-2 shadow-sm border cursor-pointer
        hover:shadow-md transition-all
        ${isDragging ? 'shadow-lg rotate-2 border-brand-300' : 'border-gray-100'}
        ${task.priority === 'high' ? 'border-l-4 border-l-red-400' : ''}
        ${task.priority === 'medium' ? 'border-l-4 border-l-yellow-400' : ''}
        ${task.priority === 'low' ? 'border-l-4 border-l-gray-300' : ''}
      `}
    >
      <p className="font-medium text-sm leading-snug">{task.title}</p>

      {task.description && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[task.priority]}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>

        {dueInfo && (
          <span className={`text-[10px] ${dueInfo.color}`}>
            📅 {dueInfo.label}
          </span>
        )}

        {task.assignee && (
          <span className="text-[10px] text-gray-400 ml-auto">
            👤 {task.assignee.display_name}
          </span>
        )}
      </div>
    </div>
  )
}
