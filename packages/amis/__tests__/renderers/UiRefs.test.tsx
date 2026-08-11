import React from 'react';
import {cleanup, render} from '@testing-library/react';
import '../../src';
import {InputBox} from 'amis-ui';

afterEach(() => {
  cleanup();
});

test('Components:InputBox exposes root DOM through forwardedRef', () => {
  const inputBoxRef = React.createRef<HTMLDivElement>();

  render(<InputBox forwardedRef={inputBoxRef} value="Input value" />);

  expect(inputBoxRef.current).toBeInTheDocument();
  expect(inputBoxRef.current?.className).toContain('InputBox');
});
