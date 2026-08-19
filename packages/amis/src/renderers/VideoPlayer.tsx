import React from 'react';

const ReactPlayer = React.lazy(() => import('./VideoReactPlayer'));

export interface VideoPlayerState {
  currentTime: number;
  duration: number;
  ended: boolean;
  hasStarted: boolean;
  muted: boolean;
  paused: boolean;
  playbackRate: number;
  seeking: boolean;
  videoHeight: number;
  videoWidth: number;
  volume: number;
  waiting: boolean;
}

export type VideoPlayerStateListener = (
  state: VideoPlayerState,
  prevState: VideoPlayerState
) => void;

export interface VideoPlayerProps {
  aspectRatio?: 'auto' | '4:3' | '16:9';
  autoPlay?: boolean;
  className?: string;
  isLive?: boolean;
  loop?: boolean;
  muted?: boolean;
  onEnded?: (state: VideoPlayerState) => void;
  onError?: (error: string) => void;
  onPause?: (state: VideoPlayerState) => void;
  onPlay?: (state: VideoPlayerState) => void;
  poster?: string;
  rates?: Array<number>;
  src?: string;
  videoType?: string;
}

function getDefaultPlayerState(): VideoPlayerState {
  return {
    currentTime: 0,
    duration: 0,
    ended: false,
    hasStarted: false,
    muted: false,
    paused: true,
    playbackRate: 1,
    seeking: false,
    videoHeight: 0,
    videoWidth: 0,
    volume: 1,
    waiting: false
  };
}

function getMediaState(media: HTMLMediaElement | null): VideoPlayerState {
  const defaultState = getDefaultPlayerState();

  if (!media) {
    return defaultState;
  }

  return {
    ...defaultState,
    currentTime: media.currentTime || 0,
    duration: Number.isFinite(media.duration) ? media.duration : 0,
    ended: media.ended,
    hasStarted: Boolean(media.currentTime) || !media.paused,
    muted: media.muted,
    paused: media.paused,
    playbackRate: media.playbackRate || 1,
    seeking: media.seeking,
    videoHeight: media instanceof HTMLVideoElement ? media.videoHeight || 0 : 0,
    videoWidth: media instanceof HTMLVideoElement ? media.videoWidth || 0 : 0,
    volume: media.volume,
    waiting: false
  };
}

export function isFlvSource(
  src?: string,
  videoType?: string,
  isLive?: boolean
) {
  return (
    videoType === 'video/x-flv' ||
    Boolean(src && /\.flv(?:$|\?)/.test(src) && isLive)
  );
}

export function isHlsSource(src?: string, videoType?: string) {
  return (
    videoType === 'application/x-mpegURL' ||
    Boolean(src && /\.m3u8(?:$|\?)/.test(src))
  );
}

export function isReactPlayerSource(
  src?: string,
  videoType?: string,
  isLive?: boolean
) {
  if (
    !src ||
    isFlvSource(src, videoType, isLive) ||
    isHlsSource(src, videoType)
  ) {
    return false;
  }

  return /(?:youtu\.be|youtube(?:-nocookie|education)?\.com|vimeo\.com|wistia\.(?:com|net)|wi\.st|stream\.mux\.com|\.mpd(?:$|\?))/i.test(
    src
  );
}

function getAspectRatio(
  aspectRatio: VideoPlayerProps['aspectRatio'],
  playerState: VideoPlayerState
) {
  if (aspectRatio && aspectRatio !== 'auto') {
    return aspectRatio.replace(':', ' / ');
  }

  if (playerState.videoWidth && playerState.videoHeight) {
    return `${playerState.videoWidth} / ${playerState.videoHeight}`;
  }

  return '16 / 9';
}

export default class VideoPlayer extends React.Component<VideoPlayerProps> {
  private hls: any;
  private flvPlayer: any;
  private liveUnloadTimer: ReturnType<typeof setTimeout> | undefined;
  private media: HTMLMediaElement | null = null;
  private playerState = getDefaultPlayerState();
  private streamLoaded = false;
  private stateListeners = new Set<VideoPlayerStateListener>();

  state = {
    playbackRate: 1,
    playerState: this.playerState
  };

  componentDidUpdate(prevProps: VideoPlayerProps) {
    if (
      prevProps.src !== this.props.src ||
      prevProps.videoType !== this.props.videoType ||
      prevProps.isLive !== this.props.isLive
    ) {
      this.destroyStreamingPlayers();
      this.attachStreamingPlayer();
      this.syncPlayerState();
    }
  }

