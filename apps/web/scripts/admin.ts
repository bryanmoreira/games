// Promove (ou tira) admin pelo e-mail: bun run admin <email> [--remove]
import { prisma } from "@/lib/db";

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();
const remove = args.includes("--remove");

if (!email) {
  console.error("Uso: bun run admin <email> [--remove]");
  process.exit(1);
}

const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
if (!user) {
  console.error(`Nenhuma conta com o e-mail ${email}. A pessoa precisa entrar no site uma vez antes.`);
  process.exit(1);
}

await prisma.user.update({ where: { id: user.id }, data: { role: remove ? "user" : "admin" } });
console.log(remove ? `${user.name} (${email}) não é mais admin.` : `${user.name} (${email}) agora é admin.`);
await prisma.$disconnect();
