import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

vi.mock('../pages/LoginPage', () => ({
  default: {
    AppLogin: () => <div data-testid="mock-login">Login Page Mock</div>
  }
}));

vi.mock('../services/firebase/FirebaseAuthenticationManager.jsx', () => ({
  default: {
    getCurrentUser: vi.fn(() => null),
    onAuthStateChanged: vi.fn(),
  }
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.querySelector('.App')).toBeInTheDocument();
    expect(screen.getByTestId('mock-login')).toBeInTheDocument();
  });
});
