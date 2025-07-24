import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';

describe('Table Components', () => {
  describe('Table', () => {
    it('renders with default props', () => {
      render(
        <Table>
          <tbody>
            <tr>
              <td>Test content</td>
            </tr>
          </tbody>
        </Table>
      );
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass('w-full', 'caption-bottom', 'text-sm');
    });

    it('applies custom className', () => {
      render(
        <Table className="custom-table-class">
          <tbody>
            <tr>
              <td>Test content</td>
            </tr>
          </tbody>
        </Table>
      );
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('custom-table-class');
    });

    it('forwards additional props', () => {
      render(
        <Table data-testid="test-table" id="my-table">
          <tbody>
            <tr>
              <td>Test content</td>
            </tr>
          </tbody>
        </Table>
      );
      
      const table = screen.getByTestId('test-table');
      expect(table).toHaveAttribute('id', 'my-table');
    });

    it('is wrapped in a scrollable container', () => {
      const { container } = render(
        <Table>
          <tbody>
            <tr>
              <td>Test content</td>
            </tr>
          </tbody>
        </Table>
      );
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('relative', 'w-full', 'overflow-auto');
    });
  });

  describe('TableHeader', () => {
    it('renders with default props', () => {
      render(
        <table>
          <TableHeader>
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </table>
      );
      
      const thead = screen.getByRole('rowgroup');
      expect(thead).toBeInTheDocument();
      expect(thead).toHaveClass('[&_tr]:border-b');
    });

    it('applies custom className', () => {
      render(
        <table>
          <TableHeader className="custom-header-class">
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </table>
      );
      
      const thead = screen.getByRole('rowgroup');
      expect(thead).toHaveClass('custom-header-class');
    });

    it('forwards additional props', () => {
      render(
        <table>
          <TableHeader data-testid="test-header">
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </table>
      );
      
      const thead = screen.getByTestId('test-header');
      expect(thead).toBeInTheDocument();
    });
  });

  describe('TableBody', () => {
    it('renders with default props', () => {
      render(
        <table>
          <TableBody>
            <tr>
              <td>Body content</td>
            </tr>
          </TableBody>
        </table>
      );
      
      const tbody = screen.getByRole('rowgroup');
      expect(tbody).toBeInTheDocument();
      expect(tbody).toHaveClass('[&_tr:last-child]:border-0');
    });

    it('applies custom className', () => {
      render(
        <table>
          <TableBody className="custom-body-class">
            <tr>
              <td>Body content</td>
            </tr>
          </TableBody>
        </table>
      );
      
      const tbody = screen.getByRole('rowgroup');
      expect(tbody).toHaveClass('custom-body-class');
    });

    it('forwards additional props', () => {
      render(
        <table>
          <TableBody data-testid="test-body">
            <tr>
              <td>Body content</td>
            </tr>
          </TableBody>
        </table>
      );
      
      const tbody = screen.getByTestId('test-body');
      expect(tbody).toBeInTheDocument();
    });
  });

  describe('TableFooter', () => {
    it('renders with default props', () => {
      render(
        <table>
          <TableFooter>
            <tr>
              <td>Footer content</td>
            </tr>
          </TableFooter>
        </table>
      );
      
      const tfoot = screen.getByRole('rowgroup');
      expect(tfoot).toBeInTheDocument();
      expect(tfoot).toHaveClass('bg-primary', 'font-medium', 'text-primary-foreground');
    });

    it('applies custom className', () => {
      render(
        <table>
          <TableFooter className="custom-footer-class">
            <tr>
              <td>Footer content</td>
            </tr>
          </TableFooter>
        </table>
      );
      
      const tfoot = screen.getByRole('rowgroup');
      expect(tfoot).toHaveClass('custom-footer-class');
    });

    it('forwards additional props', () => {
      render(
        <table>
          <TableFooter data-testid="test-footer">
            <tr>
              <td>Footer content</td>
            </tr>
          </TableFooter>
        </table>
      );
      
      const tfoot = screen.getByTestId('test-footer');
      expect(tfoot).toBeInTheDocument();
    });
  });

  describe('TableRow', () => {
    it('renders with default props', () => {
      render(
        <table>
          <tbody>
            <TableRow>
              <td>Row content</td>
            </TableRow>
          </tbody>
        </table>
      );
      
      const row = screen.getByRole('row');
      expect(row).toBeInTheDocument();
      expect(row).toHaveClass(
        'border-b',
        'transition-colors',
        'hover:bg-muted/50',
        'data-[state=selected]:bg-muted'
      );
    });

    it('applies custom className', () => {
      render(
        <table>
          <tbody>
            <TableRow className="custom-row-class">
              <td>Row content</td>
            </TableRow>
          </tbody>
        </table>
      );
      
      const row = screen.getByRole('row');
      expect(row).toHaveClass('custom-row-class');
    });

    it('forwards additional props', () => {
      render(
        <table>
          <tbody>
            <TableRow data-testid="test-row">
              <td>Row content</td>
            </TableRow>
          </tbody>
        </table>
      );
      
      const row = screen.getByTestId('test-row');
      expect(row).toBeInTheDocument();
    });

    it('supports hover and selected states', () => {
      render(
        <table>
          <tbody>
            <TableRow data-state="selected">
              <td>Selected row</td>
            </TableRow>
          </tbody>
        </table>
      );
      
      const row = screen.getByRole('row');
      expect(row).toHaveAttribute('data-state', 'selected');
    });
  });

  describe('TableHead', () => {
    it('renders with default props', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead>Header cell</TableHead>
            </tr>
          </thead>
        </table>
      );
      
      const headerCell = screen.getByRole('columnheader');
      expect(headerCell).toBeInTheDocument();
      expect(headerCell).toHaveClass(
        'h-12',
        'px-4',
        'text-left',
        'align-middle',
        'font-medium',
        'text-muted-foreground',
        '[&:has([role=checkbox])]:pr-0'
      );
    });

    it('applies custom className', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead className="custom-head-class">Header cell</TableHead>
            </tr>
          </thead>
        </table>
      );
      
      const headerCell = screen.getByRole('columnheader');
      expect(headerCell).toHaveClass('custom-head-class');
    });

    it('forwards additional props', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead data-testid="test-head" scope="col">
                Header cell
              </TableHead>
            </tr>
          </thead>
        </table>
      );
      
      const headerCell = screen.getByTestId('test-head');
      expect(headerCell).toHaveAttribute('scope', 'col');
    });
  });

  describe('TableCell', () => {
    it('renders with default props', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell>Cell content</TableCell>
            </tr>
          </tbody>
        </table>
      );
      
      const cell = screen.getByRole('cell');
      expect(cell).toBeInTheDocument();
      expect(cell).toHaveClass(
        'p-4',
        'align-middle',
        '[&:has([role=checkbox])]:pr-0'
      );
    });

    it('applies custom className', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell className="custom-cell-class">Cell content</TableCell>
            </tr>
          </tbody>
        </table>
      );
      
      const cell = screen.getByRole('cell');
      expect(cell).toHaveClass('custom-cell-class');
    });

    it('forwards additional props', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell data-testid="test-cell" colSpan={2}>
                Cell content
              </TableCell>
            </tr>
          </tbody>
        </table>
      );
      
      const cell = screen.getByTestId('test-cell');
      expect(cell).toHaveAttribute('colSpan', '2');
    });
  });

  describe('TableCaption', () => {
    it('renders with default props', () => {
      render(
        <table>
          <TableCaption>Table caption</TableCaption>
          <tbody>
            <tr>
              <td>Content</td>
            </tr>
          </tbody>
        </table>
      );
      
      const caption = screen.getByText('Table caption');
      expect(caption).toBeInTheDocument();
      expect(caption).toHaveClass('mt-4', 'text-sm', 'text-muted-foreground');
    });

    it('applies custom className', () => {
      render(
        <table>
          <TableCaption className="custom-caption-class">
            Table caption
          </TableCaption>
          <tbody>
            <tr>
              <td>Content</td>
            </tr>
          </tbody>
        </table>
      );
      
      const caption = screen.getByText('Table caption');
      expect(caption).toHaveClass('custom-caption-class');
    });

    it('forwards additional props', () => {
      render(
        <table>
          <TableCaption data-testid="test-caption">
            Table caption
          </TableCaption>
          <tbody>
            <tr>
              <td>Content</td>
            </tr>
          </tbody>
        </table>
      );
      
      const caption = screen.getByTestId('test-caption');
      expect(caption).toBeInTheDocument();
    });
  });
});