import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl">WorkoutTracker</span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500"
                >
                  Dashboard
                </Link>
                <Link
                  to="/workouts"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500"
                >
                  Workouts
                </Link>
                <Link
                  to="/workouts/create"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500"
                >
                  Log Workout
                </Link>
                <Link
                  to="/programs"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500"
                >
                  Programs
                </Link>
                <Link
                  to="/templates"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500"
                >
                  Templates
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <div className="flex items-center">
                  <Link
                    to="/profile"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="ml-4 px-3 py-2 rounded-md text-sm font-medium bg-indigo-700 hover:bg-indigo-800"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex items-center">
                  <Link
                    to="/login"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="ml-4 px-3 py-2 rounded-md text-sm font-medium bg-indigo-700 hover:bg-indigo-800"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={toggleMenu}
              className="bg-indigo-600 inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-indigo-500 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/workouts"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
              onClick={() => setIsMenuOpen(false)}
            >
              Workouts
            </Link>
            <Link
              to="/workouts/create"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
              onClick={() => setIsMenuOpen(false)}
            >
              Log Workout
            </Link>
            <Link
              to="/programs"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
              onClick={() => setIsMenuOpen(false)}
            >
              Programs
            </Link>
            <Link
              to="/templates"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
              onClick={() => setIsMenuOpen(false)}
            >
              Templates
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-indigo-700">
            <div className="px-2 space-y-1">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;