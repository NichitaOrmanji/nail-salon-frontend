import { Component } from 'react'

// Ловит ошибки рендера, чтобы вместо чёрного экрана показать сообщение.
// homePath/homeLabel — куда вернуться (панель салона передаёт свои)
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack)
  }

  handleReset = () => {
    try { sessionStorage.removeItem('booking') } catch { /* недоступно */ }
    window.location.href = this.props.homePath || '/'
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: '#1a1a1a' }}>
        <h2 className="text-white text-xl font-bold mb-2">Что-то пошло не так</h2>
        <p className="text-gray-500 text-sm mb-2">Попробуйте вернуться на главную.</p>
        <p className="text-gray-600 text-xs mb-8 break-all">{this.state.error.message}</p>
        <button
          onClick={this.handleReset}
          className="px-10 py-4 rounded-2xl text-white font-semibold active:scale-95"
          style={{ backgroundColor: '#f472b6' }}
        >
          {this.props.homeLabel || 'На главную'}
        </button>
      </div>
    )
  }
}
