export const checkWebGLSupport = () => {
  try {
    const canvas = document.createElement('canvas');

    // Try WebGL2 first (Spline's primary requirement)
    const gl2 = canvas.getContext('webgl2');
    if (gl2) {
      if (gl2.isContextLost()) return false;

      const rendererStr = (gl2.getParameter(gl2.RENDERER) || '').toLowerCase();
      if (
        rendererStr.includes('swiftshader') ||
        rendererStr.includes('llvmpipe') ||
        rendererStr.includes('softpipe')
      ) return false;

      // Actually test the context works — catches BindToCurrentSequence failures
      // A broken context will throw or lose itself after this
      try {
        const shader = gl2.createShader(gl2.VERTEX_SHADER);
        if (!shader) return false;
        gl2.shaderSource(shader, 'void main(){}');
        gl2.compileShader(shader);
        gl2.deleteShader(shader);
        if (gl2.isContextLost()) return false;
      } catch {
        return false;
      }

      return true;
    }

    // WebGL2 not available — try WebGL1 with required extensions
    const canvas2 = document.createElement('canvas');
    const gl = canvas2.getContext('webgl') || canvas2.getContext('experimental-webgl');
    if (!gl) return false;
    if (gl.isContextLost()) return false;

    const hasDrawBuffers = !!gl.getExtension('WEBGL_draw_buffers');
    const hasDepthTexture = !!gl.getExtension('WEBGL_depth_texture');
    const hasFloatTextures = !!gl.getExtension('OES_texture_float');

    return hasDrawBuffers && hasDepthTexture && hasFloatTextures;

  } catch (e) {
    return false;
  }
};