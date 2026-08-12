import {fireEvent, render, screen} from '@testing-library/react';
import {render as amisRender} from '../../src';
import {makeEnv} from '../helper';

test('Renderer:video', () => {
  const {container} = render(
    amisRender(
      {
        type: 'video',
        src: '${url}',
        rates: [1, 1.5, 2]
      },
      {
        data: {
          url: 'https://example.com/video.mp4'
        }
      },
      makeEnv({})
    )
  );

  const video = container.querySelector('video.amis-Video-media');
  expect(video).toBeTruthy();
  expect(video?.getAttribute('src')).toBe('https://example.com/video.mp4');
  expect(video?.hasAttribute('controls')).toBe(true);
  expect(screen.getByLabelText('Playback Rate')).toBeTruthy();
});

test('Renderer:video frame jump uses media element', () => {
  const play = jest
    .spyOn(window.HTMLMediaElement.prototype, 'play')
    .mockResolvedValue(undefined);

  const {container} = render(
    amisRender(
      {
        type: 'video',
        src: 'https://example.com/video.mp4',
        frames: {
          '00:10': ''
        }
      },
      {},
      makeEnv({})
    )
  );

  fireEvent.click(container.querySelector('.amis-Video-frame')!);

  expect(play).toHaveBeenCalled();
  play.mockRestore();
});
