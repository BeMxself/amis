import {render} from '@testing-library/react';
import {render as amisRender} from '../../src';
import {makeEnv} from '../helper';

function normalizeVideoControlText(container: HTMLElement) {
  container.querySelectorAll('.video-react-control-text').forEach(element => {
    element.textContent = element.textContent?.trimEnd() || '';
  });
}

test('Renderer:alert', () => {
  const {container} = render(
    amisRender(
      {
        type: 'video',
        src: '${url}'
      },
      {
        data: {
          url: 'https://example.com/video.mp4'
        }
      },
      makeEnv({})
    )
  );

  normalizeVideoControlText(container);
  expect(container).toMatchSnapshot();
});
