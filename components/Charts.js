"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";

/* =========================================================
   HELPER
========================================================= */

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function getMonthName(index) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  return months[index] || "-";
}

/* =========================================================
   NORMALIZE NAMA WILAYAH
========================================================= */

function normalizeWilayahName(value) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return "";
  }

  const name = String(value).trim();

  if (name.toLowerCase() === "bengkel") {
    return "Bengkel";
  }

  if (name.toLowerCase() === "dipping") {
    return "Dipping";
  }

  if (name.toLowerCase() === "mixing") {
    return "Mixing";
  }

  /*
    Mixer sengaja TIDAK dimasukkan.
    Kategori Mixer akan dibuang pada
    proses filter Temuan Per Wilayah.
  */

  const wilayahMatch = name.match(
    /^wilayah\s*(\d+)$/i
  );

  if (wilayahMatch) {
    return `Wilayah ${wilayahMatch[1]}`;
  }

  return name;
}

/* =========================================================
   STATUS PIE
========================================================= */

export function StatusPie({ data = [] }) {
  const safeData = Array.isArray(data)
    ? data
        .map((item) => ({
          ...item,

          name:
            item?.name ||
            item?.label ||
            item?.status ||
            "-",

          value: toNumber(
            item?.value ??
              item?.jumlah ??
              item?.total ??
              0
          ),
        }))
        .filter(
          (item) => item.value > 0
        )
    : [];

  const total = safeData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const COLORS = [
    "#ffbd32",
    "#67bd70",
    "#4b5358",
  ];

  const chartData = safeData.length
    ? safeData
    : [
        {
          name: "Tidak Ada Data",
          value: 1,
        },
      ];

  return (
    <div
      className="pie-chart-wrapper"
      style={{
        width: "100%",
        height: "280px",
        minHeight: "280px",
        position: "relative",
      }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
      >
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="78%"
            paddingAngle={1}
            stroke="#ffffff"
            strokeWidth={2}
          >
            {chartData.map(
              (item, index) => (
                <Cell
                  key={`${item.name}-${index}`}
                  fill={
                    safeData.length
                      ? COLORS[
                          index %
                            COLORS.length
                        ]
                      : "#e5e9e5"
                  }
                />
              )
            )}
          </Pie>

          <Tooltip
            formatter={(value) =>
              toNumber(value).toLocaleString(
                "id-ID"
              )
            }
          />
        </PieChart>
      </ResponsiveContainer>

      <div
        className="pie-center"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform:
            "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          textAlign: "center",
        }}
      >
        <strong>
          {total.toLocaleString("id-ID")}
        </strong>

        <span>Total</span>
      </div>
    </div>
  );
}

/* =========================================================
   CUSTOM TOOLTIP MONTHLY
========================================================= */

function MonthlyTooltip({
  active,
  payload,
}) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  const row =
    payload[0]?.payload || {};

  const bulan =
    row?.bulan ||
    row?.month ||
    row?.nama_bulan ||
    row?.nama_bulan_short ||
    "-";

  const total = toNumber(
    row?.total ??
      row?.jumlah ??
      row?.jumlah_temuan ??
      row?.count ??
      0
  );

  const open = toNumber(
    row?.open ??
      row?.jumlah_open ??
      row?.open_07_hari ??
      0
  );

  const close = toNumber(
    row?.close ??
      row?.jumlah_close ??
      0
  );

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 10,
        border:
          "1px solid #dfe7df",
        boxShadow:
          "0 8px 20px rgba(0,0,0,.08)",
        padding: "12px 14px",
        minWidth: "145px",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#222222",
          marginBottom: 8,
        }}
      >
        {bulan}
      </div>

      <div
        style={{
          fontSize: 14,
          color: "#4b8fe8",
          marginBottom: 5,
        }}
      >
        Total :{" "}
        {total.toLocaleString("id-ID")}
      </div>

      <div
        style={{
          fontSize: 14,
          color: "#f6a51b",
          marginBottom: 5,
        }}
      >
        Open :{" "}
        {open.toLocaleString("id-ID")}
      </div>

      <div
        style={{
          fontSize: 14,
          color: "#65bd6f",
        }}
      >
        Close :{" "}
        {close.toLocaleString("id-ID")}
      </div>
    </div>
  );
}

/* =========================================================
   MONTHLY BAR
========================================================= */

