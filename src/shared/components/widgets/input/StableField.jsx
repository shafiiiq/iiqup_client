import { useRef, useEffect } from 'react';

function StableField({ as = 'input', value, onChange, ...rest }) {
  const ref = useRef(null);
  const lastEmitted = useRef(value ?? '');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const v = value ?? '';
    if (v !== lastEmitted.current) {
      el.value = v;
      lastEmitted.current = v;
    }
  }, [value]);

  const handleChange = (e) => {
    onChange?.(e);
    lastEmitted.current = e.target.value;
  };

  const Tag = as;
  return <Tag ref={ref} defaultValue={value ?? ''} onChange={handleChange} {...rest} />;
}

export const StableInput = (props) => <StableField as="input" {...props} />;
export const StableTextarea = (props) => <StableField as="textarea" {...props} />;

export default StableField;