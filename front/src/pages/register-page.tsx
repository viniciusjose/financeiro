import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { ResponsiveDateField } from "@/components/ui/responsive-date-field";
import { appendRedirect, getSafeRedirect } from "@/lib/redirect";
import { toast } from "@/lib/toast";
import { useAuth } from "@/providers/auth-provider";
import { type RegisterInput, registerSchema } from "@/schemas/auth.schema";

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      name: "",
      birthDate: "",
      password: "",
    },
  });

  const onSubmit = async (values: RegisterInput) => {
    try {
      await registerUser(values);
      toast.success("Conta criada com sucesso.");
      navigate(getSafeRedirect(searchParams), { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível criar a conta.";
      toast.error(message);
      form.setValue("password", "");
    }
  };

  return (
    <AuthLayout
      title="Criar sua conta"
      description="Comece a organizar suas finanças em minutos."
      footer={{
        question: "Já tem uma conta?",
        linkText: "Entrar",
        href: appendRedirect("/login", redirectParam),
      }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Nome</FormLabel>
                <FormControl>
                  <Input type="text" autoComplete="name" placeholder="Seu nome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Data de nascimento</FormLabel>
                <FormControl>
                  <ResponsiveDateField
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione a data"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>E-mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="voce@empresa.com.br"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Senha</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
            {form.formState.isSubmitting ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
