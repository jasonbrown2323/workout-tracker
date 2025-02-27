// Mock the new pages to avoid test errors
jest.mock('./pages/WorkoutProgramsList', () => () => <div>Programs List</div>);
jest.mock('./pages/WorkoutProgramDetail', () => () => <div>Program Detail</div>);
jest.mock('./pages/WorkoutProgramCreate', () => () => <div>Create Program</div>);

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// We don't need to wrap App in BrowserRouter since it already contains a Router
test('renders workout tracker application', () => {
  render(<App />);
  // Check for navbar logo - more specific using the navbar class
  const navbarLogo = screen.getByText('WorkoutTracker', { 
    selector: '.bg-indigo-600 .font-bold' 
  });
  expect(navbarLogo).toBeInTheDocument();
});
