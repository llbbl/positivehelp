import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('renders input with default props', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('renders with placeholder text', () => {
    render(<Input placeholder="Enter your name" />);
    
    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('test value');
  });

  it('supports different input types', () => {
    render(<Input type="email" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('renders password input type', () => {
    render(<Input type="password" />);
    
    // Password inputs don't have textbox role, so query by type
    const input = document.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
  });

  it('disables input when disabled prop is true', () => {
    render(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('forwards custom className', () => {
    render(<Input className="custom-input-class" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input-class');
  });

  it('applies default styling classes', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass(
      'flex',
      'h-10',
      'w-full',
      'rounded-md',
      'border',
      'border-input',
      'bg-background',
      'px-3',
      'py-2'
    );
  });

  it('handles focus events', () => {
    const handleFocus = jest.fn();
    render(<Input onFocus={handleFocus} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    
    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  it('supports required attribute', () => {
    render(<Input required />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  it('supports name attribute', () => {
    render(<Input name="username" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('name', 'username');
  });

  it('supports maxLength attribute', () => {
    render(<Input maxLength={10} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '10');
  });

  it('handles number input type correctly', () => {
    render(<Input type="number" min={0} max={100} />);
    
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });
});