import React from 'react';
import {act, render, waitFor, within} from '@testing-library/react';
import Toast, {toast} from '../src/components/Toast';

test('keeps one toast instance active across multiple roots', async () => {
  const props = {
    position: 'top-right' as const,
    closeButton: false,
    timeout: 10000,
    errorTimeout: 10000
  };
  const first = render(<Toast {...props} />);
  const second = render(<Toast {...props} />);

  act(() => toast.success('First root'));
  await waitFor(() =>
    expect(within(first.container).getByText('First root')).toBeInTheDocument()
  );
  expect(
    within(second.container).queryByText('First root')
  ).not.toBeInTheDocument();

  first.unmount();
  act(() => toast.success('Second root'));
  await waitFor(() =>
    expect(within(second.container).getByText('Second root')).toBeInTheDocument()
  );

  second.unmount();
});
