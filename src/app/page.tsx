
import { getServerSession } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession();
  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/sign-in");
  }
}
