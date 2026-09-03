const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

/*
=========================================================
DATA KABAG
=========================================================
*/

const KABAG = [
  "Himawan",
  "Fathurrahman Aziz Munawir",
  "Bambang Haryadi",
  "Mulyadi E",
  "Randha Kentama Arwaditha",
  "Boma Ananto",
  "Abdul Haris Siregar",
  "Yudha Imanda",
  "Sandi Fantea",
  "Maryono",
  "Hadi Rahman",
  "Aldivar Cahyo Santoso",
  "Rizky Arfian Ramadhan",
  "Andhi Tarmuji",
  "Rezsa Radhian Rotasta"
];

/*
=========================================================
DATA KASIE
=========================================================
*/

const KASIE = [
  "Agra Kuasa Julian",
  "Ribut Hari Sutopo",
  "Suroto",
  "Nanda Catur Pamungkas",
  "Miftahudin",
  "Muhamad Sanusi",
  "Purwanto",
  "Junianto",
  "Waluyo",
  "Aris Suhartanto",
  "Mohamad Subiyantoro",
  "Mustarom",
  "Sawiji",
  "Supar",
  "Suwito",
  "Arief Yuli",
  "Entis Sutisna",
  "Nirwati",
  "Aditya Widianto",
  "Rizky Sanjaya",
  "Sutanto",
  "Budi Afandi",
  "Ridho Ernando",
  "Tata Hasta Bima",
  "Angga Aji Pratama",
  "Lukito",
  "Reza Zahara Abdul Aziz",
  "Agus Haryadi",
  "Kisno Susilo",
  "Mohamad Farid Fauzi",
  "Edi Sujarot",
  "Junaidi",
  "Vicky Saputra",
  "Amanda Handoko",
  "Wisnu Afani",
  "Yuyus Supriyatna",
  "Robbyana Purwiridzanto",
  "Sarma Firtogu",
  "Sugianto",
  "Handoko Waskito",
  "Iqbal Deby Suprapman",
  "Sunarto"
];

/*
=========================================================
BUAT USERNAME
=========================================================
*/

function buatUsername(nama, role) {
  const base = nama
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

  return `${base}.${role.toLowerCase()}`;
}

/*
=========================================================
BUAT PASSWORD AWAL
=========================================================
*/

function buatPassword(nama) {
  const namaPertama = nama
    .trim()
    .split(/\s+/)[0]
    .replace(/[^a-zA-Z0-9]/g, "");

  return `K3@${namaPertama}#2026`;
}

/*
=========================================================
MAIN
=========================================================
*/

async function main() {
  const users = [
    ...KABAG.map((nama_lengkap) => ({
      nama_lengkap,
      role: "KABAG"
    })),

    ...KASIE.map((nama_lengkap) => ({
      nama_lengkap,
      role: "KASIE"
    }))
  ];

  console.log("");
  console.log("==============================================");
  console.log("MEMBUAT USER K3");
  console.log("==============================================");
  console.log("");

  let berhasil = 0;

  for (const user of users) {
    const username = buatUsername(
      user.nama_lengkap,
      user.role
    );

    const passwordAwal = buatPassword(
      user.nama_lengkap
    );

    const passwordHash = await bcrypt.hash(
      passwordAwal,
      10
    );

    await prisma.users.upsert({
      where: {
        username
      },

      update: {
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        password: passwordHash,
        aktif: true
      },

      create: {
        username,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        password: passwordHash,
        aktif: true
      }
    });

    berhasil++;

    console.log(
      `${user.role} | ${user.nama_lengkap} | ${username}`
    );
  }

  console.log("");
  console.log("==============================================");
  console.log("SELESAI");
  console.log("==============================================");
  console.log(`Total user : ${berhasil}`);
  console.log("==============================================");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("==============================================");
    console.error("GAGAL MEMBUAT USER");
    console.error("==============================================");
    console.error(error);
    console.error("");

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });