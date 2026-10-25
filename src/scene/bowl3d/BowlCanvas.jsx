import { useEffect, useRef } from 'react';
import { createBowlScene } from './create-scene.js';

/** 将已有骰点与动画状态画到透明画布；失败时交还静态红金碗。 */
export default function BowlCanvas({ onReady, ...state }) {
  const canvas = useRef(null);
  const current = useRef(state);
  const requestRender = useRef(() => {});
  current.current = state;

  useEffect(() => {
    const element = canvas.current;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let scene;
    let frame = 0;
    let failed = false;

    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const fail = error => {
      if (failed) return;
      failed = true;
      stop();
      onReady(false);
      // 保留具体原因供设备兼容性排查；玩家仍可通过静态骰碗完成游戏。
      console.warn('3D 骰碗不可用，已切换静态呈现。', error);
      scene?.dispose();
      scene = null;
    };
    const draw = now => {
      frame = 0;
      if (!scene || failed || document.hidden) return;
      try {
        const moving = scene.render(current.current, now, media.matches);
        onReady(true);
        if (moving) frame = requestAnimationFrame(draw);
      } catch (error) { fail(error); }
    };
    const request = () => {
      if (!frame && scene && !failed && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      if (!scene || failed) return;
      const { width, height } = element.getBoundingClientRect();
      if (width > 0 && height > 0) {
        scene.resize(width, height);
        request();
      }
    };
    const contextLost = event => { event.preventDefault(); fail('WebGL context lost'); };
    const visibility = () => { if (document.hidden) stop(); else request(); };
    const observer = new ResizeObserver(resize);
    element.addEventListener('webglcontextlost', contextLost);
    media.addEventListener('change', request);
    document.addEventListener('visibilitychange', visibility);
    requestRender.current = request;
    try {
      scene = createBowlScene(element);
      observer.observe(element);
      resize();
    } catch (error) { fail(error); }

    return () => {
      stop(); observer.disconnect();
      element.removeEventListener('webglcontextlost', contextLost);
      media.removeEventListener('change', request);
      document.removeEventListener('visibilitychange', visibility);
      requestRender.current = () => {};
      scene?.dispose();
    };
  }, [onReady]);

  useEffect(() => { requestRender.current(); }, [state.dice, state.rolling, state.rollingIndices, state.changedIndices, state.changing, state.revealing]);

  return <canvas ref={canvas} className="bowl3d-canvas" aria-hidden="true" />;
}
