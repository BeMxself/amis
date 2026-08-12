/**
 * @file video
 * @author fex
 */

import React from 'react';
import VideoPlayer, {VideoPlayerState} from './VideoPlayer';
import {
  autobind,
  getPropValue,
  getStableClassSelector,
  padArr
} from 'amis-core';
import {Renderer, RendererProps} from 'amis-core';
import {resolveVariable} from 'amis-core';
import {filter} from 'amis-core';
import {CustomStyle, setThemeClassName} from 'amis-core';
import {AMISClassName, SchemaUrlPath} from '../Schema';
import {AMISSchemaBase} from 'amis-core';

/**
 * 视频播放器组件，用于播放视频内容。支持封面、自动播放、倍速、弹幕等配置。
 */
export interface AMISVideoSchema extends AMISSchemaBase {
  /**
   * 指定为 video 组件
   */
  type: 'video';

  /**
   * 是否自动播放视频
   */
  autoPlay?: boolean;

  /**
   * 切帧显示时每行显示的帧数
   */
  columnsCount?: number;

  /**
   * 切帧配置
   */
  frames?: {
    [propName: string]: string;
  };

  /**
   * 帧列表容器CSS类名
   */
  framesClassName?: AMISClassName;

  /**
   * 自定义样式
   */
  style?: {
    [propName: string]: any;
  };

  /**
   * 是否为实时视频流
   */
  isLive?: boolean;

  /**
   * 点击帧画面时是否跳转到视频对应时间点
   * @default true
   */
  jumpFrame?: boolean;

  /**
   * 是否初始静音
   */
  muted?: boolean;

  /**
   * 是否循环播放
   */
  loop?: boolean;

  /**
   * 播放器容器CSS类名
   */
  playerClassName?: AMISClassName;

  /**
   * 视频封面图片地址
   */
  poster?: SchemaUrlPath;

  /**
   * 是否将视频和封面分开显示
   */
  splitPoster?: boolean;

  /**
   * 视频播放地址
   */
  src?: SchemaUrlPath;

  /**
   * 视频类型如： video/x-flv
   */
  videoType?: string;

  /**
   * 视频比率
   */
  aspectRatio?: 'auto' | '4:3' | '16:9';

  /**
   * 视频速率
   */
  rates?: Array<number>;

  /**
   * 跳转到帧时，往前多少秒。
   */
  jumpBufferDuration?: number;

  /**
   * 默认播放的时候到了下一帧会继续播放，同时高亮下一帧。
   * 如果配置这个则会停止播放，等待用户选择新的区间再播放。
   */
  stopOnNextFrame?: boolean;
}

const str2seconds: (str: string) => number = str =>
  str.indexOf(':')
    ? str
        .split(':')
        .reverse()
        .reduce(
          (seconds, value, index) =>
            seconds + (parseInt(value, 10) || 0) * Math.pow(60, index),
          0
        )
    : parseInt(str, 10);

export interface VideoProps
  extends RendererProps,
    Omit<AMISVideoSchema, 'className'> {
  columnsCount: number;
}

export interface VideoState {
  posterInfo?: any;
  videoState?: any;
  error?: string;
}

export default class Video extends React.Component<VideoProps, VideoState> {
  static defaultProps = {
    columnsCount: 8,
    isLive: false,
    jumpFrame: true,
    aspectRatio: 'auto'
  };

  frameDom: any;
  cursorDom: any;
  player: any;
  unsubscribePlayer?: () => void;
  times: Array<number>;
  currentIndex: number;
  manualJump = false;
  constructor(props: VideoProps) {
    super(props);

    this.state = {
      posterInfo: null,
      videoState: {}
    };

    this.frameRef = this.frameRef.bind(this);
    this.cursorRef = this.cursorRef.bind(this);
    this.playerRef = this.playerRef.bind(this);
    this.onImageLoaded = this.onImageLoaded.bind(this);
    this.onClick = this.onClick.bind(this);
    this.setError = this.setError.bind(this);
  }

  componentWillUnmount() {
    this.unsubscribePlayer?.();
  }

  getSrc() {
    const {data} = this.props;
    const source =
      filter(this.props.src, data, '| raw') || getPropValue(this.props);

    return filter(source, data, '| raw');
  }

  getVideoEventData(videoState?: Partial<VideoPlayerState>) {
    const state =
      videoState || this.player?.getState?.() || this.state.videoState;

    return {
      currentTime: state?.currentTime || 0,
      duration: state?.duration || 0,
      src: this.getSrc()
    };
  }

