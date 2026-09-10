"use client";

import { useEffect, useRef, useState } from "react";

export default function SearchSelect({
  label = "",
  value = "",
  onChange,
  options = [],
  valueKey,
  labelKey,
  placeholder = "Cari Wilayah...",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedItem = options.find(
    (item) => String(item[valueKey]) === String(value)
  );

  const selectedLabel = selectedItem
    ? selectedItem[labelKey]
    : "";

  const filteredOptions = options.filter((item) => {
    const text = String(
      item?.[labelKey] ?? ""
    ).toLowerCase();

    return text.includes(
      keyword.toLowerCase()
    );
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
        setKeyword("");
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  function handleOpen() {
    if (disabled) return;

    setOpen(true);
    setKeyword("");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  function handleSelect(item) {
    onChange(String(item[valueKey]));

    setKeyword("");
    setOpen(false);
  }

  function handleClear(e) {
    e.stopPropagation();

    onChange("");

    setKeyword("");
    setOpen(false);
  }

  return (
    <div
      className={`search-select-wrapper ${
        disabled ? "is-disabled" : ""
      }`}
      ref={wrapperRef}
    >
      {label && (
        <label className="search-select-label">
          {label}
        </label>
      )}

      <div
        className={`search-select-control ${
          open ? "is-open" : ""
        }`}
        onClick={handleOpen}
      >
        <input
          ref={inputRef}
          type="text"
          value={
            open
              ? keyword
              : selectedLabel
          }
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            setKeyword(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
            }
          }}
          autoComplete="off"
        />

        {value && !disabled ? (
          <button
            type="button"
            className="search-select-clear"
            onClick={handleClear}
            aria-label="Hapus pilihan"
          >
            ×
          </button>
        ) : null}

        <span
          className={`search-select-arrow ${
            open ? "open" : ""
          }`}
        />
      </div>

      {open && !disabled && (
        <div className="search-select-dropdown">
          {filteredOptions.length > 0 ? (
            <div className="search-select-list">
              {filteredOptions.map((item) => {
                const isSelected =
                  String(item[valueKey]) ===
                  String(value);

                return (
                  <button
                    key={item[valueKey]}
                    type="button"
                    className={`search-select-option ${
                      isSelected
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      handleSelect(item)
                    }
                  >
                    {item[labelKey]}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="search-select-empty">
              Data tidak ditemukan
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .search-select-wrapper {
          position: relative;
          width: 100%;
          min-width: 0;
          z-index: 1;
        }

        .search-select-wrapper:focus-within {
          z-index: 50;
        }

        .search-select-label {
          display: block;
          margin-bottom: 7px;
          color: #34443a;
          font-size: 12px;
          font-weight: 700;
        }

        .search-select-control {
          position: relative;
          width: 100%;
          cursor: text;
        }

        .search-select-control input {
          width: 100%;
          height: 42px;
          padding: 10px 78px 10px 13px;

          border: 1px solid #dce5de;
          border-radius: 11px;

          outline: none;

          background: #ffffff;
          color: #17231a;

          font-size: 13px;

          transition:
            border-color 0.16s ease,
            box-shadow 0.16s ease;
        }

        .search-select-control input:focus,
        .search-select-control.is-open input {
          border-color: rgba(7, 148, 71, 0.65);

          box-shadow:
            0 0 0 3px
            rgba(7, 148, 71, 0.09);
        }

        .search-select-control input::placeholder {
          color: #87928b;
        }

        .search-select-arrow {
          position: absolute;

          top: 50%;
          right: 16px;

          width: 9px;
          height: 9px;

          border-right: 1.8px solid #6f7f74;
          border-bottom: 1.8px solid #6f7f74;

          transform:
            translateY(-65%)
            rotate(45deg);

          pointer-events: none;

          transition:
            transform 0.2s ease,
            border-color 0.2s ease;
        }

        .search-select-control.is-open
        .search-select-arrow,
        .search-select-arrow.open {
          transform:
            translateY(-35%)
            rotate(225deg);

          border-color: #08783d;
        }

        .search-select-clear {
          position: absolute;

          top: 50%;
          right: 40px;

          transform: translateY(-50%);

          width: 20px;
          height: 20px;

          padding: 0;

          border: 0;
          border-radius: 50%;

          background: #edf2ee;
          color: #607066;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 16px;
          line-height: 1;

          cursor: pointer;

          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        .search-select-clear:hover {
          background: #dfe8e1;
          color: #17231a;
        }

        .search-select-dropdown {
          position: absolute;

          top: calc(100% + 6px);
          left: 0;
          right: 0;

          width: 100%;
          max-height: 260px;

          overflow: hidden;

          border: 1px solid #d8e3db;
          border-radius: 12px;

          background: #ffffff;

          box-shadow:
            0 12px 28px
            rgba(20, 45, 29, 0.14);

          z-index: 9999;

          animation:
            dropdownIn
            0.15s ease-out;
        }

        .search-select-list {
          width: 100%;
          max-height: 260px;

          overflow-y: auto;
          overflow-x: hidden;

          padding: 5px;
        }

        .search-select-list::-webkit-scrollbar {
          width: 7px;
        }

        .search-select-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .search-select-list::-webkit-scrollbar-thumb {
          background: #c8d5cc;
          border-radius: 999px;
        }

        .search-select-list::-webkit-scrollbar-thumb:hover {
          background: #aebfb3;
        }

        .search-select-option {
          display: block;

          width: 100%;

          padding: 10px 12px;

          border: 0;
          border-radius: 8px;

          background: transparent;

          color: #25352b;

          text-align: left;

          font-size: 13px;
          line-height: 1.4;

          cursor: pointer;

          transition:
            background 0.14s ease,
            color 0.14s ease;
        }

        .search-select-option:hover {
          background: #edf8f1;
          color: #08783d;
        }

        .search-select-option.selected {
          background: #e4f4e9;
          color: #08783d;
          font-weight: 700;
        }

        .search-select-empty {
          padding: 18px 14px;

          text-align: center;

          color: #87928b;

          font-size: 12px;
        }

        .is-disabled {
          opacity: 0.65;
        }

        .is-disabled .search-select-control {
          cursor: not-allowed;
        }

        .is-disabled input {
          cursor: not-allowed;
          background: #f5f7f5;
        }

        @keyframes dropdownIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .search-select-dropdown {
            max-height: 220px;
          }

          .search-select-list {
            max-height: 220px;
          }

          .search-select-option {
            padding: 11px 12px;
          }
        }

        @media (max-width: 480px) {
          .search-select-control input {
            height: 44px;
            font-size: 14px;
          }

          .search-select-dropdown {
            max-height: 200px;
          }

          .search-select-list {
            max-height: 200px;
          }
        }
      `}</style>
    </div>
  );
}