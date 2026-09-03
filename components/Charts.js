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
  Legend,
  LabelList,
} from "recharts";

/* =========================================================
   STATUS PIE
========================================================= */

export function StatusPie({ data = [] }) {
  const safeData = Array.isArray(data)
    ? data.filter(
        (item) =>
          Number(item?.value || 0) > 0
      )
    : [];

  const total = safeData.reduce(
    (sum, item) =>
      sum + Number(item?.value || 0),
    0
  );

  const COLORS = [
    "#ffbd32",
    "#67bd70",
    "#4b5358",
  ];

  return (
    <div className="pie-chart-wrapper">

      <ResponsiveContainer
        width="100%"
        height="100%"
      >

        <PieChart>

          <Pie
            data={
              safeData.length
                ? safeData
                : [
                    {
                      name: "Tidak Ada Data",
                      value: 1,
                    },
                  ]
            }
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={1}
            stroke="#ffffff"
            strokeWidth={2}
          >

            {(safeData.length
              ? safeData
              : [{ name: "empty", value: 1 }]
            ).map(
              (_, index) => (
                <Cell
                  key={index}
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
              Number(value || 0).toLocaleString(
                "id-ID"
              )
            }
          />

        </PieChart>

      </ResponsiveContainer>

      <div className="pie-center">

        <strong>
          {total.toLocaleString("id-ID")}
        </strong>

        <span>
          Total
        </span>

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
    (item, index) => ({
      ...item,

      bulan:
        item?.bulan ||
        item?.month ||
        item?.nama_bulan ||
        [
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
        ][index] ||
        "-",

      total: Number(
        item?.total ??
        item?.jumlah ??
        0
      ),

      open: Number(
        item?.open ?? 0
      ),

      close: Number(
        item?.close ?? 0
      ),
    })
  );

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
    >

      <BarChart
        data={normalized}
        margin={{
          top: 20,
          right: 12,
          left: -15,
          bottom: 5,
        }}
        barGap={2}
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
        />

        <YAxis
          tick={{
            fontSize: 11,
            fill: "#59615e",
          }}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #dfe7df",
            boxShadow:
              "0 8px 20px rgba(0,0,0,.08)",
          }}
        />

        <Bar
          dataKey="total"
          name="Total"
          fill="#78aeea"
          radius={[
            5,
            5,
            0,
            0,
          ]}
          maxBarSize={16}
        >
          <LabelList
            dataKey="total"
            position="top"
            fill="#2874d4"
            fontSize={11}
          />
        </Bar>

        <Bar
          dataKey="open"
          name="Open"
          fill="#f6b52f"
          radius={[
            5,
            5,
            0,
            0,
          ]}
          maxBarSize={16}
        />

        <Bar
          dataKey="close"
          name="Close"
          fill="#65bd6f"
          radius={[
            5,
            5,
            0,
            0,
          ]}
          maxBarSize={16}
        />

      </BarChart>

    </ResponsiveContainer>
  );
}

/* =========================================================
   WILAYAH BAR
========================================================= */

export function WilayahBar({ data = [] }) {
  const wilayahDefault = [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
  ];

  const safeData = Array.isArray(data)
    ? data
    : [];

  const normalized = wilayahDefault.map(
    (nomor) => {

      const found =
        safeData.find(
          (item) =>
            Number(
              item?.no_wilayah ??
              item?.wilayah ??
              item?.id_wilayah
            ) === nomor
        );

      return {
        wilayah: `Wilayah ${nomor}`,

        total: Number(
          found?.total ??
          found?.jumlah ??
          found?.count ??
          0
        ),

        open: Number(
          found?.open ?? 0
        ),

        close: Number(
          found?.close ?? 0
        ),

        overdue: Number(
          found?.overdue ?? 0
        ),
      };
    }
  );

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
    >

      <BarChart
        data={normalized}
        margin={{
          top: 20,
          right: 10,
          left: -10,
          bottom: 20,
        }}
      >

        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#e9eee9"
        />

        <XAxis
          dataKey="wilayah"
          tick={{
            fontSize: 11,
            fill: "#525b58",
          }}
          axisLine={{
            stroke: "#dfe5e1",
          }}
          tickLine={false}
        />

        <YAxis
          tick={{
            fontSize: 11,
            fill: "#59615e",
          }}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #dfe7df",
            boxShadow:
              "0 8px 20px rgba(0,0,0,.08)",
          }}
        />

        <Bar
          dataKey="total"
          name="Total"
          fill="#a9d9aa"
          radius={[
            6,
            6,
            0,
            0,
          ]}
          maxBarSize={36}
        >

          <LabelList
            dataKey="total"
            position="top"
            fontSize={11}
            fill="#27312c"
          />

        </Bar>

      </BarChart>

    </ResponsiveContainer>
  );
}