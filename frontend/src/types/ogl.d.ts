declare module 'ogl' {
  export class Renderer {
    constructor(options?: { alpha?: boolean; premultipliedAlpha?: boolean });
    gl: WebGLRenderingContext;
    setSize(width: number, height: number): void;
    render(options: { scene: Mesh }): void;
  }

  export class Program {
    constructor(gl: WebGLRenderingContext, options: {
      vertex: string;
      fragment: string;
      uniforms?: Record<string, { value: any }>;
    });
    uniforms: Record<string, { value: any }>;
  }

  export class Mesh {
    constructor(gl: WebGLRenderingContext, options: {
      geometry: Triangle;
      program: Program;
    });
  }

  export class Triangle {
    constructor(gl: WebGLRenderingContext);
  }

  export class Vec3 {
    constructor(x?: number, y?: number, z?: number);
    set(x: number, y: number, z: number): void;
  }
}
