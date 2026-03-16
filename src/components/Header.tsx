import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Menu, X, ChefHat, Heart } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setIsMenuOpen(false)
    }
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center group-hover:bg-primary-600 transition-colors">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-gray-900">
              Foodie<span className="text-primary-500">Hub</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className="text-gray-600 hover:text-primary-500 font-medium transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/search" 
              className="text-gray-600 hover:text-primary-500 font-medium transition-colors"
            >
              Recipes
            </Link>
            <Link 
              to="/favorites" 
              className="flex items-center gap-1 text-gray-600 hover:text-primary-500 font-medium transition-colors"
            >
              <Heart className="w-4 h-4" />
              Favorites
            </Link>
          </nav>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes..."
                className="w-64 pl-10 pr-4 py-2 rounded-full bg-gray-100 border-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </form>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-primary-500"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-fade-in">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recipes..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-100 border-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </form>
            <nav className="flex flex-col gap-2">
              <Link 
                to="/" 
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-primary-500 font-medium transition-colors"
              >
                Home
              </Link>
              <Link 
                to="/search" 
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-primary-500 font-medium transition-colors"
              >
                Recipes
              </Link>
              <Link 
                to="/favorites" 
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-primary-500 font-medium transition-colors flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Favorites
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}