import type { MessageMap } from "../formatter.js";
import { LoydErrorCode } from "../codes.js";

export const fr: MessageMap = {
  [LoydErrorCode.REQUIRED]:              "Ce champ est obligatoire",
  [LoydErrorCode.INVALID_TYPE]:          ({ expected, received }) => `Type attendu : ${expected}, reçu : ${received}`,
  [LoydErrorCode.STRING_TOO_SHORT]:      ({ min, actual }) => `Minimum ${min} caractères (reçu : ${actual})`,
  [LoydErrorCode.STRING_TOO_LONG]:       ({ max, actual }) => `Maximum ${max} caractères (reçu : ${actual})`,
  [LoydErrorCode.STRING_INVALID_EMAIL]:  "Adresse e-mail invalide",
  [LoydErrorCode.STRING_INVALID_URL]:    "URL invalide",
  [LoydErrorCode.STRING_INVALID_UUID]:   "UUID invalide",
  [LoydErrorCode.STRING_INVALID_REGEX]:  "Format invalide",
  [LoydErrorCode.NUMBER_TOO_SMALL]:      ({ min, inclusive }) => `Doit être ${inclusive ? ">=" : ">"} ${min}`,
  [LoydErrorCode.NUMBER_TOO_LARGE]:      ({ max, inclusive }) => `Doit être ${inclusive ? "<=" : "<"} ${max}`,
  [LoydErrorCode.NUMBER_NOT_INTEGER]:    "Doit être un entier",
  [LoydErrorCode.NUMBER_NOT_POSITIVE]:   "Doit être un nombre positif",
  [LoydErrorCode.NUMBER_NAN]:            "Valeur numérique invalide",
  [LoydErrorCode.ARRAY_TOO_SHORT]:       ({ min }) => `Minimum ${min} élément(s) requis`,
  [LoydErrorCode.ARRAY_TOO_LONG]:        ({ max }) => `Maximum ${max} élément(s) autorisés`,
  [LoydErrorCode.UNION_NO_MATCH]:        "La valeur ne correspond à aucun type autorisé",
};
