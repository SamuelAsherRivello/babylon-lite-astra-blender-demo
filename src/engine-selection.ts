interface Disposable { dispose(): void }
interface Initializable extends Disposable { initAsync(): Promise<unknown> }

export async function selectEngine<T extends Disposable, U extends Initializable>(options: {
  supportsWebGPU(): Promise<boolean>;
  createWebGPU(): U;
  createWebGL(): T;
}): Promise<{ engine: T | U; renderer: 'WebGPU' | 'WebGL' }> {
  let gpu: U | undefined;
  try {
    if (await options.supportsWebGPU()) {
      gpu = options.createWebGPU();
      await gpu.initAsync();
      return { engine: gpu, renderer: 'WebGPU' };
    }
  } catch {
    gpu?.dispose();
  }
  return { engine: options.createWebGL(), renderer: 'WebGL' };
}
