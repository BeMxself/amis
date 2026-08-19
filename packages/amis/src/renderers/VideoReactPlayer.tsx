import React from 'react';
import {createReactPlayer} from 'react-player/ReactPlayer';
import HtmlPlayer from 'react-player/HtmlPlayer';
import {canPlay} from 'react-player/patterns';

type PlayerEntry = {
  key: string;
  name: string;
  canPlay: (src: string) => boolean;
  canEnablePIP?: () => boolean;
  player?:
    | React.ComponentType<any>
    | React.LazyExoticComponent<React.ComponentType<any>>;
};

const selectedPlayers: PlayerEntry[] = [
  {
    key: 'dash',
    name: 'dash.js',
    canPlay: canPlay.dash,
    canEnablePIP: () => true,
    player: React.lazy(() => import('dash-video-element/react'))
  },
  {
    key: 'mux',
    name: 'Mux',
    canPlay: canPlay.mux,
    canEnablePIP: () => true,
    player: React.lazy(() => import('@mux/mux-player-react'))
  },
  {
    key: 'youtube',
    name: 'YouTube',
    canPlay: canPlay.youtube,
    player: React.lazy(() => import('youtube-video-element/react'))
  },
  {
    key: 'vimeo',
    name: 'Vimeo',
    canPlay: canPlay.vimeo,
    player: React.lazy(() => import('vimeo-video-element/react'))
  },
  {
    key: 'wistia',
    name: 'Wistia',
    canPlay: canPlay.wistia,
    canEnablePIP: () => true,
    player: React.lazy(() => import('wistia-video-element/react'))
  }
];

const htmlFallback: PlayerEntry = {
  key: 'html',
  name: 'html',
  canPlay: canPlay.html,
  canEnablePIP: () => true,
  player: HtmlPlayer
};

export default createReactPlayer(selectedPlayers, htmlFallback);