  @autobind
  async handleVideoPlay(videoState?: VideoPlayerState) {
    const {dispatchEvent} = this.props;
    const {currentTime, duration, src} = this.getVideoEventData(videoState);
    const renderEvent = await dispatchEvent('play', {
      currentTime,
      duration,
      src
    });
    if (renderEvent?.prevented) {
      return;
    }
  }
  @autobind
  async handleVideoPause(videoState?: VideoPlayerState) {
    const {dispatchEvent} = this.props;
    const {currentTime, duration, src} = this.getVideoEventData(videoState);
    const renderEvent = await dispatchEvent('pause', {
      currentTime,
      duration,
      src
    });
    if (renderEvent?.prevented) {
      return;
    }
  }
  @autobind
  async handleVideoEnded(videoState?: VideoPlayerState) {
    const {dispatchEvent} = this.props;
    const {duration, src} = this.getVideoEventData(videoState);
    const renderEvent = await dispatchEvent('ended', {
      duration,
      src
    });
    if (renderEvent?.prevented) {
      return;
    }
  }
  onImageLoaded(e: Event) {
    let image: any = new Image();
    image.onload = () => {
      this.setState({
        posterInfo: {
          width: image.width,
          height: image.height
        }
      });
      image = image.onload = null;
    };
    image.src = (e.target as HTMLElement).getAttribute('src');
  }

  frameRef(dom: any) {
    this.frameDom = dom;
  }

  cursorRef(dom: any) {
    this.cursorDom = dom;
  }

  playerRef(player: any) {
    this.unsubscribePlayer?.();
    this.unsubscribePlayer = undefined;
    this.player = player;

    if (!player) {
      return;
    }

    this.unsubscribePlayer = player.subscribeToStateChange((state: any) => {
      this.setState({
        videoState: state
      });

      // if (!state.paused) {
      //   if (
      //     currentPlaying &&
      //     currentPlaying.video &&
      //     currentPlaying !== player
      //   ) {
      //     currentPlaying.pause();
      //   }

      //   currentPlaying = player;
      // }

      if (!this.frameDom || !this.times) {
        return;
      }

      const jumpBufferDuration = this.props.jumpBufferDuration || 0;
      let index = 0;
      const times = this.times;
      const len = times.length;
      const stopOnNextFrame = this.props.stopOnNextFrame;
      while (index < len - 1) {
        if (
          times[index + 1] &&
          state.currentTime < times[index + 1] - jumpBufferDuration
        ) {
          break;
        }

        index++;
      }

      if (this.currentIndex !== index) {
        this.moveCursorToIndex(index);

        stopOnNextFrame && !this.manualJump && player.pause();

        if (this.manualJump) {
          this.manualJump = false;
        }
      }
    });
  }

  moveCursorToIndex(index: number) {
    const {classnames: cx} = this.props;
    if (!this.frameDom || !this.cursorDom) {
      return;
    }
    const items = this.frameDom.querySelectorAll(
      getStableClassSelector(cx, 'Video-frame')
    );

    if (items && items.length && items[index]) {
      this.currentIndex = index;
      const item = items[index];
      const frameRect = this.frameDom.getBoundingClientRect();
      const rect = item.getBoundingClientRect();
      this.cursorDom.setAttribute(
        'style',
        `width: ${rect.width - 4}px; height: ${rect.height - 4}px; left: ${
          rect.left + 2 - frameRect.left
        }px; top: ${rect.top + 2 - frameRect.top}px;`
      );
    }
  }

  jumpToIndex(index: number) {
    if (!this.times || !this.player || !this.props.jumpFrame) {
      return;
    }
    const jumpBufferDuration = this.props.jumpBufferDuration || 0;
    const times = this.times;
    const player = this.player;

    this.manualJump = true;
    player.seek(times[index] - jumpBufferDuration);
    player.play();
  }

  onClick(e: Event) {
    // 避免把所在 form 给提交了。
    e.preventDefault();
  }

  setError(error?: string) {
    const player = this.player;

    this.setState({
      error: error
    });

    player?.pause();
  }

