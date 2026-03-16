import { LoydErrorCode } from "../codes.js";
import type { MessageMap } from "../formatter.js";
export const fr: MessageMap = {
  [LoydErrorCode.REQUIRED]: "Ce champ est obligatoire",
  [LoydErrorCode.STRING_TOO_SHORT]: ({ min, actual }) =>
    `Minimum ${min} caractères (reçu : ${actual})`,
  [LoydErrorCode.STRING_TOO_LONG]: ({ max, actual }) =>
    `Maximum ${max} caractères (reçu : ${actual})`,
  [LoydErrorCode.STRING_INVALID_EMAIL]: "Adresse e-mail invalide",
  [LoydErrorCode.STRING_INVALID_URL]: "URL invalide",
  [LoydErrorCode.NUMBER_NOT_INTEGER]: "Doit être un entier",
  [LoydErrorCode.ARRAY_TOO_SHORT]: ({ min }) => `Minimum ${min} élément(s) requis`,
  [LoydErrorCode.UNION_NO_MATCH]: "La valeur ne correspond à aucun type autorisé",
};
