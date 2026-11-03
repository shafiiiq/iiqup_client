import { useEffect, useState } from 'react';
import { checkWebGLSupport } from '@/features/core/device/compatibility.device';

export const useWebGLSupport = () => {
    const [supportsWebGL, setSupportsWebGL] = useState(false);

    useEffect(() => {
        setSupportsWebGL(checkWebGLSupport());
    }, []);

    return supportsWebGL;
};