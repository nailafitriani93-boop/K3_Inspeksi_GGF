import { prisma } from "@/lib/db";
export async function GET(){ const rows=await prisma.$queryRawUnsafe(`SELECT * FROM public.master_mandor ORDER BY 1`); return Response.json(rows); }