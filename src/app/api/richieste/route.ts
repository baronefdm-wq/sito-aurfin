import { quoteSchema } from "@/lib/schemas";
import { emailRequestReceived } from "@/lib/server/client-emails";
import { quoteEvent } from "@/lib/server/notify-events";
import { handlePublicSubmission } from "@/lib/server/public-endpoint";
import { createQuoteRequest } from "@/lib/server/repository";
import { isStorageConfigured } from "@/lib/server/storage";
import { createUploadToken } from "@/lib/server/upload-token";

export async function POST(request: Request) {
  return handlePublicSubmission(request, {
    name: "preventivo",
    schema: quoteSchema,
    save: (data) => {
      const r = createQuoteRequest(data);
      return {
        reference: r.reference,
        // Token per allegare i documenti subito dopo l'invio (30 minuti, solo questa richiesta).
        extra: { uploadToken: isStorageConfigured() ? createUploadToken(r.id) : null },
        notify: quoteEvent(r),
        afterSave: () => emailRequestReceived(r),
      };
    },
  });
}