export function MonthlyBar({ data = [] }) {
  const safeData = Array.isArray(data)
    ? data
    : [];

  const normalized = safeData.map(
    (item, index) => {
      const total = toNumber(
        item?.total ??
          item?.jumlah ??
          item?.jumlah_temuan ??
          item?.count ??
          0
      );

      const open = toNumber(
        item?.open ??
          item?.jumlah_open ??
          item?.open_07_hari ??
          0
      );

      const close = toNumber(
        item?.close ??
          item?.jumlah_close ??
          0
      );

      /*
        =====================================================
        LABEL TOTAL MONTHLY

        Kalau Open > 0:
        Total ditampilkan di atas batang Open.

        Kalau Open = 0 dan Close > 0:
        Total ditampilkan di atas batang Close.

        Kalau keduanya 0:
        Tidak ada label.
      =====================================================
      */

      const labelOpen =
        open > 0 && total > 0
          ? total
          : null;

      const labelClose =
        open <= 0 &&
        close > 0 &&
        total > 0
          ? total
          : null;

      return {
        ...item,

        bulan:
          item?.bulan ||
          item?.month ||
          item?.nama_bulan ||
          item?.nama_bulan_short ||
          getMonthName(index),

        total,

        open,

        close,

        /*
          Field khusus untuk label.
          Tidak memengaruhi data batang.
        */
        labelOpen,

        labelClose,
      };
    }
  );

  const chartData =
    normalized.length > 0
      ? normalized
      : Array.from(
          { length: 12 },
          (_, index) => ({
            bulan:
              getMonthName(index),

            total: 0,

            open: 0,

            close: 0,

            labelOpen: null,

            labelClose: null,
          })
        );

  return (
    <div
      style={{
        width: "100%",
        height: "320px",
        minHeight: "320px",
      }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
      >
        <BarChart
          data={chartData}
          margin={{
            top: 30,
            right: 15,
            left: 0,
            bottom: 10,
          }}
          barGap={0}
          barCategoryGap="28%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e9eee9"
          />

          <XAxis
            dataKey="bulan"
            tick={{
              fontSize: 12,
              fill: "#525b58",
            }}
            axisLine={{
              stroke: "#dfe5e1",
            }}
            tickLine={false}
            interval={0}
          />

          <YAxis
            allowDecimals={false}
            tick={{
              fontSize: 11,
              fill: "#59615e",
            }}
            axisLine={false}
            tickLine={false}
            width={35}
          />

          <Tooltip
            content={
              <MonthlyTooltip />
            }
            cursor={false}
          />

          {/* =================================================
              CLOSE - HIJAU
              BAGIAN BAWAH BAR

              TOTAL AKAN MUNCUL DI SINI
              HANYA JIKA OPEN = 0.
          ================================================= */}

          <Bar
            dataKey="close"
            name="Close"
            stackId="monthly"
            fill="#65bd6f"
            radius={[
              0,
              0,
              0,
              0,
            ]}
            maxBarSize={65}
          >
            <LabelList
              dataKey="labelClose"
              position="top"
              fill="#222222"
              fontSize={11}
              fontWeight={600}
              offset={6}
            />
          </Bar>

          {/* =================================================
              OPEN - ORANGE
              BAGIAN ATAS BAR

              TOTAL AKAN MUNCUL DI SINI
              JIKA OPEN > 0.

              POSISINYA TEPAT DI ATAS
              BATANG ORANGE.
          ================================================= */}

          <Bar
            dataKey="open"
            name="Open"
            stackId="monthly"
            fill="#f6b52f"
            radius={[
              5,
              5,
              0,
              0,
            ]}
            maxBarSize={65}
          >
            <LabelList
              dataKey="labelOpen"
              position="top"
              fill="#222222"
              fontSize={11}
              fontWeight={600}
              offset={6}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =========================================================
   WILAYAH BAR
========================================================= */

export function WilayahBar({ data = [] }) {
  const safeData = Array.isArray(data)
    ? data
    : [];

  /* =========================================================
     URUTAN WILAYAH
  ========================================================= */

  const defaultWilayah = [
    "Wilayah 1",
    "Wilayah 2",
    "Wilayah 3",
    "Wilayah 4",
    "Wilayah 5",
    "Wilayah 6",
    "Wilayah 7",
    "Bengkel",
    "Mixing",
    "Dipping",
  ];

  /* =========================================================
     VALIDASI KATEGORI
  ========================================================= */

  const allowedKeys = new Set(
    defaultWilayah.map(
      (nama) =>
        nama.toLowerCase()
    )
  );

  /* =========================================================
     NORMALISASI DATA
  ========================================================= */

  const normalizedMap = new Map();

  safeData.forEach(
    (item, index) => {
      const rawName =
        item?.nama_wilayah ||
        item?.nama ||
        item?.label ||
        item?.wilayah ||
        (
          item?.no_wilayah !== undefined &&
          item?.no_wilayah !== null
            ? `Wilayah ${item.no_wilayah}`
            : `Wilayah ${index + 1}`
        );

      const wilayahName =
        normalizeWilayahName(rawName);

      if (!wilayahName) {
        return;
      }

      const key =
        wilayahName
          .trim()
          .toLowerCase();

      /*
        Mixer tidak ditampilkan
      */

      if (!allowedKeys.has(key)) {
        return;
      }

      const total =
        toNumber(
          item?.total ??
            item?.jumlah ??
            item?.jumlah_temuan ??
            item?.count ??
            0
        );

      const open =
        toNumber(
          item?.open ??
            item?.jumlah_open ??
            item?.open_07_hari ??
            item?.open_0_7_hari ??
            0
        );

      const close =
        toNumber(
          item?.close ??
            item?.jumlah_close ??
            0
        );

      if (!normalizedMap.has(key)) {
        normalizedMap.set(
          key,
          {
            ...item,
            wilayah: wilayahName,
            total,
            open,
            close,
          }
        );
      } else {
        const existing =
          normalizedMap.get(key);

        existing.total += total;

        existing.open += open;

        existing.close += close;
      }
    }
  );

  /* =========================================================
     PASTIKAN SELURUH WILAYAH SELALU TAMPIL
  ========================================================= */

  const chartData =
    defaultWilayah.map(
      (nama) => {
        const existing =
          normalizedMap.get(
            nama.toLowerCase()
          );

        if (existing) {
          return {
            ...existing,

            /*
              =================================================
              LABEL TOTAL WILAYAH

              OPEN > 0
              ----------------
              Total ditempatkan pada batang Open.

              OPEN = 0 dan CLOSE > 0
              ----------------
              Total ditempatkan pada batang Close.

              Keduanya 0
              ----------------
              Tidak ada label.
            =================================================
            */

            labelOpen:
              existing.open > 0 &&
              existing.total > 0
                ? existing.total
                : null,

            labelClose:
              existing.open <= 0 &&
              existing.close > 0 &&
              existing.total > 0
                ? existing.total
                : null,
          };
        }

        return {
          wilayah: nama,

          total: 0,

          open: 0,

          close: 0,

          labelOpen: null,

          labelClose: null,
        };
      }
    );

  /* =========================================================
     TOOLTIP
  ========================================================= */

  function WilayahTooltip({
    active,
    payload,
  }) {
    if (
      !active ||
      !payload ||
      payload.length === 0
    ) {
      return null;
    }

    const row =
      payload[0]?.payload || {};

    const wilayah =
      row?.wilayah ||
      row?.nama_wilayah ||
      row?.nama ||
      row?.label ||
      "-";

    const total =
      toNumber(
        row?.total ??
          row?.jumlah ??
          row?.jumlah_temuan ??
          row?.count ??
          0
      );

    const open =
      toNumber(
        row?.open ??
          row?.jumlah_open ??
          row?.open_07_hari ??
          row?.open_0_7_hari ??
          0
      );

    const close =
      toNumber(
        row?.close ??
          row?.jumlah_close ??
          0
      );

    return (
      <div
        style={{
          background: "#ffffff",
          borderRadius: 10,
          border:
            "1px solid #dfe7df",
          boxShadow:
            "0 8px 20px rgba(0,0,0,.08)",
          padding: "12px 14px",
          minWidth: "135px",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#222222",
            marginBottom: 8,
          }}
        >
          {wilayah}
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#4b8fe8",
            marginBottom: 5,
          }}
        >
          Total :{" "}
          {total.toLocaleString(
            "id-ID"
          )}
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#f6a51b",
            marginBottom: 5,
          }}
        >
          Open :{" "}
          {open.toLocaleString(
            "id-ID"
          )}
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#65bd6f",
          }}
        >
          Close :{" "}
          {close.toLocaleString(
            "id-ID"
          )}
        </div>
      </div>
    );
  }

  /* =========================================================
     CHART
  ========================================================= */

  return (
    <div
      style={{
        width: "100%",
        height: "320px",
        minHeight: "320px",
        border: "none",
        outline: "none",
      }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
      >
        <BarChart
          data={chartData}
          margin={{
            top: 28,
            right: 18,
            left: 0,
            bottom: 48,
          }}
          barGap={0}
          barCategoryGap="25%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8e3"
          />

          <XAxis
            dataKey="wilayah"
            tick={{
              fontSize: 10,
              fill: "#525b58",
            }}
            axisLine={{
              stroke: "#dfe5e1",
            }}
            tickLine={false}
            interval={0}
            angle={-32}
            textAnchor="end"
            height={58}
          />

          <YAxis
            allowDecimals={false}
            tick={{
              fontSize: 11,
              fill: "#59615e",
            }}
            axisLine={false}
            tickLine={false}
            width={35}
          />

          <Tooltip
            content={
              <WilayahTooltip />
            }
            cursor={false}
          />

          {/* =============================================
              CLOSE
              HIJAU

              Kalau Close saja:
              TOTAL MUNCUL TEPAT DI ATAS
              BATANG HIJAU.
          ============================================= */}

          <Bar
            dataKey="close"
            name="Close"
            stackId="wilayah"
            fill="#4f9e60"
            radius={[
              0,
              0,
              0,
              0,
            ]}
            maxBarSize={34}
          >
            <LabelList
              dataKey="labelClose"
              position="top"
              fill="#222222"
              fontSize={10}
              fontWeight={600}
              offset={6}
            />
          </Bar>

          {/* =============================================
              OPEN
              ORANGE

              Kalau Open ada:
              TOTAL MUNCUL TEPAT DI ATAS
              BATANG ORANGE.

              Kalau Close + Open:
              TOTAL TETAP DI PALING ATAS.
          ============================================= */}

          <Bar
            dataKey="open"
            name="Open"
            stackId="wilayah"
            fill="#f6b52f"
            radius={[
              5,
              5,
              0,
              0,
            ]}
            maxBarSize={34}
          >
            <LabelList
              dataKey="labelOpen"
              position="top"
              fill="#222222"
              fontSize={10}
              fontWeight={600}
              offset={6}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}