  componentWillUnmount() {
    this.destroyStreamingPlayers();
    this.media = null;
    this.stateListeners.clear();
  }

  play() {
    this.startStreamingLoad();
    const promise = this.media?.play();
    promise?.catch?.(() => undefined);
    this.syncPlayerState();
  }

  pause() {
    this.media?.pause();
    this.stopStreamingLoad();
    this.syncPlayerState();
  }

  seek(time: number) {
    if (!this.media) {
      return;
    }

    this.media.currentTime = Math.max(time, 0);
    this.syncPlayerState();
  }

  subscribeToStateChange(listener: VideoPlayerStateListener) {
    this.stateListeners.add(listener);

    return () => this.stateListeners.delete(listener);
  }

  getState() {
    return this.playerState;
  }

  private setMediaRef = (media: HTMLMediaElement | null) => {
    if (this.media === media) {
      return;
    }

    this.destroyStreamingPlayers();
    this.media = media;

    if (media) {
      media.playbackRate = this.state.playbackRate;
      this.attachStreamingPlayer();
    }

    this.syncPlayerState();
  };

  private syncPlayerState = () => {
    const prevState = this.playerState;
    const nextState = getMediaState(this.media);

    this.playerState = nextState;
    this.setState({playerState: nextState});

    if (nextState !== prevState) {
      this.stateListeners.forEach(listener => listener(nextState, prevState));
    }

    return nextState;
  };

  private handlePlay = () => {
    this.startStreamingLoad();
    this.props.onPlay?.(this.syncPlayerState());
  };

  private handlePause = () => {
    this.stopStreamingLoad();
    this.props.onPause?.(this.syncPlayerState());
  };

  private handleEnded = () => {
    this.props.onEnded?.(this.syncPlayerState());
  };

  private handleWaiting = () => {
    this.updatePartialState({waiting: true});
  };

  private handlePlaying = () => {
    this.updatePartialState({waiting: false});
  };

  private updatePartialState(partialState: Partial<VideoPlayerState>) {
    const prevState = this.playerState;
    const nextState = {
      ...getMediaState(this.media),
      ...partialState
    };

    this.playerState = nextState;
    this.setState({playerState: nextState});
    this.stateListeners.forEach(listener => listener(nextState, prevState));
  }

  private handlePlaybackRateChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const playbackRate = Number(event.target.value);

    if (this.media) {
      this.media.playbackRate = playbackRate;
    }

