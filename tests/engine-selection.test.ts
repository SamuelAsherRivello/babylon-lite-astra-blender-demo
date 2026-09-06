import { describe, expect, it, vi } from 'vitest';
import { selectEngine } from '../src/engine-selection';

describe('renderer selection', () => {
  const setup = () => {
    const gpu = { dispose: vi.fn(), initAsync: vi.fn(async () => {}) };
    const gl = { dispose: vi.fn() };
    return { gpu, gl, options: {
      supportsWebGPU: async () => true,
      createWebGPU: vi.fn(() => gpu),
      createWebGL: vi.fn(() => gl),
    } };
  };

  it('uses WebGPU when initialization succeeds', async () => {
    const { gpu, options } = setup();
    expect(await selectEngine(options)).toEqual({ engine: gpu, renderer: 'WebGPU' });
    expect(options.createWebGL).not.toHaveBeenCalled();
  });

  it('uses WebGL when WebGPU is unavailable', async () => {
    const { gl, options } = setup();
    options.supportsWebGPU = async () => false;
    expect(await selectEngine(options)).toEqual({ engine: gl, renderer: 'WebGL' });
    expect(options.createWebGPU).not.toHaveBeenCalled();
  });

  it('disposes a failed WebGPU engine before falling back', async () => {
    const { gpu, gl, options } = setup();
    gpu.initAsync.mockRejectedValue(new Error('Adapter unavailable'));
    expect(await selectEngine(options)).toEqual({ engine: gl, renderer: 'WebGL' });
    expect(gpu.dispose).toHaveBeenCalledOnce();
  });

  it('falls back when the support probe rejects', async () => {
    const { gl, options } = setup();
    options.supportsWebGPU = async () => { throw new Error('Probe failed'); };
    expect(await selectEngine(options)).toEqual({ engine: gl, renderer: 'WebGL' });
  });

  it('surfaces a WebGL failure to the startup error handler', async () => {
    const { options } = setup();
    options.supportsWebGPU = async () => false;
    options.createWebGL = vi.fn(() => { throw new Error('No renderer'); });
    await expect(selectEngine(options)).rejects.toThrow('No renderer');
  });
});
