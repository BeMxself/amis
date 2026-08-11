import React = require('react');
import NotFound from '../src/components/404';
import {render, cleanup} from '@testing-library/react';

afterEach(cleanup);

test('Components:404 default View', () => {
  const {container} = render(<NotFound />);

  expect(container.firstChild).toMatchSnapshot();
});

test('Components:404 Custom code & messages', () => {
  const {container} = render(
    <NotFound code={500} description="Internal Error" />
  );

  expect(container.firstChild).toMatchSnapshot();
});
