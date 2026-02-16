import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './TodosPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

type TodoStatus = 'not_started' | 'in_progress' | 'finished';
type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';
type ViewMode = 'todos' | 'archived';

interface Todo {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  deadline: string | null;
  time_left_seconds?: number | null;
  time_left_human?: string | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

interface TodoCreatePayload {
  title: string;
  description: string;
  deadline?: string;
  priority: TodoPriority;
}

interface TodoUpdatePayload {
  title?: string;
  description?: string;
  status?: TodoStatus;
  deadline?: string | null;
  priority?: TodoPriority;
}

const PRIORITY_ORDER: Record<TodoPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const PRIORITIES: TodoPriority[] = ['urgent', 'high', 'medium', 'low'];

const pad2 = (value: number) => String(value).padStart(2, '0');

const statusLabel = (status: TodoStatus) => {
  if (status === 'not_started') return 'Not Started';
  if (status === 'in_progress') return 'In Progress';
  return 'Finished';
};

const getDeadlineSeconds = (deadline: string | null): number | null => {
  if (!deadline) return null;
  const nowMs = Date.now();
  const deadlineMs = new Date(deadline).getTime();
  return Math.floor((deadlineMs - nowMs) / 1000);
};

const formatRelativeTimeFromSeconds = (secondsLeft: number | null): string => {
  if (secondsLeft === null) return 'No deadline';
  const delta = secondsLeft;
  const overdue = delta < 0;
  let total = Math.abs(delta);

  const days = Math.floor(total / 86400);
  total %= 86400;
  const hours = Math.floor(total / 3600);
  total %= 3600;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return overdue ? `${parts.join(' ')} overdue` : `${parts.join(' ')} left`;
};

const formatRelativeTime = (deadline: string | null): string =>
  formatRelativeTimeFromSeconds(getDeadlineSeconds(deadline));

const getTimerColor = (secondsLeft: number | null): string => {
  if (secondsLeft === null) return '#a3a3a3';
  if (secondsLeft <= 0) return '#ef4444';

  const day = 24 * 60 * 60;

  // <= 1 day: solid red
  if (secondsLeft <= day) return '#ef4444';

  // >= 3 days: solid blue
  if (secondsLeft >= 3 * day) return 'hsl(210 90% 62%)';

  // 1..3 days: interpolate blue -> red in RGB space (no green hue crossing)
  const ratio = (secondsLeft - day) / (2 * day); // 0..1
  const redStart = 239;
  const greenStart = 68;
  const blueStart = 68;
  const redEnd = 59;
  const greenEnd = 130;
  const blueEnd = 246;

  const r = Math.round(redStart + (redEnd - redStart) * ratio);
  const g = Math.round(greenStart + (greenEnd - greenStart) * ratio);
  const b = Math.round(blueStart + (blueEnd - blueStart) * ratio);

  return `rgb(${r} ${g} ${b})`;
};

const toApiDeadline = (date: string, time: string): string | null => {
  if (!date) return null;
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = (time || '23:59').split(':').map(Number);
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return localDate.toISOString();
};

const toDateInput = (deadline: string | null): string => {
  if (!deadline) return '';
  const date = new Date(deadline);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const toTimeInput = (deadline: string | null): string => {
  if (!deadline) return '';
  const date = new Date(deadline);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const TimerText: React.FC<{ deadline: string | null }> = ({ deadline }) => {
  const [timerState, setTimerState] = useState(() => {
    const seconds = getDeadlineSeconds(deadline);
    return {
      text: formatRelativeTimeFromSeconds(seconds),
      color: getTimerColor(seconds),
    };
  });

  useEffect(() => {
    const refresh = () => {
      const seconds = getDeadlineSeconds(deadline);
      setTimerState({
        text: formatRelativeTimeFromSeconds(seconds),
        color: getTimerColor(seconds),
      });
    };

    refresh();
    if (!deadline) return;

    const intervalId = window.setInterval(() => {
      refresh();
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [deadline]);

  return (
    <div className="todo-deadline" style={{ color: timerState.color }}>
      {timerState.text}
    </div>
  );
};

const TodosPage: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('todos');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createDate, setCreateDate] = useState('');
  const [createTime, setCreateTime] = useState('');
  const [createPriority, setCreatePriority] = useState<TodoPriority>('medium');

  const [detailTodo, setDetailTodo] = useState<Todo | null>(null);
  const [archiveCandidate, setArchiveCandidate] = useState<Todo | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Todo | null>(null);

  const fetchTodos = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<Todo[]>(`${API_URL}/todos/`);
      setTodos(response.data);
    } catch (error) {
      console.error('Failed to fetch todos', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const activeTodos = useMemo(() => todos.filter((todo) => todo.status !== 'finished'), [todos]);
  const archivedTodos = useMemo(() => todos.filter((todo) => todo.status === 'finished'), [todos]);

  const groupedActive = useMemo(() => {
    const grouped: Record<TodoPriority, Todo[]> = {
      urgent: [],
      high: [],
      medium: [],
      low: [],
    };

    activeTodos.forEach((todo) => grouped[todo.priority].push(todo));

    for (const priority of PRIORITIES) {
      grouped[priority].sort((a, b) => {
        const aTime = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });
    }

    return grouped;
  }, [activeTodos]);

  const stats = useMemo(() => {
    const total = activeTodos.length;
    const inProgress = activeTodos.filter((todo) => todo.status === 'in_progress').length;
    const completed = archivedTodos.length;
    const overdue = activeTodos.filter((todo) => todo.deadline && new Date(todo.deadline).getTime() < Date.now()).length;
    return { total, inProgress, completed, overdue };
  }, [activeTodos, archivedTodos]);

  const patchTodo = async (id: string, payload: TodoUpdatePayload) => {
    const response = await axios.patch<Todo>(`${API_URL}/todos/${id}`, payload);
    setTodos((prev) => prev.map((todo) => (todo.id === id ? response.data : todo)));
    return response.data;
  };

  const updateStatus = async (todo: Todo, status: TodoStatus) => {
    if (status === 'finished') {
      setArchiveCandidate(todo);
      return;
    }

    try {
      const updated = await patchTodo(todo.id, { status });
      if (detailTodo && detailTodo.id === updated.id) setDetailTodo(updated);
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const confirmArchive = async () => {
    if (!archiveCandidate) return;

    try {
      const updated = await patchTodo(archiveCandidate.id, { status: 'finished' });
      if (detailTodo && detailTodo.id === updated.id) setDetailTodo(null);
      setArchiveCandidate(null);
    } catch (error) {
      console.error('Failed to archive todo', error);
    }
  };

  const restoreTodo = async (todo: Todo) => {
    try {
      await patchTodo(todo.id, { status: 'not_started' });
      setViewMode('todos');
    } catch (error) {
      console.error('Failed to restore todo', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/todos/${id}`);
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
      if (detailTodo && detailTodo.id === id) setDetailTodo(null);
    } catch (error) {
      console.error('Failed to delete todo', error);
    }
  };

  const requestDelete = (todo: Todo) => {
    setDeleteCandidate(todo);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    await deleteTodo(deleteCandidate.id);
    setDeleteCandidate(null);
  };

  const openCreateModal = () => {
    setEditingTodoId(null);
    setCreateTitle('');
    setCreateDescription('');
    setCreateDate('');
    setCreateTime('');
    setCreatePriority('medium');
    setShowCreateModal(true);
  };

  const openEditModal = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setCreateTitle(todo.title);
    setCreateDescription(todo.description || '');
    setCreateDate(toDateInput(todo.deadline));
    setCreateTime(toTimeInput(todo.deadline));
    setCreatePriority(todo.priority);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  const saveCreateOrEdit = async () => {
    const title = createTitle.trim();
    if (!title) return;

    const deadline = toApiDeadline(createDate, createTime);

    try {
      if (editingTodoId) {
        const updated = await patchTodo(editingTodoId, {
          title,
          description: createDescription,
          deadline,
          priority: createPriority,
        });
        if (detailTodo && detailTodo.id === updated.id) setDetailTodo(updated);
      } else {
        const payload: TodoCreatePayload = {
          title,
          description: createDescription,
          priority: createPriority,
        };
        if (deadline) payload.deadline = deadline;

        const response = await axios.post<Todo>(`${API_URL}/todos/`, payload);
        setTodos((prev) => [response.data, ...prev]);
      }

      closeCreateModal();
    } catch (error) {
      console.error('Failed to save todo', error);
    }
  };

  const openDetailModal = (todo: Todo) => {
    setDetailTodo(todo);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderPriorityTitle = (priority: TodoPriority) => {
    if (priority === 'urgent') return 'Urgent';
    if (priority === 'high') return 'High';
    if (priority === 'medium') return 'Medium';
    return 'Low';
  };

  return (
    <div className="todo-app-shell">
      <div className="app-container">
        <header className="header">
          <div>
            <h1>Todo Manager</h1>
            <p className="subhead">{user ? `Signed in as ${user.name}` : 'Task board'}</p>
          </div>

          <div className="header-right">
            <div className="stats">
              <div className="stat-item">
                <div className="stat-value stat-total">{stats.total}</div>
                <div className="stat-label">Total</div>
              </div>
              <div className="stat-item">
                <div className="stat-value stat-in-progress">{stats.inProgress}</div>
                <div className="stat-label">In Progress</div>
              </div>
              <div className="stat-item">
                <div className="stat-value stat-completed">{stats.completed}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value stat-overdue">{stats.overdue}</div>
                <div className="stat-label">Overdue</div>
              </div>
            </div>

            <div className="header-nav">
              <button
                className={`nav-btn ${viewMode === 'todos' ? 'active' : ''}`}
                onClick={() => setViewMode('todos')}
                type="button"
              >
                Active
              </button>
              <button
                className={`nav-btn ${viewMode === 'archived' ? 'active' : ''}`}
                onClick={() => setViewMode('archived')}
                type="button"
              >
                Archived
              </button>
              <button className="nav-btn logout" type="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="input-section">
          <button type="button" onClick={openCreateModal}>+ Create Task</button>
        </section>

        {isLoading ? (
          <div className="loading">Loading tasks...</div>
        ) : viewMode === 'todos' ? (
          <section className="columns-container">
            {PRIORITIES.map((priority) => (
              <div className="column" key={priority}>
                <div className={`column-header ${priority}`}>{renderPriorityTitle(priority)}</div>

                <div className="todos-list">
                  {groupedActive[priority].length === 0 ? (
                    <div className="empty-state">No tasks</div>
                  ) : (
                    groupedActive[priority].map((todo) => (
                      <article className="todo-card" key={todo.id} onClick={() => openDetailModal(todo)}>
                        <div className="todo-card-actions" onClick={(event) => event.stopPropagation()}>
                          <button
                            className="icon-btn"
                            title="Edit"
                            type="button"
                            onClick={() => openEditModal(todo)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="icon-btn"
                            title="Delete"
                            type="button"
                            onClick={() => requestDelete(todo)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="todo-card-content">
                          <div className="todo-title">{todo.title}</div>

                          <div className="todo-status-buttons" onClick={(event) => event.stopPropagation()}>
                            {(['not_started', 'in_progress', 'finished'] as TodoStatus[]).map((status) => (
                              <button
                                key={status}
                                className={`status-btn ${todo.status === status ? 'active' : ''}`}
                                data-status={status}
                                type="button"
                                onClick={() => updateStatus(todo, status)}
                              >
                                {statusLabel(status)}
                              </button>
                            ))}
                          </div>

                          <TimerText deadline={todo.deadline} />
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section className="archived-view">
            {archivedTodos.length === 0 ? (
              <div className="empty-state">No archived tasks yet</div>
            ) : (
              archivedTodos
                .slice()
                .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
                .map((todo) => (
                  <article key={todo.id} className="archived-card">
                    <div className="archived-info">
                      <div className="archived-title">{todo.title}</div>
                      <div className="archived-date">Priority: {todo.priority}</div>
                    </div>
                    <button className="unarchive-btn" type="button" onClick={() => restoreTodo(todo)}>
                      Restore
                    </button>
                  </article>
                ))
            )}
          </section>
        )}
      </div>

      <div className={`create-task-modal ${showCreateModal ? 'open' : ''}`} onClick={closeCreateModal}>
        <div className="create-task-content" onClick={(event) => event.stopPropagation()}>
          <div className="create-task-header">
            <h2>{editingTodoId ? 'Edit Task' : 'Create New Task'}</h2>
            <button className="close-create-task" type="button" onClick={closeCreateModal}>
              <X size={22} />
            </button>
          </div>

          <div className="create-task-field">
            <label htmlFor="create-title">Task Title *</label>
            <input
              id="create-title"
              type="text"
              placeholder="Enter task title..."
              value={createTitle}
              onChange={(event) => setCreateTitle(event.target.value)}
            />
          </div>

          <div className="create-task-field">
            <label htmlFor="create-description">Description</label>
            <textarea
              id="create-description"
              placeholder="Add details about this task..."
              value={createDescription}
              onChange={(event) => setCreateDescription(event.target.value)}
            />
          </div>

          <div className="create-task-row">
            <div className="create-task-field">
              <label htmlFor="create-date">Due Date</label>
              <input
                className="date-input"
                id="create-date"
                type="date"
                value={createDate}
                onChange={(event) => setCreateDate(event.target.value)}
              />
            </div>
            <div className="create-task-field">
              <label htmlFor="create-time">Time</label>
              <input
                className="time-input"
                id="create-time"
                type="time"
                value={createTime}
                onChange={(event) => setCreateTime(event.target.value)}
              />
            </div>
          </div>

          <div className="create-task-field">
            <label htmlFor="create-priority">Priority</label>
            <select
              id="create-priority"
              value={createPriority}
              onChange={(event) => setCreatePriority(event.target.value as TodoPriority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="create-task-actions">
            <button className="create-btn" type="button" onClick={saveCreateOrEdit}>
              {editingTodoId ? 'Save Changes' : 'Create Task'}
            </button>
            <button className="cancel-btn" type="button" onClick={closeCreateModal}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div className={`detail-modal ${detailTodo ? 'open' : ''}`} onClick={() => setDetailTodo(null)}>
        <div className="detail-content" onClick={(event) => event.stopPropagation()}>
          {detailTodo ? (
            <>
              <div className="detail-header">
                <div>
                  <div className="detail-title">{detailTodo.title}</div>
                  <span className={`detail-priority ${detailTodo.priority}`}>{detailTodo.priority}</span>
                </div>
                <button className="close-detail" type="button" onClick={() => setDetailTodo(null)}>
                  <X size={22} />
                </button>
              </div>

              <div className="detail-section">
                <div className="detail-section-label">Description</div>
                <div className="detail-section-content">{detailTodo.description || '(No description)'}</div>
              </div>

              <div className="detail-section">
                <div className="detail-section-label">Deadline</div>
                <div className="detail-section-content">{formatRelativeTime(detailTodo.deadline)}</div>
              </div>

              <div className="detail-section">
                <div className="detail-section-label">Status</div>
                <div className="detail-status-buttons">
                  {(['not_started', 'in_progress', 'finished'] as TodoStatus[]).map((status) => (
                    <button
                      key={status}
                      className={`status-btn ${detailTodo.status === status ? 'active' : ''}`}
                      data-status={status}
                      type="button"
                      onClick={() => {
                        if (status === 'finished') {
                          setDetailTodo(null);
                          setArchiveCandidate(detailTodo);
                          return;
                        }

                        updateStatus(detailTodo, status);
                      }}
                    >
                      {statusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className={`confirmation-modal ${archiveCandidate ? 'open' : ''}`} onClick={() => setArchiveCandidate(null)}>
        <div className="confirmation-content" onClick={(event) => event.stopPropagation()}>
          <h3>Archive Task?</h3>
          <p>Move this task to archived collection?</p>
          <div className="confirmation-buttons">
            <button className="confirm-yes" type="button" onClick={confirmArchive}>Yes, Archive</button>
            <button className="confirm-no" type="button" onClick={() => setArchiveCandidate(null)}>Cancel</button>
          </div>
        </div>
      </div>

      <div className={`confirmation-modal ${deleteCandidate ? 'open' : ''}`} onClick={() => setDeleteCandidate(null)}>
        <div className="confirmation-content" onClick={(event) => event.stopPropagation()}>
          <h3>Delete Task?</h3>
          <p>This task will be permanently deleted.</p>
          <div className="confirmation-buttons">
            <button className="confirm-delete" type="button" onClick={confirmDelete}>Yes, Delete</button>
            <button className="confirm-no" type="button" onClick={() => setDeleteCandidate(null)}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodosPage;
