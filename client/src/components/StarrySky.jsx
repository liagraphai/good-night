import { useMemo } from 'react';
import Particles from '@tsparticles/react';

/**
 * StarrySky - 全局繁星背景组件
 * 使用 @tsparticles/react v4 实现漫天星星闪烁 + 流星从右上划向左下
 */
export default function StarrySky() {
  const options = useMemo(() => ({
    fullScreen: { enable: false },
    fpsLimit: 30,
    detectRetina: true,
    particles: {
      number: {
        value: 160,
        density: {
          enable: true,
          area: 600,
        },
      },
      color: {
        value: ['#ffffff', '#dde6ff', '#fff5e6', '#e8e0ff'],
      },
      shape: {
        type: 'circle',
      },
      opacity: {
        value: { min: 0.1, max: 0.9 },
        animation: {
          enable: true,
          speed: 0.6,
          sync: false,
          startValue: 'random',
          destroy: 'none',
        },
      },
      size: {
        value: { min: 0.5, max: 2.5 },
        animation: {
          enable: true,
          speed: 0.3,
          sync: false,
          startValue: 'random',
        },
      },
      move: {
        enable: true,
        speed: 0.05,
        direction: 'none',
        random: true,
        straight: false,
        outModes: {
          default: 'out',
        },
      },
      twinkle: {
        particles: {
          enable: true,
          frequency: 0.03,
          opacity: 1,
          color: {
            value: '#c8d8ff',
          },
        },
      },
    },
    interactivity: {
      events: {
        onHover: { enable: false },
        onClick: { enable: false },
      },
    },
    emitters: [
      {
        // 流星发射器 1 - 从右上方射出
        direction: 'bottom-left',
        position: { x: 90, y: 5 },
        rate: {
          quantity: 1,
          delay: 8,
        },
        size: {
          width: 20,
          height: 5,
        },
        particles: {
          number: { value: 0 },
          color: { value: '#ffffff' },
          shape: { type: 'circle' },
          opacity: {
            value: { min: 0.6, max: 1 },
            animation: {
              enable: true,
              speed: 3,
              sync: false,
              startValue: 'max',
              destroy: 'min',
            },
          },
          size: {
            value: { min: 0.5, max: 1.5 },
          },
          move: {
            enable: true,
            speed: { min: 15, max: 25 },
            direction: 'bottom-left',
            straight: true,
            outModes: { default: 'destroy' },
          },
          life: {
            count: 1,
            duration: {
              value: 0.6,
            },
          },
          trail: {
            enable: true,
            length: 20,
            fill: {
              color: '#141428',
            },
          },
        },
      },
      {
        // 流星发射器 2 - 稍偏左位置
        direction: 'bottom-left',
        position: { x: 60, y: 2 },
        rate: {
          quantity: 1,
          delay: 14,
        },
        size: {
          width: 15,
          height: 5,
        },
        particles: {
          number: { value: 0 },
          color: { value: '#e0e8ff' },
          shape: { type: 'circle' },
          opacity: {
            value: { min: 0.5, max: 0.9 },
            animation: {
              enable: true,
              speed: 2.5,
              sync: false,
              startValue: 'max',
              destroy: 'min',
            },
          },
          size: {
            value: { min: 0.4, max: 1.2 },
          },
          move: {
            enable: true,
            speed: { min: 12, max: 20 },
            direction: 'bottom-left',
            straight: true,
            outModes: { default: 'destroy' },
          },
          life: {
            count: 1,
            duration: {
              value: 0.7,
            },
          },
          trail: {
            enable: true,
            length: 15,
            fill: {
              color: '#141428',
            },
          },
        },
      },
    ],
  }), []);

  return (
    <Particles
      id="starry-sky"
      className="starry-sky"
      options={options}
    />
  );
}