    this.setState({playbackRate}, this.syncPlayerState);
  };

  private attachStreamingPlayer() {
    const {autoPlay, src, videoType, isLive} = this.props;

    if (!this.media || !src) {
      return;
    }

    if (isFlvSource(src, videoType, isLive)) {
      this.attachFlvPlayer();
      return;
    }

    if (isHlsSource(src, videoType)) {
      this.attachHlsPlayer();
      return;
    }

    if (autoPlay) {
      setTimeout(() => this.play(), 200);
    }
  }

  private attachFlvPlayer() {
    const {autoPlay, isLive, src} = this.props;

    import('mpegts.js').then((mpegts: any) => {
      if (!this.media || !src) {
        return;
      }

      this.flvPlayer = mpegts.createPlayer({type: 'flv', url: src, isLive});
      this.flvPlayer.attachMediaElement(this.media);
      this.flvPlayer.on(mpegts.Events.RECOVERED_EARLY_EOF, () => {
        this.props.onError?.('直播已经结束');
      });
      this.flvPlayer.on(mpegts.Events.ERROR, () => {
        this.props.onError?.('视频加载失败');
        this.flvPlayer?.unload();
      });

      if (autoPlay) {
        setTimeout(() => this.play(), 200);
      }
    });
  }

  private attachHlsPlayer() {
    const {autoPlay, src} = this.props;

    import('hls.js').then(({default: Hls}: any) => {
      if (!this.media || !src || !Hls.isSupported()) {
        return;
      }

      this.hls = new Hls({autoStartLoad: false});
      this.hls.attachMedia(this.media);
      this.hls.loadSource(src);

      if (autoPlay) {
        setTimeout(() => this.play(), 200);
      }
    });
  }

  private startStreamingLoad() {
    clearTimeout(this.liveUnloadTimer);
    this.hls?.startLoad();

    if (this.flvPlayer) {
      if (!this.streamLoaded) {
        this.streamLoaded = true;
        this.flvPlayer.load();
      }

      this.flvPlayer.play();
    }
  }

  private stopStreamingLoad() {
    const {isLive, src, videoType} = this.props;

    clearTimeout(this.liveUnloadTimer);
    this.liveUnloadTimer = undefined;
    this.hls?.stopLoad();

    if (this.flvPlayer && isLive) {
      this.flvPlayer.pause?.();
      this.liveUnloadTimer = setTimeout(() => {
        this.seek(0);
        this.flvPlayer?.unload();
        this.streamLoaded = false;
      }, 30000);
    }

    if (isHlsSource(src, videoType)) {
      this.hls?.stopLoad();
    }
  }

  private destroyStreamingPlayers() {
    clearTimeout(this.liveUnloadTimer);
    this.liveUnloadTimer = undefined;

    if (this.hls) {
      this.hls.stopLoad();
      this.hls.detachMedia();
      this.hls.destroy?.();
      this.hls = null;
    }

    if (this.flvPlayer) {
      this.flvPlayer.destroy();
      this.flvPlayer = null;
      this.streamLoaded = false;
      this.props.onError?.('');
    }
  }

  private renderPlaybackRateControl() {
    const {rates} = this.props;

    if (!rates?.length) {
      return null;
    }

    return (
      <label className="prismui-Video-playbackRate">
        <span className="prismui-Video-playbackRateLabel">倍速</span>
        <select
          aria-label="Playback Rate"
          onChange={this.handlePlaybackRateChange}
          value={this.state.playbackRate}
        >
          {rates.map(rate => (
            <option key={rate} value={rate}>
              {rate}x
            </option>
          ))}
        </select>
      </label>
    );
  }

  private renderNativeVideoPlayer() {
    const {autoPlay, loop, muted, poster, src} = this.props;

    return (
      <video
        autoPlay={autoPlay}
        className="prismui-Video-media"
        controls
        loop={loop}
        muted={muted}
        onDurationChange={this.syncPlayerState}
        onEnded={this.handleEnded}
        onError={() => this.props.onError?.('视频加载失败')}
        onLoadedData={this.syncPlayerState}
        onLoadedMetadata={this.syncPlayerState}
        onPause={this.handlePause}
        onPlay={this.handlePlay}
        onPlaying={this.handlePlaying}
        onRateChange={this.syncPlayerState}
        onSeeked={this.syncPlayerState}
        onSeeking={this.syncPlayerState}
        onTimeUpdate={this.syncPlayerState}
        onVolumeChange={this.syncPlayerState}
        onWaiting={this.handleWaiting}
        poster={poster}
        preload="auto"
        ref={this.setMediaRef}
        src={src}
      />
    );
  }

  private renderMediaPlaceholder() {
    return <div className="prismui-Video-media" />;
  }

  private renderReactPlayer() {
    const {autoPlay, loop, muted, poster, src} = this.props;

    return (
      <React.Suspense fallback={this.renderMediaPlaceholder()}>
        <ReactPlayer
          autoPlay={autoPlay}
          className="prismui-Video-media"
          controls
          height="100%"
          loop={loop}
          muted={muted}
          onDurationChange={this.syncPlayerState as any}
          onEnded={this.handleEnded as any}
          onError={() => this.props.onError?.('视频加载失败')}
          onLoadedData={this.syncPlayerState as any}
          onLoadedMetadata={this.syncPlayerState as any}
          onPause={this.handlePause as any}
          onPlay={this.handlePlay as any}
          onPlaying={this.handlePlaying as any}
          onRateChange={this.syncPlayerState as any}
          onSeeked={this.syncPlayerState as any}
          onSeeking={this.syncPlayerState as any}
          onTimeUpdate={this.syncPlayerState as any}
          onVolumeChange={this.syncPlayerState as any}
          onWaiting={this.handleWaiting as any}
          playbackRate={this.state.playbackRate}
          playsInline
          poster={poster}
          preload="auto"
          ref={this.setMediaRef as any}
          src={src}
          width="100%"
        />
      </React.Suspense>
    );
  }

  render() {
    const {aspectRatio, className, isLive, src, videoType} = this.props;
    const useReactPlayer = isReactPlayerSource(src, videoType, isLive);

    return (
      <div className={className}>
        <div
          className="prismui-Video-mediaWrap"
          style={{
            aspectRatio: getAspectRatio(aspectRatio, this.state.playerState)
          }}
        >
          {useReactPlayer
            ? this.renderReactPlayer()
            : this.renderNativeVideoPlayer()}
        </div>
        {this.renderPlaybackRateControl()}
      </div>
    );
  }
}
