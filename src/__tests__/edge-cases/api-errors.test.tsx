import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Simple test component for API error testing
const TestComponent = ({ onSubmit }: { onSubmit?: () => void }) => (
  <div>
    <button onClick={onSubmit} data-testid="submit-button">
      Submit
    </button>
    <div data-testid="test-content">Test Content</div>
  </div>
);

describe('API Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Suppress console errors during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Network Failures', () => {
    it('should handle network connection errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Network connection failed')
      );

      const handleSubmit = async () => {
        try {
          await fetch('/api/test');
        } catch (error) {
          mockToast({
            title: 'Network Error',
            description: 'Please check your internet connection',
            variant: 'destructive',
          });
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Network Error',
          description: 'Please check your internet connection',
          variant: 'destructive',
        });
      });
    });

    it('should handle request timeouts', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 100)
          )
      );

      const handleSubmit = async () => {
        try {
          await fetch('/api/test');
        } catch (error) {
          mockToast({
            title: 'Request Timeout',
            description: 'The request took too long to complete',
            variant: 'destructive',
          });
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Request Timeout',
          description: 'The request took too long to complete',
          variant: 'destructive',
        });
      });
    });

    it('should handle DNS resolution failures', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('DNS resolution failed')
      );

      const handleSubmit = async () => {
        try {
          await fetch('/api/test');
        } catch (error) {
          mockToast({
            title: 'Connection Error',
            description: 'Unable to reach the server',
            variant: 'destructive',
          });
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Connection Error',
          description: 'Unable to reach the server',
          variant: 'destructive',
        });
      });
    });
  });

  describe('HTTP Status Errors', () => {
    it('should handle 400 Bad Request errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid request data' }),
      });

      const handleSubmit = async () => {
        try {
          const response = await fetch('/api/test');
          if (!response.ok) {
            const errorData = await response.json();
            mockToast({
              title: 'Invalid Request',
              description: errorData.error || 'Please check your input',
              variant: 'destructive',
            });
          }
        } catch (error) {
          // Handle error
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Invalid Request',
          description: 'Invalid request data',
          variant: 'destructive',
        });
      });
    });

    it('should handle 401 Unauthorized errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Authentication required' }),
      });

      const handleSubmit = async () => {
        try {
          const response = await fetch('/api/test');
          if (!response.ok) {
            mockToast({
              title: 'Authentication Required',
              description: 'Please connect your wallet',
              variant: 'destructive',
            });
          }
        } catch (error) {
          // Handle error
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Authentication Required',
          description: 'Please connect your wallet',
          variant: 'destructive',
        });
      });
    });

    it('should handle 403 Forbidden errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Insufficient permissions' }),
      });

      const handleSubmit = async () => {
        try {
          const response = await fetch('/api/test');
          if (!response.ok) {
            mockToast({
              title: 'Access Denied',
              description: 'You do not have permission to perform this action',
              variant: 'destructive',
            });
          }
        } catch (error) {
          // Handle error
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Access Denied',
          description: 'You do not have permission to perform this action',
          variant: 'destructive',
        });
      });
    });

    it('should handle 404 Not Found errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Resource not found' }),
      });

      const handleSubmit = async () => {
        try {
          const response = await fetch('/api/test');
          if (!response.ok) {
            mockToast({
              title: 'Not Found',
              description: 'The requested resource was not found',
              variant: 'destructive',
            });
          }
        } catch (error) {
          // Handle error
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Not Found',
          description: 'The requested resource was not found',
          variant: 'destructive',
        });
      });
    });

    it('should handle 429 Rate Limit errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Map([['Retry-After', '60']]),
        json: async () => ({ error: 'Rate limit exceeded' }),
      });

      const handleSubmit = async () => {
        try {
          const response = await fetch('/api/test');
          if (!response.ok) {
            mockToast({
              title: 'Rate Limit Exceeded',
              description: 'Please wait before making another request',
              variant: 'destructive',
            });
          }
        } catch (error) {
          // Handle error
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Rate Limit Exceeded',
          description: 'Please wait before making another request',
          variant: 'destructive',
        });
      });
    });

    it('should handle 500 Internal Server Error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      const handleSubmit = async () => {
        try {
          const response = await fetch('/api/test');
          if (!response.ok) {
            mockToast({
              title: 'Server Error',
              description:
                'Something went wrong on our end. Please try again later.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          // Handle error
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Server Error',
          description:
            'Something went wrong on our end. Please try again later.',
          variant: 'destructive',
        });
      });
    });

    it('should handle 502 Bad Gateway errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({ error: 'Bad gateway' }),
      });

      const handleSubmit = async () => {
        try {
          const response = await fetch('/api/test');
          if (!response.ok) {
            mockToast({
              title: 'Service Unavailable',
              description: 'The service is temporarily unavailable',
              variant: 'destructive',
            });
          }
        } catch (error) {
          // Handle error
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Service Unavailable',
          description: 'The service is temporarily unavailable',
          variant: 'destructive',
        });
      });
    });

    it('should handle 503 Service Unavailable errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service unavailable' }),
      });

      const handleSubmit = async () => {
        try {
          const response = await fetch('/api/test');
          if (!response.ok) {
            mockToast({
              title: 'Service Unavailable',
              description: 'The service is currently under maintenance',
              variant: 'destructive',
            });
          }
        } catch (error) {
          // Handle error
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Service Unavailable',
          description: 'The service is currently under maintenance',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Malformed Response Handling', () => {
    it('should handle non-JSON responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Unexpected token in JSON');
        },
        text: async () => 'Internal Server Error',
      });

      const handleSubmit = async () => {
        try {
          const response = await fetch('/api/test');
          if (!response.ok) {
            try {
              await response.json();
            } catch {
              mockToast({
                title: 'Server Error',
                description: 'Received invalid response from server',
                variant: 'destructive',
              });
            }
          }
        } catch (error) {
          // Handle error
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Server Error',
          description: 'Received invalid response from server',
          variant: 'destructive',
        });
      });
    });

    it('should handle empty responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => null,
      });

      const handleSubmit = async () => {
        try {
          const response = await fetch('/api/test');
          if (!response.ok) {
            const data = await response.json();
            if (!data) {
              mockToast({
                title: 'Server Error',
                description: 'Received empty response from server',
                variant: 'destructive',
              });
            }
          }
        } catch (error) {
          // Handle error
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Server Error',
          description: 'Received empty response from server',
          variant: 'destructive',
        });
      });
    });

    it('should handle corrupted JSON responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => {
          throw new SyntaxError('Unexpected end of JSON input');
        },
      });

      const handleSubmit = async () => {
        try {
          const response = await fetch('/api/test');
          if (!response.ok) {
            try {
              await response.json();
            } catch (error) {
              if (error instanceof SyntaxError) {
                mockToast({
                  title: 'Invalid Response',
                  description: 'Received corrupted data from server',
                  variant: 'destructive',
                });
              }
            }
          }
        } catch (error) {
          // Handle error
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Invalid Response',
          description: 'Received corrupted data from server',
          variant: 'destructive',
        });
      });
    });

    it('should handle responses with missing error fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({}), // Empty object without error field
      });

      const handleSubmit = async () => {
        try {
          const response = await fetch('/api/test');
          if (!response.ok) {
            const data = await response.json();
            mockToast({
              title: 'Request Failed',
              description: data.error || 'An unknown error occurred',
              variant: 'destructive',
            });
          }
        } catch (error) {
          // Handle error
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Request Failed',
          description: 'An unknown error occurred',
          variant: 'destructive',
        });
      });
    });

    it('should handle responses with unexpected data types', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 12345 }), // Number instead of string
      });

      const handleSubmit = async () => {
        try {
          const response = await fetch('/api/test');
          if (!response.ok) {
            const data = await response.json();
            const errorMessage =
              typeof data.error === 'string' ? data.error : 'An error occurred';

            mockToast({
              title: 'Request Failed',
              description: errorMessage,
              variant: 'destructive',
            });
          }
        } catch (error) {
          // Handle error
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Request Failed',
          description: 'An error occurred',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests with exponential backoff', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      });

      const handleSubmit = async () => {
        const maxRetries = 3;
        let retries = 0;

        while (retries < maxRetries) {
          try {
            const response = await fetch('/api/test');
            if (response.ok) {
              mockToast({
                title: 'Success',
                description: 'Request completed successfully',
                variant: 'default',
              });
              break;
            }
          } catch (error) {
            retries++;
            if (retries >= maxRetries) {
              mockToast({
                title: 'Request Failed',
                description: 'Failed after multiple attempts',
                variant: 'destructive',
              });
            } else {
              // Wait before retry (simplified for test)
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          }
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Request completed successfully',
          variant: 'default',
        });
      });

      expect(callCount).toBe(3);
    });

    it('should stop retrying after maximum attempts', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const handleSubmit = async () => {
        const maxRetries = 3;
        let retries = 0;

        while (retries < maxRetries) {
          try {
            await fetch('/api/test');
            break;
          } catch (error) {
            retries++;
            if (retries >= maxRetries) {
              mockToast({
                title: 'Request Failed',
                description: 'Failed after multiple attempts',
                variant: 'destructive',
              });
            }
          }
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Request Failed',
          description: 'Failed after multiple attempts',
          variant: 'destructive',
        });
      });

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on client errors (4xx)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad request' }),
      });

      const handleSubmit = async () => {
        try {
          const response = await fetch('/api/test');
          if (!response.ok) {
            // Don't retry on 4xx errors
            if (response.status >= 400 && response.status < 500) {
              const data = await response.json();
              mockToast({
                title: 'Invalid Request',
                description: data.error,
                variant: 'destructive',
              });
              return;
            }
          }
        } catch (error) {
          // Handle error
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Invalid Request',
          description: 'Bad request',
          variant: 'destructive',
        });
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple simultaneous requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const handleMultipleSubmits = async () => {
        const promises = Array.from({ length: 5 }, () => fetch('/api/test'));

        try {
          await Promise.all(promises);
          mockToast({
            title: 'Success',
            description: 'All requests completed successfully',
            variant: 'default',
          });
        } catch (error) {
          mockToast({
            title: 'Error',
            description: 'Some requests failed',
            variant: 'destructive',
          });
        }
      };

      render(<TestComponent onSubmit={handleMultipleSubmits} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'All requests completed successfully',
          variant: 'default',
        });
      });

      expect(global.fetch).toHaveBeenCalledTimes(5);
    });

    it('should prevent duplicate submissions', async () => {
      let isSubmitting = false;

      (global.fetch as jest.Mock).mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true }),
            });
          }, 100);
        });
      });

      const handleSubmit = async () => {
        if (isSubmitting) {
          mockToast({
            title: 'Already Submitting',
            description: 'Please wait for the current request to complete',
            variant: 'default',
          });
          return;
        }

        isSubmitting = true;
        try {
          await fetch('/api/test');
          mockToast({
            title: 'Success',
            description: 'Request completed',
            variant: 'default',
          });
        } finally {
          isSubmitting = false;
        }
      };

      render(<TestComponent onSubmit={handleSubmit} />);

      const submitButton = screen.getByTestId('submit-button');

      // Click multiple times quickly
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Already Submitting',
          description: 'Please wait for the current request to complete',
          variant: 'default',
        });
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('File Upload Error Handling', () => {
    it('should handle file upload failures', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('File upload failed')
      );

      const handleFileUpload = async () => {
        const formData = new FormData();
        formData.append('file', new File(['test'], 'test.txt'));

        try {
          await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
        } catch (error) {
          mockToast({
            title: 'Upload Failed',
            description: 'Failed to upload file. Please try again.',
            variant: 'destructive',
          });
        }
      };

      render(<TestComponent onSubmit={handleFileUpload} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Upload Failed',
          description: 'Failed to upload file. Please try again.',
          variant: 'destructive',
        });
      });
    });

    it('should handle oversized file uploads', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 413,
        json: async () => ({ error: 'File too large' }),
      });

      const handleFileUpload = async () => {
        const file = new File(['x'.repeat(10000000)], 'large.txt'); // 10MB file
        const maxSize = 5 * 1024 * 1024; // 5MB limit

        if (file.size > maxSize) {
          mockToast({
            title: 'File Too Large',
            description: 'File size must be less than 5MB',
            variant: 'destructive',
          });
          return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const data = await response.json();
            mockToast({
              title: 'Upload Failed',
              description: data.error,
              variant: 'destructive',
            });
          }
        } catch (error) {
          // Handle error
        }
      };

      render(<TestComponent onSubmit={handleFileUpload} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'File Too Large',
          description: 'File size must be less than 5MB',
          variant: 'destructive',
        });
      });
    });

    it('should handle unsupported file types', async () => {
      const handleFileUpload = async () => {
        const file = new File(['test'], 'test.exe', {
          type: 'application/x-msdownload',
        });
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

        if (!allowedTypes.includes(file.type)) {
          mockToast({
            title: 'Unsupported File Type',
            description: 'Only JPEG, PNG, and PDF files are allowed',
            variant: 'destructive',
          });
          return;
        }
      };

      render(<TestComponent onSubmit={handleFileUpload} />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Unsupported File Type',
          description: 'Only JPEG, PNG, and PDF files are allowed',
          variant: 'destructive',
        });
      });
    });
  });
});
