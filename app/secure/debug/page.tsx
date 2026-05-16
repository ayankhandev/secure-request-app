import { redirect } from "next/navigation";

export default function SecureDebugRedirect() {
  redirect("/");
}
