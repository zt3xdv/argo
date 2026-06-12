import { useEffect, useState, useRef } from 'preact/hooks';
import { hexToRgb } from '../utils/utils.js';

export default function Icon({ src, color, style }) {
  const [imageSrc, setImageSrc] = useState(src);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    img.src = src;

    img.onload = () => {
      const size = 128;
      canvas.width = size;
      canvas.height = size;

      const SCALE = 1.20; 
      const scaledSize = size * SCALE;
      const offset = (size - scaledSize) / 2;

      ctx.drawImage(img, offset, offset, scaledSize, scaledSize);

      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const lightness = (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3;
        pixels.data[i + 3] = lightness < 64 ? 0 : 255;
      }
      ctx.putImageData(pixels, 0, 0);

      if (color) {
        const rgb = hexToRgb(color);
        if (rgb) {
          const [r, g, b] = rgb;
          const recolor = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < recolor.data.length; i += 4) {
            if (recolor.data[i + 3] > 0) {
              recolor.data[i] = r;
              recolor.data[i + 1] = g;
              recolor.data[i + 2] = b;
            }
          }
          ctx.putImageData(recolor, 0, 0);
        }
      }

      setImageSrc(canvas.toDataURL());
    };
  }, [src, color]);

  if (!imageSrc) return null;

  return (
    <img
      src={imageSrc}
      alt="Icon"
      style={{
        ...style,
        verticalAlign: 'middle'
      }}
    />
  );
}
