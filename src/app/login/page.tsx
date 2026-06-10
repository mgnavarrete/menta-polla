import { BRAND } from "@/lib/brand";
import LoginForm from "./LoginForm";

// Server component: lee la marca del entorno y se la pasa al formulario.
export default function LoginPage() {
  return <LoginForm brand={BRAND} />;
}
