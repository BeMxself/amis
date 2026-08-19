declare module 'react-player/ReactPlayer' {
  import type React from 'react';

  export function createReactPlayer(
    players: Array<any>,
    playerFallback: any
  ): React.ComponentType<any> & {
    canPlay?: (src: string) => boolean;
    canEnablePIP?: (src: string) => boolean;
  };
}

declare module 'react-player/HtmlPlayer' {
  import type React from 'react';

  const HtmlPlayer: React.ComponentType<any>;
  export default HtmlPlayer;
}

declare module 'react-player/patterns' {
  export const canPlay: {
    dash: (src: string) => boolean;
    html: (src: string) => boolean;
    mux: (src: string) => boolean;
    vimeo: (src: string) => boolean;
    wistia: (src: string) => boolean;
    youtube: (src: string) => boolean;
  };
}

declare module '@mux/mux-player-react' {
  import type React from 'react';

  const MuxPlayer: React.ComponentType<any>;
  export default MuxPlayer;
}
