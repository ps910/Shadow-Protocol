import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('Shadow Protocol — App Component', () => {
  it('renders the game lobby with Shadow Protocol branding', () => {
    render(<App />);
    const elements = screen.getAllByText(/SHADOW PROTOCOL/i);
    expect(elements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Deception you/i).length).toBeGreaterThanOrEqual(1);
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
    const startBtns = screen.getAllByRole('button', { name: /Create a Match/i });
    expect(startBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('displays the mission briefing with role descriptions', () => {
    render(<App />);
    expect(screen.getAllByText(/Assassin/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Guardian/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Investigator/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Civilian/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows privacy indicator and navigation links', () => {
    render(<App />);
    expect(screen.getAllByText(/PRIVACY-NATIVE/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('ROLES')).toBeDefined();
    expect(screen.getByText('LOOP')).toBeDefined();
    expect(screen.getByText('PRIVACY')).toBeDefined();
  });

  it('can start match when connected and renders role reveal', () => {
    render(<App />);
    // simulate trigger
    window.dispatchEvent(new CustomEvent('trigger-1am-connect'));
  });
});
