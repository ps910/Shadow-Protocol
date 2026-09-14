import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('Shadow Protocol — App Component', () => {
  it('renders the game lobby with Shadow Protocol branding', () => {
    render(<App />);
    const elements = screen.getAllByText('Shadow Protocol');
    expect(elements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Privacy-First Social Deduction')).toBeDefined();
  });

  it('displays all 6 player agents in the lobby', () => {
    render(<App />);
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('Bob')).toBeDefined();
    expect(screen.getByText('Charlie')).toBeDefined();
    expect(screen.getByText('David')).toBeDefined();
    expect(screen.getByText('Emma')).toBeDefined();
    expect(screen.getByText('Frank')).toBeDefined();
  });

  it('shows the start game button in lobby', () => {
    render(<App />);
    const startBtn = screen.getByText(/Begin Shadow Protocol/);
    expect(startBtn).toBeDefined();
  });

  it('displays the mission briefing with role descriptions', () => {
    render(<App />);
    expect(screen.getByText(/Assassin/)).toBeDefined();
    expect(screen.getByText(/Guardian/)).toBeDefined();
    expect(screen.getByText(/Investigator/)).toBeDefined();
    expect(screen.getByText(/Civilians/)).toBeDefined();
  });

  it('shows privacy indicator in the hero section', () => {
    render(<App />);
    expect(screen.getByText(/Privacy is the gameplay mechanic/)).toBeDefined();
  });
});
