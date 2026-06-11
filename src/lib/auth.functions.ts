import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CheckEmailInput = z.object({ email: z.string().email() });

export const checkEmailExists = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CheckEmailInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: exists, error } = await supabaseAdmin.rpc("check_email_exists", {
      check_email: data.email,
    });
    if (error) {
      console.error("[checkEmailExists] RPC error:", error);
      throw new Error("No se pudo verificar el email");
    }
    return { exists: !!exists };
  });