  renderFrames() {
    let {
      frames,
      framesClassName,
      columnsCount,
      data,
      jumpFrame,
      classPrefix: ns,
      classnames: cx
    } = this.props;

    if (typeof frames === 'string' && frames[0] === '$') {
      frames = resolveVariable(frames, data);
    }

    if (!frames) {
      return null;
    }

    const items: Array<object> = [];
    const times: Array<number> = (this.times = []);
    Object.keys(frames).forEach(time => {
      times.push(str2seconds(time));

      items.push({
        time: time,
        src: frames![time]
      });
    });

    if (!items.length) {
      return null;
    }

    return (
      <div
        className={cx(`pos-rlt Video-frameList`, framesClassName)}
        ref={this.frameRef}
      >
        {padArr(items, columnsCount).map((items, i) => {
          let restCount = (columnsCount as number) - items.length;
          let blankArray = [];

          while (restCount--) {
            blankArray.push('');
          }

          return (
            <div className="pull-in-xs" key={i}>
              <div className={cx(`Hbox Video-frameItem`)}>
                {items.map((item, key) => (
                  <div
                    className={cx(`Hbox-col Wrapper--xs Video-frame`)}
                    key={key}
                    onClick={() =>
                      this.jumpToIndex(i * (columnsCount as number) + key)
                    }
                  >
                    {item.src ? (
                      <img className="w-full" alt="poster" src={item.src} />
                    ) : null}
                    <div className={cx(`Video-frameLabel`)}>{item.time}</div>
                  </div>
                ))}

                {
                  /* 补充空白 */ restCount
                    ? blankArray.map((_, index) => (
                        <div
                          className={cx(`Hbox-col Wrapper--xs`)}
                          key={`blank_${index}`}
                        />
                      ))
                    : null
                }
              </div>
            </div>
          );
        })}
        {jumpFrame ? (
          <span ref={this.cursorRef} className={cx('Video-cursor')} />
        ) : null}
      </div>
    );
  }

  renderPlayer() {
    let {
      poster,
      autoPlay,
      muted,
      name,
      data,
      loop,
      isLive,
      minVideoDuration,
      videoType,
      playerClassName,
      classPrefix: ns,
      aspectRatio,
      rates,
      classnames: cx
    } = this.props;

    const videoState = this.state.videoState;
    let highlight =
      videoState.duration &&
      minVideoDuration &&
      videoState.duration < minVideoDuration;
    let src = this.getSrc();
    const error = this.state.error;

    return (
      <div className={cx('Video-player', playerClassName)}>
        <VideoPlayer
          ref={this.playerRef}
          poster={filter(poster, data, '| raw')}
          src={src}
          autoPlay={autoPlay}
          muted={muted}
          onPlay={this.handleVideoPlay}
          onPause={this.handleVideoPause}
          onEnded={this.handleVideoEnded}
          onError={this.setError}
          aspectRatio={aspectRatio}
          isLive={isLive}
          loop={loop}
          rates={rates}
          videoType={videoType}
        />

        {error ? <div className={cx('Video-error')}>{error}</div> : null}
        {highlight ? (
          <p className={`m-t-xs ${ns}Text--danger`}>
            视频时长小于 {minVideoDuration} 秒
          </p>
        ) : null}
      </div>
    );
  }

  renderPosterAndPlayer() {
    let {poster, data, locals, minPosterDimension, classnames: cx} = this.props;
    const posterInfo = this.state.posterInfo || {};
    let dimensionClassName = '';

    if (
      posterInfo &&
      minPosterDimension &&
      (minPosterDimension.width || minPosterDimension.height) &&
      (minPosterDimension.width > posterInfo.width ||
        minPosterDimension.height > posterInfo.height)
    ) {
      dimensionClassName = `Text--danger`;
    }

    return (
      <div className="pull-in-xs">
        <div className={cx('Hbox')}>
          <div className={cx('Hbox-col')}>
            <div className={cx('Wrapper Wrapper--xs')}>
              <img
                onLoad={this.onImageLoaded as any}
                className="w-full"
                alt="poster"
                src={filter(poster, data, '| raw')}
              />
              <p className="m-t-xs">
                封面{' '}
                <span className={dimensionClassName}>
                  {posterInfo.width || '-'} x {posterInfo.height || '-'}
                </span>
                {dimensionClassName ? (
                  <span>
                    {' '}
                    封面尺寸小于{' '}
                    <span className={cx('Text--danger')}>
                      {minPosterDimension.width || '-'} x{' '}
                      {minPosterDimension.height || '-'}
                    </span>
                  </span>
                ) : null}
              </p>
            </div>
          </div>
          <div className={cx('Hbox-col')}>
            <div className={cx('Wrapper Wrapper--xs')}>
              {this.renderPlayer()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    let {
      splitPoster,
      className,
      style,
      classPrefix: ns,
      classnames: cx,
      themeCss,
      id,
      wrapperCustomStyle
    } = this.props;

    return (
      <>
        <div
          className={cx(
            `Video`,
            className,
            setThemeClassName({
              ...this.props,
              name: 'baseControlClassName',
              themeCss,
              id
            })
          )}
          onClick={this.onClick as any}
          style={style}
        >
          {this.renderFrames()}
          {splitPoster ? this.renderPosterAndPlayer() : this.renderPlayer()}
        </div>
        <CustomStyle
          {...this.props}
          config={{
            wrapperCustomStyle,
            id,
            themeCss,
            classNames: [{key: 'baseControlClassName'}]
          }}
        ></CustomStyle>
      </>
    );
  }
}

@Renderer({
  type: 'video'
})
export class VideoRenderer extends Video {}
