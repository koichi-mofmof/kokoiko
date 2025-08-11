import { z } from "zod";

export const autocompleteSchema = z.object({
  query: z.string().min(1, "validation.maps.query.required"),
  sessionToken: z.string().uuid("validation.maps.sessionToken.invalid"),
  languageCode: z.string().optional().default("ja"),
  regionCode: z.string().optional().default("JP"),
});

export const placeDetailsSchema = z.object({
  placeId: z.string().min(1, "validation.maps.placeId.required"),
  sessionToken: z.string().uuid("validation.maps.sessionToken.invalid"),
  languageCode: z.string().optional().default("ja"),
  regionCode: z.string().optional().default("JP"),
});
