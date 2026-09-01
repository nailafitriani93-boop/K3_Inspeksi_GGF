"use client";

import { useEffect, useRef, useState } from "react";

export default function SearchSelect({
  label,
  value,
  onChange,
  options = [],
  valueKey,
  labelKey,
  placeholder = "Cari...",
  disabled = false,
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const selected = options.find(
      (x) => String(x[valueKey]) === String(value)
    );
    setQ(selected ? String(selected[labelKey] ?? "") : "");
  }, [value, options, valueKey, labelKey]);

  useEffect(() => {
    const h = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = options.filter((x) =>
    String(x[labelKey] ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="field selectsearch" ref={ref}>
      <label>{label}</label>
      <input
        value={q}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => !disabled && setOpen(true)}
        onChange={(e) => {
          if (disabled) return;
          setQ(e.target.value);
          setOpen(true);
          onChange("");
        }}
      />

      {!disabled && open && (
        <div className="dropdown">
          {filtered.length > 0 ? (
            filtered.slice(0, 80).map((o) => (
              <div
                className="option"
                key={String(o[valueKey])}
                onMouseDown={() => {
                  onChange(o[valueKey]);
                  setQ(String(o[labelKey] ?? ""));
                  setOpen(false);
                }}
              >
                {o[labelKey]}
              </div>
            ))
          ) : (
            <div className="option">Data tidak ditemukan</div>
          )}
        </div>
      )}
    </div>
  );
}
