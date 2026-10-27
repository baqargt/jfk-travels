import { apiRequest } from "@/api/client";

interface UploadTicket { id: string; uploadUrl: string; requiredContentType: string }

export async function uploadPrivateFile(file: File): Promise<string> {
  const ticket = await apiRequest<UploadTicket>("/files/upload-url", {
    method: "POST",
    body: { originalName: file.name, contentType: file.type, sizeBytes: file.size },
  });
  const upload = await fetch(ticket.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": ticket.requiredContentType },
    body: file,
  });
  if (!upload.ok) throw new Error("Document could not be uploaded to private storage.");
  await apiRequest(`/files/${ticket.id}/complete`, { method: "POST" });
  return ticket.id;
}
