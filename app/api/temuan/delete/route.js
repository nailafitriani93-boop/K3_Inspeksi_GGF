import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(request) {
    try {
        const body = await request.json();

        const idTemuan = body?.id_temuan;

        if (!idTemuan) {
            return NextResponse.json(
                {
                    success: false,
                    error: "ID temuan wajib diisi.",
                },
                {
                    status: 400,
                }
            );
        }

        const id = BigInt(String(idTemuan));

        // Pastikan data memang ada
        const existing = await prisma.temuan_k3.findUnique({
            where: {
                id_temuan: id,
            },
        });

        if (!existing) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Data temuan tidak ditemukan.",
                },
                {
                    status: 404,
                }
            );
        }

        // Hapus data temuan
        await prisma.temuan_k3.delete({
            where: {
                id_temuan: id,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Data temuan berhasil dihapus.",
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.error(
            "ERROR DELETE TEMUAN:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error?.message ||
                    "Gagal menghapus data temuan.",
            },
            {
                status: 500,
            }
        );
    }
}