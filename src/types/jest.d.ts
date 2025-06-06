import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveAttribute(attr: string, value?: string): R;
      toBeDisabled(): R;
      toHaveTextContent(text: string): R;
      toBeVisible(): R;
      toHaveValue(value: string | number): R;
    }
  }
}
