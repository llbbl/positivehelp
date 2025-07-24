import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
  it('renders with default props', () => {
    render(<Textarea />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveClass(
      'flex',
      'min-h-[60px]',
      'w-full',
      'rounded-md',
      'border',
      'border-input',
      'bg-transparent',
      'px-3',
      'py-2',
      'text-base',
      'shadow-sm',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none',
      'focus-visible:ring-1',
      'focus-visible:ring-ring',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
      'md:text-sm'
    );
  });

  it('applies custom className', () => {
    render(<Textarea className="custom-textarea-class" />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('custom-textarea-class');
  });

  it('forwards additional props', () => {
    render(
      <Textarea 
        data-testid="test-textarea" 
        id="my-textarea"
        rows={5}
      />
    );
    
    const textarea = screen.getByTestId('test-textarea');
    expect(textarea).toHaveAttribute('id', 'my-textarea');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('handles disabled state', () => {
    render(<Textarea disabled />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('renders with different values', () => {
    const testValue = 'This is a test value';
    render(<Textarea value={testValue} readOnly />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(testValue);
  });

  it('handles onChange event', () => {
    const handleChange = jest.fn();
    render(<Textarea onChange={handleChange} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New text content' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: 'New text content'
        })
      })
    );
  });

  it('supports placeholder text', () => {
    const placeholderText = 'Enter your message here...';
    render(<Textarea placeholder={placeholderText} />);
    
    const textarea = screen.getByPlaceholderText(placeholderText);
    expect(textarea).toBeInTheDocument();
  });

  it('supports controlled component pattern', () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('Initial value');
      
      return (
        <Textarea 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          data-testid="controlled-textarea"
        />
      );
    };

    render(<TestComponent />);
    
    const textarea = screen.getByTestId('controlled-textarea');
    expect(textarea).toHaveValue('Initial value');
    
    fireEvent.change(textarea, { target: { value: 'Updated value' } });
    expect(textarea).toHaveValue('Updated value');
  });

  it('supports required attribute', () => {
    render(<Textarea required />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeRequired();
  });

  it('supports custom attributes', () => {
    render(
      <Textarea 
        maxLength={100}
        name="message"
        autoComplete="off"
      />
    );
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('maxLength', '100');
    expect(textarea).toHaveAttribute('name', 'message');
    expect(textarea).toHaveAttribute('autoComplete', 'off');
  });

  it('maintains ref forwarding', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    expect(ref.current).toBe(screen.getByRole('textbox'));
  });
});