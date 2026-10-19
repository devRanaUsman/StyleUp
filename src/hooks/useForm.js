import { useCallback, useState } from "react";
import { validate } from "../utils/validation";

/** Tiny form hook: values, touched, errors (inline), submit guard. Never clears user data on failure. */
export function useForm(initial, schema) {
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const set = useCallback((name, value) => {
    setValues((v) => { const next = { ...v, [name]: value }; if (touched[name]) setErrors(validate(next, schema)); return next; });
  }, [schema, touched]);
  const onChange = (e) => set(e.target.name, e.target.type === "checkbox" ? e.target.checked : e.target.value);
  const onBlur = (e) => { const n = e.target.name; setTouched((t) => ({ ...t, [n]: true })); setErrors(validate(values, schema)); };
  const field = (name) => ({ name, value: values[name] ?? "", onChange, onBlur });
  const error = (name) => (touched[name] ? errors[name] : "");

  const validateAll = useCallback(({ focus = true, scope } = {}) => {
    const errs = validate(values, schema);
    setErrors(errs);
    setTouched(Object.fromEntries(Object.keys(schema).map((k) => [k, true])));
    setFormError("");
    const ok = Object.keys(errs).length === 0;
    if (!ok && focus) {
      requestAnimationFrame(() => {
        const root = scope?.current || scope || document;
        root.querySelector?.('[aria-invalid="true"]')?.focus();
      });
    }
    return ok;
  }, [schema, values]);

  const handleSubmit = (fn) => async (e) => {
    e?.preventDefault?.();
    if (!validateAll()) return;
    setSubmitting(true);
    try { await fn(values); } catch (err) { setFormError(err.message || "Something went wrong. Please try again."); } finally { setSubmitting(false); }
  };
  return { values, set, setValues, field, error, errors, touched, submitting, formError, setFormError, handleSubmit, validateAll, valid: !Object.keys(validate(values, schema)).length };
}
